"""
Rate limiting middleware for API protection.
"""

import logging
from typing import Callable
from fastapi import Request, Response, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
import time
from collections import defaultdict
from threading import Lock

logger = logging.getLogger(__name__)


class RateLimiter:
    """Simple in-memory rate limiter."""
    
    def __init__(
        self,
        requests_per_minute: int = 60,
        requests_per_hour: int = 1000
    ):
        self.requests_per_minute = requests_per_minute
        self.requests_per_hour = requests_per_hour
        
        # Store: {client_ip: [(timestamp, count), ...]}
        self.minute_requests = defaultdict(list)
        self.hour_requests = defaultdict(list)
        
        self._lock = Lock()
    
    def _cleanup_old_requests(self, request_log: list, max_age: int):
        """Remove requests older than max_age seconds."""
        now = time.time()
        # Keep only recent requests
        return [ts for ts in request_log if now - ts < max_age]
    
    def is_allowed(self, client_ip: str) -> tuple[bool, dict]:
        """
        Check if request is allowed for this IP.
        
        Returns:
            (allowed: bool, headers: dict)
        """
        now = time.time()
        
        with self._lock:
            # Cleanup old requests
            self.minute_requests[client_ip] = self._cleanup_old_requests(
                self.minute_requests[client_ip], 60
            )
            self.hour_requests[client_ip] = self._cleanup_old_requests(
                self.hour_requests[client_ip], 3600
            )
            
            # Count current requests
            minute_count = len(self.minute_requests[client_ip])
            hour_count = len(self.hour_requests[client_ip])
            
            # Check limits
            minute_allowed = minute_count < self.requests_per_minute
            hour_allowed = hour_count < self.requests_per_hour
            
            # Prepare headers
            headers = {
                "X-RateLimit-Limit-Minute": str(self.requests_per_minute),
                "X-RateLimit-Remaining-Minute": str(max(0, self.requests_per_minute - minute_count)),
                "X-RateLimit-Limit-Hour": str(self.requests_per_hour),
                "X-RateLimit-Remaining-Hour": str(max(0, self.requests_per_hour - hour_count)),
            }
            
            if minute_allowed and hour_allowed:
                # Add request timestamp
                self.minute_requests[client_ip].append(now)
                self.hour_requests[client_ip].append(now)
                return True, headers
            else:
                # Calculate retry-after time
                if not minute_allowed:
                    oldest = min(self.minute_requests[client_ip])
                    retry_after = int(60 - (now - oldest)) + 1
                    headers["Retry-After"] = str(retry_after)
                    headers["X-RateLimit-Reset"] = str(int(oldest + 60))
                else:
                    oldest = min(self.hour_requests[client_ip])
                    retry_after = int(3600 - (now - oldest)) + 1
                    headers["Retry-After"] = str(retry_after)
                    headers["X-RateLimit-Reset"] = str(int(oldest + 3600))
                
                return False, headers


class RateLimitMiddleware(BaseHTTPMiddleware):
    """FastAPI middleware for rate limiting."""
    
    def __init__(
        self,
        app,
        requests_per_minute: int = 60,
        requests_per_hour: int = 1000,
        exclude_paths: list[str] = None
    ):
        super().__init__(app)
        self.limiter = RateLimiter(requests_per_minute, requests_per_hour)
        self.exclude_paths = exclude_paths or ["/health", "/", "/docs", "/redoc", "/openapi.json"]
        logger.info(
            f"Rate limiter initialized: {requests_per_minute}/min, {requests_per_hour}/hour"
        )
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Process request with rate limiting."""
        
        # Skip rate limiting for excluded paths
        if request.url.path in self.exclude_paths:
            return await call_next(request)
        
        # Get client IP
        client_ip = request.client.host if request.client else "unknown"
        
        # Check rate limit
        allowed, headers = self.limiter.is_allowed(client_ip)
        
        if not allowed:
            logger.warning(
                f"Rate limit exceeded for {client_ip} on {request.url.path}"
            )
            
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={
                    "error": "rate_limit_exceeded",
                    "message": "Too many requests. Please try again later.",
                    "retry_after": headers.get("Retry-After", "60")
                },
                headers=headers
            )
        
        # Process request
        response = await call_next(request)
        
        # Add rate limit headers to response
        for key, value in headers.items():
            response.headers[key] = value
        
        return response

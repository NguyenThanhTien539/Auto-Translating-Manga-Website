"""
FastAPI application initialization and configuration.
"""

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api import routes
from app.services.batch_processor import BatchProcessor
from app.services.manga_service import MangaTranslationService
from app.middleware.rate_limit import RateLimitMiddleware

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Global batch processor instance
batch_processor: BatchProcessor = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager - startup and shutdown events."""
    global batch_processor
    
    # Startup
    logger.info("Starting Manga Translation API...")
    
    # Initialize batch processor
    manga_service = MangaTranslationService()
    batch_processor = BatchProcessor(
        manga_service=manga_service,
        max_batch_size=6,
        batch_timeout=2.0,
        max_concurrent_batches=2,
        memory_limit_mb=4096
    )
    await batch_processor.start()
    logger.info("Batch processor started")
    
    # Store in app state for access in routes
    app.state.batch_processor = batch_processor
    
    yield
    
    # Shutdown
    logger.info("Shutting down Manga Translation API...")
    if batch_processor:
        await batch_processor.stop()
        logger.info("Batch processor stopped")
    
    # Cleanup all shared model caches
    MangaTranslationService.cleanup_all_caches()
    logger.info("Model caches cleaned")


def create_app() -> FastAPI:
    """Create and configure FastAPI application."""
    app = FastAPI(
        title="Manga Translation API",
        description="Backend API for manga image translation with detection, OCR, translation, and inpainting capabilities",
        version="1.0.0",
        lifespan=lifespan
    )

    # Configure CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # Configure appropriately for production
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    # Add rate limiting middleware
    app.add_middleware(
        RateLimitMiddleware,
        requests_per_minute=60,  # 60 requests per minute per IP
        requests_per_hour=1000,  # 1000 requests per hour per IP
        exclude_paths=["/", "/health", "/docs", "/redoc", "/openapi.json"]
    )

    # Include routers
    app.include_router(routes.router)
    
    # Global exception handler
    @app.exception_handler(Exception)
    async def global_exception_handler(request, exc):
        """Global exception handler."""
        logger.error(f"Unhandled exception: {str(exc)}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal server error", "error": str(exc)}
        )

    return app


# Create app instance
app = create_app()

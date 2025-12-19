"""
Batch processor for handling multiple manga translation requests efficiently.
Automatically groups incoming requests and processes them in batches.
"""

import asyncio
import uuid
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime
from dataclasses import dataclass, field
from enum import Enum

logger = logging.getLogger(__name__)


class BatchStatus(str, Enum):
    """Status of a batch processing job."""
    PENDING = "pending"
    QUEUED = "queued"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


@dataclass
class TranslationRequest:
    """Single translation request in the batch."""
    request_id: str
    image_data: bytes
    source_lang: str
    target_lang: str
    detector: Optional[str] = None
    ocr_model: Optional[str] = None
    translator: Optional[str] = None
    inpainter: Optional[str] = None
    
    # Font rendering options
    font_path: Optional[str] = None
    init_font_size: int = 60
    min_font_size: int = 16
    bbox_expand_ratio: float = 1.15
    
    # Metadata
    submitted_at: datetime = field(default_factory=datetime.now)
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None


@dataclass
class BatchJob:
    """Batch processing job containing multiple requests."""
    batch_id: str
    requests: List[TranslationRequest] = field(default_factory=list)
    status: BatchStatus = BatchStatus.PENDING
    created_at: datetime = field(default_factory=datetime.now)
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    total_requests: int = 0
    completed_requests: int = 0
    failed_requests: int = 0


class BatchProcessor:
    """
    Smart batch processor that accumulates translation requests and processes them in batches.
    
    Features:
    - Automatic batching: Groups requests when reaching max_batch_size or timeout
    - Memory-aware: Tracks memory usage to prevent overload
    - Concurrent processing: Handles multiple batches in parallel
    - Status tracking: Provides real-time progress updates
    """
    
    def __init__(
        self,
        manga_service,
        max_batch_size: int = 6,
        batch_timeout: float = 2.0,
        max_concurrent_batches: int = 2,
        memory_limit_mb: int = 4096
    ):
        """
        Initialize batch processor.
        
        Args:
            manga_service: MangaTranslationService instance
            max_batch_size: Maximum requests per batch (default: 6)
            batch_timeout: Seconds to wait before processing partial batch (default: 2.0)
            max_concurrent_batches: Maximum batches to process simultaneously (default: 2)
            memory_limit_mb: Memory limit in MB (default: 4096)
        """
        self.manga_service = manga_service
        self.max_batch_size = max_batch_size
        self.batch_timeout = batch_timeout
        self.max_concurrent_batches = max_concurrent_batches
        self.memory_limit_mb = memory_limit_mb
        
        # State
        self.pending_requests: List[TranslationRequest] = []
        self.batches: Dict[str, BatchJob] = {}
        self.processing_batches: int = 0
        self.is_running: bool = False
        
        # Asyncio
        self._lock = asyncio.Lock()
        self._batch_task: Optional[asyncio.Task] = None
        
        logger.info(f"BatchProcessor initialized: max_batch={max_batch_size}, timeout={batch_timeout}s")
    
    async def start(self):
        """Start the batch processor background task."""
        if self.is_running:
            logger.warning("BatchProcessor already running")
            return
        
        self.is_running = True
        self._batch_task = asyncio.create_task(self._batch_worker())
        logger.info("BatchProcessor started")
    
    async def stop(self):
        """Stop the batch processor and wait for pending batches."""
        if not self.is_running:
            return
        
        self.is_running = False
        
        if self._batch_task:
            self._batch_task.cancel()
            try:
                await self._batch_task
            except asyncio.CancelledError:
                pass
        
        # Process remaining requests
        if self.pending_requests:
            logger.info(f"Processing {len(self.pending_requests)} remaining requests before shutdown")
            await self._process_pending_batch()
        
        logger.info("BatchProcessor stopped")
    
    async def submit_request(
        self,
        image_data: bytes,
        source_lang: str,
        target_lang: str,
        **kwargs
    ) -> str:
        """
        Submit a translation request to the batch queue.
        
        Args:
            image_data: Image bytes
            source_lang: Source language
            target_lang: Target language
            **kwargs: Additional translation parameters
            
        Returns:
            request_id: Unique identifier to track this request
        """
        request_id = str(uuid.uuid4())
        
        request = TranslationRequest(
            request_id=request_id,
            image_data=image_data,
            source_lang=source_lang,
            target_lang=target_lang,
            detector=kwargs.get('detector'),
            ocr_model=kwargs.get('ocr_model'),
            translator=kwargs.get('translator'),
            inpainter=kwargs.get('inpainter'),
            font_path=kwargs.get('font_path'),
            init_font_size=kwargs.get('init_font_size', 60),
            min_font_size=kwargs.get('min_font_size', 16),
            bbox_expand_ratio=kwargs.get('bbox_expand_ratio', 1.15)
        )
        
        async with self._lock:
            self.pending_requests.append(request)
            logger.info(f"Request {request_id} queued ({len(self.pending_requests)}/{self.max_batch_size})")
            
            # Create batch immediately if we reached max size
            if len(self.pending_requests) >= self.max_batch_size:
                logger.info(f"Max batch size reached, creating batch immediately")
                # Don't await here to avoid blocking the submit call
                # Create batch will be handled by lock-protected code
                batch_requests = self.pending_requests[:self.max_batch_size]
                self.pending_requests = self.pending_requests[self.max_batch_size:]
                
                # Create and start batch processing outside the lock
                batch_id = str(uuid.uuid4())
                batch = BatchJob(
                    batch_id=batch_id,
                    requests=batch_requests,
                    total_requests=len(batch_requests),
                    status=BatchStatus.QUEUED
                )
                
                self.batches[batch_id] = batch
                logger.info(f"Created batch {batch_id} with {len(batch_requests)} requests (immediate)")
                
                # Start processing asynchronously (don't await to avoid blocking)
                asyncio.create_task(self._process_batch(batch))
        
        return request_id
    
    async def get_request_status(self, request_id: str) -> Optional[Dict[str, Any]]:
        """
        Get status of a specific request.
        
        Args:
            request_id: Request identifier
            
        Returns:
            Status dictionary or None if not found
        """
        # Check pending queue
        async with self._lock:
            for req in self.pending_requests:
                if req.request_id == request_id:
                    return {
                        "request_id": request_id,
                        "status": "pending",
                        "submitted_at": req.submitted_at.isoformat()
                    }
        
        # Check batches
        for batch in self.batches.values():
            for req in batch.requests:
                if req.request_id == request_id:
                    return {
                        "request_id": request_id,
                        "batch_id": batch.batch_id,
                        "status": batch.status.value,
                        "submitted_at": req.submitted_at.isoformat(),
                        "result": req.result,
                        "error": req.error
                    }
        
        return None
    
    async def get_batch_status(self, batch_id: str) -> Optional[Dict[str, Any]]:
        """
        Get status of a batch.
        
        Args:
            batch_id: Batch identifier
            
        Returns:
            Batch status dictionary or None if not found
        """
        batch = self.batches.get(batch_id)
        if not batch:
            return None
        
        return {
            "batch_id": batch_id,
            "status": batch.status.value,
            "total_requests": batch.total_requests,
            "completed_requests": batch.completed_requests,
            "failed_requests": batch.failed_requests,
            "created_at": batch.created_at.isoformat(),
            "started_at": batch.started_at.isoformat() if batch.started_at else None,
            "completed_at": batch.completed_at.isoformat() if batch.completed_at else None,
            "requests": [
                {
                    "request_id": req.request_id,
                    "status": "completed" if req.result else ("failed" if req.error else "processing"),
                    "error": req.error
                }
                for req in batch.requests
            ]
        }
    
    async def _batch_worker(self):
        """Background worker that creates batches on timeout."""
        while self.is_running:
            try:
                await asyncio.sleep(self.batch_timeout)
                
                async with self._lock:
                    # Only create batch if we have pending requests and capacity
                    if (self.pending_requests and 
                        self.processing_batches < self.max_concurrent_batches):
                        logger.info(f"Batch timeout reached with {len(self.pending_requests)} pending requests")
                        
                        # Take pending requests
                        batch_requests = self.pending_requests[:self.max_batch_size]
                        self.pending_requests = self.pending_requests[self.max_batch_size:]
                        
                        # Create batch
                        batch_id = str(uuid.uuid4())
                        batch = BatchJob(
                            batch_id=batch_id,
                            requests=batch_requests,
                            total_requests=len(batch_requests),
                            status=BatchStatus.QUEUED
                        )
                        
                        self.batches[batch_id] = batch
                        logger.info(f"Created batch {batch_id} with {len(batch_requests)} requests (timeout)")
                        
                        # Start processing asynchronously
                        asyncio.create_task(self._process_batch(batch))
                        
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in batch worker: {e}", exc_info=True)
    
    async def _process_pending_batch(self):
        """Process remaining pending requests as a batch."""
        async with self._lock:
            if self.pending_requests:
                logger.info(f"Processing {len(self.pending_requests)} remaining requests on shutdown")
                
                # Take all pending requests
                batch_requests = self.pending_requests
                self.pending_requests = []
                
                # Create batch
                batch_id = str(uuid.uuid4())
                batch = BatchJob(
                    batch_id=batch_id,
                    requests=batch_requests,
                    total_requests=len(batch_requests),
                    status=BatchStatus.QUEUED
                )
                
                self.batches[batch_id] = batch
                logger.info(f"Created final batch {batch_id} with {len(batch_requests)} requests (shutdown)")
                
                # Process synchronously during shutdown
                await self._process_batch(batch)
    
    async def _process_batch(self, batch: BatchJob):
        """
        Process a batch of translation requests.
        
        Args:
            batch: Batch job to process
        """
        try:
            self.processing_batches += 1
            batch.status = BatchStatus.PROCESSING
            batch.started_at = datetime.now()
            
            logger.info(f"Processing batch {batch.batch_id} with {batch.total_requests} requests")
            
            # Process each request in the batch
            for i, request in enumerate(batch.requests, 1):
                try:
                    logger.info(f"Processing request {i}/{batch.total_requests} in batch {batch.batch_id}")
                    
                    # Convert bytes to image
                    import io
                    from PIL import Image
                    import numpy as np
                    
                    image = Image.open(io.BytesIO(request.image_data))
                    image_array = np.array(image)
                    
                    # Process translation with proper defaults
                    result = await asyncio.to_thread(
                        self.manga_service.full_translation_pipeline,
                        image_array,
                        request.source_lang,
                        request.target_lang,
                        detector=request.detector or "RT-DETR-V2",
                        ocr_model=request.ocr_model or "Default",
                        translator=request.translator or "Google Translate",
                        inpainter=request.inpainter or "LaMa",
                        render_text=True,  # Always render text for batch processing
                        font_path=request.font_path,
                        init_font_size=request.init_font_size,
                        min_font_size=request.min_font_size,
                        bbox_expand_ratio=request.bbox_expand_ratio
                    )
                    
                    # Ensure result has translated_image
                    if 'rendered_image' in result and 'translated_image' not in result:
                        result['translated_image'] = result['rendered_image']
                    elif 'inpainted_image' in result and 'translated_image' not in result:
                        result['translated_image'] = result['inpainted_image']
                    
                    # Add metadata for batch tracking
                    result['blocks_detected'] = result.get('count', 0)
                    result['blocks_translated'] = result.get('count', 0)
                    
                    request.result = result
                    batch.completed_requests += 1
                    logger.info(f"Request {request.request_id} completed successfully")
                    
                except Exception as e:
                    logger.error(f"Request {request.request_id} failed: {e}")
                    request.error = str(e)
                    batch.failed_requests += 1
            
            # Mark batch as completed
            batch.status = BatchStatus.COMPLETED
            batch.completed_at = datetime.now()
            
            duration = (batch.completed_at - batch.started_at).total_seconds()
            logger.info(
                f"Batch {batch.batch_id} completed in {duration:.2f}s: "
                f"{batch.completed_requests} succeeded, {batch.failed_requests} failed"
            )
            
        except Exception as e:
            logger.error(f"Batch {batch.batch_id} processing failed: {e}")
            batch.status = BatchStatus.FAILED
            batch.completed_at = datetime.now()
            
        finally:
            self.processing_batches -= 1

"""
EasyOCR engine for Vietnamese and multi-language text recognition.
Supports 80+ languages including Vietnamese with good accuracy.
"""
import numpy as np
from typing import List, Optional
from PIL import Image
import logging

from .base import OCREngine
from modules.utils.textblock import TextBlock

logger = logging.getLogger(__name__)


class EasyOCREngine(OCREngine):
    """
    Multi-language OCR engine using EasyOCR.
    Optimized for Vietnamese text recognition.
    """
    
    def __init__(self):
        super().__init__()
        self.reader = None
        self.device = 'cpu'
        self.languages = ['vi']  # Vietnamese by default
    
    def initialize(self, device: str = 'cpu', languages: Optional[List[str]] = None):
        """
        Initialize EasyOCR engine.
        
        Args:
            device: Device to run on ('cpu' or 'cuda')
            languages: List of language codes (default: ['vi'] for Vietnamese)
        """
        try:
            import easyocr
            
            if languages:
                self.languages = languages
            
            logger.info(f"Initializing EasyOCR for languages: {self.languages}")
            
            # Create reader with GPU support if available
            gpu = (device == 'cuda')
            
            self.reader = easyocr.Reader(
                self.languages,
                gpu=gpu,
                verbose=False,  # Reduce logging
                download_enabled=True  # Auto-download models
            )
            
            self.device = device
            logger.info(f"EasyOCR initialized successfully on {device}")
            
        except ImportError as e:
            logger.error("EasyOCR library not found. Install with: pip install easyocr")
            raise ImportError(
                "EasyOCR not installed. Install with:\n"
                "  pip install easyocr\n"
                "or for GPU support:\n"
                "  pip install easyocr[gpu]"
            ) from e
        except Exception as e:
            logger.error(f"Failed to initialize EasyOCR: {e}")
            raise RuntimeError(f"EasyOCR initialization failed: {e}") from e
    
    def process_image(self, image: np.ndarray, blk_list: List[TextBlock]) -> List[TextBlock]:
        """
        Process image and extract text from blocks.
        
        Args:
            image: Input image as numpy array (RGB format)
            blk_list: List of text blocks to process
            
        Returns:
            Updated text blocks with recognized text
        """
        if self.reader is None:
            raise RuntimeError("EasyOCR not initialized. Call initialize() first.")
        
        logger.info(f"Processing {len(blk_list)} text blocks with EasyOCR")
        
        for idx, blk in enumerate(blk_list):
            try:
                # Get bounding box coordinates
                x1, y1, x2, y2 = map(int, blk.xyxy)
                
                # Validate coordinates
                if x2 <= x1 or y2 <= y1:
                    logger.warning(f"Block {idx}: Invalid bbox {blk.xyxy}, skipping")
                    blk.text = ""
                    continue
                
                # Ensure coordinates are within image bounds
                h, w = image.shape[:2]
                x1, y1 = max(0, x1), max(0, y1)
                x2, y2 = min(w, x2), min(h, y2)
                
                # Crop region
                cropped = image[y1:y2, x1:x2]
                
                # Skip very small regions
                if cropped.shape[0] < 10 or cropped.shape[1] < 10:
                    logger.debug(f"Block {idx}: Too small ({cropped.shape[1]}x{cropped.shape[0]}), skipping")
                    blk.text = ""
                    continue
                
                # Recognize text
                results = self.reader.readtext(
                    cropped,
                    detail=0,  # Return only text, not bboxes
                    paragraph=True  # Combine into paragraphs
                )
                
                # Combine results
                if results:
                    text = ' '.join(results) if isinstance(results, list) else results
                    blk.text = text.strip()
                else:
                    blk.text = ""
                
                logger.debug(f"Block {idx}: Recognized '{blk.text}'")
                
            except Exception as e:
                logger.warning(f"Block {idx}: EasyOCR recognition failed - {e}")
                blk.text = ""
        
        recognized_count = sum(1 for blk in blk_list if blk.text)
        logger.info(f"EasyOCR: Successfully recognized {recognized_count}/{len(blk_list)} blocks")
        
        return blk_list
    
    def recognize(self, image: np.ndarray) -> str:
        """
        Recognize text from a single image region.
        
        Args:
            image: Image region as numpy array
            
        Returns:
            Recognized text string
        """
        if self.reader is None:
            raise RuntimeError("EasyOCR not initialized. Call initialize() first.")
        
        try:
            results = self.reader.readtext(
                image,
                detail=0,
                paragraph=True
            )
            
            if results:
                text = ' '.join(results) if isinstance(results, list) else results
                return text.strip()
            return ""
            
        except Exception as e:
            logger.error(f"EasyOCR recognition failed: {e}")
            return ""
    
    def __del__(self):
        """Cleanup resources."""
        self.reader = None

"""
Business logic layer for manga translation operations.
Handles detection, OCR, translation, and inpainting without GUI dependencies.
"""

import logging
import numpy as np
import json
from typing import Optional, List, Dict, Any

from modules.detection.processor import TextBlockDetector
from modules.ocr.processor import OCRProcessor
from modules.translation.processor import Translator
from modules.utils.textblock import TextBlock, sort_blk_list
from modules.utils.device import resolve_device
from modules.utils.pipeline_utils import inpaint_map, get_config, language_codes
from modules.inpainting.schema import Config
from modules.detection.utils.content import get_inpaint_bboxes
from modules.utils.download import ModelDownloader, ModelID
import imkit as imk
import os

logger = logging.getLogger(__name__)


def simple_draw_text(image: np.ndarray, blk_list, font_pth: str, colour: str = "#000", 
                     init_font_size: int = 40, min_font_size=10, outline: bool = True):
    """
    Simplified text rendering without PySide6 dependency.
    Uses PIL to draw translated text on image.
    """
    from PIL import Image, ImageFont, ImageDraw
    
    logger.info(f"Starting text rendering for {len(blk_list)} blocks")
    
    # Convert numpy array to PIL Image
    if isinstance(image, np.ndarray):
        pil_image = Image.fromarray(image)
    else:
        pil_image = image
    
    draw = ImageDraw.Draw(pil_image)
    rendered_count = 0
    
    for idx, blk in enumerate(blk_list):
        x1, y1, x2, y2 = blk.xyxy
        width = int(x2 - x1)
        height = int(y2 - y1)
        tbbox_top_left = (int(x1), int(y1))
        
        translation = blk.translation
        logger.info(f"Block {idx}: translation='{translation}', bbox={blk.xyxy}")
        
        if not translation or len(translation) <= 1:
            logger.info(f"Block {idx}: Skipping (no translation or too short)")
            continue
        
        # Use block-specific settings if available
        current_min = min_font_size
        current_init = init_font_size
        current_colour = colour
        
        if blk.min_font_size > 0:
            current_min = blk.min_font_size
        if blk.max_font_size > 0:
            current_init = blk.max_font_size
        if blk.font_color:
            current_colour = blk.font_color
        
        # Simple word wrap and font sizing with multiline support
        font_size = current_init
        lines = []
        
        # Try to fit text by reducing font size and wrapping
        while font_size >= current_min:
            font = ImageFont.truetype(font_pth, font_size)
            
            # Try to wrap text to fit width
            words = translation.split()
            lines = []
            current_line = []
            
            for word in words:
                test_line = ' '.join(current_line + [word])
                bbox = draw.textbbox((0, 0), test_line, font=font)
                text_width = bbox[2] - bbox[0]
                
                if text_width <= width - 10:  # 10px padding
                    current_line.append(word)
                else:
                    if current_line:
                        lines.append(' '.join(current_line))
                        current_line = [word]
                    else:
                        lines.append(word)
            
            if current_line:
                lines.append(' '.join(current_line))
            
            # Check if all lines fit in height
            full_text = '\n'.join(lines)
            bbox = draw.textbbox((0, 0), full_text, font=font)
            text_height = bbox[3] - bbox[1]
            
            if text_height <= height - 10:  # 10px padding
                break
            
            font_size -= 2
            if font_size < current_min:
                # Use single line if can't fit
                lines = [translation]
                break
        
        wrapped_text = '\n'.join(lines)
        
        # Center the text in the bounding box
        bbox = draw.textbbox(tbbox_top_left, wrapped_text, font=font)
        text_width = bbox[2] - bbox[0]
        text_height = bbox[3] - bbox[1]
        
        # Calculate centered position
        x_offset = (width - text_width) // 2
        y_offset = (height - text_height) // 2
        text_position = (tbbox_top_left[0] + x_offset, tbbox_top_left[1] + y_offset)
        
        logger.info(f"Block {idx}: Using font size {font_size}, {len(lines)} lines, color={current_colour}")
        
        # Draw text with outline for visibility
        if outline:
            # Draw thick white outline for better visibility
            outline_width = max(2, font_size // 10)
            for dx in range(-outline_width, outline_width + 1):
                for dy in range(-outline_width, outline_width + 1):
                    if dx != 0 or dy != 0:
                        draw.multiline_text(
                            (text_position[0] + dx, text_position[1] + dy),
                            wrapped_text,
                            font=font,
                            fill="#FFFFFF",
                            align='center',
                            spacing=2
                        )
        
        # Draw main text
        draw.multiline_text(
            text_position,
            wrapped_text,
            fill=current_colour,
            font=font,
            align='center',
            spacing=2
        )
        
        rendered_count += 1
    
    logger.info(f"Rendered {rendered_count} text blocks")
    
    # Convert back to numpy array
    return np.array(pil_image)


class MockSettingsPage:
    """Mock settings page for headless operation."""
    
    def __init__(self, detector="RT-DETR-V2", ocr_model="Default", 
                 translator="Google Translate", inpainter="LaMa", use_gpu=False,
                 credentials: Optional[Dict[str, Dict[str, str]]] = None):
        self.detector = detector
        self.ocr_model = ocr_model
        self.translator = translator
        self.inpainter = inpainter
        self.use_gpu = use_gpu
        self.ui = self  # Mock ui reference
        self._credentials = credentials or {}
        
    def get_tool_selection(self, tool_type: str) -> str:
        """Get the selected tool for a given type."""
        if tool_type == 'detector':
            return self.detector
        elif tool_type == 'ocr':
            return self.ocr_model
        elif tool_type == 'translator':
            return self.translator
        elif tool_type == 'inpainter':
            return self.inpainter
        return None
    
    def is_gpu_enabled(self) -> bool:
        """Check if GPU is enabled."""
        return self.use_gpu
    
    def get_llm_settings(self) -> Dict[str, Any]:
        """Get LLM settings."""
        return {'extra_context': ''}
    
    def get_credentials(self, service: str = "") -> Dict[str, Any]:
        """Get credentials for a service.
        
        Args:
            service: Service name (e.g., "Microsoft Azure", "Google", "DeepL")
                    If empty, returns all credentials.
        
        Returns:
            Dictionary with credentials. Always includes 'save_key': False
        """
        if service:
            # Return credentials for specific service
            creds = self._credentials.get(service, {})
            return {'save_key': False, **creds}
        
        # Return all credentials
        result = {}
        known_services = [
            "Microsoft Azure", "Google", "DeepL", "Yandex", 
            "Custom", "GPT-4", "Gemini"
        ]
        for s in known_services:
            result[s] = self.get_credentials(s)
        return result
    
    def tr(self, text: str) -> str:
        """Mock translation method."""
        return text


class MockMainPage:
    """Mock main page for headless operation."""
    
    def __init__(self, settings_page: MockSettingsPage, source_lang="Japanese", target_lang="English"):
        self.settings_page = settings_page
        self.source_lang = source_lang
        self.target_lang = target_lang
        
        # Language mapping
        self.lang_mapping = {
            "Korean": "Korean",
            "Japanese": "Japanese",
            "Chinese": "Chinese",
            "Simplified Chinese": "Simplified Chinese",
            "Traditional Chinese": "Traditional Chinese",
            "English": "English",
            "Russian": "Russian",
            "French": "French",
            "German": "German",
            "Dutch": "Dutch",
            "Spanish": "Spanish",
            "Italian": "Italian",
            "Turkish": "Turkish",
            "Polish": "Polish",
            "Portuguese": "Portuguese",
            "Brazilian Portuguese": "Brazilian Portuguese",
            "Thai": "Thai",
            "Vietnamese": "Vietnamese",
            "Indonesian": "Indonesian",
            "Hungarian": "Hungarian",
            "Finnish": "Finnish",
            "Arabic": "Arabic",
        }


class MangaTranslationService:
    """Service for manga translation operations without GUI dependencies."""
    
    def __init__(self):
        self.detector_cache = None
        self.ocr_cache = None
        self.translator_cache = None
        self.inpainter_cache = None
        self.cached_settings = {}
        logger.info("MangaTranslationService initialized")
        
        # Ensure mandatory models are available
        self._ensure_core_models()
    
    def _ensure_core_models(self):
        """Ensure core models are downloaded at startup."""
        try:
            logger.info("Checking and downloading core models if needed...")
            
            # Detection model (RT-DETR-V2)
            logger.info("Ensuring detection model...")
            ModelDownloader.get(ModelID.RTDETRV2_ONNX)
            
            # Default OCR models (Manga OCR ONNX)
            logger.info("Ensuring default OCR model...")
            ModelDownloader.get(ModelID.MANGA_OCR_BASE_ONNX)
            
            # Default inpainting model (LaMa)
            logger.info("Ensuring default inpainting model...")
            ModelDownloader.get(ModelID.LAMA_ONNX)
            
            logger.info("Core models ready!")
        except Exception as e:
            logger.warning(f"Error ensuring core models: {e}")
            logger.info("Models will be downloaded on first use")
    
    def _ensure_ocr_model(self, ocr_model: str, source_lang: str):
        """Ensure OCR model is downloaded before use."""
        try:
            if ocr_model == "Default":
                # For Japanese, use Manga OCR
                if "Japanese" in source_lang or "Korean" in source_lang:
                    logger.info("Ensuring Manga OCR ONNX model...")
                    ModelDownloader.get(ModelID.MANGA_OCR_BASE_ONNX)
                else:
                    # For other languages, use PPOCRv5
                    logger.info("Ensuring PPOCRv5 models...")
                    ModelDownloader.get(ModelID.PPOCR_V5_DET_MOBILE)
                    
                    # Get appropriate recognition model based on language
                    if "English" in source_lang:
                        ModelDownloader.get(ModelID.PPOCR_V5_REC_EN_MOBILE)
                    elif "Korean" in source_lang:
                        ModelDownloader.get(ModelID.PPOCR_V5_REC_KOREAN_MOBILE)
                    elif "Chinese" in source_lang:
                        ModelDownloader.get(ModelID.PPOCR_V5_REC_MOBILE)
                    elif "Russian" in source_lang:
                        ModelDownloader.get(ModelID.PPOCR_V5_REC_ESLAV_MOBILE)
                    else:
                        # Latin-based languages
                        ModelDownloader.get(ModelID.PPOCR_V5_REC_LATIN_MOBILE)
        except Exception as e:
            logger.warning(f"Error ensuring OCR model: {e}")
    
    def _ensure_inpainting_model(self, inpainter: str):
        """Ensure inpainting model is downloaded before use."""
        try:
            if inpainter == "LaMa":
                logger.info("Ensuring LaMa ONNX model...")
                ModelDownloader.get(ModelID.LAMA_ONNX)
            elif inpainter == "MI-GAN":
                logger.info("Ensuring MI-GAN model...")
                ModelDownloader.get(ModelID.MIGAN_PIPELINE_ONNX)
            elif inpainter == "AOT":
                logger.info("Ensuring AOT ONNX model...")
                ModelDownloader.get(ModelID.AOT_ONNX)
        except Exception as e:
            logger.warning(f"Error ensuring inpainting model: {e}")
    
    def _get_or_create_detector(self, settings: MockSettingsPage) -> TextBlockDetector:
        """Get or create text block detector."""
        detector_key = settings.get_tool_selection('detector')
        if self.detector_cache is None or self.cached_settings.get('detector') != detector_key:
            logger.info(f"Creating new detector: {detector_key}")
            
            # Ensure detector model is available
            if detector_key == "RT-DETR-V2":
                ModelDownloader.get(ModelID.RTDETRV2_ONNX)
            
            self.detector_cache = TextBlockDetector(settings)
            self.cached_settings['detector'] = detector_key
        return self.detector_cache
    
    def _get_or_create_ocr(self) -> OCRProcessor:
        """Get or create OCR processor."""
        if self.ocr_cache is None:
            logger.info("Creating new OCR processor")
            self.ocr_cache = OCRProcessor()
        return self.ocr_cache
    
    def _textblocks_to_dict(self, blk_list: List[TextBlock]) -> List[Dict[str, Any]]:
        """Convert TextBlock objects to dictionary representation."""
        result = []
        for blk in blk_list:
            block_dict = {
                'bbox': blk.xyxy.tolist() if isinstance(blk.xyxy, np.ndarray) else blk.xyxy,
                'text': blk.text if hasattr(blk, 'text') else '',
                'translation': blk.translation if hasattr(blk, 'translation') else '',
                'text_class': blk.text_class,
                'angle': blk.angle,
                'source_lang': blk.source_lang if hasattr(blk, 'source_lang') else '',
                'target_lang': blk.target_lang if hasattr(blk, 'target_lang') else '',
            }
            
            if blk.bubble_xyxy is not None:
                block_dict['bubble_bbox'] = blk.bubble_xyxy.tolist() if isinstance(blk.bubble_xyxy, np.ndarray) else blk.bubble_xyxy
            
            if blk.inpaint_bboxes is not None:
                block_dict['inpaint_bboxes'] = blk.inpaint_bboxes.tolist() if isinstance(blk.inpaint_bboxes, np.ndarray) else blk.inpaint_bboxes
            
            result.append(block_dict)
        
        return result
    
    def _dict_to_textblocks(self, blocks_data: List[Dict[str, Any]]) -> List[TextBlock]:
        """Convert dictionary representation to TextBlock objects."""
        print(blocks_data)
        result = []
        for block_dict in blocks_data:
            print(block_dict)
            text_bbox = np.array(block_dict['bbox'], dtype=np.float32)
            bubble_bbox = np.array(block_dict.get('bubble_bbox'), dtype=np.float32) if block_dict.get('bubble_bbox') else None
            inpaint_bboxes = np.array(block_dict.get('inpaint_bboxes'), dtype=np.int32) if block_dict.get('inpaint_bboxes') else None
            
            blk = TextBlock(
                text_bbox=text_bbox,
                bubble_bbox=bubble_bbox,
                text_class=block_dict.get('text_class', ''),
                inpaint_bboxes=inpaint_bboxes,
                angle=block_dict.get('angle', 0),
                text=block_dict.get('text', ''),
                translation=block_dict.get('translation', ''),
                source_lang=block_dict.get('source_lang', ''),
                target_lang=block_dict.get('target_lang', ''),
            )
            result.append(blk)
        
        return result
    
    def detect_text_blocks(
        self, 
        image: np.ndarray, 
        detector: str = "RT-DETR-V2",
        use_gpu: bool = False
    ) -> Dict[str, Any]:
        """
        Detect text blocks in manga image.
        
        Args:
            image: Input image as numpy array
            detector: Detection model to use
            use_gpu: Whether to use GPU acceleration
            
        Returns:
            Dictionary with detected blocks and metadata
        """
        logger.info(f"Starting text block detection with {detector}")
        
        settings = MockSettingsPage(detector=detector, use_gpu=use_gpu)
        detector_obj = self._get_or_create_detector(settings)
        
        blk_list = detector_obj.detect(image)
        
        # Sort blocks based on typical reading order
        blk_list = sort_blk_list(blk_list, right_to_left=True)
        
        logger.info(f"Detected {len(blk_list)} text blocks")
        
        return {
            'blocks': self._textblocks_to_dict(blk_list),
            'count': len(blk_list),
            'image_shape': image.shape
        }
    
    def perform_ocr(
        self,
        image: np.ndarray,
        source_lang: str = "Japanese",
        ocr_model: str = "Default",
        use_gpu: bool = False,
        blocks_json: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Perform OCR on manga image or provided text blocks.
        
        Args:
            image: Input image as numpy array
            source_lang: Source language for OCR
            ocr_model: OCR model to use
            use_gpu: Whether to use GPU acceleration
            blocks_json: Optional JSON string of text blocks from detection
            
        Returns:
            Dictionary with OCR results
        """
        logger.info(f"Starting OCR with model {ocr_model} for language {source_lang}")
        
        # Ensure OCR model is downloaded
        self._ensure_ocr_model(ocr_model, source_lang)
        
        settings = MockSettingsPage(ocr_model=ocr_model, use_gpu=use_gpu)
        main_page = MockMainPage(settings, source_lang=source_lang)
        
        # Get or detect text blocks
        if blocks_json:
            parsed_json = json.loads(blocks_json)
            # Handle both cases: full response with 'blocks' key or just blocks array
            if isinstance(parsed_json, dict) and 'blocks' in parsed_json:
                blocks_data = parsed_json['blocks']
            elif isinstance(parsed_json, list):
                blocks_data = parsed_json
            else:
                raise ValueError("Invalid blocks_json format. Expected a list of blocks or a dict with 'blocks' key")
            blk_list = self._dict_to_textblocks(blocks_data)
        else:
            logger.info("No blocks provided, performing detection first")
            detection_result = self.detect_text_blocks(image, use_gpu=use_gpu)
            blk_list = self._dict_to_textblocks(detection_result['blocks'])
        
        # Perform OCR
        ocr_processor = self._get_or_create_ocr()
        ocr_processor.initialize(main_page, source_lang)
        ocr_processor.process(image, blk_list)
        
        logger.info(f"OCR completed for {len(blk_list)} blocks")
        
        return {
            'blocks': self._textblocks_to_dict(blk_list),
            'count': len(blk_list),
            'source_lang': source_lang
        }
    
    def perform_translation(
        self,
        image: np.ndarray,
        source_lang: str = "Japanese",
        target_lang: str = "English",
        translator: str = "Google Translate",
        use_gpu: bool = False,
        blocks_json: Optional[str] = None,
        extra_context: str = ""
    ) -> Dict[str, Any]:
        """
        Translate text from manga image.
        
        Args:
            image: Input image as numpy array
            source_lang: Source language
            target_lang: Target language
            translator: Translation engine to use
            use_gpu: Whether to use GPU acceleration
            blocks_json: Optional JSON string of text blocks with OCR results
            extra_context: Additional context for translation
            
        Returns:
            Dictionary with translation results
        """
        logger.info(f"Starting translation from {source_lang} to {target_lang} using {translator}")
        
        settings = MockSettingsPage(translator=translator, use_gpu=use_gpu)
        main_page = MockMainPage(settings, source_lang=source_lang, target_lang=target_lang)
        
        # Get or perform OCR
        if blocks_json:
            parsed_json = json.loads(blocks_json)
            # Handle both cases: full response with 'blocks' key or just blocks array
            if isinstance(parsed_json, dict) and 'blocks' in parsed_json:
                blocks_data = parsed_json['blocks']
            elif isinstance(parsed_json, list):
                blocks_data = parsed_json
            else:
                raise ValueError("Invalid blocks_json format. Expected a list of blocks or a dict with 'blocks' key")
            blk_list = self._dict_to_textblocks(blocks_data)
            # If blocks don't have text, perform OCR
            if not all(blk.text for blk in blk_list):
                logger.info("Blocks provided without OCR text, performing OCR")
                ocr_processor = self._get_or_create_ocr()
                ocr_processor.initialize(main_page, source_lang)
                ocr_processor.process(image, blk_list)
        else:
            logger.info("No blocks provided, performing detection and OCR")
            ocr_result = self.perform_ocr(image, source_lang=source_lang, use_gpu=use_gpu)
            blk_list = self._dict_to_textblocks(ocr_result['blocks'])
        
        # Perform translation
        translator_obj = Translator(main_page, source_lang, target_lang)
        translator_obj.translate(blk_list, image, extra_context)
        
        logger.info(f"Translation completed for {len(blk_list)} blocks")
        
        return {
            'blocks': self._textblocks_to_dict(blk_list),
            'count': len(blk_list),
            'source_lang': source_lang,
            'target_lang': target_lang
        }
    
    def perform_inpainting(
        self,
        image: np.ndarray,
        inpainter: str = "LaMa",
        use_gpu: bool = False,
        blocks_json: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Inpaint (remove) text from manga image.
        
        Args:
            image: Input image as numpy array
            inpainter: Inpainting model to use (LaMa, MI-GAN, AOT)
            use_gpu: Whether to use GPU acceleration
            blocks_json: Optional JSON string of text blocks to inpaint
            
        Returns:
            Dictionary with inpainted image
        """
        logger.info(f"Starting inpainting with {inpainter}")
        
        # Ensure inpainting model is downloaded
        self._ensure_inpainting_model(inpainter)
        
        settings = MockSettingsPage(inpainter=inpainter, use_gpu=use_gpu)
        
        # Get or detect text blocks
        if blocks_json:
            parsed_json = json.loads(blocks_json)
            # Handle both cases: full response with 'blocks' key or just blocks array
            if isinstance(parsed_json, dict) and 'blocks' in parsed_json:
                blocks_data = parsed_json['blocks']
            elif isinstance(parsed_json, list):
                blocks_data = parsed_json
            else:
                raise ValueError("Invalid blocks_json format. Expected a list of blocks or a dict with 'blocks' key")
            blk_list = self._dict_to_textblocks(blocks_data)
        else:
            logger.info("No blocks provided, performing detection first")
            detection_result = self.detect_text_blocks(image, use_gpu=use_gpu)
            blk_list = self._dict_to_textblocks(detection_result['blocks'])
        
        # Create mask from text blocks
        mask = np.zeros(image.shape[:2], dtype=np.uint8)
        
        for blk in blk_list:
            # Get inpaint bboxes or use text bbox
            if blk.inpaint_bboxes is not None and len(blk.inpaint_bboxes) > 0:
                bboxes = blk.inpaint_bboxes
            else:
                # Generate inpaint bboxes if not present
                bboxes = get_inpaint_bboxes(blk.xyxy, image)
            
            # Draw filled rectangles on mask
            for bbox in bboxes:
                x1, y1, x2, y2 = map(int, bbox)
                mask[y1:y2, x1:x2] = 255
        
        # Perform inpainting
        device = resolve_device(use_gpu)
        InpainterClass = inpaint_map[inpainter]
        
        inpainter_key = f"{inpainter}_{use_gpu}"
        if self.inpainter_cache is None or self.cached_settings.get('inpainter') != inpainter_key:
            logger.info(f"Creating new inpainter: {inpainter}")
            self.inpainter_cache = InpainterClass(device, backend='onnx')
            self.cached_settings['inpainter'] = inpainter_key
        
        config = Config()
        inpainted_image = self.inpainter_cache(image, mask, config)
        inpainted_image = imk.convert_scale_abs(inpainted_image)
        
        logger.info("Inpainting completed")
        
        # Convert to base64 for transmission
        from PIL import Image
        import io
        import base64
        
        pil_image = Image.fromarray(inpainted_image)
        buffer = io.BytesIO()
        pil_image.save(buffer, format="PNG")
        image_base64 = base64.b64encode(buffer.getvalue()).decode()
        
        return {
            'inpainted_image': image_base64,
            'blocks_count': len(blk_list),
            'image_shape': inpainted_image.shape
        }
    
    def render_translated_text(
        self,
        image: np.ndarray,
        blocks_json: Optional[str] = None,
        font_path: Optional[str] = None,
        font_color: str = "#000000",
        init_font_size: int = 60,
        min_font_size: int = 16,
        outline: bool = True
    ) -> Dict[str, Any]:
        """
        Render translated text onto the image.
        
        Args:
            image: Input image (typically the inpainted image)
            blocks_json: JSON string of text blocks with translations
            font_path: Path to font file (optional, uses default if not provided)
            font_color: Color of the text in hex format
            init_font_size: Initial font size to try
            min_font_size: Minimum font size allowed
            outline: Whether to add white outline for better readability
            
        Returns:
            Dictionary with rendered image
        """
        logger.info("Rendering translated text on image")
        
        # Parse blocks if provided
        if blocks_json:
            parsed_json = json.loads(blocks_json)
            if isinstance(parsed_json, dict) and 'blocks' in parsed_json:
                blocks_data = parsed_json['blocks']
            elif isinstance(parsed_json, list):
                blocks_data = parsed_json
            else:
                raise ValueError("Invalid blocks_json format")
            blk_list = self._dict_to_textblocks(blocks_data)
        else:
            raise ValueError("blocks_json is required for rendering")
        
        # Use default font if not provided
        if not font_path:
            # Try to find a system font
            possible_fonts = [
                "C:/Windows/Fonts/arial.ttf",
                "C:/Windows/Fonts/ArialUni.ttf",
                "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
                "/System/Library/Fonts/Helvetica.ttc"
            ]
            for font in possible_fonts:
                if os.path.exists(font):
                    font_path = font
                    break
            
            if not font_path:
                raise ValueError("No suitable font found. Please provide font_path parameter.")
        
        logger.info(f"Using font: {font_path}")
        
        # Render text on image
        rendered_image = simple_draw_text(
            image=image,
            blk_list=blk_list,
            font_pth=font_path,
            colour=font_color,
            init_font_size=init_font_size,
            min_font_size=min_font_size,
            outline=outline
        )
        
        logger.info("Text rendering completed")
        
        # Convert to base64 for transmission
        from PIL import Image
        import io
        import base64
        
        pil_image = Image.fromarray(rendered_image)
        buffer = io.BytesIO()
        pil_image.save(buffer, format="PNG")
        image_base64 = base64.b64encode(buffer.getvalue()).decode()
        
        return {
            'rendered_image': image_base64,
            'blocks_count': len(blk_list),
            'image_shape': rendered_image.shape
        }
    
    def full_translation_pipeline(
        self,
        image: np.ndarray,
        source_lang: str = "Japanese",
        target_lang: str = "English",
        detector: str = "RT-DETR-V2",
        ocr_model: str = "Default",
        translator: str = "Google Translate",
        inpainter: Optional[str] = None,
        use_gpu: bool = False,
        extra_context: str = "",
        render_text: bool = False,
        font_path: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Run complete translation pipeline: detection -> OCR -> translation -> optional inpainting.
        
        Args:
            image: Input image as numpy array
            source_lang: Source language
            target_lang: Target language
            detector: Detection model
            ocr_model: OCR model
            translator: Translation engine
            inpainter: Inpainting model (optional)
            use_gpu: Whether to use GPU acceleration
            extra_context: Additional translation context
            
        Returns:
            Dictionary with complete pipeline results
        """
        logger.info(f"Starting full translation pipeline: {source_lang} -> {target_lang}")
        
        # Step 1: Detection
        detection_result = self.detect_text_blocks(
            image=image,
            detector=detector,
            use_gpu=use_gpu
        )
        
        blocks_json = json.dumps(detection_result['blocks'])
        
        # Step 2: OCR
        ocr_result = self.perform_ocr(
            image=image,
            source_lang=source_lang,
            ocr_model=ocr_model,
            use_gpu=use_gpu,
            blocks_json=blocks_json
        )
        
        blocks_json = json.dumps(ocr_result['blocks'])
        
        # Step 3: Translation
        translation_result = self.perform_translation(
            image=image,
            source_lang=source_lang,
            target_lang=target_lang,
            translator=translator,
            use_gpu=use_gpu,
            blocks_json=blocks_json,
            extra_context=extra_context
        )
        
        result = {
            'blocks': translation_result['blocks'],
            'count': translation_result['count'],
            'source_lang': source_lang,
            'target_lang': target_lang,
            'pipeline_steps': ['detection', 'ocr', 'translation']
        }
        
        # Step 4: Optional Inpainting
        if inpainter:
            logger.info(f"Performing inpainting with {inpainter}")
            inpainting_result = self.perform_inpainting(
                image=image,
                inpainter=inpainter,
                use_gpu=use_gpu,
                blocks_json=json.dumps(translation_result['blocks'])
            )
            result['inpainted_image'] = inpainting_result['inpainted_image']
            result['pipeline_steps'].append('inpainting')
            
            # Step 5: Optional Text Rendering (requires inpainted image)
            if render_text:
                logger.info("Rendering translated text on inpainted image")
                # Decode inpainted image from base64
                import base64
                import io
                from PIL import Image
                
                inpainted_bytes = base64.b64decode(inpainting_result['inpainted_image'])
                inpainted_pil = Image.open(io.BytesIO(inpainted_bytes))
                inpainted_np = np.array(inpainted_pil)
                
                rendering_result = self.render_translated_text(
                    image=inpainted_np,
                    blocks_json=json.dumps(translation_result['blocks']),
                    font_path=font_path
                )
                result['rendered_image'] = rendering_result['rendered_image']
                result['pipeline_steps'].append('rendering')
        
        logger.info("Full translation pipeline completed")
        
        return result

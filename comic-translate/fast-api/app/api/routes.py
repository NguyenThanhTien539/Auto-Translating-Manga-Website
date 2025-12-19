"""
API routes for manga translation operations.
"""

import logging
from fastapi import APIRouter, File, UploadFile, Form, HTTPException
from typing import Optional
import numpy as np
from PIL import Image
import io

from app.models.schemas import (
    DetectionResponse,
    OCRResponse,
    TranslationResponse,
    InpaintingResponse,
    RenderResponse,
    FullPipelineResponse,
)
from app.services.manga_service import MangaTranslationService

logger = logging.getLogger(__name__)

# Create router
router = APIRouter()

# Initialize service
manga_service = MangaTranslationService()


async def load_image_from_upload(file: UploadFile) -> np.ndarray:
    """Load image from uploaded file."""
    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))
        return np.array(image.convert('RGB'))
    except Exception as e:
        logger.error(f"Error loading image: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Invalid image file: {str(e)}")


@router.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "message": "Manga Translation API",
        "version": "1.0.0",
        "endpoints": {
            "detection": "/api/v1/detection",
            "ocr": "/api/v1/ocr",
            "translation": "/api/v1/translation",
            "inpainting": "/api/v1/inpainting",
            "full_pipeline": "/api/v1/translate",
            "models": "/api/v1/models",
            "download_models": "/api/v1/models/download"
        }
    }


@router.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "manga-translation-api"}


@router.post("/api/v1/detection", response_model=DetectionResponse)
async def detect_text_blocks(
    file: UploadFile = File(..., description="Manga page image"),
    detector: Optional[str] = Form("RT-DETR-V2", description="Detection model to use"),
    gpu: Optional[bool] = Form(False, description="Use GPU acceleration")
):
    """
    Detect text blocks in a manga image.
    
    Returns bounding boxes and metadata for detected text regions.
    """
    try:
        logger.info(f"Detection request received - detector: {detector}, gpu: {gpu}")
        image = await load_image_from_upload(file)
        
        result = manga_service.detect_text_blocks(
            image=image,
            detector=detector,
            use_gpu=gpu
        )
        
        logger.info(f"Detection completed - found {len(result['blocks'])} text blocks")
        return result
        
    except Exception as e:
        logger.error(f"Detection error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/api/v1/ocr", response_model=OCRResponse)
async def perform_ocr(
    file: UploadFile = File(..., description="Manga page image"),
    source_lang: str = Form("Japanese", description="Source language"),
    ocr_model: Optional[str] = Form("Default", description="OCR model to use"),
    gpu: Optional[bool] = Form(False, description="Use GPU acceleration"),
    blocks: Optional[str] = Form(None, description="JSON string of text blocks from detection")
):
    """
    Perform OCR on manga image or specific text blocks.
    
    If blocks are not provided, will perform detection first.
    """
    try:
        logger.info(f"OCR request received - source_lang: {source_lang}, ocr_model: {ocr_model}")
        image = await load_image_from_upload(file)
        
        result = manga_service.perform_ocr(
            image=image,
            source_lang=source_lang,
            ocr_model=ocr_model,
            use_gpu=gpu,
            blocks_json=blocks
        )
        
        logger.info(f"OCR completed - processed {len(result['blocks'])} text blocks")
        return result
        
    except Exception as e:
        logger.error(f"OCR error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/api/v1/translation", response_model=TranslationResponse)
async def translate_text(
    file: UploadFile = File(..., description="Manga page image"),
    source_lang: str = Form("Japanese", description="Source language"),
    target_lang: str = Form("English", description="Target language"),
    translator: Optional[str] = Form("Google Translate", description="Translation engine"),
    gpu: Optional[bool] = Form(False, description="Use GPU acceleration"),
    blocks: Optional[str] = Form(None, description="JSON string of text blocks with OCR results"),
    extra_context: Optional[str] = Form("", description="Additional context for translation")
):
    """
    Translate text from manga image.
    
    If blocks with OCR text are not provided, will perform detection and OCR first.
    """
    try:
        logger.info(f"Translation request - {source_lang} to {target_lang}, translator: {translator}")
        image = await load_image_from_upload(file)
        
        result = manga_service.perform_translation(
            image=image,
            source_lang=source_lang,
            target_lang=target_lang,
            translator=translator,
            use_gpu=gpu,
            blocks_json=blocks,
            extra_context=extra_context
        )
        
        logger.info(f"Translation completed - translated {len(result['blocks'])} text blocks")
        return result
        
    except Exception as e:
        logger.error(f"Translation error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/api/v1/inpainting", response_model=InpaintingResponse)
async def inpaint_image(
    file: UploadFile = File(..., description="Manga page image"),
    inpainter: Optional[str] = Form("LaMa", description="Inpainting model (LaMa, MI-GAN, AOT)"),
    gpu: Optional[bool] = Form(False, description="Use GPU acceleration"),
    blocks: Optional[str] = Form(None, description="JSON string of text blocks to inpaint")
):
    """
    Inpaint (remove) text from manga image.
    
    If blocks are not provided, will detect text blocks first.
    """
    try:
        logger.info(f"Inpainting request - inpainter: {inpainter}, gpu: {gpu}")
        image = await load_image_from_upload(file)
        
        result = manga_service.perform_inpainting(
            image=image,
            inpainter=inpainter,
            use_gpu=gpu,
            blocks_json=blocks
        )
        
        logger.info(f"Inpainting completed")
        return result
        
    except Exception as e:
        logger.error(f"Inpainting error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/api/v1/render", response_model=RenderResponse)
async def render_text_on_image(
    file: UploadFile = File(..., description="Image (usually inpainted)"),
    blocks: str = Form(..., description="JSON string of text blocks with translations"),
    font_path: Optional[str] = Form(None, description="Path to custom font file. If not provided, uses auto-detected system font (Arial, Segoe UI, etc.). For Vietnamese, ensure Unicode-compatible font."),
    font_color: Optional[str] = Form("#000000", description="Text color in hex format"),
    init_font_size: Optional[int] = Form(60, description="Initial/maximum font size to try"),
    min_font_size: Optional[int] = Form(16, description="Minimum font size allowed"),
    outline: Optional[bool] = Form(True, description="Add white outline to text for better readability"),
    bbox_expand_ratio: Optional[float] = Form(1.15, description="Ratio to expand bounding box (1.15 = 15% larger for longer translations)")
):
    """
    Render translated text onto an image.
    
    Typically used after inpainting to add translated text.
    Font size is automatically calculated based on bounding box dimensions and text length.
    
    **Font handling:**
    - If `font_path` is provided, uses that font
    - If not provided, auto-detects system fonts (Arial, Segoe UI, DejaVu Sans, etc.)
    - For Vietnamese text, ensure using Unicode-compatible fonts
    - Set `MANGA_TRANSLATE_DEFAULT_FONT` environment variable to override default font
    """
    try:
        logger.info("Rendering text request received")
        image = await load_image_from_upload(file)
        
        result = manga_service.render_translated_text(
            image=image,
            blocks_json=blocks,
            font_path=font_path,
            font_color=font_color,
            init_font_size=init_font_size,
            min_font_size=min_font_size,
            outline=outline,
            bbox_expand_ratio=bbox_expand_ratio
        )
        
        logger.info("Rendering completed")
        return result
        
    except Exception as e:
        logger.error(f"Rendering error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/api/v1/translate", response_model=FullPipelineResponse)
async def full_translation_pipeline(
    file: UploadFile = File(..., description="Manga page image"),
    source_lang: str = Form("Japanese", description="Source language"),
    target_lang: str = Form("English", description="Target language"),
    detector: Optional[str] = Form("RT-DETR-V2", description="Detection model"),
    ocr_model: Optional[str] = Form("Default", description="OCR model"),
    translator: Optional[str] = Form("Google Translate", description="Translation engine"),
    inpainter: Optional[str] = Form("LaMa", description="Inpainting model"),
    gpu: Optional[bool] = Form(False, description="Use GPU acceleration"),
    extra_context: Optional[str] = Form("", description="Additional translation context"),
    include_inpainted: Optional[bool] = Form(False, description="Include inpainted image in response"),
    render_text: Optional[bool] = Form(True, description="Render translated text on inpainted image (requires inpainting)"),
    font_path: Optional[str] = Form(None, description="Custom font path for rendering. Auto-detected if not provided (Arial, Segoe UI, etc.)"),
    init_font_size: Optional[int] = Form(60, description="Initial/maximum font size for rendering"),
    min_font_size: Optional[int] = Form(16, description="Minimum font size for rendering"),
    bbox_expand_ratio: Optional[float] = Form(1.15, description="Bounding box expansion ratio (1.15 = 15% larger)")
):
    """
    Complete manga translation pipeline: detection -> OCR -> translation.
    
    Optionally includes inpainting of the original text and rendering of translated text.
    Font size is automatically calculated to fit the bounding boxes.
    
    **Font handling for rendering:**
    - Auto-detects Unicode fonts from system (Arial, Segoe UI, DejaVu, etc.)
    - Provide `font_path` for custom fonts (recommended for better Vietnamese support)
    - Use `MANGA_TRANSLATE_DEFAULT_FONT` environment variable for server-wide default
    """
    try:
        logger.info(f"Full pipeline request - {source_lang} to {target_lang}")
        image = await load_image_from_upload(file)
        
        result = manga_service.full_translation_pipeline(
            image=image,
            source_lang=source_lang,
            target_lang=target_lang,
            detector=detector,
            ocr_model=ocr_model,
            translator=translator,
            inpainter=inpainter if include_inpainted else None,
            use_gpu=gpu,
            extra_context=extra_context,
            render_text=render_text if include_inpainted else False,
            font_path=font_path,
            init_font_size=init_font_size,
            min_font_size=min_font_size,
            bbox_expand_ratio=bbox_expand_ratio
        )
        
        logger.info(f"Full pipeline completed - processed {len(result['blocks'])} blocks")
        logger.info(f"Response keys: {list(result.keys())}")
        if 'rendered_image' in result:
            logger.info(f"rendered_image field present: {len(result['rendered_image'])} chars")
        else:
            logger.warning("rendered_image field NOT present in result!")
        
        return result
        
    except Exception as e:
        logger.error(f"Full pipeline error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/v1/models")
async def list_models():
    """
    List available models and their download status.
    
    Returns information about which models are downloaded and available.
    """
    try:
        from modules.utils.download import ModelDownloader, ModelID
        
        models_info = {}
        
        # Detection models
        models_info['detection'] = {
            'RT-DETR-V2': {
                'downloaded': ModelDownloader.is_downloaded(ModelID.RTDETRV2_ONNX),
                'description': 'Text and bubble detector (ONNX)'
            }
        }
        
        # OCR models
        models_info['ocr'] = {
            'Manga OCR (ONNX)': {
                'downloaded': ModelDownloader.is_downloaded(ModelID.MANGA_OCR_BASE_ONNX),
                'description': 'Japanese/Korean manga OCR (ONNX)',
                'languages': ['Japanese', 'Korean']
            },
            'Manga OCR (PyTorch)': {
                'downloaded': ModelDownloader.is_downloaded(ModelID.MANGA_OCR_BASE),
                'description': 'Japanese/Korean manga OCR (PyTorch)',
                'languages': ['Japanese', 'Korean']
            },
            'Pororo (ONNX)': {
                'downloaded': ModelDownloader.is_downloaded(ModelID.PORORO_ONNX),
                'description': 'Korean OCR (ONNX)',
                'languages': ['Korean']
            },
            'PPOCRv5 Detection': {
                'downloaded': ModelDownloader.is_downloaded(ModelID.PPOCR_V5_DET_MOBILE),
                'description': 'Chinese text detection'
            },
            'PPOCRv5 Chinese': {
                'downloaded': ModelDownloader.is_downloaded(ModelID.PPOCR_V5_REC_MOBILE),
                'description': 'Chinese text recognition',
                'languages': ['Chinese']
            },
            'PPOCRv5 English': {
                'downloaded': ModelDownloader.is_downloaded(ModelID.PPOCR_V5_REC_EN_MOBILE),
                'description': 'English text recognition',
                'languages': ['English']
            },
            'PPOCRv5 Korean': {
                'downloaded': ModelDownloader.is_downloaded(ModelID.PPOCR_V5_REC_KOREAN_MOBILE),
                'description': 'Korean text recognition',
                'languages': ['Korean']
            },
            'PPOCRv5 Latin': {
                'downloaded': ModelDownloader.is_downloaded(ModelID.PPOCR_V5_REC_LATIN_MOBILE),
                'description': 'Latin-based languages recognition',
                'languages': ['French', 'Spanish', 'German', 'Italian', 'Portuguese']
            },
            'PPOCRv5 Russian': {
                'downloaded': ModelDownloader.is_downloaded(ModelID.PPOCR_V5_REC_ESLAV_MOBILE),
                'description': 'East Slavic languages recognition',
                'languages': ['Russian']
            }
        }
        
        # Inpainting models
        models_info['inpainting'] = {
            'LaMa (ONNX)': {
                'downloaded': ModelDownloader.is_downloaded(ModelID.LAMA_ONNX),
                'description': 'Large mask inpainting (ONNX, fast)'
            },
            'LaMa (PyTorch)': {
                'downloaded': ModelDownloader.is_downloaded(ModelID.LAMA_JIT),
                'description': 'Large mask inpainting (PyTorch)'
            },
            'MI-GAN (ONNX)': {
                'downloaded': ModelDownloader.is_downloaded(ModelID.MIGAN_PIPELINE_ONNX),
                'description': 'Manga inpainting GAN (ONNX)'
            },
            'MI-GAN (PyTorch)': {
                'downloaded': ModelDownloader.is_downloaded(ModelID.MIGAN_JIT),
                'description': 'Manga inpainting GAN (PyTorch)'
            },
            'AOT (ONNX)': {
                'downloaded': ModelDownloader.is_downloaded(ModelID.AOT_ONNX),
                'description': 'Aggregated contextual transformation (ONNX)'
            },
            'AOT (PyTorch)': {
                'downloaded': ModelDownloader.is_downloaded(ModelID.AOT_JIT),
                'description': 'Aggregated contextual transformation (PyTorch)'
            }
        }
        
        # Count downloaded models
        total_models = 0
        downloaded_models = 0
        for category in models_info.values():
            for model_info in category.values():
                total_models += 1
                if model_info['downloaded']:
                    downloaded_models += 1
        
        return {
            'models': models_info,
            'summary': {
                'total': total_models,
                'downloaded': downloaded_models,
                'pending': total_models - downloaded_models
            }
        }
        
    except Exception as e:
        logger.error(f"Error listing models: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/api/v1/models/download")
async def download_models(
    categories: Optional[list] = None
):
    """
    Download models for specified categories.
    
    If no categories specified, downloads core models (detection, default OCR, default inpainting).
    """
    try:
        from modules.utils.download import ModelDownloader, ModelID
        
        downloaded = []
        
        if not categories or 'detection' in categories:
            logger.info("Downloading detection model...")
            ModelDownloader.get(ModelID.RTDETRV2_ONNX)
            downloaded.append('RT-DETR-V2 Detection')
        
        if not categories or 'ocr' in categories:
            logger.info("Downloading default OCR models...")
            ModelDownloader.get(ModelID.MANGA_OCR_BASE_ONNX)
            downloaded.append('Manga OCR (ONNX)')
            ModelDownloader.get(ModelID.PPOCR_V5_DET_MOBILE)
            downloaded.append('PPOCRv5 Detection')
            ModelDownloader.get(ModelID.PPOCR_V5_REC_EN_MOBILE)
            downloaded.append('PPOCRv5 English')
        
        if not categories or 'inpainting' in categories:
            logger.info("Downloading default inpainting model...")
            ModelDownloader.get(ModelID.LAMA_ONNX)
            downloaded.append('LaMa (ONNX)')
        
        return {
            'status': 'success',
            'downloaded': downloaded,
            'message': f'Successfully downloaded {len(downloaded)} model(s)'
        }
        
    except Exception as e:
        logger.error(f"Error downloading models: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

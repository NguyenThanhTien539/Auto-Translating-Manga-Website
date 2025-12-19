"""
Debug script để visualize text detection bboxes.
Giúp xác định xem detector có đang tách ký tự riêng lẻ không.
"""
import numpy as np
from PIL import Image, ImageDraw, ImageFont
import json


def visualize_bboxes(image: np.ndarray, blocks_data: list, output_path: str = "debug_bboxes.jpg"):
    """
    Vẽ bounding boxes lên ảnh để debug.
    
    Args:
        image: Input image
        blocks_data: List of detected blocks
        output_path: Path to save output image
    """
    # Convert to PIL
    if isinstance(image, np.ndarray):
        pil_image = Image.fromarray(image)
    else:
        pil_image = image.copy()
    
    draw = ImageDraw.Draw(pil_image)
    
    # Try to load a font, fallback to default if not available
    try:
        font = ImageFont.truetype("arial.ttf", 16)
    except:
        font = ImageFont.load_default()
    
    print(f"\n{'='*80}")
    print(f"BBOX ANALYSIS - Total blocks: {len(blocks_data)}")
    print(f"{'='*80}\n")
    
    for idx, block in enumerate(blocks_data):
        bbox = block.get('bbox', [])
        text = block.get('text', '')
        translation = block.get('translation', '')
        
        if len(bbox) >= 4:
            x1, y1, x2, y2 = map(int, bbox[:4])
            width = x2 - x1
            height = y2 - y1
            area = width * height
            
            # Analyze bbox size
            is_suspicious = False
            warnings = []
            
            # Check if bbox is too small (likely single character)
            if width < 30 and height < 30:
                is_suspicious = True
                warnings.append("⚠️  Very small bbox (likely 1 char)")
            
            # Check aspect ratio
            aspect_ratio = width / height if height > 0 else 0
            if aspect_ratio < 0.5:  # Too narrow
                warnings.append("⚠️  Too narrow (single char?)")
            
            # Check text length vs bbox size
            if text and len(text) == 1 and area > 500:
                warnings.append("⚠️  Large bbox but only 1 char detected")
            
            # Color code based on suspicion
            color = "red" if is_suspicious else "green"
            
            # Draw bbox
            draw.rectangle([x1, y1, x2, y2], outline=color, width=2)
            
            # Draw label
            label = f"#{idx}: {text or '?'}"
            draw.text((x1, y1 - 20), label, fill=color, font=font)
            
            # Print analysis
            status = "🔴 SUSPICIOUS" if is_suspicious else "✅ OK"
            print(f"Block #{idx} {status}")
            print(f"  Bbox: ({x1}, {y1}) → ({x2}, {y2})")
            print(f"  Size: {width}x{height} px (area: {area})")
            print(f"  Text: '{text}' (len: {len(text)})")
            print(f"  Translation: '{translation}'")
            if warnings:
                for warning in warnings:
                    print(f"  {warning}")
            print()
    
    # Save debug image
    pil_image.save(output_path)
    print(f"\n{'='*80}")
    print(f"Debug image saved to: {output_path}")
    print(f"{'='*80}\n")
    
    return pil_image


def analyze_detection_quality(blocks_data: list):
    """
    Phân tích chất lượng detection.
    """
    total = len(blocks_data)
    single_char = 0
    small_bbox = 0
    empty_text = 0
    
    for block in blocks_data:
        text = block.get('text', '')
        bbox = block.get('bbox', [])
        
        if len(text) == 1:
            single_char += 1
        
        if len(bbox) >= 4:
            x1, y1, x2, y2 = bbox[:4]
            if (x2 - x1) < 30 and (y2 - y1) < 30:
                small_bbox += 1
        
        if not text:
            empty_text += 1
    
    print(f"\n{'='*80}")
    print(f"DETECTION QUALITY ANALYSIS")
    print(f"{'='*80}")
    print(f"Total blocks: {total}")
    print(f"Single character blocks: {single_char} ({single_char/total*100:.1f}%)")
    print(f"Small bboxes (<30x30): {small_bbox} ({small_bbox/total*100:.1f}%)")
    print(f"Empty text: {empty_text} ({empty_text/total*100:.1f}%)")
    
    # Warnings
    if single_char / total > 0.3:
        print(f"\n⚠️  WARNING: {single_char/total*100:.1f}% blocks are single characters!")
        print(f"   → Detection model may be splitting text into individual characters")
        print(f"   → Consider using a different detector or adjusting detection threshold")
    
    if small_bbox / total > 0.3:
        print(f"\n⚠️  WARNING: {small_bbox/total*100:.1f}% bboxes are very small!")
        print(f"   → Detector may be over-segmenting")
    
    print(f"{'='*80}\n")
    
    return {
        'total': total,
        'single_char': single_char,
        'small_bbox': small_bbox,
        'empty_text': empty_text
    }


# Example usage in API endpoint:
"""
from modules.ocr.debug_bbox import visualize_bboxes, analyze_detection_quality

# After detection step:
detection_result = manga_service.detect_text_blocks(image)
blocks = detection_result['blocks']

# Visualize and analyze
visualize_bboxes(image, blocks, "debug_detection.jpg")
analyze_detection_quality(blocks)
"""

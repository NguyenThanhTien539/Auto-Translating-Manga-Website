import numpy as np
import cv2
from typing import List
from PIL import Image
import logging

from .base import OCREngine
from modules.utils.textblock import TextBlock

logger = logging.getLogger(__name__)

class VietOCREngine(OCREngine):
    """Vietnamese OCR engine using VietOCR models with Multi-line Support."""
    
    def __init__(self):
        super().__init__()
        self.predictor = None
        self.device = 'cpu'
    
    def initialize(self, device: str = 'cpu'):
        try:
            from vietocr.tool.predictor import Predictor
            from vietocr.tool.config import Cfg
            
            logger.info("Initializing VietOCR engine...")
            
            # Sử dụng vgg_transformer (hoặc vgg_seq2seq nếu muốn nhanh hơn)
            config = Cfg.load_config_from_name('vgg_transformer')
            config['device'] = 'cuda:0' if device == 'cuda' else 'cpu'
            config['predictor']['beamsearch'] = False # Tắt beamsearch để tăng tốc
            
            self.predictor = Predictor(config)
            self.device = device
            logger.info(f"VietOCR initialized successfully on {device}")
            
        except Exception as e:
            logger.error(f"Failed to initialize VietOCR: {e}")
            raise RuntimeError(f"VietOCR initialization failed: {e}")

    def _split_lines(self, img_cv2: np.ndarray) -> List[np.ndarray]:
        """
        Phiên bản tối ưu cho Manga có nền chấm hạt (Screen Tone) 
        và chữ có viền trắng.
        """
        if len(img_cv2.shape) == 3:
            gray = cv2.cvtColor(img_cv2, cv2.COLOR_BGR2GRAY)
        else:
            gray = img_cv2
            
        h_img, w_img = gray.shape
        
        # 1. Adaptive Threshold
        # BlockSize=25 (tăng lên xíu để nhìn vùng rộng hơn)
        # C=10 (độ lệch để quyết định đen/trắng)
        binary = cv2.adaptiveThreshold(
            gray, 255, 
            cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
            cv2.THRESH_BINARY_INV, 
            25, 10
        )
        
        # 2. KHỬ NHIỄU MẠNH (Quan trọng cho ảnh này)
        # Ảnh ví dụ của bạn có nền là các chấm li ti.
        # Ta dùng kernel to hơn một chút để xóa sạch các chấm đó, chỉ giữ lại nét chữ dày.
        
        # Kernel (2,2) hoặc (3,3) tùy độ phân giải ảnh. 
        # Nếu ảnh nét cao (HD), dùng (3,3). Ảnh mờ dùng (2,2).
        morph_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (2, 2))
        
        # MORPH_OPEN = Erode (ăn mòn) rồi Dilate (nở ra) -> Xóa các điểm nhỏ hơn kernel
        clean_binary = cv2.morphologyEx(binary, cv2.MORPH_OPEN, morph_kernel, iterations=1)
        
        # 3. Nối liền chữ thành dòng (Dilation)
        # Chỉ giãn theo chiều ngang
        dilate_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (30, 1))
        dilated = cv2.dilate(clean_binary, dilate_kernel, iterations=1)
        
        # 4. Tìm Contours (Như cũ)
        contours, _ = cv2.findContours(dilated, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        contours = sorted(contours, key=lambda ctr: cv2.boundingRect(ctr)[1])
        
        lines = []
        
        # Tính chiều cao trung bình
        valid_heights = [cv2.boundingRect(c)[3] for c in contours if cv2.boundingRect(c)[3] > 8]
        if not valid_heights: return [img_cv2]
        avg_h = np.median(valid_heights)

        for ctr in contours:
            x, y, w, h = cv2.boundingRect(ctr)
            
            # Lọc nhiễu kỹ hơn:
            # - Bỏ qua cái quá bé (chấm còn sót)
            # - Bỏ qua cái quá mỏng (đường kẻ)
            if h < 10 or w < 10: continue
            if h > avg_h * 4: continue # Bỏ đường kẻ panel dọc
            
            # Padding:
            # Với chữ có viền trắng, ta nên lấy rộng ra một chút để VietOCR nhìn thấy cả viền
            pad_y = 4 
            y_start = max(0, y - pad_y)
            y_end = min(h_img, y + h + pad_y)
            x_start = max(0, x)
            x_end = min(w_img, x + w)
            
            lines.append(img_cv2[y_start:y_end, x_start:x_end])
            
        if not lines: return [img_cv2]
        return lines

    def process_image(self, image: np.ndarray, blk_list: List[TextBlock]) -> List[TextBlock]:
        if self.predictor is None:
            raise RuntimeError("VietOCR not initialized.")
        
        # Đảm bảo input là numpy array cho OpenCV xử lý
        if isinstance(image, Image.Image):
            image = np.array(image)
        
        # Chuyển RGB sang BGR cho OpenCV nếu cần (PIL mặc định là RGB, cv2 là BGR)
        # Nhưng ở đây ta chỉ cắt nên RGB hay BGR không quan trọng lắm, miễn thống nhất
        
        logger.info(f"Processing {len(blk_list)} blocks with VietOCR (Multi-line Split)")
        
        for idx, blk in enumerate(blk_list):
            try:
                x1, y1, x2, y2 = map(int, blk.xyxy)
                
                # Validate bbox
                if x2 <= x1 or y2 <= y1: continue
                
                # 1. Cắt đoạn văn (Bong bóng thoại)
                bubble_img = image[y1:y2, x1:x2]
                
                if bubble_img.size == 0: continue
                
                # 2. TÁCH DÒNG (Bước quan trọng mới thêm)
                text_lines_imgs = self._split_lines(bubble_img)
                
                full_text_parts = []
                
                # 3. Đọc từng dòng
                for line_img in text_lines_imgs:
                    # Chuyển về PIL để đưa vào VietOCR
                    line_pil = Image.fromarray(line_img)
                    
                    # Resize/Preprocess nếu cần (VietOCR tự handle resize khá tốt)
                    # Nhưng tốt nhất nên giữ chiều cao khoảng 32px
                    
                    # Predict
                    text = self.predictor.predict(line_pil)
                    if text.strip():
                        full_text_parts.append(text.strip())
                
                # 4. Gộp kết quả
                blk.text = " ".join(full_text_parts) # Hoặc "\n".join() nếu muốn giữ xuống dòng
                
            except Exception as e:
                logger.warning(f"Block {idx}: VietOCR process failed - {e}")
                blk.text = ""
        
        return blk_list

    # Giữ nguyên hàm recognize() cũ hoặc update tương tự nếu cần dùng lẻ
    
    def recognize(self, image: np.ndarray) -> str:
        """
        Recognize text from a single image region.
        
        Args:
            image: Image region as numpy array or PIL Image
            
        Returns:
            Recognized text string
        """
        if self.predictor is None:
            raise RuntimeError("VietOCR not initialized. Call initialize() first.")
        
        # Convert to PIL Image if needed
        if isinstance(image, np.ndarray):
            pil_image = Image.fromarray(image)
        else:
            pil_image = image
        
        try:
            # Preprocess before recognition
            preprocessed = self._preprocess_image(pil_image)
            text = self.predictor.predict(preprocessed)
            return text.strip()
        except Exception as e:
            logger.error(f"VietOCR recognition failed: {e}")
            return ""
    
    def __del__(self):
        """Cleanup resources."""
        self.predictor = None

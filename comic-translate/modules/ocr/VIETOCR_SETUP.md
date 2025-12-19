# VietOCR Installation Guide

## 📦 Cài đặt VietOCR

### Option 1: Cài đặt cơ bản (CPU)
```bash
pip install vietocr
```

### Option 2: Với GPU support
```bash
pip install vietocr
pip install torch torchvision  # Nếu chưa có
```

### Option 3: Từ source (latest version)
```bash
pip install git+https://github.com/pbcquoc/vietocr.git
```

## 🎯 Models

VietOCR sẽ tự động tải models khi chạy lần đầu:
- **vgg_transformer**: ~50MB (khuyên dùng - cân bằng tốc độ/độ chính xác)
- **vgg_seq2seq**: ~45MB (nhanh hơn, độ chính xác thấp hơn)
- **resnet_transformer**: ~85MB (chậm hơn, độ chính xác cao nhất)

## 🚀 Test VietOCR

```python
from vietocr.tool.predictor import Predictor
from vietocr.tool.config import Cfg
from PIL import Image

# Load config
config = Cfg.load_config_from_name('vgg_transformer')
config['device'] = 'cpu'  # or 'cuda:0'
config['predictor']['beamsearch'] = False

# Create predictor
detector = Predictor(config)

# Test
img = Image.open('test_image.jpg')
text = detector.predict(img)
print(f"Recognized: {text}")
```

## ⚠️ Lưu ý

1. **Dependencies**: VietOCR cần PyTorch, có thể conflict với ONNX runtime
2. **Model size**: Models sẽ được tải về `~/.vietocr/` lần đầu chạy
3. **GPU**: Cần CUDA nếu muốn dùng GPU acceleration
4. **Memory**: Cần ~500MB RAM cho model

## 🔧 Troubleshooting

### Lỗi: "No module named 'vietocr'"
```bash
pip install vietocr
```

### Lỗi: "CUDA out of memory"
```python
# Trong manga_service.py, set use_gpu=False
config['device'] = 'cpu'
```

### Lỗi: Model download failed
```bash
# Manual download từ HuggingFace:
# https://huggingface.co/pbcquoc/vietocr
# Đặt vào ~/.vietocr/weights/
```

## 📊 Performance

**Accuracy trên Vietnamese text:**
- Printed text: ~95-98%
- Handwritten: ~85-90%
- Low quality scans: ~80-85%

**Speed:**
- CPU: ~100-200ms per text region
- GPU: ~20-50ms per text region

## 🎨 Alternatives

Nếu VietOCR không hoạt động, có thể dùng:
1. **PaddleOCR** với Vietnamese model
2. **Tesseract** với vie.traineddata
3. **EasyOCR** (hỗ trợ Vietnamese)

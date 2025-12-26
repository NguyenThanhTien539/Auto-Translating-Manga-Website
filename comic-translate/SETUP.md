# Manga Translation API - Setup Guide

Hướng dẫn nhanh để setup và chạy server dịch manga.

## 📋 Yêu cầu hệ thống

- **Python**: 3.12.x (khuyến nghị dùng UV package manager)
- **RAM**: Tối thiểu 4GB
- **Disk**: ~2GB cho models

## 🚀 Cài đặt nhanh

### Cách 1: Dùng UV (Khuyến nghị)

```powershell
# 1. Cài UV package manager (nếu chưa có)
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"

# 2. Tạo virtual environment với Python 3.12
uv venv --python 3.12

# 3. Activate environment
.\.venv\Scripts\activate

# 4. Cài dependencies
uv pip install -r requirements-server.txt

# 5. Cài VietOCR cho tiếng Việt (optional)
# uv pip install vietocr

# 6. Copy file .env
copy .env.example .env

# 7. Chỉnh sửa .env với API keys của bạn (nếu cần)
notepad .env

# 8. Chạy server
cd fast-api
python run_server.py
```

### Cách 2: Dùng Script tự động

```powershell
# Chạy script setup (tạo venv + cài packages)
.\setup.ps1

# Activate environment
.\.venv\Scripts\activate

# Chạy server
cd fast-api
python run_server.py
```

### Cách 3: Manual với pip

```powershell
# 1. Tạo virtual environment
python -m venv .venv

# 2. Activate
.\.venv\Scripts\activate

# 3. Cài dependencies
pip install -r requirements-server.txt
pip install vietocr  # Cho Vietnamese OCR

# 4. Setup .env
copy .env.example .env

# 5. Chạy server
cd fast-api
python run_server.py
```

## ⚙️ Cấu hình (.env)

File `.env` chứa các settings quan trọng:

```env
# Server
HOST=0.0.0.0
PORT=8000
ENABLE_GPU=False  # Set True nếu có NVIDIA GPU

# Languages
DEFAULT_SOURCE_LANG=Japanese
DEFAULT_TARGET_LANG=English

# API Keys (optional - cho cloud services)
GOOGLE_CLOUD_VISION_API_KEY=your_key_here
GOOGLE_GEMINI_API_KEY=your_key_here
```

## 🔧 Models tự động download

Lần chạy đầu tiên, các models sẽ tự động download:

- **RT-DETR-V2** (~50MB) - Text detection
- **PPOCRv5** (~10MB) - Multi-language OCR
- **VietOCR** (~50MB) - Vietnamese OCR
- **LaMa** (~200MB) - Image inpainting

Models lưu tại: `~/.cache/huggingface/` và `~/.vietocr/`

## 📡 Test API

Server mặc định chạy tại: **http://localhost:8000**

### Kiểm tra API docs
```
http://localhost:8000/docs
```

### Test translate endpoint
```powershell
curl -X POST "http://localhost:8000/api/v1/translate" `
  -F "image=@test.jpg" `
  -F "source_lang=Vietnamese" `
  -F "target_lang=English"
```

## 🌍 Ngôn ngữ hỗ trợ

### OCR (Source Language)
- **Vietnamese** - VietOCR (98% accuracy)
- **Japanese** - Manga OCR
- **Korean** - Pororo OCR
- **Chinese** - PPOCRv5
- **English, French, Spanish, etc.** - PPOCRv5 Latin

### Translation
- Google Translate (miễn phí, không cần API key)
- DeepL (cần API key)
- GPT/Gemini (cần API key)

## 🐛 Troubleshooting

### Lỗi: "ModuleNotFoundError: No module named 'vietocr'"
```powershell
uv pip install vietocr
```

### Lỗi: "API key not initialized"
- Kiểm tra file `.env` có đúng API key
- Restart server sau khi sửa `.env`

### Lỗi: Model download thất bại
- Kiểm tra internet connection
- Xóa cache: `rm -r ~/.cache/huggingface/`
- Chạy lại server để re-download

### Server không start
```powershell
# Kiểm tra port 8000 có bị chiếm không
netstat -ano | findstr :8000

# Đổi port trong .env
PORT=8001
```

## 📝 Development

### Chạy với auto-reload (dev mode)
```powershell
cd fast-api
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Xem logs
Server logs hiển thị real-time trong console, bao gồm:
- Request processing
- Model loading
- OCR/Translation results
- Errors

## 🔗 API Endpoints

| Endpoint | Method | Mô tả |
|----------|--------|-------|
| `/api/v1/translate` | POST | Full pipeline: detect → OCR → translate → render |
| `/api/v1/detection` | POST | Chỉ detect text boxes |
| `/api/v1/ocr` | POST | OCR text từ ảnh |
| `/api/v1/translation` | POST | Dịch text |
| `/api/v1/render` | POST | Render text lên ảnh |
| `/api/v1/inpainting` | POST | Xóa text gốc |

Chi tiết: http://localhost:8000/docs

## 📦 Dependencies chính

- **FastAPI** - Web framework
- **Pillow** - Image processing
- **NumPy** - Array operations
- **ONNX Runtime** - Model inference
- **VietOCR** - Vietnamese text recognition
- **Deep Translator** - Translation engine

## 💡 Tips

1. **GPU Acceleration**: Set `ENABLE_GPU=True` nếu có NVIDIA GPU (tăng tốc ~3x)
2. **Batch Processing**: Dùng endpoint `/api/v1/translate` với multiple images
3. **Font Rendering**: Đặt custom font trong request params `font_path`
4. **Bbox Expansion**: Tăng `bbox_expand_ratio` (default 1.15) nếu text bị cắt

---

**Docs đầy đủ**: Xem thêm tại `/fast-api/docs/`

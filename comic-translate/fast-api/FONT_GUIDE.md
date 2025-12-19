# Font Configuration Guide

## 🎨 Font Handling trong Manga Translation API

API tự động tìm và sử dụng font hệ thống phù hợp cho rendering text. Các font được ưu tiên hỗ trợ Unicode để hiển thị tốt tiếng Việt.

---

## 🔍 Cách hoạt động

### 1. **Auto-detection (Mặc định)**
API tự động tìm font từ các vị trí sau theo thứ tự ưu tiên:

#### Windows:
- `C:/Windows/Fonts/Arial.ttf`
- `C:/Windows/Fonts/segoeui.ttf` ⭐ (Khuyên dùng - hỗ trợ tốt tiếng Việt)
- `C:/Windows/Fonts/ArialUni.ttf`
- `C:/Windows/Fonts/times.ttf`
- `C:/Windows/Fonts/verdana.ttf`

#### Linux:
- `/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf`
- `/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf`
- `/usr/share/fonts/truetype/noto/NotoSans-Regular.ttf`

#### macOS:
- `/System/Library/Fonts/Helvetica.ttc`
- `/System/Library/Fonts/SFNSText.ttf`

### 2. **Custom Font Path**
Truyền tham số `font_path` khi gọi API:

```python
# Sử dụng font tùy chỉnh
response = requests.post('http://localhost:8000/api/v1/render', data={
    'file': image_file,
    'blocks': json.dumps(blocks),
    'font_path': 'D:/Fonts/MyVietnameseFont.ttf'
})
```

### 3. **Environment Variable**
Set biến môi trường `MANGA_TRANSLATE_DEFAULT_FONT` để dùng cho toàn server:

**Windows PowerShell:**
```powershell
$env:MANGA_TRANSLATE_DEFAULT_FONT = "C:/Windows/Fonts/segoeui.ttf"
python -m uvicorn app.main:app --reload
```

**Linux/macOS:**
```bash
export MANGA_TRANSLATE_DEFAULT_FONT="/usr/share/fonts/truetype/noto/NotoSans-Regular.ttf"
python -m uvicorn app.main:app --reload
```

---

## 📝 Ví dụ sử dụng

### API `/api/v1/render`

```python
import requests
import json

# 1. Không chỉ định font (auto-detect)
response = requests.post('http://localhost:8000/api/v1/render', data={
    'file': open('inpainted.png', 'rb'),
    'blocks': json.dumps(translation_blocks),
    'bbox_expand_ratio': 1.2,
    'init_font_size': 70
})

# 2. Chỉ định font cụ thể
response = requests.post('http://localhost:8000/api/v1/render', data={
    'file': open('inpainted.png', 'rb'),
    'blocks': json.dumps(translation_blocks),
    'font_path': 'C:/Windows/Fonts/segoeui.ttf',  # Segoe UI cho tiếng Việt
    'font_color': '#000000',
    'bbox_expand_ratio': 1.15
})
```

### API `/api/v1/translate` (Full pipeline)

```python
# Pipeline với custom font
response = requests.post('http://localhost:8000/api/v1/translate', data={
    'file': open('manga_page.jpg', 'rb'),
    'source_lang': 'Japanese',
    'target_lang': 'Vietnamese',
    'include_inpainted': True,
    'render_text': True,
    'font_path': 'C:/Windows/Fonts/arial.ttf',
    'bbox_expand_ratio': 1.2,  # 20% lớn hơn cho text tiếng Việt dài
    'init_font_size': 60,
    'min_font_size': 16
})
```

---

## 🌏 Khuyến nghị Font cho Tiếng Việt

### ⭐ Tốt nhất (Windows):
- **Segoe UI** (`C:/Windows/Fonts/segoeui.ttf`)
- **Arial Unicode MS** (`C:/Windows/Fonts/ArialUni.ttf`)

### ✅ Khả dụng (Windows):
- Arial, Times New Roman, Verdana

### ⭐ Tốt nhất (Linux):
- **Noto Sans** (`/usr/share/fonts/truetype/noto/NotoSans-Regular.ttf`)
- **DejaVu Sans** (`/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf`)

---

## ⚙️ Tham số Rendering

| Tham số | Mặc định | Mô tả |
|---------|----------|-------|
| `font_path` | Auto-detect | Đường dẫn đến file font |
| `font_color` | `#000000` | Màu text (hex format) |
| `init_font_size` | `60` | Kích thước font tối đa |
| `min_font_size` | `16` | Kích thước font tối thiểu |
| `bbox_expand_ratio` | `1.15` | Tỷ lệ mở rộng bbox (15%) |
| `outline` | `true` | Vẽ viền trắng quanh chữ |

---

## 🔧 Troubleshooting

### ❌ Lỗi: "No font available"
**Nguyên nhân:** Không tìm thấy font trong hệ thống

**Giải pháp:**
1. Chỉ định font path trực tiếp: `font_path='C:/Windows/Fonts/arial.ttf'`
2. Set environment variable: `MANGA_TRANSLATE_DEFAULT_FONT`
3. Cài đặt font Unicode trong hệ thống

### ❌ Chữ tiếng Việt bị lỗi hiển thị
**Nguyên nhân:** Font không hỗ trợ Unicode đầy đủ

**Giải pháp:**
- Windows: Dùng Segoe UI hoặc Arial Unicode MS
- Linux: Dùng Noto Sans hoặc DejaVu Sans
- Tải font Vietnamese-specific: [Google Fonts](https://fonts.google.com/?subset=vietnamese)

### ❌ Font quá nhỏ/lớn
**Giải pháp:**
```python
# Điều chỉnh font size range
data = {
    'init_font_size': 80,  # Tăng font tối đa
    'min_font_size': 20,   # Tăng font tối thiểu
    'bbox_expand_ratio': 1.3  # Mở rộng bbox nhiều hơn
}
```

---

## 📚 Best Practices

1. **Luôn chỉ định `bbox_expand_ratio` cho tiếng Việt**
   - Tiếng Việt thường dài hơn tiếng Nhật/Anh
   - Khuyến nghị: `1.15` - `1.3` (15%-30% lớn hơn)

2. **Sử dụng font Unicode-compatible**
   - Ưu tiên: Segoe UI (Windows), Noto Sans (Linux)
   - Tránh: Font chuyên dụng không hỗ trợ Vietnamese

3. **Test với nhiều kích thước font**
   - Điều chỉnh `init_font_size` và `min_font_size`
   - Auto-scaling sẽ tìm kích thước phù hợp nhất

4. **Dùng environment variable cho production**
   - Set `MANGA_TRANSLATE_DEFAULT_FONT` khi deploy
   - Đảm bảo consistency across requests

---

## 💡 Tips

- **Check font có sẵn:** Vào `C:/Windows/Fonts` (Windows) hoặc `/usr/share/fonts` (Linux)
- **Download thêm font:** [Google Fonts - Vietnamese](https://fonts.google.com/?subset=vietnamese)
- **Test font compatibility:** Dùng `/api/v1/render` endpoint trước khi chạy full pipeline

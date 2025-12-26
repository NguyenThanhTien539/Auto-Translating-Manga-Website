#!/bin/bash

# Dừng script ngay lập tức nếu có bất kỳ lệnh nào bị lỗi
set -e

echo "=================================================="
echo "   BẮT ĐẦU CÀI ĐẶT SERVER TRANSLATE (UBUNTU)      "
echo "=================================================="

# 1. Cài đặt thư viện hệ thống cần thiết (quan trọng cho Pillow, OnnxRuntime, Mahotas)
echo "[1/6] Cài đặt thư viện hệ thống (System Dependencies)..."
sudo apt-get update
# libgl1 và libglib2.0-0 rất cần thiết cho các thư viện xử lý ảnh trên Linux
sudo apt-get install -y libgl1 libglib2.0-0 curl

# 2. Cài đặt UV Package Manager (nếu chưa có)
if ! command -v uv &> /dev/null; then
    echo "[2/6] Đang tải và cài đặt UV..."
    curl -LsSf https://astral.sh/uv/install.sh | sh
    
    # Cập nhật đường dẫn môi trường ngay lập tức
    source $HOME/.cargo/env
else
    echo "[2/6] UV đã được cài đặt, bỏ qua bước này."
fi

# Đảm bảo lệnh uv chạy được
export PATH="$HOME/.cargo/bin:$PATH"

# 3. Tạo file requirements-server.txt từ nội dung bạn cung cấp
echo "[3/6] Tạo file requirements-server.txt..."
cat <<EOF > requirements-server.txt
# Backend Server Requirements
mahotas>=1.4.18
pillow>=11.0.0
numpy>=2.2.6

# API server
fastapi>=0.115.0
uvicorn[standard]>=0.30.0
pydantic>=2.9.0
pydantic-settings>=2.5.0
python-multipart>=0.0.9

# Utilities
msgpack>=1.1.0
requests>=2.31.0

# Translation services
deepl>=1.16.1
deep-translator>=1.11.4

# Language processing
jieba>=0.42.1
janome>=0.5.0
pythainlp>=5.1.2
jaconv>=0.3.4

# ML/AI
huggingface-hub>=0.34.4
wget>=3.2
onnxruntime>=1.22.1

# Geometry processing
shapely>=2.1.1
pyclipper>=1.3.0.post6
six>=1.16.0

# Optional cloud OCR/Translation
azure-ai-vision-imageanalysis>=1.0.0b1
EOF

# 4. Tạo môi trường ảo với Python 3.12 và cài đặt thư viện
echo "[4/6] Đang tạo Virtual Environment (Python 3.12)..."
uv venv --python 3.12

echo "-> Kích hoạt môi trường và cài đặt dependencies..."
source .venv/bin/activate

# Cài đặt requirements
uv pip install -r requirements-server.txt

# Cài đặt VietOCR (Optional như yêu cầu)
echo "-> Cài đặt VietOCR..."
uv pip install vietocr

# 5. Thiết lập file .env
echo "[5/6] Thiết lập file cấu hình .env..."
if [ ! -f .env ]; then
    if [ -f .env.example ]; then
        cp .env.example .env
        echo "-> Đã copy .env.example sang .env"
    else
        touch .env
        echo "-> Không thấy .env.example, đã tạo file .env trống."
    fi
else
    echo "-> File .env đã tồn tại, giữ nguyên."
fi

# 6. Hướng dẫn chạy
echo "=================================================="
echo "          CÀI ĐẶT HOÀN TẤT!                       "
echo "=================================================="
echo ""
echo "Để chạy server, hãy dùng lệnh sau:"
echo ""
echo "source .venv/bin/activate"
echo "cd fast-api"
echo "python run_server.py"
echo ""
echo "Lưu ý: Đừng quên sửa file .env nếu cần API Key."
echo "=================================================="
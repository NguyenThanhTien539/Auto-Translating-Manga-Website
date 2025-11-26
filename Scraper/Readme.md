# TruyenQQ Downloader (Smart ZIP Optimized)

Tool tải truyện tranh tự động từ TruyenQQ, được tối ưu hóa cho tốc độ và khả năng lưu trữ. Tool hỗ trợ tải hàng loạt theo ID, xử lý đa luồng (Multi-threading) và đóng gói trực tiếp thành file `.zip`.

## 🚀 Tính năng nổi bật

* **Smart Rate Limiting (Token Bucket):** Kiểm soát tốc độ tải ổn định, tránh bị chặn IP.
* **Exponential Backoff:** Tự động chờ và thử lại thông minh khi server quá tải hoặc lỗi mạng.
* **ZIP Storage:** Lưu mỗi chương truyện thành 1 file `.zip` (Store mode) giúp giảm số lượng file trên ổ cứng và tăng tốc độ ghi.
* **Multi-threading:** Tải song song nhiều ảnh cùng lúc để tối đa hóa băng thông.
* **CLI Support:** Chạy trực tiếp trên Terminal/CMD với các tham số tùy chỉnh.

## 🛠 Cài đặt

Yêu cầu máy tính đã cài sẵn **Python 3.x**.

1. Cài đặt các thư viện cần thiết:
```bash
pip install requests beautifulsoup4
````

2.  Lưu file code chính thành `smart_scraper_zip.py`.

## 📖 Hướng dẫn sử dụng

Mở Terminal (hoặc CMD/PowerShell) tại thư mục chứa file script và chạy lệnh theo cú pháp:

```bash
python smart_scraper_zip.py --start <ID_ĐẦU> --end <ID_CUỐI> [TÙY_CHỌN_KHÁC]
```

### Bảng tham số (Arguments)

| Tham số | Bắt buộc | Mặc định | Mô tả |
| :--- | :---: | :---: | :--- |
| `--start` | ✅ | - | ID truyện bắt đầu quét (VD: 1000) |
| `--end` | ✅ | - | ID truyện kết thúc quét (VD: 1010) |
| `--limit` | ❌ | 3 | Số chapter tối đa muốn tải mỗi truyện (để 0 nếu muốn tải hết) |
| `--output` | ❌ | `Downloads_Zip` | Thư mục lưu truyện |
| `--threads` | ❌ | 6 | Số luồng tải ảnh song song |
| `--rate` | ❌ | 8 | Tốc độ tối đa (requests/giây) |

### Ví dụ chạy lệnh

**1. Cơ bản (Tải truyện ID 11318, lấy 3 chap đầu):**

```bash
python smart_scraper_zip.py --start 11318 --end 11318
```

**2. Tải nhiều truyện (Từ ID 11310 đến 11320), lưu vào ổ E:**

```bash
python smart_scraper_zip.py --start 11310 --end 11320 --output "E:/TruyenTranh"
```

**3. Tải "khô máu" (Tải hết chapter, tăng tốc độ):**
*Lưu ý: Chỉ dùng khi mạng khỏe và cần tải nhanh.*

```bash
python smart_scraper_zip.py --start 11318 --end 11318 --limit 0 --threads 10 --rate 15
```

## ⚠️ Lưu ý quan trọng

  * **Mục đích học tập:** Tool được viết với mục đích nghiên cứu kỹ thuật Web Scraping, Token Bucket và xử lý đa luồng trong Python.
  * **Trách nhiệm:** Vui lòng không sử dụng tool để spam request hoặc tấn công (DDOS) trang web đích. Tác giả không chịu trách nhiệm về việc IP của bạn bị chặn do lạm dụng tool.
  * **ID Truyện:** ID là số nằm trên URL (ví dụ: `truyen-tranh/ten-truyen-12345` thì ID là `12345`).

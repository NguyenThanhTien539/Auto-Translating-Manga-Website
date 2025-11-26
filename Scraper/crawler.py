import requests
from bs4 import BeautifulSoup
import os
import re
import time
import random
import concurrent.futures
import argparse
import threading
from urllib.parse import urlparse

# --- CLASS 1: TOKEN BUCKET (ĐIỀU TỐC) ---
class TokenBucket:
    """
    Thuật toán Token Bucket để giới hạn tốc độ request toàn cục.
    Ví dụ: Cho phép 5 requests/giây. Nếu hết token, các thread phải chờ.
    """
    def __init__(self, rate_per_second, capacity):
        self.rate = rate_per_second # Tốc độ nạp token (token/giây)
        self.capacity = capacity    # Dung lượng tối đa của xô
        self.tokens = capacity      # Số token hiện tại
        self.last_refill = time.time()
        self.lock = threading.Lock() # Khóa để an toàn khi chạy đa luồng

    def consume(self, tokens=1):
        """Tiêu thụ token. Nếu chưa đủ, hàm sẽ block (ngủ) cho đến khi đủ."""
        with self.lock:
            now = time.time()
            # 1. Nạp thêm token dựa trên thời gian trôi qua
            elapsed = now - self.last_refill
            refill_amount = elapsed * self.rate
            self.tokens = min(self.capacity, self.tokens + refill_amount)
            self.last_refill = now

            # 2. Kiểm tra đủ token chưa
            if self.tokens >= tokens:
                self.tokens -= tokens
                return True
            else:
                # Tính thời gian cần chờ để có đủ token
                deficit = tokens - self.tokens
                wait_time = deficit / self.rate
                return wait_time # Trả về số giây cần chờ

# --- CLASS 2: SMART REQUESTER (BACKOFF) ---
class SmartSession:
    """
    Wrapper quanh requests.Session để tích hợp:
    1. Token Bucket (Rate Limit)
    2. Random User-Agent
    3. Exponential Backoff (Thử lại thông minh)
    """
    def __init__(self, rate_limit=5):
        self.session = requests.Session()
        # Rate limit: 5 req/s, burst tối đa 10 req
        self.bucket = TokenBucket(rate_per_second=rate_limit, capacity=rate_limit*2)
        self.user_agents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36'
        ]

    def update_headers(self, referer):
        self.session.headers.update({
            'User-Agent': random.choice(self.user_agents),
            'Referer': referer,
            'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        })

    def get(self, url, max_retries=3):
        """Gửi request với cơ chế chờ token và Backoff"""
        retry_count = 0
        backoff_time = 2 # Bắt đầu chờ 2 giây nếu lỗi

        while retry_count <= max_retries:
            # 1. Kiểm tra Token Bucket
            wait = self.bucket.consume()
            if wait is not True:
                # Nếu hết token, ngủ đúng thời gian cần thiết
                time.sleep(wait)
                # Sau khi ngủ xong, đệ quy gọi lại hoặc tiếp tục vòng lặp (ở đây gọi lại consume trong vòng sau)
                continue 

            # 2. Thực hiện Request
            try:
                response = self.session.get(url, stream=True, timeout=15)
                
                # 3. Xử lý kết quả
                if response.status_code == 200:
                    return response
                elif response.status_code in [429, 500, 502, 503]:
                    # Lỗi server/Limit -> Kích hoạt Backoff
                    print(f"   [WARN] Server bận ({response.status_code}). Chờ {backoff_time}s...")
                    time.sleep(backoff_time)
                    backoff_time *= 2 # Gấp đôi thời gian chờ (Exponential)
                    retry_count += 1
                elif response.status_code == 404:
                    return None # Không tìm thấy thì không retry
                else:
                    return None # Lỗi khác (403, 401...)
            
            except Exception as e:
                print(f"   [ERR] Lỗi kết nối: {e}. Retry...")
                time.sleep(backoff_time)
                backoff_time *= 2
                retry_count += 1
        
        print(f"   [FAIL] Bỏ qua {url} sau {max_retries} lần thử.")
        return None

# --- UTILS ---
def clean_filename(text):
    return re.sub(r'[\\/*?:"<>|]', "", text).strip()

# --- MAIN LOGIC ---
def download_image(args):
    """Hàm tải ảnh chạy trong ThreadPool"""
    url, save_path, smart_session = args
    
    if os.path.exists(save_path):
        return # Skip

    response = smart_session.get(url)
    if response:
        with open(save_path, 'wb') as f:
            for chunk in response.iter_content(1024):
                f.write(chunk)

def process_manga(manga_id, args, smart_session):
    base_url = "https://truyenqqno.com"
    url = f"{base_url}/truyen-tranh/x-{manga_id}"
    
    smart_session.update_headers(base_url)
    
    print(f"\n[-] Đang quét ID: {manga_id}")
    res = smart_session.get(url)
    
    if not res or res.url == "https://truyenqqno.com/":
        print(f"   [INFO] ID {manga_id} không tồn tại.")
        return

    soup = BeautifulSoup(res.text, 'html.parser')
    
    # Lấy tên truyện
    try:
        title = soup.select_one("h1[itemprop='name']").text
        manga_name = clean_filename(title)
        print(f"   [+] Truyện: {manga_name}")
    except:
        return

    # Lấy chapters
    chapter_items = soup.select(".works-chapter-item .name-chap a")
    if not chapter_items: return

    # Đảo ngược để tải từ tập 1 -> mới nhất
    chapter_items = chapter_items[::-1]

    # --- ÁP DỤNG GIỚI HẠN SỐ CHAPTER (CAP LIMIT) ---
    if args.limit > 0:
        original_count = len(chapter_items)
        chapter_items = chapter_items[:args.limit]
        print(f"   [LIMIT] Chỉ tải {len(chapter_items)}/{original_count} chapter đầu tiên (theo setting).")

    # Tạo folder truyện
    manga_dir = os.path.join(args.output, manga_name)
    os.makedirs(manga_dir, exist_ok=True)

    # Duyệt từng chapter
    for item in chapter_items:
        chap_name = item.text.strip()
        chap_href = item.get('href')
        chap_url = base_url + chap_href if not chap_href.startswith("http") else chap_href
        
        chap_dir = os.path.join(manga_dir, clean_filename(chap_name))
        os.makedirs(chap_dir, exist_ok=True)
        
        # Lấy info chapter
        smart_session.update_headers(chap_url) # Cập nhật Referer
        res_chap = smart_session.get(chap_url)
        if not res_chap: continue
        
        soup_chap = BeautifulSoup(res_chap.text, 'html.parser')
        images = soup_chap.select(".page-chapter img")
        
        print(f"   > {chap_name}: Tìm thấy {len(images)} ảnh.")
        
        # Chuẩn bị tác vụ tải ảnh
        tasks = []
        for i, img in enumerate(images):
            img_url = img.get('data-original') or img.get('data-src') or img.get('src')
            if not img_url: continue
            if not img_url.startswith("http"): img_url = "https:" + img_url if img_url.startswith("//") else img_url
            
            ext = img_url.split("?")[0].split(".")[-1]
            if len(ext) > 4: ext = "jpg"
            filename = f"{i+1:03d}.{ext}"
            save_path = os.path.join(chap_dir, filename)
            
            tasks.append((img_url, save_path, smart_session))

        # Tải ảnh đa luồng
        with concurrent.futures.ThreadPoolExecutor(max_workers=args.threads) as executor:
            executor.map(download_image, tasks)

def main():
    parser = argparse.ArgumentParser(description="Tool tải truyện thông minh với Token Bucket & Backoff")
    
    # Các tham số nhập từ Terminal
    parser.add_argument("--start", type=int, required=True, help="ID bắt đầu (VD: 1000)")
    parser.add_argument("--end", type=int, required=True, help="ID kết thúc (VD: 1010)")
    parser.add_argument("--limit", type=int, default=3, help="Giới hạn số chapter mỗi truyện (Default: 3 chap đầu)")
    parser.add_argument("--output", type=str, default="Downloads", help="Thư mục lưu truyện")
    parser.add_argument("--threads", type=int, default=5, help="Số luồng tải ảnh đồng thời (Default: 5)")
    parser.add_argument("--rate", type=int, default=5, help="Tốc độ tối đa (request/giây) (Default: 5)")

    args = parser.parse_args()

    # Khởi tạo Smart Session (có Rate Limit & Backoff)
    smart_session = SmartSession(rate_limit=args.rate)

    print(f"=== BẮT ĐẦU CÀO TỪ ID {args.start} ĐẾN {args.end} ===")
    print(f"=== Cấu hình: Max {args.limit} chap/truyện | Max {args.rate} req/s ===")

    for mid in range(args.start, args.end + 1):
        process_manga(mid, args, smart_session)

if __name__ == "__main__":
    main()
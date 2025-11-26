# Craw with zip chapter

import requests
from bs4 import BeautifulSoup
import os
import re
import time
import random
import concurrent.futures
import argparse
import threading
import zipfile  # Thư viện nén
from urllib.parse import urlparse

# --- CLASS 1: TOKEN BUCKET (ĐIỀU TỐC - GIỮ NGUYÊN) ---
class TokenBucket:
    def __init__(self, rate_per_second, capacity):
        self.rate = rate_per_second
        self.capacity = capacity
        self.tokens = capacity
        self.last_refill = time.time()
        self.lock = threading.Lock()

    def consume(self, tokens=1):
        with self.lock:
            now = time.time()
            elapsed = now - self.last_refill
            refill_amount = elapsed * self.rate
            self.tokens = min(self.capacity, self.tokens + refill_amount)
            self.last_refill = now

            if self.tokens >= tokens:
                self.tokens -= tokens
                return True
            else:
                deficit = tokens - self.tokens
                wait_time = deficit / self.rate
                return wait_time

# --- CLASS 2: SMART REQUESTER (BACKOFF - GIỮ NGUYÊN) ---
class SmartSession:
    def __init__(self, rate_limit=5):
        self.session = requests.Session()
        self.bucket = TokenBucket(rate_per_second=rate_limit, capacity=rate_limit*2)
        self.user_agents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
        ]

    def update_headers(self, referer):
        self.session.headers.update({
            'User-Agent': random.choice(self.user_agents),
            'Referer': referer,
            'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        })

    def get(self, url, max_retries=3):
        retry_count = 0
        backoff_time = 2

        while retry_count <= max_retries:
            wait = self.bucket.consume()
            if wait is not True:
                time.sleep(wait)
                continue 

            try:
                # Timeout 20s để tải ảnh lớn
                response = self.session.get(url, stream=True, timeout=20)
                
                if response.status_code == 200:
                    return response
                elif response.status_code in [429, 500, 502, 503]:
                    print(f"   [WARN] Server bận ({response.status_code}). Chờ {backoff_time}s...")
                    time.sleep(backoff_time)
                    backoff_time *= 2
                    retry_count += 1
                elif response.status_code == 404:
                    return None
                else:
                    return None
            
            except Exception as e:
                print(f"   [ERR] Lỗi kết nối: {e}. Retry...")
                time.sleep(backoff_time)
                backoff_time *= 2
                retry_count += 1
        return None

# --- UTILS ---
def clean_filename(text):
    return re.sub(r'[\\/*?:"<>|]', "", text).strip()

# --- ZIP LOGIC ---
def download_image_to_zip(args):
    """
    Tải ảnh và ghi trực tiếp vào file ZIP đang mở.
    Sử dụng Lock để đảm bảo thread-safe.
    """
    url, filename, smart_session, zip_file, zip_lock = args
    
    # 1. Tải ảnh về RAM (Download phase - Parallel)
    response = smart_session.get(url)
    
    if response:
        # Đọc toàn bộ dữ liệu ảnh vào RAM
        image_data = response.content
        
        # 2. Ghi vào ZIP (Write phase - Serialized by Lock)
        with zip_lock:
            # writestr cho phép ghi dữ liệu binary trực tiếp vào zip mà không cần file tạm
            zip_file.writestr(filename, image_data)
        
        # Giải phóng bộ nhớ ngay lập tức
        del image_data 
        return True
    return False

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
    
    try:
        title = soup.select_one("h1[itemprop='name']").text
        manga_name = clean_filename(title)
        print(f"   [+] Truyện: {manga_name}")
    except:
        return

    chapter_items = soup.select(".works-chapter-item .name-chap a")
    if not chapter_items: return

    chapter_items = chapter_items[::-1] # Đảo ngược thứ tự

    # --- CAP LIMIT ---
    if args.limit > 0:
        chapter_items = chapter_items[:args.limit]

    # Tạo folder truyện (Chỉ chứa các file ZIP)
    manga_dir = os.path.join(args.output, manga_name)
    os.makedirs(manga_dir, exist_ok=True)

    # Duyệt từng chapter
    for item in chapter_items:
        chap_name = clean_filename(item.text.strip())
        chap_href = item.get('href')
        chap_url = base_url + chap_href if not chap_href.startswith("http") else chap_href
        
        # Tên file ZIP: "Manga Name - Chap 1.zip"
        zip_path = os.path.join(manga_dir, f"{chap_name}.zip")
        
        # Nếu file ZIP đã tồn tại và không phải file rỗng -> Bỏ qua
        if os.path.exists(zip_path) and os.path.getsize(zip_path) > 100:
            print(f"   [Skip] {chap_name}.zip đã tồn tại.")
            continue

        smart_session.update_headers(chap_url)
        res_chap = smart_session.get(chap_url)
        if not res_chap: continue
        
        soup_chap = BeautifulSoup(res_chap.text, 'html.parser')
        images = soup_chap.select(".page-chapter img")
        
        print(f"   > Đang đóng gói: {chap_name}.zip ({len(images)} ảnh)...")
        
        # --- ZIP PROCESS ---
        # Mở file ZIP để ghi
        # compression=zipfile.ZIP_STORED: Chỉ gom lại, không nén (Tốc độ cao nhất, ít tốn CPU)
        # compression=zipfile.ZIP_DEFLATED: Nén nhỏ lại (Tốn CPU hơn, chậm hơn xíu)
        # Vì ảnh JPEG/PNG đã nén rồi nên dùng ZIP_STORED là tối ưu nhất cho tốc độ.
        with zipfile.ZipFile(zip_path, 'w', compression=zipfile.ZIP_STORED) as zf:
            
            # Tạo Lock để bảo vệ việc ghi vào file zip
            zip_write_lock = threading.Lock()
            
            tasks = []
            for i, img in enumerate(images):
                img_url = img.get('data-original') or img.get('data-src') or img.get('src')
                if not img_url: continue
                if not img_url.startswith("http"): img_url = "https:" + img_url if img_url.startswith("//") else img_url
                
                ext = img_url.split("?")[0].split(".")[-1]
                if len(ext) > 4: ext = "jpg"
                filename = f"{i+1:03d}.{ext}"
                
                # Gom tham số lại để map vào ThreadPool
                tasks.append((img_url, filename, smart_session, zf, zip_write_lock))

            # Chạy tải đa luồng
            with concurrent.futures.ThreadPoolExecutor(max_workers=args.threads) as executor:
                # List(executor.map(...)) để đợi tất cả tải xong trước khi đóng file zip
                list(executor.map(download_image_to_zip, tasks))
        
        print(f"   [DONE] Đã lưu {zip_path}")

def main():
    parser = argparse.ArgumentParser(description="Tool tải truyện ZIP Optimized")
    
    parser.add_argument("--start", type=int, required=True, help="ID bắt đầu")
    parser.add_argument("--end", type=int, required=True, help="ID kết thúc")
    parser.add_argument("--limit", type=int, default=3, help="Số chapter tối đa mỗi truyện")
    parser.add_argument("--output", type=str, default="Downloads_Zip", help="Thư mục lưu")
    parser.add_argument("--threads", type=int, default=6, help="Số luồng tải (Default: 6)")
    parser.add_argument("--rate", type=int, default=8, help="Tốc độ request/s (Default: 8)")

    args = parser.parse_args()
    
    smart_session = SmartSession(rate_limit=args.rate)

    print(f"=== ZIP SCRAPER: ID {args.start} -> {args.end} ===")
    
    for mid in range(args.start, args.end + 1):
        process_manga(mid, args, smart_session)

if __name__ == "__main__":
    main()
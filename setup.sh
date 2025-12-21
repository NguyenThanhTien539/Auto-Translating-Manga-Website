#!bin/bash
set -e

apt update
apt upgrade -y

curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs nginx

node -v
npm -v

npm install -g pm2

cat << EOF > /etc/nginx/sites-available/my-nextjs-app
server {
    listen 80;
    server_name _; # Hoặc điền IP/Domain của bạn

    # 1. Cấu hình cho FRONTEND (Gốc)
    location / {
        proxy_pass http://localhost:3000; # Chuyển về Frontend
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # 2. Cấu hình cho BACKEND (Khi gọi /api)
    location /api/ {
        # Lưu ý: Dấu / ở cuối dòng proxy_pass rất quan trọng
        # Nếu backend của bạn có prefix /api sẵn trong code -> dùng http://localhost:4000;
        # Nếu backend của bạn không có prefix /api -> dùng http://localhost:4000/; (để Nginx cắt bỏ chữ /api đi)

        proxy_pass http://localhost:4000/; 

        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

nginx -t
nginx -s reload



cd src/backend
npm i
pm2 start npm --name "backend" -- start

cd ../frontend
npm i
pm2 start npm --name "frontend" -- run dev
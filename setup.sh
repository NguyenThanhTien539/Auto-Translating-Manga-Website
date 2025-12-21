#!bin/bash
set -e

apt update
apt upgrade -y

curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs nginx

node -v
npm -v

npm install -g pm2

rm -f /etc/nginx/sites-enabled/default

cat << 'EOF' > /etc/nginx/sites-available/my-nextjs-app
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _; 

    # FRONTEND
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # BACKEND
    location /api/ {
        # Proxy pass có dấu / ở cuối để cắt /api đi khi gửi vào backend
        proxy_pass http://localhost:5000/; 
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

ln -sf /etc/nginx/sites-available/my-nextjs-app /etc/nginx/sites-enabled/
nginx -t
nginx -s reload



cd src/backend
npm i
pm2 start npm --name "backend" -- start

cd ../frontend
npm i
pm2 start npm --name "frontend" -- run dev

curl -4 ifconfig.me
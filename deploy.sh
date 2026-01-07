#!/bin/bash

# Sales Dashboard Deployment Script for Hostinger VPS
# Run this script on your VPS as root

set -e  # Exit on any error

echo "🚀 Starting Dashboard Deployment..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
DEPLOY_DIR="/var/www/dashboard"
LOG_DIR="/var/log/dashboard"
DOMAIN="dashboard.srv1110550.hstgr.cloud"

echo -e "${YELLOW}📦 Installing system dependencies...${NC}"
apt-get update
apt-get install -y python3 python3-pip python3-venv nginx curl

# Install Node.js if not already installed
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}📦 Installing Node.js...${NC}"
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
fi

echo -e "${GREEN}✅ System dependencies installed${NC}"

# Create directories
echo -e "${YELLOW}📁 Creating directories...${NC}"
mkdir -p $DEPLOY_DIR/backend
mkdir -p $DEPLOY_DIR/frontend
mkdir -p $LOG_DIR
mkdir -p $DEPLOY_DIR/backend/data

echo -e "${GREEN}✅ Directories created${NC}"

# Note: Files should already be uploaded to the server
# Check if files exist
if [ ! -f "$DEPLOY_DIR/backend/main.py" ]; then
    echo -e "${RED}❌ Error: Backend files not found in $DEPLOY_DIR/backend${NC}"
    echo "Please upload your files first using SCP or SFTP"
    exit 1
fi

# Install Python dependencies
echo -e "${YELLOW}🐍 Installing Python dependencies...${NC}"
cd $DEPLOY_DIR/backend
pip3 install fastapi uvicorn pandas openpyxl python-multipart --break-system-packages

echo -e "${GREEN}✅ Python dependencies installed${NC}"

# Build frontend
echo -e "${YELLOW}⚛️  Building frontend...${NC}"
cd $DEPLOY_DIR/frontend

# Create production .env file
cat > .env.production << EOF
VITE_API_URL=https://$DOMAIN/api
EOF

npm install
npm run build

# Copy build to web root
rm -rf /var/www/dashboard/frontend-dist
cp -r dist /var/www/dashboard/frontend-dist

echo -e "${GREEN}✅ Frontend built${NC}"

# Configure Nginx
echo -e "${YELLOW}🌐 Configuring Nginx...${NC}"
cat > /etc/nginx/sites-available/dashboard << 'NGINXCONF'
server {
    listen 80;
    server_name dashboard.srv1110550.hstgr.cloud 72.61.103.174;

    client_max_body_size 100M;

    root /var/www/dashboard/frontend-dist;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }

    location /api {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;

        proxy_connect_timeout 600;
        proxy_send_timeout 600;
        proxy_read_timeout 600;
        send_timeout 600;
    }

    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json;
}
NGINXCONF

# Enable site
ln -sf /etc/nginx/sites-available/dashboard /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx

echo -e "${GREEN}✅ Nginx configured${NC}"

# Configure systemd service
echo -e "${YELLOW}⚙️  Configuring backend service...${NC}"
cat > /etc/systemd/system/dashboard-backend.service << 'SERVICECONF'
[Unit]
Description=Sales Dashboard Backend API
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/var/www/dashboard/backend
Environment="PATH=/usr/local/bin:/usr/bin:/bin"
Environment="PYTHONUNBUFFERED=1"
ExecStart=/usr/bin/python3 main.py
Restart=always
RestartSec=10

StandardOutput=append:/var/log/dashboard/backend.log
StandardError=append:/var/log/dashboard/backend-error.log

[Install]
WantedBy=multi-user.target
SERVICECONF

# Reload systemd and start service
systemctl daemon-reload
systemctl enable dashboard-backend
systemctl restart dashboard-backend

echo -e "${GREEN}✅ Backend service configured and started${NC}"

# Check service status
sleep 2
if systemctl is-active --quiet dashboard-backend; then
    echo -e "${GREEN}✅ Backend is running${NC}"
else
    echo -e "${RED}❌ Backend failed to start. Check logs:${NC}"
    echo "sudo journalctl -u dashboard-backend -n 50"
    exit 1
fi

# Configure firewall (if ufw is installed)
if command -v ufw &> /dev/null; then
    echo -e "${YELLOW}🔥 Configuring firewall...${NC}"
    ufw allow 80/tcp
    ufw allow 443/tcp
    echo -e "${GREEN}✅ Firewall configured${NC}"
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}🎉 Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "Dashboard URL: ${YELLOW}http://$DOMAIN${NC}"
echo -e "Alternative:   ${YELLOW}http://72.61.103.174${NC}"
echo ""
echo -e "${YELLOW}Useful Commands:${NC}"
echo "  Check backend status:  sudo systemctl status dashboard-backend"
echo "  View backend logs:     sudo tail -f /var/log/dashboard/backend.log"
echo "  Restart backend:       sudo systemctl restart dashboard-backend"
echo "  Restart Nginx:         sudo systemctl restart nginx"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Set up a custom domain (optional)"
echo "2. Set up SSL with Let's Encrypt:"
echo "   sudo apt install certbot python3-certbot-nginx"
echo "   sudo certbot --nginx -d $DOMAIN"
echo ""

# 🚀 Dashboard Deployment Guide - Hostinger VPS

Complete guide to deploy your Sales Dashboard to your Hostinger VPS.

## 📋 VPS Information

- **Server:** srv1110550.hstgr.cloud
- **IP Address:** 72.61.103.174
- **OS:** Ubuntu 24.04
- **SSH User:** root
- **Location:** Paris, France

## 🎯 Deployment Overview

Your dashboard will be accessible at:
- **Primary:** http://dashboard.srv1110550.hstgr.cloud
- **Alternative:** http://72.61.103.174

Architecture:
- **Frontend:** React app served by Nginx
- **Backend:** FastAPI running as systemd service
- **Web Server:** Nginx as reverse proxy
- **Port 80:** HTTP (public)
- **Port 8000:** Backend API (internal only)

---

## 📦 Step 1: Prepare Your Files

On your local machine (Mac):

```bash
cd /Users/bernardo.morales/Desktop/DASHBOARD

# Make deployment script executable
chmod +x deploy.sh

# Create a tarball of your project
tar -czf dashboard.tar.gz \
  --exclude='node_modules' \
  --exclude='frontend/node_modules' \
  --exclude='frontend/dist' \
  --exclude='backend/__pycache__' \
  --exclude='backend.log' \
  --exclude='.git' \
  backend/ frontend/ deploy.sh
```

---

## 📤 Step 2: Upload Files to VPS

Use SCP to upload the files:

```bash
# Upload the tarball
scp dashboard.tar.gz root@72.61.103.174:/root/

# SSH into your VPS
ssh root@72.61.103.174
```

---

## 🛠️ Step 3: Extract and Deploy

On your VPS (after SSH):

```bash
# Create deployment directory
mkdir -p /var/www/dashboard
cd /var/www/dashboard

# Extract files
tar -xzf /root/dashboard.tar.gz -C /var/www/dashboard

# Make deploy script executable
chmod +x /var/www/dashboard/deploy.sh

# Run deployment script
cd /var/www/dashboard
./deploy.sh
```

The script will automatically:
- ✅ Install Python, Node.js, Nginx
- ✅ Install all dependencies
- ✅ Build the frontend
- ✅ Configure Nginx
- ✅ Set up the backend as a systemd service
- ✅ Start everything

---

## ✅ Step 4: Verify Deployment

Check if everything is running:

```bash
# Check backend service status
sudo systemctl status dashboard-backend

# Check if backend is responding
curl http://localhost:8000/api/years

# Check Nginx status
sudo systemctl status nginx

# View backend logs
sudo tail -f /var/log/dashboard/backend.log
```

Visit in your browser:
- **Dashboard:** http://72.61.103.174
- **API Test:** http://72.61.103.174/api/years

---

## 🔒 Step 5: Set Up SSL (Optional but Recommended)

Add HTTPS to your dashboard:

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate (follow prompts)
sudo certbot --nginx -d dashboard.srv1110550.hstgr.cloud

# Test auto-renewal
sudo certbot renew --dry-run
```

After SSL setup, your dashboard will be at:
- **https://dashboard.srv1110550.hstgr.cloud**

---

## 🔄 Updating the Dashboard

When you make changes to your code:

### Option A: Quick Update (Small Changes)

```bash
# On your Mac - update specific files
scp backend/main.py root@72.61.103.174:/var/www/dashboard/backend/
ssh root@72.61.103.174 "systemctl restart dashboard-backend"
```

### Option B: Full Redeployment

```bash
# On your Mac - create new tarball
cd /Users/bernardo.morales/Desktop/DASHBOARD
tar -czf dashboard.tar.gz \
  --exclude='node_modules' \
  --exclude='frontend/node_modules' \
  --exclude='frontend/dist' \
  --exclude='backend/__pycache__' \
  backend/ frontend/ deploy.sh

# Upload and redeploy
scp dashboard.tar.gz root@72.61.103.174:/root/
ssh root@72.61.103.174

# On VPS
cd /var/www/dashboard
tar -xzf /root/dashboard.tar.gz
./deploy.sh
```

---

## 🛠️ Useful Commands

### Backend Service Management

```bash
# View service status
sudo systemctl status dashboard-backend

# Start service
sudo systemctl start dashboard-backend

# Stop service
sudo systemctl stop dashboard-backend

# Restart service
sudo systemctl restart dashboard-backend

# View real-time logs
sudo tail -f /var/log/dashboard/backend.log

# View error logs
sudo tail -f /var/log/dashboard/backend-error.log

# View last 50 lines of system log
sudo journalctl -u dashboard-backend -n 50
```

### Nginx Management

```bash
# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx

# View Nginx error log
sudo tail -f /var/nginx/error.log

# View access log
sudo tail -f /var/nginx/access.log
```

### File Management

```bash
# View uploaded Excel files
ls -lh /var/www/dashboard/backend/data/

# View configuration
cat /var/www/dashboard/backend/data/config.json

# Check disk space
df -h
```

---

## 🐛 Troubleshooting

### Backend Not Starting

```bash
# Check detailed logs
sudo journalctl -u dashboard-backend -n 100 --no-pager

# Check if port 8000 is in use
sudo lsof -i :8000

# Manually test backend
cd /var/www/dashboard/backend
python3 main.py
```

### Frontend Not Loading

```bash
# Check if files exist
ls -lh /var/www/dashboard/frontend-dist/

# Check Nginx configuration
sudo nginx -t

# View Nginx error log
sudo tail -f /var/log/nginx/error.log
```

### Can't Upload Files

```bash
# Check disk space
df -h

# Check directory permissions
ls -ld /var/www/dashboard/backend/data/

# Check Nginx upload limit
grep client_max_body_size /etc/nginx/sites-available/dashboard
```

### 502 Bad Gateway Error

This means Nginx can't connect to the backend:

```bash
# Check if backend is running
sudo systemctl status dashboard-backend

# Restart backend
sudo systemctl restart dashboard-backend

# Check backend logs
sudo tail -f /var/log/dashboard/backend.log
```

---

## 🔐 Security Recommendations

1. **Change SSH Port** (optional):
   ```bash
   sudo nano /etc/ssh/sshd_config
   # Change Port 22 to something else
   sudo systemctl restart sshd
   ```

2. **Set up Firewall**:
   ```bash
   sudo ufw enable
   sudo ufw allow 22/tcp
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   ```

3. **Regular Updates**:
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

4. **Backup Configuration**:
   ```bash
   # Backup config and data
   tar -czf backup-$(date +%Y%m%d).tar.gz \
     /var/www/dashboard/backend/data/ \
     /etc/nginx/sites-available/dashboard \
     /etc/systemd/system/dashboard-backend.service
   ```

---

## 📊 Monitoring

### Check Service Health

```bash
# Create a simple health check script
cat > /root/check-dashboard.sh << 'EOF'
#!/bin/bash
if systemctl is-active --quiet dashboard-backend; then
    echo "✅ Backend: Running"
else
    echo "❌ Backend: Stopped"
fi

if systemctl is-active --quiet nginx; then
    echo "✅ Nginx: Running"
else
    echo "❌ Nginx: Stopped"
fi

if curl -s http://localhost:8000/api/years > /dev/null; then
    echo "✅ API: Responding"
else
    echo "❌ API: Not responding"
fi
EOF

chmod +x /root/check-dashboard.sh
```

Run it: `./check-dashboard.sh`

---

## 🎉 You're Done!

Your dashboard is now live at:
- **HTTP:** http://72.61.103.174
- **With domain:** http://dashboard.srv1110550.hstgr.cloud
- **With SSL (after setup):** https://dashboard.srv1110550.hstgr.cloud

Access it from any device and start uploading your Excel files!

---

## 📞 Support

If you encounter issues:

1. Check logs: `sudo tail -f /var/log/dashboard/backend.log`
2. Check service status: `sudo systemctl status dashboard-backend`
3. Check Nginx: `sudo nginx -t`
4. Verify files exist: `ls -lh /var/www/dashboard/`

Common fixes:
- Restart backend: `sudo systemctl restart dashboard-backend`
- Restart Nginx: `sudo systemctl restart nginx`
- Check disk space: `df -h`

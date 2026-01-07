# ⚡ Quick Deploy - 5 Minutes

Ultra-fast deployment guide to get your dashboard online NOW.

## 🚀 Deploy in 3 Commands

### On Your Mac:

```bash
# 1. Package everything
cd /Users/bernardo.morales/Desktop/DASHBOARD
tar -czf dashboard.tar.gz --exclude='node_modules' --exclude='frontend/node_modules' --exclude='frontend/dist' --exclude='backend/__pycache__' --exclude='.git' backend/ frontend/ deploy.sh

# 2. Upload to VPS
scp dashboard.tar.gz root@72.61.103.174:/root/

# 3. SSH and deploy
ssh root@72.61.103.174
```

### On Your VPS:

```bash
mkdir -p /var/www/dashboard && cd /var/www/dashboard
tar -xzf /root/dashboard.tar.gz
chmod +x deploy.sh
./deploy.sh
```

## ✅ Done!

Visit: **http://72.61.103.174**

---

## 🔒 Optional: Add HTTPS (2 more commands)

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d dashboard.srv1110550.hstgr.cloud
```

Now visit: **https://dashboard.srv1110550.hstgr.cloud**

---

## 🛠️ Common Commands

```bash
# Restart backend
sudo systemctl restart dashboard-backend

# View logs
sudo tail -f /var/log/dashboard/backend.log

# Check status
sudo systemctl status dashboard-backend
```

---

That's it! See **DEPLOYMENT.md** for detailed instructions.

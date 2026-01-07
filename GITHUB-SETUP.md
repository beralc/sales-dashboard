# 🚀 GitHub Auto-Deploy Setup Guide

Set up automatic deployment to your VPS every time you push code to GitHub.

## 📋 Overview

After setup:
1. You make changes locally
2. `git push` to GitHub
3. GitHub automatically deploys to your VPS
4. Dashboard updates in seconds!

---

## 🔐 Step 1: Create SSH Key for GitHub Actions

On your **VPS** (SSH session):

```bash
# Generate a dedicated SSH key for GitHub
ssh-keygen -t ed25519 -C "github-actions" -f /root/.ssh/github-deploy -N ""

# Add the key to authorized_keys
cat /root/.ssh/github-deploy.pub >> /root/.ssh/authorized_keys

# Display the PRIVATE key (you'll need this for GitHub)
cat /root/.ssh/github-deploy
```

**Copy the entire private key output** (including `-----BEGIN` and `-----END` lines). You'll paste this into GitHub secrets.

---

## 📦 Step 2: Initialize Git Repository (On Your Mac)

```bash
cd /Users/bernardo.morales/Desktop/DASHBOARD

# Initialize git
git init

# Add all files
git add .

# Create first commit
git commit -m "Initial commit - Sales Dashboard"
```

---

## 🌐 Step 3: Create GitHub Repository

1. Go to https://github.com/new
2. **Repository name:** `sales-dashboard` (or any name you like)
3. **Privacy:** Choose Private (recommended) or Public
4. **Do NOT** initialize with README, .gitignore, or license
5. Click **Create repository**

---

## 🔗 Step 4: Connect Local Repository to GitHub

After creating the repo, GitHub shows commands. Run on your Mac:

```bash
cd /Users/bernardo.morales/Desktop/DASHBOARD

# Add GitHub as remote
git remote add origin https://github.com/YOUR-USERNAME/sales-dashboard.git

# Rename branch to main (if needed)
git branch -M main

# Push to GitHub
git push -u origin main
```

Replace `YOUR-USERNAME` with your actual GitHub username.

---

## 🔑 Step 5: Add Secrets to GitHub

1. Go to your repository on GitHub
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**

Add these **3 secrets**:

### Secret 1: VPS_HOST
- **Name:** `VPS_HOST`
- **Value:** `72.61.103.174`

### Secret 2: VPS_USER
- **Name:** `VPS_USER`
- **Value:** `root`

### Secret 3: VPS_SSH_KEY
- **Name:** `VPS_SSH_KEY`
- **Value:** Paste the entire private key you copied earlier (from `/root/.ssh/github-deploy`)

---

## 🏗️ Step 6: Prepare VPS for Git Deployment

On your **VPS** (SSH session):

```bash
# Install git if not already installed
apt-get install -y git

# Remove current deployment and clone from GitHub
cd /var/www
rm -rf dashboard
git clone https://github.com/YOUR-USERNAME/sales-dashboard.git dashboard

# Navigate to dashboard
cd /var/www/dashboard

# Copy your Excel files and config back
cp /root/dashboard-backup/backend/data/*.xlsx backend/data/ 2>/dev/null || true
cp /root/dashboard-backup/backend/data/*.xls backend/data/ 2>/dev/null || true
cp /root/dashboard-backup/backend/data/config.json backend/data/ 2>/dev/null || true

# Or if you have them elsewhere, copy them now
# For example:
# cp /path/to/your/excel/files/*.xlsx /var/www/dashboard/backend/data/

# Build and deploy
cd /var/www/dashboard/frontend
cat > .env.production << 'EOF'
VITE_API_URL=http://72.61.103.174:8080
EOF

npm install
npm run build
cp -r dist/* /var/www/dashboard/frontend-dist/

# Restart services
systemctl restart dashboard-backend
systemctl reload nginx
```

Replace `YOUR-USERNAME` with your GitHub username.

---

## ✅ Step 7: Test Auto-Deployment

On your **Mac**, make a small change:

```bash
cd /Users/bernardo.morales/Desktop/DASHBOARD

# Make a small change (add a comment to any file)
echo "# Test deployment" >> README.md

# Commit and push
git add .
git commit -m "Test auto-deployment"
git push
```

Then:
1. Go to your GitHub repository
2. Click **Actions** tab
3. You should see your deployment running!
4. Wait 1-2 minutes for it to complete
5. Refresh your dashboard at http://72.61.103.174:8080

---

## 🎉 You're Done!

Now every time you `git push`, your dashboard automatically updates!

---

## 🔄 Daily Workflow (After Setup)

```bash
cd /Users/bernardo.morales/Desktop/DASHBOARD

# Make your changes...

# Commit and push
git add .
git commit -m "Description of changes"
git push

# That's it! GitHub deploys automatically!
```

---

## 📊 Adding GlobalEduca (Example)

Now let's add GlobalEduca properly:

### 1. Update productConfig.js on your Mac:

```bash
cd /Users/bernardo.morales/Desktop/DASHBOARD/frontend/src
nano productConfig.js
```

Add GlobalEduca:

```javascript
'globaleduca': {
  name: 'GlobalEduca',
  logo: '/globaleducalogo.png',
  colors: {
    primary: '#0066CC',
    secondary: '#00AAFF',
    gradient: 'linear-gradient(135deg, #0066CC 0%, #00AAFF 100%)'
  }
}
```

### 2. Upload Excel file to VPS:

```bash
scp Crea_tu_propio_informe_20260107_111320.xlsx root@72.61.103.174:/var/www/dashboard/backend/data/
```

### 3. Update config on VPS via the dashboard's file manager, or:

```bash
ssh root@72.61.103.174
nano /var/www/dashboard/backend/data/config.json
```

### 4. Commit and push:

```bash
cd /Users/bernardo.morales/Desktop/DASHBOARD
git add .
git commit -m "Add GlobalEduca product"
git push
```

GitHub deploys it automatically!

---

## 🐛 Troubleshooting

### Deployment Failed?

Check GitHub Actions logs:
1. Go to your repo → **Actions** tab
2. Click on the failed workflow
3. Read the error messages

### Can't Push to GitHub?

You might need to authenticate. Use a Personal Access Token:
1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token with `repo` scope
3. Use token as password when pushing

Or set up SSH keys for GitHub (recommended):
```bash
ssh-keygen -t ed25519 -C "your_email@example.com"
cat ~/.ssh/id_ed25519.pub
# Add this to GitHub → Settings → SSH keys
```

---

## 🔒 Security Notes

- ✅ SSH key is dedicated for deployment only
- ✅ Private repository keeps your code secure
- ✅ Secrets are encrypted in GitHub
- ✅ Excel data files are NOT committed (.gitignore protects them)

---

## 📞 Need Help?

Common issues:
- **"Permission denied"**: Check SSH key is correct in GitHub secrets
- **"Host unreachable"**: Check VPS_HOST is correct (72.61.103.174)
- **Deployment runs but site doesn't update**: Check logs: `ssh root@72.61.103.174 "tail -f /var/log/dashboard/backend.log"`

# Puppeteer Chrome Dependencies Setup for Linux Server

## Problem
Puppeteer requires Chrome/Chromium browser dependencies on Linux servers. The error:
```
libatk-1.0.so.0: cannot open shared object file: No such file or directory
```
means required system libraries are missing.

## Solution: Install Chrome Dependencies on Linux Server

### For Debian/Ubuntu (most common):
```bash
sudo apt-get update
sudo apt-get install -y \
  ca-certificates \
  fonts-liberation \
  libasound2 \
  libatk-bridge2.0-0 \
  libatk1.0-0 \
  libc6 \
  libcairo2 \
  libcups2 \
  libdbus-1-3 \
  libexpat1 \
  libfontconfig1 \
  libgbm1 \
  libgcc1 \
  libglib2.0-0 \
  libgtk-3-0 \
  libnspr4 \
  libnss3 \
  libpango-1.0-0 \
  libpangocairo-1.0-0 \
  libstdc++6 \
  libx11-6 \
  libx11-xcb1 \
  libxcb1 \
  libxcomposite1 \
  libxcursor1 \
  libxdamage1 \
  libxext6 \
  libxfixes3 \
  libxi6 \
  libxrandr2 \
  libxrender1 \
  libxss1 \
  libxtst6 \
  lsb-release \
  wget \
  xdg-utils
```

### For CentOS/RHEL/Fedora:
```bash
sudo yum install -y \
  alsa-lib \
  atk \
  cups-libs \
  gtk3 \
  ipa-gothic-fonts \
  xorg-x11-fonts-100dpi \
  xorg-x11-fonts-75dpi \
  xorg-x11-utils \
  xorg-x11-fonts-cyrillic \
  xorg-x11-fonts-Type1 \
  xorg-x11-fonts-misc \
  liberation-fonts
```

### Alternative: Use System Chrome (if already installed)
If Chrome/Chromium is already installed on the server, set the path in `.env`:
```env
PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable
# OR
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
```

## Verify Installation
After installing dependencies, restart the backend:
```bash
pm2 restart EVRYKA
```

Or test manually:
```bash
cd /var/www/evryka_org_usr/data/www/Evridis/backend
node -e "require('puppeteer').launch({headless: true}).then(b => {console.log('✅ Puppeteer works!'); b.close();})"
```

## Current Configuration
The backend is configured with optimal flags for headless Linux servers:
- `--no-sandbox` - Required for running as root (PM2)
- `--disable-setuid-sandbox` - Security sandbox bypass
- `--disable-dev-shm-usage` - Uses `/tmp` instead of `/dev/shm`
- `--single-process` - Reduces memory usage
- `--disable-gpu` - No GPU acceleration needed for PDF generation

These flags ensure Puppeteer works on servers without GUI/X11 dependencies.

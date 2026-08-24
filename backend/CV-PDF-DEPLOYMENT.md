# CV PDF Generation - Deployment Checklist

## Issues Fixed

### 1. CORS Credentials Error ✅
**Problem**: `Credential is not supported if the CORS header 'Access-Control-Allow-Origin' is '*'`

**Solution**: 
- Set specific origin from request headers (not wildcard `*`)
- Parse origin from `referer` header if `origin` header is missing
- Set CORS headers BEFORE processing request
- Added `Access-Control-Allow-Credentials: true`

### 2. Puppeteer Chrome Dependencies Missing ✅
**Problem**: `libatk-1.0.so.0: cannot open shared object file: No such file or directory`

**Solution**:
- Configured Puppeteer with proper headless flags for Linux servers
- Added comprehensive Chrome launch arguments
- No X11/GUI dependencies required

## Deployment Steps

### Step 1: Build Locally (if not already done)
```bash
cd /var/www/evryka_org_usr/data/www/Evridis/backend
npm run build
```

### Step 2: Install Chrome Dependencies on Server (One-time setup)
```bash
sudo apt-get update
sudo apt-get install -y \
  ca-certificates fonts-liberation libasound2 libatk-bridge2.0-0 \
  libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 \
  libfontconfig1 libgbm1 libgcc1 libglib2.0-0 libgtk-3-0 \
  libnspr4 libnss3 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 \
  libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 \
  libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 \
  libxss1 libxtst6 lsb-release wget xdg-utils
```

**See `PUPPETEER-SETUP.md` for detailed instructions and alternatives.**

### Step 3: Restart PM2 (CRITICAL - Use ecosystem.config.js)
```bash
# Stop current instance
pm2 stop EVRYKA

# Delete old instance
pm2 delete EVRYKA

# Start with ecosystem.config.js (loads .env properly)
cd /var/www/evryka_org_usr/data/www/Evridis/backend
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Verify it's running
pm2 list
```

**IMPORTANT**: The ecosystem.config.js now properly loads environment variables from `dist/.env` in production.

### Step 4: Verify
Check PM2 logs:
```bash
pm2 logs EVRYKA --lines 50
```

Test CV download:
```
GET https://evryka.org/api/cv-pdf/download/{userId}?template=creative-blocks&color=teal
```

## Expected Log Output

### Success Indicators:
```
✅ CORS headers set for origin: https://evryka.org
📄 Attempting to load CV template from: /var/www/.../dist/public/cv-templates/html/creative-blocks.html
📁 Template exists: true
🎨 Attempting to load CSS from: /var/www/.../dist/public/cv-templates/styles/creative-blocks.css
📁 CSS exists: true
```

### If Puppeteer Still Fails:
1. Check Chrome dependencies are installed
2. Verify Puppeteer can launch: `node -e "require('puppeteer').launch({headless: true}).then(b => {console.log('✅ OK'); b.close();})"`
3. Check disk space and memory availability
4. Review full error in PM2 logs: `pm2 logs EVRYKA --err`

## Files Modified
- ✅ `src/app/modules/profiles/controllers/cv-pdf.controller.ts` - CORS fix
- ✅ `src/app/modules/profiles/services/cv-pdf.service.ts` - Puppeteer config
- ✅ `.env` - Added Puppeteer configuration comments
- ✅ `ecosystem.config.js` - Fixed .env loading for PM2 production environment

## Testing
```bash
# From frontend
curl -X GET "https://evryka.org/api/cv-pdf/download/63bd477d9d4b3424ff548b66?template=creative-blocks&color=teal" \
  -H "Origin: https://evryka.org" \
  -H "Authorization: Bearer {token}" \
  --output test-cv.pdf
```

Expected: PDF file downloads successfully without CORS errors.

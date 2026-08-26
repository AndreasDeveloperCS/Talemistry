# Quick Start - Server Deployment

## Problem
CV PDF generation fails when backend runs through PM2 with:
1. **CORS Error**: `Credential is not supported if the CORS header 'Access-Control-Allow-Origin' is '*'`
2. **Puppeteer Error**: `libatk-1.0.so.0: cannot open shared object file: No such file or directory`

## Root Cause
When using `pm2 start ecosystem.config.js`, environment variables from `.env` were not being loaded correctly, and Puppeteer Chrome dependencies were missing on the Linux server.

## Solution Applied

### Code Changes
1. ✅ Fixed CORS in `cv-pdf.controller.ts` - specific origin instead of wildcard
2. ✅ Configured Puppeteer in `cv-pdf.service.ts` - headless Linux server flags
3. ✅ Updated `ecosystem.config.js` - properly loads `dist/.env` in production

### Server Commands (Run on Production Server)

#### Option A: Automated Script
```bash
cd /var/www/evryka_org_usr/data/www/Evridis/backend
chmod +x deploy-cv-fix.sh
./deploy-cv-fix.sh
```

#### Option B: Manual Steps
```bash
cd /var/www/evryka_org_usr/data/www/Evridis/backend

# 1. Install Chrome dependencies (one-time)
sudo apt-get update && sudo apt-get install -y \
  ca-certificates fonts-liberation libasound2 libatk-bridge2.0-0 \
  libatk1.0-0 libgbm1 libgtk-3-0 libnss3 libxss1

# 2. Test Puppeteer
node -e "require('puppeteer').launch({headless:true,args:['--no-sandbox']}).then(b=>{console.log('✅ OK');b.close();})"

# 3. Restart with ecosystem.config.js
pm2 stop EVRYKA
pm2 delete EVRYKA
NODE_ENV=PROD pm2 start ecosystem.config.js
pm2 save

# 4. Verify
pm2 logs EVRYKA --lines 20
```

## Expected Output

### On PM2 Start:
```
📄 Loading .env from: /var/www/evryka_org_usr/data/www/Evridis/backend/.env
✅ Loaded XX environment variables
```

### On CV Download Request:
```
downloadCVPdf 63bd477d9d4b3424ff548b66 creative-blocks teal
✅ CORS headers set for origin: https://evryka.org
📄 Attempting to load CV template from: .../dist/public/cv-templates/html/creative-blocks.html
📁 Template exists: true
🎨 Attempting to load CSS from: .../dist/public/cv-templates/styles/creative-blocks.css
📁 CSS exists: true
```

## Verification

### Check PM2 Status:
```bash
pm2 list
# Should show EVRYKA as "online"
```

### Test CV Generation:
```bash
curl -X GET "https://evryka.org/api/cv-pdf/download/63bd477d9d4b3424ff548b66?template=creative-blocks&color=teal" \
  -H "Origin: https://evryka.org" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  --output test.pdf

# Check file was created
ls -lh test.pdf
```

## Troubleshooting

### If Puppeteer still fails:
```bash
# Check Chrome dependencies
ldd /root/.cache/puppeteer/chrome/linux-*/chrome-linux64/chrome | grep "not found"

# If libraries are missing, reinstall dependencies
sudo apt-get install -y libatk-bridge2.0-0 libgtk-3-0 libnss3
```

### If CORS still fails:
```bash
# Check ecosystem.config.js is being used
pm2 info EVRYKA | grep cwd

# Should show: /var/www/evryka_org_usr/data/www/Evridis/backend
```

### View detailed logs:
```bash
pm2 logs EVRYKA --lines 100
pm2 logs EVRYKA --err  # errors only
```

## Production secrets

Create the file below directly on the server. Do not commit it and do not put it in `dist/`:

```bash
cd /var/www/evryka_org_usr/data/www/Evridis/backend
cp .env.example .env
chmod 600 .env
nano .env
```

At minimum, set `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, and `STRIPE_WEBHOOK_SECRET` in this server-only file. The secret key must exist only in the backend environment; never add it to the Angular or Next.js frontend environment.

## Files to Upload to Server
- ✅ `dist/` folder (entire directory after build)
- ✅ `ecosystem.config.js` (backend root)
- ✅ `deploy-cv-fix.sh` (optional, for automated deployment)

## Important Notes
- ⚠️ Always use `pm2 start ecosystem.config.js` (not `pm2 start dist/main.js`)
- ⚠️ Set `NODE_ENV=PROD` before starting PM2
- ⚠️ Chrome dependencies are required on the server (one-time install)
- ⚠️ The production `.env` file must be in the backend root (`backend/.env`) or supplied by the process manager/environment. It is not copied into `dist/`.

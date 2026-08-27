#!/bin/bash
# Server Deployment Script for CV PDF Fix
# Run this on the production server after uploading the built code

set -e

echo "🚀 Starting CV PDF Fix Deployment..."

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
PUPPETEER_CACHE_DIR="$SCRIPT_DIR/.cache/puppeteer"
CHROME_DEPS_PACKAGES="ca-certificates fonts-liberation libasound2 libatk-bridge2.0-0 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgbm1 libgcc1 libglib2.0-0 libgtk-3-0 libnspr4 libnss3 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 lsb-release wget xdg-utils"

ensure_chrome_dependencies() {
        if ! command -v apt-get >/dev/null 2>&1; then
                echo "⚠️ apt-get not available; skipping Ubuntu dependency installation"
                return 0
        fi

        echo "📦 Installing headless Chrome dependencies for Ubuntu..."
        sudo apt-get update
        sudo apt-get install -y $CHROME_DEPS_PACKAGES
}

ensure_puppeteer_browser() {
        mkdir -p "$PUPPETEER_CACHE_DIR"
        export PUPPETEER_CACHE_DIR

        if [ -x "/usr/bin/google-chrome-stable" ] || [ -x "/usr/bin/google-chrome" ] || [ -x "/usr/bin/chromium-browser" ] || [ -x "/usr/bin/chromium" ]; then
                echo "✅ System Chrome/Chromium detected"
                return 0
        fi

        echo "📥 Installing Puppeteer-managed Chrome into $PUPPETEER_CACHE_DIR"
        npx puppeteer browsers install chrome
}

    ensure_cv_template_assets() {
        local source_root="public/cv-templates"
        local dist_root="dist/public/cv-templates"

        if [ ! -d "$source_root/html" ] || [ ! -d "$source_root/styles" ]; then
            echo "❌ Source CV templates are missing under $source_root"
            exit 1
        fi

        mkdir -p "$dist_root"

        echo "📂 Syncing CV template assets into dist/public..."
        rm -rf "$dist_root/html" "$dist_root/styles"
        cp -r "$source_root/html" "$dist_root/"
        cp -r "$source_root/styles" "$dist_root/"

        local html_count
        local css_count
        html_count=$(find "$dist_root/html" -maxdepth 1 -type f | wc -l)
        css_count=$(find "$dist_root/styles" -maxdepth 1 -type f | wc -l)

        if [ "$html_count" -eq 0 ] || [ "$css_count" -eq 0 ]; then
            echo "❌ CV templates were not copied into dist/public correctly"
            exit 1
        fi

        echo "✅ CV template assets ready in dist/public ($html_count html, $css_count css)"
    }

verify_puppeteer_launch() {
        export PUPPETEER_CACHE_DIR
        node <<'EOF'
const fs = require('fs');
const puppeteer = require('puppeteer');

const candidatePaths = [
    process.env.PUPPETEER_EXECUTABLE_PATH,
    '/usr/bin/google-chrome-stable',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
].filter(Boolean);

(async () => {
    let executablePath = candidatePaths.find((candidate) => fs.existsSync(candidate));
    if (!executablePath) {
        executablePath = puppeteer.executablePath();
    }

    const browser = await puppeteer.launch({
        headless: true,
        executablePath,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
    });
    console.log(`✅ Puppeteer works with executable: ${executablePath}`);
    await browser.close();
})().catch((error) => {
    console.error('❌ Puppeteer test failed:', error);
    process.exit(1);
});
EOF
}

# Navigate to the directory containing this script.
cd "$SCRIPT_DIR"

echo ""
echo "📋 Step 1: Verify files are present"
if [ ! -f "dist/main.js" ]; then
    echo "❌ Error: dist/main.js not found. Did you upload the built code?"
    exit 1
fi

if [ ! -f ".env" ] && [ -z "${STRIPE_SECRET_KEY:-}" ]; then
    echo "❌ Error: backend/.env or STRIPE_SECRET_KEY is required"
    exit 1
fi

if [ ! -f "ecosystem.config.js" ]; then
    echo "❌ Error: ecosystem.config.js not found in backend root"
    exit 1
fi

echo "✅ All required files present"

echo ""
echo "📋 Step 2: Sync CV template assets into dist/public"
ensure_cv_template_assets

echo ""
echo "📋 Step 3: Install Chrome dependencies for headless Ubuntu"
ensure_chrome_dependencies
echo "✅ Chrome dependencies ready"

echo ""
echo "📋 Step 4: Ensure browser executable is available for Puppeteer"
ensure_puppeteer_browser

echo ""
echo "📋 Step 5: Verify Puppeteer can launch Chrome"
verify_puppeteer_launch

echo ""
echo "📋 Step 6: Stop current PM2 process"
pm2 stop TALEMISTRY || true

echo ""
echo "📋 Step 7: Delete old PM2 process"
pm2 delete TALEMISTRY || true

echo ""
echo "📋 Step 8: Start with ecosystem.config.js (loads .env properly)"
NODE_ENV=PROD pm2 start ecosystem.config.js

echo ""
echo "📋 Step 9: Save PM2 configuration"
pm2 save

echo ""
echo "📋 Step 10: Verify PM2 status"
pm2 list

echo ""
echo "📋 Step 11: Check logs for errors"
echo "Showing last 30 lines of logs..."
pm2 logs TALEMISTRY --lines 30 --nostream

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🧪 To test CV generation:"
echo "   curl -X GET \"https://evryka.org/api/cv-pdf/download/YOUR_USER_ID?template=creative-blocks&color=teal\" \\"
echo "        -H \"Origin: https://evryka.org\" \\"
echo "        -H \"Authorization: Bearer YOUR_TOKEN\" \\"
echo "        --output test-cv.pdf"
echo ""
echo "📊 Monitor logs with: pm2 logs TALEMISTRY"
echo "🔄 Restart if needed: pm2 restart TALEMISTRY"

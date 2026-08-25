const path = require('path');
const fs = require('fs');

// Universal backend root - works locally and on server
const backendRoot = __dirname;
const puppeteerCacheDir = path.join(backendRoot, '.cache', 'puppeteer');

// Auto-detect .env location: prefer dist/.env (production) over root .env (development)
const distEnvPath = path.join(backendRoot, 'dist', '.env');
const rootEnvPath = path.join(backendRoot, '.env');
const envPath = fs.existsSync(distEnvPath) ? distEnvPath : rootEnvPath;

const envConfig = {};

if (fs.existsSync(envPath)) {
    console.log(`📄 Loading .env from: ${envPath}`);
    const envFile = fs.readFileSync(envPath, 'utf8');
    envFile.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
            const [key, ...values] = trimmed.split('=');
            if (key && values.length > 0) {
                envConfig[key.trim()] = values.join('=').trim().replace(/^['"]|['"]$/g, '');
            }
        }
    });
    console.log(`✅ Loaded ${Object.keys(envConfig).length} environment variables`);
} else {
    console.warn(`⚠️ .env file not found at: ${envPath}`);
}

module.exports = {
    apps: [
        {
            name: "TALEMISTRY",
            script: "dist/main.js",
            cwd: backendRoot,
            // Keep Node TLS behavior consistent in production.
            // Atlas requires TLS >= 1.2; explicitly setting helps avoid environment drift.
            node_args: "--max-old-space-size=4096 --openssl-legacy-provider --tls-min-v1.2 --tls-max-v1.2",
            instances: 1,
            exec_mode: "fork",
            autorestart: true,
            watch: false,
            env: {
                ...envConfig,
                OPENAI_API_KEY: process.env.OPENAI_API_KEY,
                NODE_ENV: "PROD",
                // Backend should not share the same port as the Next.js frontend.
                // Keep API on 4000 so web can reliably bind to 3000.
                PORT: 4000,
                NODE_NO_WARNINGS: "1",
                NODE_TLS_REJECT_UNAUTHORIZED: "0",
                NODE_OPTIONS: "--tls-min-v1.2 --tls-max-v1.2 --openssl-legacy-provider",
                // Puppeteer configuration for production
                PUPPETEER_SKIP_CHROMIUM_DOWNLOAD: "false",
                PUPPETEER_CACHE_DIR: puppeteerCacheDir
            }
        }
    ]
}

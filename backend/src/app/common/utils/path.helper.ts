import * as path from 'path';
import * as fs from 'fs';

export function getBaseDir(subPath?: string): string {
    // When running from dist, __dirname will be something like:
    // /var/www/evryka_org_usr/data/www/Evridis/backend/dist/app/common/utils
    // 
    // Two scenarios:
    // 1. Development (nest start --watch): content is in backend root (4 levels up)
    // 2. Production (PM2 after build): content is copied to dist/ (3 levels up)
    //
    // Strategy: Check if content exists at dist level first, else go to backend root

    let baseDir: string;

    if (__dirname.includes('dist')) {
        // Try dist level first (production with copied artifacts)
        const distLevel = path.resolve(__dirname, '..', '..', '..');
        const distContentPath = path.join(distLevel, 'content');

        if (fs.existsSync(distContentPath)) {
            // Production: content was copied to dist/ during build
            baseDir = distLevel;
            console.log(`getBaseDir (PROD) - using dist level: ${baseDir}`);
        } else {
            // Development: content is in backend root
            baseDir = path.resolve(__dirname, '..', '..', '..', '..');
            console.log(`getBaseDir (DEV in dist) - using backend root: ${baseDir}`);
        }
    } else {
        // Running from src/ in development (shouldn't happen with compiled code)
        baseDir = path.resolve(__dirname, '..', '..', '..');
        console.log(`getBaseDir (DEV in src) - using backend root: ${baseDir}`);
    }

    if (subPath) {
        const fullPath = path.join(baseDir, subPath);
        console.log(`getBaseDir - final path with subPath '${subPath}': ${fullPath}`);
        return fullPath;
    }

    return baseDir;
}
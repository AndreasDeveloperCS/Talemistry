# Path Resolution Fix for Production Deployment

## Issue
When running the NestJS backend in production (compiled to `dist/` directory), the `getBaseDir()` function was not correctly resolving paths to the `content/` folder, causing "NotFoundInterceptor" errors when trying to access video files and PDFs.

### Error Symptoms
```
__dirname: /var/www/evryka_org_usr/data/www/Evridis/backend/dist/app/common/utils
NotFoundInterceptor [class PresentationContentController] error
Video file path: /var/www/evryka_org_usr/data/www/Evridis/backend/dist/app/common/utils/content/video-promo-background.mp4
```

## Root Cause
The `getBaseDir()` function was not properly detecting whether the code was running from the `dist/` directory (production) or `src/` directory (development), resulting in incorrect path resolution.

Additionally, the presentation-content controller had a bug where it was using `getBaseDir('content')` but the function wasn't using the `subPath` parameter correctly.

## Solution

### 1. Fixed `path.helper.ts`
**File:** `backend/src/app/common/utils/path.helper.ts`

```typescript
export function getBaseDir(subPath?: string): string {
    // When running from dist, __dirname will be something like:
    // /var/www/evryka_org_usr/data/www/Evridis/backend/dist/app/common/utils
    // We need to go up to the backend root (where content/ folder is)

    let baseDir: string;

    if (__dirname.includes('dist')) {
        // In production: dist/app/common/utils -> go up to backend root
        baseDir = path.resolve(__dirname, '..', '..', '..', '..');
    } else {
        // In development: src/app/common/utils -> go up to backend root
        baseDir = path.resolve(__dirname, '..', '..', '..');
    }

    console.log(`getBaseDir - __dirname: ${__dirname}`);
    console.log(`getBaseDir - resolved baseDir: ${baseDir}`);

    if (subPath) {
        const fullPath = path.join(baseDir, subPath);
        console.log(`getBaseDir - with subPath '${subPath}': ${fullPath}`);
        return fullPath;
    }

    return baseDir;
}
```

**Changes:**
- Detects if running from `dist/` directory
- In production: goes up 4 directories from `dist/app/common/utils` to reach backend root
- In development: goes up 3 directories from `src/app/common/utils` to reach backend root
- Added debug logging to track path resolution
- Properly uses `subPath` parameter when provided

### 2. Fixed `presentation-content.controller.ts`
**File:** `backend/src/app/modules/presentation-content/controllers/presentation-content.controller.ts`

#### Before (Incorrect):
```typescript
const filePath = path.resolve(getBaseDir('content'), 'content', 'video-promo-background.mp4');
// This would result in: .../backend/content/content/video-promo-background.mp4
```

#### After (Correct):
```typescript
const filePath = path.join(getBaseDir(), 'content', 'video-promo-background.mp4');
// This correctly results in: .../backend/content/video-promo-background.mp4
```

**Changes:**
- Changed from `path.resolve()` to `path.join()`
- Call `getBaseDir()` without parameters (get backend root)
- Then join with `'content'` and filename
- Fixed for all three endpoints: PDF download, video-promo-background, video-promo-comp

## Directory Structure
```
backend/
├── src/                          # Development source code
│   └── app/
│       └── common/
│           └── utils/
│               └── path.helper.ts
├── dist/                         # Production compiled code
│   └── app/
│       └── common/
│           └── utils/
│               └── path.helper.js
├── content/                      # Static content files
│   ├── EVRYKA - Digital Innovative Solutions.pdf
│   ├── video-promo-background.mp4
│   └── video-promo-comp.mp4
├── public/
└── node_modules/
```

## Path Resolution Examples

### Development (running from src/)
```
__dirname: /path/to/backend/src/app/common/utils
baseDir:   /path/to/backend                    (up 3 levels)
filePath:  /path/to/backend/content/video.mp4
```

### Production (running from dist/)
```
__dirname: /var/www/.../Evridis/backend/dist/app/common/utils
baseDir:   /var/www/.../Evridis/backend                        (up 4 levels)
filePath:  /var/www/.../Evridis/backend/content/video.mp4
```

## Testing

### Verify Path Resolution
Check the console logs when the server starts:
```
getBaseDir - __dirname: /var/www/.../backend/dist/app/common/utils
getBaseDir - resolved baseDir: /var/www/.../backend
```

### Test Endpoints
1. **PDF Download:**
   ```
   GET /api/presentation-content/pdf
   ```
   Should download: `EVRYKA - Digital Innovative Solutions.pdf`

2. **Background Video:**
   ```
   GET /api/presentation-content/video-promo-background
   ```
   Should stream: `video-promo-background.mp4`

3. **Promo Video:**
   ```
   GET /api/presentation-content/video-promo-comp
   ```
   Should stream: `video-promo-comp.mp4`

## Deployment Checklist
- [ ] Ensure `content/` folder exists in backend root
- [ ] Verify all content files are present
- [ ] Rebuild backend: `npm run build`
- [ ] Check console logs for correct path resolution
- [ ] Test all presentation-content endpoints
- [ ] Restart backend service: `pm2 restart evridis-backend`

## Other Files Using `getBaseDir()`
The fix applies globally to all modules using this helper:
- `main.ts` - Static asset serving
- `app.module.ts` - ServeStaticModule configuration
- `video.controller.ts` - Video chat views
- `log-service.ts` - Log file paths (has its own private getBaseDir method)
- `transport-gateway.ts` - WebSocket gateway

All these should now correctly resolve paths in both development and production environments.

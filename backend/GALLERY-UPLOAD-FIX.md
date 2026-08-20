# Gallery Photo Upload - Production Fix Guide

## Problem
Gallery photo upload works locally but returns 404 error in production:
- URL: `https://evryka.org/api/companies-verified/{companyId}/photo-gallery`
- Error: `404 Not Found`
- Local: Working ✅
- Production: Not Working ❌

## Root Cause Analysis
The backend endpoint is properly defined in the code:
- Controller: `company-verified.controller.ts`
- Route: `@Post(':_id/photo-gallery')` at line 116
- Module: Properly registered in `companies.module.ts`

**Most likely cause**: Production server has outdated build artifacts or hasn't been restarted with the latest code.

## Solution

### Option 1: Quick Fix (Recommended)
Run the automated fix script on the production server:

```bash
cd /var/www/evryka_org_usr/data/www/Evridis/backend
chmod +x fix-gallery-deployment.sh
./fix-gallery-deployment.sh
```

### Option 2: Manual Fix
If you prefer to do it step by step:

```bash
# 1. Navigate to backend
cd /var/www/evryka_org_usr/data/www/Evridis/backend

# 2. Pull latest code (if not already done)
cd ..
git pull https://AndreasDeveloperCs:<YOUR_GITHUB_TOKEN>@github.com/AndreasDeveloperCS/Evridis.git
cd backend

# 3. Install dependencies
npm install

# 4. Clean build
rm -rf dist
npm run build

# 5. Restart PM2
pm2 delete EVRYKA
pm2 start ecosystem.config.js
pm2 save
```

### Option 3: Full Deployment
Use the existing deployment script:

```bash
cd /var/www/evryka_org_usr/data/www/Evridis
./deploy.sh
```

## Verification Steps

### 1. Check if endpoint exists
```bash
# Check if the route is registered in the build
grep -r "photo-gallery" /var/www/evryka_org_usr/data/www/Evridis/backend/dist/app/modules/companies/controllers/
```

### 2. Test the GET endpoint (should work for verified companies)
```bash
curl -X GET "https://evryka.org/api/companies-verified/68c977520527632943404ae7/photo-gallery"
```

Expected response:
```json
{
  "canEdit": true/false,
  "items": []
}
```

### 3. Test POST endpoint (requires authentication)
```bash
# You'll need a valid JWT token
curl -X POST "https://evryka.org/api/companies-verified/68c977520527632943404ae7/photo-gallery" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "files=@test-image.jpg"
```

### 4. Check PM2 logs
```bash
pm2 logs EVRYKA --lines 100
```

Look for:
- ✅ "PermissionGuard" logs showing the request
- ✅ No 404 errors
- ✅ Successful POST handling

### 5. Check nginx logs
```bash
tail -f /var/www/evryka_org_usr/data/logs/evryka.org-frontend.error.log
tail -f /var/www/evryka_org_usr/data/logs/evryka.org-frontend.access.log
```

## Common Issues

### Issue 1: Still getting 404
**Possible causes:**
- Build didn't complete successfully
- PM2 is running old code
- nginx isn't routing correctly

**Fix:**
```bash
# Check PM2 is running latest code
pm2 describe EVRYKA
# Look at "script path" - should be pointing to dist/main.js

# Force restart
pm2 delete EVRYKA
pm2 start ecosystem.config.js --update-env
pm2 save

# Restart nginx
sudo systemctl restart nginx
```

### Issue 2: Permission denied
**Possible causes:**
- User lacks permission to edit company
- Authentication token invalid

**Fix:**
- Ensure user is authenticated
- Check user has HM (Hiring Manager) role or owns the company
- Verify token is being sent in Authorization header

### Issue 3: CORS errors
**Possible causes:**
- nginx blocking preflight requests
- Missing CORS headers

**Fix:**
Already configured in the controller with:
```typescript
response.header('Access-Control-Allow-Origin', request.headers.origin);
```

## Backend Code Reference

### Controller: `company-verified.controller.ts`

The POST endpoint is defined at line 116:
```typescript
@Post(':_id/photo-gallery')
@UseInterceptors(FilesInterceptor('files', 20, { storage: multer.memoryStorage() }))
async uploadPhotoGallery(
    @Param('_id') _id: string,
    @Body('caption') caption: string,
    @Req() request: Request,
    @Res() response: Response,
    @UploadedFiles() files: Express.Multer.File[]
): Promise<any>
```

### Permissions

The endpoint is protected by PermissionGuard:
- Route: `companies-verified`
- Allowed methods: `['GET', 'POST', 'PUT', 'PATCH', 'DELETE']`
- Roles: HM (Hiring Manager)
- Access: User must own the company or have shared edit access

### Frontend Service

Location: `tab-frontend/src/app/modules/companies/services/company-photo-gallery.service.ts`

Upload method (line 54):
```typescript
upload(companyId: string, files: File[], caption?: string): Observable<CompanyPhotoGalleryResponse> {
    const url = `${this.baseApi}/companies-verified/${companyId}/photo-gallery`;
    // ... sends POST with FormData
}
```

## Additional Notes

1. **File Upload Limits:**
   - Max files: 20
   - Max size per file: 20MB
   - Accepted types: png, jpeg, jpg, gif, webp

2. **Storage:**
   - Files are uploaded to AWS S3
   - Folder: `photo-gallery/{companyId}`
   - URLs are CloudFront URLs

3. **Database:**
   - Photos stored in `company.photoGallery` array
   - Each item has: id, key, url, originalName, mimetype, size, caption, order, createdDate, createdBy

## Support

If the issue persists after following these steps:

1. Check PM2 logs: `pm2 logs EVRYKA`
2. Check nginx logs in `/var/www/evryka_org_usr/data/logs/`
3. Verify MongoDB connection is stable
4. Check if other POST endpoints are working
5. Verify AWS S3 credentials are configured

## Success Indicators

You'll know it's fixed when:
- ✅ GET request returns `{ canEdit: boolean, items: [] }`
- ✅ POST request uploads files successfully
- ✅ No 404 errors in browser console
- ✅ Photos appear in company gallery
- ✅ PM2 logs show successful requests

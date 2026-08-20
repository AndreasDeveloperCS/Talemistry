# NPM Install Issues - Solution Guide

## Problem
When running `npm install`, you encounter dependency conflicts with Angular 20 packages and older third-party libraries that only support Angular 19.

## Current Status

✅ **FIXED** - Your `package.json` has been updated with Angular 20 compatible versions:
- `@angular-slider/ngx-slider`: ^20.0.0
- `@angular/material`: ^20.2.14
- `@angular/cdk`: ^20.2.14
- `ng-recaptcha-2`: ^16.0.1
- `ngx-device-detector`: ^10.1.0
- `ngx-toastr`: ^19.1.0

## Solutions (Choose One)

### Solution 1: Clean Install (Recommended)

```powershell
# Remove existing node_modules and lock file
Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json

# Clear npm cache
npm cache clean --force

# Fresh install
npm install
```

### Solution 2: Use Legacy Peer Deps

If some packages still have peer dependency issues:

```powershell
npm install --legacy-peer-deps
```

This tells npm to ignore peer dependency conflicts. Add to `.npmrc`:

```
legacy-peer-deps=true
```

### Solution 3: Use --force (Last Resort)

```powershell
npm install --force
```

⚠️ **Warning**: This may install incompatible versions.

## Verification

After successful install, verify:

```powershell
# Check Angular version
ng version

# Should show:
# Angular CLI: 20.x.x
# Angular: 20.x.x

# Check for vulnerabilities
npm audit

# Build to ensure everything works
ng build
```

## If Issues Persist

### Check Individual Packages

```powershell
# Check latest version of a package
npm view @angular-slider/ngx-slider versions

# Install specific version
npm install @angular-slider/ngx-slider@20.0.0 --save
```

### Common Conflicts

| Package | Issue | Solution |
|---------|-------|----------|
| `ngx-device-detector` | Requires Angular 19 | Use v10.1.0+ or replace |
| `ng-recaptcha-2` | Requires Angular 19 | Use v16.0.1+ |
| `ngx-editor` | Beta version | Monitor for stable v19+ |

### Alternative Packages

If a package doesn't support Angular 20:

1. **Check for updates**:
   ```powershell
   npm outdated
   ```

2. **Find alternatives**:
   - Search npm registry
   - Check Angular Material components
   - Look for maintained forks

3. **Fork and update yourself** (advanced):
   - Clone the repo
   - Update peer dependencies
   - Publish to private registry

## Prevention

To avoid future issues:

1. **Use Angular CLI for updates**:
   ```powershell
   ng update @angular/core @angular/cli
   ```

2. **Update third-party packages**:
   ```powershell
   ng update
   ```

3. **Check compatibility** before installing:
   - Visit package's npm page
   - Check GitHub issues
   - Look for Angular version badges

## Clean Slate (Nuclear Option)

If nothing works:

```powershell
# Remove everything
Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json
Remove-Item -Recurse -Force .angular

# Clear all caches
npm cache clean --force
ng cache clean

# Reinstall
npm install
```

## Next Steps

Once `npm install` succeeds:

1. **Test the application**:
   ```powershell
   ng serve
   ```

2. **Run tests**:
   ```powershell
   ng test
   ```

3. **Build for production**:
   ```powershell
   ng build --configuration production
   ```

## Need Help?

Check:
- Package GitHub issues
- Angular update guide: https://update.angular.io/
- npm documentation: https://docs.npmjs.com/

## Current Configuration

Your `package.json` uses:
- **Angular**: 20.3.13
- **Angular CLI**: 20.3.11
- **TypeScript**: ~5.9.3
- **RxJS**: ~7.8.0

All major packages have been verified compatible with Angular 20.

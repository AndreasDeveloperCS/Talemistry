const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const v8 = require('v8');
const { error } = require('console');
const start = Date.now();

const CWD = process.cwd();
const DIST_DIR = path.join(CWD, 'dist');
const EXPECTED_ENTRY = path.join(DIST_DIR, 'main.js');

// ----------------- helpers -----------------
function logHeader() {
    console.log('📦 Starting TypeScript build (preferred: tsc -> dist)');
    console.log('🧠 V8 Heap Limit:', Math.round(v8.getHeapStatistics().heap_size_limit / 1024 / 1024), 'MB');
    console.log('📂 CWD:', CWD);
    console.log('🟣 Node:', process.version);
    try {
        const npmVersion = spawnSync('npm', ['-v'], { encoding: 'utf8' }).stdout?.trim();
        console.log('🔍 npm:', npmVersion || 'not found in PATH');
    } catch (e) {
        console.error('❌ Failed to get npm version:', e.message || e);
    }
}

function cleanDist() {
    try {
        if (fs.existsSync(DIST_DIR)) {
            console.log('🧹 Cleaning dist folder:', DIST_DIR);
            if (fs.rmSync) {
                fs.rmSync(DIST_DIR, { recursive: true, force: true });
            } else {
                fs.rmdirSync(DIST_DIR, { recursive: true });
            }
        } else {
            console.log('ℹ️ dist folder does not exist yet, nothing to clean.');
        }
    } catch (e) {
        console.error('❌ Failed to clean dist folder:', e.message || e);
        process.exit(1);
    }
}

function cleanTsBuildInfo() {
    try {
        const infos = fs.readdirSync(CWD).filter(f => f.endsWith('.tsbuildinfo'));
        infos.forEach(f => {
            const full = path.join(CWD, f);
            try {
                fs.unlinkSync(full);
                console.log('🧹 Removed tsbuildinfo:', full);
            } catch (e) {
                console.error('clean Ts Build Info', e);

                // non-fatal
            }
        });
    } catch (e) {
        // ignore
        console.error('clean Ts Build Info', e);
    }
}

function checkDist(summaryOnly = false) {
    if (!fs.existsSync(DIST_DIR)) {
        console.error('❌ No dist folder found after build. Build likely failed.');
        return false;
    }

    console.log('✅ dist folder found:', DIST_DIR);
    try {
        const topLevel = fs.readdirSync(DIST_DIR);
        console.log('📁 dist content (top-level):', topLevel);

        if (!summaryOnly) {
            // Search recursively for any main.js inside dist (some projects emit nested structure)
            const found = (function findMain(dir) {
                const entries = fs.readdirSync(dir, { withFileTypes: true });
                for (const e of entries) {
                    const full = path.join(dir, e.name);
                    if (e.isFile() && e.name === 'main.js') return full;
                    if (e.isDirectory()) {
                        const res = findMain(full);
                        if (res) return res;
                    }
                }
                return null;
            })(DIST_DIR);

            if (!found) {
                console.error(
                    '❌ No main.js found anywhere inside dist.\n' +
                    '   This usually means:\n' +
                    '   - src/main.ts was not compiled (TypeScript errors), OR\n' +
                    '   - rootDir/outDir mapping produced a nested output (main.js under subfolder), OR\n' +
                    '   - "noEmit" is enabled in tsconfig.\n' +
                    '   To debug, run tsc with --listEmittedFiles or inspect the generated tsc logs.'
                );
                return false;
            }

            console.log('📍 Found compiled entry at:', found);
        }

        return true;
    } catch (e) {
        console.error('❌ Failed to read dist folder content:', e.message || e);
        return false;
    }
}

function copyArtifacts() {
    console.log('📦 Copying artifacts to dist folder...');

    const artifactsToCopy = [
        { src: 'content', dest: path.join(DIST_DIR, 'content'), type: 'dir' },
        { src: 'public', dest: path.join(DIST_DIR, 'public'), type: 'dir' },
        { src: 'static-content', dest: path.join(DIST_DIR, 'static-content'), type: 'dir' },
        { src: 'client_certs', dest: path.join(DIST_DIR, 'client_certs'), type: 'dir' },
        { src: 'config.json', dest: path.join(DIST_DIR, 'config.json'), type: 'file' },
        { src: 'config.prod.json', dest: path.join(DIST_DIR, 'config.prod.json'), type: 'file' }
    ];

    for (const artifact of artifactsToCopy) {
        const srcPath = path.join(CWD, artifact.src);
        const destPath = artifact.dest;

        if (!fs.existsSync(srcPath)) {
            console.log(`⚠️ Source not found, skipping: ${artifact.src}`);
            continue;
        }

        try {
            if (artifact.type === 'dir') {
                // Copy directory recursively
                if (fs.existsSync(destPath)) {
                    console.log(`🧹 Cleaning existing: ${artifact.src}`);
                    if (fs.rmSync) {
                        fs.rmSync(destPath, { recursive: true, force: true });
                    } else {
                        fs.rmdirSync(destPath, { recursive: true });
                    }
                }

                console.log(`📂 Copying directory: ${artifact.src} -> dist/`);
                copyDirRecursive(srcPath, destPath);
                console.log(`✅ Copied: ${artifact.src}`);
            } else {
                // Copy file
                console.log(`📄 Copying file: ${artifact.src} -> dist/`);
                fs.copyFileSync(srcPath, destPath);
                console.log(`✅ Copied: ${artifact.src}`);
            }
        } catch (e) {
            console.error(`❌ Failed to copy ${artifact.src}:`, e.message || e);
            return false;
        }
    }

    console.log('✅ All artifacts copied successfully');
    return true;
}

function validateCvTemplateAssets() {
    const sourceRoot = path.join(CWD, 'public', 'cv-templates');
    const distRoot = path.join(DIST_DIR, 'public', 'cv-templates');
    const requiredSubdirs = ['html', 'styles'];

    if (!fs.existsSync(sourceRoot)) {
        console.error('❌ Missing source CV templates directory:', sourceRoot);
        return false;
    }

    for (const subdir of requiredSubdirs) {
        const sourceDir = path.join(sourceRoot, subdir);
        const distDir = path.join(distRoot, subdir);

        if (!fs.existsSync(sourceDir)) {
            console.error(`❌ Missing source CV template ${subdir} directory: ${sourceDir}`);
            return false;
        }

        if (!fs.existsSync(distDir)) {
            console.error(`❌ Missing dist CV template ${subdir} directory: ${distDir}`);
            return false;
        }

        const sourceFiles = fs.readdirSync(sourceDir)
            .filter((fileName) => fs.statSync(path.join(sourceDir, fileName)).isFile())
            .sort();
        const distFiles = fs.readdirSync(distDir)
            .filter((fileName) => fs.statSync(path.join(distDir, fileName)).isFile())
            .sort();

        const missingFiles = sourceFiles.filter((fileName) => !distFiles.includes(fileName));

        if (missingFiles.length > 0) {
            console.error(`❌ Missing CV template ${subdir} files in dist:`, missingFiles);
            return false;
        }

        console.log(`✅ CV template ${subdir} assets verified: ${sourceFiles.length} files`);
    }

    return true;
}

function generateBuildInfo() {
    console.log('🔖 Generating build-info.ts...');

    let commit = 'local';
    try {
        const res = spawnSync('git', ['rev-parse', '--short', 'HEAD'], { encoding: 'utf8', shell: false });
        if (res.status === 0 && res.stdout) {
            commit = res.stdout.trim();
        }
    } catch (e) {
        console.warn('⚠️ Could not read git commit:', e && e.message ? e.message : e);
    }

    let packageVersion = '1.0.0';
    try {
        const pkg = JSON.parse(fs.readFileSync(path.join(CWD, 'package.json'), 'utf8'));
        packageVersion = pkg.version || packageVersion;
    } catch (e) {
        console.warn('⚠️ Could not read package.json version:', e && e.message ? e.message : e);
    }

    const builtAt = new Date().toISOString();
    const version = `backend-${packageVersion}-${commit}`;

    const content = `export const buildInfo = {
    service: 'backend',
    version: '${version}',
    commit: '${commit}',
    builtAt: '${builtAt}',
};\n`;

    const buildInfoPath = path.join(CWD, 'src', 'build-info.ts');
    try {
        fs.writeFileSync(buildInfoPath, content, 'utf8');
        console.log(`✅ build-info.ts written: version=${version}, commit=${commit}, builtAt=${builtAt}`);
    } catch (e) {
        console.error('❌ Failed to write build-info.ts:', e && e.message ? e.message : e);
        process.exit(1);
    }
}

function copyDirRecursive(src, dest) {
    // Create destination directory
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }

    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
            copyDirRecursive(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

function runTsc(tscBin) {
    console.log('ℹ️ Running tsc (tsconfig.build.json) via', tscBin);

    // First try the platform tsc binary (node_modules/.bin/tsc.cmd or tsc)
    try {
        const res = spawnSync(
            tscBin,
            [
                '--project',
                'tsconfig.build.json',
                '--pretty',
                'false',
                '--outDir',
                'dist',
                '--rootDir',
                'src',
            ],
            { stdio: 'inherit', shell: false }
        );

        const duration = ((Date.now() - start) / 1000).toFixed(2);

        if (res.status === 0) {
            console.log(`✅ tsc (bin) finished in ${duration}s`);
            return true;
        }

        console.error(`❌ TypeScript (bin) exited with code ${res.status} after ${duration}s.`);
        console.error('   Will attempt to invoke TypeScript compiler directly with Node for more reliable emission.');
    } catch (e) {
        console.error('❌ Failed invoking tsc binary:', e && e.message ? e.message : e);
        console.error('   Will attempt to invoke TypeScript compiler directly with Node.');
    }

    // Fallback: invoke the installed TypeScript compiler via node (tsc.js)
    const tscJs = path.join('node_modules', 'typescript', 'lib', 'tsc.js');
    if (!fs.existsSync(tscJs)) {
        console.error('❌ tsc.js not found at', tscJs);
        return false;
    }

    console.log('ℹ️ Running tsc (tsconfig.build.json) via node', process.execPath, tscJs);
    const resNode = spawnSync(
        process.execPath,
        [
            tscJs,
            '--project',
            'tsconfig.build.json',
            '--pretty',
            'false',
            '--outDir',
            'dist',
            '--rootDir',
            'src',
        ],
        { encoding: 'utf8', shell: false }
    );

    // Print stdout/stderr from the node-invoked tsc for diagnostics
    if (resNode.stdout) console.log(resNode.stdout);
    if (resNode.stderr) console.error(resNode.stderr);

    const durationNode = ((Date.now() - start) / 1000).toFixed(2);
    if (resNode.status !== 0) {
        console.error(`❌ TypeScript (node) compilation failed with exit code ${resNode.status} after ${durationNode}s.`);
        return false;
    }

    console.log(`✅ tsc (node) finished in ${durationNode}s`);
    // Emit a list of emitted files for debugging
    try {
        const emitted = spawnSync(process.execPath, [tscJs, '-p', 'tsconfig.build.json', '--listEmittedFiles', '--pretty', 'false', '--outDir', 'dist', '--rootDir', 'src'], { encoding: 'utf8', shell: false });
        const emitLog = path.join(CWD, 'tsc-emitted.log');
        fs.writeFileSync(emitLog, (emitted.stdout || '') + (emitted.stderr || ''));
        console.log('ℹ️ Wrote emitted files output to', emitLog);
    } catch (e) {
        console.error('❌ Failed to write emitted files log:', e && e.message ? e.message : e);
    }
    return true;
}

function runNestFallback() {
    const nestCli = path.join('node_modules', '@nestjs', 'cli', 'bin', 'nest.js');

    if (!fs.existsSync(nestCli)) {
        console.error('❌ Nest CLI not found, cannot fallback to `nest build`.');
        return false;
    }

    console.log('ℹ️ Falling back to Nest CLI build:', nestCli);

    const res = spawnSync(
        process.execPath,
        ['--max-old-space-size=4096', nestCli, 'build'],
        { stdio: 'inherit' }
    );
    const duration = ((Date.now() - start) / 1000).toFixed(2);

    if (res.status !== 0) {
        console.error(`❌ Nest CLI build failed with exit code ${res.status} after ${duration}s.`);
        console.error('   See Nest build error diagnostics above for the exact cause.');
        return false;
    }

    console.log(`✅ Nest build finished in ${duration}s`);
    return true;
}

function dumpTscDiagnostics() {
    const tscJs = path.join('node_modules', 'typescript', 'lib', 'tsc.js');
    if (!fs.existsSync(tscJs)) {
        console.error('❌ tsc.js not found for diagnostics at', tscJs);
        return;
    }

    const listFile = path.join(CWD, 'tsc-listfiles.log');
    const showConfigFile = path.join(CWD, 'tsc-showconfig.log');
    const emittedFile = path.join(CWD, 'tsc-emitted.log');

    console.log('ℹ️ Running diagnostics: tsc --listFiles and tsc --showConfig');

    try {
        const resList = spawnSync(process.execPath, [tscJs, '-p', 'tsconfig.build.json', '--listFiles', '--pretty', 'false'], { encoding: 'utf8', shell: false });
        fs.writeFileSync(listFile, (resList.stdout || '') + (resList.stderr || ''));
        console.log('ℹ️ Wrote listFiles output to', listFile);
    } catch (e) {
        console.error('❌ Failed to run tsc --listFiles:', e && e.message ? e.message : e);
    }

    try {
        const resConfig = spawnSync(process.execPath, [tscJs, '-p', 'tsconfig.build.json', '--showConfig'], { encoding: 'utf8', shell: false });
        fs.writeFileSync(showConfigFile, (resConfig.stdout || '') + (resConfig.stderr || ''));
        console.log('ℹ️ Wrote showConfig output to', showConfigFile);
    } catch (e) {
        console.error('❌ Failed to run tsc --showConfig:', e && e.message ? e.message : e);
    }

    try {
        const resEmitted = spawnSync(process.execPath, [tscJs, '-p', 'tsconfig.build.json', '--listEmittedFiles', '--pretty', 'false'], { encoding: 'utf8', shell: false });
        fs.writeFileSync(emittedFile, (resEmitted.stdout || '') + (resEmitted.stderr || ''));
        console.log('ℹ️ Wrote emitted files output to', emittedFile);
    } catch (e) {
        console.error('❌ Failed to run tsc --listEmittedFiles:', e && e.message ? e.message : e);
    }

    console.log('ℹ️ Inspect the generated logs to see which files tsc considered and the resolved compiler options.');
}

// ----------------- main flow -----------------
logHeader();

const tscBin = path.join(
    'node_modules',
    '.bin',
    process.platform === 'win32' ? 'tsc.cmd' : 'tsc'
);
const tscExists = fs.existsSync(tscBin);

generateBuildInfo(); // stamp version/commit/timestamp into src/build-info.ts
cleanDist(); // always start clean
cleanTsBuildInfo();

if (tscExists) {
    const ok = runTsc(tscBin);
    if (ok) {
        const distOk = checkDist();
        if (!distOk) {
            console.error('❌ Build completed, but expected artifacts are missing (e.g. dist/main.js).');
            console.error('   Re-check tsconfig rootDir/outDir and entry file location (src/main.ts).');
            dumpTscDiagnostics();
            process.exit(1);
        }

        // Copy artifacts after successful build
        const artifactsOk = copyArtifacts();
        if (!artifactsOk) {
            console.error('⚠️ Some artifacts failed to copy, but build was successful.');
        }

        const cvTemplatesOk = validateCvTemplateAssets();
        if (!cvTemplatesOk) {
            console.error('❌ Build completed, but CV template runtime assets are missing from dist/public/cv-templates.');
            process.exit(1);
        }

        console.log('✅ Build completed successfully with tsc, all expected artifacts present.');
        process.exit(0);
    } else {
        console.error('⚠️ tsc build failed. Attempting Nest CLI fallback...');
    }
} else {
    console.error('⚠️ tsc binary not found. Attempting Nest CLI fallback...');
}

const nestOk = runNestFallback();
if (!nestOk) {
    checkDist(true);
    dumpTscDiagnostics();
    console.error('❌ Neither tsc nor Nest CLI build completed successfully.');
    process.exit(1);
}

const distOk = checkDist();
if (!distOk) {
    console.error('❌ Nest build completed but dist is incomplete (e.g. no main.js).');
    dumpTscDiagnostics();
    process.exit(1);
}

// Copy artifacts after successful Nest build
const artifactsOk = copyArtifacts();
if (!artifactsOk) {
    console.error('⚠️ Some artifacts failed to copy, but build was successful.');
}

const cvTemplatesOk = validateCvTemplateAssets();
if (!cvTemplatesOk) {
    console.error('❌ Nest build completed, but CV template runtime assets are missing from dist/public/cv-templates.');
    process.exit(1);
}

console.log('✅ Build completed successfully with Nest CLI, all expected artifacts present.');
process.exit(0);

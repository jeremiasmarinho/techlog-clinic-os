/**
 * Frontend TypeScript Build Script
 * Compiles TypeScript files from public/js/ to public/dist/
 * Uses esbuild for fast compilation
 */

const esbuild = require('esbuild');
const { glob } = require('glob');
const path = require('path');
const fs = require('fs');

// Configuration
const isProduction = process.env.NODE_ENV === 'production';
const isWatch = process.argv.includes('--watch');

console.log('🔨 Building frontend TypeScript files...');
console.log(`📦 Mode: ${isProduction ? 'production' : 'development'}`);
console.log(`👀 Watch: ${isWatch ? 'enabled' : 'disabled'}`);

// Ensure output directory exists
const outDir = path.join(__dirname, 'public', 'dist');
if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
    console.log('✅ Created output directory:', outDir);
}

// Find all TypeScript entry points
async function findEntryPoints() {
    const tsFiles = await glob('public/js/**/*.ts', {
        ignore: ['**/*.spec.ts', '**/*.test.ts', '**/node_modules/**'],
    });

    console.log(`📂 Found ${tsFiles.length} TypeScript files to compile`);
    return tsFiles;
}

// Build configuration
async function build() {
    try {
        const entryPoints = await findEntryPoints();

        if (entryPoints.length === 0) {
            console.log('⚠️  No TypeScript files found to compile');
            return;
        }

        const buildOptions = {
            entryPoints,
            bundle: false,
            outdir: 'public/dist',
            outbase: 'public/js',
            format: 'esm',
            target: 'es2020',
            sourcemap: !isProduction,
            minify: isProduction,
            keepNames: true,
            platform: 'browser',
            logLevel: 'info',
        };

        if (isWatch) {
            const context = await esbuild.context(buildOptions);
            await context.watch();
            console.log('👀 Watching for changes...');
        } else {
            await esbuild.build(buildOptions);
            console.log('✅ Build completed successfully!');
        }
    } catch (error) {
        console.error('❌ Build failed:', error);
        process.exit(1);
    }
}

// Run build
build();

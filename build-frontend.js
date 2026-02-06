/**
 * Frontend Build Script using esbuild
 * Compiles TypeScript files in public/js/ to public/dist/
 */
const esbuild = require('esbuild');
const glob = require('glob');
const path = require('path');

const isWatch = process.argv.includes('--watch');
const isProduction = process.env.NODE_ENV === 'production';

const entryPoints = glob.sync('public/js/**/*.ts', {
    ignore: ['public/js/types/**/*.ts'],
});

if (entryPoints.length === 0) {
    console.log('⚠️  No TypeScript files found in public/js/');
    process.exit(0);
}

console.log(`📦 Building ${entryPoints.length} TypeScript files...`);
console.log(`   Mode: ${isProduction ? 'production' : 'development'}`);

const buildOptions = {
    entryPoints,
    bundle: true,
    outdir: 'public/dist',
    format: 'iife',
    target: 'es2020',
    sourcemap: !isProduction,
    minify: isProduction,
    outbase: 'public/js',
    logLevel: 'info',
};

async function build() {
    try {
        if (isWatch) {
            const ctx = await esbuild.context(buildOptions);
            await ctx.watch();
            console.log('👀 Watching for changes...');
        } else {
            const result = await esbuild.build(buildOptions);
            console.log(`✅ Frontend build complete! (${entryPoints.length} files)`);
            if (result.errors.length > 0) {
                console.error('❌ Build errors:', result.errors);
                process.exit(1);
            }
        }
    } catch (error) {
        console.error('❌ Build failed:', error);
        process.exit(1);
    }
}

build();

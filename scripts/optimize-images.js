#!/usr/bin/env node
/**
 * NEURALIS — Image Asset Optimizer
 * 
 * Compresses PNG images in assets/ to reduce app bundle size.
 * Keeps originals in assets/originals/ as backup.
 *
 * Usage:
 *   npm run optimize-images
 *
 * Requirements:
 *   npm install sharp --save-dev
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// ─── Config ────────────────────────────────────────────────────────────────
const ASSETS_DIR = path.resolve(__dirname, '..', 'assets');
const BACKUP_DIR = path.join(ASSETS_DIR, 'originals');

const TARGETS = {
    // Root assets — App icon & splash
    root: {
        dir: ASSETS_DIR,
        files: ['icon.png', 'adaptive-icon.png', 'splash.png'],
        maxWidth: 1024,   // Apple requires 1024×1024 for icon
        quality: 85,
    },
    // Fox mascot images
    fox: {
        dir: path.join(ASSETS_DIR, 'fox'),
        files: null, // all PNGs
        maxWidth: 512,    // fox images don't need to be huge
        quality: 80,
    },
};

// ─── Helpers ───────────────────────────────────────────────────────────────
function formatMB(bytes) {
    return (bytes / (1024 * 1024)).toFixed(2);
}

async function optimizeImage(filePath, maxWidth, quality) {
    const originalSize = fs.statSync(filePath).size;
    const metadata = await sharp(filePath).metadata();

    let pipeline = sharp(filePath);

    // Resize only if wider than maxWidth (preserve aspect ratio)
    if (metadata.width > maxWidth) {
        pipeline = pipeline.resize(maxWidth, null, { fit: 'inside', withoutEnlargement: true });
    }

    // Re-encode as optimized PNG
    pipeline = pipeline.png({ quality, compressionLevel: 9, effort: 10 });

    const buffer = await pipeline.toBuffer();
    const newSize = buffer.length;
    const savings = ((1 - newSize / originalSize) * 100).toFixed(1);

    // Write optimized file
    fs.writeFileSync(filePath, buffer);

    return { originalSize, newSize, savings };
}

// ─── Main ──────────────────────────────────────────────────────────────────
async function main() {
    console.log('🖼️  Neuralis Image Optimizer\n');

    // Create backup directory
    if (!fs.existsSync(BACKUP_DIR)) {
        fs.mkdirSync(BACKUP_DIR, { recursive: true });
        console.log(`📁 Created backup dir: ${BACKUP_DIR}\n`);
    }

    let totalOriginal = 0;
    let totalNew = 0;

    for (const [groupName, config] of Object.entries(TARGETS)) {
        console.log(`── ${groupName.toUpperCase()} ──`);
        const backupSubDir = groupName === 'root' ? BACKUP_DIR : path.join(BACKUP_DIR, groupName);
        if (!fs.existsSync(backupSubDir)) {
            fs.mkdirSync(backupSubDir, { recursive: true });
        }

        // Resolve file list
        let files = config.files;
        if (!files) {
            files = fs.readdirSync(config.dir).filter(f => f.toLowerCase().endsWith('.png'));
        }

        for (const file of files) {
            const filePath = path.join(config.dir, file);
            if (!fs.existsSync(filePath)) {
                console.log(`  ⚠️  Skipped (not found): ${file}`);
                continue;
            }

            // Backup original
            const backupPath = path.join(backupSubDir, file);
            if (!fs.existsSync(backupPath)) {
                fs.copyFileSync(filePath, backupPath);
            }

            try {
                const result = await optimizeImage(filePath, config.maxWidth, config.quality);
                totalOriginal += result.originalSize;
                totalNew += result.newSize;
                console.log(
                    `  ✅ ${file.padEnd(25)} ${formatMB(result.originalSize)} MB → ${formatMB(result.newSize)} MB  (−${result.savings}%)`
                );
            } catch (err) {
                console.log(`  ❌ ${file}: ${err.message}`);
            }
        }
        console.log();
    }

    console.log('═══════════════════════════════════════════');
    console.log(`Total: ${formatMB(totalOriginal)} MB → ${formatMB(totalNew)} MB  (saved ${formatMB(totalOriginal - totalNew)} MB)`);
    console.log('═══════════════════════════════════════════');
    console.log('\n💡 Originals backed up in assets/originals/');
    console.log('💡 Run "npx expo start --clear" to clear the cache after optimization.');
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});

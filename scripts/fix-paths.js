#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Post-build script to fix URL paths in HTML files
 * Replaces /public/downloads/ and /up_/up_/public/downloads/ with /downloads/
 */

const distDir = path.join(__dirname, '../dist');

function fixPathsInFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Replace /up_/up_/public/downloads/ with /downloads/ (with leading slash)
    if (content.includes('/up_/up_/public/downloads/')) {
        content = content.replace(/\/up_\/up_\/public\/downloads\//g, '/downloads/');
        modified = true;
    }

    // Replace up_/up_/public/downloads/ with /downloads/ (without leading slash, for minified HTML)
    if (content.includes('up_/up_/public/downloads/')) {
        content = content.replace(/up_\/up_\/public\/downloads\//g, '/downloads/');
        modified = true;
    }

    // Replace /up_/up_/downloads/ with /downloads/ (with leading slash)
    if (content.includes('/up_/up_/downloads/')) {
        content = content.replace(/\/up_\/up_\/downloads\//g, '/downloads/');
        modified = true;
    }

    // Replace up_/up_/downloads/ with /downloads/ (without leading slash, for minified HTML)
    if (content.includes('up_/up_/downloads/')) {
        content = content.replace(/up_\/up_\/downloads\//g, '/downloads/');
        modified = true;
    }

    // Replace /public/downloads/ with /downloads/
    if (content.includes('/public/downloads/')) {
        content = content.replace(/\/public\/downloads\//g, '/downloads/');
        modified = true;
    }

    if (modified) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✓ Fixed paths in: ${path.basename(filePath)}`);
    }
}

function processDirectory(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
            processDirectory(fullPath);
        } else if (entry.isFile() && entry.name.endsWith('.html')) {
            fixPathsInFile(fullPath);
        }
    }
}

console.log('🔧 Fixing URL paths in HTML files...');
processDirectory(distDir);
console.log('✅ Path fixing complete!');

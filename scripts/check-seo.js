#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Post-build SEO safety check.
 * Warns when a page other than the template:
 *  - still has a robots "noindex" meta (copied from article-template.html), or
 *  - still contains template placeholders ([Article Title], article-slug, ...).
 * Does not fail the build — prints a loud warning instead.
 */

const distDir = path.join(__dirname, '../dist');
// Pages that are intentionally noindex (template + internal references)
const SKIP_FILES = ['article-template.html', 'design-system.html', 'buttons.html'];
const NOINDEX_REGEX = /<meta[^>]*name=["']?robots["']?[^>]*noindex/i;
const PLACEHOLDERS = ['[Article Title]', '[Article summary', '[Describe the cover image]', 'article-slug'];

const warnings = [];

for (const file of fs.readdirSync(distDir)) {
  if (!file.endsWith('.html') || SKIP_FILES.includes(file)) continue;

  const content = fs.readFileSync(path.join(distDir, file), 'utf8');

  if (NOINDEX_REGEX.test(content)) {
    warnings.push(`${file}: has robots "noindex" — Google will NOT index it. Replace with: <meta name="robots" content="index, follow, max-image-preview:large" />`);
  }

  const found = PLACEHOLDERS.filter((p) => content.includes(p));
  if (found.length) {
    warnings.push(`${file}: still contains template placeholders: ${found.join(', ')}`);
  }
}

if (warnings.length) {
  console.warn('\n\x1b[33m⚠️  SEO CHECK — action needed before deploying:\x1b[0m');
  warnings.forEach((w) => console.warn(`\x1b[33m  • ${w}\x1b[0m`));
  console.warn('');
} else {
  console.log('✓ SEO check passed (no stray noindex or template placeholders)');
}

#!/usr/bin/env node

/**
 * Validate Frontmatter Script
 *
 * Valida arquivos Markdown em content/ para garantir que
 * o frontmatter está correto antes do build.
 *
 * Uso:
 *   node scripts/validate-frontmatter.js        # Valida e mostra erros
 *   node scripts/validate-frontmatter.js --check # Valida e retorna código de erro
 */

const fs = require('fs');
const path = require('path');
const { parseContentFrontmatter } = require('./lib/parse-frontmatter.cjs');

const CONTENT_DIR = path.join(__dirname, '..', 'content');

// Schema esperado para cada tipo
const SCHEMAS = {
  page: {
    required: ['title', 'slug', 'type'],
    optional: ['status', 'published', 'summary', 'description', 'order', 'featured_image', 'og_image', 'publishedAt', 'created_at', 'updated_at']
  },
  work: {
    required: ['title', 'slug', 'type', 'description'],
    optional: [
      'status',
      'published',
      'summary',
      'tags',
      'order',
      'featured_image',
      'coverImage',
      'og_image',
      'protected_password',
      'publishedAt',
      'created_at',
      'updated_at',
      'company',
      'role',
      'team',
      'duration',
      'domain',
      'platforms',
      'tools',
      'goals',
      'outcomes',
      'impactMetrics',
      'gallery',
      'video',
    ],
  },
};

function validateFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const { data } = parseContentFrontmatter(content);

  if (!data || typeof data !== 'object' || Object.keys(data).length === 0) {
    return { valid: false, errors: ['No frontmatter found or empty'] };
  }

  const errors = [];
  const type = data.type;

  if (!type) {
    errors.push('Missing required field: type');
    return { valid: false, errors };
  }

  const schema = SCHEMAS[type];
  if (!schema) {
    errors.push(`Unknown type: ${type}`);
    return { valid: false, errors };
  }

  // Check required fields
  for (const field of schema.required) {
    if (!(field in data) || data[field] === undefined || data[field] === null || data[field] === '') {
      errors.push(`Missing required field: ${field}`);
    }
  }

  // Check for unknown fields
  const allValidFields = [...schema.required, ...schema.optional];
  for (const field of Object.keys(data)) {
    if (!allValidFields.includes(field)) {
      errors.push(`Unknown field: ${field}`);
    }
  }

  return { valid: errors.length === 0, errors, data };
}

function listMarkdownFilesInCollection(collection) {
  const dir = path.join(CONTENT_DIR, collection);
  if (!fs.existsSync(dir)) {
    return [];
  }

  const relPaths = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isFile()) {
      const n = entry.name;
      if (n.endsWith('.md') || n.endsWith('.mdx')) {
        relPaths.push(path.join(collection, n));
      }
      continue;
    }

    if (!entry.isDirectory() || entry.name.startsWith('.')) continue;

    for (const ext of ['.mdx', '.md']) {
      const indexPath = path.join(dir, entry.name, `index${ext}`);
      if (fs.existsSync(indexPath)) {
        relPaths.push(path.join(collection, entry.name, `index${ext}`));
        break;
      }
    }
  }

  return relPaths;
}

function validateCollection(collection) {
  const files =
    collection === 'work' || collection === 'pages'
      ? listMarkdownFilesInCollection(collection)
      : fs
          .readdirSync(path.join(CONTENT_DIR, collection))
          .filter((f) => f.endsWith('.md') || f.endsWith('.mdx'))
          .map((f) => path.join(collection, f));

  let totalErrors = 0;
  const results = [];

  for (const rel of files) {
    const filePath = path.join(CONTENT_DIR, rel);
    const display = rel.replace(/\\/g, '/');
    const result = validateFile(filePath);
    results.push({ file: display, ...result });

    if (!result.valid) {
      totalErrors++;
      console.log(`❌ ${display}:`);
      for (const error of result.errors) {
        console.log(`   - ${error}`);
      }
    } else {
      console.log(`✅ ${display}`);
    }
  }

  return { files: results, errors: totalErrors };
}

function main() {
  const isCheck = process.argv.includes('--check');

  console.log('🔍 Validating frontmatter...\n');

  const pages = validateCollection('pages');
  const work = validateCollection('work');

  const totalErrors = pages.errors + work.errors;
  const totalFiles = pages.files.length + work.files.length;

  console.log(`\n📊 Summary: ${totalFiles - totalErrors}/${totalFiles} files valid`);

  if (totalErrors > 0) {
    console.log(`❌ ${totalErrors} file(s) with errors`);
    if (isCheck) {
      process.exit(1);
    }
  } else {
    console.log('✅ All files valid!');
  }
}

main();


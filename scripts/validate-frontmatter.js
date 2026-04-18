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
    optional: ['status', 'published', 'summary', 'tags', 'order', 'featured_image', 'og_image', 'protected_password', 'publishedAt', 'created_at', 'updated_at']
  }
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

function validateCollection(collection) {
  const dir = path.join(CONTENT_DIR, collection);
  if (!fs.existsSync(dir)) {
    return { files: [], errors: 0 };
  }

  const files = fs.readdirSync(dir).filter(f => f.endsWith('.md') || f.endsWith('.mdx'));
  let totalErrors = 0;
  const results = [];

  for (const file of files) {
    const filePath = path.join(dir, file);
    const result = validateFile(filePath);
    results.push({ file, ...result });

    if (!result.valid) {
      totalErrors++;
      console.log(`❌ ${collection}/${file}:`);
      for (const error of result.errors) {
        console.log(`   - ${error}`);
      }
    } else {
      console.log(`✅ ${collection}/${file}`);
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


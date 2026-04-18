#!/usr/bin/env node

/**
 * Hash Password Script
 *
 * Gera hash BCrypt para uso no campo protected_password do frontmatter.
 *
 * Uso:
 *   node scripts/hash-password.js "minha-senha"
 *
 * Output:
 *   $2b$10$... (hash BCrypt)
 *
 * Adicione o hash ao frontmatter do arquivo Markdown:
 *   protected_password: "$2b$10$..."
 */

const bcrypt = require('bcryptjs');

const password = process.argv[2];

if (!password) {
  console.error('❌ Usage: node scripts/hash-password.js "your-password"');
  process.exit(1);
}

const hash = bcrypt.hashSync(password, 10);
console.log(hash);

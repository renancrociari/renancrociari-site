#!/usr/bin/env node

/**
 * Rollback Script
 *
 * Permite reverter para uma versão anterior do build.
 * Mantém backups em dist-backup-YYYYMMDD/
 *
 * Uso:
 *   node scripts/rollback.js           # Lista backups disponíveis
 *   node scripts/rollback.js latest    # Restaura backup mais recente
 *   node scripts/rollback.js 20240115    # Restaura backup específico
 */

const fs = require('fs');
const path = require('path');

const DIST_DIR = path.join(__dirname, '..', 'dist');
const ROOT_DIR = path.join(__dirname, '..');

function getBackups() {
  const entries = fs.readdirSync(ROOT_DIR, { withFileTypes: true });
  return entries
    .filter(e => e.isDirectory() && e.name.startsWith('dist-backup-'))
    .map(e => e.name)
    .sort()
    .reverse();
}

function listBackups() {
  const backups = getBackups();
  
  if (backups.length === 0) {
    console.log('❌ No backups found.');
    console.log('   Run: npm run backup');
    return;
  }
  
  console.log('📦 Available backups:\n');
  backups.forEach((backup, index) => {
    const dateStr = backup.replace('dist-backup-', '');
    const formattedDate = `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6)}`;
    const marker = index === 0 ? ' (latest)' : '';
    console.log(`  ${index + 1}. ${backup} (${formattedDate})${marker}`);
  });
}

function rollbackTo(backupName) {
  const backupPath = path.join(ROOT_DIR, backupName);
  
  if (!fs.existsSync(backupPath)) {
    console.error(`❌ Backup not found: ${backupName}`);
    process.exit(1);
  }
  
  // Criar backup do atual antes de rollback
  const currentBackup = `dist-backup-pre-rollback-${Date.now()}`;
  if (fs.existsSync(DIST_DIR)) {
    console.log('💾 Creating safety backup of current dist...');
    fs.cpSync(DIST_DIR, path.join(ROOT_DIR, currentBackup), { recursive: true });
  }
  
  // Remover dist atual
  console.log('🗑️  Removing current dist...');
  if (fs.existsSync(DIST_DIR)) {
    fs.rmSync(DIST_DIR, { recursive: true });
  }
  
  // Restaurar backup
  console.log(`📦 Restoring ${backupName}...`);
  fs.cpSync(backupPath, DIST_DIR, { recursive: true });
  
  console.log('✅ Rollback complete!');
  console.log(`   Current dist is now: ${backupName}`);
  console.log(`   Safety backup: ${currentBackup}`);
}

function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (!command) {
    listBackups();
    console.log('\nUsage:');
    console.log('  node scripts/rollback.js latest');
    console.log('  node scripts/rollback.js 20240115');
    return;
  }
  
  if (command === 'latest') {
    const backups = getBackups();
    if (backups.length === 0) {
      console.error('❌ No backups available.');
      process.exit(1);
    }
    rollbackTo(backups[0]);
  } else if (/^\d{8}$/.test(command)) {
    rollbackTo(`dist-backup-${command}`);
  } else {
    console.error(`❌ Invalid command: ${command}`);
    console.log('\nUsage:');
    console.log('  node scripts/rollback.js latest');
    console.log('  node scripts/rollback.js 20240115');
    process.exit(1);
  }
}

main();

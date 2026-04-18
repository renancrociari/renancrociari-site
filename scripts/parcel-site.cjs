#!/usr/bin/env node

const { spawn } = require('child_process');
const {
  ROOT_DIR,
  getGeneratedEntryFiles,
  getLegacyEntryFiles,
  getSiteEntryFiles,
} = require('./lib/site-entrypoints.cjs');

async function resolveEntryFiles(scope) {
  switch (scope) {
    case 'generated':
      return getGeneratedEntryFiles();
    case 'legacy':
      return getLegacyEntryFiles();
    case 'site':
    default:
      return getSiteEntryFiles();
  }
}

function ensureTermSizeEnvForParcel() {
  // @parcel/reporter-cli uses `term-size`, which on macOS may exec a bundled
  // binary via execFileSync(..., { shell: true }). Paths with spaces then
  // produce `/bin/sh: .../Arquivos: is a directory`. Exporting dimensions
  // skips that branch (see term-size: env.COLUMNS / env.LINES).
  if (!process.env.COLUMNS) {
    process.env.COLUMNS = String(process.stdout.columns || 80);
  }
  if (!process.env.LINES) {
    process.env.LINES = String(process.stdout.rows || 24);
  }
}

async function main() {
  const [, , command = 'serve', scope = 'site', ...extraArgs] = process.argv;
  ensureTermSizeEnvForParcel();
  const entryFiles = await resolveEntryFiles(scope);

  if (!entryFiles.length) {
    console.error(`Nenhum entry HTML encontrado para o escopo "${scope}".`);
    process.exit(1);
    return;
  }

  const parcelBin = require.resolve('parcel/lib/bin.js');
  const parcelArgs = [parcelBin];
  if (command === 'build') {
    parcelArgs.push('build');
  }
  parcelArgs.push(...entryFiles, ...extraArgs);

  const child = spawn(process.execPath, parcelArgs, {
    cwd: ROOT_DIR,
    stdio: 'inherit',
    shell: false,
  });

  child.on('exit', (code) => {
    process.exit(code ?? 0);
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

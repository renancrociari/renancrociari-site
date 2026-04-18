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

async function main() {
  const [, , command = 'serve', scope = 'site', ...extraArgs] = process.argv;
  const entryFiles = await resolveEntryFiles(scope);

  if (!entryFiles.length) {
    console.error(`Nenhum entry HTML encontrado para o escopo "${scope}".`);
    process.exit(1);
    return;
  }

  const parcelArgs = ['parcel'];
  if (command === 'build') {
    parcelArgs.push('build');
  }
  parcelArgs.push(...entryFiles, ...extraArgs);

  const child = spawn('npx', parcelArgs, {
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

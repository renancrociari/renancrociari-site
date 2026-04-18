#!/usr/bin/env node
/**
 * Verificações estáticas do harness Portfolio-OS (Fase 1 — work).
 * Não substitui testes HTTP/E2E; falha cedo se estrutura ou manifesto estiverem incorretos.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Raiz do repo (independente da profundidade de `.agent/docs/.../harness/scripts`). */
function findRepoRoot(startDir) {
  let dir = startDir;
  for (let i = 0; i < 16; i += 1) {
    const pkg = path.join(dir, 'package.json');
    const sidecar = path.join(dir, 'editor-sidecar');
    if (fs.existsSync(pkg) && fs.existsSync(sidecar)) {
      return dir;
    }
    const parent = path.dirname(dir);
    if (parent === dir) {
      break;
    }
    dir = parent;
  }
  throw new Error(
    'Não foi possível localizar a raiz do repositório (package.json + editor-sidecar).'
  );
}

const ROOT = findRepoRoot(__dirname);

const PHASE1_WORK_SLUGS = ['farfetch-performance', 'dating-platform', 'journal-finder'];

const PHASE2_PAGES_SLUGS = ['home', 'about'];

const REQUIRED_FILES = [
  'editor-sidecar/app/api/editor/work/route.ts',
  'editor-sidecar/app/api/editor/pages/route.ts',
  'editor-sidecar/app/api/editor/drafts/route.ts',
  'editor-sidecar/app/api/verify-password/route.ts',
  'editor-sidecar/app/editor/preview/work/[slug]/page.tsx',
  'editor-sidecar/app/editor/preview/pages/[slug]/page.tsx',
  'editor-sidecar/app/editor/page.tsx',
  'scripts/dev-server.js',
  'src/portfolio-os-integration/config/routing-manifest.mjs',
  'src/portfolio-os-integration/editor/pages-content.mjs',
  'scripts/content/build-content.js',
];

const MANIFEST_WORK_KEYS = [
  'documentId',
  'publicPath',
  'outputFile',
  'bodyClass',
  'legacySourcePage',
  'templateKey',
  'previewPath',
];

let fail = 0;
let warn = 0;

function log(kind, msg) {
  const p = `[${kind}]`;
  console.log(`${p} ${msg}`);
  if (kind === 'FAIL') fail += 1;
  if (kind === 'WARN') warn += 1;
}

function fileExists(rel) {
  return fs.existsSync(path.join(ROOT, rel));
}

function checkRequiredFiles() {
  for (const rel of REQUIRED_FILES) {
    if (!fileExists(rel)) {
      log('FAIL', `Ficheiro em falta: ${rel}`);
    } else {
      log('PASS', `Existe: ${rel}`);
    }
  }
}

function checkCanonicalWorkMdx() {
  for (const slug of PHASE1_WORK_SLUGS) {
    const rel = `content/work/${slug}/index.mdx`;
    if (!fileExists(rel)) {
      log('FAIL', `Conteúdo canónico em falta: ${rel}`);
    } else {
      log('PASS', `MDX canónico: ${rel}`);
    }
  }
}

function checkCanonicalPagesMdx() {
  for (const slug of PHASE2_PAGES_SLUGS) {
    const rel = `content/pages/${slug}/index.mdx`;
    if (!fileExists(rel)) {
      log('FAIL', `Páginas canónicas em falta: ${rel}`);
    } else {
      log('PASS', `MDX canónico (pages): ${rel}`);
    }
  }
}

function checkFlatLegacyFiles() {
  for (const slug of PHASE1_WORK_SLUGS) {
    const flat = `content/work/${slug}.mdx`;
    if (fileExists(flat)) {
      log(
        'WARN',
        `Ainda existe formato flat (transição): ${flat} — remover após cutover documentado em B3/B15.`
      );
    }
  }
}

async function checkRoutingManifest() {
  const manifestPath = path.join(ROOT, 'src/portfolio-os-integration/config/routing-manifest.mjs');
  let mod;
  try {
    mod = await import(pathToFileURL(manifestPath).href);
  } catch (e) {
    log('FAIL', `Não foi possível importar routing-manifest.mjs: ${e.message}`);
    return;
  }

  const { MANAGED_ROUTE_MANIFEST } = mod;
  if (!MANAGED_ROUTE_MANIFEST?.work) {
    log('FAIL', 'MANAGED_ROUTE_MANIFEST.work ausente.');
    return;
  }

  const work = MANAGED_ROUTE_MANIFEST.work;

  for (const slug of PHASE1_WORK_SLUGS) {
    const entry = work[slug];
    if (!entry) {
      log('FAIL', `Manifest work["${slug}"] ausente.`);
      continue;
    }
    for (const k of MANIFEST_WORK_KEYS) {
      if (entry[k] === undefined || entry[k] === '') {
        log('FAIL', `Manifest work["${slug}"].${k} inválido ou vazio.`);
      }
    }
    const docId = entry.documentId;
    if (docId !== `${slug}/index.mdx`) {
      log(
        'WARN',
        `documentId esperado "${slug}/index.mdx", obtido "${docId}" — confirmar se intencional.`
      );
    }
    if (slug === 'journal-finder' && !entry.authId) {
      log('FAIL', 'journal-finder deve declarar authId no manifesto (proteção pública).');
    }
    log('PASS', `Manifest work["${slug}"] com campos obrigatórios.`);
  }
}

function checkPackageJsonScripts() {
  const pkgPath = path.join(ROOT, 'package.json');
  if (!fileExists('package.json')) {
    log('FAIL', 'package.json na raiz em falta.');
    return;
  }
  const raw = fs.readFileSync(pkgPath, 'utf8');
  let pkg;
  try {
    pkg = JSON.parse(raw);
  } catch {
    log('FAIL', 'package.json inválido (JSON).');
    return;
  }
  const scripts = pkg.scripts || {};
  if (!scripts.start || !String(scripts.start).includes('dev-server')) {
    log('WARN', 'script "start" deveria orquestrar scripts/dev-server.js (npm start).');
  } else {
    log('PASS', 'script npm start aponta para dev-server.');
  }
  if (!scripts['build:content']) {
    log('WARN', 'script build:content em falta.');
  }
  if (!scripts['dev:editor-sidecar'] && !scripts.start) {
    log('WARN', 'Confirme como o sidecar Next é iniciado (dev:editor-sidecar ou via start).');
  }
}

async function main() {
  console.log(`\nHarness estático — raiz: ${ROOT}\n`);
  checkRequiredFiles();
  console.log('');
  checkCanonicalWorkMdx();
  console.log('');
  checkCanonicalPagesMdx();
  console.log('');
  checkFlatLegacyFiles();
  console.log('');
  await checkRoutingManifest();
  console.log('');
  checkPackageJsonScripts();

  console.log(`\nResumo: FAIL=${fail}, WARN=${warn}\n`);
  if (fail > 0) {
    process.exit(1);
  }
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

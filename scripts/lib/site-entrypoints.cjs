const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');

const ROOT_DIR = path.join(__dirname, '..', '..');
const PAGES_DIR = path.join(ROOT_DIR, 'src', 'pages');
const GENERATED_DIR = path.join(ROOT_DIR, 'src', 'pages-generated');

async function loadRoutingManifest() {
  const manifestPath = path.join(
    ROOT_DIR,
    'src',
    'portfolio-os-integration',
    'config',
    'routing-manifest.mjs'
  );
  return import(pathToFileURL(manifestPath).href);
}

function toRelative(absPath) {
  return path.relative(ROOT_DIR, absPath).split(path.sep).join('/');
}

function listHtmlEntries(dir) {
  if (!fs.existsSync(dir)) {
    return [];
  }

  return fs
    .readdirSync(dir)
    .filter((file) => file.endsWith('.html'))
    .sort((a, b) => a.localeCompare(b))
    .map((file) => path.join(dir, file));
}

async function getManagedLegacyPageNameSet() {
  const { listManagedLegacySourcePages } = await loadRoutingManifest();
  return new Set(listManagedLegacySourcePages().map((file) => path.basename(file)));
}

async function getLegacyStaticEntryFiles() {
  const managedNames = await getManagedLegacyPageNameSet();
  return listHtmlEntries(PAGES_DIR)
    .filter((absPath) => !managedNames.has(path.basename(absPath)))
    .map(toRelative);
}

function getLegacyEntryFiles() {
  return listHtmlEntries(PAGES_DIR).map(toRelative);
}

function getGeneratedEntryFiles() {
  return listHtmlEntries(GENERATED_DIR).map(toRelative);
}

async function getSiteEntryFiles() {
  const legacyStatic = await getLegacyStaticEntryFiles();
  const generated = getGeneratedEntryFiles();
  return [...legacyStatic, ...generated];
}

module.exports = {
  ROOT_DIR,
  getGeneratedEntryFiles,
  getLegacyEntryFiles,
  getLegacyStaticEntryFiles,
  getSiteEntryFiles,
};

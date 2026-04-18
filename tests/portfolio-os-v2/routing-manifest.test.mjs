import assert from 'node:assert';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import test from 'node:test';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

test('resolveSiteRoute: três cases work com publicPath e documentId canónico', async () => {
  const { resolveSiteRoute } = await import(
    pathToFileURL(join(root, 'src/portfolio-os-integration/config/routing-manifest.mjs')).href
  );

  const farfetch = resolveSiteRoute({
    collection: 'work',
    documentSlug: 'farfetch-performance',
  });
  assert.strictEqual(
    farfetch.publicPath,
    '/improving-the-performance-of-farfetchs-top-fashion-ecommerce-brands'
  );
  assert.strictEqual(farfetch.documentId, 'farfetch-performance/index.mdx');
  assert.strictEqual(farfetch.bodyClass, 'farfetch');

  const dating = resolveSiteRoute({
    collection: 'work',
    documentSlug: 'dating-platform',
  });
  assert.strictEqual(
    dating.publicPath,
    '/redesigning-the-mobile-experience-of-a-dating-platform'
  );

  const journal = resolveSiteRoute({
    collection: 'work',
    documentSlug: 'journal-finder',
  });
  assert.strictEqual(
    journal.publicPath,
    '/connecting-every-discovery-with-a-worthy-home'
  );
  assert.strictEqual(journal.authId, 'case-journal-finder');
  assert.strictEqual(journal.isProtected, true);
});

test('resolveSiteRouteFromPath: pathname público resolve para slug editorial', async () => {
  const { resolveSiteRouteFromPath } = await import(
    pathToFileURL(join(root, 'src/portfolio-os-integration/config/routing-manifest.mjs')).href
  );
  const r = resolveSiteRouteFromPath(
    '/improving-the-performance-of-farfetchs-top-fashion-ecommerce-brands'
  );
  assert(r);
  assert.strictEqual(r.documentSlug, 'farfetch-performance');
});

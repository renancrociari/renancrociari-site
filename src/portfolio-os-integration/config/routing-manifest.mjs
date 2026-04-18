const SITE_BASE_URL = 'https://www.renancrociari.com';

const MANAGED_ROUTE_MANIFEST = {
  pages: {
    home: {
      publicPath: '/',
      outputFile: 'index.html',
      bodyClass: 'home',
      legacySourcePage: 'index.html',
      metaTitle: 'Renan Crociari · Senior Product Designer',
    },
    about: {
      publicPath: '/about',
      outputFile: 'about.html',
      bodyClass: 'about',
      legacySourcePage: 'about.html',
    },
  },
  work: {
    'farfetch-performance': {
      publicPath: '/improving-the-performance-of-farfetchs-top-fashion-ecommerce-brands',
      outputFile: 'improving-the-performance-of-farfetchs-top-fashion-ecommerce-brands.html',
      bodyClass: 'farfetch',
      legacySourcePage: 'improving-the-performance-of-farfetchs-top-fashion-ecommerce-brands.html',
    },
    'dating-platform': {
      publicPath: '/redesigning-the-mobile-experience-of-a-dating-platform',
      outputFile: 'redesigning-the-mobile-experience-of-a-dating-platform.html',
      bodyClass: 'sl-mobile',
      legacySourcePage: 'redesigning-the-mobile-experience-of-a-dating-platform.html',
    },
    'journal-finder': {
      publicPath: '/connecting-every-discovery-with-a-worthy-home',
      outputFile: 'connecting-every-discovery-with-a-worthy-home.html',
      bodyClass: 'journal-finder',
      legacySourcePage: 'connecting-every-discovery-with-a-worthy-home.html',
      authId: 'case-journal-finder',
      isProtected: true,
    },
  },
};

function normalizePathname(input) {
  const raw = String(input || '').trim();
  if (!raw || raw === '/') return '/';

  let pathname = raw;
  if (/^https?:\/\//i.test(pathname)) {
    pathname = new URL(pathname).pathname || '/';
  }

  pathname = pathname.replace(/\\/g, '/');
  pathname = pathname.replace(/^[.]+\/+/, '/');
  pathname = pathname.replace(/\/index\.html$/i, '/');
  pathname = pathname.replace(/\.html$/i, '');
  pathname = pathname.replace(/\/+/g, '/');

  if (!pathname.startsWith('/')) {
    pathname = `/${pathname}`;
  }

  if (pathname.length > 1 && pathname.endsWith('/')) {
    pathname = pathname.slice(0, -1);
  }

  return pathname || '/';
}

function buildCanonicalUrl(publicPath) {
  if (publicPath === '/') {
    return SITE_BASE_URL;
  }
  return `${SITE_BASE_URL}${publicPath}`;
}

function toOutputFileFromPath(publicPath) {
  if (publicPath === '/') {
    return 'index.html';
  }
  return `${publicPath.slice(1)}.html`;
}

function toDefaultBodyClass(collection, documentSlug) {
  if (collection === 'pages') {
    return documentSlug === 'home' ? 'home' : 'about';
  }
  return 'default';
}

function toDefaultPublicPath(collection, documentSlug, metadata = {}) {
  const preferredSlug = String(metadata.slug || documentSlug || '').trim();
  if (collection === 'pages' && preferredSlug === 'home') {
    return '/';
  }
  return `/${preferredSlug}`;
}

function getManifestEntry(collection, documentSlug) {
  const manifest = MANAGED_ROUTE_MANIFEST[collection];
  if (!manifest) return null;
  return manifest[String(documentSlug || '').trim()] || null;
}

export function resolveSiteRoute({
  collection,
  documentSlug,
  metadata = {},
}) {
  const resolvedCollection = collection === 'page' ? 'pages' : collection;
  const fallbackPublicPath = normalizePathname(
    toDefaultPublicPath(resolvedCollection, documentSlug, metadata)
  );
  const manifestEntry = getManifestEntry(resolvedCollection, documentSlug) || {};
  const publicPath = normalizePathname(manifestEntry.publicPath || fallbackPublicPath);
  const outputFile = manifestEntry.outputFile || toOutputFileFromPath(publicPath);
  const authId =
    manifestEntry.authId ||
    (resolvedCollection === 'work' ? `case-${String(documentSlug || '').trim()}` : null);

  return {
    collection: resolvedCollection,
    documentSlug: String(documentSlug || '').trim(),
    publicPath,
    outputFile,
    bodyClass:
      manifestEntry.bodyClass || toDefaultBodyClass(resolvedCollection, documentSlug),
    authId,
    isProtected:
      manifestEntry.isProtected === true || String(metadata.status || '') === 'protected',
    canonicalUrl: buildCanonicalUrl(publicPath),
    legacySourcePage: manifestEntry.legacySourcePage || null,
    metaTitle: manifestEntry.metaTitle || null,
  };
}

export function resolveSiteRouteFromPath(pathname) {
  const normalized = normalizePathname(pathname);

  for (const collection of Object.keys(MANAGED_ROUTE_MANIFEST)) {
    const entries = MANAGED_ROUTE_MANIFEST[collection];
    for (const [documentSlug, entry] of Object.entries(entries)) {
      const route = resolveSiteRoute({ collection, documentSlug });
      const candidates = new Set([
        route.publicPath,
        normalizePathname(documentSlug),
        normalizePathname(entry.outputFile),
        normalizePathname(entry.legacySourcePage),
      ]);
      if (candidates.has(normalized)) {
        return route;
      }
    }
  }

  return null;
}

export function listManagedLegacySourcePages() {
  return Object.values(MANAGED_ROUTE_MANIFEST)
    .flatMap((entries) => Object.values(entries))
    .map((entry) => entry.legacySourcePage)
    .filter(Boolean);
}

export { MANAGED_ROUTE_MANIFEST, SITE_BASE_URL };

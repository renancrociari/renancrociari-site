const SITE_BASE_URL = 'https://www.renancrociari.com';

const MANAGED_ROUTE_MANIFEST = {
  pages: {
    home: {
      documentId: 'home/index.mdx',
      publicPath: '/',
      outputFile: 'index.html',
      bodyClass: 'home',
      legacySourcePage: 'index.html',
      metaTitle: 'Renan Crociari · Senior Product Designer',
      templateKey: 'home',
      previewPath: '/editor/preview/pages/home',
    },
    about: {
      documentId: 'about/index.mdx',
      publicPath: '/about',
      outputFile: 'about.html',
      bodyClass: 'about',
      legacySourcePage: 'about.html',
      templateKey: 'about',
      previewPath: '/editor/preview/pages/about',
    },
  },
  work: {
    'farfetch-performance': {
      documentId: 'farfetch-performance/index.mdx',
      publicPath: '/improving-the-performance-of-farfetchs-top-fashion-ecommerce-brands',
      outputFile: 'improving-the-performance-of-farfetchs-top-fashion-ecommerce-brands.html',
      bodyClass: 'farfetch',
      legacySourcePage: 'improving-the-performance-of-farfetchs-top-fashion-ecommerce-brands.html',
      templateKey: 'farfetch-performance',
      previewPath: '/editor/preview/work/farfetch-performance',
    },
    'dating-platform': {
      documentId: 'dating-platform/index.mdx',
      publicPath: '/redesigning-the-mobile-experience-of-a-dating-platform',
      outputFile: 'redesigning-the-mobile-experience-of-a-dating-platform.html',
      bodyClass: 'sl-mobile',
      legacySourcePage: 'redesigning-the-mobile-experience-of-a-dating-platform.html',
      templateKey: 'dating-platform',
      previewPath: '/editor/preview/work/dating-platform',
    },
    'journal-finder': {
      documentId: 'journal-finder/index.mdx',
      publicPath: '/connecting-every-discovery-with-a-worthy-home',
      outputFile: 'connecting-every-discovery-with-a-worthy-home.html',
      bodyClass: 'journal-finder',
      legacySourcePage: 'connecting-every-discovery-with-a-worthy-home.html',
      authId: 'case-journal-finder',
      isProtected: true,
      templateKey: 'journal-finder',
      previewPath: '/editor/preview/work/journal-finder',
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

function documentSlugFromDocumentId(documentId) {
  const raw = String(documentId || '').trim().replace(/\\/g, '/');
  if (!raw) return '';
  const canonicalMatch = raw.match(/^([^/]+)\/index\.(mdx|md)$/i);
  if (canonicalMatch) {
    return canonicalMatch[1] || '';
  }
  const flatMatch = raw.match(/^([^/]+)\.(mdx|md)$/i);
  if (flatMatch) {
    return flatMatch[1] || '';
  }
  return raw.replace(/^\/+|\/+$/g, '');
}

function toDefaultDocumentId(collection, documentSlug) {
  const normalizedCollection = collection === 'page' ? 'pages' : collection;
  if (!documentSlug) return '';
  return `${documentSlug}/index.mdx`;
}

function toDefaultTemplateKey(collection, documentSlug) {
  if (collection === 'pages') {
    return documentSlug === 'home' ? 'home' : documentSlug === 'about' ? 'about' : 'generic-page';
  }
  return documentSlug;
}

function toDefaultPreviewPath(collection, documentSlug) {
  const normalizedCollection = collection === 'page' ? 'pages' : collection;
  if (!documentSlug) return null;
  return `/editor/preview/${normalizedCollection === 'pages' ? 'pages' : 'work'}/${documentSlug}`;
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
  documentId,
  metadata = {},
}) {
  const resolvedCollection = collection === 'page' ? 'pages' : collection;
  const resolvedDocumentSlug =
    String(documentSlug || '').trim() ||
    documentSlugFromDocumentId(documentId);
  const fallbackPublicPath = normalizePathname(
    toDefaultPublicPath(resolvedCollection, resolvedDocumentSlug, metadata)
  );
  const manifestEntry = getManifestEntry(resolvedCollection, resolvedDocumentSlug) || {};
  const publicPath = normalizePathname(manifestEntry.publicPath || fallbackPublicPath);
  const outputFile = manifestEntry.outputFile || toOutputFileFromPath(publicPath);
  const authId =
    manifestEntry.authId ||
    (resolvedCollection === 'work' ? `case-${String(resolvedDocumentSlug || '').trim()}` : null);

  return {
    collection: resolvedCollection,
    documentSlug: resolvedDocumentSlug,
    documentId:
      manifestEntry.documentId ||
      toDefaultDocumentId(resolvedCollection, resolvedDocumentSlug),
    publicPath,
    outputFile,
    bodyClass:
      manifestEntry.bodyClass || toDefaultBodyClass(resolvedCollection, resolvedDocumentSlug),
    authId,
    isProtected:
      manifestEntry.isProtected === true || String(metadata.status || '') === 'protected',
    canonicalUrl: buildCanonicalUrl(publicPath),
    legacySourcePage: manifestEntry.legacySourcePage || null,
    metaTitle: manifestEntry.metaTitle || null,
    templateKey:
      manifestEntry.templateKey ||
      toDefaultTemplateKey(resolvedCollection, resolvedDocumentSlug),
    previewPath:
      manifestEntry.previewPath ||
      toDefaultPreviewPath(resolvedCollection, resolvedDocumentSlug),
  };
}

export function resolveSiteRouteFromDocumentId({
  collection,
  documentId,
  metadata = {},
}) {
  return resolveSiteRoute({
    collection,
    documentSlug: documentSlugFromDocumentId(documentId),
    documentId,
    metadata,
  });
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

export function getSiteOrigin() {
  return process.env.PORTFOLIO_SITE_ORIGIN || 'http://localhost:1234';
}

export function absolutizeSiteAssetPath(value: string | undefined | null) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (/^https?:\/\//i.test(raw)) return raw;

  const siteOrigin = getSiteOrigin().replace(/\/$/, '');
  const cleaned = raw
    .replace(/^\.\//, '')
    .replace(/^\.\.\//, '')
    .replace(/^\/+/, '');

  return `${siteOrigin}/${cleaned}`;
}

export function absolutizeMarkdownAssetPaths(source: string) {
  return String(source || '')
    .replace(/\]\((\.\.?\/[^)]+)\)/g, (_match, target) => {
      return `](${absolutizeSiteAssetPath(target)})`;
    })
    .replace(/src=(['"])(\.\.?\/[^'"]+)\1/g, (_match, quote, target) => {
      return `src=${quote}${absolutizeSiteAssetPath(target)}${quote}`;
    });
}

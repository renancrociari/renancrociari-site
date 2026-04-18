/** Chave compartilhada com scripts/password-gate.js (conteúdo injetado). */
export const PORTFOLIO_OS_API_ROOT_STORAGE_KEY = 'portfolio-os-api-root';

function isLocalDevHost(hostname) {
  return hostname === 'localhost' || hostname === '127.0.0.1';
}

/**
 * Em dev local, descobre em qual porta a API do `dev-server.js` está ouvindo.
 * Usa GET /api/health em faixa de portas (após cache em sessionStorage).
 * @returns {Promise<string>} Origem da API, ex.: http://localhost:3002
 */
export async function resolveDevApiRoot() {
  if (typeof window === 'undefined') {
    return 'http://localhost:3001';
  }
  const hostname = window.location.hostname;
  if (!isLocalDevHost(hostname)) {
    return '';
  }

  // Sidecar Next (`/editor/*`): a API vive no mesmo origin. Sem isto, o port-scan
  // (3001…) pode ganhar a corrida e o Playwright/E2E em :3010 nunca vê GET /api/editor/*.
  const path = typeof window.location?.pathname === 'string' ? window.location.pathname : '';
  if (path.startsWith('/editor')) {
    const origin = window.location.origin;
    sessionStorage.setItem(PORTFOLIO_OS_API_ROOT_STORAGE_KEY, origin);
    return origin;
  }

  const cached = sessionStorage.getItem(PORTFOLIO_OS_API_ROOT_STORAGE_KEY);
  if (cached) {
    const base = cached.replace(/\/$/, '');
    try {
      const res = await fetch(`${base}/api/health`, {
        signal: AbortSignal.timeout(800),
      });
      if (res.ok) {
        return cached;
      }
    } catch {
      // cache obsoleto (porta antiga / sidecar mudou)
    }
    sessionStorage.removeItem(PORTFOLIO_OS_API_ROOT_STORAGE_KEY);
  }

  const ports = Array.from({ length: 60 }, (_, i) => 3001 + i);
  for (let i = 0; i < ports.length; i += 10) {
    const chunk = ports.slice(i, i + 10);
    try {
      const root = await Promise.any(
        chunk.map(async (port) => {
          const base = `http://${hostname}:${port}`;
          const res = await fetch(`${base}/api/health`, {
            signal: AbortSignal.timeout(400),
          });
          if (!res.ok) {
            throw new Error('bad');
          }
          return base;
        })
      );
      sessionStorage.setItem(PORTFOLIO_OS_API_ROOT_STORAGE_KEY, root);
      return root;
    } catch {
      // tenta próximo bloco de portas
    }
  }

  return `http://${hostname}:3001`;
}

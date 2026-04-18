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

  const cached = sessionStorage.getItem(PORTFOLIO_OS_API_ROOT_STORAGE_KEY);
  if (cached) {
    return cached;
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

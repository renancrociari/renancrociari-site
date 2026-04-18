import { jsonWithCors, optionsWithCors } from '../../../lib/http';

export const runtime = 'nodejs';

export function OPTIONS(request: Request) {
  return optionsWithCors(request);
}

/** Liveness para Playwright / orquestradores; não aplicar devOnlyGuard (evita 403 fora de NODE_ENV=development). */
export function GET(request: Request) {
  return jsonWithCors(request, { ok: true });
}

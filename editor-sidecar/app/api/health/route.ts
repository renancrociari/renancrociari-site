import { devOnlyGuard, jsonWithCors, optionsWithCors } from '../../../lib/http';

export const runtime = 'nodejs';

export function OPTIONS(request: Request) {
  return optionsWithCors(request);
}

export function GET(request: Request) {
  const blocked = devOnlyGuard(request);
  if (blocked) return blocked;
  return jsonWithCors(request, { ok: true });
}

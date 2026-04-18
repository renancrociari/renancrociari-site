import bcrypt from 'bcryptjs';
import {
  devOnlyGuard,
  jsonWithCors,
  optionsWithCors,
  textWithCors,
} from '../../../lib/http';

export const runtime = 'nodejs';

export function OPTIONS(request: Request) {
  return optionsWithCors(request);
}

export async function POST(request: Request) {
  const blocked = devOnlyGuard(request);
  if (blocked) return blocked;

  let body: { password?: string; hash?: string };

  try {
    body = await request.json();
  } catch {
    return textWithCors(request, 'Invalid JSON', { status: 400 });
  }

  if (!body.password || !body.hash) {
    return textWithCors(request, 'Missing password or hash', { status: 400 });
  }

  try {
    const valid = bcrypt.compareSync(body.password, body.hash);
    return jsonWithCors(request, { valid });
  } catch (error) {
    return textWithCors(
      request,
      error instanceof Error ? error.message : 'Password verification failed.',
      { status: 500 }
    );
  }
}

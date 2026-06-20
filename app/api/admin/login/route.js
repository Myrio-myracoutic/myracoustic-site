import crypto from 'crypto';
import { cookies } from 'next/headers';

export async function POST(req) {
  const { password } = await req.json();
  if (!process.env.ADMIN_PASSWORD || password !== process.env.ADMIN_PASSWORD) {
    return Response.json({ error: 'Mot de passe incorrect' }, { status: 401 });
  }
  const token = crypto
    .createHmac('sha256', process.env.ADMIN_PASSWORD)
    .update('myracoustic-admin')
    .digest('hex');
  const cookieStore = await cookies();
  cookieStore.set('admin_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
    sameSite: 'lax',
  });
  return Response.json({ ok: true });
}

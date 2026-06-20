import crypto from 'crypto';
import { cookies } from 'next/headers';

function getExpectedToken() {
  return crypto
    .createHmac('sha256', process.env.ADMIN_PASSWORD || '')
    .update('myracoustic-admin')
    .digest('hex');
}

export async function verifyAdminCookie() {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token')?.value;
  return token === getExpectedToken();
}

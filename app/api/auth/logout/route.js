import { createActivityLog } from '@/lib/db';
import { getAuthUser as getUser } from '@/lib/auth';

export async function POST(request) {
  const user = await getUser(request);
  if (user) {
    await createActivityLog({ user_id: user.id, user_name: user.name, action: 'logout', detail: '로그아웃' });
  }
  const res = Response.json({ ok: true });
  res.headers.set('Set-Cookie', 'auth_token=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax');
  return res;
}

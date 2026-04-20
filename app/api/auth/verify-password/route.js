import bcrypt from 'bcryptjs';
import { getAuthUser } from '@/lib/auth';
import { getUserById } from '@/lib/db';

export async function POST(request) {
  const payload = await getAuthUser(request);
  if (!payload) return Response.json({ error: '인증이 필요합니다.' }, { status: 401 });

  const { password } = await request.json();
  if (!password) return Response.json({ error: '비밀번호를 입력해주세요.' }, { status: 400 });

  const user = await getUserById(payload.id);
  if (!user) return Response.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 });

  // getUserById doesn't return password_hash, fetch full user
  const { getUserByUsername } = await import('@/lib/db');
  const fullUser = await getUserByUsername(user.username);
  const ok = await bcrypt.compare(password, fullUser.password_hash);
  if (!ok) return Response.json({ error: '비밀번호가 올바르지 않습니다.' }, { status: 401 });

  return Response.json({ ok: true });
}

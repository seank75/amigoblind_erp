import bcrypt from 'bcryptjs';
import { getUserByUsername, getUserCount, createUser, createActivityLog, initializeDb } from '@/lib/db';
import { signToken } from '@/lib/auth';

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
  maxAge: 7 * 24 * 60 * 60,
};

export async function GET() {
  await initializeDb();
  const count = await getUserCount();
  return Response.json({ hasUsers: count > 0 });
}

export async function POST(request) {
  try {
    await initializeDb();
    const { username, password, name, mode } = await request.json();

    if (mode === 'setup') {
      const count = await getUserCount();
      if (count > 0) return Response.json({ error: '이미 초기 설정이 완료되었습니다.' }, { status: 400 });
      if (!username?.trim() || !password?.trim() || !name?.trim())
        return Response.json({ error: '모든 항목을 입력해주세요.' }, { status: 400 });

      const hash = await bcrypt.hash(password, 10);
      const { id } = await createUser({ username: username.trim(), name: name.trim(), password_hash: hash, role: 'admin' });
      const token = await signToken({ id, username: username.trim(), name: name.trim(), role: 'admin' });

      const res = Response.json({ ok: true });
      res.headers.set('Set-Cookie', `auth_token=${token}; HttpOnly; Path=/; Max-Age=${COOKIE_OPTS.maxAge}; SameSite=Lax${COOKIE_OPTS.secure ? '; Secure' : ''}`);
      return res;
    }

    const user = await getUserByUsername(username?.trim());
    if (!user) return Response.json({ error: '아이디 또는 비밀번호가 올바르지 않습니다.' }, { status: 401 });

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return Response.json({ error: '아이디 또는 비밀번호가 올바르지 않습니다.' }, { status: 401 });

    await createActivityLog({ user_id: user.id, user_name: user.name, action: 'login', detail: '로그인' });

    const token = await signToken({ id: user.id, username: user.username, name: user.name, role: user.role });
    const res = Response.json({ ok: true, user: { id: user.id, username: user.username, name: user.name, role: user.role } });
    res.headers.set('Set-Cookie', `auth_token=${token}; HttpOnly; Path=/; Max-Age=${COOKIE_OPTS.maxAge}; SameSite=Lax${COOKIE_OPTS.secure ? '; Secure' : ''}`);
    return res;
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

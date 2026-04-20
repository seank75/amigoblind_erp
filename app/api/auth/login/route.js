import bcrypt from 'bcryptjs';
import { getUserByUsername, getUserCount, createUser, createActivityLog, initializeDb } from '@/lib/db';
import { signToken } from '@/lib/auth';

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
  maxAge: 8 * 60 * 60, // 8시간 (JWT와 동일)
};

// ── Rate Limiting (IP당 15분에 5회 실패 시 차단) ──────────────────────────────
const loginAttempts = new Map(); // { ip: { count, blockedUntil } }
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15분
const BLOCK_MS = 15 * 60 * 1000;  // 15분 차단

function getClientIp(request) {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

function checkRateLimit(ip) {
  const now = Date.now();
  const entry = loginAttempts.get(ip);

  if (entry?.blockedUntil) {
    if (now < entry.blockedUntil) {
      const remainMin = Math.ceil((entry.blockedUntil - now) / 60000);
      return { blocked: true, remainMin };
    }
    loginAttempts.delete(ip);
  }
  return { blocked: false };
}

function recordFailure(ip) {
  const now = Date.now();
  const entry = loginAttempts.get(ip) || { count: 0, firstAttempt: now };
  entry.count += 1;
  if (entry.count >= MAX_ATTEMPTS) {
    entry.blockedUntil = now + BLOCK_MS;
  }
  loginAttempts.set(ip, entry);
}

function clearAttempts(ip) {
  loginAttempts.delete(ip);
}

// 오래된 항목 주기적 정리
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of loginAttempts) {
    if (!entry.blockedUntil && now - entry.firstAttempt > WINDOW_MS) loginAttempts.delete(ip);
    if (entry.blockedUntil && now > entry.blockedUntil) loginAttempts.delete(ip);
  }
}, WINDOW_MS);

// ── Handlers ──────────────────────────────────────────────────────────────────

export async function GET() {
  await initializeDb();
  const count = await getUserCount();
  return Response.json({ hasUsers: count > 0 });
}

export async function POST(request) {
  try {
    await initializeDb();
    const ip = getClientIp(request);
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

    // Rate limit 체크
    const { blocked, remainMin } = checkRateLimit(ip);
    if (blocked) {
      return Response.json(
        { error: `로그인 시도가 너무 많습니다. ${remainMin}분 후 다시 시도해주세요.` },
        { status: 429 }
      );
    }

    const user = await getUserByUsername(username?.trim());
    if (!user) {
      recordFailure(ip);
      return Response.json({ error: '아이디 또는 비밀번호가 올바르지 않습니다.' }, { status: 401 });
    }

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      recordFailure(ip);
      return Response.json({ error: '아이디 또는 비밀번호가 올바르지 않습니다.' }, { status: 401 });
    }

    clearAttempts(ip);
    await createActivityLog({ user_id: user.id, user_name: user.name, action: 'login', detail: '로그인' });

    const token = await signToken({ id: user.id, username: user.username, name: user.name, role: user.role });
    const res = Response.json({ ok: true, user: { id: user.id, username: user.username, name: user.name, role: user.role } });
    res.headers.set('Set-Cookie', `auth_token=${token}; HttpOnly; Path=/; Max-Age=${COOKIE_OPTS.maxAge}; SameSite=Lax${COOKIE_OPTS.secure ? '; Secure' : ''}`);
    return res;
  } catch {
    return Response.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

import bcrypt from 'bcryptjs';
import { getAuthUser } from '@/lib/auth';
import { getAllUsers, createUser, deleteUser, createActivityLog } from '@/lib/db';

export async function GET(request) {
  const payload = await getAuthUser(request);
  if (!payload) return Response.json({ error: '인증이 필요합니다.' }, { status: 401 });
  const users = await getAllUsers();
  return Response.json(users);
}

export async function POST(request) {
  const payload = await getAuthUser(request);
  if (!payload || payload.role !== 'admin')
    return Response.json({ error: '관리자만 사용자를 등록할 수 있습니다.' }, { status: 403 });

  const { username, name, password, role } = await request.json();
  if (!username?.trim() || !name?.trim() || !password?.trim())
    return Response.json({ error: '모든 항목을 입력해주세요.' }, { status: 400 });

  try {
    const hash = await bcrypt.hash(password, 10);
    const { id } = await createUser({ username: username.trim(), name: name.trim(), password_hash: hash, role: role || 'user' });
    await createActivityLog({ user_id: payload.id, user_name: payload.name, action: 'user_create', detail: `사용자 등록: ${name}(${username})` });
    return Response.json({ id });
  } catch (err) {
    if (err.message?.includes('unique') || err.message?.includes('duplicate') || err.message?.includes('UNIQUE'))
      return Response.json({ error: '이미 사용 중인 아이디입니다.' }, { status: 400 });
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  const payload = await getAuthUser(request);
  if (!payload || payload.role !== 'admin')
    return Response.json({ error: '관리자만 사용자를 삭제할 수 있습니다.' }, { status: 403 });

  const { id } = await request.json();
  if (id === payload.id) return Response.json({ error: '자기 자신은 삭제할 수 없습니다.' }, { status: 400 });

  await deleteUser(id);
  await createActivityLog({ user_id: payload.id, user_name: payload.name, action: 'user_delete', detail: `사용자 삭제 (ID: ${id})` });
  return Response.json({ ok: true });
}

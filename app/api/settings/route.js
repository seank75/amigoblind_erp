import { getSettings, updateSettings, createActivityLog } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function GET(request) {
  const user = await getAuthUser(request);
  if (!user) return Response.json({ error: '인증이 필요합니다.' }, { status: 401 });
  try {
    const settings = await getSettings();
    return Response.json(settings);
  } catch {
    return Response.json({ error: '설정을 불러오는 데 실패했습니다.' }, { status: 500 });
  }
}

export async function POST(request) {
  const user = await getAuthUser(request);
  if (!user || user.role !== 'admin')
    return Response.json({ error: '관리자만 설정을 변경할 수 있습니다.' }, { status: 403 });
  try {
    const data = await request.json();
    await updateSettings(data);
    await createActivityLog({ user_id: user.id, user_name: user.name, action: 'settings_update', detail: '시스템 설정 변경' });
    return Response.json({ message: '설정이 저장되었습니다.' });
  } catch {
    return Response.json({ error: '설정 저장에 실패했습니다.' }, { status: 500 });
  }
}

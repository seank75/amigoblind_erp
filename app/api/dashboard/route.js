import { getDashboardStats } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function GET(request) {
  const user = await getAuthUser(request);
  if (!user) return Response.json({ error: '인증이 필요합니다.' }, { status: 401 });
  try {
    const stats = await getDashboardStats();
    return Response.json(stats);
  } catch {
    return Response.json({ error: '데이터를 불러오는 데 실패했습니다.' }, { status: 500 });
  }
}

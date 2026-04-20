import { getAuthUser } from '@/lib/auth';
import { getActivityLogs } from '@/lib/db';

export async function GET(request) {
  const payload = await getAuthUser(request);
  if (!payload) return Response.json({ error: '인증이 필요합니다.' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '200');
  const offset = parseInt(searchParams.get('offset') || '0');

  const logs = await getActivityLogs({ limit, offset });
  return Response.json(logs);
}

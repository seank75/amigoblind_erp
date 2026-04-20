import { getAuthUser } from '@/lib/auth';
import { getUserById } from '@/lib/db';

export async function GET(request) {
  const payload = await getAuthUser(request);
  if (!payload) return Response.json({ user: null });
  const user = await getUserById(payload.id);
  return Response.json({ user });
}

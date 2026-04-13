import { getDashboardStats } from '@/lib/db';

export async function GET() {
  try {
    const stats = await getDashboardStats();
    return Response.json(stats);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

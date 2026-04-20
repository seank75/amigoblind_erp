import { getOrderById, updateOrder, createActivityLog } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function GET(request, { params }) {
  const user = await getAuthUser(request);
  if (!user) return Response.json({ error: '인증이 필요합니다.' }, { status: 401 });
  try {
    const { id } = await params;
    const order = await getOrderById(id);
    if (!order) return Response.json({ error: '주문을 찾을 수 없습니다.' }, { status: 404 });
    return Response.json(order);
  } catch {
    return Response.json({ error: '데이터를 불러오는 데 실패했습니다.' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  const user = await getAuthUser(request);
  if (!user) return Response.json({ error: '인증이 필요합니다.' }, { status: 401 });
  try {
    const { id } = await params;
    const data = await request.json();
    await updateOrder(id, data);
    await createActivityLog({ user_id: user.id, user_name: user.name, action: 'order_update', detail: `주문 수정 (ID: ${id})` });
    return Response.json({ message: '주문이 수정되었습니다.' });
  } catch {
    return Response.json({ error: '주문 수정에 실패했습니다.' }, { status: 500 });
  }
}

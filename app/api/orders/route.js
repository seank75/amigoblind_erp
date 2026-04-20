import { getAllOrders, createOrder, deleteOrder, updateOrderStatus, createActivityLog } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function GET(request) {
  const user = await getAuthUser(request);
  if (!user) return Response.json({ error: '인증이 필요합니다.' }, { status: 401 });
  try {
    const orders = await getAllOrders();
    return Response.json(orders);
  } catch {
    return Response.json({ error: '데이터를 불러오는 데 실패했습니다.' }, { status: 500 });
  }
}

export async function POST(request) {
  const user = await getAuthUser(request);
  if (!user) return Response.json({ error: '인증이 필요합니다.' }, { status: 401 });
  try {
    const data = await request.json();
    const result = await createOrder(data);
    await createActivityLog({ user_id: user.id, user_name: user.name, action: 'order_create', detail: `주문 등록: ${result.order_number}` });
    return Response.json({ ...result, message: '주문이 등록되었습니다.' });
  } catch {
    return Response.json({ error: '주문 등록에 실패했습니다.' }, { status: 500 });
  }
}

export async function DELETE(request) {
  const user = await getAuthUser(request);
  if (!user) return Response.json({ error: '인증이 필요합니다.' }, { status: 401 });
  try {
    const { id } = await request.json();
    await deleteOrder(id);
    await createActivityLog({ user_id: user.id, user_name: user.name, action: 'order_delete', detail: `주문 삭제 (ID: ${id})` });
    return Response.json({ message: '주문이 삭제되었습니다.' });
  } catch {
    return Response.json({ error: '주문 삭제에 실패했습니다.' }, { status: 500 });
  }
}

export async function PATCH(request) {
  const user = await getAuthUser(request);
  if (!user) return Response.json({ error: '인증이 필요합니다.' }, { status: 401 });
  try {
    const { id, status } = await request.json();
    await updateOrderStatus(id, status);
    await createActivityLog({ user_id: user.id, user_name: user.name, action: 'order_status_change', detail: `주문 상태 변경: ${status} (ID: ${id})` });
    return Response.json({ message: `주문 상태가 '${status}'(으)로 변경되었습니다.` });
  } catch {
    return Response.json({ error: '상태 변경에 실패했습니다.' }, { status: 500 });
  }
}

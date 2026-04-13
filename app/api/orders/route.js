import { getAllOrders, createOrder, deleteOrder, updateOrderStatus } from '@/lib/db';

export async function GET() {
  try {
    const orders = await getAllOrders();
    return Response.json(orders);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    const result = await createOrder(data);
    return Response.json({ ...result, message: '주문이 등록되었습니다.' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { id } = await request.json();
    await deleteOrder(id);
    return Response.json({ message: '주문이 삭제되었습니다.' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const { id, status } = await request.json();
    await updateOrderStatus(id, status);
    return Response.json({ message: `주문 상태가 '${status}'(으)로 변경되었습니다.` });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

import { getOrderById, updateOrder } from '@/lib/db';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const order = await getOrderById(id);
    if (!order) {
      return Response.json({ error: '주문을 찾을 수 없습니다.' }, { status: 404 });
    }
    return Response.json(order);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const data = await request.json();
    await updateOrder(id, data);
    return Response.json({ message: '주문이 수정되었습니다.' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

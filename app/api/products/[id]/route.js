import { getProductById, updateProduct } from '@/lib/db';

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const data = await request.json();
    await updateProduct(id, data);
    return Response.json({ message: '품목이 수정되었습니다.' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

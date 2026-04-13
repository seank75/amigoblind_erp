import { getAllProducts, createProduct, deleteProduct } from '@/lib/db';

export async function GET() {
  try {
    const products = await getAllProducts();
    return Response.json(products);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    const result = await createProduct(data);
    return Response.json({ id: result.lastInsertRowid, message: '품목이 등록되었습니다.' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { id } = await request.json();
    await deleteProduct(id);
    return Response.json({ message: '품목이 삭제되었습니다.' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

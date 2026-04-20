import { getAllProducts, createProduct, deleteProduct, createActivityLog } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

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
    const user = await getAuthUser(request);
    const data = await request.json();
    const result = await createProduct(data);
    if (user) await createActivityLog({ user_id: user.id, user_name: user.name, action: 'product_create', detail: `품목 등록: ${data.name}` });
    return Response.json({ id: result.lastInsertRowid, message: '품목이 등록되었습니다.' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const user = await getAuthUser(request);
    const { id } = await request.json();
    await deleteProduct(id);
    if (user) await createActivityLog({ user_id: user.id, user_name: user.name, action: 'product_delete', detail: `품목 삭제 (ID: ${id})` });
    return Response.json({ message: '품목이 삭제되었습니다.' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

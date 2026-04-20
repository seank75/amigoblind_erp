import { getAllProducts, createProduct, deleteProduct, createActivityLog } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function GET(request) {
  const user = await getAuthUser(request);
  if (!user) return Response.json({ error: '인증이 필요합니다.' }, { status: 401 });
  try {
    const products = await getAllProducts();
    return Response.json(products);
  } catch {
    return Response.json({ error: '데이터를 불러오는 데 실패했습니다.' }, { status: 500 });
  }
}

export async function POST(request) {
  const user = await getAuthUser(request);
  if (!user) return Response.json({ error: '인증이 필요합니다.' }, { status: 401 });
  try {
    const data = await request.json();
    const result = await createProduct(data);
    await createActivityLog({ user_id: user.id, user_name: user.name, action: 'product_create', detail: `품목 등록: ${data.name}` });
    return Response.json({ id: result.lastInsertRowid, message: '품목이 등록되었습니다.' });
  } catch {
    return Response.json({ error: '품목 등록에 실패했습니다.' }, { status: 500 });
  }
}

export async function DELETE(request) {
  const user = await getAuthUser(request);
  if (!user) return Response.json({ error: '인증이 필요합니다.' }, { status: 401 });
  try {
    const { id } = await request.json();
    await deleteProduct(id);
    await createActivityLog({ user_id: user.id, user_name: user.name, action: 'product_delete', detail: `품목 삭제 (ID: ${id})` });
    return Response.json({ message: '품목이 삭제되었습니다.' });
  } catch {
    return Response.json({ error: '품목 삭제에 실패했습니다.' }, { status: 500 });
  }
}

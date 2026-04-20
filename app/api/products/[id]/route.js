import { updateProduct, createActivityLog } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function PUT(request, { params }) {
  try {
    const user = await getAuthUser(request);
    const { id } = await params;
    const data = await request.json();
    await updateProduct(id, data);
    if (user) await createActivityLog({ user_id: user.id, user_name: user.name, action: 'product_update', detail: `품목 수정: ${data.name}` });
    return Response.json({ message: '품목이 수정되었습니다.' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

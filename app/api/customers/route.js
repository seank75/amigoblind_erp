import { getAllCustomers, createCustomer, deleteCustomer, createActivityLog } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function GET(request) {
  const user = await getAuthUser(request);
  if (!user) return Response.json({ error: '인증이 필요합니다.' }, { status: 401 });
  try {
    const customers = await getAllCustomers();
    return Response.json(customers);
  } catch {
    return Response.json({ error: '데이터를 불러오는 데 실패했습니다.' }, { status: 500 });
  }
}

export async function POST(request) {
  const user = await getAuthUser(request);
  if (!user) return Response.json({ error: '인증이 필요합니다.' }, { status: 401 });
  try {
    const data = await request.json();
    const result = await createCustomer(data);
    await createActivityLog({ user_id: user.id, user_name: user.name, action: 'customer_create', detail: `거래처 등록: ${data.company_name}` });
    return Response.json({ id: result.lastInsertRowid, message: '거래처가 등록되었습니다.' });
  } catch (error) {
    if (error.message.includes('UNIQUE constraint')) {
      return Response.json({ error: '이미 등록된 사업자번호입니다.' }, { status: 400 });
    }
    return Response.json({ error: '거래처 등록에 실패했습니다.' }, { status: 500 });
  }
}

export async function DELETE(request) {
  const user = await getAuthUser(request);
  if (!user) return Response.json({ error: '인증이 필요합니다.' }, { status: 401 });
  try {
    const { id } = await request.json();
    await deleteCustomer(id);
    await createActivityLog({ user_id: user.id, user_name: user.name, action: 'customer_delete', detail: `거래처 삭제 (ID: ${id})` });
    return Response.json({ message: '거래처가 삭제되었습니다.' });
  } catch {
    return Response.json({ error: '거래처 삭제에 실패했습니다.' }, { status: 500 });
  }
}

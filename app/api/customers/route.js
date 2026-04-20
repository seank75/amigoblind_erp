import { getAllCustomers, createCustomer, deleteCustomer, createActivityLog } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function GET() {
  try {
    const customers = await getAllCustomers();
    return Response.json(customers);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await getAuthUser(request);
    const data = await request.json();
    const result = await createCustomer(data);
    if (user) await createActivityLog({ user_id: user.id, user_name: user.name, action: 'customer_create', detail: `거래처 등록: ${data.company_name}` });
    return Response.json({ id: result.lastInsertRowid, message: '거래처가 등록되었습니다.' });
  } catch (error) {
    if (error.message.includes('UNIQUE constraint')) {
      return Response.json({ error: '이미 등록된 사업자번호입니다.' }, { status: 400 });
    }
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const user = await getAuthUser(request);
    const { id } = await request.json();
    await deleteCustomer(id);
    if (user) await createActivityLog({ user_id: user.id, user_name: user.name, action: 'customer_delete', detail: `거래처 삭제 (ID: ${id})` });
    return Response.json({ message: '거래처가 삭제되었습니다.' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

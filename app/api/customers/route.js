import { getAllCustomers, createCustomer, deleteCustomer } from '@/lib/db';

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
    const data = await request.json();
    const result = await createCustomer(data);
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
    const { id } = await request.json();
    await deleteCustomer(id);
    return Response.json({ message: '거래처가 삭제되었습니다.' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

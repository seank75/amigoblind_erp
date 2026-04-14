import { getCustomerById, updateCustomer } from '@/lib/db';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const customer = await getCustomerById(id);
    if (!customer) {
      return Response.json({ error: '거래처를 찾을 수 없습니다.' }, { status: 404 });
    }
    return Response.json(customer);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const data = await request.json();
    await updateCustomer(id, data);
    return Response.json({ message: '거래처가 수정되었습니다.' });
  } catch (error) {
    if (error.message?.includes('UNIQUE') || error.message?.includes('unique') || error.message?.includes('duplicate')) {
      return Response.json({ error: '이미 등록된 사업자번호입니다. 다른 사업자번호를 입력해주세요.' }, { status: 400 });
    }
    return Response.json({ error: '저장 중 오류가 발생했습니다. 다시 시도해주세요.' }, { status: 500 });
  }
}

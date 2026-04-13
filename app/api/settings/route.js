import { getSettings, updateSettings } from '@/lib/db';

export async function GET() {
  try {
    const settings = await getSettings();
    return Response.json(settings);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    await updateSettings(data);
    return Response.json({ message: '설정이 저장되었습니다.' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

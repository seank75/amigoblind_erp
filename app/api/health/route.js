import postgres from 'postgres';

export async function GET() {
  if (!process.env.DATABASE_URL) {
    return Response.json({ ok: false, reason: 'no_db_url' }, { status: 503 });
  }
  try {
    const sql = postgres(process.env.DATABASE_URL, { ssl: 'require', connect_timeout: 5 });
    await sql`SELECT 1`;
    await sql.end();
    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false, reason: 'db_offline' }, { status: 503 });
  }
}

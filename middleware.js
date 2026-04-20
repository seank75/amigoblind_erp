import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

const PUBLIC = ['/login', '/api/auth/login', '/api/health'];

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  if (PUBLIC.some((p) => pathname.startsWith(p))) return NextResponse.next();

  const token = request.cookies.get('auth_token')?.value;
  if (!token) return NextResponse.redirect(new URL('/login', request.url));

  const user = await verifyToken(token);
  if (!user) {
    const res = NextResponse.redirect(new URL('/login', request.url));
    res.cookies.delete('auth_token');
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|logo.png|amigo_symbol.png).*)'],
};

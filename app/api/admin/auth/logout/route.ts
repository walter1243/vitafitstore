import { NextResponse } from 'next/server';
import { buildClearAuthCookie } from '@/lib/admin-auth';

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(buildClearAuthCookie());
  return response;
}

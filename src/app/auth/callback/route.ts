import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { appUrl, safeNext } from '@/lib/config';
import type { EmailOtpType } from '@supabase/supabase-js';
export async function GET(request: Request) {
  const url = new URL(request.url);
  const db = await createClient();
  const code = url.searchParams.get('code');
  const token_hash = url.searchParams.get('token_hash');
  const type = url.searchParams.get('type');
  const allowed = ['signup', 'invite', 'recovery', 'email', 'email_change', 'magiclink'];
  const result = code
    ? await db.auth.exchangeCodeForSession(code)
    : token_hash && type && allowed.includes(type)
      ? await db.auth.verifyOtp({ token_hash, type: type as EmailOtpType })
      : { error: true };
  const response = NextResponse.redirect(
    new URL(
      result.error ? '/login?error=invalid_link' : safeNext(url.searchParams.get('next')),
      appUrl(),
    ),
  );
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
}

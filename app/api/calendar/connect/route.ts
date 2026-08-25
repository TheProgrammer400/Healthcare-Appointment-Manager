import { NextResponse } from 'next/server';
import { getGoogleAuthUrl } from '@/lib/calendar/googleOAuthClient';
import { requireAuth } from '@/lib/auth/guard';

export async function GET(req: Request) {
  try {
    await requireAuth();
    const url = getGoogleAuthUrl();
    return NextResponse.redirect(url);
  } catch (err) {
    return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
  }
}

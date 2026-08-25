import { NextResponse } from 'next/server';
import { getGoogleOAuthClient } from '@/lib/calendar/googleOAuthClient';
import { getSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.json({ success: false, error: 'Missing code parameter' }, { status: 400 });
  }

  const session = await getSession();
  if (!session) {
    return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
  }

  try {
    const oauth2Client = getGoogleOAuthClient();
    const { tokens } = await oauth2Client.getToken(code);

    if (tokens.access_token && tokens.refresh_token) {
      const expiresAt = tokens.expiry_date
        ? new Date(tokens.expiry_date)
        : new Date(Date.now() + 3600 * 1000);

      await prisma.googleOAuthToken.upsert({
        where: { userId: session.user.id },
        update: {
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          expiresAt,
        },
        create: {
          userId: session.user.id,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          expiresAt,
        },
      });
    }

    const rolePath = session.user.role === 'PATIENT' ? '/patient/dashboard' : '/doctor/dashboard';
    return NextResponse.redirect(new URL(`${rolePath}?calendarConnected=true`, req.url));
  } catch (err: any) {
    console.error('[Google Calendar Callback Error]:', err);
    return NextResponse.json({ success: false, error: 'Failed to exchange authorization code' }, { status: 500 });
  }
}

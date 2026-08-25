import { withErrorHandling, successResponse } from '@/lib/errors/withErrorHandling';
import { AuthService } from '@/services/authService';
import { registerSchema } from '@/lib/validation';
import { SESSION_COOKIE_NAME, SESSION_TTL_DAYS } from '@/lib/auth/session';

export const POST = withErrorHandling(async (req: Request) => {
  const body = await req.json();
  const input = registerSchema.parse(body);

  const result = await AuthService.registerPatient(input);

  const response = successResponse(result.user, 201);
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: result.sessionId,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_DAYS * 24 * 60 * 60,
  });

  return response;
});

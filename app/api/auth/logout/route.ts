import { withErrorHandling, successResponse } from '@/lib/errors/withErrorHandling';
import { AuthService } from '@/services/authService';
import { SESSION_COOKIE_NAME } from '@/lib/auth/session';

export const POST = withErrorHandling(async () => {
  await AuthService.logout();
  const response = successResponse({ message: 'Logged out successfully' });
  response.cookies.delete(SESSION_COOKIE_NAME);
  return response;
});

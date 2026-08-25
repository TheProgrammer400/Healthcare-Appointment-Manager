import { withErrorHandling, successResponse } from '@/lib/errors/withErrorHandling';
import { AuthService } from '@/services/authService';
import { AuthenticatedUser } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export const GET = withErrorHandling(async () => {
  const session = await AuthService.getCurrentSession();
  const user: AuthenticatedUser | null = session ? session.user : null;
  return successResponse({ user });
});

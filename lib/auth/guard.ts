import { getSession, SessionData } from './session';
import { AuthenticationError, AuthorizationError } from '@/lib/errors/AppError';
import { UserRole } from '@prisma/client';

export async function requireAuth(): Promise<SessionData> {
  const session = await getSession();
  if (!session) {
    throw new AuthenticationError('Authentication required');
  }
  return session;
}

export function requireRole(session: SessionData, allowedRoles: UserRole[]): void {
  if (!allowedRoles.includes(session.user.role)) {
    throw new AuthorizationError(`Role '${session.user.role}' is not authorized for this operation`);
  }
}

export function requireOwnership(callerUserId: string, targetUserId: string, isAdminAllowed = true, callerRole?: UserRole): void {
  if (isAdminAllowed && callerRole === UserRole.ADMIN) {
    return;
  }
  if (callerUserId !== targetUserId) {
    throw new AuthorizationError('You do not have permission to access or modify this resource');
  }
}

export function verifyCsrfOrigin(request: Request): void {
  const method = request.method.toUpperCase();
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    return;
  }

  const origin = request.headers.get('origin');
  if (!origin) {
    return; // Allow direct server-side / non-browser requests without origin header
  }

  const allowedOrigin = process.env.ALLOWED_ORIGIN || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  
  try {
    const originHost = new URL(origin).host;
    const allowedHost = new URL(allowedOrigin).host;
    if (originHost !== allowedHost) {
      throw new AuthorizationError('CSRF check failed: Origin header mismatch');
    }
  } catch (err) {
    if (err instanceof AuthorizationError) throw err;
    // Fallback simple string check if URL parsing fails
    if (!origin.startsWith(allowedOrigin)) {
      throw new AuthorizationError('CSRF check failed: Invalid origin');
    }
  }
}

import { prisma } from '@/lib/db/prisma';
import { hashPassword, comparePassword } from '@/lib/auth/password';
import { createSession, destroySession, getSession, SessionData } from '@/lib/auth/session';
import { createUserWithPatientProfile, findUserByEmail } from '@/repositories/userRepository';
import { ConflictError, AuthenticationError, RateLimitError } from '@/lib/errors/AppError';
import { RegisterInput, LoginInput } from '@/lib/validation';

const MAX_LOGIN_ATTEMPTS = 10;
const LOGIN_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

export class AuthService {
  static async registerPatient(input: RegisterInput): Promise<{ user: { id: string; email: string; fullName: string; role: string }; sessionId: string }> {
    const existingUser = await findUserByEmail(input.email);
    if (existingUser) {
      throw new ConflictError('An account with this email address already exists', 'EMAIL_TAKEN');
    }

    const passwordHash = await hashPassword(input.password);
    const user = await createUserWithPatientProfile({
      email: input.email,
      passwordHash,
      fullName: input.fullName,
      phone: input.phone,
    });

    const sessionId = await createSession(user.id);

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
      sessionId,
    };
  }

  static async login(input: LoginInput): Promise<{ user: { id: string; email: string; fullName: string; role: string }; sessionId: string }> {
    const email = input.email.toLowerCase().trim();

    // Check rate limiting
    const now = new Date();
    const windowStart = new Date(now.getTime() - LOGIN_WINDOW_MS);

    const attempts = await prisma.loginAttempt.findFirst({
      where: {
        email,
        windowStart: { gte: windowStart },
      },
    });

    if (attempts && attempts.count >= MAX_LOGIN_ATTEMPTS) {
      throw new RateLimitError('Too many failed login attempts. Please try again after 15 minutes.');
    }

    const user = await findUserByEmail(email);
    if (!user) {
      await this.recordFailedAttempt(email, attempts);
      throw new AuthenticationError('Invalid email or password');
    }

    const passwordMatches = await comparePassword(input.password, user.passwordHash);
    if (!passwordMatches) {
      await this.recordFailedAttempt(email, attempts);
      throw new AuthenticationError('Invalid email or password');
    }

    // Reset login attempts on success
    if (attempts) {
      await prisma.loginAttempt.delete({ where: { id: attempts.id } }).catch(() => {});
    }

    const sessionId = await createSession(user.id);

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
      sessionId,
    };
  }

  static async logout(): Promise<void> {
    await destroySession();
  }

  static async getCurrentSession(): Promise<SessionData | null> {
    return getSession();
  }

  private static async recordFailedAttempt(email: string, existingAttempt: any) {
    if (existingAttempt) {
      await prisma.loginAttempt.update({
        where: { id: existingAttempt.id },
        data: { count: existingAttempt.count + 1 },
      });
    } else {
      await prisma.loginAttempt.create({
        data: {
          email,
          windowStart: new Date(),
          count: 1,
        },
      });
    }
  }
}

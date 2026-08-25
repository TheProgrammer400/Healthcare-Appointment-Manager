import crypto from 'crypto';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db/prisma';
import { UserRole } from '@prisma/client';

export const SESSION_COOKIE_NAME = 'session_token';
export const SESSION_TTL_DAYS = Number(process.env.SESSION_TTL_DAYS || '7');

export interface AuthenticatedUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  phone?: string | null;
  doctorProfileId?: string | null;
  patientProfileId?: string | null;
}

export interface SessionData {
  sessionId: string;
  user: AuthenticatedUser;
  expiresAt: Date;
}

export async function createSession(userId: string): Promise<string> {
  const sessionId = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);

  await prisma.session.create({
    data: {
      id: sessionId,
      userId,
      expiresAt,
    },
  });

  return sessionId;
}

export async function getSession(): Promise<SessionData | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const session = await prisma.session.findUnique({
    where: { id: token },
    include: {
      user: {
        include: {
          doctorProfile: { select: { id: true } },
          patientProfile: { select: { id: true } },
        },
      },
    },
  });

  if (!session) {
    return null;
  }

  if (session.expiresAt.getTime() <= Date.now()) {
    await prisma.session.delete({ where: { id: token } }).catch(() => {});
    return null;
  }

  return {
    sessionId: session.id,
    expiresAt: session.expiresAt,
    user: {
      id: session.user.id,
      email: session.user.email,
      fullName: session.user.fullName,
      role: session.user.role,
      phone: session.user.phone,
      doctorProfileId: session.user.doctorProfile?.id ?? null,
      patientProfileId: session.user.patientProfile?.id ?? null,
    },
  };
}

export async function destroySession(): Promise<void> {
  const cookieStore = cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    await prisma.session.delete({ where: { id: token } }).catch(() => {});
    cookieStore.delete(SESSION_COOKIE_NAME);
  }
}

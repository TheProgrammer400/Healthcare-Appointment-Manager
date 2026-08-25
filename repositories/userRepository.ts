import { prisma } from '@/lib/db/prisma';
import { Prisma, User, UserRole } from '@prisma/client';

export type TransactionClient = Prisma.TransactionClient;

export async function findUserByEmail(email: string, tx: TransactionClient = prisma): Promise<User | null> {
  return tx.user.findUnique({
    where: { email: email.toLowerCase().trim() },
  });
}

export async function findUserById(id: string, tx: TransactionClient = prisma): Promise<User | null> {
  return tx.user.findUnique({
    where: { id },
  });
}

export async function createUserWithPatientProfile(
  data: {
    email: string;
    passwordHash: string;
    fullName: string;
    phone?: string;
    dateOfBirth?: Date;
  },
  tx: TransactionClient = prisma
): Promise<User> {
  return tx.user.create({
    data: {
      email: data.email.toLowerCase().trim(),
      passwordHash: data.passwordHash,
      fullName: data.fullName,
      phone: data.phone,
      role: UserRole.PATIENT,
      patientProfile: {
        create: {
          dateOfBirth: data.dateOfBirth,
        },
      },
    },
    include: {
      patientProfile: true,
    },
  });
}

export async function createUserWithDoctorProfile(
  data: {
    email: string;
    passwordHash: string;
    fullName: string;
    phone?: string;
    specialisation: string;
    slotDurationMinutes: number;
    bio?: string;
    workingHours?: { dayOfWeek: number; startTime: string; endTime: string }[];
  },
  tx: TransactionClient = prisma
): Promise<User> {
  return tx.user.create({
    data: {
      email: data.email.toLowerCase().trim(),
      passwordHash: data.passwordHash,
      fullName: data.fullName,
      phone: data.phone,
      role: UserRole.DOCTOR,
      doctorProfile: {
        create: {
          specialisation: data.specialisation,
          slotDurationMinutes: data.slotDurationMinutes,
          bio: data.bio,
          workingHours: data.workingHours ? { createMany: { data: data.workingHours } } : undefined,
        },
      },
    },
    include: {
      doctorProfile: {
        include: { workingHours: true },
      },
    },
  });
}

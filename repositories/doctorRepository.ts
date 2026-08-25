import { prisma } from '@/lib/db/prisma';
import { Prisma, DoctorProfile } from '@prisma/client';

export type TransactionClient = Prisma.TransactionClient;

export async function findDoctorById(id: string, tx: TransactionClient = prisma) {
  return tx.doctorProfile.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, email: true, fullName: true, phone: true } },
      workingHours: true,
      leaveDays: true,
    },
  });
}

export async function findDoctorByUserId(userId: string, tx: TransactionClient = prisma) {
  return tx.doctorProfile.findUnique({
    where: { userId },
    include: {
      user: { select: { id: true, email: true, fullName: true, phone: true } },
      workingHours: true,
      leaveDays: true,
    },
  });
}

export async function listDoctors(
  params: { specialisation?: string; page?: number; pageSize?: number },
  tx: TransactionClient = prisma
) {
  const page = params.page || 1;
  const pageSize = Math.min(params.pageSize || 20, 50);
  const skip = (page - 1) * pageSize;

  const where: Prisma.DoctorProfileWhereInput = params.specialisation
    ? { specialisation: { equals: params.specialisation, mode: 'insensitive' } }
    : {};

  const [doctors, total] = await Promise.all([
    tx.doctorProfile.findMany({
      where,
      skip,
      take: pageSize,
      include: {
        user: { select: { id: true, email: true, fullName: true, phone: true } },
        workingHours: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
    tx.doctorProfile.count({ where }),
  ]);

  return { doctors, total, page, pageSize };
}

export async function updateDoctorProfile(
  id: string,
  data: {
    specialisation?: string;
    slotDurationMinutes?: number;
    bio?: string;
  },
  tx: TransactionClient = prisma
) {
  return tx.doctorProfile.update({
    where: { id },
    data,
    include: {
      user: { select: { id: true, email: true, fullName: true } },
      workingHours: true,
    },
  });
}

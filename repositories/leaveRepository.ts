import { prisma } from '@/lib/db/prisma';
import { Prisma, DoctorLeaveDay } from '@prisma/client';

export type TransactionClient = Prisma.TransactionClient;

export async function findLeaveDay(doctorId: string, leaveDate: Date, tx: TransactionClient = prisma): Promise<DoctorLeaveDay | null> {
  return tx.doctorLeaveDay.findUnique({
    where: {
      doctorId_leaveDate: {
        doctorId,
        leaveDate,
      },
    },
  });
}

export async function createLeaveDay(
  doctorId: string,
  leaveDate: Date,
  reason?: string,
  tx: TransactionClient = prisma
): Promise<DoctorLeaveDay> {
  return tx.doctorLeaveDay.create({
    data: {
      doctorId,
      leaveDate,
      reason,
    },
  });
}

export async function listLeaveDaysForDoctor(doctorId: string, tx: TransactionClient = prisma) {
  return tx.doctorLeaveDay.findMany({
    where: { doctorId },
    orderBy: { leaveDate: 'asc' },
  });
}

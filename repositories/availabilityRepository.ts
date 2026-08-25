import { prisma } from '@/lib/db/prisma';
import { Prisma } from '@prisma/client';

export type TransactionClient = Prisma.TransactionClient;

export async function findWorkingHoursByDoctorAndDay(
  doctorId: string,
  dayOfWeek: number,
  tx: TransactionClient = prisma
) {
  return tx.doctorWorkingHours.findUnique({
    where: {
      doctorId_dayOfWeek: {
        doctorId,
        dayOfWeek,
      },
    },
  });
}

export async function setWorkingHoursForDoctor(
  doctorId: string,
  workingHours: { dayOfWeek: number; startTime: string; endTime: string }[],
  tx: TransactionClient = prisma
) {
  await tx.doctorWorkingHours.deleteMany({ where: { doctorId } });
  return tx.doctorWorkingHours.createMany({
    data: workingHours.map((wh) => ({
      doctorId,
      dayOfWeek: wh.dayOfWeek,
      startTime: wh.startTime,
      endTime: wh.endTime,
    })),
  });
}

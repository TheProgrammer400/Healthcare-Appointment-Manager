import { prisma } from '@/lib/db/prisma';
import { Prisma, ReminderJob, ReminderStatus } from '@prisma/client';

export type TransactionClient = Prisma.TransactionClient;

export async function createReminderJobs(
  jobs: {
    appointmentId: string;
    medicineName: string;
    scheduledFor: Date;
  }[],
  tx: TransactionClient = prisma
) {
  return tx.reminderJob.createMany({
    data: jobs.map((j) => ({
      appointmentId: j.appointmentId,
      medicineName: j.medicineName,
      scheduledFor: j.scheduledFor,
      status: ReminderStatus.SCHEDULED,
    })),
  });
}

export async function findDueReminderJobs(now: Date = new Date(), limit = 50, tx: TransactionClient = prisma) {
  return tx.reminderJob.findMany({
    where: {
      status: ReminderStatus.SCHEDULED,
      scheduledFor: { lte: now },
      attemptCount: { lt: 5 },
    },
    take: limit,
    include: {
      appointment: {
        include: {
          patient: { include: { user: { select: { id: true, email: true, fullName: true } } } },
        },
      },
    },
    orderBy: { scheduledFor: 'asc' },
  });
}

export async function updateReminderJobStatus(
  id: string,
  status: ReminderStatus,
  attemptCount: number,
  tx: TransactionClient = prisma
) {
  return tx.reminderJob.update({
    where: { id },
    data: {
      status,
      attemptCount,
      lastAttemptAt: new Date(),
    },
  });
}

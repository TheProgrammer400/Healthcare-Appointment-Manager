import { prisma } from '@/lib/db/prisma';
import { Prisma, NotificationJob, NotificationType, NotificationStatus, NotificationChannel } from '@prisma/client';

export type TransactionClient = Prisma.TransactionClient;

export async function createNotificationJob(
  data: {
    userId: string;
    appointmentId?: string;
    type: NotificationType;
    channel?: NotificationChannel;
    payload: Prisma.InputJsonValue;
  },
  tx: TransactionClient = prisma
): Promise<NotificationJob> {
  return tx.notificationJob.create({
    data: {
      userId: data.userId,
      appointmentId: data.appointmentId,
      type: data.type,
      channel: data.channel || NotificationChannel.EMAIL,
      payload: data.payload,
      status: NotificationStatus.PENDING,
    },
  });
}

export async function findPendingNotificationJobs(limit = 50, tx: TransactionClient = prisma) {
  return tx.notificationJob.findMany({
    where: {
      status: { in: [NotificationStatus.PENDING, NotificationStatus.FAILED] },
      attemptCount: { lt: 5 },
    },
    take: limit,
    include: {
      user: { select: { id: true, email: true, fullName: true } },
    },
    orderBy: { createdAt: 'asc' },
  });
}

export async function updateNotificationJobStatus(
  id: string,
  status: NotificationStatus,
  attemptCount: number,
  tx: TransactionClient = prisma
) {
  return tx.notificationJob.update({
    where: { id },
    data: {
      status,
      attemptCount,
      lastAttemptAt: new Date(),
    },
  });
}

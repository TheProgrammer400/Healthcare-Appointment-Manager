import { prisma } from '@/lib/db/prisma';
import { Prisma } from '@prisma/client';

export type TransactionClient = Prisma.TransactionClient;

export async function createAuditLog(
  data: {
    actorUserId?: string;
    action: string;
    targetType: string;
    targetId?: string;
    metadata?: Prisma.InputJsonValue;
  },
  tx: TransactionClient = prisma
) {
  return tx.auditLog.create({
    data: {
      actorUserId: data.actorUserId,
      action: data.action,
      targetType: data.targetType,
      targetId: data.targetId,
      metadata: data.metadata,
    },
  });
}

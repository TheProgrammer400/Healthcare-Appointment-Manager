import { prisma } from '@/lib/db/prisma';
import { Prisma, VisitSummary, LlmStatus } from '@prisma/client';

export type TransactionClient = Prisma.TransactionClient;

export async function createVisitSummary(
  data: {
    appointmentId: string;
    doctorNotes: string;
    prescription: Prisma.InputJsonValue;
  },
  tx: TransactionClient = prisma
): Promise<VisitSummary> {
  return tx.visitSummary.create({
    data: {
      appointmentId: data.appointmentId,
      doctorNotes: data.doctorNotes,
      prescription: data.prescription,
      llmStatus: LlmStatus.PENDING,
    },
  });
}

export async function updateVisitSummaryLlmResult(
  appointmentId: string,
  result: {
    llmPatientSummary?: string;
    llmStatus: LlmStatus;
    llmError?: string;
  },
  tx: TransactionClient = prisma
): Promise<VisitSummary> {
  return tx.visitSummary.update({
    where: { appointmentId },
    data: {
      llmPatientSummary: result.llmPatientSummary,
      llmStatus: result.llmStatus,
      llmError: result.llmError,
    },
  });
}

export async function findVisitSummaryByAppointmentId(appointmentId: string, tx: TransactionClient = prisma) {
  return tx.visitSummary.findUnique({
    where: { appointmentId },
  });
}

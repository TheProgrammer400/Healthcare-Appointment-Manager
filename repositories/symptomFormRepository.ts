import { prisma } from '@/lib/db/prisma';
import { Prisma, SymptomForm, LlmStatus, UrgencyLevel } from '@prisma/client';

export type TransactionClient = Prisma.TransactionClient;

export async function createSymptomForm(
  data: {
    appointmentId: string;
    rawSymptomsText: string;
  },
  tx: TransactionClient = prisma
): Promise<SymptomForm> {
  return tx.symptomForm.create({
    data: {
      appointmentId: data.appointmentId,
      rawSymptomsText: data.rawSymptomsText,
      llmStatus: LlmStatus.PENDING,
    },
  });
}

export async function updateSymptomFormLlmResult(
  appointmentId: string,
  result: {
    llmUrgency?: UrgencyLevel;
    llmChiefComplaint?: string;
    llmQuestions?: string[];
    llmStatus: LlmStatus;
    llmError?: string;
  },
  tx: TransactionClient = prisma
): Promise<SymptomForm> {
  return tx.symptomForm.update({
    where: { appointmentId },
    data: {
      llmUrgency: result.llmUrgency,
      llmChiefComplaint: result.llmChiefComplaint,
      llmQuestions: result.llmQuestions ? (result.llmQuestions as Prisma.InputJsonValue) : Prisma.JsonNull,
      llmStatus: result.llmStatus,
      llmError: result.llmError,
    },
  });
}

export async function findSymptomFormByAppointmentId(appointmentId: string, tx: TransactionClient = prisma) {
  return tx.symptomForm.findUnique({
    where: { appointmentId },
  });
}

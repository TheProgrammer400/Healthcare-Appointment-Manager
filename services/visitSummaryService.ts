import { prisma } from '@/lib/db/prisma';
import { findAppointmentById, updateAppointmentStatus } from '@/repositories/appointmentRepository';
import { createVisitSummary, updateVisitSummaryLlmResult } from '@/repositories/visitSummaryRepository';
import { createReminderJobs } from '@/repositories/reminderJobRepository';
import { createNotificationJob } from '@/repositories/notificationJobRepository';
import { LLMService } from '@/lib/llm/llmService';
import { NotFoundError, AuthorizationError, ValidationError } from '@/lib/errors/AppError';
import { AppointmentStatus, LlmStatus, NotificationType } from '@prisma/client';
import { PrescriptionItemInput } from '@/lib/validation';

export class VisitSummaryService {
  static async submitVisitSummary(params: {
    appointmentId: string;
    doctorNotes: string;
    prescription: PrescriptionItemInput[];
    doctorUserId: string;
  }) {
    const { appointmentId, doctorNotes, prescription, doctorUserId } = params;

    const appointment = await findAppointmentById(appointmentId);
    if (!appointment) {
      throw new NotFoundError('Appointment not found');
    }

    if (appointment.doctor.user.id !== doctorUserId) {
      throw new AuthorizationError('Only the assigned doctor can submit post-visit notes');
    }

    if (appointment.status !== AppointmentStatus.CONFIRMED) {
      throw new ValidationError(`Cannot submit visit summary for appointment in '${appointment.status}' status`);
    }

    // 1. Compute medication reminder jobs from prescription frequency
    const now = new Date();
    const reminderJobsToCreate: { appointmentId: string; medicineName: string; scheduledFor: Date }[] = [];

    for (const item of prescription) {
      // Determine doses per day from frequency text
      let dosesPerDay = 1;
      const freqLower = item.frequency.toLowerCase();
      if (freqLower.includes('twice') || freqLower.includes('2') || freqLower.includes('bid')) dosesPerDay = 2;
      else if (freqLower.includes('three') || freqLower.includes('3') || freqLower.includes('tid')) dosesPerDay = 3;
      else if (freqLower.includes('four') || freqLower.includes('4') || freqLower.includes('qid')) dosesPerDay = 4;

      const intervalHours = 24 / dosesPerDay;
      const totalDoses = item.durationDays * dosesPerDay;

      for (let i = 0; i < Math.min(totalDoses, 60); i++) { // Cap at 60 max reminders per drug
        const scheduledFor = new Date(now.getTime() + i * intervalHours * 60 * 60 * 1000);
        reminderJobsToCreate.push({
          appointmentId,
          medicineName: `${item.medicine} (${item.dosage})`,
          scheduledFor,
        });
      }
    }

    // 2. Perform DB operations inside transaction
    const visitSummary = await prisma.$transaction(async (tx) => {
      // Complete appointment
      await updateAppointmentStatus(appointmentId, AppointmentStatus.COMPLETED, undefined, tx);

      // Create visit summary
      const vs = await createVisitSummary(
        {
          appointmentId,
          doctorNotes,
          prescription: prescription as any,
        },
        tx
      );

      // Create reminder jobs if any
      if (reminderJobsToCreate.length > 0) {
        await createReminderJobs(reminderJobsToCreate, tx);
      }

      // Enqueue notification job for patient (Visit summary ready)
      await createNotificationJob(
        {
          userId: appointment.patient.user.id,
          appointmentId,
          type: NotificationType.REMINDER,
          payload: {
            patientName: appointment.patient.user.fullName,
            doctorName: appointment.doctor.user.fullName,
            message: `Your post-visit summary and prescription from Dr. ${appointment.doctor.user.fullName} are now available in your portal.`,
          },
        },
        tx
      );

      return vs;
    });

    // 3. Best-effort LLM post-visit summary generation
    try {
      const llmResult = await LLMService.generatePostVisitSummary(doctorNotes, prescription);
      const updatedVs = await updateVisitSummaryLlmResult(appointmentId, {
        llmPatientSummary: llmResult.formattedText,
        llmStatus: LlmStatus.SUCCESS,
      });

      return { appointmentStatus: AppointmentStatus.COMPLETED, visitSummary: updatedVs };
    } catch (llmErr: any) {
      console.warn(`[VisitSummaryService]: LLM post-visit generation failed gracefully for appointment ${appointmentId}:`, llmErr?.message);

      const failedVs = await updateVisitSummaryLlmResult(appointmentId, {
        llmStatus: LlmStatus.FAILED,
        llmError: llmErr?.message || 'Post-visit summary generation failed',
      });

      return { appointmentStatus: AppointmentStatus.COMPLETED, visitSummary: failedVs };
    }
  }
}

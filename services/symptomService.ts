import { prisma } from '@/lib/db/prisma';
import { findAppointmentById, updateAppointmentStatus } from '@/repositories/appointmentRepository';
import { createSymptomForm, updateSymptomFormLlmResult } from '@/repositories/symptomFormRepository';
import { createNotificationJob } from '@/repositories/notificationJobRepository';
import { LLMService } from '@/lib/llm/llmService';
import { NotFoundError, AuthorizationError, ValidationError } from '@/lib/errors/AppError';
import { AppointmentStatus, LlmStatus, NotificationType } from '@prisma/client';

export class SymptomService {
  static async submitSymptomsAndConfirm(params: {
    appointmentId: string;
    symptoms: string;
    patientUserId: string;
  }) {
    const { appointmentId, symptoms, patientUserId } = params;

    const appointment = await findAppointmentById(appointmentId);
    if (!appointment) {
      throw new NotFoundError('Appointment not found');
    }

    if (appointment.patient.user.id !== patientUserId) {
      throw new AuthorizationError('You are not authorized to submit symptoms for this appointment');
    }

    // Verify hold validity if in HOLD status
    if (appointment.status === AppointmentStatus.HOLD) {
      if (appointment.holdExpiresAt && appointment.holdExpiresAt.getTime() <= Date.now()) {
        throw new ValidationError('Appointment slot hold has expired. Please select the slot again.');
      }
    } else if (appointment.status !== AppointmentStatus.CONFIRMED && appointment.status !== AppointmentStatus.PENDING) {
      throw new ValidationError(`Cannot submit symptoms for appointment in '${appointment.status}' status`);
    }

    // 1. Save symptom form and confirm appointment inside transaction
    const symptomForm = await prisma.$transaction(async (tx) => {
      // Transition status to CONFIRMED
      await updateAppointmentStatus(appointmentId, AppointmentStatus.CONFIRMED, undefined, tx);

      // Create symptom form with PENDING LLM status
      const sf = await createSymptomForm({ appointmentId, rawSymptomsText: symptoms }, tx);

      // Enqueue booking confirmation notifications
      await createNotificationJob(
        {
          userId: appointment.patient.user.id,
          appointmentId,
          type: NotificationType.BOOKING_CONFIRMATION,
          payload: {
            patientName: appointment.patient.user.fullName,
            doctorName: appointment.doctor.user.fullName,
            specialisation: appointment.doctor.specialisation,
            startAt: appointment.startAt,
          },
        },
        tx
      );

      await createNotificationJob(
        {
          userId: appointment.doctor.user.id,
          appointmentId,
          type: NotificationType.BOOKING_CONFIRMATION,
          payload: {
            recipientName: appointment.doctor.user.fullName,
            doctorName: appointment.doctor.user.fullName,
            patientName: appointment.patient.user.fullName,
            startAt: appointment.startAt,
          },
        },
        tx
      );

      return sf;
    });

    // 2. Best-effort LLM execution with graceful failure handling
    try {
      const llmResult = await LLMService.generatePreVisitSummary(symptoms);
      const updatedForm = await updateSymptomFormLlmResult(appointmentId, {
        llmUrgency: llmResult.urgency,
        llmChiefComplaint: llmResult.chiefComplaint,
        llmQuestions: llmResult.suggestedQuestions,
        llmStatus: LlmStatus.SUCCESS,
      });

      return { appointmentStatus: AppointmentStatus.CONFIRMED, symptomForm: updatedForm };
    } catch (llmErr: any) {
      console.warn(`[SymptomService]: LLM pre-visit generation failed gracefully for appointment ${appointmentId}:`, llmErr?.message);
      
      const failedForm = await updateSymptomFormLlmResult(appointmentId, {
        llmStatus: LlmStatus.FAILED,
        llmError: llmErr?.message || 'Pre-visit summary generation failed',
      });

      return { appointmentStatus: AppointmentStatus.CONFIRMED, symptomForm: failedForm };
    }
  }
}

import { findDueReminderJobs, updateReminderJobStatus } from '@/repositories/reminderJobRepository';
import { ResendProvider } from '@/lib/email/resendProvider';
import { medicationReminderTemplate } from '@/lib/email/templates';
import { ReminderStatus } from '@prisma/client';

const emailProvider = new ResendProvider();

export class ReminderService {
  static async processDueReminders(limit = 50): Promise<{ processed: number; succeeded: number; failed: number }> {
    const dueJobs = await findDueReminderJobs(new Date(), limit);
    let succeeded = 0;
    let failed = 0;

    for (const job of dueJobs) {
      try {
        const patientUser = job.appointment.patient.user;
        const template = medicationReminderTemplate({
          patientName: patientUser.fullName,
          medicineName: job.medicineName,
        });

        await emailProvider.sendEmail({
          to: patientUser.email,
          subject: template.subject,
          html: template.html,
        });

        await updateReminderJobStatus(job.id, ReminderStatus.SENT, job.attemptCount + 1);
        succeeded++;
      } catch (err: any) {
        console.error(`[ReminderService]: Failed reminder job ${job.id}:`, err?.message);
        const newCount = job.attemptCount + 1;
        const newStatus = newCount >= 5 ? ReminderStatus.FAILED : ReminderStatus.FAILED;
        await updateReminderJobStatus(job.id, newStatus, newCount);
        failed++;
      }
    }

    return { processed: dueJobs.length, succeeded, failed };
  }
}

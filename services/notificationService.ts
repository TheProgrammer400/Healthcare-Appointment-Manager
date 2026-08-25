import { findPendingNotificationJobs, updateNotificationJobStatus } from '@/repositories/notificationJobRepository';
import { ResendProvider } from '@/lib/email/resendProvider';
import {
  bookingConfirmationTemplate,
  cancellationTemplate,
  leaveConflictTemplate,
} from '@/lib/email/templates';
import { NotificationStatus, NotificationType } from '@prisma/client';

const emailProvider = new ResendProvider();

export class NotificationService {
  static async processPendingJobs(limit = 20): Promise<{ processed: number; succeeded: number; failed: number }> {
    const jobs = await findPendingNotificationJobs(limit);
    let succeeded = 0;
    let failed = 0;

    for (const job of jobs) {
      const payload: any = job.payload;
      let emailContent: { subject: string; html: string } | null = null;

      try {
        if (job.type === NotificationType.BOOKING_CONFIRMATION) {
          emailContent = bookingConfirmationTemplate({
            patientName: payload.patientName || payload.recipientName || job.user.fullName,
            doctorName: payload.doctorName,
            specialisation: payload.specialisation || 'General Practice',
            startAt: new Date(payload.startAt),
          });
        } else if (job.type === NotificationType.CANCELLATION) {
          emailContent = cancellationTemplate({
            recipientName: payload.recipientName || job.user.fullName,
            doctorName: payload.doctorName,
            startAt: new Date(payload.startAt),
            reason: payload.reason,
          });
        } else if (job.type === NotificationType.LEAVE_CONFLICT) {
          emailContent = leaveConflictTemplate({
            patientName: payload.patientName || job.user.fullName,
            doctorName: payload.doctorName,
            startAt: new Date(payload.startAt),
          });
        } else if (job.type === NotificationType.REMINDER) {
          emailContent = {
            subject: 'Healthcare Portal Notification',
            html: `<div style="font-family: sans-serif; padding: 20px;">
              <h2>Notification</h2>
              <p>Dear ${payload.patientName || job.user.fullName},</p>
              <p>${payload.message || 'You have an update in your healthcare portal.'}</p>
            </div>`,
          };
        }

        if (emailContent) {
          await emailProvider.sendEmail({
            to: job.user.email,
            subject: emailContent.subject,
            html: emailContent.html,
          });

          await updateNotificationJobStatus(job.id, NotificationStatus.SENT, job.attemptCount + 1);
          succeeded++;
        }
      } catch (err: any) {
        console.error(`[NotificationService]: Failed job ${job.id}:`, err?.message);
        const newCount = job.attemptCount + 1;
        const newStatus = newCount >= 5 ? NotificationStatus.FAILED : NotificationStatus.FAILED;
        await updateNotificationJobStatus(job.id, newStatus, newCount);
        failed++;
      }
    }

    return { processed: jobs.length, succeeded, failed };
  }
}

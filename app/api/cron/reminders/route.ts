import { withErrorHandling, successResponse } from '@/lib/errors/withErrorHandling';
import { ReminderService } from '@/services/reminderService';
import { deleteExpiredHoldAppointments } from '@/repositories/appointmentRepository';
import { AuthenticationError } from '@/lib/errors/AppError';

function verifyCronSecret(req: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return; // Allow if not configured in dev

  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${cronSecret}` && req.headers.get('x-cron-secret') !== cronSecret) {
    throw new AuthenticationError('Invalid Cron secret authentication');
  }
}

export const GET = withErrorHandling(async (req: Request) => {
  verifyCronSecret(req);

  // Clean up expired slot holds
  await deleteExpiredHoldAppointments().catch((err) => console.error('Failed to clean hold appointments:', err));

  const result = await ReminderService.processDueReminders();
  return successResponse(result);
});

export const POST = GET;

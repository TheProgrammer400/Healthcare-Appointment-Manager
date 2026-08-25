import { withErrorHandling, successResponse } from '@/lib/errors/withErrorHandling';
import { NotificationService } from '@/services/notificationService';
import { AuthenticationError } from '@/lib/errors/AppError';

function verifyCronSecret(req: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return;

  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${cronSecret}` && req.headers.get('x-cron-secret') !== cronSecret) {
    throw new AuthenticationError('Invalid Cron secret authentication');
  }
}

export const GET = withErrorHandling(async (req: Request) => {
  verifyCronSecret(req);

  const result = await NotificationService.processPendingJobs();
  return successResponse(result);
});

export const POST = GET;

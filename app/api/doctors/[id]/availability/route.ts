import { withErrorHandling, successResponse } from '@/lib/errors/withErrorHandling';
import { AvailabilityService } from '@/services/availabilityService';
import { ValidationError } from '@/lib/errors/AppError';

export const GET = withErrorHandling(async (req: Request, { params }: { params: { id: string } }) => {
  const { searchParams } = new URL(req.url);
  const dateStr = searchParams.get('date');

  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    throw new ValidationError('Query parameter "date" is required in YYYY-MM-DD format');
  }

  const slots = await AvailabilityService.getAvailableSlotsForDoctor(params.id, dateStr);
  return successResponse({ slots });
});

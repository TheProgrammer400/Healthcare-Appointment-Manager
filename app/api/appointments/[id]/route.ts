import { withErrorHandling, successResponse } from '@/lib/errors/withErrorHandling';
import { AppointmentService } from '@/services/appointmentService';
import { requireAuth } from '@/lib/auth/guard';

export const GET = withErrorHandling(async (req: Request, { params }: { params: { id: string } }) => {
  const session = await requireAuth();

  const appointment = await AppointmentService.getAppointmentById(
    params.id,
    session.user.id,
    session.user.role
  );

  return successResponse({ appointment });
});

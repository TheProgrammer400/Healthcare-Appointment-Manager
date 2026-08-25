import { withErrorHandling, successResponse } from '@/lib/errors/withErrorHandling';
import { AppointmentService } from '@/services/appointmentService';
import { rescheduleAppointmentSchema } from '@/lib/validation';
import { requireAuth, verifyCsrfOrigin } from '@/lib/auth/guard';

export const POST = withErrorHandling(async (req: Request, { params }: { params: { id: string } }) => {
  verifyCsrfOrigin(req);
  const session = await requireAuth();

  const body = await req.json();
  const input = rescheduleAppointmentSchema.parse(body);

  const result = await AppointmentService.rescheduleAppointment(
    params.id,
    new Date(input.newStartAt),
    session.user.id,
    session.user.role
  );

  return successResponse(result);
});

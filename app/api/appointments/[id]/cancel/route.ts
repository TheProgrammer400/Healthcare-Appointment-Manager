import { withErrorHandling, successResponse } from '@/lib/errors/withErrorHandling';
import { AppointmentService } from '@/services/appointmentService';
import { requireAuth, verifyCsrfOrigin } from '@/lib/auth/guard';

export const POST = withErrorHandling(async (req: Request, { params }: { params: { id: string } }) => {
  verifyCsrfOrigin(req);
  const session = await requireAuth();

  let reason: string | undefined = undefined;
  try {
    const body = await req.json();
    reason = body.reason;
  } catch (err) {
    // Body optional for cancellation
  }

  const updated = await AppointmentService.cancelAppointment(
    params.id,
    session.user.id,
    session.user.role,
    reason
  );

  return successResponse({ appointment: updated });
});

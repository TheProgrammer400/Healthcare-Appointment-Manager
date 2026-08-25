import { withErrorHandling, successResponse } from '@/lib/errors/withErrorHandling';
import { AppointmentService } from '@/services/appointmentService';
import { createLeaveSchema } from '@/lib/validation';
import { requireAuth, requireRole, verifyCsrfOrigin } from '@/lib/auth/guard';
import { UserRole } from '@prisma/client';
import { AuthorizationError } from '@/lib/errors/AppError';

export const POST = withErrorHandling(async (req: Request, { params }: { params: { id: string } }) => {
  verifyCsrfOrigin(req);
  const session = await requireAuth();
  requireRole(session, [UserRole.ADMIN, UserRole.DOCTOR]);

  if (session.user.role === UserRole.DOCTOR && session.user.doctorProfileId !== params.id) {
    throw new AuthorizationError('You can only record leave for your own doctor profile');
  }

  const body = await req.json();
  const input = createLeaveSchema.parse(body);

  const result = await AppointmentService.markDoctorLeave(params.id, input.leaveDate, input.reason);
  return successResponse(result, 201);
});

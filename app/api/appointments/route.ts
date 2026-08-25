import { withErrorHandling, successResponse } from '@/lib/errors/withErrorHandling';
import { AppointmentService } from '@/services/appointmentService';
import { bookAppointmentSchema } from '@/lib/validation';
import { requireAuth, requireRole, verifyCsrfOrigin } from '@/lib/auth/guard';
import { UserRole } from '@prisma/client';
import { NotFoundError } from '@/lib/errors/AppError';

export const POST = withErrorHandling(async (req: Request) => {
  verifyCsrfOrigin(req);
  const session = await requireAuth();
  requireRole(session, [UserRole.PATIENT]);

  if (!session.user.patientProfileId) {
    throw new NotFoundError('Patient profile not found for this user account');
  }

  const idempotencyKey = req.headers.get('idempotency-key') || undefined;
  const body = await req.json();
  const input = bookAppointmentSchema.parse(body);

  const appointment = await AppointmentService.holdAppointment({
    patientProfileId: session.user.patientProfileId,
    doctorId: input.doctorId,
    startAt: new Date(input.startAt),
    idempotencyKey,
  });

  return successResponse({ appointment }, 201);
});

export const GET = withErrorHandling(async (req: Request) => {
  const session = await requireAuth();
  const { searchParams } = new URL(req.url);

  const status = (searchParams.get('status') as any) || undefined;
  const page = Number(searchParams.get('page')) || 1;
  const pageSize = Number(searchParams.get('pageSize')) || 20;

  const result = await AppointmentService.getUserAppointments(session.user.id, session.user.role, {
    status,
    page,
    pageSize,
  });

  return successResponse(result);
});

import { withErrorHandling, successResponse } from '@/lib/errors/withErrorHandling';
import { DoctorService } from '@/services/doctorService';
import { updateDoctorSchema } from '@/lib/validation';
import { requireAuth, requireRole, verifyCsrfOrigin } from '@/lib/auth/guard';
import { UserRole } from '@prisma/client';

export const GET = withErrorHandling(async (req: Request, { params }: { params: { id: string } }) => {
  const doctor = await DoctorService.getDoctorById(params.id);
  return successResponse(doctor);
});

export const PATCH = withErrorHandling(async (req: Request, { params }: { params: { id: string } }) => {
  verifyCsrfOrigin(req);
  const session = await requireAuth();
  requireRole(session, [UserRole.ADMIN, UserRole.DOCTOR]);

  // If DOCTOR role, verify doctor owns this profile
  if (session.user.role === UserRole.DOCTOR && session.user.doctorProfileId !== params.id) {
    throw new Error('Not authorized to update this doctor profile');
  }

  const body = await req.json();
  const input = updateDoctorSchema.parse(body);

  const updated = await DoctorService.updateDoctor(params.id, input);
  return successResponse(updated);
});

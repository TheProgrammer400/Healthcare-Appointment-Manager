import { withErrorHandling, successResponse } from '@/lib/errors/withErrorHandling';
import { DoctorService } from '@/services/doctorService';
import { createDoctorSchema } from '@/lib/validation';
import { requireAuth, requireRole, verifyCsrfOrigin } from '@/lib/auth/guard';
import { UserRole } from '@prisma/client';

export const GET = withErrorHandling(async (req: Request) => {
  const { searchParams } = new URL(req.url);
  const specialisation = searchParams.get('specialisation') || undefined;
  const page = Number(searchParams.get('page')) || 1;
  const pageSize = Number(searchParams.get('pageSize')) || 20;

  const result = await DoctorService.searchDoctors({ specialisation, page, pageSize });
  return successResponse(result);
});

export const POST = withErrorHandling(async (req: Request) => {
  verifyCsrfOrigin(req);
  const session = await requireAuth();
  requireRole(session, [UserRole.ADMIN]);

  const body = await req.json();
  const input = createDoctorSchema.parse(body);

  const doctor = await DoctorService.createDoctor(input);
  return successResponse(doctor, 201);
});

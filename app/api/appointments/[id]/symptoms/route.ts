import { withErrorHandling, successResponse } from '@/lib/errors/withErrorHandling';
import { SymptomService } from '@/services/symptomService';
import { submitSymptomsSchema } from '@/lib/validation';
import { requireAuth, requireRole, verifyCsrfOrigin } from '@/lib/auth/guard';
import { UserRole } from '@prisma/client';

export const POST = withErrorHandling(async (req: Request, { params }: { params: { id: string } }) => {
  verifyCsrfOrigin(req);
  const session = await requireAuth();
  requireRole(session, [UserRole.PATIENT]);

  const body = await req.json();
  const input = submitSymptomsSchema.parse(body);

  const result = await SymptomService.submitSymptomsAndConfirm({
    appointmentId: params.id,
    symptoms: input.symptoms,
    patientUserId: session.user.id,
  });

  return successResponse(result);
});

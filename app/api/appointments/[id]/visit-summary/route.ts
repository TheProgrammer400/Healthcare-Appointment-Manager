import { withErrorHandling, successResponse } from '@/lib/errors/withErrorHandling';
import { VisitSummaryService } from '@/services/visitSummaryService';
import { submitVisitSummarySchema } from '@/lib/validation';
import { requireAuth, requireRole, verifyCsrfOrigin } from '@/lib/auth/guard';
import { UserRole } from '@prisma/client';

export const POST = withErrorHandling(async (req: Request, { params }: { params: { id: string } }) => {
  verifyCsrfOrigin(req);
  const session = await requireAuth();
  requireRole(session, [UserRole.DOCTOR]);

  const body = await req.json();
  const input = submitVisitSummarySchema.parse(body);

  const result = await VisitSummaryService.submitVisitSummary({
    appointmentId: params.id,
    doctorNotes: input.doctorNotes,
    prescription: input.prescription,
    doctorUserId: session.user.id,
  });

  return successResponse(result);
});

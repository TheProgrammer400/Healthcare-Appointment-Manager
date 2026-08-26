import { withErrorHandling, successResponse } from '@/lib/errors/withErrorHandling';
import { requireAuth, requireRole } from '@/lib/auth/guard';
import { UserRole } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';

export const GET = withErrorHandling(async () => {
  const session = await requireAuth();
  requireRole(session, [UserRole.ADMIN]);

  const requests = await prisma.credentialChangeRequest.findMany({
    where: { status: 'PENDING' },
    orderBy: { createdAt: 'desc' },
  });

  // Attach user details
  const enrichedRequests = await Promise.all(
    requests.map(async (reqItem) => {
      const user = await prisma.user.findUnique({
        where: { id: reqItem.userId },
        select: { fullName: true, email: true, phone: true },
      });

      return {
        ...reqItem,
        doctorName: user?.fullName || 'Unknown Doctor',
      };
    })
  );

  return successResponse({ requests: enrichedRequests });
});

export const POST = withErrorHandling(async (req: Request) => {
  const session = await requireAuth();
  requireRole(session, [UserRole.ADMIN]);

  const body = await req.json();
  const { requestId, action } = body;

  if (!requestId || !['APPROVE', 'REJECT'].includes(action)) {
    throw new Error('Valid requestId and action (APPROVE or REJECT) are required');
  }

  const changeRequest = await prisma.credentialChangeRequest.findUnique({
    where: { id: requestId },
  });

  if (!changeRequest || changeRequest.status !== 'PENDING') {
    throw new Error('Pending change request not found');
  }

  if (action === 'APPROVE') {
    const updateData: { email?: string; phone?: string } = {};

    if (changeRequest.requestedEmail && changeRequest.requestedEmail !== changeRequest.currentEmail) {
      // Check email uniqueness
      const existing = await prisma.user.findUnique({ where: { email: changeRequest.requestedEmail } });
      if (existing && existing.id !== changeRequest.userId) {
        throw new Error(`Email ${changeRequest.requestedEmail} is already in use by another account`);
      }
      updateData.email = changeRequest.requestedEmail;
    }

    if (changeRequest.requestedPhone && changeRequest.requestedPhone !== changeRequest.currentPhone) {
      updateData.phone = changeRequest.requestedPhone;
    }

    if (Object.keys(updateData).length > 0) {
      await prisma.user.update({
        where: { id: changeRequest.userId },
        data: updateData,
      });
    }

    await prisma.credentialChangeRequest.update({
      where: { id: requestId },
      data: { status: 'APPROVED' },
    });

    return successResponse({ message: 'Credential change request approved and doctor credentials updated.' });
  } else {
    await prisma.credentialChangeRequest.update({
      where: { id: requestId },
      data: { status: 'REJECTED' },
    });

    return successResponse({ message: 'Credential change request rejected.' });
  }
});

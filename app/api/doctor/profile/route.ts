import { withErrorHandling, successResponse } from '@/lib/errors/withErrorHandling';
import { requireAuth, requireRole } from '@/lib/auth/guard';
import { UserRole } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import { updateDoctorProfileSchema } from '@/lib/validation';

export const GET = withErrorHandling(async () => {
  const session = await requireAuth();
  requireRole(session, [UserRole.DOCTOR]);

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { doctorProfile: true },
  });

  if (!user || !user.doctorProfile) {
    throw new Error('Doctor profile not found');
  }

  // Fetch active pending credential change request if any
  const pendingRequest = await prisma.credentialChangeRequest.findFirst({
    where: {
      userId: session.user.id,
      status: 'PENDING',
    },
    orderBy: { createdAt: 'desc' },
  });

  return successResponse({
    profile: {
      userId: user.id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone || '',
      specialisation: user.doctorProfile.specialisation,
      age: user.doctorProfile.age || null,
      address: user.doctorProfile.address || '',
      bio: user.doctorProfile.bio || '',
    },
    pendingCredentialRequest: pendingRequest
      ? {
          id: pendingRequest.id,
          requestedEmail: pendingRequest.requestedEmail,
          requestedPhone: pendingRequest.requestedPhone,
          reason: pendingRequest.reason,
          createdAt: pendingRequest.createdAt,
        }
      : null,
  });
});

export const PUT = withErrorHandling(async (req: Request) => {
  const session = await requireAuth();
  requireRole(session, [UserRole.DOCTOR]);

  const body = await req.json();
  const input = updateDoctorProfileSchema.parse(body);

  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { doctorProfile: true },
  });

  if (!currentUser || !currentUser.doctorProfile) {
    throw new Error('Doctor profile not found');
  }

  // 1. Update non-restricted profile fields directly
  const ageNum = typeof input.age === 'number' ? input.age : input.age ? parseInt(String(input.age), 10) : null;

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      fullName: input.fullName,
    },
  });

  await prisma.doctorProfile.update({
    where: { userId: session.user.id },
    data: {
      specialisation: input.specialisation,
      age: isNaN(Number(ageNum)) ? null : ageNum,
      address: input.address || null,
      bio: input.bio || null,
    },
  });

  // 2. Check for restricted credential changes (Email or Phone/Mobile)
  const isEmailChanged = input.requestedEmail && input.requestedEmail.toLowerCase().trim() !== currentUser.email.toLowerCase().trim();
  const isPhoneChanged = input.requestedPhone !== undefined && input.requestedPhone !== null && input.requestedPhone.trim() !== (currentUser.phone || '').trim();

  let credentialRequest = null;

  if (isEmailChanged || isPhoneChanged) {
    credentialRequest = await prisma.credentialChangeRequest.create({
      data: {
        userId: session.user.id,
        currentEmail: currentUser.email,
        requestedEmail: isEmailChanged ? input.requestedEmail?.toLowerCase().trim() : currentUser.email,
        currentPhone: currentUser.phone || '',
        requestedPhone: isPhoneChanged ? input.requestedPhone?.trim() : currentUser.phone || '',
        reason: input.requestReason || 'Doctor profile credential change request',
        status: 'PENDING',
      },
    });
  }

  return successResponse({
    message: isEmailChanged || isPhoneChanged
      ? 'Profile updated. A credential change request for Email/Mobile has been submitted to Admin for approval.'
      : 'Doctor profile updated successfully.',
    credentialRequestSubmitted: Boolean(credentialRequest),
  });
});

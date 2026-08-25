import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../../lib/db/prisma';
import { AppointmentService } from '../../services/appointmentService';
import { UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

describe('Appointment Concurrency & Double-Booking Prevention', () => {
  let doctorId: string;
  let patient1Id: string;
  let patient2Id: string;
  let patient3Id: string;
  const targetSlot = new Date(Date.UTC(2026, 11, 20, 10, 0, 0));

  beforeAll(async () => {
    // Setup test doctor and test patients
    const hash = await bcrypt.hash('TestPassword123!', 10);

    const docUser = await prisma.user.create({
      data: {
        email: `doc.test.${Date.now()}@clinic.com`,
        passwordHash: hash,
        fullName: 'Dr. Test Concurrency',
        role: UserRole.DOCTOR,
        doctorProfile: {
          create: {
            specialisation: 'Cardiology',
            slotDurationMinutes: 30,
          },
        },
      },
      include: { doctorProfile: true },
    });
    doctorId = docUser.doctorProfile!.id;

    const p1 = await prisma.user.create({
      data: {
        email: `patient1.${Date.now()}@clinic.com`,
        passwordHash: hash,
        fullName: 'Patient One',
        role: UserRole.PATIENT,
        patientProfile: { create: {} },
      },
      include: { patientProfile: true },
    });
    patient1Id = p1.patientProfile!.id;

    const p2 = await prisma.user.create({
      data: {
        email: `patient2.${Date.now()}@clinic.com`,
        passwordHash: hash,
        fullName: 'Patient Two',
        role: UserRole.PATIENT,
        patientProfile: { create: {} },
      },
      include: { patientProfile: true },
    });
    patient2Id = p2.patientProfile!.id;

    const p3 = await prisma.user.create({
      data: {
        email: `patient3.${Date.now()}@clinic.com`,
        passwordHash: hash,
        fullName: 'Patient Three',
        role: UserRole.PATIENT,
        patientProfile: { create: {} },
      },
      include: { patientProfile: true },
    });
    patient3Id = p3.patientProfile!.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should allow EXACTLY 1 booking to succeed and reject concurrent attempts with 409 APPOINTMENT_CONFLICT', async () => {
    const concurrentRequests = [
      AppointmentService.holdAppointment({
        patientProfileId: patient1Id,
        doctorId,
        startAt: targetSlot,
      }),
      AppointmentService.holdAppointment({
        patientProfileId: patient2Id,
        doctorId,
        startAt: targetSlot,
      }),
      AppointmentService.holdAppointment({
        patientProfileId: patient3Id,
        doctorId,
        startAt: targetSlot,
      }),
    ];

    const results = await Promise.allSettled(concurrentRequests);

    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');

    expect(fulfilled.length).toBe(1);
    expect(rejected.length).toBe(2);

    // Verify rejection reason code is 409 / APPOINTMENT_CONFLICT
    rejected.forEach((rej: any) => {
      expect(rej.reason.code).toBe('APPOINTMENT_CONFLICT');
      expect(rej.reason.statusCode).toBe(409);
    });
  });
});

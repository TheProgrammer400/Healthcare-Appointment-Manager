import { prisma } from '@/lib/db/prisma';
import {
  findAppointmentById,
  insertHoldAppointment,
  updateAppointmentStatus,
  listAppointments,
  findIdempotencyKey,
  createIdempotencyKey,
  findAppointmentsByDoctorDateAndStatus,
} from '@/repositories/appointmentRepository';
import { findDoctorById } from '@/repositories/doctorRepository';
import { findLeaveDay, createLeaveDay } from '@/repositories/leaveRepository';
import { createNotificationJob } from '@/repositories/notificationJobRepository';
import { createAuditLog } from '@/repositories/auditLogRepository';
import { addMinutes, formatIsoDateOnly, parseDateOnly } from '@/lib/utils/time';
import {
  ConflictError,
  NotFoundError,
  AuthorizationError,
  ValidationError,
} from '@/lib/errors/AppError';
import { AppointmentStatus, NotificationType, UserRole } from '@prisma/client';
import { CalendarService } from '@/lib/calendar/calendarService';

const HOLD_DURATION_MINUTES = 5;

export class AppointmentService {
  static async holdAppointment(params: {
    patientProfileId: string;
    doctorId: string;
    startAt: Date;
    idempotencyKey?: string;
  }) {
    const { patientProfileId, doctorId, startAt, idempotencyKey } = params;

    // 1. Check idempotency key if provided
    if (idempotencyKey) {
      const existingKey = await findIdempotencyKey(idempotencyKey);
      if (existingKey) {
        const existingAppt = await findAppointmentById(existingKey.appointmentId);
        if (existingAppt) {
          return existingAppt;
        }
      }
    }

    // 2. Fetch doctor profile
    const doctor = await findDoctorById(doctorId);
    if (!doctor) {
      throw new NotFoundError('Doctor profile not found');
    }

    // 3. Verify doctor is not on leave for target date
    const targetDate = parseDateOnly(formatIsoDateOnly(startAt));
    const leaveDay = await findLeaveDay(doctorId, targetDate);
    if (leaveDay) {
      throw new ConflictError('Doctor is on leave on the selected date', 'DOCTOR_ON_LEAVE');
    }

    const endAt = addMinutes(startAt, doctor.slotDurationMinutes);
    const holdExpiresAt = addMinutes(new Date(), HOLD_DURATION_MINUTES);

    // 4. Perform atomic insert inside Prisma transaction
    try {
      return await prisma.$transaction(async (tx) => {
        const appointment = await insertHoldAppointment(
          {
            patientId: patientProfileId,
            doctorId,
            startAt,
            endAt,
            holdExpiresAt,
          },
          tx
        );

        if (idempotencyKey) {
          await createIdempotencyKey(idempotencyKey, appointment.id, tx);
        }

        return appointment;
      });
    } catch (err: any) {
      // Postgres error code 23505 = unique_violation (partial unique index uq_doctor_slot_active)
      if (err?.code === 'P2002' || err?.message?.includes('23505') || err?.message?.includes('uq_doctor_slot_active')) {
        throw new ConflictError('The selected appointment slot is no longer available.', 'APPOINTMENT_CONFLICT');
      }
      throw err;
    }
  }

  static async getAppointmentById(id: string, callerUserId: string, callerRole: UserRole) {
    const appointment = await findAppointmentById(id);
    if (!appointment) {
      throw new NotFoundError('Appointment not found');
    }

    // Authorization check
    if (callerRole === UserRole.PATIENT) {
      if (appointment.patient.user.id !== callerUserId) {
        throw new AuthorizationError('You are not authorized to view this appointment');
      }
      // Field-level data protection: Redact raw doctor_notes for Patient caller (§17)
      if (appointment.visitSummary) {
        return {
          ...appointment,
          visitSummary: {
            ...appointment.visitSummary,
            doctorNotes: undefined, // Omit raw clinical notes
          },
        };
      }
    } else if (callerRole === UserRole.DOCTOR) {
      if (appointment.doctor.user.id !== callerUserId) {
        throw new AuthorizationError('You are not authorized to view this appointment');
      }
      // Audit log viewing of sensitive healthcare record
      await createAuditLog({
        actorUserId: callerUserId,
        action: 'VISIT_SUMMARY_VIEWED',
        targetType: 'appointment',
        targetId: appointment.id,
      });
    }

    return appointment;
  }

  static async cancelAppointment(id: string, callerUserId: string, callerRole: UserRole, reason?: string) {
    const appointment = await findAppointmentById(id);
    if (!appointment) {
      throw new NotFoundError('Appointment not found');
    }

    // Ownership / role validation
    if (callerRole === UserRole.PATIENT && appointment.patient.user.id !== callerUserId) {
      throw new AuthorizationError('Not authorized to cancel this appointment');
    }
    if (callerRole === UserRole.DOCTOR && appointment.doctor.user.id !== callerUserId) {
      throw new AuthorizationError('Not authorized to cancel this appointment');
    }

    if (appointment.status === AppointmentStatus.CANCELLED || appointment.status === AppointmentStatus.COMPLETED) {
      throw new ValidationError(`Appointment cannot be cancelled from current status '${appointment.status}'`);
    }

    return prisma.$transaction(async (tx) => {
      const updated = await updateAppointmentStatus(id, AppointmentStatus.CANCELLED, reason || 'Cancelled by user', tx);

      // Enqueue notification jobs for both patient and doctor
      await createNotificationJob(
        {
          userId: appointment.patient.user.id,
          appointmentId: id,
          type: NotificationType.CANCELLATION,
          payload: {
            recipientName: appointment.patient.user.fullName,
            doctorName: appointment.doctor.user.fullName,
            startAt: appointment.startAt,
            reason,
          },
        },
        tx
      );

      await createNotificationJob(
        {
          userId: appointment.doctor.user.id,
          appointmentId: id,
          type: NotificationType.CANCELLATION,
          payload: {
            recipientName: appointment.doctor.user.fullName,
            doctorName: appointment.doctor.user.fullName,
            startAt: appointment.startAt,
            reason,
          },
        },
        tx
      );

      // Calendar sync deletion attempt
      CalendarService.deleteEvent(appointment.patient.user.id, id).catch(() => {});
      CalendarService.deleteEvent(appointment.doctor.user.id, id).catch(() => {});

      return updated;
    });
  }

  static async rescheduleAppointment(id: string, newStartAt: Date, callerUserId: string, callerRole: UserRole) {
    const oldAppt = await findAppointmentById(id);
    if (!oldAppt) {
      throw new NotFoundError('Appointment not found');
    }

    if (callerRole === UserRole.PATIENT && oldAppt.patient.user.id !== callerUserId) {
      throw new AuthorizationError('Not authorized to reschedule this appointment');
    }
    if (callerRole === UserRole.DOCTOR && oldAppt.doctor.user.id !== callerUserId) {
      throw new AuthorizationError('Not authorized to reschedule this appointment');
    }

    if (oldAppt.status !== AppointmentStatus.CONFIRMED && oldAppt.status !== AppointmentStatus.PENDING) {
      throw new ValidationError(`Cannot reschedule an appointment in '${oldAppt.status}' status`);
    }

    const doctor = await findDoctorById(oldAppt.doctorId);
    if (!doctor) {
      throw new NotFoundError('Doctor not found');
    }

    const newEndAt = addMinutes(newStartAt, doctor.slotDurationMinutes);

    try {
      return await prisma.$transaction(async (tx) => {
        // Mark old appointment as RESCHEDULED
        await updateAppointmentStatus(id, AppointmentStatus.RESCHEDULED, 'Rescheduled to new slot', tx);

        // Create new CONFIRMED appointment
        const newAppt = await tx.appointment.create({
          data: {
            patientId: oldAppt.patientId,
            doctorId: oldAppt.doctorId,
            startAt: newStartAt,
            endAt: newEndAt,
            status: AppointmentStatus.CONFIRMED,
          },
        });

        // Enqueue notifications
        await createNotificationJob(
          {
            userId: oldAppt.patient.user.id,
            appointmentId: newAppt.id,
            type: NotificationType.BOOKING_CONFIRMATION,
            payload: {
              patientName: oldAppt.patient.user.fullName,
              doctorName: oldAppt.doctor.user.fullName,
              specialisation: doctor.specialisation,
              startAt: newStartAt,
              isReschedule: true,
            },
          },
          tx
        );

        return { oldAppointmentId: id, newAppointment: newAppt };
      });
    } catch (err: any) {
      if (err?.code === 'P2002' || err?.message?.includes('23505') || err?.message?.includes('uq_doctor_slot_active')) {
        throw new ConflictError('The newly requested slot is no longer available.', 'APPOINTMENT_CONFLICT');
      }
      throw err;
    }
  }

  static async markDoctorLeave(doctorId: string, leaveDateStr: string, reason?: string) {
    const leaveDate = parseDateOnly(leaveDateStr);
    const existingLeave = await findLeaveDay(doctorId, leaveDate);
    if (existingLeave) {
      throw new ConflictError('Doctor is already registered on leave for this date', 'LEAVE_ALREADY_EXISTS');
    }

    const nextDay = new Date(leaveDate.getTime() + 24 * 60 * 60 * 1000);

    return prisma.$transaction(async (tx) => {
      // 1. Record leave day
      const leave = await createLeaveDay(doctorId, leaveDate, reason, tx);

      // 2. Query conflicting PENDING/CONFIRMED/HOLD appointments on that date
      const conflicting = await findAppointmentsByDoctorDateAndStatus(
        doctorId,
        leaveDate,
        nextDay,
        [AppointmentStatus.HOLD, AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED],
        tx
      );

      const affectedIds: string[] = [];

      for (const appt of conflicting) {
        affectedIds.push(appt.id);
        await updateAppointmentStatus(appt.id, AppointmentStatus.CANCELLED, 'DOCTOR_LEAVE', tx);

        // Enqueue LEAVE_CONFLICT notification for affected patient
        await createNotificationJob(
          {
            userId: appt.patient.user.id,
            appointmentId: appt.id,
            type: NotificationType.LEAVE_CONFLICT,
            payload: {
              patientName: appt.patient.user.fullName,
              doctorName: appt.doctor.user.fullName,
              startAt: appt.startAt,
              reason: reason || 'Doctor on leave',
            },
          },
          tx
        );
      }

      return { leaveDay: leave, affectedAppointments: affectedIds };
    });
  }

  static async getUserAppointments(
    callerUserId: string,
    callerRole: UserRole,
    params: { status?: AppointmentStatus; from?: Date; to?: Date; page?: number; pageSize?: number }
  ) {
    if (callerRole === UserRole.PATIENT) {
      const user = await prisma.user.findUnique({
        where: { id: callerUserId },
        include: { patientProfile: true },
      });
      if (!user?.patientProfile) throw new NotFoundError('Patient profile not found');
      return listAppointments({ ...params, patientId: user.patientProfile.id });
    }

    if (callerRole === UserRole.DOCTOR) {
      const user = await prisma.user.findUnique({
        where: { id: callerUserId },
        include: { doctorProfile: true },
      });
      if (!user?.doctorProfile) throw new NotFoundError('Doctor profile not found');
      return listAppointments({ ...params, doctorId: user.doctorProfile.id });
    }

    // Admin sees all
    return listAppointments(params);
  }
}

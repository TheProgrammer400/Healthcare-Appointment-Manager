import { prisma } from '@/lib/db/prisma';
import { Prisma, Appointment, AppointmentStatus } from '@prisma/client';

export type TransactionClient = Prisma.TransactionClient;

export async function findAppointmentById(id: string, tx: TransactionClient = prisma) {
  return tx.appointment.findUnique({
    where: { id },
    include: {
      patient: { include: { user: { select: { id: true, email: true, fullName: true, phone: true } } } },
      doctor: { include: { user: { select: { id: true, email: true, fullName: true, phone: true } } } },
      symptomForm: true,
      visitSummary: true,
      calendarEvents: true,
    },
  });
}

export async function findActiveAppointmentsForDoctor(
  doctorId: string,
  startWindow: Date,
  endWindow: Date,
  tx: TransactionClient = prisma
) {
  return tx.appointment.findMany({
    where: {
      doctorId,
      status: { in: [AppointmentStatus.HOLD, AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED] },
      startAt: { gte: startWindow, lt: endWindow },
    },
    select: {
      id: true,
      startAt: true,
      endAt: true,
      status: true,
      holdExpiresAt: true,
    },
  });
}

export async function insertHoldAppointment(
  data: {
    patientId: string;
    doctorId: string;
    startAt: Date;
    endAt: Date;
    holdExpiresAt: Date;
  },
  tx: TransactionClient = prisma
): Promise<Appointment> {
  return tx.appointment.create({
    data: {
      patientId: data.patientId,
      doctorId: data.doctorId,
      startAt: data.startAt,
      endAt: data.endAt,
      status: AppointmentStatus.HOLD,
      holdExpiresAt: data.holdExpiresAt,
    },
  });
}

export async function updateAppointmentStatus(
  id: string,
  status: AppointmentStatus,
  cancelledReason?: string,
  tx: TransactionClient = prisma
) {
  return tx.appointment.update({
    where: { id },
    data: {
      status,
      cancelledReason,
      holdExpiresAt: status === AppointmentStatus.HOLD ? undefined : null,
    },
  });
}

export async function listAppointments(
  filter: {
    patientId?: string;
    doctorId?: string;
    status?: AppointmentStatus;
    from?: Date;
    to?: Date;
    page?: number;
    pageSize?: number;
  },
  tx: TransactionClient = prisma
) {
  const page = filter.page || 1;
  const pageSize = Math.min(filter.pageSize || 20, 50);
  const skip = (page - 1) * pageSize;

  const where: Prisma.AppointmentWhereInput = {
    patientId: filter.patientId,
    doctorId: filter.doctorId,
    status: filter.status,
    startAt: {
      gte: filter.from,
      lte: filter.to,
    },
  };

  const [appointments, total] = await Promise.all([
    tx.appointment.findMany({
      where,
      skip,
      take: pageSize,
      include: {
        patient: { include: { user: { select: { id: true, email: true, fullName: true } } } },
        doctor: { select: { id: true, specialisation: true, user: { select: { id: true, email: true, fullName: true } } } },
        symptomForm: true,
        visitSummary: true,
      },
      orderBy: { startAt: 'desc' },
    }),
    tx.appointment.count({ where }),
  ]);

  return { appointments, total, page, pageSize };
}

export async function findAppointmentsByDoctorDateAndStatus(
  doctorId: string,
  dateStart: Date,
  dateEnd: Date,
  statuses: AppointmentStatus[],
  tx: TransactionClient = prisma
) {
  return tx.appointment.findMany({
    where: {
      doctorId,
      startAt: { gte: dateStart, lt: dateEnd },
      status: { in: statuses },
    },
    include: {
      patient: { include: { user: true } },
      doctor: { include: { user: true } },
    },
  });
}

export async function findIdempotencyKey(key: string, tx: TransactionClient = prisma) {
  return tx.idempotencyKey.findUnique({
    where: { key },
  });
}

export async function createIdempotencyKey(key: string, appointmentId: string, tx: TransactionClient = prisma) {
  return tx.idempotencyKey.create({
    data: {
      key,
      appointmentId,
    },
  });
}

export async function deleteExpiredHoldAppointments(now: Date = new Date(), tx: TransactionClient = prisma) {
  return tx.appointment.deleteMany({
    where: {
      status: AppointmentStatus.HOLD,
      holdExpiresAt: { lte: now },
    },
  });
}

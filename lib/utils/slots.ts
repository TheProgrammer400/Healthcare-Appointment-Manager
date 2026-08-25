import { addMinutes } from './time';

export interface WorkingHoursConfig {
  startTime: string; // "09:00"
  endTime: string;   // "17:00"
}

export interface ExistingAppointmentSlot {
  startAt: Date;
  endAt: Date;
  status: string;
  holdExpiresAt?: Date | null;
}

export function generateCandidateSlots(
  targetDateStr: string, // YYYY-MM-DD
  workingHours: WorkingHoursConfig,
  slotDurationMinutes: number
): { startAt: Date; endAt: Date }[] {
  const slots: { startAt: Date; endAt: Date }[] = [];
  const [year, month, day] = targetDateStr.split('-').map(Number);
  const [startHour, startMin] = workingHours.startTime.split(':').map(Number);
  const [endHour, endMin] = workingHours.endTime.split(':').map(Number);

  const windowStart = new Date(Date.UTC(year, month - 1, day, startHour, startMin, 0));
  const windowEnd = new Date(Date.UTC(year, month - 1, day, endHour, endMin, 0));

  let currentStart = new Date(windowStart);
  while (currentStart.getTime() + slotDurationMinutes * 60 * 1000 <= windowEnd.getTime()) {
    const currentEnd = addMinutes(currentStart, slotDurationMinutes);
    slots.push({
      startAt: new Date(currentStart),
      endAt: currentEnd,
    });
    currentStart = currentEnd;
  }

  return slots;
}

export function filterAvailableSlots(
  candidateSlots: { startAt: Date; endAt: Date }[],
  existingAppointments: ExistingAppointmentSlot[],
  isLeaveDay: boolean,
  now: Date = new Date()
): { startAt: Date; endAt: Date }[] {
  if (isLeaveDay) {
    return [];
  }

  // Filter out slots that overlap with active non-expired bookings
  return candidateSlots.filter((slot) => {
    // 1. Must be in future relative to current time
    if (slot.startAt.getTime() <= now.getTime()) {
      return false;
    }

    // 2. Check collision with existing active appointments
    const hasConflict = existingAppointments.some((appt) => {
      // Check if HOLD expired
      if (appt.status === 'HOLD' && appt.holdExpiresAt && appt.holdExpiresAt.getTime() <= now.getTime()) {
        return false; // Expired hold does not block slot
      }

      // Check overlap: slotStart < apptEnd AND slotEnd > apptStart
      return slot.startAt.getTime() < appt.endAt.getTime() && slot.endAt.getTime() > appt.startAt.getTime();
    });

    return !hasConflict;
  });
}

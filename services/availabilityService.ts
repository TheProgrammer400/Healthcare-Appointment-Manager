import { findDoctorById } from '@/repositories/doctorRepository';
import { findWorkingHoursByDoctorAndDay } from '@/repositories/availabilityRepository';
import { findLeaveDay } from '@/repositories/leaveRepository';
import { findActiveAppointmentsForDoctor } from '@/repositories/appointmentRepository';
import { generateCandidateSlots, filterAvailableSlots } from '@/lib/utils/slots';
import { parseDateOnly } from '@/lib/utils/time';
import { NotFoundError } from '@/lib/errors/AppError';

export class AvailabilityService {
  static async getAvailableSlotsForDoctor(doctorId: string, targetDateStr: string): Promise<string[]> {
    const doctor = await findDoctorById(doctorId);
    if (!doctor) {
      throw new NotFoundError('Doctor not found');
    }

    const targetDate = parseDateOnly(targetDateStr);
    const dayOfWeek = targetDate.getUTCDay();

    // 1. Check if doctor is on leave on targetDate
    const leaveDay = await findLeaveDay(doctorId, targetDate);
    if (leaveDay) {
      return [];
    }

    // 2. Fetch working hours for that weekday
    const workingHours = await findWorkingHoursByDoctorAndDay(doctorId, dayOfWeek);
    if (!workingHours) {
      return []; // Doctor does not work on this weekday
    }

    // 3. Generate candidate slots
    const candidateSlots = generateCandidateSlots(
      targetDateStr,
      { startTime: workingHours.startTime, endTime: workingHours.endTime },
      doctor.slotDurationMinutes
    );

    if (candidateSlots.length === 0) {
      return [];
    }

    const startWindow = candidateSlots[0].startAt;
    const endWindow = candidateSlots[candidateSlots.length - 1].endAt;

    // 4. Fetch existing active appointments within this window
    const existingAppointments = await findActiveAppointmentsForDoctor(doctorId, startWindow, endWindow);

    // 5. Filter available slots
    const available = filterAvailableSlots(candidateSlots, existingAppointments, false);

    return available.map((s) => s.startAt.toISOString());
  }
}

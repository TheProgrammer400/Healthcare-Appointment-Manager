import { findUserByEmail, createUserWithDoctorProfile } from '@/repositories/userRepository';
import { listDoctors, findDoctorById, updateDoctorProfile } from '@/repositories/doctorRepository';
import { setWorkingHoursForDoctor } from '@/repositories/availabilityRepository';
import { hashPassword } from '@/lib/auth/password';
import { ConflictError, NotFoundError } from '@/lib/errors/AppError';
import { CreateDoctorInput, UpdateDoctorInput } from '@/lib/validation';

export class DoctorService {
  static async createDoctor(input: CreateDoctorInput) {
    const existing = await findUserByEmail(input.email);
    if (existing) {
      throw new ConflictError('An account with this email address already exists', 'EMAIL_TAKEN');
    }

    const passwordHash = await hashPassword(input.password);
    const defaultWorkingHours = input.workingHours || [
      { dayOfWeek: 1, startTime: '09:00', endTime: '17:00' },
      { dayOfWeek: 2, startTime: '09:00', endTime: '17:00' },
      { dayOfWeek: 3, startTime: '09:00', endTime: '17:00' },
      { dayOfWeek: 4, startTime: '09:00', endTime: '17:00' },
      { dayOfWeek: 5, startTime: '09:00', endTime: '17:00' },
    ];

    const user = await createUserWithDoctorProfile({
      email: input.email,
      passwordHash,
      fullName: input.fullName,
      specialisation: input.specialisation,
      slotDurationMinutes: input.slotDurationMinutes || 30,
      bio: input.bio,
      workingHours: defaultWorkingHours,
    });

    return user;
  }

  static async getDoctorById(id: string) {
    const doctor = await findDoctorById(id);
    if (!doctor) {
      throw new NotFoundError('Doctor profile not found');
    }
    return doctor;
  }

  static async searchDoctors(params: { specialisation?: string; page?: number; pageSize?: number }) {
    return listDoctors(params);
  }

  static async updateDoctor(id: string, input: UpdateDoctorInput) {
    const doctor = await findDoctorById(id);
    if (!doctor) {
      throw new NotFoundError('Doctor profile not found');
    }

    if (input.workingHours) {
      await setWorkingHoursForDoctor(id, input.workingHours);
    }

    return updateDoctorProfile(id, {
      specialisation: input.specialisation,
      slotDurationMinutes: input.slotDurationMinutes,
      bio: input.bio,
    });
  }
}

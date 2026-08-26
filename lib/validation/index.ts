import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  phone: z.string().optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const workingHourItemSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Format must be HH:mm'),
  endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Format must be HH:mm'),
}).refine((data) => data.endTime > data.startTime, {
  message: 'End time must be after start time',
  path: ['endTime'],
});

export type WorkingHourItemInput = z.infer<typeof workingHourItemSchema>;

export const createDoctorSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  specialisation: z.string().min(2, 'Specialisation is required'),
  slotDurationMinutes: z.union([
    z.literal(15),
    z.literal(30),
    z.literal(45),
    z.literal(60),
  ]).default(30),
  bio: z.string().optional(),
  workingHours: z.array(workingHourItemSchema).optional(),
});

export type CreateDoctorInput = z.infer<typeof createDoctorSchema>;

export const updateDoctorSchema = z.object({
  specialisation: z.string().min(2).optional(),
  slotDurationMinutes: z.union([
    z.literal(15),
    z.literal(30),
    z.literal(45),
    z.literal(60),
  ]).optional(),
  bio: z.string().optional(),
  workingHours: z.array(workingHourItemSchema).optional(),
});

export type UpdateDoctorInput = z.infer<typeof updateDoctorSchema>;

export const createLeaveSchema = z.object({
  leaveDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  reason: z.string().optional(),
});

export type CreateLeaveInput = z.infer<typeof createLeaveSchema>;

export const bookAppointmentSchema = z.object({
  doctorId: z.string().min(1, 'Doctor ID is required'),
  startAt: z.string().datetime({ message: 'startAt must be a valid ISO datetime string' }),
});

export type BookAppointmentInput = z.infer<typeof bookAppointmentSchema>;

export const submitSymptomsSchema = z.object({
  symptoms: z.string().min(5, 'Symptom description must be at least 5 characters').max(2000, 'Symptom description cannot exceed 2000 characters'),
});

export type SubmitSymptomsInput = z.infer<typeof submitSymptomsSchema>;

export const prescriptionItemSchema = z.object({
  medicine: z.string().min(1, 'Medicine name is required'),
  dosage: z.string().min(1, 'Dosage is required (e.g. 500mg)'),
  frequency: z.string().min(1, 'Frequency is required (e.g. twice daily)'),
  durationDays: z.number().int().positive('Duration must be at least 1 day'),
});

export type PrescriptionItemInput = z.infer<typeof prescriptionItemSchema>;

export const submitVisitSummarySchema = z.object({
  doctorNotes: z.string().min(5, 'Doctor notes must be at least 5 characters').max(4000, 'Notes cannot exceed 4000 characters'),
  prescription: z.array(prescriptionItemSchema).default([]),
});

export type SubmitVisitSummaryInput = z.infer<typeof submitVisitSummarySchema>;

export const rescheduleAppointmentSchema = z.object({
  newStartAt: z.string().datetime({ message: 'newStartAt must be a valid ISO datetime string' }),
});

export type RescheduleAppointmentInput = z.infer<typeof rescheduleAppointmentSchema>;

export const updateDoctorProfileSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  specialisation: z.string().min(2, 'Speciality is required'),
  age: z.union([z.number().int().min(18).max(100), z.string(), z.null()]).optional(),
  address: z.string().nullable().optional(),
  bio: z.string().nullable().optional(),
  requestedEmail: z.string().email('Invalid email address').nullable().optional(),
  requestedPhone: z.string().nullable().optional(),
  requestReason: z.string().nullable().optional(),
});

export type UpdateDoctorProfileInput = z.infer<typeof updateDoctorProfileSchema>;


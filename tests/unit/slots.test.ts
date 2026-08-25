import { describe, it, expect } from 'vitest';
import { generateCandidateSlots, filterAvailableSlots } from '../../lib/utils/slots';

describe('Slot Generation & Filtering Utilities', () => {
  it('should generate candidate slots correctly within working hours', () => {
    const slots = generateCandidateSlots(
      '2026-09-10',
      { startTime: '09:00', endTime: '11:00' },
      30
    );

    expect(slots.length).toBe(4);
    expect(slots[0].startAt.toISOString()).toContain('09:00:00.000Z');
    expect(slots[3].endAt.toISOString()).toContain('11:00:00.000Z');
  });

  it('should filter out candidate slots that collide with existing active appointments', () => {
    const candidateSlots = generateCandidateSlots(
      '2026-09-10',
      { startTime: '09:00', endTime: '10:00' },
      30
    );

    const existingAppointments = [
      {
        startAt: new Date(Date.UTC(2026, 8, 10, 9, 0, 0)),
        endAt: new Date(Date.UTC(2026, 8, 10, 9, 30, 0)),
        status: 'CONFIRMED',
      },
    ];

    const available = filterAvailableSlots(
      candidateSlots,
      existingAppointments,
      false,
      new Date(Date.UTC(2026, 8, 10, 8, 0, 0))
    );

    expect(available.length).toBe(1);
    expect(available[0].startAt.toISOString()).toContain('09:30:00.000Z');
  });

  it('should return empty slots if doctor is on leave', () => {
    const candidateSlots = generateCandidateSlots(
      '2026-09-10',
      { startTime: '09:00', endTime: '17:00' },
      30
    );

    const available = filterAvailableSlots(candidateSlots, [], true);
    expect(available.length).toBe(0);
  });
});

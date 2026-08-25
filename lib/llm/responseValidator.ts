import { z } from 'zod';
import { UrgencyLevel } from '@prisma/client';
import { ValidationError } from '@/lib/errors/AppError';

export const preVisitLlmSchema = z.object({
  urgency: z.enum(['Low', 'Medium', 'High', 'LOW', 'MEDIUM', 'HIGH']),
  chiefComplaint: z.string().min(1),
  suggestedQuestions: z.array(z.string()).min(1).max(3),
});

export interface PreVisitParsedResult {
  urgency: UrgencyLevel;
  chiefComplaint: string;
  suggestedQuestions: string[];
}

export function parsePreVisitResponse(rawJsonStr: string): PreVisitParsedResult {
  try {
    const json = JSON.parse(rawJsonStr);
    const validated = preVisitLlmSchema.parse(json);

    let urgencyEnum: UrgencyLevel = UrgencyLevel.MEDIUM;
    const uUpper = validated.urgency.toUpperCase();
    if (uUpper === 'LOW') urgencyEnum = UrgencyLevel.LOW;
    if (uUpper === 'HIGH') urgencyEnum = UrgencyLevel.HIGH;

    return {
      urgency: urgencyEnum,
      chiefComplaint: validated.chiefComplaint,
      suggestedQuestions: validated.suggestedQuestions,
    };
  } catch (err: any) {
    throw new ValidationError(`Failed to parse LLM pre-visit response: ${err.message}`, err);
  }
}

export const postVisitLlmSchema = z.object({
  summary: z.string().min(1),
  medicationSchedule: z.string().min(1),
  followUpSteps: z.string().min(1),
});

export interface PostVisitParsedResult {
  summary: string;
  medicationSchedule: string;
  followUpSteps: string;
  formattedText: string;
}

export function parsePostVisitResponse(rawJsonStr: string): PostVisitParsedResult {
  try {
    const json = JSON.parse(rawJsonStr);
    const validated = postVisitLlmSchema.parse(json);

    const formattedText = `### Visit Summary\n${validated.summary}\n\n### Medication Schedule\n${validated.medicationSchedule}\n\n### Follow-up Instructions\n${validated.followUpSteps}`;

    return {
      summary: validated.summary,
      medicationSchedule: validated.medicationSchedule,
      followUpSteps: validated.followUpSteps,
      formattedText,
    };
  } catch (err: any) {
    throw new ValidationError(`Failed to parse LLM post-visit response: ${err.message}`, err);
  }
}

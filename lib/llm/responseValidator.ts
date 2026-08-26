import { UrgencyLevel } from '@prisma/client';
import { ValidationError } from '@/lib/errors/AppError';

export interface PreVisitParsedResult {
  urgency: UrgencyLevel;
  chiefComplaint: string;
  suggestedQuestions: string[];
}

export function parsePreVisitResponse(rawJsonStr: string): PreVisitParsedResult {
  try {
    let cleanJson = rawJsonStr.trim();
    if (cleanJson.startsWith('```')) {
      cleanJson = cleanJson.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    }

    const json = JSON.parse(cleanJson);

    const rawUrgency = String(json.urgency || json.urgencyLevel || 'MEDIUM').toUpperCase();
    let urgencyEnum: UrgencyLevel = UrgencyLevel.MEDIUM;
    if (rawUrgency.includes('LOW')) urgencyEnum = UrgencyLevel.LOW;
    if (rawUrgency.includes('HIGH')) urgencyEnum = UrgencyLevel.HIGH;

    const chiefComplaint = String(
      json.chiefComplaint || json.chief_complaint || json.summary || 'Patient submitted symptoms for pre-visit evaluation.'
    ).trim();

    let questions: string[] = [];
    if (Array.isArray(json.suggestedQuestions)) {
      questions = json.suggestedQuestions.map((q: any) => String(q).trim()).filter(Boolean);
    } else if (Array.isArray(json.questions)) {
      questions = json.questions.map((q: any) => String(q).trim()).filter(Boolean);
    }

    if (questions.length === 0) {
      questions = [
        'How long have you experienced these symptoms?',
        'Are symptoms worsening or persistent?',
        'Do you have any related medical history?'
      ];
    }

    return {
      urgency: urgencyEnum,
      chiefComplaint,
      suggestedQuestions: questions.slice(0, 3),
    };
  } catch (err: any) {
    throw new ValidationError(`Failed to parse LLM pre-visit response: ${err.message}`, err);
  }
}

export interface PostVisitParsedResult {
  summary: string;
  medicationSchedule: string;
  followUpSteps: string;
  formattedText: string;
}

export function parsePostVisitResponse(rawJsonStr: string): PostVisitParsedResult {
  try {
    let cleanJson = rawJsonStr.trim();
    if (cleanJson.startsWith('```')) {
      cleanJson = cleanJson.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    }

    const json = JSON.parse(cleanJson);

    const summary = String(
      json.summary || json.patientSummary || json.clinicalSummary || 'Consultation completed successfully.'
    ).trim();

    const medicationSchedule = String(
      json.medicationSchedule || json.prescriptionSchedule || json.medications || 'Take medications as prescribed by your physician.'
    ).trim();

    const followUpSteps = String(
      json.followUpSteps || json.followUp || json.nextSteps || 'Return for follow-up if symptoms persist or worsen.'
    ).trim();

    const formattedText = `### Visit Summary\n${summary}\n\n### Medication Schedule\n${medicationSchedule}\n\n### Follow-up Instructions\n${followUpSteps}`;

    return {
      summary,
      medicationSchedule,
      followUpSteps,
      formattedText,
    };
  } catch (err: any) {
    throw new ValidationError(`Failed to parse LLM post-visit response: ${err.message}`, err);
  }
}

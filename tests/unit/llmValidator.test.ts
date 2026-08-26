import { describe, it, expect } from 'vitest';
import { parsePreVisitResponse, parsePostVisitResponse } from '../../lib/llm/responseValidator';

describe('LLM Response Validator', () => {
  it('should parse valid pre-visit JSON correctly', () => {
    const jsonStr = JSON.stringify({
      urgency: 'High',
      chiefComplaint: 'Severe chest pain radiating to left arm',
      suggestedQuestions: [
        'How long has the pain lasted?',
        'Does it worsen with exertion?',
        'Do you have shortness of breath?',
      ],
    });

    const parsed = parsePreVisitResponse(jsonStr);
    expect(parsed.urgency).toBe('HIGH');
    expect(parsed.chiefComplaint).toBe('Severe chest pain radiating to left arm');
    expect(parsed.suggestedQuestions.length).toBe(3);
  });

  it('should throw ValidationError on malformed or incomplete pre-visit JSON', () => {
    const invalidJsonStr = 'malformed JSON text {{{';

    expect(() => parsePreVisitResponse(invalidJsonStr)).toThrow();
  });

  it('should parse valid post-visit JSON correctly', () => {
    const jsonStr = JSON.stringify({
      summary: 'Patient presents with mild hypertension.',
      medicationSchedule: 'Take Lisinopril 10mg once daily in the morning.',
      followUpSteps: 'Return for blood pressure check in 4 weeks.',
    });

    const parsed = parsePostVisitResponse(jsonStr);
    expect(parsed.summary).toContain('hypertension');
    expect(parsed.formattedText).toContain('### Visit Summary');
  });
});

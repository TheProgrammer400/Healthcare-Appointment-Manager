import { GroqProvider } from './providers/groqProvider';
import { buildPreVisitPrompt, buildPostVisitPrompt } from './promptBuilder';
import { parsePreVisitResponse, parsePostVisitResponse, PreVisitParsedResult, PostVisitParsedResult } from './responseValidator';

const provider = new GroqProvider();
const TIMEOUT_MS = 8000;

async function executeWithTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(`LLM operation timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timer));
}

export class LLMService {
  static async generatePreVisitSummary(symptoms: string): Promise<PreVisitParsedResult> {
    const { system, user } = buildPreVisitPrompt(symptoms);
    
    // Attempt 1 with 8s timeout
    try {
      const raw = await executeWithTimeout(
        provider.complete(system, user, { maxTokens: 400, jsonMode: true }),
        TIMEOUT_MS
      );
      return parsePreVisitResponse(raw);
    } catch (err1) {
      console.warn('[LLMService]: Pre-visit attempt 1 failed, retrying once with 500ms backoff...', err1);
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      // Attempt 2 (Retry 1)
      const rawRetry = await executeWithTimeout(
        provider.complete(system, user, { maxTokens: 400, jsonMode: true }),
        TIMEOUT_MS
      );
      return parsePreVisitResponse(rawRetry);
    }
  }

  static async generatePostVisitSummary(doctorNotes: string, prescriptionJson: unknown): Promise<PostVisitParsedResult> {
    const { system, user } = buildPostVisitPrompt(doctorNotes, prescriptionJson);

    try {
      const raw = await executeWithTimeout(
        provider.complete(system, user, { maxTokens: 600, jsonMode: true }),
        TIMEOUT_MS
      );
      return parsePostVisitResponse(raw);
    } catch (err1) {
      console.warn('[LLMService]: Post-visit attempt 1 failed, retrying once with 500ms backoff...', err1);
      await new Promise((resolve) => setTimeout(resolve, 500));

      const rawRetry = await executeWithTimeout(
        provider.complete(system, user, { maxTokens: 600, jsonMode: true }),
        TIMEOUT_MS
      );
      return parsePostVisitResponse(rawRetry);
    }
  }
}

import { LLMProvider, LLMCompletionOptions } from './LLMProvider';
import { getGroqClient, GROQ_MODEL } from '../groqClient';
import { ExternalServiceError } from '@/lib/errors/AppError';

export class GroqProvider implements LLMProvider {
  async complete(systemPrompt: string, userPrompt: string, options: LLMCompletionOptions = {}): Promise<string> {
    const client = getGroqClient();

    const candidateModels = Array.from(
      new Set([
        process.env.GROQ_MODEL || '',
        GROQ_MODEL,
        'openai/gpt-oss-120b',
        'groq/compound-mini',
        'openai/gpt-oss-20b',
        'qwen/qwen3.6-27b',
      ])
    ).filter(Boolean);

    let lastError: Error | null = null;

    for (const model of candidateModels) {
      try {
        const response = await client.chat.completions.create({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: options.temperature ?? 0.2,
          max_tokens: options.maxTokens ?? 800,
          response_format: options.jsonMode ? { type: 'json_object' } : undefined,
        });

        const content = response.choices[0]?.message?.content;
        if (content && content.trim().length > 0) {
          return content;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`[GroqProvider Warning]: Model '${model}' failed: ${err?.message || err}. Trying next fallback...`);
      }
    }

    console.error('[GroqProvider Final Error]: All candidate Groq models failed.', lastError);
    throw new ExternalServiceError(`Groq API failure: ${lastError?.message || 'All models failed'}`, 'LLM_UNAVAILABLE');
  }
}

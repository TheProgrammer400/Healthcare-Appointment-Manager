import { LLMProvider, LLMCompletionOptions } from './LLMProvider';
import { groq, GROQ_MODEL } from '../groqClient';
import { ExternalServiceError } from '@/lib/errors/AppError';

export class GroqProvider implements LLMProvider {
  async complete(systemPrompt: string, userPrompt: string, options: LLMCompletionOptions = {}): Promise<string> {
    try {
      const response = await groq.chat.completions.create({
        model: GROQ_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: options.temperature ?? 0.2,
        max_tokens: options.maxTokens ?? 500,
        response_format: options.jsonMode ? { type: 'json_object' } : undefined,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new ExternalServiceError('Groq API returned an empty response', 'LLM_UNAVAILABLE');
      }

      return content;
    } catch (err: any) {
      console.error('[GroqProvider Error]:', err?.message || err);
      throw new ExternalServiceError(`Groq API failure: ${err?.message || 'Unknown error'}`, 'LLM_UNAVAILABLE');
    }
  }
}

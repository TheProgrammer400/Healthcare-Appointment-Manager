export interface LLMCompletionOptions {
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
}

export interface LLMProvider {
  complete(systemPrompt: string, userPrompt: string, options?: LLMCompletionOptions): Promise<string>;
}

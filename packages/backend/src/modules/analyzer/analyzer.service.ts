import type { ParsedEmail, AnalysisResult, ConnectionTestResult } from '@mail-to-notion/shared';
import { analysisResultSchema } from '@mail-to-notion/shared';
import { settingsRepository } from '../../database/repositories/settings.repository';
import { categoryRepository } from '../../database/repositories/category.repository';
import { ClaudeProvider } from './claude.provider';
import { OllamaProvider } from './ollama.provider';
import type { LLMProvider } from './llm-provider.interface';
import { buildSystemPrompt, buildUserPrompt } from './prompt.template';
import { logger } from '../../utils/logger';

function createProvider(settings: ReturnType<typeof settingsRepository.get<'ai'>>): LLMProvider {
  if (settings.provider === 'claude') {
    return new ClaudeProvider({
      apiKey: settings.claude.apiKey,
      model: settings.claude.model,
    });
  }
  return new OllamaProvider({
    host: settings.ollama.host,
    model: settings.ollama.model,
  });
}

export async function analyzeEmail(
  email: ParsedEmail,
  categories: string[],
): Promise<AnalysisResult> {
  const aiSettings = settingsRepository.get('ai');
  const provider = createProvider(aiSettings);

  const systemPrompt = buildSystemPrompt(categories);
  const userPrompt = buildUserPrompt({
    from: email.from,
    subject: email.subject,
    body: email.textBody,
  });

  const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;

  let lastError: Error | null = null;

  // Try up to 2 times (initial + 1 retry)
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const rawResponse = await provider.analyze(fullPrompt);

      // Try to extract JSON from the response
      let jsonStr = rawResponse.trim();
      const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1].trim();
      }

      const parsed = JSON.parse(jsonStr);
      const validated = analysisResultSchema.parse(parsed);
      return validated;
    } catch (error) {
      lastError = error as Error;
      logger.warn(
        { attempt: attempt + 1, error: (error as Error).message },
        'Analysis attempt failed, retrying...',
      );
    }
  }

  throw new Error(`Failed to analyze email after 2 attempts: ${lastError?.message}`);
}

export async function testAIConnection(): Promise<ConnectionTestResult> {
  try {
    const aiSettings = settingsRepository.get('ai');
    const provider = createProvider(aiSettings);
    return await provider.testConnection();
  } catch (error) {
    return { ok: false, message: (error as Error).message };
  }
}

export function getCurrentProviderName(): string {
  const aiSettings = settingsRepository.get('ai');
  return aiSettings.provider;
}

export function getCategories(): string[] {
  return categoryRepository.findAll().map((c) => c.name);
}

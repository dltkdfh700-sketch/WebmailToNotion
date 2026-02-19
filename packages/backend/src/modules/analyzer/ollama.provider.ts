import type { LLMProvider } from './llm-provider.interface';

export class OllamaProvider implements LLMProvider {
  public readonly name = 'ollama';
  private host: string;
  private model: string;

  constructor(config: { host: string; model: string }) {
    this.host = config.host.replace(/\/+$/, '');
    this.model = config.model;
  }

  async analyze(prompt: string): Promise<string> {
    const response = await fetch(`${this.host}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: 'system', content: 'You are an email analysis assistant. Always respond with valid JSON only.' },
          { role: 'user', content: prompt },
        ],
        format: 'json',
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as { message?: { content?: string } };
    const content = data.message?.content ?? '';

    // Handle markdown code block wrapping
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      return jsonMatch[1].trim();
    }

    return content.trim();
  }

  async testConnection(): Promise<{ ok: boolean; message: string }> {
    try {
      const response = await fetch(`${this.host}/api/tags`);
      if (!response.ok) {
        return { ok: false, message: `Ollama server responded with ${response.status}` };
      }

      const data = await response.json() as { models?: { name: string }[] };
      const models = data.models ?? [];
      const modelNames = models.map((m) => m.name);
      const hasModel = modelNames.some((name) => name === this.model || name.startsWith(this.model));

      if (hasModel) {
        return { ok: true, message: `Connected to Ollama. Model "${this.model}" is available.` };
      } else {
        return {
          ok: false,
          message: `Connected to Ollama but model "${this.model}" not found. Available: ${modelNames.join(', ') || 'none'}`,
        };
      }
    } catch (error) {
      return { ok: false, message: `Ollama connection failed: ${(error as Error).message}` };
    }
  }
}

export async function getAvailableModels(host: string): Promise<string[]> {
  const normalizedHost = host.replace(/\/+$/, '');
  const response = await fetch(`${normalizedHost}/api/tags`);
  if (!response.ok) {
    throw new Error(`Ollama request failed: ${response.status}`);
  }
  const data = await response.json() as { models?: { name: string }[] };
  return (data.models ?? []).map((m) => m.name);
}

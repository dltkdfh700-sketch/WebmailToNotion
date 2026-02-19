import Anthropic from '@anthropic-ai/sdk';
import type { LLMProvider } from './llm-provider.interface';

export class ClaudeProvider implements LLMProvider {
  public readonly name = 'claude';
  private client: Anthropic;
  private model: string;

  constructor(config: { apiKey: string; model: string }) {
    this.client = new Anthropic({ apiKey: config.apiKey });
    this.model = config.model;
  }

  async analyze(prompt: string): Promise<string> {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 2048,
      system: 'You are an email analysis assistant. Always respond with valid JSON only.',
      messages: [{ role: 'user', content: prompt }],
    });

    const textBlock = response.content.find((block) => block.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      throw new Error('No text content in Claude response');
    }
    return textBlock.text;
  }

  async testConnection(): Promise<{ ok: boolean; message: string }> {
    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 50,
        messages: [{ role: 'user', content: 'Respond with "ok"' }],
      });

      const textBlock = response.content.find((block) => block.type === 'text');
      return { ok: true, message: `Connected to Claude (${this.model}). Response: ${textBlock?.type === 'text' ? textBlock.text : 'ok'}` };
    } catch (error) {
      return { ok: false, message: `Claude connection failed: ${(error as Error).message}` };
    }
  }
}

export interface LLMProvider {
  name: string;
  analyze(prompt: string): Promise<string>;
  testConnection(): Promise<{ ok: boolean; message: string }>;
}

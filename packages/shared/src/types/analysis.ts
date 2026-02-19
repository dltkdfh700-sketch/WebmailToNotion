export enum LLMProvider {
  CLAUDE = 'claude',
  OLLAMA = 'ollama',
}

export type Priority = '높음' | '보통' | '낮음';
export type EstimatedEffort = '소' | '중' | '대' | '미정';

export interface AnalysisResult {
  isRequirement: boolean;
  category: string;
  priority: Priority;
  title: string;
  summary: string;
  keyRequirements: string[];
  estimatedEffort: EstimatedEffort;
  tags: string[];
  language: string;
  reasoning: string;
}

import { z } from 'zod';

export const analysisResultSchema = z.object({
  isRequirement: z.boolean(),
  category: z.string(),
  priority: z.enum(['높음', '보통', '낮음']),
  title: z.string().min(1),
  summary: z.string().min(1),
  keyRequirements: z.array(z.string()),
  estimatedEffort: z.enum(['소', '중', '대', '미정']),
  tags: z.array(z.string()),
  language: z.string(),
  reasoning: z.string(),
});

export const createCategorySchema = z.object({
  name: z.string().min(1).max(50),
  description: z.string().max(200).optional().default(''),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional().default('#6B7280'),
  sortOrder: z.number().int().positive().optional(),
});

export const updateCategorySchema = z.object({
  name: z.string().min(1).max(50).optional(),
  description: z.string().max(200).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  sortOrder: z.number().int().positive().optional(),
});

export const settingsSchema = z.object({
  pop3: z.object({
    host: z.string(),
    port: z.number().int().min(1).max(65535),
    user: z.string(),
    password: z.string(),
    tls: z.boolean(),
  }).optional(),
  ai: z.object({
    provider: z.enum(['claude', 'ollama']),
    claude: z.object({
      apiKey: z.string(),
      model: z.string(),
    }).optional(),
    ollama: z.object({
      host: z.string().url(),
      model: z.string(),
    }).optional(),
  }).optional(),
  notion: z.object({
    apiKey: z.string(),
    databaseId: z.string(),
  }).optional(),
  scheduler: z.object({
    enabled: z.boolean(),
    intervalMinutes: z.number().int().min(1).max(1440),
  }).optional(),
});

export const logFiltersSchema = z.object({
  status: z.enum(['success', 'skipped', 'error']).optional(),
  category: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

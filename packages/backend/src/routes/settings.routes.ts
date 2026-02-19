import { Router } from 'express';
import { settingsRepository } from '../database/repositories/settings.repository';
import { validate } from '../middleware/validate';
import { settingsSchema } from '@mail-to-notion/shared';
import type { Settings } from '@mail-to-notion/shared';
import { testPOP3Connection } from '../modules/pop3/pop3.service';
import { testConnection as testNotionConnection } from '../modules/notion/notion.service';
import { testAIConnection } from '../modules/analyzer/analyzer.service';
import { getAvailableModels } from '../modules/analyzer/ollama.provider';
import { SchedulerService } from '../modules/scheduler/scheduler.service';
import { asyncHandler } from './async-handler';

const router = Router();

const MASKED_VALUE = '********';

function maskSensitive(settings: Settings): Record<string, unknown> {
  const masked = JSON.parse(JSON.stringify(settings));

  if (masked.pop3?.password) {
    masked.pop3.password = MASKED_VALUE;
  }
  if (masked.ai?.claude?.apiKey) {
    masked.ai.claude.apiKey = MASKED_VALUE;
  }
  if (masked.notion?.apiKey) {
    masked.notion.apiKey = MASKED_VALUE;
  }

  return masked;
}

// GET / — get all settings (masked)
router.get('/', asyncHandler(async (_req, res) => {
  const settings = settingsRepository.getAll();
  res.json({ success: true, data: maskSensitive(settings) });
}));

// PUT / — update settings
router.put('/', validate(settingsSchema), asyncHandler(async (req, res) => {
  const updates = req.body as Partial<Settings>;
  let schedulerChanged = false;

  for (const [key, value] of Object.entries(updates)) {
    if (value !== undefined) {
      const settingKey = key as keyof Settings;

      // For sensitive fields, if masked value is sent, keep existing value
      if (settingKey === 'pop3' && (value as Settings['pop3']).password === MASKED_VALUE) {
        const existing = settingsRepository.get('pop3');
        (value as Settings['pop3']).password = existing.password;
      }
      if (settingKey === 'ai') {
        const aiVal = value as Settings['ai'];
        if (aiVal.claude?.apiKey === MASKED_VALUE) {
          const existing = settingsRepository.get('ai');
          aiVal.claude.apiKey = existing.claude.apiKey;
        }
      }
      if (settingKey === 'notion' && (value as Settings['notion']).apiKey === MASKED_VALUE) {
        const existing = settingsRepository.get('notion');
        (value as Settings['notion']).apiKey = existing.apiKey;
      }

      if (settingKey === 'scheduler') {
        schedulerChanged = true;
      }

      settingsRepository.set(settingKey, value as Settings[typeof settingKey]);
    }
  }

  // Restart scheduler if settings changed
  if (schedulerChanged) {
    const scheduler = SchedulerService.getInstance();
    const schedulerSettings = settingsRepository.get('scheduler');
    if (schedulerSettings.enabled) {
      scheduler.start(schedulerSettings.intervalMinutes);
    } else {
      scheduler.stop();
    }
  }

  const settings = settingsRepository.getAll();
  res.json({ success: true, data: maskSensitive(settings) });
}));

// POST /test-pop3
router.post('/test-pop3', asyncHandler(async (_req, res) => {
  const result = await testPOP3Connection();
  res.json({ success: true, data: result });
}));

// POST /test-notion
router.post('/test-notion', asyncHandler(async (_req, res) => {
  const result = await testNotionConnection();
  res.json({ success: true, data: result });
}));

// POST /test-ai
router.post('/test-ai', asyncHandler(async (_req, res) => {
  const result = await testAIConnection();
  res.json({ success: true, data: result });
}));

// GET /ollama-models
router.get('/ollama-models', asyncHandler(async (_req, res) => {
  try {
    const aiSettings = settingsRepository.get('ai');
    const models = await getAvailableModels(aiSettings.ollama.host);
    res.json({ success: true, data: models });
  } catch (error) {
    res.json({ success: false, error: (error as Error).message, data: [] });
  }
}));

export const settingsRoutes = router;

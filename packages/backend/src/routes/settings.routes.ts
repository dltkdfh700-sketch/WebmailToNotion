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

// POST /test-notion-write — create a test page in Notion
router.post('/test-notion-write', asyncHandler(async (_req, res) => {
  try {
    const settings = settingsRepository.get('notion');
    if (!settings.apiKey || !settings.databaseId) {
      res.json({ success: true, data: { ok: false, message: 'Notion 설정이 없습니다.' } });
      return;
    }

    const { Client } = await import('@notionhq/client');
    const client = new Client({ auth: settings.apiKey });

    const page = await client.pages.create({
      parent: { database_id: settings.databaseId },
      properties: {
        Name: {
          title: [{ text: { content: '[테스트] Mail-to-Notion 연동 테스트' } }],
        },
        '상태': {
          select: { name: '할 일' },
        },
        '날짜': {
          date: { start: new Date().toISOString().split('T')[0] },
        },
        '텍스트': {
          rich_text: [{ text: { content: '이 페이지는 Mail-to-Notion 시스템의 Notion 연동 테스트로 자동 생성되었습니다. 삭제해도 됩니다.' } }],
        },
      },
    });

    const url = (page as unknown as { url: string }).url ?? `https://notion.so/${page.id.replace(/-/g, '')}`;
    res.json({ success: true, data: { ok: true, message: `테스트 페이지 생성 완료`, url } });
  } catch (error) {
    res.json({ success: true, data: { ok: false, message: `Notion 글 작성 실패: ${(error as Error).message}` } });
  }
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

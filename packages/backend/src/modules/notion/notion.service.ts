import { Client } from '@notionhq/client';
import type { ParsedEmail, AnalysisResult, ConnectionTestResult } from '@mail-to-notion/shared';
import { settingsRepository } from '../../database/repositories/settings.repository';
import { logger } from '../../utils/logger';

const RATE_LIMIT_DELAY_MS = 350;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getClient(): { client: Client; databaseId: string } {
  const settings = settingsRepository.get('notion');
  if (!settings.apiKey || !settings.databaseId) {
    throw new Error('Notion settings not configured');
  }
  return {
    client: new Client({ auth: settings.apiKey }),
    databaseId: settings.databaseId,
  };
}

export async function createPage(
  email: ParsedEmail,
  analysis: AnalysisResult,
): Promise<{ id: string; url: string }> {
  const { client, databaseId } = getClient();

  // Create the database page with properties
  const page = await client.pages.create({
    parent: { database_id: databaseId },
    properties: {
      Title: {
        title: [{ text: { content: analysis.title } }],
      },
      Category: {
        select: { name: analysis.category },
      },
      Priority: {
        select: { name: analysis.priority },
      },
      Status: {
        select: { name: '신규' },
      },
      EstimatedEffort: {
        select: { name: analysis.estimatedEffort },
      },
      'Source Email': {
        rich_text: [{ text: { content: email.subject.substring(0, 2000) } }],
      },
      Sender: {
        rich_text: [{ text: { content: email.from.substring(0, 2000) } }],
      },
      'Date Received': {
        date: { start: email.date.toISOString() },
      },
      'Date Processed': {
        date: { start: new Date().toISOString() },
      },
      Tags: {
        multi_select: analysis.tags.slice(0, 10).map((tag) => ({ name: tag.substring(0, 100) })),
      },
    },
  });

  await delay(RATE_LIMIT_DELAY_MS);

  // Append child blocks for the page content
  const children: Parameters<typeof client.blocks.children.append>[0]['children'] = [];

  // Summary section
  children.push({
    object: 'block',
    type: 'heading_2',
    heading_2: {
      rich_text: [{ type: 'text', text: { content: '요약' } }],
    },
  });
  children.push({
    object: 'block',
    type: 'paragraph',
    paragraph: {
      rich_text: [{ type: 'text', text: { content: analysis.summary.substring(0, 2000) } }],
    },
  });

  // Key requirements section
  children.push({
    object: 'block',
    type: 'heading_2',
    heading_2: {
      rich_text: [{ type: 'text', text: { content: '주요 요구사항' } }],
    },
  });
  for (const req of analysis.keyRequirements) {
    children.push({
      object: 'block',
      type: 'bulleted_list_item',
      bulleted_list_item: {
        rich_text: [{ type: 'text', text: { content: req.substring(0, 2000) } }],
      },
    });
  }

  // Reasoning callout
  children.push({
    object: 'block',
    type: 'callout',
    callout: {
      rich_text: [{ type: 'text', text: { content: analysis.reasoning.substring(0, 2000) } }],
      icon: { type: 'emoji', emoji: '💡' },
      color: 'blue_background',
    },
  });

  // Original email toggle
  const bodyText = email.textBody.substring(0, 2000);
  children.push({
    object: 'block',
    type: 'toggle',
    toggle: {
      rich_text: [{ type: 'text', text: { content: '원본 이메일' } }],
      children: [
        {
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: [{ type: 'text', text: { content: bodyText } }],
          },
        },
      ],
    },
  });

  await client.blocks.children.append({
    block_id: page.id,
    children,
  });

  const url = (page as unknown as { url: string }).url ?? `https://notion.so/${page.id.replace(/-/g, '')}`;

  logger.info({ pageId: page.id, title: analysis.title }, 'Notion page created');

  return { id: page.id, url };
}

export async function testConnection(): Promise<ConnectionTestResult> {
  try {
    const { client, databaseId } = getClient();
    const response = await client.databases.retrieve({ database_id: databaseId });
    const title = (response as unknown as { title?: { plain_text: string }[] }).title?.[0]?.plain_text ?? 'Unknown';
    return { ok: true, message: `Connected to Notion database: "${title}"` };
  } catch (error) {
    return { ok: false, message: `Notion connection failed: ${(error as Error).message}` };
  }
}

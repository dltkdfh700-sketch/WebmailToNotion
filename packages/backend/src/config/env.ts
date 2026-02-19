import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Search for .env file: cwd, then up to 3 levels of parent directories
function findEnvFile(): string | undefined {
  let dir = process.cwd();
  for (let i = 0; i < 4; i++) {
    const envPath = path.join(dir, '.env');
    if (fs.existsSync(envPath)) return envPath;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return undefined;
}

const envPath = findEnvFile();
if (envPath) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config();
}

export const env = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  encryptionKey: process.env.ENCRYPTION_KEY || '',

  pop3: {
    host: process.env.POP3_HOST || '',
    port: parseInt(process.env.POP3_PORT || '995', 10),
    user: process.env.POP3_USER || '',
    password: process.env.POP3_PASSWORD || '',
    tls: process.env.POP3_TLS !== 'false',
  },

  ai: {
    provider: (process.env.AI_PROVIDER || 'claude') as 'claude' | 'ollama',
    anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
    claudeModel: process.env.CLAUDE_MODEL || 'claude-haiku-4-5-20251001',
    ollamaHost: process.env.OLLAMA_HOST || 'http://localhost:11434',
    ollamaModel: process.env.OLLAMA_MODEL || 'gemma3:12b',
  },

  notion: {
    apiKey: process.env.NOTION_API_KEY || '',
    databaseId: process.env.NOTION_DATABASE_ID || '',
  },
};

export interface Settings {
  pop3: POP3Settings;
  ai: AISettings;
  notion: NotionSettings;
  scheduler: SchedulerSettings;
}

export interface POP3Settings {
  host: string;
  port: number;
  user: string;
  password: string;
  tls: boolean;
}

export interface AISettings {
  provider: 'claude' | 'ollama';
  claude: {
    apiKey: string;
    model: string;
  };
  ollama: {
    host: string;
    model: string;
  };
}

export interface NotionSettings {
  apiKey: string;
  databaseId: string;
}

export interface SchedulerSettings {
  enabled: boolean;
  intervalMinutes: number;
}

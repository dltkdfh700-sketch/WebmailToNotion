/**
 * mail-to-notion watchdog
 * Health check every 60s -> restart via pm2 on failure + log
 * Pure Node.js (no external dependencies)
 */

const http = require('http');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const HEALTH_URL = 'http://localhost:3001/api/health';
const CHECK_INTERVAL = 60 * 1000; // 60s
const REQUEST_TIMEOUT = 5 * 1000; // 5s
const PM2_APP_NAME = 'mail-to-notion';

const LOG_DIR = path.join(__dirname, '..', 'logs');
const LOG_FILE = path.join(LOG_DIR, 'watchdog.log');

function timestamp() {
  return new Date().toISOString();
}

function log(message) {
  const line = `[${timestamp()}] ${message}\n`;
  process.stdout.write(line);
  try {
    if (!fs.existsSync(LOG_DIR)) {
      fs.mkdirSync(LOG_DIR, { recursive: true });
    }
    fs.appendFileSync(LOG_FILE, line, 'utf8');
  } catch (err) {
    process.stderr.write(`[${timestamp()}] Failed to write log: ${err.message}\n`);
  }
}

function healthCheck() {
  return new Promise((resolve, reject) => {
    const req = http.get(HEALTH_URL, { timeout: REQUEST_TIMEOUT }, (res) => {
      if (res.statusCode >= 200 && res.statusCode < 400) {
        res.resume();
        resolve();
      } else {
        res.resume();
        reject(new Error(`HTTP ${res.statusCode}`));
      }
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout (5s)'));
    });

    req.on('error', (err) => {
      reject(new Error(err.code === 'ECONNREFUSED' ? 'Connection refused (server down)' : err.message));
    });
  });
}

function restartApp() {
  try {
    execSync(`pm2 restart ${PM2_APP_NAME}`, { timeout: 30000 });
    log(`[RESTART OK] ${PM2_APP_NAME} restarted successfully`);
  } catch (err) {
    log(`[RESTART FAIL] ${PM2_APP_NAME} restart failed: ${err.message}`);
  }
}

async function check() {
  try {
    await healthCheck();
  } catch (err) {
    log(`[HEALTH FAIL] ${err.message} -> attempting restart`);
    restartApp();
  }
}

// Start
log(`Watchdog started - monitoring ${HEALTH_URL} every ${CHECK_INTERVAL / 1000}s`);

// First check after 10s (wait for app startup)
setTimeout(() => {
  check();
  setInterval(check, CHECK_INTERVAL);
}, 10 * 1000);

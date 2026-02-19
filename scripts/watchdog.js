/**
 * mail-to-notion watchdog
 * 60초 간격으로 헬스체크 → 실패 시 pm2 restart + 로그 기록
 * 순수 Node.js (외부 의존성 없음)
 */

const http = require('http');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const HEALTH_URL = 'http://localhost:3001/api/health';
const CHECK_INTERVAL = 60 * 1000; // 60초
const REQUEST_TIMEOUT = 5 * 1000; // 5초
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
    process.stderr.write(`[${timestamp()}] 로그 기록 실패: ${err.message}\n`);
  }
}

function healthCheck() {
  return new Promise((resolve, reject) => {
    const req = http.get(HEALTH_URL, { timeout: REQUEST_TIMEOUT }, (res) => {
      if (res.statusCode >= 200 && res.statusCode < 400) {
        // 응답 바디 소비 (메모리 누수 방지)
        res.resume();
        resolve();
      } else {
        res.resume();
        reject(new Error(`HTTP ${res.statusCode}`));
      }
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('요청 타임아웃 (5초)'));
    });

    req.on('error', (err) => {
      reject(new Error(err.code === 'ECONNREFUSED' ? '연결 거부 (서버 다운)' : err.message));
    });
  });
}

function restartApp() {
  try {
    execSync(`pm2 restart ${PM2_APP_NAME}`, { timeout: 30000 });
    log(`[재시작 성공] ${PM2_APP_NAME} 재시작 완료`);
  } catch (err) {
    log(`[재시작 실패] ${PM2_APP_NAME} 재시작 실패: ${err.message}`);
  }
}

async function check() {
  try {
    await healthCheck();
  } catch (err) {
    log(`[헬스체크 실패] ${err.message} → 재시작 시도`);
    restartApp();
  }
}

// 시작 로그
log(`워치독 시작 - ${CHECK_INTERVAL / 1000}초 간격으로 ${HEALTH_URL} 모니터링`);

// 첫 체크는 10초 후 (앱 기동 대기)
setTimeout(() => {
  check();
  setInterval(check, CHECK_INTERVAL);
}, 10 * 1000);

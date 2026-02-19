# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**mail-to-notion**: POP3 이메일을 수신하여 AI(Claude/Ollama)로 분석한 후, 요구사항으로 판별된 이메일을 Notion 데이터베이스에 자동 등록하는 시스템. 한국어 UI.

## Commands

```bash
# 전체 개발 서버 (백엔드 + 프론트엔드 동시)
npm run dev

# 개별 실행
npm run dev:backend      # tsx watch, port 3001
npm run dev:frontend     # vite, port 5173

# 빌드 (shared → backend → frontend 순서 필수)
npm run build

# shared만 빌드 (타입 변경 후 필수)
npm run build:shared
```

테스트 프레임워크는 아직 설정되어 있지 않음.

## Architecture

npm workspaces 모노레포 (`packages/shared`, `packages/backend`, `packages/frontend`).

### Email Processing Pipeline

핵심 흐름은 `packages/backend/src/pipeline/email-pipeline.ts`:

```
POP3 수신 → 이메일 파싱 → message-id 중복 체크 → AI 분석 → (요구사항이면) Notion 페이지 생성
```

- `modules/pop3/` - POP3로 이메일 가져오기
- `modules/parser/` - mailparser로 raw 이메일 파싱
- `modules/analyzer/` - LLM 프로바이더 패턴 (Claude/Ollama). `LLMProvider` 인터페이스 → `ClaudeProvider`, `OllamaProvider`
- `modules/notion/` - Notion API로 페이지 생성
- `modules/scheduler/` - node-cron 기반 싱글톤, 설정된 간격으로 파이프라인 실행

### Backend

- **Express** (port 3001) + helmet + cors
- **better-sqlite3** - DB 파일: `data/mail-to-notion.db` (프로젝트 루트 기준). WAL 모드.
- **DB 스키마**: `database/schema.ts`에서 초기화. 테이블: `categories`, `settings`, `processed_emails`, `processing_logs`
- **설정 저장**: env 초기값 → DB `settings` 테이블에 JSON으로 저장, 프론트엔드에서 동적 변경 가능
- **암호화**: `utils/crypto.ts` - settings 내 민감 값 암호화 (ENCRYPTION_KEY 필요)
- **API 라우트**: `/api/health`, `/api/categories`, `/api/settings`, `/api/logs`, `/api/trigger`, `/api/dashboard`
- **env 탐색**: `config/env.ts`가 cwd부터 상위 3단계까지 `.env` 파일을 찾음

### Frontend

- **React 19** + TypeScript + Vite 6
- **Tailwind CSS 3** 스타일링
- **React Query** (TanStack Query) 서버 상태 관리
- **react-router-dom v7** 라우팅: `/` (Dashboard), `/categories`, `/settings`, `/logs`
- **recharts** 차트, **lucide-react** 아이콘, **sonner** 토스트
- **Vite proxy**: `/api` → `localhost:3001` (개발 시 별도 CORS 걱정 없음)
- API 클라이언트: `src/api/client.ts` (axios 기반, 모든 API 함수 집중)
- hooks: `useDashboard`, `useCategories`, `useSettings`, `useLogs`

### Shared Package

`@mail-to-notion/shared` - 백엔드/프론트엔드 공통 타입, zod 스키마, 상수.
타입 변경 시 `npm run build:shared` 필수 (tsc로 `dist/` 생성).

## Key Conventions

- AI 분석 결과는 zod 스키마(`analysisResultSchema`)로 검증. LLM 응답에서 JSON 추출 시 코드블록(```)도 처리.
- 카테고리/우선순위/상태값은 한국어: 우선순위(`높음/보통/낮음`), 노력(`소/중/대/미정`), 상태(`신규/검토중/승인/진행중/완료/보류`)
- DB 컬럼은 snake_case, TypeScript 인터페이스는 camelCase
- Repository 패턴: `database/repositories/` 디렉토리에 테이블별 repository
- 라우트의 async 핸들러: `routes/async-handler.ts` 래퍼 사용
- 로깅: pino + pino-pretty

## Environment

`.env` 파일을 프로젝트 루트에 생성 (`.env.example` 참조). 필수 키:
- `POP3_HOST/PORT/USER/PASSWORD` - 메일 서버
- `AI_PROVIDER` + 해당 프로바이더 키 (ANTHROPIC_API_KEY 또는 OLLAMA_HOST)
- `NOTION_API_KEY` + `NOTION_DATABASE_ID`
- `ENCRYPTION_KEY` - 32바이트 hex (DB 내 비밀값 암호화용)

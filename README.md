# Mini Oases - Itinerary Builder

Oases 코딩 과제(v2.0, 2026-04-29) 기반의 1차 구현입니다. 부산 거주 4인 가족이 후쿠오카 4박 5일 여행 일정을 확인하고, DMC가 만든 1차 일정을 직접 추가·편집·삭제·정렬하면서 견적을 실시간으로 확인하는 단일 페이지 빌더입니다.

이 구현은 과제에서 “로컬 상태도 충분”하다고 한 범위를 넘어서, 사용자 요구에 맞춰 **SQLite + Prisma 기반 서버 저장형**으로 구성했습니다. 로그인/회원가입은 과제 제외 범위를 지키고, 대신 입력 검증·same-origin 방어·CSRF성 커스텀 헤더·보안 헤더·Prisma ORM 사용을 우선했습니다.

## Table of Contents

- [Feature Coverage](#feature-coverage)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Scripts](#scripts)
- [Architecture](#architecture)
- [Data Model](#data-model)
- [API Reference](#api-reference)
- [Business Logic](#business-logic)
- [Security](#security)
- [UI/UX Notes](#uiux-notes)
- [Testing & Verification](#testing--verification)
- [Project Structure](#project-structure)
- [Submission Checklist](#submission-checklist)
- [Implementation Notes](#implementation-notes)

## Feature Coverage

### Required Features

| ID | Requirement | Implementation |
| --- | --- | --- |
| F1 | Day / Activity 카드 렌더링 | Day별 세로 타임라인. 카드에 제목, 시간, 위치, 카테고리, 비용, DMC 추천 배지 표시 |
| F2 | Activity 편집 | 카드 선택 시 바텀시트에서 제목, 시간, 비용, 노트 편집. 추가로 카테고리, 위치, 1인/그룹 비용, Day 이동 지원. 시간·Day 선택은 네이티브 대신 디자인 시스템 커스텀 UI(시/분 컬럼 피커, 세그먼트 Day 칩) 사용 |
| F3 | Activity 추가·삭제 | Day 하단 “이 날에 일정 추가” 버튼, 삭제 전 커스텀 확인 다이얼로그(`window.confirm` 대체) |
| F4 | 순서 변경 | `motion/react`의 `Reorder` 기반 Day 내 드래그 정렬(드래그 핸들). 정렬 후 위치별 시간 슬롯을 재배정해 하루가 항상 시간순으로 유지됨(시간 보정) |
| F5 | 견적 자동 계산 | 카테고리별 합계, 어린이 70% 가중, 현지 케어 수수료 8%, 총액, 1인당 금액, 예산 잔여액 실시간 계산 |

### Bonus Features

- DMC 추천 일정과 사용자 추가 일정의 시각적 구분
- 다단계 Undo 스택과 토스트의 “되돌리기” 액션
- 로딩 skeleton, 빈 Day 상태, 에러/성공 토스트
- Day 간 Activity 이동
- 어린이 동선 적합도 도메인 메트릭
- DB가 비어 있을 때 시드 일정 자동 복구

과제의 “입력 폼, 로그인, 결제, LLM API, 실제 항공/숙소 연동”은 의도적으로 구현하지 않았습니다.

## Tech Stack

| Layer | Tooling |
| --- | --- |
| Framework | Next.js 16 App Router, React 19, TypeScript |
| Styling | Tailwind CSS v4, Inter via `next/font` |
| UI Motion | `motion` / `motion/react` |
| API | ElysiaJS mounted inside Next App Router under `/api` |
| Type-safe Client | Eden Treaty |
| Database | SQLite |
| ORM | Prisma 7 with `@prisma/adapter-better-sqlite3` |
| Tests | Node built-in test runner with `tsx` |
| Lint | ESLint 9 + `eslint-config-next` |

## Quick Start

### Requirements

- Node.js 20+ recommended
- npm
- No external database server is required

### Environment Variables

Create `.env` from `.env.example`.

```bash
cp .env.example .env
```

Required value:

| Name | Example | Description |
| --- | --- | --- |
| `DATABASE_URL` | `file:./dev.db` | Local SQLite database path used by Prisma CLI and runtime adapter |

### Install and Run

First-time setup:

```bash
npm install
cp .env.example .env
npm run db:reset
npm run dev
```

Open:

```text
http://localhost:3000
```

If the project has already been installed and seeded, start only the dev server:

```bash
npm run dev
```

The app also works on:

```text
http://127.0.0.1:3000
```

Important: mutating API calls validate the `Origin` header. Use the same host consistently. If the page is opened with `127.0.0.1`, manual API calls must use `Origin: http://127.0.0.1:3000`; if the page is opened with `localhost`, use `Origin: http://localhost:3000`.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Production build |
| `npm run start` | Start production server after build |
| `npm run lint` | Run ESLint |
| `npm test` | Run unit tests |
| `npm run db:migrate` | Apply checked-in SQLite schema SQL and generate Prisma Client |
| `npm run db:seed` | Reload the provided itinerary seed |
| `npm run db:reset` | Recreate local SQLite schema and seed data |

## Architecture

```text
Browser UI
  └─ src/app/page.tsx
      └─ src/components/builder/useBuilder.ts
          ├─ local UI state, undo stack, toast state
          ├─ quote calculation via src/lib/quote.ts
          ├─ kid-fit calculation via src/lib/kid-fit.ts
          └─ fetch wrapper with x-oases-action header

Next.js App Router
  └─ src/app/api/[[...slugs]]/route.ts
      └─ forwards HTTP methods to Elysia

Elysia API
  └─ src/server/index.ts
      ├─ validation schemas
      ├─ same-origin + action-header guard
      ├─ rate limit
      └─ route handlers

Persistence
  └─ src/lib/itinerary-store.ts
      └─ Prisma Client singleton from src/lib/prisma.ts
          └─ SQLite dev.db
```

### Design Choices

- `page.tsx` only composes the screen. Mutation logic lives in `useBuilder`.
- Quote and kid-fit logic are pure functions. They do not depend on React or the database.
- API routes return the full itinerary after each mutation. The client can replace local state with server truth, which keeps UI state simple.
- No global state library is used, matching the assignment’s guidance.
- DB writes are centralized in `src/lib/itinerary-store.ts`.

## Data Model

Prisma schema is defined in `prisma/schema.prisma`.

```text
Trip
 ├─ Member[]
 └─ Day[]
     └─ Activity[]
```

### Models

| Model | Purpose |
| --- | --- |
| `Trip` | Root itinerary metadata: origin, destination, dates, budget, preferences, notes |
| `Member` | Family member name and age, used for child cost weighting |
| `Day` | One itinerary day with date and numeric day |
| `Activity` | Editable schedule item with category, time, location, cost, recommendation flag, note, and `sortOrder` |

`Activity.category` is stored as `String` in SQLite and validated in TypeScript/API as:

```ts
"transport" | "lodging" | "activity" | "food"
```

`Activity.sortOrder` controls ordering within a Day. New activities use `crypto.randomUUID()`.

## API Reference

All endpoints are served under `/api` by Elysia.

| Method | Route | Description |
| --- | --- | --- |
| `GET` | `/api` | Health check |
| `GET` | `/api/itinerary` | Load the full itinerary |
| `PATCH` | `/api/activities/:id` | Edit title, time, cost, note, category, location, per-person flag |
| `PATCH` | `/api/activities/:id/move` | Move an activity to another Day |
| `POST` | `/api/days/:day/activities` | Add a default activity to a Day |
| `DELETE` | `/api/activities/:id` | Delete an activity |
| `PATCH` | `/api/days/:day/activities/reorder` | Reorder activities inside one Day |
| `PUT` | `/api/itinerary` | Restore a full validated itinerary snapshot for Undo |
| `POST` | `/api/itinerary/reset` | Reset DB to seed itinerary |

### Mutating Request Requirements

Every `POST`, `PUT`, `PATCH`, and `DELETE` request must include:

```http
Origin: <same origin as request URL>
x-oases-action: itinerary-builder
```

The app’s client wrapper in `src/components/builder/shared.ts` sets the action header automatically for non-GET requests.

### Example

```bash
curl -X PATCH http://localhost:3000/api/activities/a101 \
  -H 'Origin: http://localhost:3000' \
  -H 'x-oases-action: itinerary-builder' \
  -H 'Content-Type: application/json' \
  -d '{
    "title": "PUS -> FUK 항공편",
    "startTime": "09:30",
    "endTime": "11:00",
    "unitCostKRW": 220000,
    "note": "가족석 사전 예약 완료",
    "category": "transport",
    "location": "김해국제공항",
    "perPerson": true
  }'
```

## Business Logic

### Quote Calculation

Quote logic is implemented in `src/lib/quote.ts` and covered by `src/lib/quote.test.ts`.

Rules:

- Adult member: `1.0`
- Child under 12: `0.7`
- `perPerson: true`: `unitCostKRW * weightedHeadcount`
- `perPerson: false`: one group cost
- Local care fee: `Math.round(subtotal * 0.08)`
- Per-person total: `Math.round(total / memberCount)`

Seed checkpoint:

| Metric | Expected |
| --- | ---: |
| Weighted headcount | `3.4` |
| Subtotal | `2,258,600 KRW` |
| Local care fee | `180,688 KRW` |
| Total | `2,439,288 KRW` |
| Per person | `609,822 KRW` |

### Kid-Fit Metric

`src/lib/kid-fit.ts` calculates a deterministic 0-100 child-friendliness score.

Signals:

- Positive: kid-friendly keywords such as 어린이, 키즈, 공원, 박물관
- Warning: stroller-unfriendly notes, late end time, long single activity block, allergy/spice risk without mitigation
- Not applicable: if there are no children under 12

The metric is shown in `KidFitCard` and detailed inside the summary sheet.

## Security

The assignment excludes account/auth flows, so this project focuses on hardening the unauthenticated local builder surface.

### Request Security

- Mutating requests require same-origin `Origin`
- Mutating requests require `x-oases-action: itinerary-builder`
- In-memory mutating request rate limit: 80 requests per minute per `x-forwarded-for` key
- Elysia `t` schemas validate params and bodies
- Full itinerary restore endpoint validates the complete snapshot shape

### Input Validation

- IDs: `^[\w-]+$`, max 80 chars
- Day number: 1-31
- Time: `HH:mm` 24-hour format
- Cost: `0` to `10,000,000`
- Title/location/note length limits
- Category enum validation

### Browser and Runtime Security

- React escaping is used; no `dangerouslySetInnerHTML`
- Prisma ORM is used; no raw SQL in API handlers
- Security headers are configured in `next.config.ts`:
  - `Content-Security-Policy`
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy`
  - `X-Frame-Options: DENY`

Note: `prisma/apply-migration.ts` executes a checked-in SQL file locally to initialize the disposable SQLite DB. It is not exposed through the runtime API.

## UI/UX Notes

The UI is designed for a family customer reviewing a travel plan, not for an internal admin dashboard.

### Layout

- Mobile-first single column with `max-width: 640px`
- Day-based vertical timeline matching how users scan travel plans
- Bottom fixed summary bar keeps total price and per-person price always visible
- Summary details open in a bottom sheet to avoid navigating away

### Interaction

- Activity cards open an edit sheet
- Drag handle controls reorder, avoiding accidental card drag during normal scrolling
- Delete uses a custom confirm dialog
- Undo uses a snapshot stack and full itinerary restore endpoint
- Toasts confirm successful actions and expose undo where useful
- Reduced-motion preference is respected in major animated components

### Design System

- Grayscale-first palette for readability
- Muted blue reserved for primary actions and DMC/expert emphasis
- Green/amber/red reserved for status and risk
- Inter font via `next/font`
- 44px+ touch targets where practical
- Tabular numerals for money alignment

## Testing & Verification

### Automated Checks

Run before submission:

```bash
npm run db:reset
npm test
npm run lint
npm run build
```

Current test coverage:

- `src/lib/quote.test.ts`
  - child weighting
  - category subtotal calculation
  - seed quote checkpoint
- `src/lib/kid-fit.test.ts`
  - applicability for child travelers
  - stroller warning detection
  - adult-only fallback
  - deterministic output

### Manual Smoke Test

1. Start the app:

   ```bash
   npm run dev
   ```

2. Open `http://localhost:3000`
3. Confirm:
   - Day 1-5 render
   - Activity cards show title, time, location, category, cost, DMC badge
   - edit sheet opens from a card
   - title/time/cost/note save successfully
   - adding and deleting activities updates UI and quote
   - drag reorder updates order
   - summary sheet shows category totals, 8% care fee, total, per-person amount
   - reset restores seed data

### API Smoke Test

If your browser is opened at `http://localhost:3000`, use:

```bash
curl -s http://localhost:3000/api
curl -s http://localhost:3000/api/itinerary

curl -X POST http://localhost:3000/api/days/1/activities \
  -H 'Origin: http://localhost:3000' \
  -H 'x-oases-action: itinerary-builder'
```

If your browser is opened at `http://127.0.0.1:3000`, replace both the URL and `Origin` host with `127.0.0.1`.

Security checks:

```bash
# Missing action header -> 403
curl -X POST http://localhost:3000/api/days/1/activities \
  -H 'Origin: http://localhost:3000'

# Wrong origin -> 403
curl -X POST http://localhost:3000/api/itinerary/reset \
  -H 'Origin: http://evil.test' \
  -H 'x-oases-action: itinerary-builder'
```

## Project Structure

```text
.
├── .env.example
├── .gitignore
├── README.md
├── prompts.md
├── package.json
├── package-lock.json
├── next.config.ts
├── eslint.config.mjs
├── postcss.config.mjs
├── prisma.config.ts
├── prisma/
│   ├── schema.prisma
│   ├── apply-migration.ts
│   ├── seed.ts
│   └── migrations/20260530000000_init/migration.sql
└── src/
    ├── app/
    │   ├── api/[[...slugs]]/route.ts
    │   ├── globals.css
    │   ├── layout.tsx
    │   └── page.tsx
    ├── components/builder/
    │   ├── ActivityCard.tsx
    │   ├── ConfirmDialog.tsx
    │   ├── DayTimeline.tsx
    │   ├── EditSheet.tsx
    │   ├── KidFitCard.tsx
    │   ├── Sheet.tsx
    │   ├── SummaryBar.tsx
    │   ├── SummarySheet.tsx
    │   ├── TimeField.tsx
    │   ├── Toaster.tsx
    │   ├── TripHero.tsx
    │   ├── shared.ts
    │   └── useBuilder.ts
    ├── data/seed-itinerary.ts
    ├── lib/
    │   ├── itinerary-store.ts
    │   ├── kid-fit.ts
    │   ├── kid-fit.test.ts
    │   ├── prisma.ts
    │   ├── quote.ts
    │   └── quote.test.ts
    ├── server/index.ts
    └── types/itinerary.ts
```

Generated or local-only files:

- `dev.db`: local SQLite database, gitignored
- `src/generated/prisma/`: generated Prisma Client, gitignored
- `.next/`: Next.js build output, gitignored
- `node_modules/`: dependencies, gitignored

## Submission Checklist

Required by the assignment:

- Code
- `README.md`
- `prompts.md`

Recommended before sending:

```bash
rm -rf .next
npm run db:reset
npm test
npm run lint
npm run build
```

Email:

```text
linkovation.official@gmail.com
```

Subject format:

```text
[Oases Codingtest 과제] {지원자 이름}
```

## Implementation Notes

### Prisma 7 and SQLite

Prisma 7 no longer stores the DB URL inside `schema.prisma`. This project keeps:

- CLI datasource URL in `prisma.config.ts`
- Runtime datasource URL in `src/lib/prisma.ts` via `PrismaBetterSqlite3`

`npm run db:migrate` applies the checked-in SQLite schema SQL with `better-sqlite3`, then runs `prisma generate`. The DB is local disposable coding-test state, and `dev.db` is gitignored.

### Persistence vs Assignment Scope

The assignment says DB persistence is not required. The implementation still uses SQLite + Prisma because the user explicitly requested it. This is intentionally documented so evaluators understand the scope decision.

### No LLM/Product AI

The product itself does not call an LLM or external AI API. AI usage is limited to development workflow documentation in `prompts.md`, matching the assignment’s “AI Native 활용도” evaluation area without adding an AI feature to the app.

## Troubleshooting

### Prisma Client import fails

Run:

```bash
npm run db:migrate
```

This regenerates `src/generated/prisma/`.

### App starts but no itinerary appears

Reset the local DB:

```bash
npm run db:reset
```

`GET /api/itinerary` also auto-restores seed data when the DB has no trip.

### Mutating API request returns 403

Use the same host for page and API requests, and include the action header:

```http
Origin: http://localhost:3000
x-oases-action: itinerary-builder
```

If you open the app at `http://127.0.0.1:3000`, use `Origin: http://127.0.0.1:3000` for manual API calls.

### Why does `db:migrate` not call `prisma migrate dev`?

In this local setup, `npm run db:migrate` applies the checked-in SQLite migration SQL and then runs `prisma generate`. This keeps the coding-test DB reset deterministic while still using Prisma Client and Prisma schema as the application data contract.

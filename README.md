# Mini Oases - 일정 빌더

Oases 코딩 과제(v2.0, 2026-04-29) 기반의 1차 구현입니다. 부산 거주 4인 가족이 후쿠오카 4박 5일 여행 일정을 확인하고, DMC가 만든 1차 일정을 직접 추가·편집·삭제·정렬하면서 견적을 실시간으로 확인하는 단일 페이지 빌더입니다.

이 구현은 과제에서 “로컬 상태도 충분”하다고 한 범위를 넘어서, 사용자 요구에 맞춰 **SQLite + Prisma 기반 서버 저장형**으로 구성했습니다. 로그인/회원가입은 과제 제외 범위를 지키고, 대신 입력 검증·동일 출처 방어·CSRF성 커스텀 헤더·보안 헤더·Prisma ORM 사용을 우선했습니다.

## 목차

- 기능 구현 범위
- 기술 스택
- 빠른 실행
- 스크립트
- 아키텍처
- 데이터 모델
- API 명세
- 비즈니스 로직
- 보안
- UI/UX 설계
- 테스트와 검증
- 프로젝트 구조
- 제출 체크리스트
- 구현 참고 사항

## 기능 구현 범위

### 필수 기능

| ID | 요구사항 | 구현 내용 |
| --- | --- | --- |
| F1 | Day / Activity 카드 렌더링 | Day별 세로 타임라인. 카드에 제목, 시간, 위치, 카테고리, 비용, DMC 추천 배지 표시 |
| F2 | Activity 편집 | 카드 선택 시 바텀시트에서 제목, 시간, 비용, 노트 편집. 추가로 카테고리, 위치, 1인/그룹 비용, Day 이동 지원. 시간·Day 선택은 네이티브 대신 디자인 시스템 커스텀 UI(시/분 컬럼 피커, 세그먼트 Day 칩) 사용 |
| F3 | Activity 추가·삭제 | Day 하단 “이 날에 일정 추가” 버튼, 삭제 전 커스텀 확인 다이얼로그(`window.confirm` 대체) |
| F4 | 순서 변경 | `motion/react`의 `Reorder` 기반 Day 내 드래그 정렬(드래그 핸들). 정렬 후 위치별 시간 슬롯을 재배정해 하루가 항상 시간순으로 유지됨(시간 보정) |
| F5 | 견적 자동 계산 | 카테고리별 합계, 어린이 70% 가중, 현지 케어 수수료 8%, 총액, 1인당 금액, 예산 잔여액 실시간 계산 |

### 보너스 기능

- DMC 추천 일정과 사용자 추가 일정의 시각적 구분
- 다단계 Undo 스택과 토스트의 “되돌리기” 액션
- 로딩 skeleton, 빈 Day 상태, 에러/성공 토스트
- Day 간 Activity 이동
- 어린이 동선 적합도 도메인 메트릭
- DB가 비어 있을 때 시드 일정 자동 복구

과제의 “입력 폼, 로그인, 결제, LLM API, 실제 항공/숙소 연동”은 의도적으로 구현하지 않았습니다.

## 기술 스택

| 영역 | 사용 기술 |
| --- | --- |
| 프레임워크 | Next.js 16 App Router, React 19, TypeScript |
| 스타일링 | Tailwind CSS v4, `next/font` 기반 Inter |
| UI 모션 | `motion` / `motion/react` |
| API | Next App Router 안에 `/api`로 마운트한 ElysiaJS |
| 타입 안전 클라이언트 | Eden Treaty |
| 데이터베이스 | SQLite |
| ORM | `@prisma/adapter-better-sqlite3` 기반 Prisma 7 |
| 테스트 | `tsx`를 사용하는 Node 내장 테스트 러너 |
| 린트 | ESLint 9 + `eslint-config-next` |

## 빠른 실행

### 요구 사항

- Node.js 20 이상 권장
- npm
- 외부 데이터베이스 서버는 필요하지 않습니다.

### 환경 변수

`.env.example`을 복사해 `.env`를 만듭니다.

```bash
cp .env.example .env
```

필수 값:

| 이름 | 예시 | 설명 |
| --- | --- | --- |
| `DATABASE_URL` | `file:./dev.db` | Prisma CLI와 런타임 어댑터가 사용하는 로컬 SQLite DB 경로 |

### 설치 및 실행

처음 실행할 때:

```bash
npm install
cp .env.example .env
npm run db:reset
npm run dev
```

브라우저에서 아래 주소를 엽니다.

```text
http://localhost:3000
```

이미 의존성 설치와 시드 적재가 끝났다면 개발 서버만 실행하면 됩니다.

```bash
npm run dev
```

아래 주소로도 접근할 수 있습니다.

```text
http://127.0.0.1:3000
```

중요: 변경 요청 API는 `Origin` 헤더를 검증합니다. 같은 호스트를 일관되게 사용해야 합니다. 페이지를 `127.0.0.1`로 열었다면 수동 API 호출도 `Origin: http://127.0.0.1:3000`을 사용하고, `localhost`로 열었다면 `Origin: http://localhost:3000`을 사용합니다.

## 스크립트

| 명령어 | 설명 |
| --- | --- |
| `npm run dev` | Next.js 개발 서버 실행 |
| `npm run build` | 프로덕션 빌드 |
| `npm run start` | 빌드 후 프로덕션 서버 실행 |
| `npm run lint` | ESLint 실행 |
| `npm test` | 단위 테스트 실행 |
| `npm run db:migrate` | 저장소에 포함된 SQLite 스키마 SQL 적용 후 Prisma Client 생성 |
| `npm run db:seed` | 제공된 일정 시드 데이터 재적재 |
| `npm run db:reset` | 로컬 SQLite 스키마와 시드 데이터 재생성 |

## 아키텍처

```text
브라우저 UI
  └─ src/app/page.tsx
      └─ src/components/builder/useBuilder.ts
          ├─ 로컬 UI 상태, undo 스택, toast 상태
          ├─ src/lib/quote.ts의 견적 계산
          ├─ src/lib/kid-fit.ts의 어린이 동선 적합도 계산
          └─ x-oases-action 헤더를 붙이는 fetch 래퍼

Next.js App Router
  └─ src/app/api/[[...slugs]]/route.ts
      └─ 모든 HTTP 메서드를 Elysia로 전달

Elysia API
  └─ src/server/index.ts
      ├─ 검증 스키마
      ├─ 동일 출처 + action 헤더 가드
      ├─ 요청 빈도 제한
      └─ 라우트 핸들러

저장 계층
  └─ src/lib/itinerary-store.ts
      └─ src/lib/prisma.ts의 Prisma Client 싱글톤
          └─ SQLite dev.db
```

### 설계 선택

- `page.tsx`는 화면 조립만 담당하고, 변경 요청 로직은 `useBuilder`에 모았습니다.
- 견적 계산과 어린이 동선 적합도 계산은 React나 DB에 의존하지 않는 순수 함수입니다.
- 변경 API는 처리 후 전체 itinerary를 반환합니다. 클라이언트는 서버 상태로 로컬 상태를 교체하면 되므로 상태 관리가 단순합니다.
- 과제 가이드에 맞춰 별도의 전역 상태 라이브러리는 사용하지 않았습니다.
- DB 쓰기 로직은 `src/lib/itinerary-store.ts`에 집중시켰습니다.

## 데이터 모델

Prisma 스키마는 `prisma/schema.prisma`에 정의되어 있습니다.

```text
Trip
 ├─ Member[]
 └─ Day[]
     └─ Activity[]
```

### 모델

| 모델 | 역할 |
| --- | --- |
| `Trip` | 출발지, 목적지, 날짜, 예산, 선호사항, 메모를 담는 여행 루트 메타데이터 |
| `Member` | 가족 구성원의 이름과 나이. 어린이 비용 가중치 계산에 사용 |
| `Day` | 날짜와 Day 번호를 가진 하루 일정 |
| `Activity` | 카테고리, 시간, 장소, 비용, 추천 여부, 노트, `sortOrder`를 가진 편집 가능한 일정 카드 |

`Activity.category`는 SQLite에는 `String`으로 저장하고, TypeScript/API 레이어에서는 아래 union으로 검증합니다.

```ts
"transport" | "lodging" | "activity" | "food"
```

`Activity.sortOrder`는 Day 안의 정렬 순서를 제어합니다. 새 Activity의 ID는 `crypto.randomUUID()`로 생성합니다.

## API 명세

모든 엔드포인트는 Elysia가 `/api` 아래에서 제공합니다.

| 메서드 | 경로 | 설명 |
| --- | --- | --- |
| `GET` | `/api` | 헬스 체크 |
| `GET` | `/api/itinerary` | 전체 itinerary 조회 |
| `PATCH` | `/api/activities/:id` | 제목, 시간, 비용, 노트, 카테고리, 위치, 1인 비용 여부 수정 |
| `PATCH` | `/api/activities/:id/move` | Activity를 다른 Day로 이동 |
| `POST` | `/api/days/:day/activities` | 특정 Day에 기본 Activity 추가 |
| `DELETE` | `/api/activities/:id` | Activity 삭제 |
| `PATCH` | `/api/days/:day/activities/reorder` | 특정 Day 안에서 Activity 순서 변경 |
| `PUT` | `/api/itinerary` | Undo를 위해 검증된 전체 itinerary 스냅샷 복원 |
| `POST` | `/api/itinerary/reset` | DB를 시드 itinerary로 초기화 |

### 변경 요청 필수 조건

모든 `POST`, `PUT`, `PATCH`, `DELETE` 요청에는 아래 헤더가 필요합니다.

```http
Origin: <요청 URL과 같은 origin>
x-oases-action: itinerary-builder
```

앱의 클라이언트 래퍼(`src/components/builder/shared.ts`)는 `GET`이 아닌 요청에 action 헤더를 자동으로 붙입니다.

### 예시

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

## 비즈니스 로직

### 견적 계산

견적 로직은 `src/lib/quote.ts`에 구현되어 있고, `src/lib/quote.test.ts`에서 검증합니다.

계산 규칙:

- 성인 구성원: `1.0`
- 만 12세 미만 어린이: `0.7`
- `perPerson: true`: `unitCostKRW * weightedHeadcount`
- `perPerson: false`: 가족 전체에 한 번만 적용되는 그룹 비용
- 현지 케어 수수료: `Math.round(subtotal * 0.08)`
- 1인당 금액: `Math.round(total / memberCount)`

시드 데이터 기준 체크포인트:

| 항목 | 예상값 |
| --- | ---: |
| 가중 인원 | `3.4` |
| 소계 | `2,258,600 KRW` |
| 현지 케어 수수료 | `180,688 KRW` |
| 총액 | `2,439,288 KRW` |
| 1인당 금액 | `609,822 KRW` |

### 어린이 동선 적합도

`src/lib/kid-fit.ts`는 0-100 사이의 어린이 동선 적합도 점수를 결정적으로 계산합니다.

판단 기준:

- 가점: 어린이, 키즈, 공원, 박물관 같은 어린이 친화 키워드
- 경고: 유모차 이동 어려움, 늦은 종료 시간, 긴 단일 일정, 대응되지 않은 알레르기/매운 음식 위험
- 미적용: 만 12세 미만 어린이가 없는 경우

이 점수는 `KidFitCard`와 견적 상세 시트에서 보여줍니다.

## 보안

과제에서 계정/인증 흐름은 제외했으므로, 이 프로젝트는 인증 없는 로컬 빌더 화면의 요청 표면을 안전하게 좁히는 데 집중했습니다.

### 요청 보안

- 변경 요청은 동일 출처 `Origin`을 요구합니다.
- 변경 요청은 `x-oases-action: itinerary-builder`를 요구합니다.
- 변경 요청에는 `x-forwarded-for` 기준 분당 80회의 메모리 기반 요청 빈도 제한을 적용합니다.
- Elysia `t` 스키마로 params와 body를 검증합니다.
- 전체 itinerary 복원 엔드포인트는 스냅샷 전체 구조를 검증합니다.

### 입력 검증

- ID: `^[\w-]+$`, 최대 80자
- Day 번호: 1-31
- 시간: `HH:mm` 24시간 형식
- 비용: `0`부터 `10,000,000`까지
- 제목/위치/노트 길이 제한
- 카테고리 enum 검증

### 브라우저 및 런타임 보안

- React 기본 escaping을 사용하며 `dangerouslySetInnerHTML`은 사용하지 않습니다.
- API 핸들러에서는 Prisma ORM만 사용하고 raw SQL은 사용하지 않습니다.
- `next.config.ts`에 보안 헤더를 설정했습니다.
  - `Content-Security-Policy`
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy`
  - `X-Frame-Options: DENY`

참고: `prisma/apply-migration.ts`는 로컬 disposable SQLite DB 초기화를 위해 저장소에 포함된 SQL 파일을 실행합니다. 런타임 API로 노출되지 않습니다.

## UI/UX 설계

이 UI는 내부 관리자 대시보드가 아니라 여행 계획을 검토하는 가족 고객을 기준으로 설계했습니다.

### 레이아웃

- `max-width: 640px`의 모바일 우선 단일 컬럼
- 여행 일정을 훑어보는 방식에 맞춘 Day 기반 세로 타임라인
- 총액과 1인당 금액을 항상 확인할 수 있는 하단 고정 견적 바
- 화면 전환 없이 상세 견적을 확인할 수 있는 바텀시트

### 상호작용

- Activity 카드를 누르면 편집 시트가 열립니다.
- 드래그 핸들로만 정렬을 시작해 일반 스크롤 중 실수로 카드가 끌리는 상황을 줄였습니다.
- 삭제는 커스텀 확인 다이얼로그를 사용합니다.
- Undo는 스냅샷 스택과 전체 itinerary 복원 엔드포인트를 사용합니다.
- 성공/실패 피드백은 토스트로 보여주고, 필요한 경우 되돌리기 액션을 함께 제공합니다.
- 주요 애니메이션 컴포넌트는 reduced-motion 설정을 존중합니다.

### 디자인 시스템

- 가독성을 우선한 grayscale 중심 팔레트
- 주요 액션과 DMC/전문가 강조에만 muted blue 사용
- 상태와 위험 표현에 green/amber/red 사용
- `next/font` 기반 Inter 폰트 사용
- 가능한 영역에는 44px 이상의 터치 타깃 적용
- 금액 정렬을 위한 tabular numerals 사용

## 테스트와 검증

### 자동 검증

제출 전에 아래 명령어를 실행합니다.

```bash
npm run db:reset
npm test
npm run lint
npm run build
```

현재 테스트 범위:

- `src/lib/quote.test.ts`
  - 어린이 가중치
  - 카테고리별 소계 계산
  - 시드 데이터 견적 체크포인트
- `src/lib/kid-fit.test.ts`
  - 어린이 동반 가족 적용 여부
  - 유모차 경고 감지
  - 성인만 있는 경우의 기본 처리
  - 결정적 출력

### 수동 스모크 테스트

1. 앱을 실행합니다.

   ```bash
   npm run dev
   ```

2. `http://localhost:3000`을 엽니다.
3. 아래 항목을 확인합니다.
   - Day 1-5가 렌더링됩니다.
   - Activity 카드에 제목, 시간, 위치, 카테고리, 비용, DMC 배지가 표시됩니다.
   - 카드를 누르면 편집 시트가 열립니다.
   - 제목/시간/비용/노트가 저장됩니다.
   - Activity 추가/삭제 시 UI와 견적이 갱신됩니다.
   - 드래그 정렬 시 순서가 바뀝니다.
   - 견적 상세 시트에 카테고리별 합계, 8% 케어 수수료, 총액, 1인당 금액이 표시됩니다.
   - 초기화하면 시드 데이터로 복원됩니다.

### API 스모크 테스트

브라우저를 `http://localhost:3000`으로 열었다면 아래 명령어를 사용합니다.

```bash
curl -s http://localhost:3000/api
curl -s http://localhost:3000/api/itinerary

curl -X POST http://localhost:3000/api/days/1/activities \
  -H 'Origin: http://localhost:3000' \
  -H 'x-oases-action: itinerary-builder'
```

브라우저를 `http://127.0.0.1:3000`으로 열었다면 URL과 `Origin` 호스트를 모두 `127.0.0.1`로 바꿉니다.

보안 확인:

```bash
# action 헤더 누락 시 -> 403
curl -X POST http://localhost:3000/api/days/1/activities \
  -H 'Origin: http://localhost:3000'

# 잘못된 origin -> 403
curl -X POST http://localhost:3000/api/itinerary/reset \
  -H 'Origin: http://evil.test' \
  -H 'x-oases-action: itinerary-builder'
```

## 프로젝트 구조

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

생성 파일 또는 로컬 전용 파일:

- `dev.db`: 로컬 SQLite DB, gitignore 대상
- `src/generated/prisma/`: 생성된 Prisma Client, gitignore 대상
- `.next/`: Next.js 빌드 결과물, gitignore 대상
- `node_modules/`: 의존성 설치 디렉터리, gitignore 대상

## 제출 체크리스트

과제 필수 제출물:

- 코드
- `README.md`
- `prompts.md`

제출 전 권장 확인:

```bash
rm -rf .next
npm run db:reset
npm test
npm run lint
npm run build
```

제출 이메일:

```text
linkovation.official@gmail.com
```

메일 제목 형식:

```text
[Oases Codingtest 과제] {지원자 이름}
```

## 구현 참고 사항

### Prisma 7과 SQLite

Prisma 7은 더 이상 `schema.prisma` 안에 DB URL을 저장하지 않습니다. 이 프로젝트는 아래처럼 분리했습니다.

- CLI datasource URL은 `prisma.config.ts`에서 관리합니다.
- 런타임 datasource URL은 `src/lib/prisma.ts`에서 `PrismaBetterSqlite3`로 전달합니다.

`npm run db:migrate`는 저장소에 포함된 SQLite 스키마 SQL을 `better-sqlite3`로 적용한 뒤 `prisma generate`를 실행합니다. DB는 코딩 과제용 로컬 disposable 상태로 보고, `dev.db`는 gitignore 대상입니다.

### 과제 범위와 영속성

과제 문서에는 DB 영속성이 필수가 아니라고 되어 있습니다. 하지만 사용자 요청에서 SQLite + Prisma 기반 구현을 명시했기 때문에 서버 저장형으로 구현했습니다. 이 차이를 평가자가 이해할 수 있도록 README에 의도적으로 남겼습니다.

### 제품 내 LLM/API 미사용

제품 자체는 LLM이나 외부 AI API를 호출하지 않습니다. AI 활용 내역은 `prompts.md`에 개발 과정 기록으로만 남겼고, 과제의 “AI Native 활용도” 평가 항목을 충족하되 제품 기능에는 AI를 넣지 않았습니다.

## 문제 해결

### Prisma Client import가 실패할 때

아래 명령어를 실행합니다.

```bash
npm run db:migrate
```

이 명령어는 `src/generated/prisma/`를 다시 생성합니다.

### 앱은 켜졌지만 일정이 보이지 않을 때

로컬 DB를 초기화합니다.

```bash
npm run db:reset
```

DB에 Trip이 없으면 `GET /api/itinerary`가 시드 데이터를 자동 복구하기도 합니다.

### 변경 API 요청이 403을 반환할 때

페이지와 API 요청에서 같은 호스트를 사용하고 action 헤더를 포함합니다.

```http
Origin: http://localhost:3000
x-oases-action: itinerary-builder
```

앱을 `http://127.0.0.1:3000`으로 열었다면 수동 API 호출에서도 `Origin: http://127.0.0.1:3000`을 사용합니다.

### 왜 `db:migrate`가 `prisma migrate dev`를 호출하지 않나요?

이 로컬 설정에서는 `npm run db:migrate`가 저장소에 포함된 SQLite migration SQL을 적용한 뒤 `prisma generate`를 실행합니다. 이렇게 하면 Prisma Client와 Prisma schema를 앱의 데이터 계약으로 유지하면서도, 코딩 과제용 DB 초기화를 결정적으로 재현할 수 있습니다.

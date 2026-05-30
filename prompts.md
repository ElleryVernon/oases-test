# prompts.md

## User Prompt

해당 파일 기반으로 1차 구현

1. sqllite + prisma 기반으로 구현
2. 보안을 최우선시 할것

Referenced file: `/Users/danhobag/Downloads/Oases_CodingTest.docx`

## Planning Summary

- Read the coding-test document and extracted the Mini Oases Itinerary Builder requirements.
- Chose the required F1-F5 implementation scope with SQLite + Prisma persistence.
- Kept login/signup out of scope, matching the assignment, and prioritized request validation, same-origin checks, custom action headers, rate limiting, security headers, Prisma ORM usage, and React escaping.

## Implementation Summary

- Replaced the initial Post demo with itinerary-oriented Prisma models.
- Added typed seed itinerary data and a Prisma seed script.
- Added Elysia API endpoints for loading, editing, adding, deleting, reordering, and resetting itinerary activities.
- Added pure quote calculation functions and tests.
- Rebuilt the homepage as a single-page itinerary builder with live quote calculation.

---

## User Prompt (2차 — UI/UX 개선 + 추가 구현 목표)

> amoeba-main 프로젝트의 유저 친화적 UIUX, 디자인시스템을 꼼꼼히 분석·참고해서 oases 프로젝트 개선,
> 현재 프로젝트의 구현 목표는 docx 파일 참고, 이번 턴에서 추가 구현 목표까지 달성

Referenced: `/Users/danhobag/Downloads/Oases_CodingTest.docx`, `/Users/danhobag/Downloads/amoeba-main`

## Planning Summary (2차)

- Extracted the full coding-test spec (F1–F5 필수, 3.5 보너스, 부록 A 시드, 부록 B 견적 공식·체크포인트).
- Analyzed amoeba's design system: Toss-style monochrome gray palette, single blue accent, Inter font, filled inputs, `rounded-xl/2xl`, `.btn-*`/`.card`/`.option` utilities, GSAP-driven stagger/modal/press animations, mobile-first responsive cards.
- Decided to (a) port that design language into oases tokens and (b) implement the remaining 3.5 bonus features as "추가 구현 목표".

## Implementation Summary (2차)

- **Design system**: rewrote `globals.css` with Toss tokens (gray 50–900, blue/green/red/amber, Inter via `next/font`), `.btn-primary/secondary/ghost`, filled `.input`, `.pill`/`.chip`, and CSS keyframe animations (`animate-rise/pop/fade`, skeleton shimmer) replacing GSAP to avoid adding a dependency.
- **Backend (bonus)**: extended `PATCH /activities/:id` (category/location/perPerson), added `PATCH /activities/:id/move` (Day 간 이동) and `PUT /itinerary` (validated full-snapshot restore for undo); generalized the store with `writeItinerary`/`restoreItinerary`/`moveActivity`.
- **Domain metric**: added pure `src/lib/kid-fit.ts` (`calcKidFit`) + tests for 어린이 동선 적합도.
- **UI rewrite**: `page.tsx` rebuilt with Toss aesthetic, skeleton loading, toast notifications, category filter chips, DMC/user visual distinction, bottom-sheet edit modal (category/time/cost/note/location/perPerson/day-move), multi-step undo, redesigned quote panel with budget progress bar, and the kid-fit panel.
- **Verification**: `npm test` (7 pass — quote checkpoint exact), `npm run lint` (clean), `npm run build` (pass); browser-verified desktop/mobile layouts, modal, and curl-verified new endpoints (move 200, 403 without action header, restore 200, malformed restore 422).

## Tools used

- Claude Code (Opus) — spec extraction (docx→xml via node), design-system analysis, code generation, Preview MCP for visual/interaction verification.

---

## User Prompt (3차 — B2C 가족 친화 재설계)

> 너는 토스의 UIUX 리드 디자이너야. 토스의 디자인 철학을 검색해 참고하고, 단순 CSS가 아니라 유저 친화적 UIUX/레이아웃으로 **재설계 및 완전한 개선**을 해라. 정렬 그리드를 지키고, 데이터 계층을 고려해 컬러/레이아웃/컴포넌트 크기/텍스트 볼드·크기를 적용해라. 지금은 **백오피스에 가까운데**, 우리 목표는 빌더가 아니라 **B2C 고객인 "가족"**이 직접 추가/편집/순서변경하는 화면이다.

## Planning (3차)

- WebSearch/WebFetch로 Toss 디자인 철학 조사(급진적 단순함, 한 과업 집중, UX 라이팅, 인지부하 최소화, 행동 유도 설계).
- Explore 에이전트로 amoeba의 B2C 소비자 플로우(landing/create-trip/view-trip) 패턴 카탈로그 확보.
- 현재 빌더를 비판적으로 진단: 2단 대시보드·작은 아이콘 4개·상단 필터 칩·개발자 말투·카드 더미 = 백오피스 신호.
- AskUserQuestion으로 3개 확정: ① 순서변경=**드래그앤드롭**, ② 레이아웃=**단일 컬럼+고정 견적 바**, ③ 부가기능=재량껏 B2C 최적화. 계획을 plan 파일로 작성 후 승인.

## Implementation (3차)

- `motion`(framer-motion) 도입 → `Reorder` 드래그 정렬(손잡이 `useDragControls`로 스크롤 충돌 회피, `onDragEnd` 1회 커밋 + 실패 롤백), `AnimatePresence` 추가/삭제, 바텀시트 slide-up.
- UI를 `src/components/builder/`로 컴포넌트화 + `useBuilder` 훅으로 상태/뮤테이션 분리, `page.tsx`는 조립.
- **단일 컬럼 레이아웃**: TripHero(라우트 펄/따뜻한 메모) → KidFit 신뢰 카드 → 하루 단위 **세로 타임라인**(시간 레일+점+드래그 카드) → 하단 **고정 견적 바** → 견적/적합도 **상세 시트**, 편집은 **바텀시트**.
- **디자인 시스템 정리**: 모노크롬 강화(4색 카테고리 칩 → 중립 아이콘), 블루는 CTA·총액·게이지·전문가 배지에만, 고정 타이포 스케일, `tabular-nums` 금액 정렬, 따뜻한 한국어 마이크로카피.
- 카테고리 필터는 B2C 단순화를 위해 기본 화면에서 제거(백엔드/타입 유지). "DMC 추천" → "여행 전문가 추천", Undo는 토스트 액션으로도.
- **백엔드/도메인 로직 무변경** — 견적 체크포인트(2,439,288) 유지.

## Verification (3차)

- `npm run lint`(clean, React refs/effect 규칙까지) · `npm test`(7 pass) · `npm run build`(pass).
- Preview MCP: 모바일 Hero/타임라인/고정 바 스크린샷, 견적 시트·편집 시트 확인, **드래그 정렬 시뮬레이션**(1→4 이동) + 서버 반영 확인, 데스크톱 중앙정렬(컬럼 313→953/640px) 측정, console 에러 0.
- curl 회귀: reorder 200 · 403(헤더 없음) · move 200 · reset 200. 마무리 시드 복원.


---

## User Prompt (4차 — 디테일 폴리시 반복)

> 색상 계층·드래그 디테일·네이티브 UI 제거 등을 여러 차례 피드백으로 반복 요청.

## Implementation (4차)

- **컬러 팔레트 정제**: 원색에 가까운 blue/green/amber/red를 톤다운한 뮤트 팔레트로 토큰 재정의(`globals.css @theme`). 의미별 고정(blue=브랜드/전문가, green=긍정, amber=주의, red=문제)으로 계층 강화. (한때 흑백화했다가 계층이 죽어 되돌리고 톤만 정제.)
- **데이터 계층 색상**: 카드 비용을 제목보다 가벼운 gray-700로, ₩0→"무료", 전문가 배지를 채운 알약→연한 캡션, 노트는 평문화. 견적 시트는 라인항목(gray-700)<소계(gray-900 bold)<총액(다크 카드) 영수증 위계.
- **드래그 개선**: `Reorder.Item as="div"`로 네이티브 `<li>` 불릿 제거, 드래그 쉐도우를 자연스러운 lift로 + 상태 기반 보장 리셋(잔상 제거).
- **시간 보정**: 정렬 시 위치별 시간 슬롯 재배정(서버 `reorderDayActivities`)으로 하루가 항상 시간순 유지.
- **네이티브 UI 제거**: `input type=time`→커스텀 시/분 컬럼 피커(`TimeField`), `<select>` 옮길날→세그먼트 Day 칩, `window.confirm`→Promise 기반 커스텀 `ConfirmDialog`(한국어 `word-break: keep-all` 줄바꿈).
- **타임라인**: 시간과 카드 사이에 정렬된 닷 + 세로 연결선 복원.

## Verification (4차)

- lint·build·test(7 pass) green.
- Preview MCP: 드래그+시간보정(슬롯 재배정) 확인, 잔상 쉐도우 없음, `<li>` 0개, 커스텀 시간 피커·Day 칩·확인 다이얼로그(줄바꿈 keep-all) 스크린샷 검증.

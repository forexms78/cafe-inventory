# 대시보드 통합 + PWA 설계 문서

**날짜:** 2026-04-22  
**프로젝트:** cafe-inventory  
**승인된 방향:** 메인 하단 재고 부족 섹션을 `/dashboard` 페이지로 이전 통합 + PWA 설정

---

## 1. 대시보드 페이지 (`/dashboard`)

### 목적
메인 페이지 하단에 있던 "재고 부족 알림 섹션"을 전용 대시보드 페이지로 이전.  
요약 숫자 카드를 상단에 추가해 한눈에 재고 상태를 파악할 수 있게 함.

### 구성 요소

**요약 카드 (상단 4개)**
- 전체 품목 수
- 부족 품목 수 (danger)
- 주의 품목 수 (warning)
- 정상 품목 수

**카테고리별 부족 현황 (하단 그리드)**
- 기존 `page.tsx`의 "재고 부족 알림 섹션" 로직 그대로 이전
- 카테고리당 카드 1개, 부족·주의 품목 목록 표시
- 품목 클릭 시 메인 페이지(`/`)로 이동 (카테고리 이동은 이번 범위 외)

### 데이터 페칭
- `fetch('/api/items', { cache: 'no-store' })` — 서버 컴포넌트에서 SSR
- `getStockStatus` 유틸 재사용

### 파일
- `app/dashboard/page.tsx` — 신규 생성

---

## 2. 메인 페이지 정리 (`app/page.tsx`)

- 줄 625~686 "재고 부족 알림 섹션" 전체 제거
- 나머지 로직 변경 없음

---

## 3. 메뉴 드로어 진입점 (`components/MenuDrawer.tsx`)

- "화면" 섹션에 "대시보드" MenuItem 추가
- `router.push('/dashboard')` 실행

---

## 4. PWA 설정

### `public/manifest.json`
```json
{
  "name": "디저트39 재고관리",
  "short_name": "재고관리",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#fdf2f8",
  "theme_color": "#ec4899",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

### 아이콘
- `public/icon-192.png`, `public/icon-512.png` — Node.js 스크립트로 생성 (핑크 배경 + "재고" 텍스트)
- `public/apple-touch-icon.png` — iOS 홈 화면용 180×180

### `app/layout.tsx` 메타데이터 추가
```ts
export const metadata: Metadata = {
  title: "재고 관리",
  description: "디저트39 신사역점 재고관리",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "재고관리" },
  themeColor: "#ec4899",
};
```

---

## 5. 변경 파일 목록

| 파일 | 변경 유형 |
|------|---------|
| `app/dashboard/page.tsx` | 신규 생성 |
| `app/page.tsx` | 재고 부족 섹션 제거 |
| `components/MenuDrawer.tsx` | 대시보드 MenuItem 추가 |
| `app/layout.tsx` | PWA 메타데이터 추가 |
| `public/manifest.json` | 신규 생성 |
| `public/icon-192.png` | 신규 생성 |
| `public/icon-512.png` | 신규 생성 |

---

## 6. 범위 외 (이번 구현에 포함 안 함)

- 서비스 워커 / 오프라인 지원
- 푸시 알림
- 대시보드 새로고침 버튼 (SSR이므로 페이지 리로드로 충분)

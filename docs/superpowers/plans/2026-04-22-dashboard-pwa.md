# Dashboard + PWA Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 메인 페이지 하단 재고 부족 섹션을 `/dashboard` 페이지로 이전하고, PWA 설정으로 스마트폰 홈 화면에 앱처럼 추가할 수 있게 한다.

**Architecture:** Dashboard는 App Router 서버 컴포넌트로 구현해 SSR로 데이터를 바로 렌더링한다. 아이콘은 Next.js의 `ImageResponse`(`next/og`)를 사용해 빌드 타임에 생성하고, manifest는 `app/manifest.ts` 파일 컨벤션을 활용한다.

**Tech Stack:** Next.js 16 App Router, TypeScript, Tailwind CSS, next/og(ImageResponse)

---

### Task 1: 대시보드 페이지 생성

**Files:**
- Create: `app/dashboard/page.tsx`

- [ ] **Step 1: `app/dashboard/page.tsx` 생성**

서버 컴포넌트에서 Supabase 직접 쿼리 (API 라우트 경유 불필요).

```tsx
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { Item, CATEGORIES, getStockStatus } from '@/types';

async function getItems(): Promise<Item[]> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { data } = await supabase
    .from('items')
    .select('*')
    .order('sort_order', { nullsFirst: false });
  return data ?? [];
}

export default async function DashboardPage() {
  const items = await getItems();

  const danger = items.filter(i => getStockStatus(i) === 'danger');
  const warning = items.filter(i => getStockStatus(i) === 'warning');
  const ok = items.filter(i => getStockStatus(i) === 'ok');

  return (
    <main className="max-w-lg mx-auto px-4 py-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-pink-700" style={{ fontFamily: 'var(--font-jua)' }}>
          재고 현황
        </h1>
        <Link
          href="/"
          className="text-xs text-pink-400 border border-pink-200 rounded-full px-3 py-1.5 bg-white hover:bg-pink-50 transition-colors"
        >
          메인으로
        </Link>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-4 gap-2 mb-6">
        <div className="bg-white border border-pink-100 rounded-xl p-3 text-center shadow-sm">
          <p className="text-xl font-bold text-pink-700">{items.length}</p>
          <p className="text-xs text-gray-400 mt-0.5">전체</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-center shadow-sm">
          <p className="text-xl font-bold text-red-600">{danger.length}</p>
          <p className="text-xs text-gray-400 mt-0.5">부족</p>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 text-center shadow-sm">
          <p className="text-xl font-bold text-orange-500">{warning.length}</p>
          <p className="text-xs text-gray-400 mt-0.5">주의</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center shadow-sm">
          <p className="text-xl font-bold text-emerald-600">{ok.length}</p>
          <p className="text-xs text-gray-400 mt-0.5">정상</p>
        </div>
      </div>

      {/* 카테고리별 현황 */}
      <h2 className="text-sm font-semibold text-pink-400 uppercase tracking-wider mb-3">카테고리별 부족 현황</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {CATEGORIES.map(category => {
          const catItems = items.filter(i => i.category === category);
          const dangerItems = catItems.filter(i => getStockStatus(i) === 'danger');
          const warningItems = catItems.filter(i => getStockStatus(i) === 'warning');
          const lowItems = [...dangerItems, ...warningItems];
          const isOk = lowItems.length === 0;

          return (
            <div key={category} className="bg-white rounded-2xl border border-pink-100 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-pink-50 bg-pink-50/50">
                <span className="font-bold text-pink-700 text-sm" style={{ fontFamily: 'var(--font-jua)' }}>
                  {category}
                </span>
                {isOk && (
                  <span className="text-xs text-emerald-500 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                    정상
                  </span>
                )}
              </div>
              {isOk ? (
                <p className="px-4 py-2.5 text-xs text-gray-400">모든 품목이 충분합니다.</p>
              ) : (
                <div className="divide-y divide-pink-50">
                  {dangerItems.map(item => (
                    <Link key={item.id} href="/" className="flex items-center justify-between px-4 py-2.5 bg-red-50/40 hover:bg-red-100/60 transition-colors">
                      <span className="text-sm text-gray-800 font-medium">{item.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">최소 {item.min_qty}</span>
                        <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">재고 {item.stock}</span>
                      </div>
                    </Link>
                  ))}
                  {warningItems.map(item => (
                    <Link key={item.id} href="/" className="flex items-center justify-between px-4 py-2.5 bg-yellow-50/40 hover:bg-yellow-100/60 transition-colors">
                      <span className="text-sm text-gray-800 font-medium">{item.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">최소 {item.min_qty}</span>
                        <span className="text-xs font-semibold text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded-full">{item.stock} / {item.min_qty}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </main>
  );
}
```

- [ ] **Step 2: 커밋**

```bash
git add app/dashboard/page.tsx
git commit -m "feat: 대시보드 페이지 추가 (/dashboard)"
```

---

### Task 2: 메인 페이지 하단 재고 부족 섹션 제거

**Files:**
- Modify: `app/page.tsx` (재고 부족 알림 섹션 블록 삭제)

- [ ] **Step 1: `app/page.tsx` 에서 재고 부족 알림 섹션 제거**

아래 블록 전체 삭제 (약 60줄):
```tsx
      {/* 재고 부족 알림 섹션 */}
      <div data-explodable>
        ...
      </div>
```
`{/* 전체 초기화 확인 다이얼로그 */}` 바로 위까지가 제거 대상.

- [ ] **Step 2: `handleAlertClick` 함수 제거**

이 함수는 재고 부족 섹션에서만 사용됨 (line 190-197). 섹션 제거 후 함께 삭제:
```tsx
// 이 함수 블록 전체 삭제
const handleAlertClick = (item: Item) => {
  setActiveCategory(item.category);
  setHighlightedId(item.id);
  setTimeout(() => {
    document.getElementById(`item-${item.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, 100);
  setTimeout(() => setHighlightedId(null), 2500);
};
```

- [ ] **Step 3: 커밋**

```bash
git add app/page.tsx
git commit -m "refactor: 메인 페이지 하단 재고 부족 섹션 제거 (대시보드로 이전)"
```

---

### Task 3: 메뉴 드로어에 대시보드 링크 추가

**Files:**
- Modify: `components/MenuDrawer.tsx`

- [ ] **Step 1: "화면" 섹션에 대시보드 MenuItem 추가**

`components/MenuDrawer.tsx` 에서 변경 로그 MenuItem 바로 아래에 추가:

```tsx
<MenuItem label="변경 로그" onClick={() => router.push('/logs')} />
<MenuItem label="대시보드" onClick={() => router.push('/dashboard')} />
```

- [ ] **Step 2: 커밋**

```bash
git add components/MenuDrawer.tsx
git commit -m "feat: 메뉴 드로어에 대시보드 링크 추가"
```

---

### Task 4: PWA 아이콘 생성 (ImageResponse)

**Files:**
- Create: `app/icon.tsx`
- Create: `app/apple-icon.tsx`

- [ ] **Step 1: `app/icon.tsx` 생성**

Next.js App Router의 파일 컨벤션. 빌드 시 `/icon.png` 로 서빙됨.

```tsx
import { ImageResponse } from 'next/og';

export const size = { width: 192, height: 192 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #ec4899, #be185d)',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '40px',
        }}
      >
        <div
          style={{
            color: 'white',
            fontSize: 80,
            fontWeight: 700,
            letterSpacing: '-2px',
          }}
        >
          재고
        </div>
      </div>
    ),
    { ...size }
  );
}
```

- [ ] **Step 2: `app/apple-icon.tsx` 생성**

iOS 홈 화면 아이콘. `/apple-icon.png` 로 서빙됨.

```tsx
import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #ec4899, #be185d)',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            color: 'white',
            fontSize: 76,
            fontWeight: 700,
            letterSpacing: '-2px',
          }}
        >
          재고
        </div>
      </div>
    ),
    { ...size }
  );
}
```

- [ ] **Step 3: 커밋**

```bash
git add app/icon.tsx app/apple-icon.tsx
git commit -m "feat: PWA 아이콘 추가 (ImageResponse)"
```

---

### Task 5: PWA manifest 및 layout 메타데이터

**Files:**
- Create: `app/manifest.ts`
- Modify: `app/layout.tsx`

- [ ] **Step 1: `app/manifest.ts` 생성**

Next.js App Router 파일 컨벤션. `/manifest.json` 으로 서빙됨.

```ts
import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '디저트39 재고관리',
    short_name: '재고관리',
    description: '디저트39 신사역점 재고관리 앱',
    start_url: '/',
    display: 'standalone',
    background_color: '#fdf2f8',
    theme_color: '#ec4899',
    icons: [
      { src: '/icon.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon.png', sizes: '512x512', type: 'image/png' },
    ],
  };
}
```

- [ ] **Step 2: `app/layout.tsx` 메타데이터 업데이트**

기존 `metadata` 객체를 아래로 교체:

```ts
export const metadata: Metadata = {
  title: '재고 관리',
  description: '디저트39 신사역점 재고관리',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: '재고관리',
  },
};
```

- [ ] **Step 3: 커밋**

```bash
git add app/manifest.ts app/layout.tsx
git commit -m "feat: PWA manifest 및 메타데이터 추가"
```

---

### Task 6: 최종 배포

**Files:**
- `README.md`

- [ ] **Step 1: git push → Vercel 자동 배포**

```bash
git push
```

- [ ] **Step 2: README 버전 히스토리 업데이트**

`README.md` 의 `## 버전 히스토리` 테이블 맨 위에 추가:
```markdown
| v2.2 | 2026-04-22 | 대시보드 페이지 추가, 메인 하단 정리, PWA 설정 |
```

```bash
git add README.md
git commit -m "docs: README v2.2 버전 히스토리 추가"
git push
```

- [ ] **Step 5: 브라우저에서 검증**

1. https://cafe-inventory.vercel.app/dashboard — 요약 카드 + 카테고리 현황 표시 확인
2. 메뉴 드로어 열기 → "대시보드" 항목 클릭 → 페이지 이동 확인
3. Chrome → 주소창 오른쪽 설치 아이콘 확인 (PWA installable)
4. iOS Safari → 공유 버튼 → "홈 화면에 추가" → 아이콘 확인

# Cafe Inventory App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 카페 재고 관리 웹앱 — 7개 카테고리 탭, 재고 수정/추가/삭제, 오너/매니저 롤 기반 인증, Vercel 배포

**Architecture:** Next.js 14 (App Router) + Supabase (DB + 인증 없이 커스텀 비밀번호 테이블). 단일 페이지에 탭으로 카테고리 전환. Supabase client를 Next.js에서 직접 호출. 비밀번호는 bcrypt 해시 후 Supabase에 저장하고, 세션은 localStorage + Next.js middleware로 관리.

**Tech Stack:** Next.js 14 (App Router), TypeScript, Tailwind CSS, Supabase (PostgreSQL), bcryptjs, shadcn/ui

---

## Supabase 테이블 스키마

```sql
-- items 테이블
CREATE TABLE items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  category text NOT NULL CHECK (category IN ('파우더','시럽','이외품목','베이커리','오믈렛및마카롱','도쿄롤','케익')),
  name text NOT NULL,
  min_qty text NOT NULL DEFAULT '1',
  stock numeric NOT NULL DEFAULT 0,
  office_stock numeric,
  expiry_date text,
  created_at timestamptz DEFAULT now()
);

-- users 테이블
CREATE TABLE cafe_users (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  role text NOT NULL CHECK (role IN ('owner', 'manager')),
  password_hash text NOT NULL,
  created_at timestamptz DEFAULT now()
);
```

## 파일 구조

```
cafe-inventory/
├── app/
│   ├── layout.tsx              # 루트 레이아웃
│   ├── page.tsx                # 메인 페이지 (탭 + 재고 목록)
│   ├── api/
│   │   ├── auth/route.ts       # 로그인 API
│   │   └── items/route.ts      # 재고 CRUD API
│   └── globals.css
├── components/
│   ├── LowStockBanner.tsx      # 상단 재고 부족 알림
│   ├── CategoryTabs.tsx        # 7개 카테고리 탭
│   ├── ItemTable.tsx           # 재고 테이블
│   ├── ItemRow.tsx             # 개별 품목 행
│   ├── QuantityModal.tsx       # 수량 수정 모달
│   ├── AddItemModal.tsx        # 품목 추가 모달
│   ├── LoginModal.tsx          # 비밀번호 입력 모달
│   └── ChangePasswordModal.tsx # 비밀번호 변경 모달 (오너 전용)
├── lib/
│   ├── supabase.ts             # Supabase 클라이언트
│   ├── auth.ts                 # 인증 유틸 (로그인/세션)
│   └── seed-data.ts            # 초기 데이터 (엑셀 기반)
├── types/
│   └── index.ts                # Item, User, Category 타입
├── .env.local                  # NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
└── middleware.ts               # 세션 검증 (읽기는 허용, 수정은 인증 필요)
```

---

## Task 1: 프로젝트 생성 및 기본 세팅

**Files:**
- Create: `cafe-inventory/` (Next.js 프로젝트 루트)
- Create: `.env.local`
- Create: `lib/supabase.ts`
- Create: `types/index.ts`

- [ ] **Step 1: Next.js 프로젝트 생성**

```bash
cd /Users/bellboi/code
npx create-next-app@latest cafe-inventory --typescript --tailwind --eslint --app --no-src-dir --import-alias "@/*"
cd cafe-inventory
```

- [ ] **Step 2: 의존성 설치**

```bash
npm install @supabase/supabase-js bcryptjs
npm install -D @types/bcryptjs
npx shadcn@latest init -d
npx shadcn@latest add button input dialog tabs badge
```

- [ ] **Step 3: .env.local 생성**

```env
NEXT_PUBLIC_SUPABASE_URL=https://xqnmnnyxqthpzgspzfpn.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon_key>
SUPABASE_SERVICE_ROLE_KEY=<service_role_key>
```

- [ ] **Step 4: types/index.ts 작성**

```typescript
export type Category = '파우더' | '시럽' | '이외품목' | '베이커리' | '오믈렛및마카롱' | '도쿄롤' | '케익';

export const CATEGORIES: Category[] = ['파우더', '시럽', '이외품목', '베이커리', '오믈렛및마카롱', '도쿄롤', '케익'];

export interface Item {
  id: string;
  category: Category;
  name: string;
  min_qty: string;
  stock: number;
  office_stock?: number | null;
  expiry_date?: string | null;
  created_at: string;
}

export type StockStatus = 'danger' | 'warning' | 'ok';

export function getStockStatus(item: Item): StockStatus {
  const stock = item.stock;
  const min = parseFloat(item.min_qty) || 0;
  if (stock === 0) return 'danger';
  if (stock < min) return 'warning';
  return 'ok';
}

export type Role = 'owner' | 'manager';

export interface CafeUser {
  id: string;
  name: string;
  role: Role;
}
```

- [ ] **Step 5: lib/supabase.ts 작성**

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

- [ ] **Step 6: Supabase에서 테이블 생성**

Supabase 대시보드 SQL Editor에서 실행:
```sql
CREATE TABLE items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  category text NOT NULL CHECK (category IN ('파우더','시럽','이외품목','베이커리','오믈렛및마카롱','도쿄롤','케익')),
  name text NOT NULL,
  min_qty text NOT NULL DEFAULT '1',
  stock numeric NOT NULL DEFAULT 0,
  office_stock numeric,
  expiry_date text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE cafe_users (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  role text NOT NULL CHECK (role IN ('owner', 'manager')),
  password_hash text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE cafe_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow all" ON items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow all" ON cafe_users FOR ALL USING (true) WITH CHECK (true);
```

- [ ] **Step 7: git 초기화 및 GitHub 레포 생성**

```bash
cd /Users/bellboi/code/cafe-inventory
git init
git add .
git commit -m "feat: initial Next.js project setup"
gh repo create cafe-inventory --public --source=. --remote=origin --push
```

---

## Task 2: 초기 데이터 시딩

**Files:**
- Create: `lib/seed-data.ts`
- Create: `app/api/seed/route.ts`

- [ ] **Step 1: seed-data.ts 작성 (엑셀 데이터 기반)**

```typescript
import { Category } from '@/types';

export interface SeedItem {
  category: Category;
  name: string;
  min_qty: string;
  stock: number;
  office_stock?: number;
  expiry_date?: string;
}

export const SEED_DATA: SeedItem[] = [
  // 파우더
  { category: '파우더', name: '밀크베이스', min_qty: '2', stock: 1 },
  { category: '파우더', name: '프리미엄베이스', min_qty: '1', stock: 1 },
  { category: '파우더', name: '밀크쉐이크', min_qty: '2', stock: 2 },
  { category: '파우더', name: '프로틴', min_qty: '1', stock: 1 },
  { category: '파우더', name: '말차', min_qty: '2', stock: 1 },
  { category: '파우더', name: '흑임자', min_qty: '1', stock: 0 },
  { category: '파우더', name: '17곡', min_qty: '1', stock: 1 },
  { category: '파우더', name: '밤(시즌 한정)', min_qty: '2', stock: 1 },
  { category: '파우더', name: '블루베리', min_qty: '1', stock: 1 },
  { category: '파우더', name: '바나나', min_qty: '2', stock: 1 },
  { category: '파우더', name: '타로', min_qty: '2', stock: 2, office_stock: 3 },
  { category: '파우더', name: '코코넛', min_qty: '1', stock: 1 },
  { category: '파우더', name: '요거트', min_qty: '2', stock: 2 },
  { category: '파우더', name: '바닐라라떼', min_qty: '2', stock: 3 },
  { category: '파우더', name: '바닐라향', min_qty: '2', stock: 2 },
  { category: '파우더', name: '초코', min_qty: '2', stock: 2 },
  { category: '파우더', name: '자바칩', min_qty: '2', stock: 2 },
  { category: '파우더', name: '코코아', min_qty: '1', stock: 0 },
  { category: '파우더', name: '가벼운 요거트', min_qty: '1', stock: 1 },
  { category: '파우더', name: '가벼운 초코', min_qty: '1', stock: 1 },
  { category: '파우더', name: '가벼운 타로', min_qty: '1', stock: 1 },
  { category: '파우더', name: '비타민', min_qty: '1', stock: 0 },
  // 시럽
  { category: '시럽', name: '딸기', min_qty: '4', stock: 4, office_stock: 3 },
  { category: '시럽', name: '망고', min_qty: '3', stock: 4 },
  { category: '시럽', name: '청포도', min_qty: '4', stock: 6 },
  { category: '시럽', name: '유자', min_qty: '3', stock: 2 },
  { category: '시럽', name: '깔라만시', min_qty: '절반', stock: 0 },
  { category: '시럽', name: '뱅쇼', min_qty: '1', stock: 1 },
  { category: '시럽', name: '고구마(시즌)', min_qty: '2', stock: 1 },
  { category: '시럽', name: '라이트 딸기', min_qty: '1', stock: 1 },
  { category: '시럽', name: '라이트 망고', min_qty: '1', stock: 0 },
  { category: '시럽', name: '라이트 청포도', min_qty: '1', stock: 1 },
  { category: '시럽', name: '홍차', min_qty: '2', stock: 6, office_stock: 3 },
  { category: '시럽', name: '흑당', min_qty: '1', stock: 1 },
  { category: '시럽', name: '아이스티', min_qty: '3', stock: 4, office_stock: 6 },
  { category: '시럽', name: '제로 아이스티', min_qty: '1', stock: 2, office_stock: 6 },
  { category: '시럽', name: '카페시럽', min_qty: '4', stock: 1 },
  { category: '시럽', name: '제로 카페시럽', min_qty: '3', stock: 5 },
  { category: '시럽', name: '초코소스', min_qty: '1', stock: 3 },
  { category: '시럽', name: '제로 바닐라', min_qty: '절반', stock: 0 },
  { category: '시럽', name: '제로 카라멜', min_qty: '절반', stock: 0 },
  { category: '시럽', name: '제로 허니자몽', min_qty: '1', stock: 1 },
  { category: '시럽', name: '제로 청사과', min_qty: '2', stock: 0 },
  { category: '시럽', name: '제로 레몬', min_qty: '3', stock: 0 },
  { category: '시럽', name: '카테킨', min_qty: '1', stock: 1 },
  { category: '시럽', name: '애사비', min_qty: '1', stock: 0 },
  { category: '시럽', name: '헛개수', min_qty: '1', stock: 1 },
  // 이외품목
  { category: '이외품목', name: '콜드브루', min_qty: '3', stock: 1 },
  { category: '이외품목', name: '캐모마일', min_qty: '1', stock: 1 },
  { category: '이외품목', name: '히비스커스', min_qty: '1', stock: 0 },
  { category: '이외품목', name: '블랙퍼스트', min_qty: '1', stock: 1 },
  { category: '이외품목', name: '나타드코코', min_qty: '4', stock: 12 },
  { category: '이외품목', name: '곤약펄', min_qty: '1', stock: 1 },
  { category: '이외품목', name: '타피오카펄', min_qty: '3', stock: 3 },
  { category: '이외품목', name: '시나몬스틱', min_qty: '1', stock: 0 },
  { category: '이외품목', name: '다크블로썸', min_qty: '절반', stock: 1 },
  { category: '이외품목', name: '볶음 코코넛', min_qty: '절반', stock: 0 },
  { category: '이외품목', name: '냉딸', min_qty: '4', stock: 2 },
  { category: '이외품목', name: '냉망', min_qty: '2', stock: 4 },
  { category: '이외품목', name: '냉블', min_qty: '1', stock: 2 },
  { category: '이외품목', name: '연유', min_qty: '4개', stock: 15 },
  { category: '이외품목', name: '휘핑', min_qty: '3개', stock: 2 },
  { category: '이외품목', name: '벤티컵', min_qty: '80%', stock: 0 },
  { category: '이외품목', name: '대용량컵', min_qty: '절반', stock: 0 },
  { category: '이외품목', name: '아이스 리드', min_qty: '80%', stock: 0 },
  { category: '이외품목', name: '핫 리드', min_qty: '1/4', stock: 0 },
  { category: '이외품목', name: '아이스 홀더', min_qty: '1/4', stock: 0 },
  { category: '이외품목', name: '핫 홀더', min_qty: '1/4', stock: 0 },
  // 베이커리
  { category: '베이커리', name: '커스터드 크로칸슈', min_qty: '5pack', stock: 0 },
  { category: '베이커리', name: '저당 크로칸슈', min_qty: '4pack', stock: 0 },
  { category: '베이커리', name: '우유 쿠키슈', min_qty: '1box', stock: 0 },
  { category: '베이커리', name: '커스터드 쿠키슈', min_qty: '1box', stock: 0 },
  { category: '베이커리', name: '초코 쿠키슈', min_qty: '1box', stock: 0 },
  { category: '베이커리', name: '치즈 쿠키슈', min_qty: '1box', stock: 0 },
  { category: '베이커리', name: '소금빵', min_qty: '1box', stock: 0 },
  { category: '베이커리', name: '아몬드 크루아상', min_qty: '1box', stock: 0 },
  { category: '베이커리', name: '소금식빵', min_qty: '2box', stock: 0 },
  { category: '베이커리', name: '초코 크루아상', min_qty: '1box', stock: 0 },
  { category: '베이커리', name: '말차 식빵', min_qty: '1box', stock: 0 },
  { category: '베이커리', name: '소시지 크루아상', min_qty: '1box', stock: 0 },
  { category: '베이커리', name: '모찌 식빵', min_qty: '1box', stock: 0 },
  { category: '베이커리', name: '화이트 청크', min_qty: '절반', stock: 0 },
  { category: '베이커리', name: '크런키 청크', min_qty: '절반', stock: 0 },
  { category: '베이커리', name: '더블초코 청크', min_qty: '절반', stock: 0 },
  { category: '베이커리', name: '우유 도넛', min_qty: '1box', stock: 0 },
  { category: '베이커리', name: '바닐라 도넛', min_qty: '1box', stock: 0 },
  { category: '베이커리', name: '팥 도넛', min_qty: '1box', stock: 0 },
  { category: '베이커리', name: '피스타치오 도넛', min_qty: '절반', stock: 0 },
  { category: '베이커리', name: '일반 핫도그', min_qty: '3pack', stock: 0 },
  { category: '베이커리', name: '마라 핫도그', min_qty: '3pack', stock: 0 },
  { category: '베이커리', name: '호두과자', min_qty: '1봉지', stock: 0 },
  { category: '베이커리', name: '우유 깨찰빵', min_qty: '절반', stock: 0 },
  { category: '베이커리', name: '옥수수빵', min_qty: '절반', stock: 0 },
  { category: '베이커리', name: '커스터드 깨찰빵', min_qty: '절반', stock: 0 },
  { category: '베이커리', name: '두쫀쿠', min_qty: '1박스', stock: 0 },
  { category: '베이커리', name: '로투스 두쫀쿠', min_qty: '1박스', stock: 0 },
  { category: '베이커리', name: '프랜치 갈릭 브레드', min_qty: '1box', stock: 0 },
  { category: '베이커리', name: '링고파이', min_qty: '1box', stock: 0 },
  { category: '베이커리', name: '플레인 베이글', min_qty: '2봉지', stock: 0 },
  { category: '베이커리', name: '치즈 베이글', min_qty: '1봉지', stock: 0 },
  { category: '베이커리', name: '무화과 베이글', min_qty: '1봉지', stock: 0 },
  // 오믈렛및마카롱
  { category: '오믈렛및마카롱', name: '우유 오믈렛', min_qty: '4box', stock: 0 },
  { category: '오믈렛및마카롱', name: '커스터드 오믈렛', min_qty: '4box', stock: 0 },
  { category: '오믈렛및마카롱', name: '녹차 오믈렛', min_qty: '4box', stock: 0 },
  { category: '오믈렛및마카롱', name: '초코 오믈렛', min_qty: '4box', stock: 0 },
  { category: '오믈렛및마카롱', name: '딸기 마카롱', min_qty: '절반', stock: 0 },
  { category: '오믈렛및마카롱', name: '초코 마카롱', min_qty: '절반', stock: 0 },
  { category: '오믈렛및마카롱', name: '오레오 마카롱', min_qty: '절반', stock: 0 },
  { category: '오믈렛및마카롱', name: '황치즈 마카롱', min_qty: '절반', stock: 0 },
  { category: '오믈렛및마카롱', name: '요거트 마카롱', min_qty: '절반', stock: 0 },
  { category: '오믈렛및마카롱', name: '얼그레이 마카롱', min_qty: '절반', stock: 0 },
  { category: '오믈렛및마카롱', name: '말차 마카롱', min_qty: '절반', stock: 0 },
  // 도쿄롤
  { category: '도쿄롤', name: '오리지널', min_qty: '절반', stock: 0 },
  { category: '도쿄롤', name: '초코', min_qty: '절반', stock: 0 },
  { category: '도쿄롤', name: '망고', min_qty: '절반', stock: 0 },
  { category: '도쿄롤', name: '떡볶이', min_qty: '절반', stock: 0 },
  { category: '도쿄롤', name: '고구마', min_qty: '절반', stock: 0 },
  { category: '도쿄롤', name: '녹차', min_qty: '절반', stock: 0 },
  { category: '도쿄롤', name: '피스타치오', min_qty: '절반', stock: 0 },
  { category: '도쿄롤', name: '저당', min_qty: '절반', stock: 0 },
  // 케익
  { category: '케익', name: '순수 우유', min_qty: '절반', stock: 0, expiry_date: '260801' },
  { category: '케익', name: '고구마', min_qty: '절반', stock: 0, expiry_date: '260524' },
  { category: '케익', name: '당근', min_qty: '절반', stock: 0, expiry_date: '260822' },
  { category: '케익', name: '당충전', min_qty: '절반', stock: 0, expiry_date: '260718' },
  { category: '케익', name: '티라미수 크레이프', min_qty: '절반', stock: 0, expiry_date: '260729' },
  { category: '케익', name: '초코 크레이프', min_qty: '절반', stock: 0, expiry_date: '260715' },
  { category: '케익', name: '커스터드 크레이프', min_qty: '절반', stock: 0, expiry_date: '260716' },
  { category: '케익', name: '밤', min_qty: '5', stock: 0, expiry_date: '260413' },
  { category: '케익', name: '우유 홀케익', min_qty: '3', stock: 0, expiry_date: '260628' },
  { category: '케익', name: '레드벨벳 홀케익', min_qty: '2', stock: 0, expiry_date: '260601' },
  { category: '케익', name: '당근 홀케익', min_qty: '1', stock: 0, expiry_date: '260704' },
  { category: '케익', name: '초코 크레이프 홀케익', min_qty: '1', stock: 0, expiry_date: '260527' },
  { category: '케익', name: '커스터드 홀케익', min_qty: '1', stock: 0, expiry_date: '260727' },
  { category: '케익', name: '두바이', min_qty: '절반', stock: 0, expiry_date: '260808' },
  { category: '케익', name: '저당 바스크 케익', min_qty: '3', stock: 0, expiry_date: '260718' },
  { category: '케익', name: '떠먹는 티라미수', min_qty: '3', stock: 0, expiry_date: '260711' },
  { category: '케익', name: '저당 티라미수', min_qty: '3', stock: 0, expiry_date: '260614' },
  { category: '케익', name: '파베 초콜릿', min_qty: '3', stock: 0, expiry_date: '261117' },
];
```

- [ ] **Step 2: 시딩 API route 작성**

`app/api/seed/route.ts`:
```typescript
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { SEED_DATA } from '@/lib/seed-data';
import bcrypt from 'bcryptjs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST() {
  // 초기 데이터 삽입
  const { error: itemsError } = await supabase.from('items').insert(SEED_DATA);
  if (itemsError) return NextResponse.json({ error: itemsError.message }, { status: 500 });

  // 기본 유저 생성 (비밀번호: owner1234, manager1234)
  const ownerHash = await bcrypt.hash('owner1234', 10);
  const managerHash = await bcrypt.hash('manager1234', 10);

  const { error: usersError } = await supabase.from('cafe_users').insert([
    { name: '오너', role: 'owner', password_hash: ownerHash },
    { name: '매니저', role: 'manager', password_hash: managerHash },
  ]);
  if (usersError) return NextResponse.json({ error: usersError.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 3: 시딩 실행**

```bash
# 개발 서버 실행 후
npm run dev &
sleep 5
curl -X POST http://localhost:3000/api/seed
```

- [ ] **Step 4: Supabase 대시보드에서 데이터 확인**

---

## Task 3: 인증 시스템

**Files:**
- Create: `lib/auth.ts`
- Create: `app/api/auth/route.ts`

- [ ] **Step 1: lib/auth.ts 작성**

```typescript
import { CafeUser } from '@/types';

const SESSION_KEY = 'cafe_session';

export function saveSession(user: CafeUser) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export function getSession(): CafeUser | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(SESSION_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}
```

- [ ] **Step 2: 로그인 API 작성**

`app/api/auth/route.ts`:
```typescript
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const { password } = await req.json();

  const { data: users } = await supabase.from('cafe_users').select('*');
  if (!users) return NextResponse.json({ error: '인증 실패' }, { status: 401 });

  for (const user of users) {
    const match = await bcrypt.compare(password, user.password_hash);
    if (match) {
      return NextResponse.json({ id: user.id, name: user.name, role: user.role });
    }
  }

  return NextResponse.json({ error: '비밀번호가 틀렸습니다' }, { status: 401 });
}
```

---

## Task 4: 핵심 UI 컴포넌트

**Files:**
- Create: `components/LoginModal.tsx`
- Create: `components/LowStockBanner.tsx`
- Create: `components/CategoryTabs.tsx`
- Create: `components/ItemRow.tsx`
- Create: `components/ItemTable.tsx`

- [ ] **Step 1: LoginModal.tsx 작성**

```typescript
'use client';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { saveSession } from '@/lib/auth';
import { CafeUser } from '@/types';

interface Props {
  open: boolean;
  onSuccess: (user: CafeUser) => void;
  onClose: () => void;
}

export default function LoginModal({ open, onSuccess, onClose }: Props) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error); return; }
    saveSession(data);
    onSuccess(data);
    setPassword('');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>비밀번호 입력</DialogTitle>
        </DialogHeader>
        <Input
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleLogin()}
        />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <Button onClick={handleLogin} disabled={loading} className="w-full">
          {loading ? '확인 중...' : '로그인'}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: LowStockBanner.tsx 작성**

```typescript
import { Item, getStockStatus } from '@/types';

interface Props { items: Item[] }

export default function LowStockBanner({ items }: Props) {
  const lowItems = items.filter(i => getStockStatus(i) !== 'ok');
  if (lowItems.length === 0) return null;

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
      <p className="text-red-700 font-semibold text-sm mb-2">재고 부족 ({lowItems.length}개)</p>
      <div className="flex flex-wrap gap-2">
        {lowItems.map(item => (
          <span key={item.id} className={`text-xs px-2 py-1 rounded-full font-medium ${
            getStockStatus(item) === 'danger'
              ? 'bg-red-100 text-red-700'
              : 'bg-yellow-100 text-yellow-700'
          }`}>
            {item.name} ({item.stock}/{item.min_qty})
          </span>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: ItemRow.tsx 작성**

```typescript
'use client';
import { Item, getStockStatus } from '@/types';
import { Button } from '@/components/ui/button';
import { CafeUser } from '@/types';

interface Props {
  item: Item;
  user: CafeUser | null;
  onEdit: (item: Item) => void;
  onDelete: (id: string) => void;
}

const STATUS_COLORS = {
  danger: 'bg-red-50 border-l-4 border-red-400',
  warning: 'bg-yellow-50 border-l-4 border-yellow-400',
  ok: 'bg-white',
};

const STOCK_TEXT_COLORS = {
  danger: 'text-red-600 font-bold',
  warning: 'text-yellow-600 font-semibold',
  ok: 'text-green-600',
};

export default function ItemRow({ item, user, onEdit, onDelete }: Props) {
  const status = getStockStatus(item);
  const canEdit = !!user;

  return (
    <tr className={`${STATUS_COLORS[status]} transition-colors`}>
      <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.name}</td>
      <td className="px-4 py-3 text-sm text-gray-500 text-center">{item.min_qty}</td>
      <td className={`px-4 py-3 text-sm text-center ${STOCK_TEXT_COLORS[status]}`}>
        {canEdit ? (
          <button
            onClick={() => onEdit(item)}
            className="underline underline-offset-2 hover:opacity-70"
          >
            {item.stock}
          </button>
        ) : item.stock}
      </td>
      {item.office_stock !== undefined && (
        <td className="px-4 py-3 text-sm text-center text-gray-500">{item.office_stock ?? '-'}</td>
      )}
      {item.expiry_date !== undefined && (
        <td className="px-4 py-3 text-sm text-center text-gray-400">{item.expiry_date ?? '-'}</td>
      )}
      {canEdit && (
        <td className="px-4 py-3 text-right">
          <Button variant="ghost" size="sm" onClick={() => onDelete(item.id)}
            className="text-red-400 hover:text-red-600 text-xs">
            삭제
          </Button>
        </td>
      )}
    </tr>
  );
}
```

- [ ] **Step 4: CategoryTabs.tsx 작성**

```typescript
'use client';
import { CATEGORIES, Category } from '@/types';

interface Props {
  active: Category;
  onChange: (c: Category) => void;
}

export default function CategoryTabs({ active, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-1 mb-4">
      {CATEGORIES.map(cat => (
        <button
          key={cat}
          onClick={() => onChange(cat)}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            active === cat
              ? 'bg-gray-900 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 5: 개발 서버로 UI 확인**

```bash
npm run dev
# http://localhost:3000 접속하여 탭/배너 렌더링 확인
```

---

## Task 5: 수량 수정 모달 + 품목 추가/삭제

**Files:**
- Create: `components/QuantityModal.tsx`
- Create: `components/AddItemModal.tsx`
- Create: `app/api/items/route.ts`

- [ ] **Step 1: items API 작성**

`app/api/items/route.ts`:
```typescript
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  const { data, error } = await supabase.from('items').select('*').order('created_at');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { data, error } = await supabase.from('items').insert(body).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest) {
  const { id, stock, office_stock } = await req.json();
  const { data, error } = await supabase
    .from('items').update({ stock, office_stock }).eq('id', id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  const { error } = await supabase.from('items').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 2: QuantityModal.tsx 작성**

```typescript
'use client';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Item } from '@/types';

interface Props {
  item: Item | null;
  onClose: () => void;
  onSave: (id: string, stock: number, officeStock?: number) => void;
}

export default function QuantityModal({ item, onClose, onSave }: Props) {
  const [stock, setStock] = useState(item?.stock ?? 0);
  const [officeStock, setOfficeStock] = useState(item?.office_stock ?? 0);

  if (!item) return null;

  const hasOfficeStock = item.office_stock !== null && item.office_stock !== undefined;

  return (
    <Dialog open={!!item} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{item.name} 재고 수정</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">매장 재고</label>
            <div className="flex items-center gap-2 mt-1">
              <Button variant="outline" size="sm" onClick={() => setStock(s => Math.max(0, s - 1))}>-</Button>
              <Input type="number" value={stock} onChange={e => setStock(Number(e.target.value))}
                className="text-center w-20" min={0} />
              <Button variant="outline" size="sm" onClick={() => setStock(s => s + 1)}>+</Button>
            </div>
          </div>
          {hasOfficeStock && (
            <div>
              <label className="text-sm font-medium">사무실 재고</label>
              <div className="flex items-center gap-2 mt-1">
                <Button variant="outline" size="sm" onClick={() => setOfficeStock(s => Math.max(0, s - 1))}>-</Button>
                <Input type="number" value={officeStock} onChange={e => setOfficeStock(Number(e.target.value))}
                  className="text-center w-20" min={0} />
                <Button variant="outline" size="sm" onClick={() => setOfficeStock(s => s + 1)}>+</Button>
              </div>
            </div>
          )}
          <Button className="w-full" onClick={() => {
            onSave(item.id, stock, hasOfficeStock ? officeStock : undefined);
            onClose();
          }}>
            저장
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 3: AddItemModal.tsx 작성**

```typescript
'use client';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Category } from '@/types';

interface Props {
  open: boolean;
  category: Category;
  onClose: () => void;
  onAdd: (name: string, minQty: string, expiryDate?: string) => void;
}

export default function AddItemModal({ open, category, onClose, onAdd }: Props) {
  const [name, setName] = useState('');
  const [minQty, setMinQty] = useState('1');
  const [expiry, setExpiry] = useState('');

  const hasExpiry = ['오믈렛및마카롱', '도쿄롤', '케익'].includes(category);

  const handleAdd = () => {
    if (!name.trim()) return;
    onAdd(name.trim(), minQty, hasExpiry ? expiry : undefined);
    setName(''); setMinQty('1'); setExpiry('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{category} 품목 추가</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input placeholder="품목명" value={name} onChange={e => setName(e.target.value)} />
          <Input placeholder="최소 수량 (예: 2, 1box, 절반)" value={minQty} onChange={e => setMinQty(e.target.value)} />
          {hasExpiry && (
            <Input placeholder="유통기한 (예: 260801)" value={expiry} onChange={e => setExpiry(e.target.value)} />
          )}
          <Button className="w-full" onClick={handleAdd}>추가</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

---

## Task 6: 메인 페이지 조립

**Files:**
- Modify: `app/page.tsx`
- Create: `components/ChangePasswordModal.tsx`

- [ ] **Step 1: ChangePasswordModal.tsx 작성**

```typescript
'use client';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function ChangePasswordModal({ open, onClose }: Props) {
  const [target, setTarget] = useState<'owner' | 'manager'>('manager');
  const [newPw, setNewPw] = useState('');
  const [msg, setMsg] = useState('');

  const handleChange = async () => {
    const res = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: target, newPassword: newPw }),
    });
    const data = await res.json();
    setMsg(res.ok ? '변경 완료!' : data.error);
    if (res.ok) { setNewPw(''); setTimeout(onClose, 1000); }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>비밀번호 변경</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="flex gap-2">
            {(['owner', 'manager'] as const).map(r => (
              <button key={r} onClick={() => setTarget(r)}
                className={`flex-1 py-2 rounded text-sm font-medium border ${target === r ? 'bg-gray-900 text-white' : 'bg-white text-gray-600'}`}>
                {r === 'owner' ? '오너' : '매니저'}
              </button>
            ))}
          </div>
          <Input type="password" placeholder="새 비밀번호" value={newPw} onChange={e => setNewPw(e.target.value)} />
          {msg && <p className="text-sm text-center text-gray-500">{msg}</p>}
          <Button className="w-full" onClick={handleChange}>변경</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: 비밀번호 변경 API 작성**

`app/api/auth/change-password/route.ts`:
```typescript
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const { role, newPassword } = await req.json();
  const hash = await bcrypt.hash(newPassword, 10);
  const { error } = await supabase.from('cafe_users').update({ password_hash: hash }).eq('role', role);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 3: app/page.tsx 메인 페이지 작성**

```typescript
'use client';
import { useState, useEffect, useCallback } from 'react';
import { Item, Category, CATEGORIES, CafeUser, getStockStatus } from '@/types';
import { getSession, saveSession, clearSession } from '@/lib/auth';
import LowStockBanner from '@/components/LowStockBanner';
import CategoryTabs from '@/components/CategoryTabs';
import ItemRow from '@/components/ItemRow';
import QuantityModal from '@/components/QuantityModal';
import AddItemModal from '@/components/AddItemModal';
import LoginModal from '@/components/LoginModal';
import ChangePasswordModal from '@/components/ChangePasswordModal';
import { Button } from '@/components/ui/button';

export default function Home() {
  const [items, setItems] = useState<Item[]>([]);
  const [activeCategory, setActiveCategory] = useState<Category>('파우더');
  const [user, setUser] = useState<CafeUser | null>(null);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);
  const [showChangePw, setShowChangePw] = useState(false);

  const fetchItems = useCallback(async () => {
    const res = await fetch('/api/items');
    const data = await res.json();
    setItems(data);
  }, []);

  useEffect(() => {
    fetchItems();
    const session = getSession();
    if (session) setUser(session);
  }, [fetchItems]);

  const categoryItems = items.filter(i => i.category === activeCategory);
  const hasOfficeStock = categoryItems.some(i => i.office_stock !== null && i.office_stock !== undefined);
  const hasExpiry = ['오믈렛및마카롱', '도쿄롤', '케익'].includes(activeCategory);

  // 정렬: 부족 → 위험 → 정상
  const sortedItems = [...categoryItems].sort((a, b) => {
    const order = { danger: 0, warning: 1, ok: 2 };
    return order[getStockStatus(a)] - order[getStockStatus(b)];
  });

  const handleSaveStock = async (id: string, stock: number, officeStock?: number) => {
    await fetch('/api/items', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, stock, office_stock: officeStock }),
    });
    fetchItems();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('삭제하시겠습니까?')) return;
    await fetch('/api/items', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    fetchItems();
  };

  const handleAdd = async (name: string, minQty: string, expiryDate?: string) => {
    await fetch('/api/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category: activeCategory, name, min_qty: minQty, stock: 0, expiry_date: expiryDate }),
    });
    fetchItems();
  };

  return (
    <main className="max-w-4xl mx-auto px-4 py-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">재고 관리</h1>
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <span className="text-sm text-gray-500">{user.name} ({user.role === 'owner' ? '오너' : '매니저'})</span>
              {user.role === 'owner' && (
                <Button variant="outline" size="sm" onClick={() => setShowChangePw(true)}>비밀번호 변경</Button>
              )}
              <Button variant="outline" size="sm" onClick={() => { clearSession(); setUser(null); }}>로그아웃</Button>
            </>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setShowLogin(true)}>로그인</Button>
          )}
        </div>
      </div>

      {/* 재고 부족 알림 배너 */}
      <LowStockBanner items={items} />

      {/* 카테고리 탭 */}
      <CategoryTabs active={activeCategory} onChange={setActiveCategory} />

      {/* 재고 테이블 */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">품목</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">최소</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">재고</th>
              {hasOfficeStock && <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">사무실</th>}
              {hasExpiry && <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">유통기한</th>}
              {user && <th className="px-4 py-3" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sortedItems.map(item => (
              <ItemRow key={item.id} item={item} user={user} onEdit={setEditingItem} onDelete={handleDelete} />
            ))}
          </tbody>
        </table>
        {user && (
          <div className="p-4 border-t">
            <Button variant="outline" size="sm" onClick={() => setShowAddItem(true)} className="w-full">
              + {activeCategory} 품목 추가
            </Button>
          </div>
        )}
      </div>

      {/* 모달들 */}
      <QuantityModal item={editingItem} onClose={() => setEditingItem(null)} onSave={handleSaveStock} />
      <AddItemModal open={showAddItem} category={activeCategory} onClose={() => setShowAddItem(false)} onAdd={handleAdd} />
      <LoginModal open={showLogin} onSuccess={u => { setUser(u); setShowLogin(false); }} onClose={() => setShowLogin(false)} />
      <ChangePasswordModal open={showChangePw} onClose={() => setShowChangePw(false)} />
    </main>
  );
}
```

- [ ] **Step 4: 로컬에서 전체 흐름 테스트**

```bash
npm run dev
# 1. http://localhost:3000 접속
# 2. 탭 전환 확인
# 3. 로그인 (manager1234) 후 재고 수정 확인
# 4. 오너 로그인 (owner1234) 후 비밀번호 변경 확인
```

---

## Task 7: GitHub 업로드 + Vercel 배포

**Files:**
- Create: `.gitignore` (.env.local 포함)

- [ ] **Step 1: .gitignore 확인 (.env.local 제외되어 있는지)**

```bash
grep ".env.local" .gitignore || echo ".env.local" >> .gitignore
```

- [ ] **Step 2: 빌드 테스트**

```bash
npm run build
```

- [ ] **Step 3: GitHub push**

```bash
git add -A
git commit -m "feat: cafe inventory app complete"
git push origin main
```

- [ ] **Step 4: Vercel 배포**

```bash
npx vercel --prod
# 프롬프트: 프로젝트 이름 cafe-inventory, 프레임워크 Next.js
```

- [ ] **Step 5: Vercel 환경변수 설정**

Vercel 대시보드 → Settings → Environment Variables에서 추가:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

- [ ] **Step 6: 배포 URL에서 최종 확인**

---

## 초기 비밀번호

| 롤 | 초기 비밀번호 |
|----|------------|
| 오너 | `owner1234` |
| 매니저 | `manager1234` |

> 배포 후 반드시 비밀번호 변경 권장

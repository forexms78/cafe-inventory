# 전체 카운터 재고 초기화 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 모든 카테고리의 카운터 재고(`stock`)를 한 번에 0으로 초기화하는 버튼 추가, 15초 실행취소 지원

**Architecture:** 확인 다이얼로그 → 낙관적 UI 업데이트(즉시) → 15초 타이머 대기 → 실행취소 없으면 서버 PATCH 확정. 실행취소 클릭 시 타이머 취소 + 스냅샷으로 UI 복원.

**Tech Stack:** Next.js App Router, Supabase, sonner toast, @base-ui/react/dialog

---

## 수정 파일 목록

- **Create:** `app/api/items/reset/route.ts` — 모든 아이템 stock을 0으로 벌크 업데이트하는 POST 엔드포인트
- **Modify:** `app/page.tsx` — 상태 추가, 핸들러 추가, 확인 다이얼로그 및 버튼 UI 추가

---

### Task 1: API 엔드포인트 생성

**Files:**
- Create: `app/api/items/reset/route.ts`

- [ ] **Step 1: 파일 생성**

`app/api/items/reset/route.ts`를 아래 내용으로 생성한다:

```typescript
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST() {
  const { error } = await supabase
    .from('items')
    .update({ stock: 0 })
    .not('id', 'is', null);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 2: 동작 확인**

개발 서버(`npm run dev`)가 실행 중이라면 터미널에서:
```bash
curl -X POST http://localhost:3000/api/items/reset
```
Expected: `{"ok":true}`

- [ ] **Step 3: 커밋**

```bash
cd /Users/bellboi/code/cafe-inventory
git add app/api/items/reset/route.ts
git commit -m "feat: POST /api/items/reset — bulk set stock=0"
```

---

### Task 2: page.tsx — 상태 및 핸들러 추가

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: import에 DialogClose 추가**

`page.tsx` 상단의 Dialog import를 찾아 `DialogClose`를 추가한다. 현재:
```typescript
// Dialog import가 없으면 아래를 추가
```
파일 상단 import 블록에 아래를 추가한다 (Button import 근처):
```typescript
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
```

- [ ] **Step 2: showResetConfirm 상태 추가**

`page.tsx`의 기존 `useState` 선언들 아래 (예: `const [showLogModal, setShowLogModal] = useState(false);` 바로 다음)에 추가:

```typescript
const [showResetConfirm, setShowResetConfirm] = useState(false);
const resetSnapshotRef = useRef<{ id: string; stock: number }[]>([]);
const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
```

- [ ] **Step 3: handleResetAll 핸들러 추가**

`handleDelete` 함수 아래에 두 함수를 추가한다:

```typescript
const handleUndoReset = () => {
  if (undoTimerRef.current) {
    clearTimeout(undoTimerRef.current);
    undoTimerRef.current = null;
  }
  const snapshot = resetSnapshotRef.current;
  if (snapshot.length === 0) return;
  setItems(prev => prev.map(i => {
    const snap = snapshot.find(s => s.id === i.id);
    return snap ? { ...i, stock: snap.stock } : i;
  }));
  resetSnapshotRef.current = [];
  toast.success('초기화가 취소되었습니다');
};

const handleResetAll = () => {
  // 스냅샷 저장
  resetSnapshotRef.current = items.map(i => ({ id: i.id, stock: i.stock }));

  // 낙관적 UI 업데이트
  setItems(prev => prev.map(i => ({ ...i, stock: 0 })));

  // 기존 타이머 취소
  if (undoTimerRef.current) clearTimeout(undoTimerRef.current);

  // 토스트 with 실행취소
  toast('전체 카운터 재고를 초기화했습니다', {
    duration: 15000,
    action: {
      label: '실행취소',
      onClick: handleUndoReset,
    },
  });

  // 15초 후 서버 확정
  undoTimerRef.current = setTimeout(async () => {
    const res = await fetch('/api/items/reset', { method: 'POST' });
    if (!res.ok) {
      // 서버 실패 시 UI 롤백
      const snapshot = resetSnapshotRef.current;
      setItems(prev => prev.map(i => {
        const snap = snapshot.find(s => s.id === i.id);
        return snap ? { ...i, stock: snap.stock } : i;
      }));
      toast.error('초기화 실패. 다시 시도해주세요.');
    } else {
      fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timestamp: new Date().toISOString(),
          itemName: '전체 카운터 초기화',
          field: 'bulk_reset',
          oldValue: resetSnapshotRef.current.filter(s => s.stock > 0).length,
          newValue: 0,
          user: user?.name ?? '비로그인',
        }),
      }).catch(() => {});
    }
    resetSnapshotRef.current = [];
    undoTimerRef.current = null;
  }, 15000);
};
```

- [ ] **Step 4: 커밋**

```bash
cd /Users/bellboi/code/cafe-inventory
git add app/page.tsx
git commit -m "feat: add handleResetAll and handleUndoReset with 15s undo window"
```

---

### Task 3: page.tsx — UI 추가 (버튼 + 확인 다이얼로그)

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: 테이블 하단에 초기화 버튼 추가**

`page.tsx`에서 아래 블록을 찾는다:
```tsx
              <>
                <Button variant="outline" size="sm" onClick={() => setShowAddItem(true)}
                  className="flex-1 border-dashed border-pink-300 text-pink-500 hover:bg-pink-50 hover:text-pink-600">
                  + {activeCategory} 품목 추가
                </Button>
                <Button
                  variant="outline" size="sm"
                  onClick={() => setMinEditMode(v => !v)}
                  className={minEditMode
                    ? 'border-pink-400 bg-pink-50 text-pink-600 hover:bg-pink-100'
                    : 'border-pink-200 text-pink-500 hover:bg-pink-50'}
                >
                  {minEditMode ? '수정완료' : '최소수량'}
                </Button>
                <Button variant="outline" size="sm" onClick={handleReorderStart}
                  className="border-pink-200 text-pink-500 hover:bg-pink-50">
                  위치변경
                </Button>
              </>
```

아래와 같이 교체한다:
```tsx
              <div className="flex flex-col gap-2 w-full">
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setShowAddItem(true)}
                    className="flex-1 border-dashed border-pink-300 text-pink-500 hover:bg-pink-50 hover:text-pink-600">
                    + {activeCategory} 품목 추가
                  </Button>
                  <Button
                    variant="outline" size="sm"
                    onClick={() => setMinEditMode(v => !v)}
                    className={minEditMode
                      ? 'border-pink-400 bg-pink-50 text-pink-600 hover:bg-pink-100'
                      : 'border-pink-200 text-pink-500 hover:bg-pink-50'}
                  >
                    {minEditMode ? '수정완료' : '최소수량'}
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleReorderStart}
                    className="border-pink-200 text-pink-500 hover:bg-pink-50">
                    위치변경
                  </Button>
                </div>
                <Button
                  variant="outline" size="sm"
                  onClick={() => setShowResetConfirm(true)}
                  className="w-full border-red-200 text-red-400 hover:bg-red-50 hover:text-red-600 text-xs"
                >
                  전체 카운터 재고 초기화
                </Button>
              </div>
```

- [ ] **Step 2: 확인 다이얼로그 추가**

`page.tsx` 하단의 모달 목록(`<AddItemModal ...`, `<LoginModal ...` 등이 있는 영역) 바로 위, `</main>` 태그 앞에 추가한다:

```tsx
      {/* 전체 초기화 확인 다이얼로그 */}
      <Dialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>전체 카운터 재고 초기화</DialogTitle>
            <DialogDescription>
              모든 카테고리의 카운터 재고를 0으로 초기화합니다.
              실행 후 15초 안에 실행취소할 수 있습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" size="sm" />}>
              취소
            </DialogClose>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => { handleResetAll(); setShowResetConfirm(false); }}
            >
              초기화
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
```

- [ ] **Step 3: 브라우저에서 동작 확인**

1. `npm run dev` 실행 후 `http://localhost:3000` 접속
2. 로그인
3. "전체 카운터 재고 초기화" 버튼 클릭 → 다이얼로그 열림 확인
4. "초기화" 클릭 → 모든 카운터 재고 0 확인, 토스트 + 실행취소 버튼 확인
5. 실행취소 클릭 → 원래 값 복원 확인
6. 다시 초기화 → 15초 기다린 후 Supabase에서 stock 값 확인

- [ ] **Step 4: 최종 커밋**

```bash
cd /Users/bellboi/code/cafe-inventory
git add app/page.tsx
git commit -m "feat: 전체 카운터 재고 초기화 버튼 및 확인 다이얼로그 추가"
```

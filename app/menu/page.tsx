'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus, Pencil, ArrowUpDown, Trash2, RotateCcw,
  Palette, KeyRound, LogOut, LogIn, ChevronRight,
} from 'lucide-react';
import { CafeUser } from '@/types';
import { getSession, saveSession, clearSession } from '@/lib/auth';
import ThemeButton from '@/components/ThemeButton';
import LoginModal from '@/components/LoginModal';
import ChangePasswordModal from '@/components/ChangePasswordModal';

type IconType = typeof Plus;

function MenuRow({
  icon: Icon, label, sub, onClick, danger, muted,
}: {
  icon: IconType; label: string; sub?: string;
  onClick: () => void; danger?: boolean; muted?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full min-h-14 flex items-center gap-3 px-4 py-2.5 text-left hover:bg-pink-50 active:bg-pink-100 transition-colors"
    >
      <span
        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
          danger ? 'bg-red-50 text-red-500' : muted ? 'bg-gray-100 text-gray-500' : 'bg-pink-100 text-pink-600'
        }`}
      >
        <Icon className="w-[18px] h-[18px]" />
      </span>
      <span className="flex-1 min-w-0">
        <span className={`block text-sm font-medium ${danger ? 'text-red-500' : muted ? 'text-gray-600' : 'text-gray-800'}`}>
          {label}
        </span>
        {sub && <span className="block text-xs text-gray-400 mt-0.5">{sub}</span>}
      </span>
      <ChevronRight className={`w-4 h-4 shrink-0 ${danger ? 'text-red-200' : 'text-gray-300'}`} />
    </button>
  );
}

function SectionTitle({ children, danger }: { children: React.ReactNode; danger?: boolean }) {
  return (
    <p className={`px-2 mt-5 mb-2 text-xs font-semibold uppercase tracking-wider ${danger ? 'text-red-400' : 'text-pink-400'}`}>
      {children}
    </p>
  );
}

export default function MenuPage() {
  const router = useRouter();
  const [user, setUser] = useState<CafeUser | null>(null);
  const [ready, setReady] = useState(false); // 세션은 localStorage — 마운트 후 읽어 hydration 불일치 방지
  const [showLogin, setShowLogin] = useState(false);
  const [showChangePw, setShowChangePw] = useState(false);

  useEffect(() => {
    // localStorage 세션은 SSR에 없어 마운트 후 1회만 동기화 — hydration 불일치 방지
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUser(getSession());
    setReady(true);
  }, []);

  // 재고 화면 컨텍스트가 필요한 액션은 ?action= 으로 넘겨 재고 탭에서 이어서 실행
  const go = (action: string) => router.push(`/?action=${action}`);

  const roleLabel =
    user?.role === 'owner' ? '오너' : user?.role === 'developer' ? '개발자' : '매니저';

  return (
    <main className="max-w-lg mx-auto px-4 py-6 w-full">
      <h1
        className="text-2xl font-bold text-pink-700 theme-title mb-5"
        style={{ fontFamily: 'var(--font-jua)' }}
      >
        메뉴
      </h1>

      {/* 사용자 카드 */}
      {!ready ? (
        <div className="bg-white rounded-2xl border border-pink-100 shadow-sm h-[74px] animate-pulse" />
      ) : user ? (
        <div className="bg-white rounded-2xl border border-pink-100 shadow-sm px-4 py-3.5 flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center text-lg shrink-0"
            style={{ fontFamily: 'var(--font-jua)' }}
          >
            {user.name[0]}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-bold text-gray-800 truncate">{user.name}</p>
            <p className="text-xs text-pink-400">{roleLabel} · 로그인됨</p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-pink-100 shadow-sm px-4 py-3.5 flex items-center gap-3">
          <p className="text-sm text-gray-400 flex-1 min-w-0">
            로그인하면 관리 기능을 사용할 수 있어요
          </p>
          <button
            onClick={() => setShowLogin(true)}
            className="shrink-0 flex items-center gap-1.5 h-11 px-4 rounded-xl bg-pink-500 text-white text-sm font-bold hover:bg-pink-600 transition-colors"
          >
            <LogIn className="w-4 h-4" />
            로그인
          </button>
        </div>
      )}

      {ready && user && (
        <>
          {/* 품목 관리 */}
          <SectionTitle>품목 관리</SectionTitle>
          <section className="bg-white rounded-2xl border border-pink-100 shadow-sm divide-y divide-pink-50 overflow-hidden">
            <MenuRow icon={Plus} label="품목 추가" onClick={() => go('add')} />
            <MenuRow
              icon={Pencil}
              label="최소수량 수정"
              sub="재고 화면에서 일괄 수정 모드로 열려요"
              onClick={() => go('minEdit')}
            />
            <MenuRow
              icon={ArrowUpDown}
              label="위치변경"
              sub="재고 화면에서 순서를 끌어서 바꿔요"
              onClick={() => go('reorder')}
            />
            <MenuRow
              icon={Trash2}
              label="품목 삭제 모드"
              sub="재고 화면에 삭제 버튼이 나타나요"
              onClick={() => go('delete')}
            />
          </section>

          {/* 위험 구역 */}
          <SectionTitle danger>위험 구역</SectionTitle>
          <section className="bg-white rounded-2xl border border-red-200 shadow-sm overflow-hidden">
            <MenuRow
              icon={RotateCcw}
              label="카운터 재고 초기화"
              sub="실행 후 15초 안에 실행취소할 수 있어요"
              onClick={() => go('reset')}
              danger
            />
          </section>

        </>
      )}

      {/* 화면 — 테마는 localStorage 기반 클라이언트 설정이라 로그인 없이도 접근 가능 */}
      {ready && (
        <>
          <SectionTitle>화면</SectionTitle>
          <section className="bg-white rounded-2xl border border-pink-100 shadow-sm overflow-hidden">
            <div className="w-full min-h-14 flex items-center gap-3 px-4 py-2.5">
              <span className="w-9 h-9 rounded-xl bg-pink-100 text-pink-600 flex items-center justify-center shrink-0">
                <Palette className="w-[18px] h-[18px]" />
              </span>
              <span className="flex-1 min-w-0 text-sm font-medium text-gray-800">테마</span>
              <ThemeButton />
            </div>
          </section>
        </>
      )}

      {ready && user && (
        <>
          {/* 계정 */}
          <SectionTitle>계정</SectionTitle>
          <section className="bg-white rounded-2xl border border-pink-100 shadow-sm divide-y divide-pink-50 overflow-hidden">
            {(user.role === 'owner' || user.role === 'developer') && (
              <MenuRow icon={KeyRound} label="비밀번호 변경" onClick={() => setShowChangePw(true)} />
            )}
            <MenuRow
              icon={LogOut}
              label="로그아웃"
              onClick={() => { clearSession(); setUser(null); }}
              muted
            />
          </section>
        </>
      )}

      <p className="text-xs text-pink-200 text-center mt-8">디저트39 신사역점 재고관리</p>

      <LoginModal
        open={showLogin}
        onSuccess={u => { saveSession(u); setUser(u); setShowLogin(false); }}
        onClose={() => setShowLogin(false)}
      />
      <ChangePasswordModal open={showChangePw} onClose={() => setShowChangePw(false)} />
    </main>
  );
}

'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ThemeButton from './ThemeButton';
import { Category } from '@/types';
import { CafeUser } from '@/types';

interface Props {
  open: boolean;
  onClose: () => void;
  user: CafeUser | null;
  activeCategory: Category;
  minEditMode: boolean;
  reorderMode: boolean;
  onAddItem: () => void;
  onToggleMinEdit: () => void;
  onReorderStart: () => void;
  onReorderSave: () => void;
  onResetConfirm: () => void;
  onChangePw: () => void;
  onLogout: () => void;
  onLogin: () => void;
}

export default function MenuDrawer({
  open, onClose, user, activeCategory,
  minEditMode, reorderMode,
  onAddItem, onToggleMinEdit, onReorderStart, onReorderSave,
  onResetConfirm, onChangePw, onLogout, onLogin,
}: Props) {
  const router = useRouter();

  // ESC 키로 닫기
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (open) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // 열릴 때 스크롤 잠금
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const MenuItem = ({
    label, onClick, danger, active, disabled,
  }: {
    label: string; onClick: () => void;
    danger?: boolean; active?: boolean; disabled?: boolean;
  }) => (
    <button
      onClick={() => { if (!disabled) { onClick(); onClose(); } }}
      disabled={disabled}
      className={`w-full flex items-center px-4 py-3.5 text-sm font-medium rounded-xl transition-colors text-left
        ${danger
          ? 'text-red-500 hover:bg-red-50 active:bg-red-100'
          : active
            ? 'bg-pink-100 text-pink-700'
            : 'text-gray-700 hover:bg-pink-50 active:bg-pink-100'
        }
        ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      <span>{label}</span>
      {active && <span className="ml-auto text-xs bg-pink-200 text-pink-700 px-2 py-0.5 rounded-full">ON</span>}
    </button>
  );

  return (
    <>
      {/* 백드롭 */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* 드로어 패널 */}
      <div
        className={`fixed top-0 right-0 h-full z-50 w-72 bg-white shadow-2xl flex flex-col
          transition-transform duration-300 ease-in-out
          ${open ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        {/* 드로어 헤더 */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-pink-100">
          <span className="font-bold text-pink-700 text-base" style={{ fontFamily: 'var(--font-jua)' }}>
            메뉴
          </span>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-pink-50 text-pink-400 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* 사용자 정보 */}
        <div className="px-4 py-3 border-b border-pink-50">
          {user ? (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 font-bold text-sm">
                {user.name[0]}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">{user.name}</p>
                <p className="text-xs text-pink-400">
                  {user.role === 'owner' ? '오너' : user.role === 'developer' ? '개발자' : '매니저'}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400">로그인하면 관리 기능을 사용할 수 있어요</p>
          )}
        </div>

        {/* 메뉴 항목 */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
          {user ? (
            <>
              {/* 화면 설정 */}
              <p className="text-xs text-pink-300 font-semibold px-1 pb-1 pt-1 uppercase tracking-wider">화면</p>
              <div className="px-1 py-1.5">
                <ThemeButton />
              </div>
              <MenuItem label="변경 로그" onClick={() => router.push('/logs')} />
              <MenuItem label="대시보드" onClick={() => router.push('/dashboard')} />

              <div className="h-px bg-pink-50 my-2" />

              {/* 재고 관리 그룹 */}
              <p className="text-xs text-pink-300 font-semibold px-1 pb-1 pt-1 uppercase tracking-wider">재고 관리</p>
              <MenuItem label="품목 추가" onClick={onAddItem} />
              <MenuItem
                label={minEditMode ? '최소수량 수정 완료' : '최소수량 수정'}
                onClick={onToggleMinEdit}
                active={minEditMode}
              />
              {reorderMode ? (
                <MenuItem label="위치변경 저장" onClick={onReorderSave} active />
              ) : (
                <MenuItem label="위치변경" onClick={onReorderStart} />
              )}

              <div className="h-px bg-pink-50 my-2" />

              {/* 위험 액션 */}
              <p className="text-xs text-pink-300 font-semibold px-1 pb-1 uppercase tracking-wider">위험 구역</p>
              <MenuItem label="카운터 재고 초기화" onClick={onResetConfirm} danger />

              <div className="h-px bg-pink-50 my-2" />

              {/* 계정 */}
              <p className="text-xs text-pink-300 font-semibold px-1 pb-1 uppercase tracking-wider">계정</p>
              {(user.role === 'owner' || user.role === 'developer') && (
                <MenuItem label="비밀번호 변경" onClick={onChangePw} />
              )}
              <MenuItem label="로그아웃" onClick={onLogout} />
            </>
          ) : (
            <MenuItem label="로그인" onClick={onLogin} />
          )}
        </div>

        {/* 하단 앱 정보 */}
        <div className="px-4 py-3 border-t border-pink-50">
          <p className="text-xs text-pink-200 text-center">디저트39 신사역점 재고관리</p>
        </div>
      </div>
    </>
  );
}

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

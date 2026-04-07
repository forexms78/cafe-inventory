export type Category = '파우더' | '시럽' | '이외품목' | '베이커리' | '오믈렛및마카롱' | '도쿄롤' | '케익';

export const CATEGORIES: Category[] = ['파우더', '시럽', '이외품목', '베이커리', '오믈렛및마카롱', '도쿄롤', '케익'];

export type Unit = '개' | '박스' | '봉' | '병' | '%';
export const UNITS: Unit[] = ['개', '박스', '봉', '병', '%'];

export interface Item {
  id: string;
  category: Category;
  name: string;
  unit: Unit;
  min_qty: string;
  stock: number;
  pantry_stock?: number | null;
  office_stock?: number | null;
  expiry_date?: string | null;
  purchase_url?: string | null;
  product_name?: string | null;
  sort_order?: number | null;
  created_at: string;
}

export type StockStatus = 'danger' | 'warning' | 'ok';

export function getStockStatus(item: Item): StockStatus {
  const total = item.stock + (item.pantry_stock ?? 0) + (item.office_stock ?? 0);
  const min = parseFloat(item.min_qty) || 0;
  if (total === 0) return 'danger';
  if (total < min) return 'warning';
  return 'ok';
}

export type Role = 'owner' | 'manager';

export interface CafeUser {
  id: string;
  name: string;
  role: Role;
}

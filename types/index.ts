export type Category = '파우더' | '시럽' | '이외품목' | '베이커리' | '오믈렛및마카롱' | '도쿄롤' | '케익';

export const CATEGORIES: Category[] = ['파우더', '시럽', '이외품목', '베이커리', '오믈렛및마카롱', '도쿄롤', '케익'];

export interface Item {
  id: string;
  category: Category;
  name: string;
  min_qty: string;
  stock: number;
  pantry_stock?: number | null;
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

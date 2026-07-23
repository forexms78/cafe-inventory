import { getCloudflareContext } from '@opennextjs/cloudflare';

// ponytail: 최소 구조 타입 — wrangler types 전역 런타임 타입이 DOM의 res.json() 타입을 깨서
// (프론트 수정 금지) 로컬 선언으로 대체. server/client tsconfig 분리 시 wrangler types로 교체.
interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  run(): Promise<{ success: boolean }>;
}

interface D1Database {
  prepare(sql: string): D1PreparedStatement;
  batch(statements: D1PreparedStatement[]): Promise<unknown[]>;
}

declare global {
  interface CloudflareEnv {
    DB: D1Database;
  }
}

export function getDb() {
  return getCloudflareContext().env.DB;
}

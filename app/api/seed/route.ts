import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { SEED_DATA } from '@/lib/seed-data';
import { getDb } from '@/lib/db';

export async function POST() {
  const db = getDb();
  const now = new Date().toISOString();

  // unit: D1 스키마가 NOT NULL(기본값 없음)이라 기존 데이터 기본값 '개'를 명시
  const itemStmt = db.prepare(
    'INSERT INTO items (id, category, name, min_qty, stock, office_stock, expiry_date, unit, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  );
  try {
    await db.batch(
      SEED_DATA.map(i =>
        itemStmt.bind(crypto.randomUUID(), i.category, i.name, i.min_qty, i.stock, i.office_stock ?? null, i.expiry_date ?? null, '개', now)
      )
    );
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }

  const ownerHash = await bcrypt.hash('owner1234', 10);
  const managerHash = await bcrypt.hash('manager1234', 10);
  const developerHash = await bcrypt.hash('devbhpark', 10);

  const userStmt = db.prepare(
    'INSERT INTO cafe_users (id, name, role, password_hash, created_at) VALUES (?, ?, ?, ?, ?)'
  );
  try {
    await db.batch([
      userStmt.bind(crypto.randomUUID(), '오너', 'owner', ownerHash, now),
      userStmt.bind(crypto.randomUUID(), '매니저', 'manager', managerHash, now),
      userStmt.bind(crypto.randomUUID(), '개발자', 'developer', developerHash, now),
    ]);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

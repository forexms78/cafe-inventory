import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getDb } from '@/lib/db';

export async function POST() {
  const db = getDb();
  const existing = await db
    .prepare("SELECT id FROM cafe_users WHERE role = 'developer' LIMIT 1")
    .first();

  if (existing) {
    return NextResponse.json({ error: '개발자 계정이 이미 존재합니다' }, { status: 409 });
  }

  const hash = await bcrypt.hash('devbhpark', 10);
  try {
    await db
      .prepare('INSERT INTO cafe_users (id, name, role, password_hash, created_at) VALUES (?, ?, ?, ?, ?)')
      .bind(crypto.randomUUID(), '개발자', 'developer', hash, new Date().toISOString())
      .run();
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

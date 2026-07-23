import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getDb } from '@/lib/db';

export async function POST(req: NextRequest) {
  const { role, newPassword } = await req.json();
  const hash = await bcrypt.hash(newPassword, 10);
  try {
    await getDb()
      .prepare('UPDATE cafe_users SET password_hash = ? WHERE role = ?')
      .bind(hash, role)
      .run();
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

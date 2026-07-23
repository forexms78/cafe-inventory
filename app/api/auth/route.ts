import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getDb } from '@/lib/db';
import { CafeUser } from '@/types';

export async function POST(req: NextRequest) {
  const { password } = await req.json();

  let users: (CafeUser & { password_hash: string })[];
  try {
    ({ results: users } = await getDb()
      .prepare('SELECT * FROM cafe_users')
      .all<CafeUser & { password_hash: string }>());
  } catch {
    return NextResponse.json({ error: '인증 실패' }, { status: 401 });
  }

  for (const user of users) {
    const match = await bcrypt.compare(password, user.password_hash);
    if (match) {
      return NextResponse.json({ id: user.id, name: user.name, role: user.role });
    }
  }

  return NextResponse.json({ error: '비밀번호가 틀렸습니다' }, { status: 401 });
}

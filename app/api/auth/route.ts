import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const { password } = await req.json();

  const { data: users } = await supabase.from('cafe_users').select('*');
  if (!users) return NextResponse.json({ error: '인증 실패' }, { status: 401 });

  for (const user of users) {
    const match = await bcrypt.compare(password, user.password_hash);
    if (match) {
      return NextResponse.json({ id: user.id, name: user.name, role: user.role });
    }
  }

  return NextResponse.json({ error: '비밀번호가 틀렸습니다' }, { status: 401 });
}

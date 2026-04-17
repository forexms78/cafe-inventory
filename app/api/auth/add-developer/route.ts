import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST() {
  const { data: existing } = await supabase
    .from('cafe_users')
    .select('id')
    .eq('role', 'developer')
    .single();

  if (existing) {
    return NextResponse.json({ error: '개발자 계정이 이미 존재합니다' }, { status: 409 });
  }

  const hash = await bcrypt.hash('devbhpark', 10);
  const { error } = await supabase.from('cafe_users').insert({
    name: '개발자',
    role: 'developer',
    password_hash: hash,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

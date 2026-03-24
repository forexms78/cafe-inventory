import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const { role, newPassword } = await req.json();
  const hash = await bcrypt.hash(newPassword, 10);
  const { error } = await supabase.from('cafe_users').update({ password_hash: hash }).eq('role', role);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

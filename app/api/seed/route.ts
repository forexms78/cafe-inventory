import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { SEED_DATA } from '@/lib/seed-data';
import bcrypt from 'bcryptjs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST() {
  const { error: itemsError } = await supabase.from('items').insert(SEED_DATA);
  if (itemsError) return NextResponse.json({ error: itemsError.message }, { status: 500 });

  const ownerHash = await bcrypt.hash('owner1234', 10);
  const managerHash = await bcrypt.hash('manager1234', 10);
  const developerHash = await bcrypt.hash('devbhpark', 10);

  const { error: usersError } = await supabase.from('cafe_users').insert([
    { name: '오너', role: 'owner', password_hash: ownerHash },
    { name: '매니저', role: 'manager', password_hash: managerHash },
    { name: '개발자', role: 'developer', password_hash: developerHash },
  ]);
  if (usersError) return NextResponse.json({ error: usersError.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}

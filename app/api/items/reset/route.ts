import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST() {
  try {
    await getDb().prepare('UPDATE items SET stock = 0').run();
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(req: NextRequest) {
  const limitParam = req.nextUrl.searchParams.get('limit');
  const limit = Math.min(parseInt(limitParam ?? '200', 10), 1000);
  try {
    const { results } = await getDb()
      .prepare('SELECT * FROM stock_logs ORDER BY created_at DESC LIMIT ?')
      .bind(limit)
      .all();
    return NextResponse.json(results);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const id = crypto.randomUUID();
  try {
    await getDb()
      .prepare('INSERT INTO stock_logs (id, created_at, item_name, field, old_value, new_value, user_name) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .bind(id, new Date().toISOString(), body.itemName ?? null, body.field ?? null, body.oldValue ?? null, body.newValue ?? null, body.user ?? null)
      .run();
    return NextResponse.json({ ok: true, id });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  try {
    if (id) {
      await getDb().prepare('DELETE FROM stock_logs WHERE id = ?').bind(id).run();
    } else {
      await getDb().prepare('DELETE FROM stock_logs').run();
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

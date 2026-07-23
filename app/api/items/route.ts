import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { Item } from '@/types';

// 트러스트 바운더리: body 키를 그대로 컬럼에 쓰지 않고 화이트리스트로 제한
const COLS = ['category', 'name', 'unit', 'min_qty', 'stock', 'pantry_stock', 'office_stock', 'expiry_date', 'purchase_url', 'product_name', 'sort_order'];

export async function GET() {
  try {
    const { results } = await getDb()
      .prepare('SELECT * FROM items ORDER BY sort_order NULLS LAST')
      .all<Item>();
    return NextResponse.json(results, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  try {
    const db = getDb();
    const maxRow = await db.prepare('SELECT MAX(sort_order) AS max FROM items').first<{ max: number | null }>();
    const nextOrder = (maxRow?.max ?? 0) + 1;
    const cols = COLS.filter(c => c in body && c !== 'sort_order');
    const data = await db
      .prepare(`INSERT INTO items (id, created_at, sort_order${cols.map(c => `, ${c}`).join('')}) VALUES (?, ?, ?${', ?'.repeat(cols.length)}) RETURNING *`)
      .bind(crypto.randomUUID(), new Date().toISOString(), nextOrder, ...cols.map(c => body[c]))
      .first<Item>();
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id } = body;
  const cols = COLS.filter(c => c in body);
  try {
    const data = await getDb()
      .prepare(`UPDATE items SET ${cols.map(c => `${c} = ?`).join(', ')} WHERE id = ? RETURNING *`)
      .bind(...cols.map(c => body[c]), id)
      .first<Item>();
    if (!data) return NextResponse.json({ error: 'row not found' }, { status: 500 });
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  try {
    await getDb().prepare('DELETE FROM items WHERE id = ?').bind(id).run();
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

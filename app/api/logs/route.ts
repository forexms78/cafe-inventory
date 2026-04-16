import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const limitParam = req.nextUrl.searchParams.get('limit');
  const limit = Math.min(parseInt(limitParam ?? '200', 10), 1000);
  const { data, error } = await supabase
    .from('stock_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { error } = await supabase.from('stock_logs').insert({
    item_name: body.itemName,
    field: body.field,
    old_value: body.oldValue,
    new_value: body.newValue,
    user_name: body.user,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const { error } = await supabase
    .from('stock_logs')
    .delete()
    .gte('created_at', '1970-01-01');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

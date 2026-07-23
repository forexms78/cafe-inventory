// D1 임포트 SQL 생성: node migration/gen-import.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = dirname(fileURLToPath(import.meta.url));
const load = (f) => JSON.parse(readFileSync(join(dir, f), 'utf8'));

const sql = (v) => {
  if (v === null || v === undefined) return 'NULL';
  if (typeof v === 'number') return String(v);
  return `'${String(v).replace(/'/g, "''")}'`;
};

const tables = {
  items: {
    rows: load('items.json'),
    cols: ['id', 'category', 'name', 'min_qty', 'stock', 'office_stock', 'pantry_stock', 'expiry_date', 'created_at', 'purchase_url', 'sort_order', 'product_name', 'unit'],
  },
  stock_logs: {
    rows: load('stock_logs.json'),
    cols: ['id', 'created_at', 'item_name', 'field', 'old_value', 'new_value', 'user_name'],
  },
  cafe_users: {
    rows: load('cafe_users.json'),
    cols: ['id', 'name', 'role', 'password_hash', 'created_at'],
  },
};

const out = [];
for (const [table, { rows, cols }] of Object.entries(tables)) {
  for (const row of rows) {
    out.push(`INSERT INTO ${table} (${cols.join(', ')}) VALUES (${cols.map((c) => sql(row[c])).join(', ')});`);
  }
}
writeFileSync(join(dir, 'import.sql'), out.join('\n') + '\n');
console.log(`import.sql: ${out.length} INSERT`);

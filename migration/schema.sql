DROP TABLE IF EXISTS items;
CREATE TABLE items (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  name TEXT NOT NULL,
  min_qty TEXT NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  office_stock INTEGER,
  pantry_stock INTEGER,
  expiry_date TEXT,
  created_at TEXT NOT NULL,
  purchase_url TEXT,
  sort_order INTEGER,
  product_name TEXT,
  unit TEXT NOT NULL
);

DROP TABLE IF EXISTS stock_logs;
CREATE TABLE stock_logs (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  item_name TEXT NOT NULL,
  field TEXT NOT NULL,
  old_value INTEGER NOT NULL,
  new_value INTEGER NOT NULL,
  user_name TEXT NOT NULL
);

DROP TABLE IF EXISTS cafe_users;
CREATE TABLE cafe_users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL
);

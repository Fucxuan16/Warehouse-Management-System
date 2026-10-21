CREATE TABLE IF NOT EXISTS app_users (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventory (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  import_date DATE NOT NULL,
  purchase_price BIGINT NOT NULL CHECK (purchase_price >= 0),
  sale_price BIGINT NOT NULL CHECK (sale_price >= 0),
  quantity BIGINT NOT NULL CHECK (quantity >= 0 AND quantity <= 9007199254740991),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS inventory_id_case_insensitive
  ON inventory (LOWER(id));

CREATE TABLE IF NOT EXISTS activity (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('in', 'out')),
  product_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  quantity BIGINT NOT NULL CHECK (quantity > 0 AND quantity <= 9007199254740991),
  created_by TEXT NOT NULL REFERENCES app_users(username),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS activity_created_at_desc
  ON activity (created_at DESC, id DESC);

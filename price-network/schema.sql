CREATE TABLE IF NOT EXISTS observations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  item_id INTEGER NOT NULL,
  price INTEGER NOT NULL,
  observed_at INTEGER NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('itemmarket','bazaar','travel')),
  received_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_observations_item_time
ON observations (item_id, observed_at DESC);

CREATE INDEX IF NOT EXISTS idx_observations_received
ON observations (received_at DESC);

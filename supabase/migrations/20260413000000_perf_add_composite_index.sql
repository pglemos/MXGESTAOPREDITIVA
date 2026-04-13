-- Migration to resolve DB-03: N+1 Queries / Missing Indexes

-- Add composite index for filtering by store and date
CREATE INDEX IF NOT EXISTS idx_checkins_store_date ON daily_checkins (store_id, reference_date);

-- Add composite index for filtering by seller and date
CREATE INDEX IF NOT EXISTS idx_checkins_seller_date ON daily_checkins (seller_user_id, reference_date);

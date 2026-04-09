-- Enable trigram search and add index for manga title search.
-- Run this SQL manually on PostgreSQL.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS manga_title_trgm_idx
ON mangas
USING gin (lower(title) gin_trgm_ops);

COMMIT;

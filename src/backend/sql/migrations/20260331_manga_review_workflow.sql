-- Manga/Chapter review workflow migration
-- Run this SQL manually on PostgreSQL.

BEGIN;

ALTER TABLE mangas
  ADD COLUMN IF NOT EXISTS processing_error TEXT,
  ADD COLUMN IF NOT EXISTS review_note TEXT;

ALTER TABLE chapters
  ADD COLUMN IF NOT EXISTS processing_error TEXT,
  ADD COLUMN IF NOT EXISTS review_note TEXT;

ALTER TABLE mangas DROP CONSTRAINT IF EXISTS mangas_status_check;
ALTER TABLE mangas
  ADD CONSTRAINT mangas_status_check
  CHECK (
    status IN (
      'draft',
      'processing',
      'pending_review',
      'published',
      'rejected',
      'processing_failed'
    )
  );

ALTER TABLE chapters DROP CONSTRAINT IF EXISTS chapters_status_check;
ALTER TABLE chapters
  ADD CONSTRAINT chapters_status_check
  CHECK (
    status IN (
      'draft',
      'processing',
      'pending_review',
      'published',
      'rejected',
      'processing_failed'
    )
  );

COMMIT;

-- ── Migration 00081: video_url on vehicles ───────────────────────────────────
-- Adds an optional video URL (YouTube / Vimeo) to vehicle listings.
-- Dealers can embed a short walkround or presentation video.
-- The URL is stored raw; the client extracts the embed ID at render time.

ALTER TABLE vehicles
  ADD COLUMN IF NOT EXISTS video_url TEXT;

COMMENT ON COLUMN vehicles.video_url IS
  'Optional YouTube or Vimeo URL for a vehicle presentation/walkround video.';

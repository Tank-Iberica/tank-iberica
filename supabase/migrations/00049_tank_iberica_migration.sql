-- Tank Ibérica User Migration (Session 13)
-- Mark migrated Tank Ibérica users for forced password reset

-- This migration marks all users migrated from Tank Ibérica to force a password reset
-- on their next login for security reasons.
-- This is idempotent and safe to re-run.

UPDATE auth.users
SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"force_password_reset": true}'::jsonb
WHERE raw_user_meta_data->>'migrated_from' = 'tank-iberica'
  AND raw_user_meta_data->>'force_password_reset' IS NULL;

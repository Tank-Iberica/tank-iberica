-- ============================================================
-- Migration 00165: Add default_currency to vertical_config
-- ============================================================
-- Enables multi-market support. Each vertical can define its own
-- default currency. Defaults to EUR for existing verticals.
-- Used by invoicing, pricing display, and subscription checkout.

ALTER TABLE vertical_config
  ADD COLUMN IF NOT EXISTS default_currency VARCHAR(3) DEFAULT 'EUR';

COMMENT ON COLUMN vertical_config.default_currency IS
  'ISO 4217 currency code used as default for this vertical (e.g., EUR, GBP, USD). Affects pricing display and invoicing.';

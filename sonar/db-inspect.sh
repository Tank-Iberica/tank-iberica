#!/bin/bash
# ------------------------------------------------
# Tracciona — Supabase DB Inspection
# Uso: npm run db:inspect
# ------------------------------------------------

set -e

echo "========================================"
echo "  Tracciona — Database Inspection"
echo "========================================"
echo ""

echo ">> Table Stats (sizes + row counts)"
echo "----------------------------------------"
npx supabase inspect db table-stats --linked
echo ""

echo ">> Index Stats (usage + unused indexes)"
echo "----------------------------------------"
npx supabase inspect db index-stats --linked
echo ""

echo ">> Bloat (dead tuples / wasted space)"
echo "----------------------------------------"
npx supabase inspect db bloat --linked
echo ""

echo ">> Vacuum Stats"
echo "----------------------------------------"
npx supabase inspect db vacuum-stats --linked
echo ""

echo ">> DB Stats (cache hit rates, sizes)"
echo "----------------------------------------"
npx supabase inspect db db-stats --linked
echo ""

echo ">> Long Running Queries (>5 min)"
echo "----------------------------------------"
npx supabase inspect db long-running-queries --linked
echo ""

echo ">> Blocking Queries"
echo "----------------------------------------"
npx supabase inspect db blocking --linked
echo ""

echo "========================================"
echo "  Inspection complete"
echo "========================================"

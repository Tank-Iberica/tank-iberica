Run a complete verification of the current project state:

1. `npm run lint` — Report any lint errors.
2. `npm run typecheck` — Report any TypeScript errors.
3. `npm run test` — Run all unit and component tests. Report failures.
4. Check that ALL components render correctly at 360px width (review CSS, check for overflow, verify touch targets ≥ 44px).
5. Check that NO file contains:
   - `innerHTML` (use textContent or Vue template binding)
   - `console.log` (use proper error handling or Sentry)
   - Hardcoded API keys or credentials
   - Hardcoded category/subcategory/filter names (must come from DB)
   - Hardcoded Spanish or English text outside of i18n files
6. Check that every page with `[slug]` has proper `useSeoMeta()` for SEO.
7. Report a summary:
   - ✅ What passes
   - ❌ What fails (with file and line number)
   - 🔧 Suggested fixes for each failure

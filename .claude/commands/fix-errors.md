Find and fix all current errors in the project:

1. Run `npm run lint` — fix all lint errors automatically where possible, manually where needed.
2. Run `npm run typecheck` — fix all TypeScript errors.
3. Run `npm run test` — fix all failing tests.
4. Check the browser console (if dev server is running) for any runtime errors.
5. After fixing, run all three checks again to confirm everything passes.
6. Create a single git commit: `fix: resolve lint/type/test errors`
7. Report what was fixed.

Execute the next task from the roadmap following these rules:

1. Read @docs/hoja-de-ruta.md to identify the current step and task.
2. Read @docs/progreso.md to see what's already done.
3. Identify the NEXT incomplete task.
4. Before writing any code, create a plan:
   - What files will be created/modified
   - What dependencies are needed
   - What could go wrong
   - How to verify it works
5. Show me the plan and wait for my approval.
6. After approval, implement the task.
7. After implementation, run verification:
   - `npm run lint` (must pass)
   - `npm run typecheck` (must pass)
   - `npm run test` (must pass, if tests exist for this task)
   - Manual verification check described in the task
8. If all checks pass, update @docs/progreso.md marking the task as complete.
9. Create a git commit with conventional commit message.
10. Report what was done, what was verified, and what the next task is.

IMPORTANT:
- Every component must work on 360px mobile FIRST.
- Vehicles and news are PAGES with real URLs, never modals.
- Categories, subcategories, and filters are ALWAYS read from the database.
- Never hardcode text — use i18n (es.json / en.json).
- Never use innerHTML. Vue escapes by default.
- If a task requires creating a Supabase table, include the full SQL migration in supabase/migrations/.

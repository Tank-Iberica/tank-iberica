Genera tests para el módulo indicado de Tracciona.

**Frameworks:**

- Unit/Integration: Vitest
- E2E: Playwright
- Security: Vitest contra servidor corriendo

**Estructura de carpetas:**

- tests/unit/ → funciones, composables, utils
- tests/security/ → auth, webhooks, crons, IDOR
- tests/e2e/journeys/ → flujos de usuario completos

**Para cada test incluye:**

- Happy path
- Error handling (401, 403, 404, 500)
- Edge cases (datos vacíos, duplicados, permisos cruzados)
- Boundary conditions (límites de rate limiting, tamaño de archivos)

**Patrones Tracciona:**

- Auth: verificar que sin token devuelve 401
- Ownership: verificar que usuario A no puede acceder a datos de usuario B
- Webhooks: verificar que sin firma correcta se rechaza
- Crons: verificar que sin CRON_SECRET devuelve 401

Módulo a testear: $ARGUMENTS

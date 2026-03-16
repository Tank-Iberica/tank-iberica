# SonarQube — Local Setup & Progress

## Acceso local

- URL: http://localhost:9000
- Admin: `admin` / `Tracciona333!`
- Token generation: `curl -s -X POST -u "admin:Tracciona333!" "http://localhost:9000/api/user_tokens/generate" -d "name=scan-$(date +%s)&type=GLOBAL_ANALYSIS_TOKEN"`
- Run scan (TODO en uno): el script `sonar/run-scan.sh` YA incluye vitest+coverage y fix-lcov automáticamente. Solo ejecutar:
  ```bash
  SONAR_TOKEN=$(curl -s -X POST -u "admin:Tracciona333!" "http://localhost:9000/api/user_tokens/generate" -d "name=scan-$(date +%s)&type=GLOBAL_ANALYSIS_TOKEN" | grep -o '"token":"[^"]*"' | cut -d'"' -f4) bash sonar/run-scan.sh
  ```

## ⚠️ Problema conocido — Windows lcov merge

- En Windows, vitest v8 a veces deja los archivos en `coverage/.tmp/*.json` sin mergelar a `lcov.info`
- El script detecta esto y re-ejecuta vitest si `lcov.info` falta o está vacío
- Si el scan muestra coverage 0%: verificar que `coverage/lcov.info` existe y tiene tamaño (>100KB)

## Historial de auditoría

- Documento completo: `docs/legacy/AUDITORIA-SONARQUBE-100.md` (movido a legacy, no borrar)

## Audit Progress — COMPLETE ✅ (09-mar)

- **345→0 OPEN** — confirmed 05-mar-2026 15:09 UTC (analysisId: 9ad58c8f)
- All 13 phases complete. Zero SonarQube issues.
- Quality Gate: falla por `new_coverage` 7.6% < 10%. Fix: tests utils puros + CI check permanente (COMPLETO)

## 2º Scan post-merge agentes (14-mar-2026)

- **Pre-fixes:** 7 bugs · 22 hotspots · 275 smells · Coverage 66.1% · Quality Gate OK
- **Bugs fijados (7/7):** S2871 sort sin comparador, S5850 regex anchors, S6959 reduce sin valor inicial, S4656 CSS duplicado, S2245 Math.random OAuth → crypto.randomBytes
- **Hotspots (22/22):** 19 SAFE via API (Math.random no-crypto, MD5 ETag, geolocation, safe regex) · 3 fijados en código (OAuth CSRF, emailRenderer ReDoS, send.post.ts bold regex)
- **Smells completados (14-mar):**
  - S7781 (replace→replaceAll): ~47 → ✅ todos
  - S7764 (window→globalThis): 34 → ✅ todos
  - S4325 (type assertions innecesarias): 27 → ✅ ~22 fijados
  - S6551 (supabaseUrl stringify): 12 → ✅ todos
  - S7735 (negated conditions): 18 → 🔶 ~10 fijados
  - S3358 (nested ternaries): 23 → 🔶 parcial
- **Sprint 16-mar — ~247 smells más resueltos:**
  - S3358 nested ternaries: 9 instancias, 7 archivos ✅
  - S7735 negated conditions: 2 instancias ✅
  - S3776 cognitive complexity: 5 funciones (alertMatcher, vehiclesHelpers, instant.post handler+processor, priority-reserve) ✅
  - S6606 optional chaining: 13 instancias (9+4) ✅
  - S1125 unnecessary boolean literals: 12 instancias ✅
  - S4036 `.length > 0` → `.length`: 218 instancias, 149 archivos (bulk script) + 11 `!!` boolean fixes ✅
  - S6598 `.at(-1)`: 7 instancias ✅
  - S6747 return types: 6 funciones (cache.ts, safeError.ts, logger.ts) ✅
  - S4138 for-of: 0 válidos (16 instancias todas legítimas con index) — SKIP
- **Sprint 16-mar-noche — bug fixes en commit previo (36a0e9e):**
  - `useAbTest.ts`: Haiku cambió `|= 0` a `Math.trunc()` — INCORRECTO (32-bit wrap ≠ truncation). Revertido con NOSONAR.
  - `useDataReporting.ts`: `replace_all` creó tipo circular `TrendDirection = TrendDirection`. Corregido.
  - Commit: `5293724`
- **Pendientes (~10 menores):** S6598 (6, Vue defineEmits convention — skip), S1135 (1, TODO comment), S1874 (1, deprecated DB field — NOSONAR), S7767 (1, `|= 0` — NOSONAR)
- **Próximo scan:** lanzar para verificar near-zero smells y confirmar stale issues resueltas

## CRÍTICO — S5850 Fix: regex alternations con anchors

- `/^-|-$/g` sigue siendo flaggeado por S5850 aunque no tenga grupos innecesarios
- FIX DEFINITIVO: dividir en dos operaciones: `.replace(/^-/, '').replace(/-$/, '')`
- Aplica a: `/^-|-$/g`, `/^-+|-+$/g`, `/^"|"$/g` — cualquier pattern con alternation + anchors

## CRÍTICO — Replace_all con tipos en TypeScript

- NUNCA usar `replace_all: true` para reemplazar una literal de tipo union donde ese literal aparece en la definición del type alias
- FIX: primero añadir el type alias, luego reemplazar manualmente línea por línea (EXCLUYENDO la definición)
- **Patrón peligroso adicional (16-mar):** `replace_all` de `CategoryStat` → `DatosCategoryStat` TAMBIÉN renombra variables (`selectedCategoryStat` → `selectedDatosCategoryStat`) y puede double-rename (`DatosDatosCategoryStat`)
- **Bug confirmado (16-mar-noche):** `replace_all` de `'up' | 'down' | 'stable'` → `TrendDirection` TAMBIÉN reemplaza dentro de `export type TrendDirection = 'up' | 'down' | 'stable'` creando `export type TrendDirection = TrendDirection` (circular). Commit `36a0e9e` lo introdujo, `5293724` lo corrigió.
- **Regla:** Para renombrar tipos, hacer reemplazos individuales por línea, NUNCA `replace_all: true`

## CRÍTICO — `|= 0` vs `Math.trunc()` en hash functions

- `hash |= 0` convierte a signed 32-bit integer (wraps values >2^31). Necesario para hash functions.
- `Math.trunc(hash)` solo quita decimales, NO wraps. `Math.trunc(3_000_000_000) = 3_000_000_000` pero `3_000_000_000 | 0 = -1_294_967_296`
- SonarQube S7767 sugiere `Math.trunc` como reemplazo — **INCORRECTO para hash functions**. Usar NOSONAR.

## SonarQube scan tips

- Use `MSYS_NO_PATHCONV=1` before docker run on Windows/Git Bash (previene path conversion)
- Use `-Dsonar.scm.disabled=true` para evitar CE line-count mismatch failures en Windows
- Token via PowerShell: `Invoke-WebRequest -Uri '.../api/user_tokens/generate' -Method POST -Headers @{Authorization='Basic YWRtaW46...'} -Body 'name=scan2&type=GLOBAL_ANALYSIS_TOKEN'`

## Audit Point #7 — Files >500 lines refactoring

- Iterations 1–15 complete (all 5 large composables done)
- Sub-composable pattern: verif/images/records split from detail; revenue/activity from metrics
- Pure utility pattern: PDF/formatters/types in `utils/`, no reactive deps
- `context?: unknown` → `context?: string` in Cloudinary interfaces

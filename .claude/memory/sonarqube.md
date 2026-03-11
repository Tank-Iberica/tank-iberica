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

## Audit Progress — COMPLETE ✅
- **345→0 OPEN** — confirmed 05-mar-2026 15:09 UTC (analysisId: 9ad58c8f)
- All 13 phases complete. Zero SonarQube issues.
- Quality Gate: falla por `new_coverage` 7.6% < 10%. Fix: tests utils puros + CI check permanente (COMPLETO)

## CRÍTICO — S5850 Fix: regex alternations con anchors
- `/^-|-$/g` sigue siendo flaggeado por S5850 aunque no tenga grupos innecesarios
- FIX DEFINITIVO: dividir en dos operaciones: `.replace(/^-/, '').replace(/-$/, '')`
- Aplica a: `/^-|-$/g`, `/^-+|-+$/g`, `/^"|"$/g` — cualquier pattern con alternation + anchors

## CRÍTICO — Replace_all con tipos en TypeScript
- NUNCA usar `replace_all: true` para reemplazar una literal de tipo union donde ese literal aparece en la definición del type alias
- FIX: primero añadir el type alias, luego reemplazar manualmente línea por línea

## SonarQube scan tips
- Use `MSYS_NO_PATHCONV=1` before docker run on Windows/Git Bash (previene path conversion)
- Use `-Dsonar.scm.disabled=true` para evitar CE line-count mismatch failures en Windows
- Token via PowerShell: `Invoke-WebRequest -Uri '.../api/user_tokens/generate' -Method POST -Headers @{Authorization='Basic YWRtaW46...'} -Body 'name=scan2&type=GLOBAL_ANALYSIS_TOKEN'`

## Audit Point #7 — Files >500 lines refactoring
- Iterations 1–15 complete (all 5 large composables done)
- Sub-composable pattern: verif/images/records split from detail; revenue/activity from metrics
- Pure utility pattern: PDF/formatters/types in `utils/`, no reactive deps
- `context?: unknown` → `context?: string` in Cloudinary interfaces

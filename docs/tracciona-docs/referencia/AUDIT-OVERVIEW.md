# Sistema de Auditoría — Estado Actual

> Documento vivo. Actualizar cuando cambie el estado de una herramienta.
> Última actualización: mar-2026

---

## Resumen ejecutivo

| Métrica                      | Valor                                     |
| ---------------------------- | ----------------------------------------- |
| Herramientas activas         | 18                                        |
| Checks automáticos en PR     | 5 (bloqueantes)                           |
| Checks automáticos diarios   | 11 (report-only)                          |
| Checks automáticos semanales | 2 (Lighthouse + DAST)                     |
| Checks manuales              | 3 (SonarQube, DAST triage, Restore drill) |
| Pendientes de activar        | 1 (Dependabot)                            |
| Endpoints monitorizados      | 63                                        |
| Migraciones validadas        | 71                                        |
| Tests activos                | 212 (196 pass / 13 fail / 3 todo)         |

---

## Mapa de cobertura

| Dimensión                         | Herramienta(s)                   | Estado                                                                  |
| --------------------------------- | -------------------------------- | ----------------------------------------------------------------------- |
| **Secretos en código**            | Gitleaks                         | ✅ Activo — bloqueante en PR                                            |
| **Dependencias vulnerables**      | npm audit + Trivy                | ✅ Activo — diario + bloqueante en PR                                   |
| **Actualizaciones automáticas**   | Dependabot                       | ⏳ Pendiente activar (1 click GitHub Settings)                          |
| **SAST (código estático)**        | Semgrep + SonarQube              | ✅ Semgrep automático · SonarQube manual lunes                          |
| **DAST (dinámico en producción)** | ZAP + Nuclei                     | ✅ Automático domingo · Triage manual lunes                             |
| **Calidad de código**             | ESLint + TypeScript              | ✅ Bloqueante en PR                                                     |
| **Código muerto**                 | knip                             | ✅ Diario (report-only)                                                 |
| **Tests unitarios**               | Vitest                           | ✅ Bloqueante en PR                                                     |
| **Tests E2E**                     | Playwright                       | ✅ En CI                                                                |
| **Accesibilidad**                 | axe-core/playwright              | ✅ Report-only (WCAG 2.1 AA)                                            |
| **Seguridad auth/CORS/injection** | authorization-regression.test.ts | ✅ 28 tests                                                             |
| **Consistencia migraciones BD**   | migrations-consistency.test.ts   | ✅ 6 tests                                                              |
| **Advisors BD (RLS, índices)**    | Supabase inspect db lint         | ✅ Diario (necesita SUPABASE_ACCESS_TOKEN)                              |
| **Rendimiento**                   | Lighthouse CI                    | ✅ Automático domingo (strict) · warn en PR                             |
| **Uptime / disponibilidad**       | UptimeRobot                      | ✅ Activo — 3 monitores (home, catálogo, api/health) · check cada 5 min |
| **Drift de endpoints**            | check-endpoint-drift.mjs         | ✅ Diario + auto-update en sesiones Claude                              |
| **SBOM (inventario deps)**        | CycloneDX via npm sbom           | ✅ Diario, artefacto 90 días                                            |
| **Detección debug en producción** | grep CI job                      | ✅ Diario                                                               |
| **SEO técnico**                   | seo-check.mjs                    | ✅ Diario                                                               |
| **Licencias**                     | audit-licenses.mjs               | ✅ Diario                                                               |

---

## Herramientas — Detalle operativo

### Tier 1 — Bloqueantes en PR (falla el PR si falla esto)

| Herramienta                | Workflow     | Qué detecta                                           |
| -------------------------- | ------------ | ----------------------------------------------------- |
| **Gitleaks**               | security.yml | Secretos, API keys, tokens en código                  |
| **ESLint + TypeScript**    | ci.yml       | Errores de código, tipos incorrectos                  |
| **npm audit** (--omit=dev) | security.yml | Vulnerabilidades HIGH/CRITICAL en deps de producción  |
| **Semgrep SAST**           | security.yml | Patrones OWASP Top 10, inyecciones, hardcoded secrets |
| **Vitest + Tests**         | ci.yml       | Tests unitarios, seguridad, migraciones               |

### Tier 2 — Diarios automáticos (report-only → escalará a bloqueante)

| Herramienta          | Cuándo    | Artefacto             | Escala a bloqueante cuando                |
| -------------------- | --------- | --------------------- | ----------------------------------------- |
| **Trivy SCA**        | 05:00 UTC | trivy-sca-report      | Cuando npm audit y Trivy estén calibrados |
| **knip** (dead code) | 05:00 UTC | dead-code-report      | Tras limpiar falsos positivos Nuxt        |
| **axe-core** (a11y)  | En E2E    | —                     | Cuando violations = 0                     |
| **Bundle size**      | —         | —                     | Tras definir baseline con `nuxi analyze`  |
| **SBOM**             | 05:00 UTC | sbom (90 días)        | Informativo                               |
| **Debug detection**  | 05:00 UTC | debug-report          | Informativo                               |
| **Endpoint drift**   | 05:00 UTC | endpoint-drift-report | Informativo                               |
| **DB advisors**      | 05:00 UTC | db-advisors-report    | Informativo                               |

### Tier 3 — Programados / Observación

| Herramienta             | Cuándo             | Requiere                  |
| ----------------------- | ------------------ | ------------------------- |
| **ZAP + Nuclei DAST**   | Domingo automático | Triage manual el lunes    |
| **Lighthouse** (strict) | Domingo automático | —                         |
| **SonarQube**           | Lunes manual       | Docker local en marcha    |
| **UptimeRobot**         | Continuo (24/7)    | Cuenta gratuita + API key |

---

## Pendientes de activar — Por orden de prioridad

### 1. UptimeRobot (15 min · gratis)

**Por qué es urgente:** Es el único gap que deja completamente ciego ante caídas de producción.

**Pasos:**

1. Crear cuenta en https://uptimerobot.com (plan gratuito: 50 monitores)
2. Ir a "API Settings" → generar API key (Read-Write)
3. Dar el API key a Claude Code → él crea los 3 monitores y configura alertas

**Claude creará:**

- Monitor `https://tracciona.com` (keyword check)
- Monitor `https://tracciona.com/catalogo`
- Monitor `https://tracciona.com/api/health`
- Alertas a tankiberica@gmail.com

### 2. Dependabot (1 min · gratis)

El archivo `.github/dependabot.yml` ya está en el repo.

**Activar:**

- GitHub → Settings → Code security and analysis → Dependabot alerts → Enable
- O ejecutar: `gh api -X PUT repos/{owner}/{repo}/vulnerability-alerts`

**Resultado:** PRs automáticos cada lunes con actualizaciones de dependencias.

### 3. GitHub Secrets para db-advisors

Verificar que estos secrets existen en GitHub → Settings → Secrets:

- `SUPABASE_ACCESS_TOKEN` — token de acceso a Supabase Management API
- `SUPABASE_PROJECT_REF` — `gmnrfuzekbwyzkgsaftv`

Si no existen, el job `db-advisors` falla silenciosamente (continue-on-error: true).

---

## Lo que Claude Code hace automáticamente

### En cada sesión (startup)

- Lee STATUS.md y CLAUDE.md
- Ejecuta `policy-status.mjs --brief`
- **Si es lunes:** Ejecuta SonarQube scan + triage artefactos DAST del domingo
- **Si es viernes:** Lista y resume Dependabot PRs pendientes
- **Cualquier día:** Comprueba si el restore drill trimestral está pendiente

### En respuesta a cambios (hooks)

- Al editar `server/api/*`: actualiza endpoint-baseline.json automáticamente
- Al detectar CLOSING_SESSION: limpia procesos Node y actualiza STATUS.md

### Bajo demanda (cuando lo pides)

- Gestionar monitores UptimeRobot via API (con API key)
- Ejecutar SonarQube y resumir findings
- Revisar artefactos CI y priorizar fixes según severity × exposure matrix
- Seguir Release Checklist antes de merges con migraciones

---

## SLAs activos (según AUDIT-POLICY.md)

| Severidad | Tiempo máximo  | Regla de escalado                                       |
| --------- | -------------- | ------------------------------------------------------- |
| CRITICAL  | 48–72 horas    | Sin excepción. Si no hay fix: mitigar o WAF rule        |
| HIGH      | 7 días         | Risk acceptance documentada si no hay fix (máx 30 días) |
| MEDIUM    | Próximo sprint | Evaluar en planning semanal                             |
| LOW       | Backlog        | Solo si coincide con otra tarea en la zona              |

---

## KPIs objetivo

| KPI                     | Objetivo                  | Estado actual                                           |
| ----------------------- | ------------------------- | ------------------------------------------------------- |
| Build siempre verde     | 100%                      | ✅                                                      |
| 0 CRITICAL sin fix >72h | 0                         | ✅ (ninguno activo)                                     |
| 0 HIGH sin fix >7 días  | 0                         | ⚠️ Ver errores activos en STATUS.md                     |
| Coverage no baja        | ≥2% (ratchet)             | ✅                                                      |
| Uptime                  | >99.5% mensual            | ✅ Midiendo (3 monitores activos, IDs: 802473000/02/03) |
| SonarQube issues        | No suben                  | 345 → objetivo 0 (16 sesiones)                          |
| Hotspots                | No suben vs scan anterior | Pendiente clasificar                                    |

---

## Documentos relacionados

| Documento                                 | Función                                                            |
| ----------------------------------------- | ------------------------------------------------------------------ |
| `AUDIT-POLICY.md`                         | SLAs, severity×exposure matrix, SSRF policy, tiers, calendario     |
| `AUDIT-METHODOLOGY.md`                    | Metodología detallada de cada herramienta                          |
| `RELEASE-CHECKLIST.md`                    | Checklist pre/post deploy para cambios críticos                    |
| `DISASTER-RECOVERY.md`                    | Backups, restore drills, procedimientos de recuperación            |
| `DATA-CLASSIFICATION.md`                  | Clasificación de datos GDPR (Crítico/Confidencial/Interno/Público) |
| `COMMIT-SIGNING.md`                       | Guía GPG para cuando haya equipo                                   |
| `docs/auditorias/AUDITORIA-26-FEBRERO.md` | Snapshot histórico (~83/100)                                       |

---

_Próxima revisión: cuando cambie el estado de UptimeRobot o Dependabot._

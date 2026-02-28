# STATUS — Tracciona

**Última actualización:** 2026-03-03
**Sesiones completadas:** 0–64 + Iter 1–15 auditoría + sesiones ad-hoc hasta 03-mar
**Puntuación global:** 79/100 (auditoría 26-feb) · Historial completo: `git log STATUS.md`

---

## Métricas reales del proyecto

| Módulo           | Real (verificado 28-feb)                         |
| ---------------- | ------------------------------------------------ |
| Páginas Vue      | 124                                              |
| Componentes Vue  | 418                                              |
| Composables      | 147                                              |
| Endpoints API    | 62                                               |
| Servicios server | 8                                                |
| Migraciones SQL  | 65                                               |
| Tablas BD        | 89                                               |
| Tests totales    | 34 (12 E2E + 5 seg + 11 unit + 3 comp + 3 setup) |
| CI/CD workflows  | 7                                                |

---

## Estado por módulo

| Módulo                    | Estado         | Notas                                                           |
| ------------------------- | -------------- | --------------------------------------------------------------- |
| Catálogo + filtros        | ✅ Completo    | FilterBar.vue 1.999 líneas — refactoring pendiente              |
| Fichas de vehículo        | ✅ Completo    | SEO, JSON-LD, OG, hreflang, breadcrumbs                         |
| Auth + perfiles           | ✅ Completo    | Supabase Auth, Google Login, Turnstile CAPTCHA                  |
| Admin panel               | ✅ Completo    | ~115 strings sin i18n (bajo impacto, solo 2 personas)           |
| Noticias y guías          | ✅ Completo    |                                                                 |
| Legal / GDPR              | ✅ Completo    | RAT no formalizado                                              |
| Verificación vehículos    | ✅ Completo    |                                                                 |
| Subastas                  | ✅ Completo    |                                                                 |
| Publicidad + ads          | ✅ Completo    |                                                                 |
| Pagos Stripe              | ✅ Completo    | Webhooks con firma HMAC                                         |
| PWA + offline             | ✅ Completo    |                                                                 |
| CI/CD                     | ✅ Completo    | lint, typecheck, build, E2E, Lighthouse, DAST, backup           |
| WhatsApp pipeline         | ✅ Completo    |                                                                 |
| Multi-vertical            | ✅ Completo    | Columna `vertical` en tablas clave                              |
| Dashboard dealer          | ✅ Completo    |                                                                 |
| Transparencia DSA         | ✅ Completo    |                                                                 |
| Admin KPI + métricas      | ✅ Completo    |                                                                 |
| Alertas y favoritos       | ✅ Completo    |                                                                 |
| Herramientas dealer       | ✅ Completo    |                                                                 |
| Datos mercado público     | ✅ Completo    |                                                                 |
| Infra monitoring          | ✅ Completo    |                                                                 |
| Monetización avanzada     | ✅ Completo    | Trials 14d, dunning, API keys dealers                           |
| Event bus + feature flags | ✅ Completo    |                                                                 |
| SEO avanzado              | ✅ Completo    | Schema.org, hreflang, canonical, sitemap dinámico               |
| Páginas de error          | ✅ Completo    | 404/500/503 con contexto                                        |
| Seguridad                 | ⚠️ Parcial     | Rate limiting **deshabilitado en producción** — requiere CF WAF |
| Landing pages builder     | 🔵 Pospuesto   | Solo si dealers lo solicitan activamente                        |
| Prebid demand partners    | 🔵 Placeholder | Estructura lista, sin cuentas reales                            |
| API valoración (/v1)      | 🔵 Pospuesto   | Devuelve 503 hasta ≥500 transacciones históricas                |

---

## Errores activos

| ID   | Severidad | Problema                                                                                  | Acción                                |
| ---- | --------- | ----------------------------------------------------------------------------------------- | ------------------------------------- |
| P0-3 | 🔴 P0     | Rate limiting deshabilitado en producción (in-memory no funciona en CF Workers stateless) | Configurar reglas CF WAF (fundadores) |

> Todos los demás errores (P0-1/2, P1-1/2/3, P2-1/2/3, S-01, S-03) resueltos. Ver `git log STATUS.md`.

---

## Auditoría #7 — Archivos >500 líneas

Iter 1–15 completas ✅ (commit `7dde04a`). **Pendiente:** FilterBar.vue (1.999 líneas).

---

## Pendientes documentación

- [ ] `docs/ESTADO-REAL-PRODUCTO.md` desactualizado (generado 25-feb)
- [ ] `README.md` raíz es template genérico de Nuxt — reemplazar con contenido real
- [ ] RAT (Registro Actividades de Tratamiento) GDPR no formalizado como documento legal
- [ ] Decidir: ¿reemplazar `CLAUDE.md` con `CLAUDE2.md`? (ver git para el archivo)

---

## Changelog de sesiones

| Fecha  | Resumen                                                                                                                            |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| 03-mar | CLAUDE.md: 5 reglas no negociables, Stack añadido, secciones fusionadas; STATUS.md comprimido 294→110 líneas; CLAUDE2.md eliminado |
| 03-mar | Hook condicional: solo mata proceso Node del puerto 3000 si STATUS.md contiene CLOSING_SESSION                                     |
| 02-mar | Hook PostToolUse automático para limpieza Node.js al actualizar STATUS.md                                                          |
| 01-mar | Fix admin: `isAdmin` usa `role='admin'`; refactor ruta dealer `/vendedor/[slug]` → `/[slug]`                                       |
| 28-feb | Dealer portal completo: catálogo filtrado, SEO, working hours, contacto                                                            |
| 28-feb | `docs/PROYECTO-CONTEXTO.md` creado (530 líneas, documento maestro de contexto)                                                     |
| 28-feb | Hallazgos menores: JSDoc, ARIA, CHECK constraints, Snyk CI, legacy banner, excel chunks                                            |
| 28-feb | Auditoría #7 Iter 1–15: 5 composables grandes refactorizados, typecheck 0 errores                                                  |
| 26-feb | Auditoría global 79/100. 12 errores P0/P1/P2 identificados y resueltos (menos P0-3)                                                |

---

## Próximas acciones

1. **P0-3:** Configurar Cloudflare WAF — activa rate limiting en producción
2. **FilterBar.vue (1.999 líneas):** Auditoría #7 iteración 16
3. **Founding Dealers:** Contactar primeros 10 (tarea de negocio, no código)

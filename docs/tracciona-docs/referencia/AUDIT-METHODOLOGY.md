# Metodología de Auditoría — Tracciona

> Framework de auditoría interna para verificar el estado del proyecto.
> Extraído de auditorías realizadas 25-26 febrero 2026, consolidado marzo 2026.

---

## 12 Dimensiones de Evaluación

Cada dimensión se puntúa de 0 a 100. La media ponderada da la puntuación global.

| #   | Dimensión             | Peso | Qué evalúa                                                       |
| --- | --------------------- | ---- | ---------------------------------------------------------------- |
| 1   | Seguridad             | Alto | RLS, CSP, headers, rate limiting, OWASP Top 10, secretos         |
| 2   | Código/Arquitectura   | Alto | Modularidad, tests, tipos, DRY, archivos <500 líneas             |
| 3   | BD e Integridad       | Alto | Migraciones, índices, FK, RLS por tabla, aislamiento vertical    |
| 4   | Infraestructura       | Med  | CI/CD, deploy, monitoring, backups, failover                     |
| 5   | Rendimiento/UX        | Med  | Lighthouse, CLS, LCP, touch targets, mobile-first, accesibilidad |
| 6   | Negocio/Monetización  | Med  | Modelo validado, pricing, unit economics, churn, retention       |
| 7   | Legal/Compliance      | Alto | GDPR, DSA, cookies, ToS, privacidad, reportes abuso              |
| 8   | Documentación         | Bajo | Docs alineados con código, onboarding, API docs                  |
| 9   | Equipo/Procesos       | Med  | Bus factor, gobernanza, PR review, on-call                       |
| 10  | Estrategia/Mercado    | Bajo | Diferencial, competidores, TAM, barriers to entry                |
| 11  | Resiliencia           | Med  | Backups probados, failover probado, DR drill, mirror repo        |
| 12  | Propiedad Intelectual | Med  | Marca registrada, dominios, licencias OSS, patentes              |

### Escala de puntuación

| Rango  | Indicador | Significado                           |
| ------ | --------- | ------------------------------------- |
| 90-100 | Verde     | Excelente — producción madura         |
| 80-89  | Verde     | Bueno — lanzamiento seguro            |
| 70-79  | Amarillo  | Aceptable — corregir antes de escalar |
| 60-69  | Naranja   | Riesgo — corregir antes de lanzar     |
| <60    | Rojo      | Crítico — bloqueante                  |

---

## Checklist de Verificación Rápida (15 min)

Para verificar estado del proyecto rápidamente:

```
1. [ ] `npm run build` — compila sin errores
2. [ ] `npx nuxi typecheck` — 0 errores TS (o documentar los existentes)
3. [ ] `npm run lint` — 0 errores ESLint nuevos
4. [ ] `npm run test` — todos los tests pasan
5. [ ] git status limpio (o cambios documentados)
6. [ ] STATUS.md actualizado con última sesión
```

---

## Checklist Mobile (10 puntos, 15 min)

> Para fundadores: probar en dispositivo real después de cambios UI.

1. **Home:** Carga <3s en 4G, hero visible sin scroll, CTA claro
2. **Catálogo:** Filtros accesibles, cards legibles, scroll suave
3. **Ficha vehículo:** Galería swipeable, botón contacto visible, specs legibles
4. **Formularios:** Inputs 44px, teclado correcto (tel/email/number), errores claros
5. **Navegación:** Menú hamburger funciona, breadcrumbs visibles, back natural
6. **Touch:** Botones 44px mínimo, sin hover-only interactions
7. **Dashboard dealer:** Tablas scrollables, acciones accesibles
8. **PWA:** Instalable, offline page funciona
9. **Legal:** Todas las páginas accesibles y legibles
10. **Performance:** Sin layout shifts visibles, imágenes cargan progresivamente

---

## Checklist Pre-Lanzamiento

### Código

- [ ] Build limpio (`npm run build`)
- [ ] TypeScript sin errores (`npx nuxi typecheck`)
- [ ] Tests pasan (`npm run test`)
- [ ] Lint limpio (`npm run lint`)
- [ ] Ningún secreto hardcodeado (grep `supabase.co`, API keys)
- [ ] `.env.example` actualizado con todas las variables

### Seguridad

- [ ] RLS habilitado en todas las tablas (`SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename NOT IN (SELECT tablename FROM pg_catalog.pg_policies ...)`)
- [ ] Security headers configurados (CSP, HSTS, X-Frame-Options)
- [ ] Rate limiting activo (Cloudflare WAF)
- [ ] CAPTCHA en formularios públicos (Turnstile)
- [ ] Webhooks con verificación de firma (Stripe HMAC)

### Legal

- [ ] /legal — Términos generales + punto de contacto DSA
- [ ] /legal/privacidad — GDPR completo con derechos del usuario
- [ ] /legal/cookies — Banner + página con detalle de cookies
- [ ] /legal/condiciones — ToS por servicio
- [ ] /transparencia — DSA Art. 13
- [ ] /seguridad/politica-divulgacion — Responsible disclosure

### Infraestructura

- [ ] Backups configurados y probados
- [ ] CI/CD funcional (lint + typecheck + build + test)
- [ ] Lighthouse CI con thresholds (≥80 perf, ≥90 a11y/bp/seo)
- [ ] DNS correcto (Cloudflare)
- [ ] SSL activo (automático en CF Pages)

### SEO

- [ ] Sitemap dinámico generado
- [ ] robots.txt correcto
- [ ] Meta tags únicos por página
- [ ] OG + Twitter Cards configurados
- [ ] Google Search Console verificado
- [ ] Schema.org en fichas de vehículo

### Negocio

- [ ] Stripe configurado (webhooks, productos, precios)
- [ ] Emails transaccionales funcionando (Resend)
- [ ] Marca registrada o en proceso (OEPM)

---

## Cómo ejecutar una auditoría completa

1. **Preparación:** Lee STATUS.md, PROYECTO-CONTEXTO.md, BACKLOG.md
2. **Por cada dimensión:**
   - Verifica contra código real (no documentación)
   - Ejecuta los comandos de verificación aplicables
   - Puntúa de 0-100 con justificación
3. **Clasifica hallazgos:** Crítico (bloqueante) > Alto > Medio > Bajo
4. **Para cada hallazgo:**
   - Archivo(s) afectado(s)
   - Problema concreto
   - Solución propuesta con timeline
   - Verificación post-fix
5. **Resultado:** Tabla resumen + hallazgos detallados + plan de remediación

### Errores comunes en auditorías

- Verificar contra documentación en vez de código → siempre `grep`/`glob` el código
- Asumir que sesión planificada = no ejecutada → verificar en migraciones y git log
- No distinguir entre "falta" y "implementado diferente" → leer la implementación real
- Puntuación por defecto → justificar cada punto

---

## Historial de auditorías

| Fecha   | Tipo    | Puntuación | Notas                                         |
| ------- | ------- | ---------- | --------------------------------------------- |
| 25-feb  | Externa | 71/100     | Desactualizada — verificó docs, no código     |
| 26-feb  | Interna | 79/100     | Primera auditoría real contra código          |
| 26-feb  | Cruzada | 83/100     | Verificación de la externa contra código real |
| Próxima | —       | —          | Programar post-lanzamiento                    |

---

_Consolidado marzo 2026. Fuentes: AUDITORIA-26-FEBRERO.md, AUDITORIA-PROFUNDA-25FEB, AUDITORIA-UX-MOVIL.md, VERIFICACION-AUDITORIA-EXTERNA.md._

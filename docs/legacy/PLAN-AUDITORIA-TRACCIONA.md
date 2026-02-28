> ⚠️ **[LEGACY]** Documento histórico — solo referencia. No modificar ni usar como fuente de verdad. Ver `docs/tracciona-docs/` para documentación activa.

# Plan de Auditoría Integral — Tracciona / TradeBase

**Versión:** 1.0  
**Fecha:** 25 febrero 2026  
**Horizonte:** Desde hoy hasta 20 años vista (2026–2046)  
**Autor:** Auditoría interna  
**Propietarios:** J.M.G. + J.C.G. — Tank Ibérica SL / TradeBase SL

---

## Índice

1. [Filosofía de auditoría](#1-filosofía-de-auditoría)
2. [Mapa de dimensiones auditables](#2-mapa-de-dimensiones-auditables)
3. [Dimensión 1 — Seguridad](#3-dimensión-1--seguridad)
4. [Dimensión 2 — Código y arquitectura](#4-dimensión-2--código-y-arquitectura)
5. [Dimensión 3 — Base de datos e integridad de datos](#5-dimensión-3--base-de-datos-e-integridad-de-datos)
6. [Dimensión 4 — Infraestructura y operaciones](#6-dimensión-4--infraestructura-y-operaciones)
7. [Dimensión 5 — Rendimiento y experiencia de usuario](#7-dimensión-5--rendimiento-y-experiencia-de-usuario)
8. [Dimensión 6 — Negocio y monetización](#8-dimensión-6--negocio-y-monetización)
9. [Dimensión 7 — Legal, compliance y regulatorio](#9-dimensión-7--legal-compliance-y-regulatorio)
10. [Dimensión 8 — Documentación y conocimiento](#10-dimensión-8--documentación-y-conocimiento)
11. [Dimensión 9 — Equipo, procesos y gobernanza](#11-dimensión-9--equipo-procesos-y-gobernanza)
12. [Dimensión 10 — Estrategia, mercado y competencia](#12-dimensión-10--estrategia-mercado-y-competencia)
13. [Dimensión 11 — Resiliencia y continuidad de negocio](#13-dimensión-11--resiliencia-y-continuidad-de-negocio)
14. [Dimensión 12 — Propiedad intelectual y activos digitales](#14-dimensión-12--propiedad-intelectual-y-activos-digitales)
15. [Calendario maestro de auditoría](#15-calendario-maestro-de-auditoría)
16. [Fases evolutivas del plan (2026–2046)](#16-fases-evolutivas-del-plan-20262046)
17. [Herramientas y coste por fase](#17-herramientas-y-coste-por-fase)
18. [Plantilla de informe de auditoría](#18-plantilla-de-informe-de-auditoría)
19. [Criterios de puntuación unificados](#19-criterios-de-puntuación-unificados)
20. [Gobernanza del plan de auditoría](#20-gobernanza-del-plan-de-auditoría)

---

## 1. Filosofía de auditoría

Este plan no es un ejercicio burocrático. Nace de una realidad concreta: dos hermanos sin empleados, un marketplace B2B que aspira a convertirse en un grupo de 7 verticales, y la necesidad de que en cualquier momento — mañana, en 5 años, o en 20 — cualquier persona (un inversor, un auditor, un nuevo CTO, un regulador, o los propios fundadores) pueda entender, evaluar y confiar en el estado real del proyecto.

**Principios:**

- **Auditar lo que existe, no lo que aspiramos.** Cada auditoría mide el estado real contra un estándar definido. Sin autoengaño.
- **Proporcionalidad.** Un proyecto de 2 personas no necesita ISO 27001 certificada el año 1. Pero sí necesita saber que sus contraseñas están hasheadas y sus backups funcionan.
- **Trazabilidad.** Cada auditoría genera un informe fechado que se archiva. Se puede trazar la evolución del proyecto año a año.
- **Automatización progresiva.** Lo que hoy se audita manualmente, mañana se audita con scripts, pasado con CI/CD.
- **Independencia.** Las auditorías externas se introducen cuando el proyecto lo justifica económicamente, no antes.

---

## 2. Mapa de dimensiones auditables

| #   | Dimensión                  | Qué cubre                                                                  | Frecuencia base       |
| --- | -------------------------- | -------------------------------------------------------------------------- | --------------------- |
| 1   | **Seguridad**              | Auth, secretos, XSS, CSRF, RLS, webhooks, dependencias, cabeceras, pentest | Continua + trimestral |
| 2   | **Código y arquitectura**  | Calidad, modularidad, deuda técnica, convenciones, tests, cobertura        | Mensual + por release |
| 3   | **Base de datos**          | Integridad, migraciones, índices, RLS, backups, rendimiento queries        | Trimestral            |
| 4   | **Infraestructura**        | Uptime, CDN, DNS, SSL, costes, escalabilidad, monitorización               | Mensual               |
| 5   | **Rendimiento y UX**       | Core Web Vitals, accesibilidad, mobile, i18n, flujos críticos              | Trimestral            |
| 6   | **Negocio y monetización** | Ingresos, canales, conversión, unit economics, pricing                     | Mensual               |
| 7   | **Legal y compliance**     | GDPR/LOPD, cookies, ToS, contratos, fiscalidad UK/ES, facturación          | Semestral             |
| 8   | **Documentación**          | Actualización, coherencia, onboarding, single source of truth              | Trimestral            |
| 9   | **Equipo y procesos**      | Capacidad, bus factor, flujos de trabajo, comunicación, formación          | Semestral             |
| 10  | **Estrategia y mercado**   | Competencia, posicionamiento, roadmap, verticales, mercado                 | Semestral             |
| 11  | **Resiliencia**            | Backups, disaster recovery, plan B técnico, dependencias de terceros       | Semestral             |
| 12  | **Propiedad intelectual**  | Dominios, marcas, código propio vs licencias, activos digitales            | Anual                 |

---

## 3. Dimensión 1 — Seguridad

### 3.1 Checklist de auditoría continua (cada commit / deploy)

- [ ] `npm audit` sin vulnerabilidades críticas o altas
- [ ] Semgrep CE pasa sin hallazgos de severidad alta
- [ ] Snyk free sin vulnerabilidades conocidas en dependencias
- [ ] Tests de seguridad automatizados pasan (auth, webhooks, IDOR, crons)
- [ ] No hay secretos en el código (grep de patterns: API keys, tokens, passwords)
- [ ] CSP y cabeceras de seguridad presentes en respuestas

### 3.2 Checklist trimestral

- [ ] **Auth y sesiones:** Todas las rutas protegidas requieren `serverSupabaseUser(event)`. No hay bypass posible.
- [ ] **RLS:** Todas las tablas con datos de usuario tienen RLS activo. Verificar con query directa sin auth → debe fallar.
- [ ] **Ownership:** Operaciones CRUD verifican que el usuario es dueño del recurso. Test IDOR: cambiar ID en request → 403.
- [ ] **Webhooks:** Stripe verifica firma con `constructEvent`. WhatsApp verifica HMAC. No hay webhook sin verificación.
- [ ] **Crons:** Todos protegidos con CRON_SECRET. Sin secreto → 401.
- [ ] **Secretos:** Todos en `runtimeConfig`, ninguno hardcodeado. Variables de entorno documentadas en `.env.example`.
- [ ] **XSS:** `v-html` solo con DOMPurify o contenido controlado (SVG inline). `DOMPurify.sanitize()` en inputs que renderizan HTML.
- [ ] **Rate limiting:** Rutas sensibles (login, registro, checkout, contacto) tienen rate limit. Documentar límites.
- [ ] **Mensajes de error:** En producción, errores devuelven mensajes genéricos. No se filtra stack, rutas internas ni datos de BD.
- [ ] **Dependencias:** Todas las dependencias actualizadas al último patch. Sin dependencias abandonadas (>2 años sin commit).
- [ ] **CORS:** Configuración restrictiva, solo dominios propios.
- [ ] **Logs:** No se loguean contraseñas, tokens de sesión ni datos de pago.

### 3.3 Checklist anual

- [ ] **Pentest externo** (cuando presupuesto lo permita; hasta entonces, auto-pentest documentado con OWASP ZAP o similar herramienta gratuita)
- [ ] **Revisión de permisos:** Quién tiene acceso a Supabase dashboard, Cloudflare, Stripe dashboard, GitHub. Revocar accesos innecesarios.
- [ ] **Rotación de secretos:** Cambiar todas las API keys y tokens que no hayan rotado en >12 meses.
- [ ] **Revisión de CSP:** ¿Se puede endurecer? ¿Hay `unsafe-inline` o `unsafe-eval` que se puedan eliminar?
- [ ] **Incidentes:** Revisar si hubo incidentes de seguridad en el año. Documentar y extraer lecciones.
- [ ] **Compliance de seguridad:** ¿Hay nuevas regulaciones que afecten? (NIS2, DORA, etc.)

### 3.4 Evolución a 20 años

| Fase        | Año   | Nivel de seguridad                                           |
| ----------- | ----- | ------------------------------------------------------------ |
| Fundación   | 0–2   | Automatizado (CI) + auto-auditoría trimestral + OWASP ZAP    |
| Crecimiento | 2–5   | Pentest anual externo + bug bounty limitado + WAF Cloudflare |
| Madurez     | 5–10  | SOC 2 Type I → Type II + equipo de seguridad dedicado        |
| Escala      | 10–20 | ISO 27001 + red team + programa de bug bounty público        |

---

## 4. Dimensión 2 — Código y arquitectura

### 4.1 Checklist por release

- [ ] Build limpio (`npm run build` sin errores ni warnings significativos)
- [ ] TypeScript strict sin errores (`npm run typecheck`)
- [ ] Lint limpio (`npm run lint`)
- [ ] Tests unitarios pasan (`npx vitest run`)
- [ ] Tests E2E pasan (`npx playwright test`) — cuando existan
- [ ] No hay `// TODO` o `// HACK` sin ticket asociado
- [ ] Ningún archivo >500 líneas sin justificación
- [ ] Ningún endpoint >200 líneas sin justificación

### 4.2 Checklist mensual

- [ ] **Deuda técnica:** Listar archivos que superan límites de tamaño. Plan para dividir si >3 archivos superan 500 líneas.
- [ ] **Cobertura de tests:** Medir cobertura (`npx vitest run --coverage`). Tendencia ascendente. Objetivo: >60% en año 1, >80% en año 3.
- [ ] **Convenciones:** Verificar que se siguen (CONTRIBUTING.md). Composables con `use` + PascalCase, i18n con `$t()`, server auth al inicio.
- [ ] **Duplicación:** Buscar código duplicado entre admin y dashboard. Si >3 bloques duplicados, crear issue para unificar.
- [ ] **Bundle size:** Medir chunks (`npx nuxi analyze`). Ningún chunk >500KB. Chunk principal (home/catálogo) <250KB.
- [ ] **Dependencias:** `npm outdated` — plan de actualización para dependencias >2 minor versions atrás.

### 4.3 Checklist trimestral

- [ ] **Arquitectura:** ¿La separación front/back sigue siendo clara? ¿Hay lógica de negocio en el frontend que debería estar en server?
- [ ] **Multi-vertical:** ¿Añadir una categoría o idioma es "solo datos"? Si requiere cambios de código, documentar y planificar fix.
- [ ] **Diagrama actualizado:** Mermaid o ASCII en docs con flujo: usuario → CF → Nuxt → Supabase/Stripe. Webhooks y crons incluidos.
- [ ] **Capa de servicios:** ¿Los endpoints llaman a lógica directa o a servicios? Si >50% es lógica directa, planificar extracción.

### 4.4 Métricas de salud del código

| Métrica                                 | Objetivo año 1 | Objetivo año 3 | Objetivo año 5+ |
| --------------------------------------- | -------------- | -------------- | --------------- |
| Cobertura tests                         | >40%           | >70%           | >85%            |
| Archivos >500 líneas                    | <10            | <5             | 0               |
| Chunks >500KB                           | <3             | 0              | 0               |
| Dependencias desactualizadas (>2 major) | <5             | <2             | 0               |
| Tiempo de build                         | <3 min         | <2 min         | <1 min          |
| TypeScript errors                       | 0              | 0              | 0               |

### 4.5 Evolución a 20 años

| Fase        | Año   | Prácticas                                                     |
| ----------- | ----- | ------------------------------------------------------------- |
| Fundación   | 0–2   | Lint + typecheck + tests manuales + CI básico                 |
| Crecimiento | 2–5   | E2E completo + coverage gates en CI + code review obligatorio |
| Madurez     | 5–10  | SonarQube/CodeClimate + architectural decision records (ADR)  |
| Escala      | 10–20 | Feature flags + canary deployments + chaos engineering        |

---

## 5. Dimensión 3 — Base de datos e integridad de datos

### 5.1 Checklist trimestral

- [ ] **Migraciones:** Todas las migraciones en `supabase/migrations/` están versionadas y son idempotentes. No hay ALTER TABLE manual no documentado.
- [ ] **RLS completo:** Listar TODAS las tablas. Cada tabla con datos de usuario tiene RLS habilitado y políticas correctas.
- [ ] **Índices:** Queries lentas identificadas (`pg_stat_statements` o Supabase dashboard). Índices creados para filtros y ordenación frecuentes.
- [ ] **Integridad referencial:** Foreign keys correctas. No hay registros huérfanos (vehicles sin dealer, bids sin auction).
- [ ] **Backups:** Verificar que Supabase Point-in-Time Recovery está activo. Hacer restore de prueba al menos 1x/año.
- [ ] **Tamaño:** Monitorizar crecimiento de BD. Proyectar cuándo se alcanza el límite del plan Supabase.
- [ ] **Datos sensibles:** PII identificado y documentado. Plan de retención y borrado (derecho al olvido GDPR).

### 5.2 Checklist semestral

- [ ] **Consistencia de datos:** Queries de verificación:
  - Vehículos con `dealer_id` que no existe en `dealers`
  - Subastas cerradas con pujas sin resolución
  - Usuarios con roles inconsistentes
  - Facturas sin vehículo o dealer asociado
- [ ] **Enums y configuración:** `vertical_config`, `categories`, `subcategories` — ¿reflejan el estado real del negocio?
- [ ] **content_translations:** ¿Hay contenido sin traducir en idiomas activos? Porcentaje de completitud por idioma.
- [ ] **Datos de test:** No hay datos de test en producción (emails @example.com, nombres "Test User", precios 0.01).

### 5.3 Checklist anual

- [ ] **Auditoría de esquema completa:** Exportar esquema actual (`pg_dump --schema-only`). Comparar con esquema esperado según documentación.
- [ ] **Plan de migración de BD:** Si el proyecto crece más allá de Supabase free/pro, ¿cuál es el plan? Documentar: Supabase Team → Supabase Enterprise → PostgreSQL gestionado.
- [ ] **Archivado:** ¿Hay datos que deberían archivarse? (vehículos vendidos >2 años, logs antiguos, eventos de auditoría).
- [ ] **Performance:** Queries que tardan >1s en producción. Plan para optimizar (índices, materialización, cache).

### 5.4 Evolución a 20 años

| Fase        | Año   | Gestión de BD                                                                      |
| ----------- | ----- | ---------------------------------------------------------------------------------- |
| Fundación   | 0–2   | Supabase free/pro, migraciones manuales, backups automáticos Supabase              |
| Crecimiento | 2–5   | Supabase Team, read replicas, monitorización con pg_stat                           |
| Madurez     | 5–10  | Multi-cluster (doc ARQUITECTURA-ESCALABILIDAD), sharding por vertical si necesario |
| Escala      | 10–20 | DBA dedicado, PostgreSQL Enterprise o equivalente, replicación cross-region        |

---

## 6. Dimensión 4 — Infraestructura y operaciones

### 6.1 Checklist mensual

- [ ] **Uptime:** >99.5% en el mes. Si hay incidentes, documentar causa y resolución.
- [ ] **SSL:** Certificados válidos, renovación automática verificada.
- [ ] **DNS:** Registros correctos, TTL razonables, DNSSEC si disponible.
- [ ] **CDN:** Cloudflare activo, cache hit ratio >70% para assets estáticos.
- [ ] **Costes:** Desglose por servicio. ¿Algún servicio creció >20% sin explicación?
  - Supabase: plan, almacenamiento, bandwidth
  - Cloudflare: Pages (gratis), Workers, Images
  - Cloudinary: transformaciones, almacenamiento
  - Stripe: % de transacciones
  - Resend: emails enviados
  - Dominio(s): renovación
- [ ] **Monitorización:** Sentry funcional, errores revisados. Alertas configuradas para errores críticos.
- [ ] **Deploy:** Pipeline CI/CD funciona. Último deploy exitoso. Rollback probado.

### 6.2 Checklist trimestral

- [ ] **Escalabilidad:** ¿El plan actual de cada servicio es suficiente para los próximos 3 meses?
- [ ] **Redundancia:** ¿Hay single points of failure? Documentar y planificar mitigación.
- [ ] **Rendimiento:** Tiempo de respuesta promedio de APIs críticas <500ms. Si >1s, investigar.
- [ ] **Cache:** SWR configurado en rutas pesadas (sitemap, market-report, merchant-feed). Verificar que funciona.

### 6.3 Coste de infraestructura — seguimiento

| Servicio   | Coste mes 1  | Coste mes 6  | Coste año 1  | Coste año 3   | Límite de alerta                  |
| ---------- | ------------ | ------------ | ------------ | ------------- | --------------------------------- |
| Supabase   | 0€ (free)    | 25€/mes      | 25€/mes      | 75€/mes       | >100€/mes                         |
| Cloudflare | 0€           | 0€           | 5€/mes       | 20€/mes       | >50€/mes                          |
| Cloudinary | 0€           | 0€           | 0€           | 45€/mes       | >75€/mes                          |
| Resend     | 0€           | 0€           | 20€/mes      | 20€/mes       | >50€/mes                          |
| Stripe     | Variable     | Variable     | Variable     | Variable      | Comisiones >5% de ingresos brutos |
| Dominios   | 15€/año      | —            | 15€/año      | 100€/año      | —                                 |
| **TOTAL**  | **~15€/año** | **~25€/mes** | **~75€/mes** | **~260€/mes** | **>500€/mes**                     |

### 6.4 Evolución a 20 años

| Fase        | Año   | Infraestructura                                                                             |
| ----------- | ----- | ------------------------------------------------------------------------------------------- |
| Fundación   | 0–2   | Cloudflare Pages + Supabase free/pro. Todo serverless. Coste ~900-1.500€/año                |
| Crecimiento | 2–5   | Supabase Team + CF Workers Pro + monitorización (Sentry Business). Coste ~5.000-15.000€/año |
| Madurez     | 5–10  | Multi-region, CDN dedicado, WAF avanzado, SLA contractuales. Coste ~30.000-80.000€/año      |
| Escala      | 10–20 | Equipo DevOps, Kubernetes o equivalente, multi-cloud, DR automatizado. Coste variable       |

---

## 7. Dimensión 5 — Rendimiento y experiencia de usuario

### 7.1 Checklist trimestral

- [ ] **Core Web Vitals** (5 rutas críticas: home, catálogo, ficha vehículo, login, dashboard):
  - LCP < 2.5s
  - INP < 200ms
  - CLS < 0.1
- [ ] **Lighthouse scores** (mismas 5 rutas):
  - Performance > 80
  - Accessibility > 90
  - Best Practices > 90
  - SEO > 90
- [ ] **Mobile:** Verificar en dispositivo real 360px. Sin overflow horizontal, botones ≥44px, modales usables.
- [ ] **i18n:** Verificar en al menos 3 idiomas que no hay textos sin traducir en rutas críticas.
- [ ] **Formularios críticos:** Login, registro, publicación vehículo, checkout — validación correcta, mensajes claros, sin pérdida de datos al fallar.
- [ ] **PWA:** Installable, cache funciona, mensaje offline amigable.

### 7.2 User journeys a verificar

| #   | Journey                          | Pasos                                                | Criterio de éxito                              |
| --- | -------------------------------- | ---------------------------------------------------- | ---------------------------------------------- |
| 1   | Visitante anónimo busca vehículo | Home → filtros → ficha → contacto                    | Fluido, <3s por paso, formulario funciona      |
| 2   | Dealer publica vehículo          | Login → dashboard → nuevo → fotos → datos → publicar | Sin errores, imágenes cargan, preview correcto |
| 3   | Dealer gestiona suscripción      | Dashboard → suscripción → cambiar plan → pago        | Stripe funciona, plan se actualiza, factura    |
| 4   | Usuario registra favorito        | Ver ficha → corazón → perfil → favoritos             | Persistente, sincronizado, notificaciones      |
| 5   | Admin aprueba vehículo           | Admin → pendientes → revisar → aprobar/rechazar      | Fluido, notificación al dealer                 |
| 6   | Visitante lee artículo           | Blog → artículo → compartir → vehículos relacionados | SEO correcto, links funcionan, CTA visibles    |
| 7   | Dealer desde WhatsApp            | Envía foto → Claude Vision → listing creado          | Proceso completo en <2 min                     |
| 8   | Comprador en subasta             | Registrarse → depositar → pujar → ganar/perder       | Tiempo real, pagos correctos, notificaciones   |

### 7.3 Evolución a 20 años

| Fase        | Año   | UX                                                               |
| ----------- | ----- | ---------------------------------------------------------------- |
| Fundación   | 0–2   | Lighthouse manual trimestral + journeys manuales                 |
| Crecimiento | 2–5   | Monitoring con Real User Metrics (RUM) + A/B testing             |
| Madurez     | 5–10  | UX researcher + usability labs + analytics avanzado              |
| Escala      | 10–20 | Design system maduro + accesibilidad WCAG AAA + multi-plataforma |

---

## 8. Dimensión 6 — Negocio y monetización

### 8.1 Checklist mensual

- [ ] **Ingresos por canal:**
  - Transporte góndola: # cotizaciones, # contratados, ingreso
  - Trámites: # gestionados, ingreso
  - Informes DGT: # vendidos, ingreso
  - Suscripciones dealer: # activas por plan, MRR
  - Destacados: # activos, ingreso
  - Publicidad geo: # anunciantes, impresiones, ingreso
  - Subastas: # celebradas, comisión total
  - Otros: inspecciones, valoraciones, etc.
- [ ] **Unit economics:**
  - CAC (coste adquisición cliente) por canal
  - LTV (lifetime value) por tipo de dealer
  - Margen por transacción tipo
- [ ] **Pipeline comercial:**
  - Leads captados
  - Founding Dealers activos / objetivo
  - Tasa de conversión lead → dealer
  - Churn de dealers (cancelaciones)
- [ ] **Stock y actividad:**
  - Vehículos activos en catálogo
  - Publicaciones nuevas / mes
  - Vehículos vendidos / mes
  - Tiempo medio de venta

### 8.2 Checklist trimestral

- [ ] **Pricing:** ¿Los precios de cada servicio siguen siendo competitivos y rentables? Comparar con Mascus y alternativas.
- [ ] **Canales no activados:** De las 16 fuentes de ingreso, ¿cuántas están activas? Plan para activar la siguiente.
- [ ] **Proyecciones vs realidad:** Comparar ingresos reales con proyecciones del plan de negocio. Si desvío >30%, analizar causas.
- [ ] **Churn analysis:** ¿Por qué se van los dealers? Encuesta de salida o análisis de comportamiento pre-churn.
- [ ] **Tank Ibérica:** Facturación y margen de Tank. ¿El marketplace está canibalizando o complementando?

### 8.3 Checklist anual

- [ ] **Business Bible actualizada:** ¿El modelo de negocio ha cambiado? Actualizar documentación.
- [ ] **Competencia:** Análisis completo de Mascus, MachineryZone, TruckScout24, y nuevos entrantes.
- [ ] **Expansión:** ¿Es momento de abrir nueva vertical? Criterios: Tracciona estabilizada, demanda validada, coste <500€.
- [ ] **Valoración del negocio:** Estimación interna (MRR × múltiplo) para toma de decisiones (inversores, socios, salida).

### 8.4 KPIs maestros por fase

| KPI                | Fase 1 (0-6m) | Fase 2 (6-12m) | Fase 3 (12-24m) | Fase 4 (24m+) |
| ------------------ | ------------- | -------------- | --------------- | ------------- |
| Vehículos activos  | 15-100        | 100-500        | 500-2.000       | 2.000+        |
| Dealers activos    | 1-15          | 15-50          | 50-200          | 200+          |
| MRR                | 0-500€        | 500-5.000€     | 5.000-20.000€   | 20.000€+      |
| Transacciones/mes  | 1-5           | 5-20           | 20-100          | 100+          |
| Verticales activas | 1             | 1-2            | 2-4             | 4-7           |
| Visitas únicas/mes | 500-5.000     | 5.000-30.000   | 30.000-150.000  | 150.000+      |

### 8.5 Evolución a 20 años

| Fase        | Año   | Negocio                                                              |
| ----------- | ----- | -------------------------------------------------------------------- |
| Fundación   | 0–2   | Métricas manuales en spreadsheet + Stripe dashboard                  |
| Crecimiento | 2–5   | Dashboard interno de KPIs + primer comercial + CRM activo            |
| Madurez     | 5–10  | CFO/controller + reporting automatizado + auditoría financiera anual |
| Escala      | 10–20 | Board of advisors + auditoría externa Big4 + M&A capability          |

---

## 9. Dimensión 7 — Legal, compliance y regulatorio

### 9.1 Checklist semestral

- [ ] **GDPR/LOPD:**
  - Política de privacidad actualizada
  - Consentimiento de cookies funcional (CookieBanner)
  - Derecho de acceso, rectificación y supresión implementado
  - Registro de actividades de tratamiento (RAT) actualizado
  - DPO designado (o justificación de por qué no es necesario aún)
- [ ] **Términos y condiciones:**
  - ToS actualizados para reflejar servicios actuales
  - ToS específicos por servicio (subastas, transporte, intermediación)
  - Aceptación explícita en registro y en cada servicio nuevo
- [ ] **Facturación:**
  - Facturas emitidas correctamente (datos fiscales, IVA, numeración)
  - Quaderno/software de facturación integrado
  - Cumplimiento SII (España) y MTD (UK) según aplique
- [ ] **Contratos:**
  - Contrato tipo con Founding Dealers
  - Contrato tipo con transportistas/subcontratistas
  - Términos de afiliación/publicidad para anunciantes
- [ ] **Fiscalidad dual UK/ES:**
  - Asesor fiscal informado de operaciones cross-border
  - IVA correcto en servicios B2B intra-UE / UK
  - Transfer pricing documentado (Tank Ibérica ↔ TradeBase ↔ operaciones UK)

### 9.2 Checklist anual

- [ ] **Regulación sectorial:**
  - DGT: ¿Nuevas normativas sobre transferencias, ITV, documentación?
  - Transporte: ¿Cambios en regulación de transporte de mercancías?
  - Marketplace: ¿Nuevas obligaciones para plataformas (Digital Markets Act, DSA)?
- [ ] **Seguros:**
  - Responsabilidad civil profesional
  - Ciber-seguro (cuando sea económicamente viable)
  - Seguro de errores y omisiones si se ofrece intermediación
- [ ] **Propiedad intelectual:** Ver dimensión 12.
- [ ] **Subvenciones:**
  - ¿Se recibió alguna? Verificar cumplimiento de condiciones
  - ¿Hay nuevas convocatorias? CyL, ADER (La Rioja), ICO, ENISA, Horizonte Europa

### 9.3 Evolución a 20 años

| Fase        | Año   | Legal                                                                  |
| ----------- | ----- | ---------------------------------------------------------------------- |
| Fundación   | 0–2   | Asesor fiscal básico + templates legales + LOPD autogestión            |
| Crecimiento | 2–5   | Abogado mercantil recurrente + DPO externo + auditoría GDPR            |
| Madurez     | 5–10  | Departamento legal interno o counsel externo fijo + compliance officer |
| Escala      | 10–20 | Legal internacional + regulatory affairs + lobbying sectorial          |

---

## 10. Dimensión 8 — Documentación y conocimiento

### 10.1 Checklist trimestral

- [ ] **Single source of truth:** `README-PROYECTO.md` actualizado y refleja el estado real.
- [ ] **INSTRUCCIONES-MAESTRAS.md:** ¿Las sesiones pendientes siguen siendo relevantes? ¿Hay que añadir nuevas?
- [ ] **CLAUDE.md:** Instrucciones para Claude Code siguen siendo correctas.
- [ ] **ESTADO-REAL-PRODUCTO.md:** Generado con script y refleja código actual.
- [ ] **Documentos históricos:** Marcados con banner, no confundibles con docs vivos.
- [ ] **Onboarding:** Un nuevo desarrollador (humano o IA) puede empezar a contribuir en <1 día solo con la documentación.
- [ ] **CHANGELOG.md:** Actualizado con cada release significativa.
- [ ] **Anexos (A-X):** ¿Alguno obsoleto? Marcar o actualizar.

### 10.2 Checklist anual

- [ ] **Auditoría documental completa:** Revisar TODOS los docs del proyecto. Clasificar vivos/históricos/obsoletos. (Sesión 38F)
- [ ] **Knowledge base:** ¿Hay conocimiento solo en la cabeza de los fundadores? Documentar.
- [ ] **Transcripts:** ¿Los transcripts de sesiones con Claude son útiles o son ruido? Archivar o resumir.
- [ ] **Métricas de documentación:**
  - # de docs total
  - # de docs actualizados en últimos 3 meses
  - # de docs marcados como obsoletos
  - Ratio docs vivos / docs totales (objetivo: >70%)

### 10.3 Evolución a 20 años

| Fase        | Año   | Documentación                                                     |
| ----------- | ----- | ----------------------------------------------------------------- |
| Fundación   | 0–2   | Markdown en repo + INSTRUCCIONES-MAESTRAS + README                |
| Crecimiento | 2–5   | Wiki o Notion + docs generados automáticamente + ADR              |
| Madurez     | 5–10  | Documentación como producto (developer portal si hay API pública) |
| Escala      | 10–20 | Knowledge management system + onboarding estructurado + formación |

---

## 11. Dimensión 9 — Equipo, procesos y gobernanza

### 11.1 Checklist semestral

- [ ] **Bus factor:** ¿Quién sabe qué? Si una persona desaparece, ¿se puede continuar?
  - Hoy: 2 hermanos, 1 dev (con Claude Code). Bus factor = 1 para desarrollo.
  - Mitigación: documentación exhaustiva (5.700+ líneas), stack estándar, sin código "mágico".
- [ ] **Capacidad:** ¿El equipo actual puede mantener el ritmo? ¿Hay burnout? ¿Hay tareas que se posponen indefinidamente?
- [ ] **Procesos:**
  - Deploy: ¿Es reproducible y documentado?
  - Incidentes: ¿Hay proceso para responder a caídas o bugs críticos?
  - Releases: ¿Hay cadencia? ¿Hay QA antes de deploy?
- [ ] **Comunicación:** ¿Los dos fundadores están alineados en prioridades? ¿Hay reunión periódica de revisión?
- [ ] **Contratación:** ¿Es momento de contratar? ¿Qué perfil primero? (Plan: mes 8-10 comercial a comisión)

### 11.2 Checklist anual

- [ ] **Revisión de roles:** ¿Los roles de los fundadores siguen siendo los correctos? ¿Hay que especializar?
- [ ] **Formación:** ¿Hay gaps de conocimiento que afectan al proyecto? Plan de formación.
- [ ] **Cultura y valores:** ¿Cómo se trabaja? ¿Hay principios explícitos? (Importa más cuando llegan empleados)
- [ ] **Succession planning:** Si uno de los fundadores no puede continuar, ¿hay plan?

### 11.3 Evolución a 20 años

| Fase        | Año   | Equipo                                                                 |
| ----------- | ----- | ---------------------------------------------------------------------- |
| Fundación   | 0–2   | 2 fundadores + Claude Code + subcontratistas puntuales                 |
| Crecimiento | 2–5   | +1 comercial, +1 dev part-time, +1 soporte/operaciones                 |
| Madurez     | 5–10  | 8-15 personas, estructura departamental (tech, comercial, operaciones) |
| Escala      | 10–20 | 30-100+ personas, management layers, HR, cultura formalizada           |

---

## 12. Dimensión 10 — Estrategia, mercado y competencia

### 12.1 Checklist semestral

- [ ] **Competencia directa:**
  - Mascus (Ritchie Bros): ¿nuevas features? ¿cambios de pricing? ¿expansión?
  - MachineryZone: ¿movimientos en mercado español?
  - TruckScout24: ¿expansión fuera de DACH?
  - Nuevos entrantes: ¿Alguien más haciendo marketplace B2B con servicios integrados?
- [ ] **Posicionamiento:** ¿Nuestra propuesta de valor sigue siendo diferencial? "Acompañar la transacción completa" vs "tablón de anuncios".
- [ ] **Mercado:** ¿El mercado de vehículos industriales crece/decrece? ¿Hay tendencias (electrificación, regulación, consolidación)?
- [ ] **Verticales:** ¿El orden de lanzamiento sigue siendo correcto? (Tracciona → Municipiante → CampoIndustrial → ...)
- [ ] **Partners:** ¿Hay oportunidades de alianza? (Financieras, aseguradoras, transportistas, fabricantes)

### 12.2 Checklist anual

- [ ] **Business Bible completa:** Revisión y actualización. ¿Las proyecciones siguen siendo realistas?
- [ ] **DAFO actualizado:** Debilidades, amenazas, fortalezas, oportunidades revisadas con datos reales.
- [ ] **TAM/SAM/SOM:** ¿El mercado total, accesible y realista ha cambiado?
- [ ] **Estrategia de salida:** ¿Hay una? No es obligatorio, pero sí necesario pensar: ¿esto es para siempre, para vender, para escalar y fusionar?

### 12.3 Evolución a 20 años

| Fase        | Año   | Estrategia                                                        |
| ----------- | ----- | ----------------------------------------------------------------- |
| Fundación   | 0–2   | Focus total en Tracciona + validación de mercado                  |
| Crecimiento | 2–5   | 2-3 verticales + primeras partnerships + métricas de mercado      |
| Madurez     | 5–10  | 5-7 verticales + TradeBase como marca grupo + datos como producto |
| Escala      | 10–20 | "Idealista de B2B industriales" + expansión geográfica + M&A      |

---

## 13. Dimensión 11 — Resiliencia y continuidad de negocio

### 13.1 Checklist semestral

- [ ] **Backups:**
  - BD: Point-in-Time Recovery activo en Supabase. Probado con restore real al menos 1x/año.
  - Código: GitHub repo con todas las ramas. Mirror en segundo servicio si > año 3.
  - Imágenes: Cloudinary/CF Images. ¿Hay backup de originales?
  - Documentación: Repo + OneDrive. ¿Hay copia offline?
  - Configuración: `.env.example` actualizado. Secretos documentados (sin valores) en lugar seguro.
- [ ] **Plan B técnico:**
  - Si Supabase cae: ¿plan de migración a PostgreSQL gestionado?
  - Si Cloudflare cae: ¿plan de migración a Vercel/Netlify?
  - Si Stripe cae: ¿plan de migración a otro procesador?
  - Si GitHub cae: ¿hay mirror del repo?
- [ ] **Dependencias de terceros:**
  - Listar TODOS los servicios de terceros de los que depende el proyecto.
  - Para cada uno: ¿hay alternativa identificada? ¿cuánto tiempo llevaría migrar?
- [ ] **Disaster recovery:**
  - RTO (Recovery Time Objective): ¿en cuántas horas debe estar todo funcionando tras un desastre total?
  - RPO (Recovery Point Objective): ¿cuántos datos podemos perder? (máximo aceptable)
  - Hoy razonable: RTO 24h, RPO 1h (Supabase PITR)

### 13.2 Evolución a 20 años

| Fase        | Año   | Resiliencia                                               |
| ----------- | ----- | --------------------------------------------------------- |
| Fundación   | 0–2   | Backups automáticos + Plan B documentado + repo en GitHub |
| Crecimiento | 2–5   | DR probado 1x/año + multi-región para servicios críticos  |
| Madurez     | 5–10  | BCP formal + DR automatizado + seguro de interrupción     |
| Escala      | 10–20 | Zero-downtime deployments + multi-cloud + DR <4h          |

---

## 14. Dimensión 12 — Propiedad intelectual y activos digitales

### 14.1 Checklist anual

- [ ] **Dominios:**
  - `tracciona.com` — registrado, renovación automática, WHOIS protegido
  - Dominios de verticales futuras: ¿registrados preventivamente? (municipiante.com, campoindustrial.com, etc.)
  - Dominios defensivos: ¿tracciona.es, .eu, .co.uk?
- [ ] **Marcas:**
  - ¿Tracciona está registrada como marca? ¿En qué clases? ¿En qué territorios?
  - ¿TradeBase está registrada?
  - Coste: OEPM ~150€/marca (España), EUIPO ~850€ (UE), UKIPO ~170£ (UK)
- [ ] **Código:**
  - ¿Todo el código es propio o hay licencias de terceros? Listar dependencias con licencia copyleft.
  - ¿El código generado con Claude Code tiene implicaciones de IP? (Actualmente no, según ToS Anthropic)
- [ ] **Datos:**
  - ¿Los datos del catálogo son nuestros o de los dealers? Definir en ToS.
  - ¿Los datos agregados (Market Index, estadísticas) son un activo? Proteger.
  - ¿Los artículos editoriales tienen copyright? Registrar si son valiosos.
- [ ] **Diseño:**
  - ¿El design system (tokens.css, componentes) está documentado como activo?
  - ¿El logo y branding están registrados?

### 14.2 Evolución a 20 años

| Fase        | Año   | IP                                                                                    |
| ----------- | ----- | ------------------------------------------------------------------------------------- |
| Fundación   | 0–2   | Dominios registrados + marca Tracciona en OEPM + código en repo privado               |
| Crecimiento | 2–5   | Marca EU (EUIPO) + marca UK (UKIPO) + dominios todas verticales                       |
| Madurez     | 5–10  | Portfolio de marcas + patentes si hay innovación técnica + datos como activo valorado |
| Escala      | 10–20 | IP portfolio completo + valoración de intangibles + defensa activa de marca           |

---

## 15. Calendario maestro de auditoría

### Año tipo (una vez estabilizado)

| Mes            | Auditorías                                                                                   |
| -------------- | -------------------------------------------------------------------------------------------- |
| **Enero**      | Negocio (mensual) + Infra (mensual) + **Anual completa** (todas las dimensiones)             |
| **Febrero**    | Negocio + Infra + Código (mensual)                                                           |
| **Marzo**      | Negocio + Infra + **Trimestral** (Seguridad + BD + UX + Docs)                                |
| **Abril**      | Negocio + Infra + Código                                                                     |
| **Mayo**       | Negocio + Infra + Código                                                                     |
| **Junio**      | Negocio + Infra + **Trimestral** + **Semestral** (Legal + Equipo + Estrategia + Resiliencia) |
| **Julio**      | Negocio + Infra + Código                                                                     |
| **Agosto**     | Negocio + Infra + Código (reducido — vacaciones)                                             |
| **Septiembre** | Negocio + Infra + **Trimestral**                                                             |
| **Octubre**    | Negocio + Infra + Código                                                                     |
| **Noviembre**  | Negocio + Infra + Código                                                                     |
| **Diciembre**  | Negocio + Infra + **Trimestral** + **Semestral** + Preparación auditoría anual enero         |

### Tiempo estimado por auditoría

| Tipo                                                  | Tiempo estimado (2 personas) | Con equipo (5+) |
| ----------------------------------------------------- | ---------------------------- | --------------- |
| Mensual (negocio + infra + código)                    | 2-3 horas                    | 1 hora          |
| Trimestral (seguridad + BD + UX + docs)               | 4-6 horas                    | 2-3 horas       |
| Semestral (legal + equipo + estrategia + resiliencia) | 6-8 horas                    | 3-4 horas       |
| Anual completa (12 dimensiones)                       | 2 días                       | 1 día           |

---

## 16. Fases evolutivas del plan (2026–2046)

### Fase 1 — Fundación (2026–2028)

**Contexto:** 2 fundadores, 0 empleados, 1 vertical (Tracciona), presupuesto limitado.

**Prioridades de auditoría:**

1. Seguridad (automatizada en CI + trimestral manual)
2. Negocio (mensual — ¿funciona el modelo?)
3. Código (por release + mensual)
4. Infra (mensual — controlar costes)

**Lo que NO hace falta aún:**

- Auditoría externa de seguridad (pero sí auto-pentest con OWASP ZAP)
- Compliance SOC 2
- Equipo de auditoría dedicado

**Coste de auditoría:** 0€ (autogestión) + herramientas gratuitas (Semgrep CE, Snyk free, OWASP ZAP, Lighthouse)

---

### Fase 2 — Crecimiento (2028–2031)

**Contexto:** 3-5 personas, 2-3 verticales, ingresos recurrentes, primeros dealers de pago.

**Nuevas prioridades:**

- Primera auditoría de seguridad externa (presupuesto: 2.000-5.000€)
- Auditoría financiera básica (preparar para posible inversión)
- Compliance GDPR formal (DPO externo)
- Proceso de code review obligatorio

**Coste de auditoría:** 3.000-8.000€/año

---

### Fase 3 — Madurez (2031–2036)

**Contexto:** 8-15 personas, 5-7 verticales, facturación >500K€/año del marketplace.

**Nuevas prioridades:**

- SOC 2 Type I (si hay clientes enterprise o inversores que lo exigen)
- Auditoría financiera anual por firma externa
- Compliance officer (puede ser externo)
- Pentests semestrales
- Business continuity plan formal

**Coste de auditoría:** 15.000-40.000€/año

---

### Fase 4 — Escala (2036–2046)

**Contexto:** 30-100+ personas, 7+ verticales, facturación >5M€/año, posible expansión internacional.

**Nuevas prioridades:**

- ISO 27001 certificación
- Auditoría Big4 anual
- Red team / blue team
- Regulatory affairs
- Board de advisors con componente auditoría
- M&A due diligence capability (para comprar o ser comprado)

**Coste de auditoría:** 50.000-200.000€/año (proporcional a ingresos)

---

## 17. Herramientas y coste por fase

### Fase 1 (gratuitas)

| Herramienta        | Para qué                         | Coste                  |
| ------------------ | -------------------------------- | ---------------------- |
| Semgrep CE         | Análisis estático de código      | 0€                     |
| Snyk free          | Vulnerabilidades en dependencias | 0€                     |
| npm audit          | Dependencias Node                | 0€                     |
| OWASP ZAP          | Auto-pentest web                 | 0€                     |
| Lighthouse         | Performance, a11y, SEO           | 0€                     |
| axe-core           | Accesibilidad                    | 0€                     |
| pg_stat_statements | Performance BD                   | 0€ (incluido Supabase) |
| Sentry free        | Monitorización errores           | 0€                     |
| GitHub Actions     | CI/CD                            | 0€ (2.000 min/mes)     |

### Fase 2 (bajo coste)

| Herramienta            | Para qué                | Coste            |
| ---------------------- | ----------------------- | ---------------- |
| Todo de Fase 1         | —                       | 0€               |
| Pentest externo 1x/año | Seguridad               | 2.000-5.000€/año |
| Sentry Business        | Monitorización avanzada | 26€/mes          |
| Snyk Team              | Más features seguridad  | 25€/mes          |
| Gestoría fiscal/legal  | Compliance              | 200-500€/mes     |

### Fase 3+ (inversión)

| Herramienta             | Para qué                | Coste                  |
| ----------------------- | ----------------------- | ---------------------- |
| SonarQube / CodeClimate | Calidad de código       | 150-500€/mes           |
| Datadog / New Relic     | Observabilidad completa | 200-1.000€/mes         |
| SOC 2 certificación     | Compliance              | 10.000-30.000€ inicial |
| Auditoría financiera    | Contabilidad            | 5.000-15.000€/año      |
| Bug bounty platform     | Seguridad               | Variable               |

---

## 18. Plantilla de informe de auditoría

Cada auditoría genera un informe con esta estructura. Se archiva en `docs/auditorias/YYYY-MM-DD-tipo.md`.

```markdown
# Informe de auditoría — [TIPO] — [FECHA]

## Metadatos

- **Tipo:** [Mensual / Trimestral / Semestral / Anual]
- **Dimensiones auditadas:** [lista]
- **Auditor:** [nombre]
- **Duración:** [horas]

## Resumen ejecutivo

[2-3 frases: estado general, hallazgos críticos, tendencia]

## Puntuación por dimensión

| Dimensión | Puntuación anterior | Puntuación actual | Tendencia |
| --------- | ------------------- | ----------------- | --------- |
| Seguridad | 82                  | 85                | ↑         |
| ...       | ...                 | ...               | ...       |

## Hallazgos críticos (acción inmediata)

| #   | Hallazgo | Dimensión | Severidad | Acción requerida | Responsable | Fecha límite |
| --- | -------- | --------- | --------- | ---------------- | ----------- | ------------ |

## Hallazgos importantes (acción planificada)

| #   | Hallazgo | Dimensión | Acción requerida | Sprint/Sesión |
| --- | -------- | --------- | ---------------- | ------------- |

## Hallazgos menores (mejora continua)

| #   | Hallazgo | Dimensión | Nota |
| --- | -------- | --------- | ---- |

## Comparación con auditoría anterior

- Hallazgos críticos previos resueltos: X/Y
- Hallazgos importantes previos resueltos: X/Y
- Nuevos hallazgos: X

## Métricas clave

[Tabla con KPIs relevantes para las dimensiones auditadas]

## Próxima auditoría

- **Tipo:** [siguiente en calendario]
- **Fecha:** [cuando]
- **Foco especial:** [si hay algo que vigilar]
```

---

## 19. Criterios de puntuación unificados

Para mantener consistencia en todas las auditorías, cada dimensión se puntúa 0-100 con estos criterios:

| Rango  | Nivel      | Significado                                                              |
| ------ | ---------- | ------------------------------------------------------------------------ |
| 90-100 | Excelente  | Best-in-class. Supera estándares del sector para el tamaño del proyecto. |
| 80-89  | Alto       | Sólido. Cumple estándares con margen. Mejoras son refinamiento, no gaps. |
| 70-79  | Medio-Alto | Funcional con gaps conocidos. Hay plan para cerrarlos.                   |
| 60-69  | Medio      | Funcional pero con riesgos. Gaps significativos sin plan claro.          |
| 50-59  | Medio-Bajo | Funciona pero preocupa. Necesita atención prioritaria.                   |
| 40-49  | Bajo       | Problemas serios. Riesgo operativo o legal.                              |
| <40    | Crítico    | Requiere acción inmediata. Riesgo de fallo, brecha, o incumplimiento.    |

**Criterio fundamental:** La puntuación se ajusta al contexto del proyecto. Un 80 en seguridad para un proyecto de 2 personas con 0 empleados NO es lo mismo que un 80 para una empresa de 50 personas. La escala es relativa al "lo que debería tener un proyecto de este tamaño y fase".

---

## 20. Gobernanza del plan de auditoría

### Quién audita

| Fase                   | Quién audita                                                  | Supervisión                 |
| ---------------------- | ------------------------------------------------------------- | --------------------------- |
| Fundación (0-2 años)   | Fundadores (autoauditoría) + Claude Code (scripts)            | Asesor externo puntual      |
| Crecimiento (2-5 años) | Fundadores + primer empleado técnico + auditor externo 1x/año | Board de advisors si existe |
| Madurez (5-10 años)    | Equipo interno + auditores externos periódicos                | Compliance officer          |
| Escala (10-20 años)    | Departamento de auditoría interna + Big4 externa              | Board / comité de auditoría |

### Revisión de este plan

Este plan de auditoría se revisa y actualiza:

- **Anualmente:** En la auditoría anual de enero. ¿Las dimensiones siguen siendo las correctas? ¿Las frecuencias son adecuadas? ¿Hay nuevas dimensiones?
- **En cada cambio de fase:** Cuando el proyecto pasa de una fase a otra (hitos: primer empleado, primera vertical nueva, primera ronda de inversión, primer millón de facturación).
- **Ante eventos significativos:** Incidente de seguridad, cambio regulatorio importante, entrada de inversor, fusión/adquisición.

### Archivo

Todos los informes de auditoría se archivan en:

- **Corto plazo (0-2 años):** `docs/auditorias/` en el repo del proyecto
- **Medio plazo (2-5 años):** Repo + almacenamiento externo (Google Drive / OneDrive)
- **Largo plazo (5+ años):** Sistema de gestión documental + archivado legal cuando sea requerido

### Meta-auditoría

Una vez al año, auditar el propio plan de auditoría:

- [ ] ¿Se están haciendo las auditorías según calendario?
- [ ] ¿Los informes se están archivando?
- [ ] ¿Los hallazgos se están resolviendo?
- [ ] ¿El plan sigue siendo proporcional al tamaño del proyecto?
- [ ] ¿Hay dimensiones que faltan o sobran?

---

## Anexo A — Estado actual (febrero 2026) como baseline

Para que las futuras auditorías tengan un punto de referencia:

| Dimensión                           | Puntuación actual | Fuente                       |
| ----------------------------------- | ----------------- | ---------------------------- |
| Seguridad                           | 82/100            | VALORACION-PROYECTO-1-100.md |
| Código/Modulabilidad                | 78/100            | VALORACION-PROYECTO-1-100.md |
| Escalabilidad                       | 80/100            | VALORACION-PROYECTO-1-100.md |
| Monetización                        | 72/100            | VALORACION-PROYECTO-1-100.md |
| Arquitectura                        | 81/100            | VALORACION-PROYECTO-1-100.md |
| Claridad/Documentación              | 70/100            | VALORACION-PROYECTO-1-100.md |
| Experiencia de usuario              | 74/100            | VALORACION-PROYECTO-1-100.md |
| Proyección                          | 79/100            | VALORACION-PROYECTO-1-100.md |
| Legal/Compliance                    | No auditado       | Pendiente primera auditoría  |
| Equipo/Procesos                     | No auditado       | Pendiente primera auditoría  |
| Estrategia/Mercado                  | No auditado       | Pendiente primera auditoría  |
| Resiliencia                         | No auditado       | Pendiente primera auditoría  |
| Propiedad intelectual               | No auditado       | Pendiente primera auditoría  |
| **MEDIA (8 dimensiones auditadas)** | **77/100**        | —                            |

**Primera acción:** Completar la auditoría baseline de las 5 dimensiones no auditadas para tener el punto de partida completo.

---

_Plan de auditoría integral v1.0 — Documento vivo. Se actualiza anualmente o ante cambios significativos._

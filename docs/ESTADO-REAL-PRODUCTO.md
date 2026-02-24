# Estado Real del Producto — Tracciona

> Documento generado automaticamente analizando el codigo fuente. Refleja el estado REAL del producto, no las aspiraciones de la documentacion.
> Ultima actualizacion: Sesion 36 (Feb 2026).

---

## Resumen Ejecutivo

| Metrica            | Valor          |
| ------------------ | -------------- |
| Paginas Vue        | 114            |
| Endpoints API      | 45             |
| Composables        | 61             |
| Componentes        | 76             |
| Migraciones BD     | 58             |
| Tablas BD          | 45+            |
| Cron jobs          | 9              |
| Idiomas            | 3 (ES, EN, FR) |
| Modulos operativos | 18/20 (90%)    |
| Modulos parciales  | 2/20 (10%)     |

---

## Modulos por Estado

### Operativos (18)

| Modulo              | Archivos clave                                                        | Sesion |
| ------------------- | --------------------------------------------------------------------- | ------ |
| Catalogo publico    | pages/index.vue, composables/useVehicles.ts                           | 3      |
| Fichas vehiculo     | pages/vehiculo/[slug].vue                                             | 3      |
| Subastas            | pages/subastas/\*, composables/useAuction.ts                          | 16     |
| Pagos Stripe        | server/api/stripe/\* (checkout, portal, webhook)                      | 17     |
| WhatsApp pipeline   | server/api/whatsapp/\* (webhook, process)                             | 21     |
| Ads/Publicidad      | pages/admin/publicidad.vue, composables/useAds.ts                     | 16b    |
| Infra monitoring    | pages/admin/infraestructura.vue, server/api/infra/\* (10 endpoints)   | 33     |
| Dashboard dealer    | pages/dashboard/\* (index, vehiculos, leads, estadisticas)            | 24     |
| Editorial           | pages/noticias/_, pages/guia/_                                        | 11     |
| Verificacion        | pages/admin/verificaciones.vue, server/api/verify-document.post.ts    | 15     |
| Multi-vertical      | composables/useVerticalConfig.ts, vertical_config table               | 23     |
| CI/CD               | .github/workflows/ci.yml, backup.yml                                  | 19     |
| CRM leads           | pages/dashboard/leads/\*, composables/useDealerLeads.ts               | 28     |
| Herramientas dealer | pages/dashboard/herramientas/\* (11 herramientas)                     | 31     |
| Auth flow           | pages/auth/\* (login, registro, recuperar, confirmar, nueva-password) | 2      |
| Perfil comprador    | pages/perfil/\* (datos, favoritos, alertas, contactos, seguridad)     | 24     |
| Config admin        | pages/admin/config/\* (14 paginas de configuracion)                   | 6      |
| Gestion productos   | pages/admin/productos/\* + 20 componentes de edicion                  | 3      |

### Parciales (2)

| Modulo            | Estado                                              | Falta                                                               |
| ----------------- | --------------------------------------------------- | ------------------------------------------------------------------- |
| Landing pages     | Framework presente, catch-all funcional             | Builder avanzado de secciones, biblioteca de templates, A/B testing |
| Social publishing | Infraestructura lista, endpoint genera posts con IA | OAuth flow real a Instagram/Facebook/LinkedIn/TikTok                |

### No existe (0)

Todos los modulos planificados tienen al menos infraestructura creada.

---

## Endpoints API (45 total)

### Por dominio

| Dominio           | Endpoints | Auth                      |
| ----------------- | --------- | ------------------------- |
| /api/stripe/\*    | 3         | User + Stripe signature   |
| /api/whatsapp/\*  | 3         | Public/WhatsApp signature |
| /api/infra/\*     | 10        | Admin                     |
| /api/cron/\*      | 9         | CRON_SECRET               |
| /api/email/\*     | 2         | Internal/Public           |
| /api/account/\*   | 2         | User                      |
| /api/invoicing/\* | 2         | User                      |
| /api/push/\*      | 1         | Internal/Admin            |
| /api/social/\*    | 1         | User                      |
| /api/images/\*    | 1         | User                      |
| /api/v1/\*        | 1         | Public                    |
| Raiz /api/        | 10        | Mixto                     |

### Por tipo de auth

| Auth                            | Endpoints |
| ------------------------------- | --------- |
| Admin                           | 12        |
| User (autenticado)              | 11        |
| CRON_SECRET                     | 9         |
| Public                          | 7         |
| Internal secret                 | 3         |
| Firma externa (Stripe/WhatsApp) | 3         |

---

## Base de Datos

### Migraciones: 58 archivos SQL

- 00001-00030: Fundacion (usuarios, catalogo, categorias, filtros, subastas, noticias, ads, pagos, suscripciones)
- 00031: Migracion Tracciona consolidada (vertical_config, dealers, buyers, SEO)
- 00032-00044: Features (landings, editorial, leads, pagos, email, WhatsApp)
- 00045-00053: Expansiones (verticales, reports, push, CRM, dealer tools, data, infra)
- 00054-00058: Hardening (retry columns, RLS, indexes, standardization)

### Seguridad RLS

- Todas las tablas con RLS habilitado (migraciones 00055, 00057)
- Funcion is_admin() centralizada
- Politicas estandarizadas: admin-only, owner-or-admin, authenticated

---

## Composables (61 total)

| Categoria           | Cantidad | Ejemplos                                          |
| ------------------- | -------- | ------------------------------------------------- |
| Admin               | 20       | useAdminVehicles, useAdminConfig, useAdminMetrics |
| Catalogo/Navegacion | 5        | useVehicles, useFilters, useCatalogState          |
| Comprador           | 6        | useFavorites, useSavedSearches, useUserProfile    |
| Dealer              | 8        | useDealerDashboard, useDealerLeads, useInvoicing  |
| Subastas            | 2        | useAuction, useAuctionRegistration                |
| Infra               | 2        | useInfraMetrics, useInfraRecommendations          |
| Vertical            | 2        | useVerticalConfig, useAdminVerticalConfig         |
| Utilidades          | 6        | useLocalized, useAuth, useHreflang, usePageSeo    |
| Marketing           | 2        | useAds, useSocialPublisher                        |
| Otros               | 8        | useNews, useReports, useTransport, etc.           |

---

## Stack Tecnologico (verificado)

| Componente | Tecnologia                                             | Estado      |
| ---------- | ------------------------------------------------------ | ----------- |
| Frontend   | Nuxt 3 + Vue 3 + TypeScript                            | Operativo   |
| Backend    | Supabase (PostgreSQL + Auth + Realtime)                | Operativo   |
| Imagenes   | Cloudinary + CF Images                                 | Operativo   |
| Pagos      | Stripe (Checkout + Connect + Webhooks)                 | Operativo   |
| Email      | Resend (30 templates)                                  | Operativo   |
| Push       | Web Push (VAPID)                                       | Operativo   |
| WhatsApp   | Meta Business API                                      | Operativo   |
| IA         | Anthropic Claude (descripciones, verificacion, social) | Operativo   |
| Deploy     | Cloudflare Pages (auto-deploy on push)                 | Operativo   |
| CI/CD      | GitHub Actions (lint, typecheck, build, test, e2e)     | Operativo   |
| Testing    | Vitest + Playwright                                    | Configurado |
| Monitoring | Custom infra API (metricas, alertas, clusters)         | Operativo   |

---

## Deuda Tecnica Conocida

1. **i18n parcial**: 47 archivos aun usan `.name_es/.name_en` directo en lugar de `localizedField()`. La infraestructura esta lista (JSONB columns + useLocalized.ts), pero la migracion del display layer no esta completa.

2. **Duplicacion admin/dashboard**: ~1,600 lineas de logica duplicada entre composables admin y dashboard. Principales pares: useAdminAdvertisements/useAdminDemands (92%), useAdminChat/useUserChat (85%), useAdminVehicles/useVehicles (65%).

3. **Chart.js en pagina publica**: `/datos` importa chart.js estaticamente (+15 KB en bundle publico). Deberia usar lazy-loading.

4. **Dependencias no usadas**: exceljs, jspdf, jspdf-autotable, qrcode en package.json pero sin importar en ningun componente (~115 KB potencialmente eliminables).

---

_Este documento reemplaza a docs/progreso.md como fuente de verdad del estado del producto._

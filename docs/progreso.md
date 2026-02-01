# Tank Iberica — Progreso de Implementación

## Estado actual: Step 2 — En progreso

---

## Step 0 — Emergencia de Seguridad
| # | Tarea | Estado | Fecha | Notas |
|---|-------|--------|-------|-------|
| 0.1 | Revocar API_KEY, crear nueva con restricción de dominio | ✅ Hecho | 2026-02-01 | Nueva key restringida a tankiberica.com. Antigua revocada. Reemplazada en 4 archivos legacy. |
| 0.2 | Eliminar Keys.txt, añadir a .gitignore | ✅ Hecho | 2026-02-01 | Keys.txt no existía en el repo. Añadido a .gitignore como prevención. |
| 0.3 | Crear proxy Apps Script para Sheets API | ✅ Hecho | 2026-02-01 | Proxy desplegado. 4 archivos legacy migrados al proxy. 0 ocurrencias de API_KEY en código cliente. |
| 0.4 | Reemplazar 163 innerHTML por textContent/DOMPurify | ✅ Hecho | 2026-02-01 | escapeHTML() helper creado. 163 innerHTML revisados en 7 archivos: datos dinámicos escapados, textos estáticos a textContent, clearings mantenidos. |
| 0.5 | Migrar localStorage a sessionStorage para sesiones | ✅ Hecho | 2026-02-01 | Sesiones (tank_iberica_session/user, tank_token/user) migradas a sessionStorage en 5 archivos. Preferencias (idioma, chatId, plataformas) mantienen localStorage. |
| 0.6 | Desactivar Apps Script OTP antiguo | ✅ Hecho | 2026-02-01 | Apps Scripts antiguos borrados. Todas las URLs (5 archivos) apuntan al único script activo. |
| 0.7 | Eliminar ipapi.co, usar navigator.language | ✅ Hecho | 2026-02-01 | ipapi.co eliminado de main.js e index.html. Reemplazado por navigator.language. 0 peticiones externas. |

## Step 1 — Cimientos: Nuxt + Auth + Deploy
| # | Tarea | Estado | Fecha | Notas |
|---|-------|--------|-------|-------|
| 1.1 | Crear proyecto Supabase (eu-west-1) | ✅ Hecho | 2026-02-01 | Proyecto creado en eu-west-1. Credenciales en .env. |
| 1.2 | Configurar Auth: Email+Password + Google | ✅ Hecho | 2026-02-01 | Email+Password activo. Google OAuth pendiente de credenciales Cloud Console. Site URL configurado. |
| 1.3 | Crear tabla users + RLS + trigger on signup | ✅ Hecho | 2026-02-01 | Tabla users, enum user_role, 4 políticas RLS, trigger on_auth_user_created. Migration 00001. |
| 1.4 | npx nuxi init + módulos | ✅ Hecho | 2026-02-01 | Nuxt 4 minimal + @nuxtjs/supabase, @nuxtjs/i18n, @pinia/nuxt, @vueuse/nuxt, @nuxt/image. i18n es/en. app.vue + index.vue placeholder. |
| 1.5 | tokens.css con design system mobile-first | ✅ Hecho | 2026-02-01 | Todos los tokens del DESIGN_SYSTEM.md. Reset global. Touch targets 44px. Breakpoints mobile-first (min-width). |
| 1.6 | Layout: AppHeader (hamburger móvil) + AppFooter | ✅ Hecho | 2026-02-01 | AppHeader con hamburger móvil, social links desktop, lang switch, account btn. AppFooter 3 columnas. Layout default. i18n actualizado. |
| 1.7 | AuthModal (bottom sheet móvil, modal desktop) | ✅ Hecho | 2026-02-01 | Bottom sheet en móvil, modal centrado en desktop. Login/Register con email+password y Google OAuth. Forgot password. Escape para cerrar. Body scroll lock. |
| 1.8 | Página / con placeholder + AuthModal | ✅ Hecho | 2026-02-01 | Hero con título + subtítulo + "Próximamente". useSeoMeta. Página /confirm para OAuth callback. AuthModal integrado en layout. |
| 1.9 | Conectar Cloudflare Pages + deploy automático | ✅ Hecho | 2026-02-01 | Cloudflare Pages conectado a GitHub. Build output: dist. Auto-deploy on push to main. Variables de entorno configuradas. |
| 1.10 | ESLint + Prettier + Husky | ✅ Hecho | 2026-02-01 | @nuxt/eslint-config flat config. Prettier. Husky pre-commit hook con lint. docs/ excluido de lint. |
| 1.11 | Test móvil real: registro, login, logout | ✅ Hecho | 2026-02-01 | Testado en móvil vía LAN (192.168.1.193:3000). Registro, login, nombre en header, logout verificados. Cookie secure fix aplicado para HTTP en dev. |
| 1.12 | Verificar botón atrás móvil | ✅ Hecho | 2026-02-01 | Navegación correcta. AuthModal cierra sin afectar historial. Back button funciona en todos los flujos. |

## Step 2 — Catálogo Completo
| # | Tarea | Estado | Fecha | Notas |
|---|-------|--------|-------|-------|
| 2.1 | Crear tablas: vehicles, vehicle_images, subcategories, filter_definitions, config | ✅ Hecho | 2026-02-01 | Migration 00002. 3 enums (vehicle_status, vehicle_category, filter_type). 5 tablas con índices, FKs CASCADE, updated_at triggers. |
| 2.2 | RLS: SELECT público en todas | ✅ Hecho | 2026-02-01 | Migration 00003. RLS en 5 tablas. SELECT público para published. Admin full access en todas. vehicle_images filtra por vehicle status. filter_definitions excluye is_hidden. |
| 2.3 | Exportar CSVs de Sheets | ✅ Hecho | 2026-02-01 | 4 CSVs en supabase/seed/. Subcategorias (5), filtros (8), config (1). Vehiculos vacío de momento. |
| 2.4 | Script migración CSV → Supabase | ✅ Hecho | 2026-02-01 | seed.sql con 5 subcategorías, 12 filter_definitions (mapeados por subcategoría con extra/hides logic), 1 config. Vehículos pendientes (hoja vacía). |
| 2.5 | Cloudinary: subir fotos, actualizar URLs | ⬜ Pendiente | | Cuenta Cloudinary creada (djhcqgyjr). Pendiente subir fotos cuando haya vehículos. Se hará antes de task 2.17. |
| 2.6 | Composable useVehicles | ✅ Hecho | 2026-02-01 | fetchVehicles con filtros (categoría, subcategoría, precio, año, marca, búsqueda), paginación infinita (PAGE_SIZE=20), fetchBySlug, fetchMore, reset. Tipado completo. |
| 2.7 | Composable useFilters (6 tipos dinámicos) | ✅ Hecho | 2026-02-01 | fetchBySubcategory, visibleFilters (computed con lógica tick extra/hides), setFilter, clearFilter, clearAll. 6 tipos soportados. |
| 2.8 | Store catalog.ts | ✅ Hecho | 2026-02-01 | useCatalogState con useState (Pinia no disponible en Nuxt 4). Categoría, subcategoría, filtros, scroll position, búsqueda. Persiste entre navegaciones. |
| 2.9 | CategoryBar (dinámico, scrollable móvil) | ⬜ Pendiente | | |
| 2.10 | SubcategoryBar (chips dinámicos) | ⬜ Pendiente | | |
| 2.11 | FilterBar (bottom sheet móvil, 6 tipos) | ⬜ Pendiente | | |
| 2.12 | VehicleGrid + VehicleCard + @nuxt/image | ⬜ Pendiente | | |
| 2.13 | vehiculo/[slug].vue (PÁGINA REAL) | ⬜ Pendiente | | |
| 2.14 | useSeoMeta() en [slug].vue | ⬜ Pendiente | | |
| 2.15 | Banner + i18n catálogo | ⬜ Pendiente | | |
| 2.16 | Keep-alive: preservar scroll al volver | ⬜ Pendiente | | |
| 2.17 | Test móvil: catálogo → filtrar → detalle → atrás | ⬜ Pendiente | | |

## Step 3 — Interacción de Usuario
| # | Tarea | Estado | Fecha | Notas |
|---|-------|--------|-------|-------|
| 3.1 | Tabla favorites + RLS | ⬜ Pendiente | | |
| 3.2 | useFavorites + FavoriteButton | ⬜ Pendiente | | |
| 3.3 | UserPanel (página /mi-cuenta en móvil) | ⬜ Pendiente | | |
| 3.4 | Tabla advertisements + RLS | ⬜ Pendiente | | |
| 3.5 | AdvertiseModal (página en móvil) | ⬜ Pendiente | | |
| 3.6 | Tabla demands + RLS | ⬜ Pendiente | | |
| 3.7 | DemandModal (página en móvil) | ⬜ Pendiente | | |
| 3.8 | Tabla subscriptions + RLS | ⬜ Pendiente | | |
| 3.9 | SubscribeModal (bottom sheet) | ⬜ Pendiente | | |
| 3.10 | Edge Functions: emails bienvenida + notificación | ⬜ Pendiente | | |
| 3.11 | Test móvil: login → favorito → anúnciate → mi cuenta | ⬜ Pendiente | | |

## Step 4 — Noticias + Chat
| # | Tarea | Estado | Fecha | Notas |
|---|-------|--------|-------|-------|
| 4.1 | Tablas news + comments + RLS | ⬜ Pendiente | | |
| 4.2 | Migrar hojas noticias y comentarios | ⬜ Pendiente | | |
| 4.3 | noticias/index.vue (listado) | ⬜ Pendiente | | |
| 4.4 | noticias/[slug].vue (PÁGINA REAL + comentarios) | ⬜ Pendiente | | |
| 4.5 | WhatsApp share con preview (og:image) | ⬜ Pendiente | | |
| 4.6 | Tabla chat_messages + RLS | ⬜ Pendiente | | |
| 4.7 | Migrar hoja chat | ⬜ Pendiente | | |
| 4.8 | ChatWidget con Supabase Realtime | ⬜ Pendiente | | |
| 4.9 | Páginas estáticas: sobre-nosotros, legal | ⬜ Pendiente | | |
| 4.10 | Test móvil: noticias → detalle → comentar → chat | ⬜ Pendiente | | |

## Step 5 — Admin Completo
| # | Tarea | Estado | Fecha | Notas |
|---|-------|--------|-------|-------|
| 5.1 | Middleware admin + layout sidebar | ⬜ Pendiente | | |
| 5.2 | Tablas admin: balance, intermediation, history_log, viewed_vehicles | ⬜ Pendiente | | |
| 5.3 | Migrar hojas admin | ⬜ Pendiente | | |
| 5.4 | /admin Dashboard | ⬜ Pendiente | | |
| 5.5 | /admin/vehiculos CRUD | ⬜ Pendiente | | |
| 5.6 | /admin/config: CRUD subcategorías + filtros | ⬜ Pendiente | | |
| 5.7 | /admin/anunciantes + solicitantes | ⬜ Pendiente | | |
| 5.8 | /admin/usuarios | ⬜ Pendiente | | |
| 5.9 | /admin/noticias | ⬜ Pendiente | | |
| 5.10 | /admin/chat | ⬜ Pendiente | | |
| 5.11 | /admin/balance + intermediación | ⬜ Pendiente | | |
| 5.12 | /admin/ojeados + history_log | ⬜ Pendiente | | |
| 5.13 | Test E2E: crear vehículo → publicar → ver en catálogo | ⬜ Pendiente | | |

## Step 6 — Hardening
| # | Tarea | Estado | Fecha | Notas |
|---|-------|--------|-------|-------|
| 6.1 | TypeScript estricto + supabase gen types | ⬜ Pendiente | | |
| 6.2 | GitHub Actions CI | ⬜ Pendiente | | |
| 6.3 | Tests unitarios completos | ⬜ Pendiente | | |
| 6.4 | Tests componente críticos | ⬜ Pendiente | | |
| 6.5 | E2E Playwright (emulación móvil) | ⬜ Pendiente | | |
| 6.6 | Sentry | ⬜ Pendiente | | |
| 6.7 | Security headers Cloudflare | ⬜ Pendiente | | |
| 6.8 | PWA | ⬜ Pendiente | | |
| 6.9 | Lighthouse móvil >90 | ⬜ Pendiente | | |
| 6.10 | Core Web Vitals | ⬜ Pendiente | | |
| 6.11 | Migrar usuarios (password reset) | ⬜ Pendiente | | |
| 6.12 | Desmantelar sistema antiguo | ⬜ Pendiente | | |
| 6.13 | Test final completo | ⬜ Pendiente | | |

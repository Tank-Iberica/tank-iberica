## ANEXO Y: MAPA DE COMPOSABLES

> Referencia rápida de todos los composables del proyecto, dónde se crean, y sus dependencias.

### Composables de infraestructura (sesiones 2-3)

| Composable          | Sesión | Ubicación                          | Propósito                                                                                                     | Dependencias           |
| ------------------- | ------ | ---------------------------------- | ------------------------------------------------------------------------------------------------------------- | ---------------------- |
| `useLocalized`      | 3      | `composables/useLocalized.ts`      | `localizedField(obj, locale)` + `fetchTranslation(entity, id, field, locale)` con fallback chain              | Supabase, @nuxtjs/i18n |
| `useVerticalConfig` | 3      | `composables/useVerticalConfig.ts` | Carga y cachea `vertical_config`. `applyTheme()`, `isSectionActive()`, `isLocaleActive()`, `isActionActive()` | Supabase               |

### Composables de dealer (sesiones 10, 24)

| Composable           | Sesión | Ubicación                           | Propósito                                                                              | Dependencias              |
| -------------------- | ------ | ----------------------------------- | -------------------------------------------------------------------------------------- | ------------------------- |
| `useDealerTheme`     | 10     | `composables/useDealerTheme.ts`     | Merge tema dealer sobre tema vertical. `applyDealerTheme()`                            | useVerticalConfig         |
| `useDealerDashboard` | 24     | `composables/useDealerDashboard.ts` | `loadStats()`, `loadLeads()`, `loadVehicles()`, `markLeadRead()`, `updateLeadStatus()` | Supabase, useAuth         |
| `useDealerStats`     | 24     | `composables/useDealerStats.ts`     | `loadDailyStats()`, `loadMonthlyStats()`, `canAccessMetric(plan, metric)`              | Supabase, useSubscription |

### Composables de usuario (sesión 24)

| Composable          | Sesión | Ubicación                          | Propósito                                                                                                                              | Dependencias                |
| ------------------- | ------ | ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| `useAuth`           | 24     | `composables/useAuth.ts`           | `login()`, `register()`, `logout()`, `resetPassword()`, `currentUser`, `isDealer`, `isBuyer`, `isAdmin`                                | Supabase Auth               |
| `useSubscription`   | 24     | `composables/useSubscription.ts`   | `isPro`, `isDealer`, `dealerPlan`, `hasActiveSub`, `canAccess(feature)`. Realtime via Supabase. **Crítico para Pro 24h y plan-gating** | Supabase, Supabase Realtime |
| `useUserProfile`    | 24     | `composables/useUserProfile.ts`    | `loadProfile()`, `updateProfile()`, `deleteAccount()`, `exportData()`                                                                  | Supabase, useAuth           |
| `useBuyerDashboard` | 24     | `composables/useBuyerDashboard.ts` | `loadFavorites()`, `loadAlerts()`, `loadContactHistory()`, `loadRecentViews()`                                                         | Supabase, useAuth           |

### Composables de contenido (sesiones 11, 16b)

| Composable           | Sesión | Ubicación                           | Propósito                                                                                                                   | Dependencias                                  |
| -------------------- | ------ | ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| `useSeoScore`        | 11     | `composables/useSeoScore.ts`        | 15+ checks SEO, score 0-100, panel lateral en editor                                                                        | —                                             |
| `useAds`             | 16b    | `composables/useAds.ts`             | Matching de anuncios geolocalizados: `useAds(position, category?, action?, vehicleLocation?)`. Registra impresiones y clics | Supabase, Cloudflare headers                  |
| `useSocialPublisher` | 16d    | `composables/useSocialPublisher.ts` | `publish(platform, content, imageUrl)`. Adapters por plataforma                                                             | APIs sociales (LinkedIn, Facebook, Instagram) |

### Composables de verificación (sesión 15)

| Composable               | Sesión | Ubicación                               | Propósito                                                                         | Dependencias                     |
| ------------------------ | ------ | --------------------------------------- | --------------------------------------------------------------------------------- | -------------------------------- |
| `useVehicleVerification` | 15     | `composables/useVehicleVerification.ts` | Gestión de niveles de verificación, upload docs, análisis Claude Vision, Km Score | Supabase, Cloudinary, Claude API |

### Dependencias entre composables

```
useVerticalConfig ──→ useDealerTheme (hereda tema base)
useAuth ──→ useSubscription (necesita user_id)
useAuth ──→ useDealerDashboard
useAuth ──→ useBuyerDashboard
useAuth ──→ useUserProfile
useSubscription ──→ useAds (determina si mostrar ProTeaser)
useSubscription ──→ useDealerStats (plan-gating de métricas)
useLocalized ──→ (usado por casi todos los componentes de UI)
```

### Middleware (sesión 24)

| Middleware  | Propósito                                                      |
| ----------- | -------------------------------------------------------------- |
| `auth.ts`   | Redirige a `/auth/login` si no autenticado en rutas protegidas |
| `dealer.ts` | Verifica `user_type='dealer'` para rutas `/dealer/*`           |

---

_Creado: 18 de febrero de 2026_

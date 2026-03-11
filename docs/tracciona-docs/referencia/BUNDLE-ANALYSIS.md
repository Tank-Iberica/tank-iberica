# Bundle Analysis — Tracciona

> **Generado:** 2026-03-06 · Herramienta: `nuxi analyze`
> **Última ejecución completa:** Pendiente — ejecutar `npm run analyze` en CI y actualizar esta tabla.

---

## Umbrales objetivo

| Tipo de ruta           | Ejemplo rutas                        | JS total (gzip) | CSS (gzip) |
|------------------------|--------------------------------------|:---------------:|:----------:|
| Pública SSR            | `/`, `/vehiculo/**`, `/noticias/**`  | ≤ 200 KB        | ≤ 30 KB    |
| Pública SSR catálogo   | `/`, `/?category_id=*`              | ≤ 200 KB        | ≤ 30 KB    |
| Autenticada SPA        | `/dashboard/**`, `/perfil/**`        | ≤ 400 KB        | ≤ 50 KB    |
| Admin SPA              | `/admin/**`                          | ≤ 600 KB        | ≤ 60 KB    |

> **Qué medir:** Solo JS que se descarga al browser (excluye server-side bundles).
> Las rutas SPA cargan todo el chunk de la sección de una vez.

---

## Ejecución

```bash
# Análisis interactivo (abre Vite Bundle Visualizer en el browser)
npm run analyze

# O directamente
npx nuxi analyze
```

El resultado se guarda en `.nuxt/analyze/`. El archivo HTML se abre automáticamente en el navegador.

**En CI** (sin UI), capturar stats:
```bash
npx nuxi analyze 2>&1 | tee /tmp/bundle-stats.txt
```

---

## Chunks configurados (manualChunks en nuxt.config.ts)

| Chunk name        | Contenido                    | Impacto estimado |
|-------------------|------------------------------|:----------------:|
| `vendor-charts`   | chart.js + vue-chartjs       | ~200 KB (solo admin/dashboard) |
| `vendor-pdf`      | jspdf                        | ~250 KB (solo herramientas dealer) |
| `vendor-sanitize` | dompurify / isomorphic-dompurify | ~20 KB |
| `vendor-stripe`   | @stripe/stripe-js            | ~150 KB (solo checkout) |
| `vendor-excel`    | exceljs                      | ~300 KB (solo admin export) |

---

## Librerías pesadas a vigilar

| Librería | Uso | Alternativa si crece |
|----------|-----|----------------------|
| `@supabase/supabase-js` | Auth + DB queries en client | Tree-shake si se migra a server-side |
| `@nuxtjs/i18n` + `es.json` / `en.json` | Traducciones (~200 KB JSON sin gzip) | Lazy-load con `lazy: true` (ya configurado) |
| Prebid.js (`cdn.jsdelivr.net`) | Publicidad | Ya cargado externamente (no en bundle) |
| `vue-chartjs` + `chart.js` | Gráficas admin/dashboard | Ya en `vendor-charts`, lazy-import |

---

## Estado de la última ejecución

> ⚠️ **Pendiente** — Ejecutar `npm run analyze` y rellenar esta sección.

```
Fecha ejecución: [YYYY-MM-DD]
Build version:   [git commit hash]

Chunks principales (gzip):
  _nuxt/entry.[hash].js          — [XXX KB]
  _nuxt/vendor-charts.[hash].js  — [XXX KB]
  _nuxt/vendor-pdf.[hash].js     — [XXX KB]
  _nuxt/vendor-excel.[hash].js   — [XXX KB]
  _nuxt/vendor-stripe.[hash].js  — [XXX KB]
  _nuxt/vendor-sanitize.[hash].js — [XXX KB]

Rutas más pesadas:
  /admin/**     — [XXX KB] JS total
  /dashboard/** — [XXX KB] JS total
  /vehiculo/**  — [XXX KB] JS total
  /             — [XXX KB] JS total
```

---

## Procedimiento trimestral

1. Hacer checkout de `main`
2. `npm run analyze`
3. Anotar el tamaño del chunk `entry` y de los vendor chunks
4. Si algún chunk supera el umbral → investigar qué librería creció
5. Actualizar tabla "Estado de la última ejecución" con fecha y valores
6. Si se detecta regresión > 20% → abrir issue

---

## Optimizaciones pendientes

| Optimización | Estado | Ahorro estimado |
|---|---|---|
| `i18n lazy: true` (solo cargar locale activo) | ✅ Ya configurado | ~100 KB |
| Charts: import dinámico (`() => import('chart.js')`) | ⬜ Pendiente auditar | ~100 KB en rutas SSR |
| PDF: import dinámico | ⬜ Pendiente auditar | ~250 KB en rutas SSR |
| Supabase: tree-shake auth helpers no usados | ⬜ Pendiente analizar | ~30 KB |
| `@nuxt/image`: solo usar provider activo | ✅ Nuxt Image hace esto por defecto | — |

---

*Ver también: `nuxt.config.ts → vite.build.rollupOptions.output.manualChunks` para la configuración de chunks activa.*

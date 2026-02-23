# Tracciona.com — Documentación de Migración y Producto

## REGLA PRINCIPAL PARA CLAUDE CODE

```
EXECUTE NOW:     migracion/01-pasos-0-6-migracion.md
NOT NOW:         Everything else is REFERENCE for design decisions
```

## Instrucciones de uso

1. **Lee este README** → entiende la estructura y las reglas
2. **Abre `migracion/01-pasos-0-6-migracion.md`** → ejecuta los pasos en orden (0→6)
3. **Cuando un paso referencia un anexo** → lee el archivo correspondiente en `anexos/`
4. **No implementes anexos independientemente** salvo que los Pasos 0-6 lo pidan explícitamente
5. **No toques el roadmap** (`03-roadmap-post-lanzamiento.md`) hasta completar Pasos 0-6

## Estructura de carpetas

```
tracciona-docs/
├── README.md                          ← ESTÁS AQUÍ
├── migracion/
│   ├── 00-backup.md                   ← Paso 0: backup (PRIMERO)
│   ├── 01-pasos-0-6-migracion.md      ← EJECUTAR: pasos 0-6 completos
│   ├── 02-deuda-tecnica-diferida.md   ← NO ejecutar durante migración
│   └── 03-roadmap-post-lanzamiento.md ← Ejecutar DESPUÉS de pasos 0-6
├── anexos/
│   ├── A-verticales-confirmados.md
│   ├── B-verticales-futuros.md
│   ├── C-resumen-verticales.md
│   ├── D-monetizacion.md
│   ├── E-sistema-pro.md
│   ├── F-publicidad-directa.md
│   ├── G-verificacion-carfax.md
│   ├── G-BIS-transporte.md
│   ├── H-subastas.md
│   ├── I-automatizacion-ia.md
│   ├── J-adsense-google-ads.md
│   ├── K-dealer-toolkit.md
│   ├── L-flujo-post-venta.md
│   ├── M-herramientas-dealer.md
│   ├── N-seguridad-mantenimiento.md
│   ├── O-hub-fisico-leon.md
│   ├── P-contenido-editorial.md        ← Guías, noticias, normativa, comparativas (actualizado con i18n + scheduling)
│   ├── Q-merchandising.md
│   ├── R-marco-legal.md
│   ├── S-monetizacion-datos.md
│   ├── T-internacionalizacion-i18n.md   ← NUEVO: sistema i18n escalable (JSONB + content_translations + traducción auto)
│   ├── U-publicacion-programada-calendario.md ← NUEVO: scheduled publishing + calendario editorial + SEO Score Potenciador
│   ├── V-tablas-placeholder-capa2.md    ← NUEVO: tablas dealers, auctions, verification, ads, transport (solo schema)
│   └── W-panel-configuracion.md         ← NUEVO: panel admin completo (vertical_config + portal dealer + 10 secciones UI)
├── pitch/
│   ├── pitch-inversores.html
│   └── pitch-dealers.html
└── referencia/
    └── documentos-relacionados.md
```

## Cuándo consultar cada anexo

| Si estás ejecutando...               | Consulta estos anexos                                                                                  |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| **Paso 1** (SQL rename)              | Anexo T (i18n: cambiar \_es/\_en a JSONB), Anexo V (tablas placeholder a crear junto con la migración) |
| **Paso 2** (Frontend)                | Anexo T.5 (helper localizedField()), Anexo T.6 (config i18n prefix_except_default)                     |
| **Paso 3** (Landings SEO)            | Anexo P (estructura editorial), Anexo U.6 (SEO Score Potenciador)                                      |
| **Paso 4** (Routing)                 | Anexo P (rutas /guia/ y /noticias/), Anexo T.6 (i18n strategy)                                         |
| **Paso 5** (Verificación)            | — (solo testing)                                                                                       |
| **Paso 6** (Mejoras pre-lanzamiento) | Anexo R (disclaimers), Anexo N (seguridad), Anexo U (scheduled publishing)                             |
| **Paso 7** (Post-lanzamiento fase 1) | Anexo K (Dealer Toolkit), Anexo E (Sistema Pro)                                                        |
| **Paso 8** (Post-lanzamiento fase 2) | Anexo G (Verificación), Anexo H (Subastas), Anexo F (Publicidad)                                       |
| **Paso 9** (Post-lanzamiento fase 3) | Anexo I (IA), Anexo J (Ads), Anexo S (Datos)                                                           |

> **NOTA:** Las sesiones 13-32 post-lanzamiento tienen sus referencias de lectura detalladas en `INSTRUCCIONES-MAESTRAS.md`. Cada sesión indica exactamente qué anexos leer antes de escribir código. Consultar `INSTRUCCIONES-MAESTRAS.md` como fuente principal para cualquier sesión.
> | **Sesión 15** (Verificación) | Anexo G, Anexo R |
> | **Sesión 16** (Subastas) | Anexo H, Anexo E |
> | **Sesión 16b** (Publicidad + Pro) | Anexo F, Anexo J, Anexo E |
> | **Sesión 16c** (Transporte + post-venta) | Anexo G-BIS, Anexo L |
> | **Sesión 16d** (Scraping + redes) | Anexo I |
> | **Sesión 17** (Stripe) | Anexo E, Anexo D, Anexo H |
> | **Sesión 18** (Emails) | Anexo W, Anexo D, Anexo K |
> | **Sesión 24** (Usuarios + dealer) | Anexo E, Anexo K, Anexo W |
> | **Sesión 25** (Compliance) | Anexo R, Anexo N |
> | **Sesión 31** (Herramientas dealer) | Anexo M, Anexo K |
> | **Sesión 32** (Datos) | Anexo S, Anexo R |
> | **Composables (referencia)** | Anexo Y (mapa de composables) |

## Los 9 puntos de la actualización (validados)

1. **Sistema de idiomas (Anexo T)** — Columnas \_es/\_en → JSONB para campos cortos + tabla content_translations para campos largos. Preparado para N idiomas sin ALTER TABLE.
2. **Estructura de BD para dealers (Anexo V.1)** — Tabla dealers, columna dealer_id en vehicles, desde el día uno.
3. **Tablas placeholder Capa 2 (Anexo V)** — auctions, verification_reports, ad_slots, transport_quotes. Solo schema SQL, sin frontend.
4. **Contenido editorial en routing (Anexo P actualizado)** — /guia/[slug] (evergreen) + /noticias/[slug] (temporal). Tabla articles con i18n + scheduling + social. Sin /comunicacion/.
5. **Disclaimers legales (Anexo R)** — Componentes DisclaimerFooter, DisclaimerBadge, páginas /legal, /privacidad, /cookies, /condiciones.
6. **Campos adicionales en vehicles (Anexo V.2)** — dealer_id, listing_type, verification_level, sold_at, pending_translations, location_data JSONB.
7. **Traducción automática (Anexo T.7)** — Títulos auto-generados (0€), términos fijos con Claude Max (0€), fichas con GPT-4o mini Batch API (~0,001€/ficha), artículos con GPT-4o mini (~0,01€/artículo).
8. **Publicación programada + calendario (Anexo U)** — status scheduled, cron auto-publish, calendario web (Ma/Ju 09:00 CET) y redes (Lu-Vi horarios B2B), SEO Score Potenciador ampliado, flujo dominical con Claude Max.
9. **Panel de configuración (Anexo W)** — vertical_config para identidad visual/colores/categorías/idiomas/precios sin tocar código. Portal dealer personalizable. 10 secciones de admin UI. Activity logs. Flujo de clonado de vertical en 2-4 horas sin VS Code.

## Stack técnico

- **Frontend:** Nuxt 3 (Vue 3), TypeScript, Pinia, @nuxtjs/i18n (strategy: prefix_except_default)
- **Backend:** Supabase (PostgreSQL + Auth + Realtime + Edge Functions + Storage)
- **Imágenes:** Cloudinary
- **Deploy:** Cloudflare Pages
- **Dominio:** tracciona.com (prefix_except_default: /en/, /fr/, /de/... español sin prefijo)
- **Traducción:** GPT-4o mini Batch API (producción) / Claude Max (fase lanzamiento, 0€)

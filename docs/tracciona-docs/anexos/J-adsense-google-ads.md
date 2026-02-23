## ANEXO J: GOOGLE ADSENSE + GOOGLE ADS

### J.1 Estrategia general: AdSense es el puente, publicidad directa es el destino

```
FASE 1 (meses 1-6):    AdSense en todos los espacios publicitarios
FASE 2 (meses 6-12):   Publicidad directa en espacios premium + AdSense en el resto
FASE 3 (meses 12+):    Publicidad directa donde haya anunciante + AdSense solo en residual
```

**Regla clave:** AdSense y publicidad directa propia (Anexo F) NO conviven en el mismo espacio. Cuando un anunciante directo paga 150€/mes por aparecer en fichas de cisternas en Aragón, ese slot deja de ser AdSense. AdSense paga 8-25€ CPM (unos 30-80€/mes por slot con tráfico moderado). Un anunciante directo paga 100-400€/mes por el mismo espacio. La transición es progresiva: a medida que captas anunciantes directos, los slots de AdSense van desapareciendo.

### J.2 Google AdSense — Configuración e implementación

**Requisitos para aprobación:**

- Contenido original (mínimo 20-30 páginas con contenido real)
- Dominio propio activo
- Política de privacidad y cookies
- No contenido prohibido
- Solicitar aprobación cuando haya >30 vehículos publicados y las landings tengan contenido

**Implementación en Nuxt:**

```typescript
// nuxt.config.ts — Añadir script de AdSense
app: {
  head: {
    script: [
      {
        src: 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js',
        async: true,
        crossorigin: 'anonymous',
        'data-ad-client': 'ca-pub-XXXXXXXXXX', // Tu ID de editor
      },
    ]
  }
}

// IMPORTANTE: Cargar AdSense con lazy loading para no afectar LCP
// Opción mejor: cargar el script solo cuando el usuario hace scroll (IntersectionObserver)
```

**Componente AdSense:**

```typescript
// /app/components/AdSenseSlot.vue
// Props: format ('horizontal' | 'vertical' | 'rectangle' | 'in-feed')
//        slot (ID del bloque de anuncio)
//        fallback (boolean: si hay publicidad directa disponible, no mostrar AdSense)
//
// Lógica:
// 1. Verificar si hay anuncio directo disponible para esta posición (query tabla ads del Anexo F)
// 2. Si hay anuncio directo → renderizar AdSlot.vue (Anexo F) en su lugar
// 3. Si NO hay anuncio directo → renderizar bloque de AdSense
// 4. Lazy load: solo cargar cuando el slot entra en viewport
//
// <template>
//   <div v-if="hasDirectAd">
//     <AdSlot :position="position" :category="category" />
//   </div>
//   <div v-else class="adsense-slot">
//     <ins class="adsbygoogle"
//       :style="{ display: 'block' }"
//       :data-ad-client="adClient"
//       :data-ad-slot="slot"
//       :data-ad-format="format"
//       data-full-width-responsive="true" />
//   </div>
// </template>
```

### J.3 Ubicación de bloques AdSense

**Dónde SÍ poner AdSense (slots que se reemplazan por pub directa cuando haya anunciante):**

| Posición                                       | Formato AdSense            | CPM estimado | Notas                                                                 |
| ---------------------------------------------- | -------------------------- | ------------ | --------------------------------------------------------------------- |
| Catálogo: entre resultados cada 8-10 vehículos | In-feed ad                 | 15-25€       | Se reemplaza por tarjeta "Patrocinado" cuando haya anunciante directo |
| Sidebar de landing pages (desktop)             | Vertical 160x600 o 300x600 | 10-20€       | Se reemplaza por banner de anunciante directo                         |
| Debajo de specs en ficha de vehículo           | Rectangle 336x280          | 20-35€       | PREMIUM — se reemplaza por módulo "Servicios para este vehículo"      |
| Footer informativo                             | Horizontal 728x90          | 5-10€        | Se reemplaza por logos de partners                                    |
| Artículos editoriales (entre párrafos)         | In-article                 | 12-20€       | Mantener AdSense largo plazo (no hay pub directa natural aquí)        |

**Dónde NO poner AdSense (nunca, independientemente de la fase):**

- **Ficha de vehículo: encima del botón de contacto** — El usuario está a punto de convertir, no meterle distracción
- **Proceso de registro / login** — Genera desconfianza
- **Formulario de publicación de anuncio (AdvertiseModal)** — El vendedor está dando valor a tu plataforma
- **Panel admin / dashboard** — Páginas privadas, no indexadas
- **Páginas de subasta en vivo** — La atención debe estar en la puja
- **Emails de alertas** — AdSense no permite anuncios en emails (usar solo pub directa)
- **PDFs generados** — AdSense no aplica a PDFs (usar solo pub directa)

**Regla de densidad:** Máximo 2 bloques de AdSense visibles simultáneamente en la misma vista. Más de eso y pareces Milanuncios.

### J.4 Ingresos estimados de AdSense

| Visitas/mes | CPM medio | Bloques/página | Ingresos/mes |
| ----------- | --------- | -------------- | ------------ |
| 5.000       | 12€       | 2              | 120€         |
| 15.000      | 15€       | 2              | 450€         |
| 30.000      | 18€       | 2              | 1.080€       |
| 50.000      | 20€       | 2              | 2.000€       |
| 100.000     | 22€       | 2              | 4.400€       |

**CPM en B2B industrial español:** 8-25€ (más alto que media por intención de compra alta y ticket alto).
**CPM sube con el tráfico** porque Google te prioriza cuando demuestras engagement.

**Comparativa AdSense vs publicidad directa:**

| Métrica                            | AdSense                    | Pub directa (Anexo F)               |
| ---------------------------------- | -------------------------- | ----------------------------------- |
| Ingreso por slot/mes (30K visitas) | 30-80€                     | 100-400€                            |
| Esfuerzo de gestión                | Cero (automático)          | Comercial (captar anunciante)       |
| Control del contenido              | Ninguno (Google decide)    | Total (tú eliges)                   |
| Relevancia para el usuario         | Media (algoritmo)          | Alta (segmentado por vertical/zona) |
| Dependencia externa                | Alta (Google puede banear) | Ninguna                             |

**Conclusión:** AdSense es dinero fácil pero poco. Publicidad directa es más trabajo pero 3-5x más rentable y sin dependencia. Transicionar progresivamente.

### J.5 Alternativas a AdSense (si se necesita más CPM antes de tener anunciantes directos)

| Red                      | CPM estimado | Requisito mínimo         | Notas                             |
| ------------------------ | ------------ | ------------------------ | --------------------------------- |
| Google AdSense           | 8-25€        | Ningún mínimo de tráfico | Más fácil de aprobar              |
| Ezoic                    | 15-30€       | 10.000 visitas/mes       | Mejor CPM, IA de optimización     |
| Mediavine                | 25-45€       | 50.000 sesiones/mes      | Mucho mejor CPM, requiere tráfico |
| Raptive (antes AdThrive) | 30-50€       | 100.000 pageviews/mes    | El mejor CPM, muy selectivo       |

**Roadmap de redes publicitarias:**

1. Mes 1-6: AdSense (sin requisito de tráfico)
2. Mes 6-12: Evaluar Ezoic si >10K visitas/mes
3. Mes 12+: Evaluar Mediavine si >50K sesiones/mes
4. En paralelo: Reemplazar slots con anunciantes directos a medida que se captan

---

### J.6 Google Ads (SEM) — Estrategia de campañas

**Cuándo activar:** SOLO cuando haya:

- Catálogo real con >100 vehículos
- Landing pages activas indexadas
- Modelo de monetización funcionando (al menos leads o intermediación)
- Presupuesto disponible sin comprometer operaciones

**Estructura de campañas:**

**Campaña 1 — Búsqueda por categoría (prioridad ALTA):**

```
Grupo: Cisternas
  Keywords: cisterna segunda mano, cisterna usada, cisterna venta,
            comprar cisterna, cisterna alimentaria venta
  Negative: nueva, fabricante, empleo, curso
  Landing: /cisternas (active_landing)
  CPC estimado: 0,50-1,50€
  Presupuesto: 150€/mes

Grupo: Semirremolques
  Keywords: semirremolque segunda mano, semirremolque usado,
            semirremolque frigorífico venta, semirremolque lona
  Negative: nueva, empleo, alquiler vivienda
  Landing: /semirremolques
  CPC estimado: 0,40-1,20€
  Presupuesto: 150€/mes

Grupo: Cabezas tractoras
  Keywords: cabeza tractora segunda mano, tractora usada,
            comprar cabeza tractora, cabeza tractora venta
  Negative: agrícola, tractor agrícola, nueva
  Landing: /cabezas-tractoras
  CPC estimado: 0,60-1,80€
  Presupuesto: 100€/mes
```

**Campaña 2 — Búsqueda por marca (prioridad ALTA):**

```
Grupo: Indox
  Keywords: cisterna indox, indox segunda mano, cisterna indox venta,
            indox alimentaria precio
  Landing: /marcas/indox (landing de marca)
  CPC estimado: 0,30-0,80€ (menos competencia en marcas específicas)
  Presupuesto: 50€/mes

Grupo: Schmitz
  Keywords: schmitz cargobull segunda mano, semirremolque schmitz,
            schmitz frigorífico venta
  Landing: /marcas/schmitz-cargobull
  CPC estimado: 0,40-1,00€
  Presupuesto: 50€/mes

// Crear un grupo por cada marca principal: Lecitrailer, Parcisa, Guillén, etc.
```

**Campaña 3 — Búsqueda por acción + tipo (prioridad MEDIA):**

```
Grupo: Alquiler
  Keywords: alquiler semirremolque, alquiler cisterna,
            alquiler remolque frigorífico, renting semirremolque
  Landing: /alquiler (active_landing filtrada por acción)
  CPC estimado: 0,80-2,50€ (alquiler tiene CPC más alto por recurrencia)
  Presupuesto: 100€/mes

Grupo: Subasta
  Keywords: subasta vehículos industriales, subasta cisternas,
            subasta semirremolques, liquidación flota transporte
  Landing: /subastas (página de subastas activas)
  CPC estimado: 0,30-0,70€ (poca competencia)
  Presupuesto: 50€/mes
```

**Campaña 4 — Remarketing (prioridad MEDIA):**

```
Audiencia: Usuarios que visitaron fichas de vehículos pero no contactaron
Formato: Display (banners en red de Google)
Mensaje: "¿Sigues buscando una cisterna? Tenemos 23 nuevas esta semana"
CPC estimado: 0,10-0,30€
Presupuesto: 100€/mes
Requiere: Pixel de Google Ads instalado + audiencia de mínimo 1.000 usuarios
```

**Campaña 5 — Google Shopping / Merchant Center (prioridad BAJA inicialmente):**

```
Fuente: Feed XML de /api/merchant-feed (Paso 6.13)
Formato: Ficha de producto en pestaña Shopping
CPC estimado: 0,30-1,00€
Presupuesto: 100€/mes
Requiere: Google Merchant Center configurado con feed activo
Nota: Los listados orgánicos en Shopping son GRATUITOS. Solo pagas si quieres
      posición premium. Activar los gratuitos desde el día 1 cuando el feed esté listo.
```

### J.7 Presupuesto por fase

| Fase      | Campañas activas                               | Presupuesto/mes | Objetivo                                |
| --------- | ---------------------------------------------- | --------------- | --------------------------------------- |
| Mes 6-9   | Cat. 1 (categoría) + Cat. 2 (marca)            | 300-500€        | Primeras conversiones, validar keywords |
| Mes 9-12  | + Cat. 3 (acción) + Cat. 5 (Shopping gratuito) | 500-800€        | Escalar lo que convierte                |
| Mes 12-18 | + Cat. 4 (remarketing) + Shopping pago         | 800-1.200€      | Maximizar ROI                           |
| Mes 18+   | Optimizar según datos                          | Variable        | ROAS >3:1 o parar                       |

### J.8 Negative keywords universales (aplicar a TODAS las campañas)

```
empleo, trabajo, oferta empleo, curso, formación, carnet,
nueva, nuevo, fabricante, fábrica, recambio, pieza,
maqueta, juguete, miniatura, dibujo,
alquiler vivienda, alquiler piso, inmobiliaria
```

Revisar semanalmente el informe de "Términos de búsqueda" de Google Ads y añadir negativas nuevas.

### J.9 Métricas y cuándo escalar/parar

**KPIs por campaña:**

| Métrica                       | Objetivo | Acción si no se cumple             |
| ----------------------------- | -------- | ---------------------------------- |
| CPC medio                     | <2€      | Revisar keywords, añadir negativas |
| CTR                           | >3%      | Mejorar textos de anuncio          |
| Tasa de conversión (contacto) | >2%      | Mejorar landing page               |
| Coste por lead                | <30€     | Optimizar o pausar grupo           |
| ROAS (si hay comisión)        | >3:1     | Escalar presupuesto                |

**Regla de parada:** Si una campaña gasta 200€ sin generar ningún lead, pausar y revisar. No quemar dinero esperando que mejore solo.

**Regla de escalado:** Si una campaña tiene CPC <1€ y tasa de conversión >3%, duplicar presupuesto.

### J.10 Implementación técnica del tracking

**Instalar pixel de Google Ads:**

```typescript
// nuxt.config.ts — junto con GA4
app: {
  head: {
    script: [
      {
        src: 'https://www.googletagmanager.com/gtag/js?id=AW-XXXXXXXXXX',
        async: true,
      },
    ]
  }
}

// En plugin o composable:
// gtag('config', 'AW-XXXXXXXXXX')
```

**Configurar conversiones:**

```typescript
// Evento de conversión cuando el usuario contacta al vendedor:
gtag('event', 'conversion', {
  send_to: 'AW-XXXXXXXXXX/YYYYYYYY',
  value: 1.0,
  currency: 'EUR',
})

// Eventos adicionales para optimización:
// - view_vehicle → gtag('event', 'view_item', { ... })
// - apply_filter → gtag('event', 'search', { search_term: filters })
// - download_pdf → gtag('event', 'generate_lead', { ... })
// - request_transport → gtag('event', 'begin_checkout', { ... })
```

**Remarketing: Crear audiencias automáticas:**

```typescript
// Usuarios que vieron fichas de cisternas pero no contactaron:
// → Audiencia "cisternas_viewers" en Google Ads
// → Mostrar anuncios de display: "Nuevas cisternas esta semana"

// Usuarios que llegaron a la página de subasta pero no pujaron:
// → Audiencia "auction_visitors"
// → Mostrar anuncios: "Próxima subasta: 5 cisternas desde 25.000€"
```

### J.11 Resumen: AdSense vs Ads vs Publicidad directa

|                           | AdSense                                  | Google Ads                      | Pub directa (Anexo F)                    |
| ------------------------- | ---------------------------------------- | ------------------------------- | ---------------------------------------- |
| **Qué es**                | Tú cobras por mostrar anuncios de Google | Tú pagas por aparecer en Google | Tú cobras a anunciantes del sector       |
| **Dirección del dinero**  | Google → Tú                              | Tú → Google                     | Anunciante → Tú                          |
| **Cuándo activar**        | Día 1 (cuando haya contenido)            | Mes 6+ (cuando haya catálogo)   | Mes 3+ (cuando haya tráfico demostrable) |
| **Ingreso/coste mensual** | 100-2.000€ ingreso                       | 300-1.200€ coste                | 1.000-5.000€ ingreso                     |
| **Esfuerzo**              | Cero (automático)                        | Medio (optimización semanal)    | Alto (captación comercial)               |
| **Dependencia**           | Alta (Google)                            | Alta (Google)                   | Ninguna                                  |
| **Objetivo**              | Cubrir costes mientras creces            | Generar tráfico y leads         | Ingreso principal a medio plazo          |

---

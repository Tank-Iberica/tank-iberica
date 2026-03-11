> ⚠️ **[LEGACY]** Documento histórico — solo referencia. No modificar ni usar como fuente de verdad. Ver [docs/README.md](../README.md) para navegación activa.

# ADDENDUM — Plan Operativo Tracciona

## Tareas adicionales no incluidas en el plan original (16 Feb 2026)

> **Instrucción:** Estas tareas se integran en el calendario semanal del Plan Operativo original. Se indica en qué semana encajan.

---

## OP1. TAREAS DE INTERNACIONALIZACIÓN (i18n)

### Semana 1-2 (junto con migración técnica)

- [ ] Migrar columnas `_es`/`_en` a JSONB en todas las tablas (Claude Code ejecuta migración SQL)
- [ ] Crear tabla `content_translations` con índices full-text
- [ ] Cambiar i18n strategy a `prefix_except_default` en nuxt.config.ts
- [ ] Implementar helper `localizedField()` en composables
- [ ] Verificar que `/en/vehiculo/[slug]` funciona correctamente
- [ ] Verificar fallback chain: si no hay traducción → inglés → español

### Semana 3 (antes de lanzamiento)

- [ ] Generar archivo `en.json` completo de UI con Claude Max (botones, menús, mensajes)
- [ ] Traducir términos fijos (categorías, subcategorías, atributos) a inglés con Claude Max
- [ ] Verificar hreflang en sitemap dinámico
- [ ] Test: navegador en inglés ve contenido en inglés, español ve sin prefijo

### Semana 8-10 (cuando haya tracción)

- [ ] Decidir siguiente idioma a activar según demanda (Analytics de tráfico por país)
- [ ] Candidatos naturales de expansión: PT (Portugal/Brasil), RO (Rumanía), TR (Turquía), CS (Chequia), SV (Suecia)
- [ ] Generar `XX.json` de UI con Claude Max (~500 strings, 0€)
- [ ] Traducir catálogo existente al nuevo idioma (GPT-4o mini Batch API, ~0,001€/ficha)
- [ ] Insertar regiones del nuevo país en `geo_regions` para habilitar publicidad geolocalizada
- [ ] Generar artículos editoriales localizados para ese mercado

### Semana 16+ (expansión continua)

- [ ] Implementar script de traducción automática para nuevas fichas (Edge Function + GPT-4o mini)
- [ ] Activar idiomas adicionales según demanda de tráfico (Analytics)
- [ ] **NOTA:** La arquitectura soporta N idiomas sin límite. Añadir un idioma = 1 línea en nuxt.config + locales/XX.json + batch traducción. No requiere cambios de código, migraciones SQL, ni redespliegue especial. Los 7 idiomas de lanzamiento (ES, EN, FR, DE, NL, PL, IT) son punto de partida, no techo.

---

## OP2. TAREAS DE CONTENIDO EDITORIAL

### Semana 2 (preparar estructura)

- [ ] Crear tabla `articles` con todos los campos (ver Anexo P actualizado)
- [ ] Crear rutas `/comunicacion/`, `/comunicacion/guias/[slug]`, etc.
- [ ] Implementar páginas placeholder con "Próximamente"
- [ ] Implementar cron de publicación automática (check cada 15 min)

### Semana 3 (primeros artículos pre-lanzamiento)

- [ ] Generar 4-6 artículos de lanzamiento con Claude Max:
  - 2 guías evergreen ("Cómo elegir una cisterna alimentaria", "Guía de semirremolques")
  - 2 comparativas ("Schmitz vs Kögel vs Krone", "Cisternas Indox vs LAG")
  - 1-2 normativa ("Normativa ADR actualizada", "ITV para semirremolques")
- [ ] Programar publicación escalonada: 2/semana a partir de lanzamiento
- [ ] Generar textos de redes sociales para cada artículo con Claude Max

### Semana 4+ (calendario editorial activo)

Cada semana, dedicar 1-2 horas (domingo o lunes):

- [ ] Generar 2 artículos nuevos con Claude Max
- [ ] Revisar SEO Score Potenciador (objetivo: >70/100 antes de publicar)
- [ ] Programar publicación: martes y jueves 09:00 CET
- [ ] Programar posts de redes: según calendario (ver OP3)
- [ ] Traducir artículos al inglés (y otros idiomas activos) con Claude Code

---

## OP3. CALENDARIO SEMANAL DE REDES SOCIALES

**Integrar en las tareas semanales del plan operativo:**

| Día       | Hora CET | Plataforma           | Tipo de contenido                           | Preparación                         |
| --------- | -------- | -------------------- | ------------------------------------------- | ----------------------------------- |
| Lunes     | 10:00    | LinkedIn             | Dato del sector o vehículo destacado        | Sesión dominical                    |
| Martes    | 09:00    | LinkedIn + Instagram | Artículo del blog + foto vehículo           | Auto-publicación web + manual redes |
| Miércoles | 11:00    | LinkedIn + Instagram | Post de opinión / story detrás de cámaras   | Sesión dominical                    |
| Jueves    | 10:00    | LinkedIn + Instagram | Artículo del blog + foto vehículo           | Auto-publicación web + manual redes |
| Viernes   | 12:00    | LinkedIn             | Post ligero ("sabías que...", dato curioso) | Sesión dominical                    |

**Reglas:**

- LinkedIn: máximo 1 post/día (el algoritmo penaliza más)
- Instagram/Facebook: 2-3/semana, no todos los días
- Consistencia > volumen: 3 posts/semana durante 12 meses >> 20 posts una semana y luego nada
- Los textos de redes se generan junto al artículo con Claude Max (campo `social_post_text` en BD)

---

## OP4. FLUJO DOMINICAL (nueva rutina semanal)

**Añadir al plan operativo como tarea recurrente cada domingo (1-2 horas):**

```
DOMINGO — Preparación de contenido semanal

1. Abrir Claude Max
2. "Genera 2 artículos para esta semana sobre [temas elegidos]"
   Claude genera por artículo:
   - Título SEO en español (JSONB con traducción posterior)
   - Meta description
   - Contenido completo (~1.500 palabras para guías, ~500 para noticias)
   - FAQ schema (3-5 preguntas para featured snippets)
   - Excerpt para redes
   - Textos de LinkedIn (español + idiomas activos)
   - Textos de Instagram (español + idiomas activos)

3. Copiar al panel admin de Tracciona:
   - Artículo 1: status='scheduled', scheduled_at=martes 09:00 CET
   - Artículo 2: status='scheduled', scheduled_at=jueves 09:00 CET
   - Posts de redes: copiar textos al buffer/programar en LinkedIn/Instagram

4. Revisar SEO Score de cada artículo (objetivo: 🟢 >70/100)
5. Si hay fichas de vehículos nuevas sin traducir:
   "Traduce todas las fichas pendientes desde la última ejecución"

TIEMPO ESTIMADO: 1-2 horas
COSTE: 0€ (todo con Claude Max)
```

---

## OP5. TAREAS DE PUBLICACIÓN PROGRAMADA

### Semana 2 (setup técnico)

- [ ] Implementar campo `scheduled_at` en tabla `articles`
- [ ] Implementar cron de auto-publish (Edge Function o script, cada 15 min)
- [ ] Implementar campo `social_post_text` JSONB en `articles`
- [ ] Implementar campo `social_scheduled_at` en `articles`
- [ ] Implementar vista de artículos programados en admin (lista con fechas y status)

### Semana 3+ (operativo)

- [ ] Cada domingo: preparar y programar contenido de la semana (ver OP4)
- [ ] Verificar que el cron publica correctamente (log de publicaciones)
- [ ] Revisar Analytics semanalmente: ¿qué artículos traen más tráfico?

---

## OP6. TAREAS DE SEO SCORE POTENCIADOR

### Semana 2 (implementar)

- [ ] Ampliar composable `useSeoScore.ts` con los nuevos checks (ver Anexo U.6):
  - Keyword en título, URL, H2
  - Longitud de contenido (>1.500 guías, >400 noticias)
  - Enlaces internos al catálogo (mínimo 2)
  - FAQ schema presente
  - Imagen de portada con alt text
  - Excerpt para redes sociales
  - Categorías relacionadas
  - Traducido a 2+ idiomas
  - Fecha de publicación programada
  - Textos de redes preparados
- [ ] Mostrar panel lateral en editor de artículos con ✅/❌ por check
- [ ] Score como barra de progreso: 🔴 0-40 | 🟡 41-70 | 🟢 71-100

### Ongoing

- [ ] No publicar artículos con score <50 (regla de calidad)
- [ ] Revisar artículos antiguos trimestralmente y mejorar los que estén en 🟡

---

## OP7. KPIs ADICIONALES

**Añadir a la sección de KPIs del plan operativo:**

| KPI                                         | Semáforo 🟢   | Semáforo 🟡 | Semáforo 🔴 |
| ------------------------------------------- | ------------- | ----------- | ----------- |
| Artículos publicados/mes                    | ≥8            | 4-7         | <4          |
| SEO Score medio artículos                   | >70           | 50-70       | <50         |
| Posts LinkedIn/semana                       | 3-5           | 2           | <2          |
| Idiomas activos (lanzamiento 7, sin límite) | ≥7            | 3-6         | ≤2          |
| Fichas traducidas en idiomas activos (%)    | >90%          | 50-90%      | <50%        |
| Tráfico orgánico desde artículos            | Creciendo MoM | Estable     | Cayendo     |
| CTR medio artículos en Google               | >3%           | 1-3%        | <1%         |

---

_Addendum creado: 18 de febrero de 2026_
_Aplica sobre: Plan Operativo Tracciona (16 Feb 2026)_



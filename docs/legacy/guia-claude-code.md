> **DOCUMENTO HISTORICO.** Este documento es referencia del diseno original. La fuente de verdad actual es [`README-PROYECTO.md`](../../README-PROYECTO.md) y [`INSTRUCCIONES-MAESTRAS.md`](../tracciona-docs/INSTRUCCIONES-MAESTRAS.md).

# Guía: Cómo usar Claude Code con Tracciona

## Setup inicial (hacer una sola vez)

1. Descomprime `tracciona-docs.zip` en tu proyecto:

   ```
   tu-proyecto/docs/tracciona-docs/
   ```

2. Copia `CLAUDE.md` a:

   ```
   tu-proyecto/.claude/CLAUDE.md
   ```

3. Abre Claude Code en la raíz de tu proyecto:
   ```bash
   cd tu-proyecto
   claude
   ```

## Cómo ejecutar la migración

### Sesión 1 — Paso 0: Backup

```
Prompt: "Lee docs/tracciona-docs/migracion/00-backup.md y ejecuta el backup completo del proyecto."
```

### Sesión 2 — Paso 1: Renombrar tablas + i18n

```
Prompt: "Lee docs/tracciona-docs/migracion/01-pasos-0-6-migracion.md, sección PASO 1.
También lee docs/tracciona-docs/anexos/T-internacionalizacion-i18n.md para entender el sistema i18n.
Ejecuta el Paso 1: crear la migración SQL que renombra las tablas Y migra las columnas _es/_en a JSONB."
```

### Sesión 3 — Paso 1 (continuación): Tablas placeholder

```
Prompt: "Lee docs/tracciona-docs/anexos/V-tablas-placeholder-capa2.md.
Añade a la migración SQL del Paso 1 todas las tablas placeholder: dealers, auctions,
auction_bids, auction_registrations, verification_reports, ad_slots, ad_events,
transport_quotes, content_translations, vertical_config, activity_logs.
También lee docs/tracciona-docs/anexos/W-panel-configuracion.md sección W.2 para
la tabla vertical_config."
```

### Sesión 4 — Paso 2: Actualizar frontend

```
Prompt: "Lee docs/tracciona-docs/migracion/01-pasos-0-6-migracion.md, sección PASO 2.
También lee docs/tracciona-docs/anexos/T-internacionalizacion-i18n.md secciones T.5 y T.6.
Actualiza todos los componentes Vue para usar los nuevos nombres de tabla y el helper localizedField()."
```

### Sesión 5 — Paso 3: Landing pages SEO

```
Prompt: "Lee docs/tracciona-docs/migracion/01-pasos-0-6-migracion.md, sección PASO 3.
Implementa el sistema de landing pages dinámicas generadas desde BD."
```

### Sesión 6 — Paso 4: Routing

```
Prompt: "Lee docs/tracciona-docs/migracion/01-pasos-0-6-migracion.md, sección PASO 4.
También lee docs/tracciona-docs/anexos/P-contenido-editorial.md para las rutas de /comunicacion/.
Actualiza el routing para multi-vertical y añade las rutas editoriales."
```

### Sesión 7 — Paso 5: Verificación

```
Prompt: "Lee docs/tracciona-docs/migracion/01-pasos-0-6-migracion.md, sección PASO 5.
Ejecuta todas las verificaciones listadas."
```

### Sesión 8 — Paso 6: Mejoras pre-lanzamiento (parte 1)

```
Prompt: "Lee docs/tracciona-docs/migracion/01-pasos-0-6-migracion.md, sección PASO 6,
ítems 1 al 10. Implementa las primeras 10 mejoras."
```

### Sesión 9 — Paso 6: Mejoras pre-lanzamiento (parte 2)

```
Prompt: "Lee docs/tracciona-docs/migracion/01-pasos-0-6-migracion.md, sección PASO 6,
ítems 11 al 20. También lee docs/tracciona-docs/anexos/R-marco-legal.md para los disclaimers.
Implementa las últimas 10 mejoras."
```

### Sesión 10 — Panel de admin: Config vertical

```
Prompt: "Lee docs/tracciona-docs/anexos/W-panel-configuracion.md completo.
Implementa las secciones W.2 (tabla vertical_config), W.3 (composable useVerticalConfig),
y las páginas de admin: /admin/config/branding, /admin/config/navigation,
/admin/config/homepage, /admin/config/catalog, /admin/config/languages."
```

### Sesión 11 — Panel de admin: Config sistema

```
Prompt: "Lee docs/tracciona-docs/anexos/W-panel-configuracion.md secciones W.6.6 a W.6.10.
Implementa las páginas de admin: /admin/config/pricing, /admin/config/integrations,
/admin/config/emails, /admin/config/editorial, /admin/config/system.
También implementa W.9 (activity_logs)."
```

### Sesión 12 — Portal dealer

```
Prompt: "Lee docs/tracciona-docs/anexos/W-panel-configuracion.md secciones W.4, W.5 y W.7.
Implementa los campos de personalización del dealer, el composable useDealerTheme(),
y la UI del portal del dealer en /admin/dealer/config."
```

### Sesión 13 — Editorial + SEO Score

```
Prompt: "Lee docs/tracciona-docs/anexos/P-contenido-editorial.md y
docs/tracciona-docs/anexos/U-publicacion-programada-calendario.md.
Implementa: tabla articles (ya creada), páginas /comunicacion/, editor de artículos
con SEO Score Potenciador (sección U.6), y cron de auto-publish."
```

## Tips para cada sesión

1. **Empieza siempre con "Lee..."** — Claude Code lee el archivo y entiende el contexto
2. **Un paso por sesión** — No combines pasos, el contexto se llena
3. **Verifica antes de avanzar** — Al final de cada sesión: "¿Todo funciona? Haz un repaso"
4. **Si se pierde contexto** — Nuevo chat, repite "Lee docs/tracciona-docs/README.md"
5. **Para dudas de negocio** — "Lee docs/tracciona-docs/contexto-global.md"
6. **Para ver por qué se tomó una decisión** — "Lee docs/tracciona-docs/CHANGELOG.md"

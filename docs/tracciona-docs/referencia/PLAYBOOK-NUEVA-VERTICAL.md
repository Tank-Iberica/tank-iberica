# Playbook: Crear una nueva vertical en ~1 hora

**Objetivo:** Lanzar un nuevo marketplace vertical (ej. Horecaria, Construcción, Náutica) desde 0 hasta producción en aproximadamente 1 hora, sin tocar código.

**Prerrequisito:** Acceso a Cloudflare Pages dashboard, Supabase MCP o CLI, y `.env` del proyecto.

---

## Fase 1 — Decisión y nomenclatura (5 min)

Definir antes de empezar:

| Campo | Ejemplo |
|---|---|
| **Slug** | `horecaria` (lowercase, sin espacios) |
| **Nombre** | `Horecaria` |
| **Dominio** | `horecaria.com` |
| **Idiomas** | `es, en` (añadir `fr` si procede) |
| **Acciones** | `venta, alquiler` (o `+ terceros`) |
| **Color primario** | `#C84B31` (hex) |
| **Descripción SEO ES** | "Compra, venta y alquiler de equipamiento hostelero..." |
| **Descripción SEO EN** | "Buy, sell and rent hospitality equipment..." |

---

## Fase 2 — Scaffold SQL (10 min)

### 2.1 Generar migración con el script

```bash
node scripts/create-vertical.mjs --name horecaria --domain horecaria.com
```

Esto genera en `supabase/migrations/`:
- `YYYYMMDDHHMMSS_vertical_horecaria.sql` con:
  - `vertical_config` INSERT
  - 3 categorías base
  - 3 subcategorías base + junction
  - 5 atributos comunes (estado, año, marca, modelo, ubicación)

### 2.2 Editar el SQL generado

Abre el archivo generado y personaliza:

1. **Categorías** — reemplaza General/Equipamiento/Servicios por las de tu dominio (ej. Cocción/Refrigeración/Lavado)
2. **Subcategorías** — añade los tipos específicos (ej. Horno convección, Cámara frigorífica, ...)
3. **Atributos** — añade los campos específicos del dominio (ej. `potencia_kw`, `voltaje`, `material`)
4. **Tema** — actualiza `theme.primary` con el color de marca
5. **`meta_description`** — escribe la descripción SEO definitiva en ES y EN

**Referencia de tipos de atributo disponibles:**
- `caja` — texto libre
- `slider` — rango numérico
- `desplegable` — selector con opciones fijas
- `desplegable_tick` — multi-select con checks

### 2.3 Aplicar migración

```bash
# Opción A — CLI de Supabase
supabase db push

# Opción B — MCP (desde Claude Code)
# Usa mcp__supabase__apply_migration con el contenido del SQL
```

---

## Fase 3 — Configuración en admin (15 min)

Ir a `https://[dominio-actual]/admin/config`:

### 3.1 Branding (`/admin/config/branding`)
- [ ] Subir logo (PNG transparente, 200×60px mínimo)
- [ ] Subir logo dark (para fondo oscuro)
- [ ] Subir favicon (ICO o PNG 32×32)
- [ ] Subir OG image (1200×630px, para redes sociales)
- [ ] Aplicar paleta de colores (primary, secondary, accent)

### 3.2 Homepage (`/admin/config/homepage`)
- [ ] Configurar hero: título, subtítulo, CTA, imagen de fondo
- [ ] Activar/desactivar secciones (featured, categories, auctions, articles, stats)

### 3.3 Navegación (`/admin/config/navigation`)
- [ ] Añadir enlaces de header (catálogo, precios, contacto)
- [ ] Configurar footer (texto, enlaces, redes sociales)

### 3.4 Categorías y subcategorías (`/admin/config/subcategorias`)
- [ ] Revisar categorías generadas y ajustar nombres/slugs
- [ ] Añadir subcategorías adicionales si faltan
- [ ] Vincular subcategorías a categorías correctas

### 3.5 Características (`/admin/config/caracteristicas`)
- [ ] Revisar atributos generados
- [ ] Añadir atributos específicos del dominio
- [ ] Configurar order y visibilidad (is_extra, is_hidden)

---

## Fase 4 — Infraestructura (15 min)

### 4.1 DNS

En el panel de gestión del dominio (ej. Namecheap, Cloudflare):

```
CNAME  @          pages.dev                    (o IP de Cloudflare Pages)
CNAME  www        [slug].pages.dev
```

O si usas Cloudflare DNS directamente:
```
CNAME  horecaria.com  [slug].pages.dev  (Proxied)
```

### 4.2 Cloudflare Pages

1. Ir a **Cloudflare Dashboard → Pages**
2. Seleccionar el proyecto (o clonar desde Tracciona si es un nuevo deploy separado)
3. En **Custom domains** → Add `horecaria.com` y `www.horecaria.com`
4. Esperar provisión de SSL (automático, ~5 min)

### 4.3 Variables de entorno en Cloudflare Pages

Ir a **Pages → Settings → Environment variables** y añadir:

```env
NUXT_PUBLIC_VERTICAL=horecaria
NUXT_PUBLIC_SITE_URL=https://horecaria.com
NUXT_PUBLIC_SITE_NAME=Horecaria
```

Si la vertical usa su propia BD (cluster dedicado):
```env
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
```

---

## Fase 5 — Contenido inicial (10 min)

### 5.1 Publicar primeros listings (mínimo 5 para que el catálogo no aparezca vacío)

- Ir a admin → Productos → Nuevo
- Publicar al menos 5 items con imágenes, precio y descripción
- Verificar que aparecen filtrados por la vertical correcta

### 5.2 Verificar email templates

Ir a `/admin/config/emails` y revisar:
- [ ] Email de bienvenida: tiene el nombre/logo de la vertical
- [ ] Email de contacto: tiene la marca correcta
- [ ] Email de factura: tiene datos correctos

---

## Fase 6 — Verificación y QA (5 min)

### Checklist mínimo pre-launch

```bash
# Health check
curl https://horecaria.com/api/health

# Verificar que el catálogo filtra por vertical
curl "https://horecaria.com/api/vehicles?vertical=horecaria" | jq '.count'
```

- [ ] Homepage carga con branding correcto (logo, colores, nombre)
- [ ] Catálogo muestra solo productos de la vertical
- [ ] Registro de dealer funciona end-to-end
- [ ] Formulario de contacto envía email
- [ ] Lighthouse mobile score ≥ 90 (ejecutar desde Chrome DevTools)

### Test de aislamiento vertical

Verificar que un dealer de Tracciona NO puede ver listings de Horecaria y viceversa:
- Login como dealer de Tracciona
- Confirmar que el catálogo solo muestra vehículos industriales

---

## Fase 7 — Post-lanzamiento inmediato (5 min)

- [ ] Google Search Console: verificar propiedad y enviar sitemap `https://horecaria.com/sitemap.xml`
- [ ] Google Analytics: añadir `NUXT_PUBLIC_GA_ID` en env vars de CF Pages
- [ ] Monitorear error rate durante 1h (target < 0.5%)
- [ ] Anunciar lanzamiento (redes sociales, email a beta testers)

---

## Notas para el desarrollador

### Vertical slug en código
El slug se lee de la variable de entorno `NUXT_PUBLIC_VERTICAL` (o del hostname en producción). Nunca hardcodeado en código — se obtiene siempre con:

```typescript
const { vertical } = useVerticalConfig()
// o en server: getVerticalSlug()
```

### RLS (Row Level Security)
El aislamiento de datos entre verticales está garantizado a nivel de BD. Los dealers y sus datos solo son visibles para su vertical. No se necesitan cambios de código al crear una nueva vertical — el RLS ya filtra por `vertical`.

### Atributos dinámicos
Los filtros del catálogo se generan dinámicamente desde la tabla `attributes` filtrada por `vertical`. Añadir un atributo en BD → aparece automáticamente en el formulario de publicación y en los filtros del catálogo.

### Tiempo real estimado por fase

| Fase | Tiempo |
|---|---|
| Decisión y nomenclatura | 5 min |
| Scaffold SQL + edición | 15 min |
| Configuración en admin | 15 min |
| Infraestructura DNS + CF | 10 min |
| Contenido inicial | 10 min |
| Verificación y QA | 5 min |
| **TOTAL** | **~60 min** |

El tiempo puede variar si las categorías/atributos requieren más trabajo de definición, o si el DNS tarda en propagar.

---

*Última actualización: sesión XX — Plan Maestro §5.6*

# Tracciona.com — Marketplace de Vehículos Industriales

## PROTOCOLO OBLIGATORIO — Ejecutar en orden. Sin excepciones.

### Paso 1 — Analiza la orden (sin herramientas)

Antes de escribir nada:

- ¿Es una tarea o varias? Si son varias, sepáralas y pregunta el orden.
- ¿Falta información crítica? (archivo, error exacto, resultado esperado) → pregunta.
- ¿Afecta a otros módulos? → avisa antes de continuar.

### Paso 2 — Confirma la tarea

Escribe **una sola línea** resumiendo lo que vas a hacer, seguida de "¿Es correcto?".

**PARA. Espera confirmación. No uses herramientas, no leas archivos, no corras comandos.**

### Paso 3 — Recomienda modelo

| Tipo       | Modelo     | Ejemplos                                                         |
| ---------- | ---------- | ---------------------------------------------------------------- |
| Simple     | **Haiku**  | Correcciones, renombrar, actualizar STATUS.md, consultas rápidas |
| Intermedio | **Sonnet** | Crear componentes, bugs, refactoring, implementar features       |
| Complejo   | **Opus**   | Auditorías, arquitectura, migraciones grandes, análisis profundo |

Escribe **exactamente**:

> Para esta tarea recomiendo **[modelo]** porque [razón]. ¿Cambio con /model o mantengo el actual?

**PARA. Espera confirmación. Solo ejecuta tras confirmar tarea (paso 2) Y modelo (paso 3).**

### Paso 4 — Ejecuta

---

### Durante la tarea — Cambio de modelo en subtareas

Si la tarea tiene subtareas de distinta complejidad, cambia de modelo entre ellas:

- Subtareas simples (ediciones, scripts, ficheros) → **Haiku**
- Subtareas intermedias/complejas → **Sonnet**

Cuando cambie el tipo de trabajo: PARA y di "Esta parte requiere **[modelo]**. ¿Cambio?"

---

## Proyecto

- **Email admin:** tankiberica@gmail.com
- **Supabase Project ID:** gmnrfuzekbwyzkgsaftv
- **Stack:** Nuxt 3 + Supabase + Cloudflare Pages
- **Proyecto anterior:** Tank Ibérica (monolítico) → Tracciona (marketplace)

## Documentación

Toda la documentación activa está en `docs/tracciona-docs/`.

1. Para entender el proyecto → `docs/tracciona-docs/contexto-global.md`
2. Para ejecutar sesiones → `docs/tracciona-docs/INSTRUCCIONES-MAESTRAS.md` (sesiones 0–64 completadas)
3. Los anexos en `docs/tracciona-docs/anexos/` son **referencia**, no tareas independientes.

**Regla:** Ejecutar solo lo que dicen las INSTRUCCIONES-MAESTRAS. Si no sabes cómo implementar algo, pregunta. No improvises.

Convenciones y estructura del código → `CONTRIBUTING.md`

## Herramientas disponibles

- Acceso completo al sistema de archivos y terminal (npm, supabase CLI, git)
- Puedes leer y modificar `.env` / `.env.local`
- Puedes ejecutar `supabase db push`, `supabase gen types`, `npm install`, `npm run build`
- **Sin acceso** a dashboards (Supabase, Stripe, Cloudflare) → pide al usuario que ejecute las acciones manuales

## Reglas no negociables

1. **Mobile-first:** CSS base = 360px. Breakpoints con `min-width`. Touch targets ≥ 44px.
2. **Páginas reales:** Vehículos y artículos tienen URL propia. No usar modales.
3. **Extensible:** Categorías, filtros e idiomas se leen de la BD. Añadir uno = insertar fila, no tocar código.
4. **Multilenguaje:** `$t()` + `localizedField()` en todo el código visible al usuario.
5. **Secuencial:** No usar subagentes paralelos. Una tarea a la vez.

## Design system

- Color primario: `#23424A` (petrol blue, configurable desde `vertical_config`)
- Tipografía: Inter (Google Fonts)
- Breakpoints: `480px`, `768px`, `1024px`, `1280px`
- Spacing: escala de 4px (4, 8, 12, 16, 24, 32, 48, 64)

## Decisiones tomadas — No reimplementar sin validación

- **Idiomas activos:** ES + EN. El resto pospuesto.
- **Imágenes:** Cloudinary transforma, CF Images almacena. Cache immutable 30d.
- **Merchandising:** Solo formulario de interés. Sin flujo de compra completo.
- **API valoración:** Pospuesta hasta ≥500 transacciones históricas.
- **Scraping:** Solo script manual. Nunca cron en producción.
- **Documentación legacy:** `docs/legacy/` — no modificar.

## Gestión de sesión

### Antes de lanzar Node

```bash
taskkill /F /IM node.exe 2>nul
```

Ejecutar antes de `npm run dev`, `npm run build` o cualquier comando que lance Node.

### Tokens bajos

Cuando estimes que quedan pocos tokens:

1. Avisa: "⚠️ Tokens bajos — guardando estado"
2. Actualiza `STATUS.md` con lo hecho y lo pendiente
3. Indica el prompt exacto para continuar en la siguiente sesión

### Al terminar cualquier tarea

1. Pregunta: "¿Hay algo más relacionado con esta tarea antes de cerrar sesión?"
2. Si no hay nada más, actualiza `STATUS.md` y avisa que la sesión está lista para cerrar.
3. No continúes hasta recibir respuesta.

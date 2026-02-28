# Tracciona.com — Marketplace de Vehículos Industriales

## ANTES DE HACER NADA — Protocolo obligatorio (SIEMPRE, SIN EXCEPCIONES)

**STOP. Antes de ejecutar cualquier tarea, sigue estos 4 pasos en orden. NO hay excepciones.**

**REGLA ABSOLUTA:** Los pasos 1-3 son SOLO texto. Está PROHIBIDO llamar a cualquier herramienta (Read, Glob, Grep, Bash, Task, etc.) hasta que el usuario haya confirmado TANTO la tarea (paso 2) COMO el modelo (paso 3). El único mensaje que puedes enviar antes de ambas confirmaciones es texto plano al usuario. Si violas esto, estás violando el protocolo.

### Paso 1 — Analiza la orden

Antes de escribir nada, evalúa mentalmente:

- ¿Es una tarea o varias? Si son varias, sepáralas y pregunta el orden.
- ¿Falta información clave? (archivo concreto, error exacto, resultado esperado). Si falta, pregunta.
- ¿La orden describe un proceso o un resultado? Si describe un proceso, pregunta qué resultado final se espera.
- ¿Puede afectar a otros módulos? Si es así, avisa antes de continuar.
- ¿Hay forma de hacer esto consumiendo menos tokens? (menos archivos que leer, tarea más acotada). Si la hay, proponla.

### Paso 2 — Resume y confirma la tarea

Tu primer mensaje es UN RESUMEN DE UNA LÍNEA de lo que vas a hacer, seguido de "¿Es correcto?".

**ESPERA confirmación del usuario. NO ejecutes nada todavía.**

### Paso 3 — Recomienda modelo y espera confirmación

Con la tarea ya clara, recomienda el modelo adecuado:

| Tipo de tarea | Modelo     | Ejemplos                                                                          |
| ------------- | ---------- | --------------------------------------------------------------------------------- |
| Simple        | **Haiku**  | Correcciones, listar archivos, actualizar STATUS.md, renombrar, consultas rapidas |
| Intermedia    | **Sonnet** | Crear componentes, resolver bugs, refactoring, implementar features               |
| Compleja      | **Opus**   | Auditorias, arquitectura, migraciones grandes, analisis profundo                  |

Tu mensaje es EXACTAMENTE: "Para esta tarea recomiendo **[modelo]** porque [razón]. ¿Cambio con /model o mantengo el actual?"

**ESPERA confirmación del usuario. NO ejecutes herramientas, NO leas archivos, NO corras comandos.**

El mensaje debe contener SOLO la recomendación de modelo y NADA MÁS. Cualquier acción antes de recibir confirmación es una violación del protocolo.

### Paso 4 — Ejecuta

Solo tras confirmar tarea (paso 2) Y modelo (paso 3), empieza a trabajar.

---

**Durante la tarea — Cambio de modelo en subtareas:**

- Si la tarea tiene **múltiples subtareas con distintos niveles de complejidad**, evalúa cada una:
  - Subtareas **simples** (ediciones, bash scripts, actualizaciones de ficheros) → **Cambia a Haiku**
  - Subtareas **intermedias/complejas** → **Cambia a Sonnet** si estabas en Haiku
  - Ejemplo: "Hallazgos menores #16-22" = 6 subtareas, 4 de ellas Haiku, 2 Sonnet → Cambiar entre ellas
- Si el tipo de trabajo cambia, PARA y di: "Esta parte requiere **[otro modelo]**. ¿Cambio?"
- Si ya estás en el modelo correcto, confirma: "Estamos en [modelo], correcto para esta tarea."

**Razón:** El usuario paga por tokens. Opus en una tarea simple = desperdicio. Haiku en una tarea compleja = resultado pobre. Una orden mal entendida = trabajo tirado. **Cambiar de modelo entre subtareas maximiza eficiencia sin sacrificar calidad.**

---

## Información del proyecto

- **Email admin:** tankiberica@gmail.com
- **Supabase Project ID:** gmnrfuzekbwyzkgsaftv
- **Stack:** Nuxt 3 + Supabase + Cloudflare Pages
- **Proyecto anterior:** Tank Ibérica (monolítico) → migración y evolución en curso a Tracciona (marketplace)

## Documentación

Toda la documentación activa está en `docs/tracciona-docs/`.

**Si necesitas entender el proyecto:**

1. Lee `docs/PROYECTO-CONTEXTO.md` — **Documento maestro.** Visión TradeBase, modelo de negocio, arquitectura, decisiones tomadas y criterios para tomar decisiones de código. Leer SIEMPRE antes de cualquier tarea.
2. Lee `docs/tracciona-docs/README.md` — Estructura de la documentación y reglas de ejecución

**Si necesitas ejecutar el proyecto:**

- Lee `docs/tracciona-docs/INSTRUCCIONES-MAESTRAS.md` — Define las sesiones de trabajo. Sesiones 0-64 completadas. El usuario puede pedir "ejecuta la sesión N" para re-ejecutar o verificar cualquier sesión.
- Consulta los anexos en `docs/tracciona-docs/anexos/` cuando una sesión los referencia.

**Regla principal:** Ejecutar solo lo que dicen las INSTRUCCIONES-MAESTRAS. Los anexos son REFERENCIA, no tareas independientes.

**Reglas críticas:**

- LEE los archivos de la sesión ANTES de escribir código. Relee las reglas del inicio de INSTRUCCIONES-MAESTRAS.
- Si no sabes cómo implementar algo, PREGUNTA al usuario. No improvises.
- Si necesitas dashboards web (Supabase, Stripe, Cloudflare) → pregunta al usuario.

**Acceso a herramientas:**

- Tienes acceso completo al sistema de archivos y terminal (npm, supabase CLI, git).
- Puedes leer y modificar .env / .env.local para configurar variables de entorno.
- Puedes ejecutar `supabase db push`, `supabase gen types`, `npm install`, `npm run build` directamente.
- NO tienes acceso a navegador web ni dashboards. Si necesitas crear algo en Stripe/Supabase/Cloudflare dashboard, pide al usuario que lo haga.

**Documentación legacy:** Todo en `docs/legacy/` (30+ archivos del sistema anterior, no modificar).

## Convenciones y estructura

Ver `CONTRIBUTING.md` para: stack, estructura del proyecto, convenciones de código, comandos, tests y git workflow.

## Cinco reglas no negociables

1. **Mobile-first:** CSS base = 360px. Breakpoints con `min-width`. Touch targets ≥ 44px.
2. **Páginas reales:** Vehículos y artículos son páginas con URL propia, NO modales.
3. **Extensible:** Categorías, subcategorías, filtros e idiomas se leen de la BD. Añadir uno = insertar fila, no tocar código.
4. **Multilenguaje:** `$t()` + `localizedField()` en todo el código visible al usuario. Sin excepciones.
5. **Secuencial:** No usar subagentes paralelos (Task). Una llamada Task a la vez, esperar resultado, luego la siguiente.

## Design system

- Color primario: #23424A (petrol blue) — cambiará a los colores de Tracciona vía vertical_config
- Tipografía: Inter (Google Fonts) — configurable desde admin
- Breakpoints: 480px, 768px, 1024px, 1280px (mobile-first)
- Spacing: escala de 4px (4, 8, 12, 16, 24, 32, 48, 64)

## Decisiones estratégicas (25 Feb 2026)

- Idiomas activos: ES + EN. Resto pospuesto (ver FLUJOS-OPERATIVOS §7)
- Pipeline imágenes: Cloudinary transforma, CF Images almacena. Cache immutable 30d
- Merchandising: solo formulario de interés, no flujo completo
- API valoración de pago: pospuesta hasta volumen suficiente
- Scraping: solo script manual, NUNCA cron en producción
- 2º cluster BD: considerar Neon/Railway para diversificar
- Métricas infra: tag vertical en infra_metrics desde día 1

## Gestión de sesión

### Antes de lanzar Node

```bash
taskkill /F /IM node.exe 2>nul
```

Ejecutar antes de `npm run dev`, `npm run build` o cualquier comando que lance Node. **Automatización:** el hook PostToolUse detecta CLOSING_SESSION en STATUS.md y mata solo el proceso del puerto 3000. Configurado en `.claude/settings.json` + `.claude/cleanup-node.bat`.

### Mantenimiento de STATUS.md (máximo ~120 líneas)

- **Errores resueltos:** ELIMINAR inmediatamente (nunca tachar con `~~`). Git preserva el historial.
- **Sesión nueva:** Añadir 1 línea al changelog. No escribir párrafos completos.
- **Changelog:** Si supera 10 entradas, comprimir las más antiguas.
- **Duplicados:** NO repetir tablas que ya están en `PROYECTO-CONTEXTO.md`.
- **Fuente de verdad:** STATUS.md = estado actual. Git (`git log STATUS.md`) = historial.

### Tokens bajos

1. Avisa: "⚠️ Tokens bajos — guardando estado"
2. Actualiza `STATUS.md` con lo hecho y lo pendiente
3. Indica el prompt exacto para continuar en la siguiente sesión

### Al terminar cualquier tarea

1. Pregunta: "¿Hay algo más relacionado con esta tarea o módulo antes de cerrar sesión?"
2. Si la respuesta es no, actualiza STATUS.md con lo realizado y avisa:
   "✅ Sesión lista para cerrar. Cuando abras la siguiente, empieza con:
   Lee CLAUDE.md y STATUS.md antes de hacer nada."
3. No continúes con nada más hasta recibir respuesta.

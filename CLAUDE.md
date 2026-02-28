# Tracciona.com — Marketplace de Vehículos Industriales

## Inicio de sesión — Requisito obligatorio

**AL ABRIR SESIÓN, ANTES DE CUALQUIER OTRA COSA:**

1. **Detecta tu modelo** del system context. Si estás en Opus → salta al paso 2. Si estás en otro modelo → tu ÚNICO mensaje es: "Estoy en [modelo]. Para cargar contexto necesito Opus. ¿Cambias con `/model opus`?" Luego espera respuesta del usuario.

2. **Una vez en Opus**, automáticamente lee:
   - **CLAUDE.md** — protocolo, reglas, decisiones arquitectónicas
   - **STATUS.md** — estado actual, cambios recientes, pendientes
   - **PROYECTO-CONTEXTO.md** — visión, modelo de negocio, arquitectura estratégica

3. Solo después de leer los 3 archivos, estás listo para recibir órdenes del usuario.

---

## ANTES DE HACER NADA — Protocolo obligatorio (SIEMPRE, SIN EXCEPCIONES)

**STOP. Antes de ejecutar cualquier tarea, sigue estos 4 pasos en orden. NO hay excepciones.**

**REGLA ABSOLUTA:** Los pasos 1-3 son SOLO texto. Está PROHIBIDO llamar a cualquier herramienta (Read, Glob, Grep, Bash, Task, etc.) hasta que el usuario haya confirmado TANTO la tarea (paso 2) COMO el modelo (paso 3). El único mensaje que puedes enviar antes de ambas confirmaciones es texto plano al usuario. Si violas esto, estás violando el protocolo.

### Opus al inicio y nuevas órdenes — Auto-detección

**Cómo funciona la detección automática:**

Puedes leer tu modelo actual del system context (`claude-haiku-4-5-20251001`, `claude-sonnet-4-6`, `claude-opus-4-6`).

- **Al inicio de sesión:** Detecta tu modelo. Si NO estás en Opus → pide cambio. Si estás en Opus → automáticamente lee CLAUDE.md, STATUS.md, PROYECTO-CONTEXTO.md.
- **Al recibir orden nueva** (excepto "continuar tarea"): Detecta tu modelo. Si NO estás en Opus → tu ÚNICO mensaje es pedir cambio. Si estás en Opus → continúa con Pasos 1–2 (analizar y resumir).
- **Después de resumir (Paso 2):** El flujo normal continúa. Recomienda modelo para la ejecución (Haiku/Sonnet/Opus según complejidad de la tarea).
- **"Continuar tarea":** No es nueva orden, es reanudación. Detecta tu modelo y continúa donde estabas sin cambios innecesarios.

### Excepción — Lectura de contexto al inicio de sesión

**Lectura de contexto de inicio (CLAUDE.md, STATUS.md, PROYECTO-CONTEXTO.md) NO es una tarea — no requiere protocolo.** Ejecuta Read tools directamente para cargar contexto. Cualquier otra orden SÍ requiere protocolo.

### Paso 0 — Verifica el modelo (Auto-detección)

**Detecta tu modelo actual** leyendo el system context:

- `claude-haiku-4-5-20251001` = Haiku
- `claude-sonnet-4-6` = Sonnet
- `claude-opus-4-6` = Opus

**Si NO estás en Opus**, tu ÚNICO mensaje debe ser:

> "Estoy en [Haiku/Sonnet]. Necesito Opus para analizar esta orden. ¿Cambias con `/model opus`?"

No analices, no resumas, no hagas nada más — solo pide el cambio. Una vez en Opus, continúa con Paso 1.

**Si ya estás en Opus**, salta directamente al Paso 1.

### Paso 1 — Analiza la orden

Evalúa estos 5 puntos (output verificable):

1. ¿Es una tarea o varias? (Si varias, listar numeradas y preguntar orden)
2. ¿Falta información clave? (Si falta, preguntar explícitamente)
3. ¿Proceso o resultado? (Si proceso ambiguo, preguntar qué resultado final se espera)
4. ¿Afecta otros módulos? (Si sí, avisar)
5. ¿Optimización de tokens posible? (Si hay, proponerla)

**NO publiques este análisis.** Úsalo para tu Paso 2.

### Paso 2 — Resume y confirma la tarea

Tu mensaje es UN RESUMEN DE UNA LÍNEA de lo que vas a hacer, **incluyendo brevemente tus conclusiones del Paso 1** (ej: "Es 1 tarea, info completa, sin afectar otros módulos, no hay optimización de tokens"). Termina con "¿Es correcto?".

**ESPERA confirmación del usuario. NO ejecutes nada todavía.**

---

**Si el usuario da múltiples tareas en un mensaje:** Listarlas numeradas, preguntar orden de ejecución, y luego aplicar este protocolo a CADA tarea individualmente.

**Si el usuario interrumpe a medio camino (nueva orden diferente):** Abandona la tarea anterior, reinicia el protocolo desde Paso 0 para la nueva orden.

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

### Skills — Clasificación por protocolo

- **Sin protocolo (ejecuta directamente):** `/commit`, `/status`, `/review` — tareas simples de diagnóstico.
- **Con protocolo (Pasos 0–4):** `/build`, `/session`, `/db`, `/verify`, `/debug` — tareas complejas que alteran estado.
- **Clarificación:** Si no sabes qué skill invocar, pregunta al usuario en lugar de asumir.

---

**Durante la tarea — Cambio de modelo en subtareas:**

**Umbral:** Solo proponer cambio si la diferencia es SIGNIFICATIVA:

- **Diferencia 2 niveles** (Haiku ↔ Opus) → Propón cambio.
- **Diferencia 1 nivel** (Haiku ↔ Sonnet) → Solo si la subtarea es **sustancialmente diferente** (análisis profundo, arquitectura, debugging complejo).
- **Misma familia de complejidad** → NO proponer cambio (ej: editar componente Vue vs editar otro componente = ambos Sonnet, no cambiar a Haiku).

**Procedimiento:**

- Si la tarea tiene **múltiples subtareas con distintos niveles de complejidad**, evalúa cada una:
  - Subtareas **simples** (ediciones, bash scripts, actualizaciones de ficheros) → **Cambia a Haiku** (si estabas en Opus/Sonnet)
  - Subtareas **intermedias/complejas** → **Cambia a Sonnet** (si estabas en Haiku y el cambio es sustancial)
  - Ejemplo: "Hallazgos menores #16-22" = 6 subtareas simples → cambiar a Haiku una sola vez al inicio.
- Si el tipo de trabajo cambia significativamente, PARA y di: "Esta parte requiere **[otro modelo]**. ¿Cambio?"
- Si ya estás en el modelo correcto, confirma: "Estamos en [modelo], correcto para esta tarea."

**Razón:** El usuario paga por tokens. Opus en una tarea simple = desperdicio. Haiku en una tarea compleja = resultado pobre. Una orden mal entendida = trabajo tirado. **Cambiar de modelo entre subtareas maximiza eficiencia, pero propuestas excesivas = ruido.**

---

### Auto-verificación — Antes de cada respuesta

Antes de enviar cualquier respuesta, verifica mentalmente:

1. ¿Seguí el protocolo (Pasos 0–4)?
2. ¿Confirmé tarea (Paso 2) y modelo (Paso 3) antes de ejecutar?
3. ¿Estoy en el modelo correcto para esta tarea?
4. ¿Hay múltiples tareas? ¿Pregunté orden de ejecución?
5. ¿Hice commit sin que lo pidiera el usuario? (Si sí → REVERTIR)

Si alguna respuesta es "no" o "sí pero violé X", PARA y corrige antes de responder.

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
- **NUNCA hacer commit sin que el usuario lo pida explícitamente.** Ni siquiera commits "pequeños" o "lógicos".

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

## UX — Formularios y touch

- Errores claros: mensaje descriptivo + cómo corregir (no solo borde rojo)
- `autocomplete` en todos los inputs de formulario
- Validación amable: no castigar, guiar al usuario
- Interacciones: nunca depender solo de `:hover` — siempre alternativa touch/focus

## Decisiones estratégicas (25 Feb 2026)

- Idiomas activos: ES + EN. Resto pospuesto (ver FLUJOS-OPERATIVOS §7)
- Pipeline imágenes: Cloudinary transforma, CF Images almacena. Cache immutable 30d
- Merchandising: solo formulario de interés, no flujo completo
- API valoración de pago: pospuesta hasta volumen suficiente
- Scraping: solo script manual, NUNCA cron en producción
- 2º cluster BD: considerar Neon/Railway para diversificar
- Métricas infra: tag vertical en infra_metrics desde día 1

### Actualización de PROYECTO-CONTEXTO.md — En tiempo real

**Si durante una sesión se toma una decisión estratégica, cambio de rumbo, o nueva dirección del proyecto:**

1. PARA y pregunta: "Esta decisión afecta PROYECTO-CONTEXTO.md. ¿Actualizo el documento?"
2. Solo tras confirmación del usuario, actualiza la sección correspondiente en `docs/PROYECTO-CONTEXTO.md`
3. Actualiza también la sección "Decisiones estratégicas" de este CLAUDE.md si aplica

## Gestión de sesión

### Antes de lanzar Node (automático)

**SIEMPRE** encadena la limpieza antes de cualquier comando que lance Node:

```bash
taskkill /F /IM node.exe 2>nul; npm run dev
taskkill /F /IM node.exe 2>nul; npm run build
```

Esto es una convención obligatoria. NUNCA ejecutes `npm run dev`, `npm run build`, o cualquier comando que lance Node sin el `taskkill` previo en el mismo comando.

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
2. Si la respuesta es no → sigue el procedimiento de **"Al cerrar sesión"** abajo.
3. No continúes con nada más hasta recibir respuesta.

### Al cerrar sesión (automático)

Cuando el usuario confirma que no hay más tareas o pide cerrar sesión, ejecutar EN ESTE ORDEN:

1. **Limpieza Node:** Ejecutar `taskkill /F /IM node.exe 2>nul` para matar todos los procesos Node
2. **Actualizar STATUS.md:**
   - Añadir lo realizado en la sesión
   - **Si hay tarea incompleta:** Documentar claramente qué queda pendiente y el prompt exacto para retomar en la siguiente sesión (ej: "Continúa con [descripción de lo que falta]. El último paso completado fue [X].")
   - Escribir `CLOSING_SESSION` al final del archivo (dispara el hook automático vía `.claude/cleanup-node.bat`)
3. **Mensaje de cierre:** "✅ Sesión lista para cerrar. Cuando abras la siguiente, empieza con: Lee CLAUDE.md y STATUS.md antes de hacer nada."
4. **STOP:** No continúes con nada más.

**Hooks configurados:** `.claude/settings.json` → PostToolUse detecta `CLOSING_SESSION` en STATUS.md → ejecuta `.claude/check-closing-and-cleanup.sh` → `.claude/cleanup-node.bat` (mata puerto 3000).

# Tracciona.com — Marketplace de Vehículos Industriales

## ANTES DE HACER NADA — Selección de modelo (OBLIGATORIO)

**STOP. Tu PRIMER mensaje en CADA tarea DEBE ser la recomendación de modelo. NO ejecutes ni una sola acción antes.**

| Tipo de tarea | Modelo     | Ejemplos                                                                          |
| ------------- | ---------- | --------------------------------------------------------------------------------- |
| Simple        | **Haiku**  | Correcciones, listar archivos, actualizar STATUS.md, renombrar, consultas rapidas |
| Intermedia    | **Sonnet** | Crear componentes, resolver bugs, refactoring, implementar features               |
| Compleja      | **Opus**   | Auditorias, arquitectura, migraciones grandes, analisis profundo                  |

**Protocolo:**

1. Tu primer mensaje SIEMPRE es: "Para esta tarea recomiendo **[modelo]** porque [razon]. ¿Cambio con /model o mantengo el actual?"
2. ESPERA confirmacion del usuario. NO empieces a trabajar.
3. Si durante la tarea el tipo de trabajo cambia, PARA y di: "Esta parte requiere **[otro modelo]**. ¿Cambio?"
4. Si el usuario te pide algo y ya estas en el modelo correcto, confirma: "Estamos en [modelo], correcto para esta tarea."

**Razon:** El usuario paga por tokens. Opus en una tarea simple = desperdicio. Haiku en una tarea compleja = resultado pobre.

---

## Información del proyecto

- **Email admin:** tankiberica@gmail.com
- **Supabase Project ID:** gmnrfuzekbwyzkgsaftv
- **Proyecto anterior:** Tank Ibérica (monolítico) → migración y evolución en curso a Tracciona (marketplace)

## Documentación

Toda la documentación activa está en `docs/tracciona-docs/`.

**Si necesitas entender el proyecto:**

1. Lee `docs/tracciona-docs/contexto-global.md` — Visión completa del ecosistema
2. Lee `docs/tracciona-docs/README.md` — Estructura y reglas de ejecución

**Si necesitas ejecutar el proyecto:**

- Lee `docs/tracciona-docs/INSTRUCCIONES-MAESTRAS.md` — Define las 43 sesiones de trabajo. Sesiones 1-43 completadas. El usuario puede pedir "ejecuta la sesión N" para re-ejecutar o verificar cualquier sesión.
- Consulta los anexos en `docs/tracciona-docs/anexos/` cuando una sesión los referencia.

**Regla principal:** Ejecutar solo lo que dicen las INSTRUCCIONES-MAESTRAS. Los anexos son REFERENCIA, no tareas independientes.

**Reglas críticas:**

- LEE los archivos de la sesión ANTES de escribir código. Relee las reglas del inicio de INSTRUCCIONES-MAESTRAS.
- Si no sabes cómo implementar algo, PREGUNTA al usuario. No improvises.
- Mobile-first obligatorio. Multilenguaje ($t() + localizedField) en todo.
- Si necesitas dashboards web (Supabase, Stripe, Cloudflare) → pregunta al usuario.

**Acceso a herramientas:**

- Tienes acceso completo al sistema de archivos y terminal (npm, supabase CLI, git).
- Puedes leer y modificar .env / .env.local para configurar variables de entorno.
- Puedes ejecutar `supabase db push`, `supabase gen types`, `npm install`, `npm run build` directamente.
- NO tienes acceso a navegador web ni dashboards. Si necesitas crear algo en Stripe/Supabase/Cloudflare dashboard, pide al usuario que lo haga.

**Documentación legacy:** Todo en `docs/legacy/` (30+ archivos del sistema anterior, no modificar).

## Convenciones y estructura

Ver `CONTRIBUTING.md` para: stack, estructura del proyecto, convenciones de código, comandos, tests y git workflow.

## Tres reglas no negociables

1. **Mobile-first:** CSS base = 360px. Breakpoints con `min-width`. Touch targets ≥ 44px.
2. **Páginas reales:** Vehículos y artículos son páginas con URL propia, NO modales.
3. **Extensible:** Categorías, subcategorías, filtros e idiomas se leen de la BD. Añadir uno = insertar fila, no tocar código.

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

## Instrucciones de trabajo

- Trabajar siempre de forma secuencial, sin subagentes paralelos
- Priorizar eficiencia de tokens sobre velocidad

## Gestión de límites

Cuando estimes que quedan pocos tokens en la sesión:

1. Avísame con: "⚠️ Tokens bajos - guardando estado"
2. Actualiza STATUS.md con lo que hemos hecho y qué queda pendiente
3. Indica exactamente con qué prompt continuar en la siguiente sesión

## Gestión de sesiones

Al terminar cualquier tarea:

1. Pregunta: "¿Hay algo más relacionado con esta tarea o módulo antes de cerrar sesión?"
2. Si la respuesta es no, actualiza STATUS.md con lo realizado y avisa:
   "✅ Sesión lista para cerrar. Cuando abras la siguiente, empieza con:
   Lee CLAUDE.md y STATUS.md antes de hacer nada."
3. No continúes con nada más hasta recibir respuesta.

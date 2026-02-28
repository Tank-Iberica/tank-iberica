# Tracciona.com — Marketplace de Vehículos Industriales

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

## Modelo según tarea

- Tareas simples (cambios, correcciones, actualizar STATUS.md): usar Haiku
- Tareas intermedias (crear componentes, resolver bugs): usar Sonnet
- Tareas complejas (auditorías, arquitectura): usar Opus
- SIEMPRE, antes de empezar cualquier tarea, indica qué modelo usarías y espera confirmación de que he cambiado el modelo con /model o que mantengo el actual.
- Si durante la tarea el tipo de trabajo cambia o requiere otro modelo, sobretodo para evitar gasto innecesario de tokens, iindícame qué modelo necesitas ahora y espera confirmación antes de continuar.

## Gestión de límites

Cuando estimes que quedan pocos tokens en la sesión:

1. Avísame con: "⚠️ Tokens bajos - guardando estado"
2. Actualiza STATUS.md con lo que hemos hecho y qué queda pendiente
3. Indica exactamente con qué prompt continuar en la siguiente sesión

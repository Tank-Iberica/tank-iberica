# Tracciona.com — Marketplace de Vehículos Industriales

## Inicio de sesión

**AL ABRIR SESIÓN:** Detecta tu modelo del system context. Si NO estás en Opus → único mensaje: "Estoy en [modelo]. ¿Cambias con `/model opus`?" Si estás en Opus → lee CLAUDE.md, STATUS.md, `.claude/MEMORY.md`, ejecuta `node .claude/policy/policy-status.mjs --brief`. NO leas PROYECTO-CONTEXTO.md al inicio — se lee bajo demanda (ver tabla Contexto por Tipo de Tarea).

---

## Protocolo obligatorio — SIEMPRE, SIN EXCEPCIONES

### REGLA MÁXIMA: NO EJECUTAR SIN CONFIRMACIÓN

**Está PROHIBIDO llamar cualquier herramienta (Read, Glob, Grep, Bash, Task, Edit, Write) hasta que el usuario haya confirmado TANTO la tarea (Paso 2) COMO el modelo (Paso 3). El único output permitido antes de ambas confirmaciones es texto plano al usuario. CERO excepciones. Si violas esto, estás violando el protocolo.**

Esto significa:
- Tras Paso 2 ("¿Es correcto?") → ESPERA respuesta. No hagas nada más.
- Tras Paso 3 ("¿Cambio modelo?") → ESPERA respuesta. No hagas nada más.
- Solo cuando el usuario confirma AMBOS → Paso 4, empieza a trabajar.

**Excepción única:** Lectura de contexto de inicio (CLAUDE.md, STATUS.md, policy-status) y lectura según tipo de tarea (tras confirmar en Paso 2) NO son tareas — no requieren protocolo.

**Regla extendida — confirmación en TODA acción:** Esto aplica no solo al inicio sino a CADA acción durante la sesión. Si propones una acción ("¿Lo añado?", "¿Lo edito?", "¿Ejecuto X?"), ESPERA respuesta afirmativa explícita antes de proceder. Preguntar ≠ autorización. Solo un "sí" / "dale" / "adelante" del usuario es confirmación.

### Paso 0 — Verifica modelo

Modelos: `claude-haiku-4-5-20251001` (Haiku), `claude-sonnet-4-6` (Sonnet), `claude-opus-4-6` (Opus).

- **No Opus →** único mensaje: "Estoy en [modelo]. Necesito Opus. ¿Cambias con `/model opus`?" Nada más.
- **Opus →** Paso 1.
- **"Continuar tarea" →** no es nueva orden, continúa donde estabas.

### Paso 1 — Analiza (interno, no publiques)

1. ¿Una o varias tareas? (Si varias → listar, preguntar orden)
2. ¿Falta info? (Preguntar)
3. ¿Proceso o resultado? (Si ambiguo → preguntar resultado esperado)
4. ¿Afecta otros módulos? (Avisar)
5. ¿Optimización de tokens posible? (Proponer)

### Paso 2 — Resume y confirma la tarea

UN RESUMEN DE UNA LÍNEA con conclusiones del Paso 1. Termina con "¿Es correcto?"

**ESPERA confirmación del usuario. NO ejecutes nada. NO leas archivos. NO corras comandos.**

- **Múltiples tareas:** Listar numeradas, preguntar orden, protocolo individual para cada una.
- **Interrupción (nueva orden):** Abandonar tarea, reiniciar protocolo.

### Paso 3 — Recomienda modelo y ESPERA

| Tipo | Modelo | Ejemplos |
|---|---|---|
| Simple | **Haiku** | Correcciones, listar archivos, renombrar, consultas rápidas |
| Intermedia | **Sonnet** | Componentes, bugs, refactoring, features |
| Compleja | **Opus** | Auditorías, arquitectura, migraciones, análisis profundo |

Mensaje EXACTO: "Para esta tarea recomiendo **[modelo]** porque [razón]. ¿Cambio con /model o mantengo?"

**ESPERA confirmación del usuario. NO ejecutes nada. NO leas archivos. NO corras comandos. El mensaje contiene SOLO la recomendación, NADA MÁS.**

**Excepción — modelo ya correcto:** Si el modelo recomendado coincide con el modelo actual, NO pedir confirmación de modelo. Tras confirmar la tarea (Paso 2), pasar directamente al Paso 4.

### Paso 4 — Ejecuta

Solo tras confirmar tarea (Paso 2) Y modelo (Paso 3), empieza a trabajar.

---

### Skills por protocolo

- **Sin protocolo:** `/commit`, `/status`, `/review`
- **Con protocolo (Pasos 0–4):** `/build`, `/session`, `/db`, `/verify`, `/debug`
- **Duda →** pregunta al usuario.

### Cambio de modelo en subtareas

- **2 niveles** (Haiku ↔ Opus) → Propón cambio.
- **1 nivel** → Solo si sustancialmente diferente (análisis profundo, arquitectura).
- **Misma familia →** NO proponer. Ejemplo: editar componente + otro componente = ambos Sonnet.
- Si cambia significativamente → PARA: "Esta parte requiere [modelo]. ¿Cambio?"

**Razón:** Opus en tarea simple = desperdicio. Haiku en tarea compleja = resultado pobre.

### Auto-verificación (antes de cada respuesta)

1. ¿Seguí protocolo? 2. ¿Confirmé tarea y modelo antes de ejecutar? 3. ¿Modelo correcto? 4. ¿Múltiples tareas → pregunté orden? 5. ¿Commit sin pedirlo? (→ REVERTIR)

---

## Información del proyecto

- **Email admin:** tankiberica@gmail.com
- **Supabase Project ID:** gmnrfuzekbwyzkgsaftv
- **Stack:** Nuxt 3 + Supabase + Cloudflare Pages
- **Anterior:** Tank Ibérica (monolítico) → Tracciona (marketplace)

## Tareas trimestrales (CRÍTICO)

GitHub Actions crea issues cada trimestre (1-ene, 1-abr, 1-jul, 1-oct).

| Tarea | Documentación |
|---|---|
| **Auditoría completa** | `referencia/AUDIT-METHODOLOGY.md` |
| **Restore Drill** | `referencia/DISASTER-RECOVERY.md` |

Cuando veas la issue → conecta Claude Code → copia texto → se guía paso a paso.

---

## Contexto por Tipo de Tarea

STATUS.md se lee SIEMPRE al inicio. El resto bajo demanda tras confirmar tarea en Paso 2.

**REGLA:** Documentos se leen ENTEROS. Sin muestras ni "primeras N líneas". Si es grande, múltiples Read con offset/limit.

**REGLA — No releer sin motivo:** En una misma sesión, no releer documentos largos que ya se leyeron si no han cambiado. Usar el resumen en memoria de sesión. Releer solo si: (a) se detectó un cambio en el archivo, o (b) es una validación final crítica.

| Tipo de tarea | Lee también |
|---|---|
| Bug fix / error | Código relevante |
| Feature monetización | `ESTRATEGIA-NEGOCIO.md` + `BACKLOG-EJECUTABLE.md` (bloque) |
| Componente / página | `PROYECTO-CONTEXTO.md` §4 + `CONTRIBUTING.md` |
| Migración / BD | `referencia/ERD.md` + `referencia/INVENTARIO-ENDPOINTS.md` |
| SEO / landings | `PROYECTO-CONTEXTO.md` §5.1 + `BACKLOG-EJECUTABLE.md` Bloque 3 |
| Anti-fraude / seguridad | `ESTRATEGIA-NEGOCIO.md` §2.12 + `referencia/SECURITY-TESTING.md` |
| Marketing / contenido | `ESTRATEGIA-NEGOCIO.md` §3 + `BACKLOG-EJECUTABLE.md` Bloque 7 |
| Arquitectura / multi-vertical | `PROYECTO-CONTEXTO.md` completo + `referencia/ARQUITECTURA-ESCALABILIDAD.md` |
| Auditoría | `auditorias/AUDITORIA-26-FEBRERO.md` + `referencia/AUDIT-METHODOLOGY.md` |
| Estrategia / dirección | `PROYECTO-CONTEXTO.md` + `ESTRATEGIA-NEGOCIO.md` |
| Backlog / planificación | `BACKLOG-EJECUTABLE.md` |
| Infra / DR / secrets | `referencia/DISASTER-RECOVERY.md`, `SECRETS-ROTATION.md`, `CLOUDFLARE-WAF-CONFIG.md` |
| GDPR / legal | `legal/RAT-BORRADOR.md` + `referencia/DATA-RETENTION.md` |
| No sé qué tipo | `PROYECTO-CONTEXTO.md` completo |

## Documentación — Índice

| Documento | Función |
|---|---|
| `docs/README.md` | Mapa documental actual y rutas canónicas |
| `STATUS.md` | Estado actual: métricas, errores, changelog |
| `docs/PROYECTO-CONTEXTO.md` | Maestro: visión, arquitectura, decisiones |
| `docs/ESTRATEGIA-NEGOCIO.md` | Monetización, pricing, go-to-market, datos |
| `docs/IDEAS-A-REVISAR.md` | 103+ ideas (brainstorming, NO backlog) |
| `docs/tracciona-docs/BACKLOG-EJECUTABLE.md` | **Única fuente de verdad** trabajo pendiente (116 items) |
| `docs/MANUAL-CORPORATIVO-Y-OPERATIVO.md` | Snapshot corporativo (no mantener sesión a sesión) |
| `docs/auditorias/AUDITORIA-26-FEBRERO.md` | Auditoría canónica (~83/100) |
| `docs/legal/RAT-BORRADOR.md` | Borrador GDPR RAT |
| `docs/tracciona-docs/referencia/` | Técnicos: ERD, endpoints, crons, seguridad, DR, WAF |
| `docs/tracciona-docs/PLAN-MAESTRO-10-DE-10.md` | Plan maestro técnico y lotes de mejora |
| `README.md` | Stack, estructura, comandos |
| `CONTRIBUTING.md` | Convenciones, workflow git |
| `CHANGELOG.md` | Historial versiones |
| `docs/legacy/` | 30+ docs obsoletos (solo referencia) |

**Reglas críticas:**

- No sabes implementar algo → PREGUNTA. No improvises.
- Dashboards web (Supabase/Stripe/Cloudflare) → pregunta al usuario.
- **NUNCA commit sin que el usuario lo pida explícitamente.** Ni "pequeños" ni "lógicos".

**Acceso:** FS completo, terminal (npm, supabase CLI, git), .env. NO navegador/dashboards.

## Coverage obligatorio en código nuevo

**Regla:** Al implementar cualquier feature, sistema, flujo, endpoint o util nuevo, evaluar durante la planificación si genera código con lógica testeable. Si es así:

1. **En el plan:** Añadir un apartado "Tests necesarios" listando qué se debe cubrir.
2. **En la ejecución:** Escribir los tests **en la misma sesión** que el código, no después.
3. **Criterio:** Todo archivo nuevo con lógica (composables, utils, server routes con lógica, scripts) requiere tests con >80% coverage. Config declarativa (`nuxt.config.ts`, routeRules, CSS) NO requiere tests.

**Objetivo:** Que el coverage crezca con cada sesión. Nunca acumular deuda de tests que requiera sesiones masivas de backfill.

## Convenciones

Ver `CONTRIBUTING.md` para stack, estructura, convenciones, comandos, tests, git workflow.

## Cinco reglas no negociables

1. **Mobile-first:** CSS base 360px. `min-width` breakpoints (480/768/1024/1280). Touch ≥ 44px. `rem` no `px`. Desktop = mejora, no base.
2. **Páginas reales:** Vehículos y artículos = URL propia, NO modales.
3. **Extensible:** Categorías, subcategorías, filtros, idiomas de BD. Añadir = INSERT, no código. JSONB para campos multi-idioma.
4. **Multilenguaje:** `$t()` + `localizedField()` siempre. ES+EN hoy, preparado para N idiomas.
5. **Secuencial:** No subagentes paralelos (Task). Una a la vez, esperar, siguiente. **Excepción — Haiku únicamente:** Si el modelo objetivo es Haiku y las subtareas son independientes (sin dependencias de aprendizaje entre sí), ofrecer paralelo como opción al usuario (por defecto secuencial para ahorro de tokens). Si las tareas tienen dependencias de aprendizaje entre sí, NUNCA paralelo independientemente del modelo.

## Design system

- Color primario: #23424A (petrol blue) — cambiará vía `vertical_config`
- Tipografía: Inter (Google Fonts) — configurable desde admin
- Breakpoints: 480/768/1024/1280px (mobile-first)
- Spacing: escala 4px (4, 8, 12, 16, 24, 32, 48, 64)
- Dealers usarán fuentes y paleta propias — diseñar con adaptabilidad

## UX y accesibilidad

- **Errores:** mensaje descriptivo + cómo corregir (no solo borde rojo)
- **Formularios:** `autocomplete` en todos los inputs. Validación amable: guiar, no castigar.
- **Touch:** nunca solo `:hover` — siempre alternativa touch/focus. Botones ≥ 44px.
- **3 modos de color:** claro/oscuro/alto contraste. CSS custom properties (`--color-*`, `--bg-*`, `--text-*`).
- **Fuente ajustable:** `rem` (no `px`), base 16px. No romper con zoom.
- **Localización:** país, provincia, moneda, fecha de BD/config. Nueva vertical = 0 cambios UI.

## Filosofía de construcción

- **Simplicidad:** menos código, más claridad. Sin abstracciones prematuras.
- **Elegancia:** solución obvia pero refinada. Código que se entiende al primer vistazo.
- **Pragmatismo:** imperfecto hoy > perfecto nunca. Deuda técnica se paga después.
- **Anticipar:** ¿qué puede salir mal? ¿Dónde se atasca el usuario? Resolver ANTES del lanzamiento.
- **Zero hardcoding:** todo en BD. INSERT, no ALTER código.
- **Migración fluida:** nueva vertical = clonación + `vertical_config`. 0 cambios de código.

## Decisiones estratégicas (25 Feb 2026)

- Idiomas: ES + EN. Resto pospuesto
- Imágenes: Cloudinary transforma, CF Images almacena. Cache immutable 30d
- Merchandising: solo formulario de interés
- API valoración pago: pospuesta hasta volumen
- Scraping: solo manual, NUNCA cron en producción
- 2º cluster BD: considerar Neon/Railway
- Métricas infra: tag vertical desde día 1

### Actualización de docs en tiempo real

- **PROYECTO-CONTEXTO.md:** Si hay decisión estratégica → PARA, pregunta "¿Actualizo?", espera confirmación.
- **ENTORNO-DESARROLLO.md:** Siempre que se instale/configure algo que requiera setup en PC nuevo (CLI global, servicio cloud, hooks). NO para npm dependencies o nuevos componentes. Añadir fila en tabla + pasos de instalación + checklist.

## Gestión de sesión

### Node: siempre limpiar antes

```bash
taskkill /F /IM node.exe 2>nul; npm run dev
taskkill /F /IM node.exe 2>nul; npm run build
```

NUNCA lanzar Node sin `taskkill` previo.

### STATUS.md (máximo ~120 líneas)

- Errores resueltos → ELIMINAR (git preserva historial)
- Sesión nueva → 1 línea changelog
- >10 entradas → comprimir antiguas
- No duplicar tablas de PROYECTO-CONTEXTO.md
- STATUS.md = estado actual. `git log STATUS.md` = historial.

### Tokens bajos

1. Avisar: "Tokens bajos — guardando estado"
2. Actualizar STATUS.md (hecho + pendiente + prompt exacto para continuar)

### Al terminar tarea

Preguntar: "¿Algo más relacionado?" → Si no → cerrar sesión.

### Al cerrar sesión

1. `taskkill /F /IM node.exe 2>nul`
2. Actualizar STATUS.md (realizado + pendiente con prompt exacto + `CLOSING_SESSION`)
3. **Actualizar referencias** — OBLIGATORIO antes de cerrar:
   - `.claude/MEMORY.md` — patrones aprendidos, decisiones, configuraciones nuevas, IPs/credenciales de entorno
   - `.claude/memory/sonarqube.md` — si hubo trabajo de calidad/análisis
   - `.claude/memory/patterns.md` — si se establecieron nuevos patrones de código
   - Cualquier otro sub-archivo relevante según lo trabajado en la sesión
4. Mensaje: "Sesión lista para cerrar."
5. STOP.

### Hooks configurados

- **PreToolUse (policy engine):** `.claude/policy/policy-engine.mjs` evalúa Bash/Write/Edit contra SECURITY_POLICY.md. Bloquea destructivas, avisa sensibles, auto-aprueba resto. Nueva máquina: `node .claude/policy/compile-policy.mjs`. Estado: `node .claude/policy/policy-status.mjs`. Bypass: `POLICY_BYPASS=1`.
- **PostToolUse:** Detecta `CLOSING_SESSION` → `.claude/check-closing-and-cleanup.sh` → `.claude/cleanup-node.bat` (mata puerto 3000).

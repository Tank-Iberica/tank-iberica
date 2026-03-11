# Coverage Policy — Tracciona

**Creado:** 2026-03-05
**Objetivo:** 100% coverage sobre codigo ejecutable.

---

## Que cuenta como ejecutable

Todo archivo `.ts`, `.vue` (con `<script>`), `.js` que se ejecuta en runtime:

- `app/composables/**/*.ts`
- `app/utils/**/*.ts`
- `app/components/**/*.vue` (con `<script setup>` o `<script>`)
- `app/pages/**/*.vue`
- `app/layouts/**/*.vue`
- `app/middleware/**/*.ts`
- `app/plugins/**/*.ts`
- `server/api/**/*.ts`
- `server/services/**/*.ts`
- `server/utils/**/*.ts`
- `server/middleware/**/*.ts`
- `server/routes/**/*.ts`

## Que NO cuenta (exclusiones auditadas)

| Tipo | Patron | Justificacion |
|---|---|---|
| CSS/SCSS | `**/*.css`, `**/*.scss` | No ejecutable — estilos puros |
| Tipos TypeScript | `**/*.d.ts`, `types/**` | No genera codigo JS en runtime |
| JSON i18n | `i18n/**/*.json` | Datos estaticos (validacion de claves via test separado) |
| Generados | `.nuxt/**`, `.output/**` | Auto-generados por framework |
| Assets publicos | `public/**` | Archivos estaticos |
| Config raiz | `*.config.ts`, `*.config.js` | Config de build, no logica de negocio |
| Supabase types | `types/supabase.ts`, `app/types/database.types.ts` | Auto-generados por CLI |
| Migraciones SQL | `supabase/migrations/**` | SQL, no TypeScript |
| Documentacion | `docs/**` | No codigo |

**Regla:** si un archivo puede cambiar comportamiento de negocio en runtime, NO se excluye.

**Auditoria:** revisión trimestral de exclusiones (coincide con auditoria general del proyecto).

---

## Excepciones individuales (`v8 ignore`)

Cuando un archivo ejecutable es genuinamente imposible de testear (ej: plugin que solo funciona en runtime de Cloudflare Workers, API de browser no emulable):

```ts
/* v8 ignore file -- [JUSTIFICACION OBLIGATORIA] */
```

**Reglas:**
- Justificacion tecnica obligatoria en el comentario
- Aprobacion explicita del owner operativo
- Registrada en la tabla de abajo
- Revisada trimestralmente: si ya es testeable, se quita el ignore

### Registro de excepciones

| Archivo | Justificacion | Fecha | Revisado |
|---|---|---|---|
| *(ninguna por ahora)* | | | |

---

## Quality gates

| Gate | Umbral | Donde |
|---|---|---|
| Coverage global (overall) | 100% sobre ejecutable | SonarQube Quality Gate |
| Coverage en PR (new_code) | 100% en codigo nuevo | SonarQube Quality Gate |
| Vitest coverage threshold | 100% statements + lines + functions | `vitest.config.ts` |
| Branches coverage | 90% (branches son combinatorialmente dificiles) | `vitest.config.ts` |

**Progresion de umbrales** (no se puede activar 100% de golpe):

| Fase | Umbral global | Cuando |
|---|---|---|
| Fase actual | Sin umbral | Hasta tener inventario |
| Tras Fase 2 lote 1 | 10% | ~semana 1 |
| Tras Fase 2 lote 5 | 30% | ~semana 3 |
| Tras Fase 2 lote 10 | 50% | ~semana 6 |
| Tras Fase 2 lote 15 | 70% | ~semana 10 |
| Tras Fase 2 lote 20 | 85% | ~semana 13 |
| Completado | 100% | ~semana 16 |

---

## Owners

| Rol | Quien | Responsabilidad |
|---|---|---|
| **Owner operativo** | Fundador (usuario) | Decide prioridades, aprueba exclusiones, valida reglas de negocio en tests ambiguos, decide quarantine vs fix de flaky tests |
| **Owner ejecucion** | Claude Code (agente) | Genera tests, ejecuta validacion, detecta flaky, propone fixes, mantiene inventario, reporta progreso |

### Flujo de decision

```
Test flaky detectado
  → Agente: lo etiqueta + propone fix
  → Si fix < 15 min: agente lo arregla
  → Si fix complejo o ambiguo: escala al owner operativo
  → Owner decide: fix ahora / quarantine 48h / excluir con justificacion
```

---

## Politica anti-flaky

1. **Deteccion:** test que falla intermitentemente en CI se marca como `flaky`
2. **Plazo:** fix en 48h o quarantine temporal
3. **Quarantine:** mover a `tests/quarantine/` con `describe.skip` + comentario con fecha y razon
4. **Limite:** maximo 5 tests en quarantine simultaneamente
5. **Revision:** en cada sesion de tests, revisar quarantine antes de generar nuevos
6. **Prohibido:** `waitForTimeout` en tests nuevos. Usar esperas deterministas.

---

## Motor de generacion de tests (por fase de proyecto)

| Fase proyecto | Motor | Coste | Recordatorio |
|---|---|---|---|
| **Pre-launch (ahora)** | Claude Code en sesiones manuales | 0€ adicional | — |
| **Lanzamiento** | Claude API + Qodo Cover Agent (open source) en CI | ~$5-15/mes tokens | Configurar al activar primer plan de pago |
| **Con revenue (>500€/mes)** | Qodo Pro + Stryker + runner dedicado | ~$150/mes | Evaluar cuando revenue estable 3 meses |

### Validacion de calidad de tests generados

- **Pre-launch:** agente ejecuta cada test, verifica que no es falso positivo
- **Lanzamiento:** Stryker en modulos criticos (auth, pagos, RLS) — si mutacion no mata test, test es inutil
- **Con revenue:** Stryker en todo el proyecto nightly

---

## Definicion de Done

El plan de coverage esta "implementado" cuando:

- [ ] Gate de coverage activo en CI (bloquea merge si < umbral actual)
- [ ] `coverage.all = true` en Vitest (cuenta todos los archivos ejecutables)
- [ ] Exclusiones configuradas y auditadas (sonar + vitest)
- [ ] Inventario completo generado y priorizado por lines_to_cover
- [ ] 0 tests en quarantine
- [ ] 0 falsos verdes (tests que pasan sin testear nada real)
- [ ] Dashboard SonarQube limpio: 0 bugs, 0 vulnerabilities, hotspots revisados
- [ ] Coverage global = 100% sobre ejecutable
- [ ] Toda PR nueva incluye tests para codigo nuevo (verificado por CI)

---

## Mantenimiento al ampliar el proyecto

La infraestructura de coverage se adapta automaticamente a archivos nuevos dentro de las carpetas ya configuradas. Solo requiere accion manual en estos casos:

### Cuando HAY que actualizar

| Cambio en el proyecto | Accion requerida | Archivos a editar |
|---|---|---|
| **Carpeta nueva** con codigo ejecutable (ej: `app/workers/`, `server/jobs/`) | Añadir al `include` de coverage y a `sonar.sources` | `vitest.config.ts`, `sonar-project.properties` |
| **Nueva exclusion legitima** (ej: nuevo generador auto, nuevo tipo de assets) | Añadir al `exclude` de coverage y `sonar.exclusions` | `vitest.config.ts`, `sonar-project.properties` |
| **Nuevo tipo de archivo ejecutable** (ej: `.mts`, `.jsx`) | Añadir a `sonar.inclusions` y `sonar.lang.patterns` | `sonar-project.properties` |
| **Archivo genuinamente no testeable** | Añadir `/* v8 ignore file */` + registrar en tabla de excepciones (arriba) | Archivo fuente + esta policy |

### Cuando NO hay que tocar nada

- Archivo nuevo en `app/composables/`, `app/utils/`, `server/api/`, etc. → se cuenta automaticamente via globs
- Componente Vue nuevo → idem
- `coverage.all = true` → cualquier archivo nuevo sin test aparece como 0% en el inventario

### Recordatorio para el agente

Al crear codigo nuevo, ejecutar `node scripts/coverage-inventory.mjs` para verificar que el archivo aparece en el inventario. Si no aparece, revisar los globs de `vitest.config.ts`.

---

## Tags de progreso

| Tag | Significado |
|---|---|
| `coverage-plan-start` | Inicio del esfuerzo (baseline congelado) |
| `coverage-plan-done` | 100% alcanzado + gates activos |

---

## Checkpoint de sesion

Al inicio de cada sesion de generacion de tests:

1. Consultar metricas actuales (coverage overall + new_coverage)
2. Revisar quarantine (hay tests pendientes de fix?)
3. Comparar con baseline (`coverage-baseline-2026-03-05.json`)
4. Generar siguiente lote priorizado por lines_to_cover
5. Reportar progreso al owner operativo

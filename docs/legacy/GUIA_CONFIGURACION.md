> ⚠️ **[LEGACY]** Documento histórico — solo referencia. No modificar ni usar como fuente de verdad. Ver `docs/tracciona-docs/` para documentación activa.

> **DOCUMENTO HISTORICO.** Este documento es referencia del diseno original. La fuente de verdad actual es [`README.md`](../../README.md) y [`INSTRUCCIONES-MAESTRAS.md`](INSTRUCCIONES-MAESTRAS.md).

# Tank Iberica — Guía de Configuración para Claude Code

## Qué es esto

Esta guía explica cómo configurar Claude Code para que gestione automáticamente la migración de Tank Iberica. Claude Code lee los archivos de configuración al inicio de cada sesión y sabe qué hacer, en qué orden, y cómo verificar cada paso.

---

## Requisitos previos

1. **Claude Max Plan** — Necesario para usar Claude Code con Opus 4.5.
2. **Node.js 18+** instalado en tu máquina.
3. **Git** instalado y configurado.
4. **Cuenta Supabase** (gratuita) — https://supabase.com
5. **Cuenta Cloudflare** (gratuita) — https://cloudflare.com
6. **Cuenta Cloudinary** (gratuita) — https://cloudinary.com

---

## Paso 1: Instalar Claude Code

```bash
npm install -g @anthropic-ai/claude-code
```

Verifica que funciona:

```bash
claude --version
```

Al ejecutar `claude` por primera vez, te pedirá autenticarte con tu cuenta de Anthropic (Plan Max).

---

## Paso 2: Crear el repositorio del proyecto

```bash
mkdir tank-iberica
cd tank-iberica
git init
```

---

## Paso 3: Copiar los archivos de configuración

Copia toda la estructura de esta carpeta de configuración a la raíz de `tank-iberica/`:

```
tank-iberica/
├── CLAUDE.md                          ← Cerebro del proyecto (Claude lo lee automáticamente)
├── .claude/
│   ├── settings.json                  ← Permisos y hooks automáticos
│   ├── commands/
│   │   ├── next-task.md               ← /project:next-task (ejecutar siguiente tarea)
│   │   ├── verify.md                  ← /project:verify (verificación completa)
│   │   ├── mobile-check.md            ← /project:mobile-check (audit móvil)
│   │   ├── status.md                  ← /project:status (ver progreso)
│   │   └── fix-errors.md              ← /project:fix-errors (corregir errores)
│   └── skills/
│       ├── nuxt-supabase/SKILL.md     ← Patrones Nuxt + Supabase
│       └── mobile-first/SKILL.md      ← Patrones mobile-first CSS
├── docs/
│   ├── progreso.md                    ← Tracking de tareas (Claude actualiza esto)
│   ├── hoja-de-ruta.md                ← Copia de la Hoja de Ruta Optimizada v2
│   ├── esquema-bd.md                  ← Esquema de las 17 tablas (del Plan v3)
│   ├── DESIGN_SYSTEM.md               ← Tokens de diseño (del proyecto actual)
│   └── legacy/                        ← Documentos de referencia del código actual
│       ├── index-funcionalidades.md
│       ├── admin-funcionalidades.md
│       └── PARAMETROS_ADMIN_ORIGINAL.md
└── (el proyecto Nuxt se creará aquí en Step 1)
```

---

## Paso 4: Copiar los documentos de referencia

Los 4 documentos que ya tienes van en `docs/`:

| Documento                          | Destino                                                       | Para qué                                 |
| ---------------------------------- | ------------------------------------------------------------- | ---------------------------------------- |
| Documentación funcional index.html | `docs/legacy/index-funcionalidades.md`                        | Referencia para replicar funcionalidades |
| Documentación funcional admin.html | `docs/legacy/admin-funcionalidades.md`                        | Referencia para replicar admin           |
| Plan Profesionalización v3         | `docs/plan-v3.md` + extraer esquema BD a `docs/esquema-bd.md` | Esquema BD, RLS, stack completo          |
| Hoja de Ruta Optimizada v2         | `docs/hoja-de-ruta.md`                                        | Orden de implementación paso a paso      |

También copia del proyecto actual:
| Archivo | Destino |
|---------|---------|
| DESIGN_SYSTEM.md | `docs/DESIGN_SYSTEM.md` |
| PARAMETROS_ADMIN_ORIGINAL.md | `docs/legacy/PARAMETROS_ADMIN_ORIGINAL.md` |

---

## Paso 5: Primer commit

```bash
git add .
git commit -m "docs: configuración inicial del proyecto y documentación de referencia"
```

---

## Paso 6: Iniciar Claude Code

```bash
cd tank-iberica
claude
```

Claude leerá automáticamente CLAUDE.md y tendrá contexto completo del proyecto.

---

## Cómo trabajar día a día

### Flujo normal: ejecutar la siguiente tarea

```
/project:next-task
```

Claude:

1. Lee la hoja de ruta y el progreso
2. Identifica la siguiente tarea pendiente
3. Te muestra un plan y espera tu aprobación
4. Implementa la tarea
5. Ejecuta verificaciones (lint, typecheck, tests)
6. Actualiza progreso.md
7. Hace commit

### Ver estado del proyecto

```
/project:status
```

### Verificar que todo funciona

```
/project:verify
```

### Comprobar que todo es mobile-first

```
/project:mobile-check
```

### Corregir errores

```
/project:fix-errors
```

---

## Cuándo intervienes tú

Claude Code puede hacer la mayor parte del trabajo, pero hay cosas que necesitan intervención humana:

### Cosas que Claude Code NO puede hacer

| Acción                                | Por qué                                | Qué hacer tú                                                      |
| ------------------------------------- | -------------------------------------- | ----------------------------------------------------------------- |
| Crear proyecto Supabase               | Requiere login en navegador            | Crear en supabase.com, dar las credenciales a Claude              |
| Configurar OAuth providers            | Requiere consoles de Google/Apple      | Configurar en Google Cloud Console, dar Client ID/Secret a Claude |
| Crear cuenta Cloudflare Pages         | Requiere login en navegador            | Crear en cloudflare.com, conectar repo GitHub                     |
| Crear cuenta Cloudinary               | Requiere login en navegador            | Crear en cloudinary.com, dar cloud name a Claude                  |
| Revocar API_KEY de Google (Step 0)    | Requiere acceso a Google Cloud Console | Hacerlo tú en console.cloud.google.com                            |
| Test en móvil real                    | Requiere dispositivo físico            | Probar en tu móvil y reportar problemas a Claude                  |
| Migrar imágenes a Cloudinary (Step 2) | Requiere subir archivos desde Drive    | Exportar de Drive, subir a Cloudinary (Claude te guía)            |
| Configurar dominio DNS                | Requiere acceso al registrador         | Apuntar DNS a Cloudflare                                          |

### Cosas que Claude Code SÍ hace solo

- Crear archivos, componentes, páginas, composables, stores
- Escribir SQL (migraciones, tablas, RLS, índices)
- Escribir tests (unitarios, componente, E2E)
- Configurar ESLint, Prettier, Husky, TypeScript
- Ejecutar lint, typecheck, tests y corregir errores
- Generar tipos de Supabase
- Commits y gestión de branches
- Toda la lógica de negocio y UI

---

## Tips para máxima eficiencia

1. **Una sesión por step.** Cada step es 1-3 semanas de trabajo. Empieza sesión fresca al iniciar un step nuevo para mantener el contexto limpio.

2. **Si el contexto se llena**, Claude compacta automáticamente. El CLAUDE.md y progreso.md aseguran que no pierde el hilo.

3. **Si Claude se equivoca**, pulsa Esc, corrígelo, y continúa. El código está en Git, siempre puedes revertir.

4. **Revisa los PRs.** Aunque Claude hace commit, revisa los cambios antes de hacer push a main (que dispara deploy).

5. **Test en móvil después de cada step.** No confíes solo en Chrome DevTools.

6. **El modelo recomendado es Opus 4.5** para tareas complejas (arquitectura, refactoring) y Sonnet 4.5 para tareas rutinarias (fix lint, añadir tests).

---

## Estructura de archivos al completar el proyecto

```
tank-iberica/
├── CLAUDE.md
├── .claude/
│   ├── settings.json
│   ├── commands/ (5 comandos)
│   └── skills/ (2 skills)
├── docs/
│   ├── progreso.md (todas las tareas ✅)
│   ├── hoja-de-ruta.md
│   ├── esquema-bd.md
│   ├── DESIGN_SYSTEM.md
│   └── legacy/ (referencia)
├── nuxt.config.ts
├── package.json
├── tsconfig.json
├── .env (SUPABASE_URL, SUPABASE_ANON_KEY, CLOUDINARY_CLOUD_NAME)
├── .gitignore
├── pages/ (~15 páginas)
├── components/ (~35 componentes)
├── composables/ (~8 composables)
├── stores/ (3 stores)
├── i18n/ (es.json, en.json)
├── middleware/ (auth.ts, admin.ts)
├── assets/css/ (tokens.css, global.css)
├── types/ (supabase.ts, index.d.ts)
├── supabase/migrations/ (~17 SQL files)
├── tests/ (unit, component, e2e)
└── public/ (favicon, manifest.json, icons)
```

# Entorno de Desarrollo — Requisitos de Instalación

> **Propósito:** Lista exhaustiva de todo lo que hay que instalar en un ordenador nuevo para trabajar en este proyecto. Se actualiza cada vez que se añade un sistema, herramienta o flujo nuevo que requiera instalación.
>
> **Regla:** Si implementas algo que no sea "hacer npm install y correr el proyecto", añade aquí lo que hay que instalar y cómo.

---

## Herramientas de sistema (instalar manualmente)

| Herramienta         | Versión mínima     | Cómo instalar                              | Para qué se usa                 |
| ------------------- | ------------------ | ------------------------------------------ | ------------------------------- |
| **Node.js**         | v20+ (actual: v24) | https://nodejs.org o `nvm install 24`      | Runtime del proyecto            |
| **Git**             | 2.x                | https://git-scm.com                        | Control de versiones            |
| **Claude Code CLI** | última             | `npm install -g @anthropic-ai/claude-code` | IA de desarrollo (este sistema) |

---

## Herramientas de desarrollo (instalar manualmente)

| Herramienta           | Cómo instalar                              | Para qué se usa                            | Obligatorio  |
| --------------------- | ------------------------------------------ | ------------------------------------------ | ------------ |
| **GitHub CLI (`gh`)** | https://cli.github.com                     | Crear PRs, gestionar issues desde terminal | Recomendado  |
| **Supabase CLI**      | `npm install -g supabase` o `npx supabase` | Migraciones BD, gen tipos, dev local       | Sí (para BD) |

---

## Herramientas automáticas (se instalan solas con `npm install`)

Estas NO requieren instalación manual — el `postinstall` o `prepare` de npm las gestiona:

| Qué                        | Cómo se activa                             | Notas                                              |
| -------------------------- | ------------------------------------------ | -------------------------------------------------- |
| Todas las dependencias npm | `npm install`                              | Nuxt, Supabase client, Stripe, etc.                |
| Husky git hooks            | `npm install` → script `prepare`           | Pre-commit: ESLint + Prettier                      |
| Policy Engine (compilado)  | `npm install` → script `postinstall`       | Compila `.claude/policy/SECURITY_POLICY.md` → JSON |
| Playwright browsers        | `npx playwright install` (manual, una vez) | Necesario para `npm run test:e2e`                  |

> **Nota sobre Playwright:** aunque el paquete se instala con `npm install`, los navegadores binarios hay que descargarlos aparte la primera vez:
>
> ```bash
> npx playwright install chromium
> ```

---

## Configuración de Claude Code (`.claude/`)

El directorio `.claude/` está en el repositorio. Al clonar el repo y hacer `npm install`, el Policy Engine se compila automáticamente. No hay nada más que configurar.

Si la compilación automática falla por algún motivo:

```bash
node .claude/policy/compile-policy.mjs
```

Verificar que el engine está activo:

```bash
node .claude/policy/policy-status.mjs --brief
```

---

## Servicios cloud (no se instalan, pero necesitas acceso)

Estos son SaaS — no hay que instalar nada, pero necesitas credenciales/acceso para trabajar con ellos:

| Servicio             | URL                                                         | Para qué                | Quién da acceso          |
| -------------------- | ----------------------------------------------------------- | ----------------------- | ------------------------ |
| **Supabase**         | https://supabase.com/dashboard/project/gmnrfuzekbwyzkgsaftv | BD, auth, storage       | Propietario del proyecto |
| **Cloudflare Pages** | https://dash.cloudflare.com                                 | Deploy, CDN, Workers    | Propietario del proyecto |
| **Stripe**           | https://dashboard.stripe.com                                | Pagos, suscripciones    | Propietario del proyecto |
| **Resend**           | https://resend.com                                          | Envío de emails         | Propietario del proyecto |
| **Cloudinary**       | https://cloudinary.com                                      | Pipeline de imágenes    | Propietario del proyecto |
| **GitHub**           | https://github.com/[repo]                                   | Repositorio, PRs, CI/CD | Propietario del proyecto |

---

## Variables de entorno

Copia `.env.example` → `.env` y rellena los valores. El archivo `.env.example` está en el repositorio con todas las claves necesarias (sin valores reales).

```bash
cp .env.example .env
# Rellenar valores en .env con credenciales reales
```

---

## Checklist para ordenador nuevo

```
[ ] Node.js v20+ instalado
[ ] Git instalado
[ ] Claude Code CLI instalado (npm install -g @anthropic-ai/claude-code)
[ ] Repositorio clonado
[ ] npm install ejecutado (instala deps + compila policy engine + activa husky)
[ ] .env creado desde .env.example con valores reales
[ ] npx playwright install chromium (si vas a correr tests E2E)
[ ] GitHub CLI instalado (recomendado para operaciones con PRs)
[ ] Acceso a Supabase, Cloudflare, Stripe, Resend, Cloudinary confirmado
[ ] node .claude/policy/policy-status.mjs --brief → debe mostrar ACTIVO
```

---

## Historial de herramientas añadidas

| Fecha      | Herramienta / Sistema             | Quién lo añadió | Notas                                                           |
| ---------- | --------------------------------- | --------------- | --------------------------------------------------------------- |
| 2026-03-03 | Policy Engine (`.claude/policy/`) | Claude Code     | PreToolUse hooks para seguridad. Auto-compila en `npm install`. |
| —          | Husky + lint-staged               | —               | Pre-commit hooks ESLint + Prettier                              |
| —          | Playwright                        | —               | Tests E2E. Browsers: `npx playwright install chromium`          |
| —          | Supabase CLI                      | —               | Migraciones y gen de tipos                                      |

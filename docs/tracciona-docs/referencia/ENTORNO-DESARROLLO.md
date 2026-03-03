# Entorno de Desarrollo — Requisitos de Instalación

> **Propósito:** Lista exhaustiva de todo lo que hay que instalar en un ordenador nuevo para trabajar en este proyecto. Se actualiza cada vez que se añade un sistema, herramienta o flujo nuevo que requiera instalación.
>
> **Regla:** Si implementas algo que no sea "hacer npm install y correr el proyecto", añade aquí lo que hay que instalar y cómo.

---

## Herramientas de sistema (instalar manualmente)

| Herramienta         | Versión mínima     | Cómo instalar                                  | Para qué se usa                 |
| ------------------- | ------------------ | ---------------------------------------------- | ------------------------------- |
| **Node.js**         | v20+ (actual: v24) | https://nodejs.org o `nvm install 24`          | Runtime del proyecto            |
| **Git**             | 2.x                | https://git-scm.com                            | Control de versiones            |
| **Docker Desktop**  | última             | https://www.docker.com/products/docker-desktop | SonarQube (análisis de calidad) |
| **Claude Code CLI** | última             | `npm install -g @anthropic-ai/claude-code`     | IA de desarrollo (este sistema) |

---

## Herramientas de desarrollo (instalar manualmente)

| Herramienta           | Cómo instalar                              | Para qué se usa                            | Obligatorio  |
| --------------------- | ------------------------------------------ | ------------------------------------------ | ------------ |
| **GitHub CLI (`gh`)** | https://cli.github.com                     | Crear PRs, gestionar issues desde terminal | Recomendado  |
| **Supabase CLI**      | `npm install -g supabase` o `npx supabase` | Migraciones BD, gen tipos, dev local       | Sí (para BD) |

---

## SonarQube — Análisis de calidad de código

SonarQube corre **localmente** via Docker. El archivo `sonar/docker-compose.yml` lo configura todo.

**Arrancar SonarQube (primera vez y en adelante):**

```bash
docker compose -f sonar/docker-compose.yml up -d
# Esperar ~60s, luego abrir: http://localhost:9000
# Credenciales por defecto: admin / admin (cambiar en primer login)
```

**Ejecutar scan:**

```bash
SONAR_TOKEN=xxx bash sonar/run-scan.sh
# El token se genera en: http://localhost:9000 → My Account → Security → Generate Token
```

**Requisito:** Docker Desktop corriendo con al menos 2 GB de RAM asignados (Docker Desktop → Resources).

---

## Herramientas automáticas (se instalan solas con `npm install`)

Estas NO requieren instalación manual — el `postinstall` o `prepare` de npm las gestiona:

| Qué                        | Cómo se activa                           | Notas                                              |
| -------------------------- | ---------------------------------------- | -------------------------------------------------- |
| Todas las dependencias npm | `npm install`                            | Nuxt, Supabase client, Stripe, etc.                |
| Husky git hooks            | `npm install` → script `prepare`         | Pre-commit: ESLint + Prettier                      |
| Policy Engine (compilado)  | `npm install` → script `postinstall`     | Compila `.claude/policy/SECURITY_POLICY.md` → JSON |
| Playwright browsers        | `npx playwright install` (manual, 1 vez) | Necesario para `npm run test:e2e`                  |

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

| Servicio                 | URL                                                         | Para qué                          | Obligatorio dev   |
| ------------------------ | ----------------------------------------------------------- | --------------------------------- | ----------------- |
| **Supabase**             | https://supabase.com/dashboard/project/gmnrfuzekbwyzkgsaftv | BD, auth, storage                 | Sí                |
| **Cloudflare**           | https://dash.cloudflare.com                                 | Deploy, CDN, Workers, Turnstile   | Sí (deploy)       |
| **Stripe**               | https://dashboard.stripe.com                                | Pagos, suscripciones, créditos    | Si tocas pagos    |
| **Resend**               | https://resend.com                                          | Envío de emails transaccionales   | Si tocas emails   |
| **Cloudinary**           | https://cloudinary.com                                      | Pipeline de imágenes              | Si tocas imágenes |
| **GitHub**               | https://github.com/Tank-Iberica/tank-iberica                | Repositorio, PRs, CI/CD           | Sí                |
| **Anthropic API**        | https://console.anthropic.com                               | IA: listing, editorial, contenido | Si tocas IA       |
| **WhatsApp / Meta**      | https://developers.facebook.com                             | Recepción fotos → listing auto    | No (feature opt.) |
| **Quaderno**             | https://quadernoapp.com                                     | Facturación fiscal automática     | No (feature opt.) |
| **Sentry**               | https://sentry.io                                           | Error tracking en producción      | No (solo prod)    |
| **OpenAI** (fallback IA) | https://platform.openai.com                                 | Fallback si falla Anthropic       | No (opcional)     |
| **Google Cloud**         | https://console.cloud.google.com                            | OAuth Google (login social)       | No (feature opt.) |

---

## Generación de claves únicas (una vez por proyecto)

Algunas claves no se obtienen de un servicio externo — se generan localmente una vez y se guardan en `.env`:

**VAPID keys (notificaciones push):**

```bash
npx web-push generate-vapid-keys
# Copia VAPID_PRIVATE_KEY y NUXT_PUBLIC_VAPID_PUBLIC_KEY en .env
```

**CRON_SECRET (protege los endpoints `/api/cron/*`):**

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Copia el resultado en CRON_SECRET en .env
```

---

## Integraciones de código (sin instalación local)

Estas integraciones están **embebidas en el frontend** vía scripts externos o variables de entorno. No requieren instalar nada ni tener cuenta para desarrollar en local — solo importan en producción o al testear esa feature específica. Si la variable está vacía en `.env`, la feature simplemente se desactiva sin romper nada.

| Integración              | Variable de entorno                                         | Para qué                                            |
| ------------------------ | ----------------------------------------------------------- | --------------------------------------------------- |
| **Google AdSense**       | `NUXT_PUBLIC_ADSENSE_ID` + `NUXT_PUBLIC_ADSENSE_SLOT_ID`    | Anuncios display: monetización del catálogo         |
| **Prebid.js**            | `NUXT_PUBLIC_PREBID_ENABLED` + `NUXT_PUBLIC_PREBID_TIMEOUT` | Header bidding: subasta de demanda SSP para los ads |
| **Google Ads**           | `NUXT_PUBLIC_GOOGLE_ADS_ID`                                 | Remarketing y conversiones para campañas SEM        |
| **Cloudflare Turnstile** | `TURNSTILE_SITE_KEY` + `TURNSTILE_SECRET_KEY`               | CAPTCHA invisible en formularios de contacto        |

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
[ ] Docker Desktop instalado (necesario para SonarQube)
[ ] Claude Code CLI instalado (npm install -g @anthropic-ai/claude-code)
[ ] Repositorio clonado
[ ] npm install ejecutado (instala deps + compila policy engine + activa husky)
[ ] .env creado desde .env.example con valores reales
[ ] npx playwright install chromium (si vas a correr tests E2E)
[ ] npx web-push generate-vapid-keys (si tocas push notifications, añadir al .env)
[ ] GitHub CLI instalado (recomendado para operaciones con PRs)
[ ] Acceso a Supabase, Cloudflare, Stripe, Resend, Cloudinary confirmado
[ ] node .claude/policy/policy-status.mjs --brief → debe mostrar ACTIVO
[ ] docker compose -f sonar/docker-compose.yml up -d (si vas a usar SonarQube)
```

---

## Historial de herramientas añadidas

| Fecha      | Herramienta / Sistema             | Quién lo añadió | Notas                                                                                   |
| ---------- | --------------------------------- | --------------- | --------------------------------------------------------------------------------------- |
| 2026-03-14 | Revisión completa del documento   | Claude Code     | Docker/SonarQube, integraciones de código, claves VAPID/CRON, servicios cloud completos |
| 2026-03-03 | Policy Engine (`.claude/policy/`) | Claude Code     | PreToolUse hooks para seguridad. Auto-compila en `npm install`.                         |
| —          | Husky + lint-staged               | —               | Pre-commit hooks ESLint + Prettier                                                      |
| —          | Playwright                        | —               | Tests E2E. Browsers: `npx playwright install chromium`                                  |
| —          | Supabase CLI                      | —               | Migraciones y gen de tipos                                                              |
| —          | SonarQube (Docker)                | —               | Análisis estático de calidad. `sonar/docker-compose.yml`                                |

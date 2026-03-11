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

| Herramienta           | Cómo instalar                              | Para qué se usa                            | Obligatorio          |
| --------------------- | ------------------------------------------ | ------------------------------------------ | -------------------- |
| **GitHub CLI (`gh`)** | https://cli.github.com                     | Crear PRs, gestionar issues desde terminal | Recomendado          |
| **Supabase CLI**      | Windows: `winget install Supabase.CLI` · Linux/WSL: ver sección de acceso remoto | Migraciones BD, gen tipos, dev local | Sí (para BD) |
| **Codex CLI**         | `npm install -g @openai/codex`             | Asistente IA alternativo (OpenAI)          | Opcional             |
| **k6**                | Windows: `winget install k6` · Linux/WSL: ver sección de acceso remoto | Load tests (`npm run test:load`) | Si tocas rendimiento |

---

## Acceso remoto — WSL + tmux + Tailscale + SSH

Permite trabajar desde cualquier dispositivo (p. ej. iPhone con Termius) con sesiones persistentes que sobreviven a desconexiones.

### Requisitos en el PC (Windows, una sola vez)

1. **Tailscale** — `winget install Tailscale.Tailscale` → login → anota tu IP (`100.x.x.x`)
2. **OpenSSH Server** — PowerShell admin: `Add-WindowsCapability -Online -Name OpenSSH.Server~~~~0.0.1.0 && Start-Service sshd && Set-Service sshd -StartupType Automatic`
3. **sshd_config** — `C:\ProgramData\ssh\sshd_config` — añadir **encima** del bloque `Match Group administrators`:
   ```
   PasswordAuthentication no
   AllowUsers <tu_usuario_windows>
   ListenAddress <tu_ip_tailscale>
   ```
4. **Clave SSH** — genera en el cliente (Termius, VS Code, etc.) y copia la clave pública en `C:\ProgramData\ssh\administrators_authorized_keys`. Permisos:
   ```powershell
   icacls C:\ProgramData\ssh\administrators_authorized_keys /inheritance:r /grant "SYSTEM:F" /grant "Administradores:F"
   ```
5. **WSL + Ubuntu** — PowerShell admin: `wsl --install -d Ubuntu`

### Ubuntu — instalación de herramientas (una sola vez)

```bash
# En Ubuntu como root
apt-get install -y tmux git jq python3

# nvm + Node.js 22
curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh -o /tmp/install-nvm.sh
bash /tmp/install-nvm.sh
source ~/.nvm/nvm.sh && nvm install 22

# Claude Code + Codex CLI + Supabase MCP + Prettier
npm install -g @anthropic-ai/claude-code @openai/codex @supabase/mcp-server-supabase prettier

# Supabase CLI (binario — no soporta npm install -g)
curl -fsSL https://github.com/supabase/cli/releases/latest/download/supabase_linux_amd64.tar.gz \
  -o /tmp/supabase.tar.gz && tar -xzf /tmp/supabase.tar.gz -C /usr/local/bin supabase

# k6
curl -fsSL https://dl.k6.io/key.gpg -o /tmp/k6.gpg
gpg --dearmor < /tmp/k6.gpg > /usr/share/keyrings/k6-archive-keyring.gpg
echo 'deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main' \
  > /etc/apt/sources.list.d/k6.list
apt-get update -qq && apt-get install -y k6

# GitHub CLI
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg \
  -o /usr/share/keyrings/githubcli-archive-keyring.gpg
echo 'deb [arch=amd64 signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main' \
  > /etc/apt/sources.list.d/github-cli.list
apt-get update -qq && apt-get install -y gh

# Playwright
npx playwright install --with-deps chromium
```

### Usuario y alias (en Ubuntu, como el usuario Linux)

```bash
# Crear usuario curro
useradd -m -s /bin/bash curro && echo 'curro:<contraseña>' | chpasswd
usermod -aG sudo curro
echo 'curro ALL=(ALL) NOPASSWD:ALL' >> /etc/sudoers

# Usuario por defecto en /etc/wsl.conf
echo -e '[user]\ndefault=curro' > /etc/wsl.conf

# En ~/.bashrc del usuario curro:
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
export TRACCIONA="/mnt/c/TradeBase/Tracciona"
alias tracciona="cd $TRACCIONA"
curro() {
  cd "$TRACCIONA" || return 1
  claude --model opus --append-system-prompt "..." "Inicio de sesion"
}
```

### Flujo diario

```bash
# Desde el cliente SSH (iPhone Termius, etc.):
wsl                        # entrar a Ubuntu
tmux new -s curro          # crear sesión (primera vez)
tmux attach -t curro       # reconectar sesión existente
curro                      # lanzar Claude Code en el proyecto
```

> **Nota:** Los archivos del proyecto (`C:\TradeBase\Tracciona`) son accesibles desde Ubuntu en `/mnt/c/TradeBase/Tracciona`. Docker Desktop también está disponible desde WSL vía integración nativa.

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
| **Supabase (producción)**| https://supabase.com/dashboard/project/gmnrfuzekbwyzkgsaftv | BD, auth, storage                 | Sí                |
| **Supabase (staging)**   | https://supabase.com/dashboard/project/xddjhrgkwwolpugtxgfk | Tests IDOR/RLS (aislado de prod)  | Si tocas seguridad|
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
[ ] Acceso a Supabase (prod + staging), Cloudflare, Stripe, Resend, Cloudinary confirmado
[ ] STAGING_SUPABASE_URL + STAGING_SUPABASE_KEY en .env (si vas a correr tests IDOR)
[ ] node .claude/policy/policy-status.mjs --brief → debe mostrar ACTIVO
[ ] docker compose -f sonar/docker-compose.yml up -d (si vas a usar SonarQube)

### Checklist acceso remoto (opcional, para trabajar desde fuera)
[ ] Tailscale instalado y logueado
[ ] OpenSSH Server instalado y configurado (ListenAddress = IP Tailscale, PasswordAuth off)
[ ] Clave pública en C:\ProgramData\ssh\administrators_authorized_keys con permisos correctos
[ ] WSL + Ubuntu instalado (wsl --install -d Ubuntu)
[ ] Herramientas Ubuntu instaladas (ver sección "Acceso remoto" arriba)
[ ] tmux funcionando (tmux -V)
[ ] curro() en ~/.bashrc del usuario Ubuntu
```

---

## Historial de herramientas añadidas

| Fecha      | Herramienta / Sistema             | Quién lo añadió | Notas                                                                                   |
| ---------- | --------------------------------- | --------------- | --------------------------------------------------------------------------------------- |
| 2026-03-09 | Acceso remoto (WSL+tmux+Tailscale+SSH) | Claude Code | Sesiones persistentes desde iPhone/remoto. Ubuntu con todas las herramientas. Codex CLI añadido. |
| 2026-03-06 | k6 load testing                   | Claude Code     | Load tests en `tests/load/`. `npm run test:load` / `test:load:smoke`. CI: `k6-readiness.yml`. |
| 2026-03-15 | Supabase staging + IDOR tests     | Claude Code     | Proyecto staging (`xddjhrgkwwolpugtxgfk`) para tests IDOR/RLS. Checklist actualizado.   |
| 2026-03-14 | Revisión completa del documento   | Claude Code     | Docker/SonarQube, integraciones de código, claves VAPID/CRON, servicios cloud completos |
| 2026-03-03 | Policy Engine (`.claude/policy/`) | Claude Code     | PreToolUse hooks para seguridad. Auto-compila en `npm install`.                         |
| —          | Husky + lint-staged               | —               | Pre-commit hooks ESLint + Prettier                                                      |
| —          | Playwright                        | —               | Tests E2E. Browsers: `npx playwright install chromium`                                  |
| —          | Supabase CLI                      | —               | Migraciones y gen de tipos                                                              |
| —          | SonarQube (Docker)                | —               | Análisis estático de calidad. `sonar/docker-compose.yml`                                |

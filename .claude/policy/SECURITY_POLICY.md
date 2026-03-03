# Security Policy — Tracciona Claude Code Hooks

# Fuente de verdad para el policy engine. Edita aquí, luego ejecuta:

# node .claude/policy/compile-policy.mjs

#

# DECISIONES: deny | warn | ask (allow es el default implícito)

# PRIORIDAD: menor número = mayor prioridad. Primera coincidencia gana.

# MATCH: command (Bash), path (Write/Edit sobre file_path), content (Write/Edit sobre contenido)

# EXCEPT: si algún patrón except coincide, la regla se salta

#

# Formato de regla:

# ### RULE: nombre-unico

# - tool: Bash|Write|Edit|\*

# - match: command|path|content

# - decision: deny|warn|ask

# - priority: N

# - patterns:

# - regex1

# - except:

# - regex_excepcion

# - reason: Texto legible.

# - suggestion: Alternativa segura (solo para deny).

---

## DENY RULES — Solo lo catastrófico e irrecuperable

### RULE: deny-rm-rf-dangerous

- tool: Bash
- match: command
- decision: deny
- priority: 10
- patterns:
  - rm\s+-[rRf]_f[rR]_\s+/(?!\s)
  - rm\s+-[rRf]_f[rR]_\s+~
  - rm\s+-[rRf]_f[rR]_\s+C:
  - rm\s+-[rRf]_f[rR]_\s+\.(?:\s|$)
- except:
  - node_modules
  - \.output
  - \.nuxt
  - \.cache
  - dist
  - coverage
  - \.tmp
  - \.turbo
- reason: Borrado recursivo en path peligroso (raíz del sistema o directorio actual).
- suggestion: Usa rm -rf sobre directorios de build específicos (node_modules, .output, dist, coverage).

### RULE: deny-git-force-push

- tool: Bash
- match: command
- decision: deny
- priority: 11
- patterns:
  - git\s+push\s+.\*--force(?!-with-lease)
  - git\s+push\s+-f(?:\s|$)
  - git\s+push\s+.\*\s-f(?:\s|$)
- reason: git push --force puede destruir historial remoto y trabajo de otros.
- suggestion: Usa git push --force-with-lease (más seguro) o git push normal.

### RULE: ask-git-discard-changes

- tool: Bash
- match: command
- decision: ask
- priority: 12
- patterns:
  - git\s+reset\s+--hard
  - git\s+clean\s+.\*-f
  - git\s+checkout\s+\.\s\*$
  - git\s+checkout\s+--\s+\.
  - git\s+restore\s+\.\s\*$
  - git\s+restore\s+--source
- reason: Quiero descartar TODOS los cambios no guardados del proyecto y volver al último estado guardado (commiteado). Esto es irreversible — cualquier código que hayas escrito y no hayas commiteado se perderá para siempre. ¿Confirmas?

### RULE: deny-git-add-secrets

- tool: Bash
- match: command
- decision: deny
- priority: 13
- patterns:
  - git\s+add\s+.\*\.env(?!\w)(?!\.example)
  - git\s+add\s+.\*Contratos/
  - git\s+add\s+.\*\.env\.local
  - git\s+add\s+.\*\.env\.production
- reason: Intentando añadir archivos de secretos o contratos legales al staging area.
- suggestion: Usa git add con archivos específicos del proyecto. Nunca incluyas .env ni Contratos/.

### RULE: deny-pipe-remote-exec

- tool: Bash
- match: command
- decision: deny
- priority: 14
- patterns:
  - curl.*\|.*bash
  - curl.*\|.*sh\b
  - curl.*\|.*node
  - wget.*\|.*bash
  - wget.*\|.*sh\b
  - iwr.*\|.*iex
  - Invoke-WebRequest.*\|.*Invoke-Expression
- reason: Pipe de contenido remoto a ejecución directa — vector clásico de ataque de supply chain.
- suggestion: Descarga el script primero, revísalo con cat/less, luego ejecútalo manualmente.

### RULE: deny-disk-format

- tool: Bash
- match: command
- decision: deny
- priority: 15
- patterns:
  - \bmkfs\b
  - \bfdisk\b
  - \bdiskpart\b
  - format\s+[A-Za-z]:
- reason: Comando de formateo de disco — destrucción irreversible de datos.

### RULE: deny-write-contratos

- tool: Write|Edit
- match: path
- decision: deny
- priority: 16
- patterns:
  - Contratos/
  - Contratos\\
- reason: Los documentos legales en Contratos/ no deben ser modificados por IA.
- suggestion: Si necesitas modificar un contrato, hazlo manualmente y con revisión legal.

### RULE: deny-sql-destructive-bash

- tool: Bash
- match: command
- decision: deny
- priority: 17
- patterns:
  - DROP\s+DATABASE
  - DROP\s+TABLE(?!\s+IF\s+EXISTS.\*supabase/migrations)
  - TRUNCATE\s+TABLE(?!.\*supabase/migrations)
  - DELETE\s+FROM\s+\w+\s\*;
  - DELETE\s+FROM\s+\w+\s\*$
- except:
  - IF\s+EXISTS
- reason: SQL destructivo ejecutado directamente en Bash (fuera de archivos de migración).
- suggestion: Usa SQL destructivo solo dentro de archivos en supabase/migrations/ con IF EXISTS.

### RULE: ask-git-no-verify

- tool: Bash
- match: command
- decision: ask
- priority: 18
- patterns:
  - git\s+commit\s+.\*--no-verify
  - git\s+push\s+.\*--no-verify
- reason: Quiero hacer un commit/push saltándome las comprobaciones automáticas de calidad del código (ESLint, Prettier, tests). Normalmente estas comprobaciones existen para evitar subir código con errores. Saltárselas tiene sentido solo si el propio sistema de comprobación está roto (no el código). ¿Confirmas que quieres saltarte las comprobaciones esta vez?

### RULE: deny-dangerous-permissions

- tool: Bash
- match: command
- decision: deny
- priority: 19
- patterns:
  - chmod\s+-R\s+777
  - chmod\s+777
  - icacls.*Everyone.*Full
  - icacls.\*Everyone:F
- reason: Permisos 777 / Full para Everyone son un riesgo de seguridad.
- suggestion: Usa permisos restrictivos (755 para directorios, 644 para archivos).

---

## WARN RULES — Legítimas pero Claude debe auto-verificar

### RULE: warn-git-add-all

- tool: Bash
- match: command
- decision: warn
- priority: 30
- patterns:
  - git\s+add\s+\.\s\*$
  - git\s+add\s+-A
  - git\s+add\s+--all
- reason: ⚠️ Staging masivo de todos los archivos. Verifica que no se incluyan .env, secretos o archivos de Contratos/. Prefiere git add con archivos específicos.

### RULE: warn-write-env-files

- tool: Write|Edit
- match: path
- decision: warn
- priority: 31
- patterns:
  - \.env$
  - \.env\.local$
  - \.env\.development$
  - \.env\.staging$
  - \.env\.production$
- except:
  - \.env\.example
- reason: ⚠️ Modificando archivo de variables de entorno. Verifica que los valores son correctos y no se exponen secretos.

### RULE: warn-sql-in-migrations

- tool: Write|Edit
- match: path
- decision: warn
- priority: 32
- patterns:
  - supabase/migrations/.\*\.(sql|ts)$
- reason: ⚠️ Modificando archivo de migración de BD. Las migraciones que usan DROP/TRUNCATE deben incluir IF EXISTS y ser revisadas.

### RULE: warn-supabase-db-reset

- tool: Bash
- match: command
- decision: warn
- priority: 33
- patterns:
  - supabase\s+db\s+reset
- reason: ⚠️ Reset de base de datos local. Se perderán todos los datos locales. Verifica que es intencional y que tienes seed data.

### RULE: warn-git-branch-delete

- tool: Bash
- match: command
- decision: warn
- priority: 34
- patterns:
  - git\s+branch\s+-D\b
  - git\s+branch\s+-d\b
- reason: ⚠️ Borrando branch de git. Verifica que no tiene trabajo sin mergear o que no es la branch incorrecta.

### RULE: warn-npm-install-new

- tool: Bash
- match: command
- decision: warn
- priority: 35
- patterns:
  - npm\s+install\s+\S+
  - npm\s+i\s+\S+
  - npm\s+add\s+\S+
- except:
  - npm\s+install\s\*$
  - npm\s+install\s+--
  - npm\s+ci
- reason: ⚠️ Instalando nueva dependencia. Verifica que el paquete es legítimo, necesario, y tiene buena reputación antes de añadirlo.

### RULE: warn-production-pattern-in-command

- tool: Bash
- match: command
- decision: warn
- priority: 37
- patterns:
  - sk*live*
  - SUPABASE_SERVICE_ROLE_KEY
  - gmnrfuzekbwyzkgsaftv\.supabase\.co.\*service_role
- reason: ⚠️ Detectado patrón de credencial de producción en comando Bash. Verifica que estás en entorno de desarrollo y no estás ejecutando contra producción.

### RULE: warn-infra-ci-files

- tool: Write|Edit
- match: path
- decision: warn
- priority: 38
- patterns:
  - \.github/workflows/
  - wrangler\.toml$
- reason: ⚠️ Modificando archivo de infraestructura/CI. Los cambios en workflows y configuración de Cloudflare afectan el pipeline de producción. Verifica que los cambios son correctos.

---

## ASK RULES — Solo auto-protección del policy engine

### RULE: ask-policy-engine-files

- tool: Write|Edit
- match: path
- decision: ask
- priority: 5
- patterns:
  - \.claude/policy/
  - \.claude\\policy\\
- reason: Auto-protección: modificar el policy engine requiere supervisión del usuario.

### RULE: ask-claude-settings

- tool: Write|Edit
- match: path
- decision: ask
- priority: 6
- patterns:
  - \.claude/settings\.json$
  - \.claude\\settings\.json$
- reason: Auto-protección: modificar los hooks de Claude Code requiere supervisión del usuario.

---

## PROTECTED_PATHS

# Archivos que nunca deben ser modificados por IA (se convierten en DENY automáticamente)

# Comenta o elimina esta sección si no quieres paths protegidos personalizados.

# - ruta/al/archivo.ts

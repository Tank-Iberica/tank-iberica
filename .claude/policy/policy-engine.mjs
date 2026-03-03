#!/usr/bin/env node
/**
 * policy-engine.mjs
 * PreToolUse hook para Claude Code.
 * Lee JSON de stdin, evalúa contra SECURITY_POLICY, escribe decisión en stdout.
 *
 * Exit codes:
 *   0  → decisión en stdout JSON (allow / warn / ask)
 *   2  → DENY duro (Claude Code bloquea la herramienta)
 *
 * Variables de entorno:
 *   POLICY_BYPASS=1   → allow todo (emergencia)
 *   POLICY_DRY_RUN=1  → evalúa y logea pero siempre allow
 */

import { readFileSync, writeFileSync, existsSync, statSync } from 'fs';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join, normalize } from 'path';

const __dir = dirname(fileURLToPath(import.meta.url));
const compiledPath = join(__dir, 'policy-compiled.json');
const policyPath = join(__dir, 'SECURITY_POLICY.md');
const auditPath = join(__dir, 'policy-audit.log');

// ─── Patrones de secretos para content scan y git preflight ───────────────────
const SECRET_PATTERNS = [
  { re: /sk_live_[A-Za-z0-9]+/, label: 'Stripe live key' },
  { re: /sk-[A-Za-z0-9]{20,}/, label: 'API key (sk-)' },
  { re: /SUPABASE_SERVICE_ROLE[_\s]*[=:]\s*["']?eyJ/, label: 'Supabase service role key' },
  { re: /eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/, label: 'JWT token' },
  { re: /postgresql:\/\/[^@\s]+@[^\s]+/, label: 'PostgreSQL connection string' },
  { re: /mysql:\/\/[^@\s]+@[^\s]+/, label: 'MySQL connection string' },
  { re: /mongodb:\/\/[^@\s]+@[^\s]+/, label: 'MongoDB connection string' },
  { re: /-----BEGIN\s+(?:RSA\s+)?PRIVATE KEY-----/, label: 'Private key block' },
  { re: /ghp_[A-Za-z0-9]{36}/, label: 'GitHub personal access token' },
  { re: /gmnrfuzekbwyzkgsaftv\.supabase\.co.*service_role/, label: 'Supabase production service role' },
];

// ─── Utilidades ───────────────────────────────────────────────────────────────

function normalizePath(p) {
  if (!p) return '';
  return normalize(p).replace(/\\/g, '/');
}

function log(entry) {
  try {
    const line = `${entry}\n`;
    // Rotación: si > 500KB, truncar a últimas 200 líneas
    if (existsSync(auditPath) && statSync(auditPath).size > 512000) {
      const content = readFileSync(auditPath, 'utf8').split('\n');
      writeFileSync(auditPath, content.slice(-200).join('\n') + '\n', 'utf8');
    }
    writeFileSync(auditPath, line, { flag: 'a', encoding: 'utf8' });
  } catch { /* log failure never blocks */ }
}

function auditLog(decision, toolName, ruleName, target, dryRun) {
  const prefix = dryRun ? '[DRY-RUN] ' : '';
  const ts = new Date().toISOString();
  const tgt = String(target ?? '').slice(0, 120).replace(/\n/g, ' ');
  log(`${prefix}[${ts}] DECISION=${decision} TOOL=${toolName} RULE=${ruleName} TARGET="${tgt}"`);
}

function engineErrorLog(toolName, err) {
  const ts = new Date().toISOString();
  log(`[${ts}] [ENGINE-ERROR] tool=${toolName} error="${String(err).slice(0, 200)}"`);
}

// ─── Carga de reglas ──────────────────────────────────────────────────────────

function loadRules() {
  // Si no existe el compilado, intentar auto-compilar desde SECURITY_POLICY.md
  if (!existsSync(compiledPath) && existsSync(policyPath)) {
    try {
      const compilePath = join(__dir, 'compile-policy.mjs');
      execSync(`node "${compilePath}"`, {
        cwd: join(__dir, '..', '..'),
        timeout: 5000,
        stdio: 'ignore',
      });
    } catch { /* si falla la compilación, continuamos con null */ }
  }
  try {
    const data = readFileSync(compiledPath, 'utf8');
    return JSON.parse(data).rules;
  } catch {
    return null;
  }
}

// ─── Evaluación de reglas ─────────────────────────────────────────────────────

function matchesRule(rule, toolName, target, content) {
  // Verificar que el tool coincide
  if (rule.tool !== '*') {
    const tools = rule.tool.split('|').map(t => t.trim());
    if (!tools.includes(toolName)) return false;
  }

  // Elegir qué campo evaluar
  let subject;
  if (rule.match === 'command') subject = target;
  else if (rule.match === 'path') subject = normalizePath(target);
  else if (rule.match === 'content') subject = content ?? '';
  else subject = target;

  if (!subject) return false;

  // Comprobar excepciones primero
  for (const exc of (rule.except ?? [])) {
    try {
      if (new RegExp(exc, 'i').test(subject)) return false;
    } catch { /* invalid regex, skip */ }
  }

  // Comprobar patrones
  for (const pat of (rule.patterns ?? [])) {
    try {
      if (new RegExp(pat, 'i').test(subject)) return true;
    } catch { /* invalid regex, skip */ }
  }

  return false;
}

// ─── Preflight de git push: escanea diff pendiente de push ───────────────────

function gitPushPreflight() {
  try {
    let diff = '';
    try {
      diff = execSync('git diff @{push}..HEAD 2>/dev/null', { encoding: 'utf8', timeout: 3000 });
    } catch {
      try {
        diff = execSync('git diff HEAD~3..HEAD 2>/dev/null', { encoding: 'utf8', timeout: 3000 });
      } catch { return null; }
    }
    if (!diff) return null;
    for (const { re, label } of SECRET_PATTERNS) {
      if (re.test(diff)) return label;
    }
    return null;
  } catch { return null; }
}

// ─── Preflight de git commit: escanea staged diff ─────────────────────────────

function gitCommitPreflight() {
  try {
    const diff = execSync('git diff --cached 2>/dev/null', { encoding: 'utf8', timeout: 2000 });
    if (!diff) return null;
    for (const { re, label } of SECRET_PATTERNS) {
      if (re.test(diff)) return label;
    }
    return null;
  } catch { return null; }
}

// ─── Content scan: busca secretos en contenido de Write/Edit ──────────────────

function contentScan(content, filePath) {
  if (!content) return null;
  // Excepciones: .md, .test.ts, .test.js, .example
  const fp = normalizePath(filePath ?? '');
  if (/\.(md|example)$/.test(fp)) return null;
  if (/\.test\.(ts|js)$/.test(fp)) return null;

  for (const { re, label } of SECRET_PATTERNS) {
    if (re.test(content)) return label;
  }
  // Código peligroso
  if (/\beval\s*\(/.test(content)) return 'eval() usage';
  if (/new\s+Function\s*\(/.test(content)) return 'new Function() usage';
  if (/child_process\s*\.\s*exec\s*\(/.test(content)) return 'child_process.exec() usage';
  return null;
}

// ─── Detección de branch actual ───────────────────────────────────────────────

function getCurrentBranch() {
  try {
    return execSync('git branch --show-current 2>/dev/null', { encoding: 'utf8', timeout: 2000 }).trim();
  } catch { return ''; }
}

// ─── Decisión de warn masivo en Edit ─────────────────────────────────────────

function isLargeEdit(toolInput) {
  const oldStr = toolInput?.old_string ?? '';
  return oldStr.split('\n').length > 100;
}

// ─── Respuestas ───────────────────────────────────────────────────────────────

function respond(decision, reason) {
  const output = {
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: decision,
    },
  };
  if (reason) output.hookSpecificOutput.permissionDecisionReason = reason;
  process.stdout.write(JSON.stringify(output));
}

function deny(reason, suggestion) {
  const msg = suggestion ? `${reason}\n💡 ${suggestion}` : reason;
  process.stderr.write(`\n🚫 POLICY DENY: ${msg}\n`);
  process.exit(2);
}

function allow() {
  respond('allow', '');
  process.exit(0);
}

function warn(reason) {
  respond('allow', reason);
  process.exit(0);
}

function ask(reason) {
  respond('ask', reason);
  process.exit(0);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const bypass = process.env.POLICY_BYPASS === '1';
  const dryRun = process.env.POLICY_DRY_RUN === '1';

  // Leer stdin
  let input;
  try {
    const chunks = [];
    for await (const chunk of process.stdin) chunks.push(chunk);
    input = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    // Sin stdin válido → fail-open silencioso
    allow();
    return;
  }

  const toolName = input.tool_name ?? '';
  const toolInput = input.tool_input ?? {};

  // Bypass de emergencia
  if (bypass) {
    allow();
    return;
  }

  // Dry-run: evalúa pero siempre allow (log con prefijo)
  const isBash = toolName === 'Bash';
  const isWriteEdit = toolName === 'Write' || toolName === 'Edit';

  // Cargar reglas
  let rules;
  try {
    rules = loadRules();
  } catch (err) {
    engineErrorLog(toolName, err);
    // Fail selectivo: Bash → ask, Write/Edit → warn
    if (isBash) {
      ask('⚠️ Policy engine error al cargar reglas. Verifica .claude/policy/ antes de continuar.');
    } else {
      warn('⚠️ Policy engine error (reversible con git). Revisar .claude/policy/policy-audit.log');
    }
    return;
  }

  if (!rules) {
    engineErrorLog(toolName, 'No se pudieron cargar las reglas');
    if (isBash) {
      ask('⚠️ Policy engine sin reglas. Verifica .claude/policy/policy-compiled.json');
    } else {
      warn('⚠️ Policy engine sin reglas. Ejecuta: node .claude/policy/compile-policy.mjs');
    }
    return;
  }

  // Extraer target y contenido según herramienta
  let target = '';
  let content = '';

  if (isBash) {
    target = toolInput.command ?? '';
  } else if (isWriteEdit) {
    target = toolInput.file_path ?? toolInput.path ?? '';
    content = toolInput.content ?? toolInput.new_string ?? '';
  }

  // ─── Checks especiales antes de evaluar reglas ─────────────────────────────

  // D11: Preflight anti-secretos en git push
  if (isBash && /git\s+push(?!\s+--force|\s+-f\b)/.test(target)) {
    const found = gitPushPreflight();
    if (found) {
      if (dryRun) {
        auditLog('deny[dry]', toolName, 'deny-git-push-secrets-preflight', target, true);
        allow();
        return;
      }
      auditLog('deny', toolName, 'deny-git-push-secrets-preflight', target, false);
      deny(
        `Secreto detectado en commits pendientes de push: ${found}`,
        'Elimina o reemplaza el secreto del historial antes de push. Usa git rebase -i o BFG Repo-Cleaner.'
      );
      return;
    }
  }

  // W12: Preflight de secretos en staged (git commit)
  if (isBash && /git\s+commit/.test(target) && !/--no-verify/.test(target)) {
    const found = gitCommitPreflight();
    if (found) {
      if (dryRun) {
        auditLog('warn[dry]', toolName, 'warn-git-commit-secrets-staged', target, true);
        allow();
        return;
      }
      auditLog('warn', toolName, 'warn-git-commit-secrets-staged', target, false);
      warn(`⚠️ Secreto detectado en archivos staged: ${found}. Verifica que no estás commiteando credenciales.`);
      return;
    }
  }

  // W7: Commit directo en main
  if (isBash && /git\s+commit/.test(target)) {
    const branch = getCurrentBranch();
    if (branch === 'main') {
      if (!dryRun) {
        auditLog('warn', toolName, 'warn-commit-on-main', target, false);
        warn('⚠️ Commit directo en branch main. Considera usar una feature branch para este cambio.');
        return;
      }
    }
  }

  // Content scan para Write/Edit
  if (isWriteEdit && content) {
    const found = contentScan(content, target);
    if (found) {
      if (dryRun) {
        auditLog('warn[dry]', toolName, 'warn-content-scan-secret', target, true);
        allow();
        return;
      }
      auditLog('warn', toolName, 'warn-content-scan-secret', target, false);
      warn(`⚠️ Detectado patrón de seguridad en contenido: ${found}. Verifica que no estás escribiendo credenciales en el código.`);
      return;
    }
  }

  // W9: Edit masivo (old_string > 100 líneas)
  if (toolName === 'Edit' && isLargeEdit(toolInput)) {
    if (!dryRun) {
      auditLog('warn', toolName, 'warn-massive-edit', target, false);
      warn(`⚠️ Edit masivo (old_string > 100 líneas) en ${target}. Verifica que el reemplazo es correcto.`);
      return;
    }
  }

  // ─── Evaluación de reglas en orden de prioridad ───────────────────────────

  for (const rule of rules) {
    if (!matchesRule(rule, toolName, target, content)) continue;

    const { decision, reason, suggestion, name } = rule;

    if (dryRun) {
      auditLog(`${decision}[dry]`, toolName, name, target, true);
      allow();
      return;
    }

    if (decision === 'deny') {
      auditLog('deny', toolName, name, target, false);
      deny(reason, suggestion);
      return;
    }

    if (decision === 'warn') {
      auditLog('warn', toolName, name, target, false);
      warn(reason);
      return;
    }

    if (decision === 'ask') {
      auditLog('ask', toolName, name, target, false);
      ask(reason);
      return;
    }
  }

  // Default: ALLOW silencioso
  allow();
}

// ─── Ejecución con manejo de error global ─────────────────────────────────────

main().catch(err => {
  const toolName = 'unknown';
  engineErrorLog(toolName, err);
  // Fail-open (no sabemos qué herramienta era, no queremos bloquear)
  allow();
});

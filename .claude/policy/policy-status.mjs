#!/usr/bin/env node
/**
 * policy-status.mjs
 * Muestra el estado del policy engine y las últimas decisiones.
 * Ejecutar: node .claude/policy/policy-status.mjs
 * Ejecutar (modo brief para startup): node .claude/policy/policy-status.mjs --brief
 */

import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dir = dirname(fileURLToPath(import.meta.url));
const compiledPath = join(__dir, 'policy-compiled.json');
const policyPath = join(__dir, 'SECURITY_POLICY.md');
const auditPath = join(__dir, 'policy-audit.log');

const brief = process.argv.includes('--brief');

// ─── Modo brief: una sola línea para el mensaje de inicio de sesión ───────────
if (brief) {
  const compiledExists = existsSync(compiledPath);
  const bypass = process.env.POLICY_BYPASS === '1';
  const dryRun = process.env.POLICY_DRY_RUN === '1';

  if (!compiledExists) {
    console.log('🔒 Policy Engine: ❌ INACTIVO — policy-compiled.json no encontrado. Ejecuta: node .claude/policy/compile-policy.mjs');
    process.exit(0);
  }

  try {
    const data = JSON.parse(readFileSync(compiledPath, 'utf8'));
    const rules = data.rules ?? [];
    const deny = rules.filter(r => r.decision === 'deny').length;
    const warn = rules.filter(r => r.decision === 'warn').length;
    const ask  = rules.filter(r => r.decision === 'ask').length;
    const compiled = data.version ? data.version.slice(0, 10) : '?';
    const extras = [];
    if (bypass)  extras.push('⚠️ BYPASS ACTIVO');
    if (dryRun)  extras.push('⚠️ DRY-RUN ACTIVO');
    const extraStr = extras.length ? ` · ${extras.join(' · ')}` : '';
    console.log(`🔒 Policy Engine: ✅ ACTIVO — ${rules.length} reglas (${deny} DENY · ${warn} WARN · ${ask} ASK) · compilado ${compiled}${extraStr}`);
  } catch {
    console.log('🔒 Policy Engine: ⚠️ Error leyendo policy-compiled.json — ejecuta: node .claude/policy/compile-policy.mjs');
  }
  process.exit(0);
}

// ─── Modo completo ─────────────────────────────────────────────────────────────
console.log('\n🔒 Policy Engine — Estado\n');

// Estado del engine
const compiledExists = existsSync(compiledPath);
const policyExists = existsSync(policyPath);

console.log('── Archivos ─────────────────────────────────────────────────────────');
console.log(`  SECURITY_POLICY.md:  ${policyExists ? '✅ existe' : '❌ no encontrado'}`);
console.log(`  policy-compiled.json: ${compiledExists ? '✅ existe' : '❌ no encontrado — ejecuta: node .claude/policy/compile-policy.mjs'}`);

if (!compiledExists) {
  console.log('\n⚠️  El engine no tiene reglas compiladas. Ejecuta:');
  console.log('   node .claude/policy/compile-policy.mjs\n');
  process.exit(1);
}

// Reglas compiladas
let rules = [];
try {
  const data = JSON.parse(readFileSync(compiledPath, 'utf8'));
  rules = data.rules ?? [];
  console.log(`\n── Reglas compiladas (${rules.length} total) ─────────────────────────`);
  const byDecision = { deny: [], warn: [], ask: [] };
  for (const r of rules) {
    (byDecision[r.decision] ?? []).push(r.name);
  }
  console.log(`  DENY (${byDecision.deny.length}): ${byDecision.deny.join(', ')}`);
  console.log(`  WARN (${byDecision.warn.length}): ${byDecision.warn.join(', ')}`);
  console.log(`  ASK  (${byDecision.ask.length}): ${byDecision.ask.join(', ')}`);
  console.log(`\n  Compilado: ${data.version ?? 'desconocido'}`);
} catch (err) {
  console.log(`  ❌ Error leyendo policy-compiled.json: ${err.message}`);
}

// Últimas entradas del audit log
console.log('\n── Últimas decisiones (deny/warn/ask) ───────────────────────────────');
if (!existsSync(auditPath)) {
  console.log('  (sin log de auditoría todavía)');
} else {
  try {
    const lines = readFileSync(auditPath, 'utf8')
      .split('\n')
      .filter(l => l.trim())
      .slice(-15);
    if (lines.length === 0) {
      console.log('  (log vacío)');
    } else {
      for (const line of lines) {
        const isDeny = line.includes('DECISION=deny');
        const isAsk = line.includes('DECISION=ask');
        const isWarn = line.includes('DECISION=warn');
        const prefix = isDeny ? '  🚫' : isAsk ? '  ❓' : isWarn ? '  ⚠️ ' : '  ';
        console.log(`${prefix} ${line.slice(0, 120)}`);
      }
    }
  } catch (err) {
    console.log(`  ❌ Error leyendo audit log: ${err.message}`);
  }
}

// Variables de entorno
console.log('\n── Variables de entorno ─────────────────────────────────────────────');
const bypass = process.env.POLICY_BYPASS === '1';
const dryRun = process.env.POLICY_DRY_RUN === '1';
console.log(`  POLICY_BYPASS:  ${bypass ? '⚠️  ACTIVO — engine desactivado' : '✅ inactivo'}`);
console.log(`  POLICY_DRY_RUN: ${dryRun ? '⚠️  ACTIVO — solo logea, no bloquea' : '✅ inactivo'}`);

console.log('\n── Comandos útiles ──────────────────────────────────────────────────');
console.log('  Recompilar reglas:    node .claude/policy/compile-policy.mjs');
console.log('  Ejecutar tests:       node .claude/policy/test-policy.mjs');
console.log('  Ver denials:          grep DENY .claude/policy/policy-audit.log');
console.log('  Bypass emergencia:    POLICY_BYPASS=1 claude (en terminal)');
console.log('  Dry-run:              POLICY_DRY_RUN=1 claude (en terminal)');
console.log();

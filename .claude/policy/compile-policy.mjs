#!/usr/bin/env node
/**
 * compile-policy.mjs
 * Parsea SECURITY_POLICY.md → policy-compiled.json
 * Ejecutar: node .claude/policy/compile-policy.mjs
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dir = dirname(fileURLToPath(import.meta.url));
const policyPath = join(__dir, 'SECURITY_POLICY.md');
const outputPath = join(__dir, 'policy-compiled.json');

function parsePolicy(md) {
  const rules = [];
  const protectedPaths = [];
  const lines = md.split('\n');

  let current = null;
  let inProtectedPaths = false;
  let field = null;

  for (const raw of lines) {
    const line = raw.trim();  // para comparaciones de tokens
    const indent = raw.length - raw.trimStart().length;

    // Sección PROTECTED_PATHS
    if (line === '## PROTECTED_PATHS') {
      if (current) { rules.push(current); current = null; }
      inProtectedPaths = true;
      continue;
    }

    if (inProtectedPaths) {
      if (line.startsWith('## ') || line.startsWith('### RULE:')) {
        inProtectedPaths = false;
      } else if (line.startsWith('- ') && !line.startsWith('- #') && !line.startsWith('- //')) {
        const p = line.slice(2).trim();
        if (p && !p.startsWith('#')) protectedPaths.push(p);
        continue;
      } else {
        continue;
      }
    }

    // Nueva regla
    if (line.startsWith('### RULE:')) {
      if (current) rules.push(current);
      current = {
        name: line.slice(9).trim(),
        tool: '*',
        match: 'command',
        decision: 'allow',
        priority: 50,
        patterns: [],
        except: [],
        reason: '',
        suggestion: '',
      };
      field = null;
      continue;
    }

    if (!current) continue;

    // Items de lista indentados (2+ espacios antes de '- ')
    if (field && indent >= 2 && line.startsWith('- ')) {
      current[field].push(line.slice(2).trim());
      continue;
    }

    // Campos simples (nivel 0, '- campo:')
    if (indent === 0 && line.startsWith('- tool:')) { current.tool = line.slice(7).trim(); field = null; continue; }
    if (indent === 0 && line.startsWith('- match:')) { current.match = line.slice(8).trim(); field = null; continue; }
    if (indent === 0 && line.startsWith('- decision:')) { current.decision = line.slice(11).trim(); field = null; continue; }
    if (indent === 0 && line.startsWith('- priority:')) { current.priority = parseInt(line.slice(11).trim(), 10); field = null; continue; }
    if (indent === 0 && line.startsWith('- reason:')) { current.reason = line.slice(9).trim(); field = null; continue; }
    if (indent === 0 && line.startsWith('- suggestion:')) { current.suggestion = line.slice(13).trim(); field = null; continue; }

    // Campos de lista (nivel 0)
    if (indent === 0 && line === '- patterns:') { field = 'patterns'; continue; }
    if (indent === 0 && line === '- except:') { field = 'except'; continue; }

    // Reset de campo al encontrar otro campo de nivel 0
    if (indent === 0 && line.startsWith('- ')) field = null;
  }

  if (current) rules.push(current);

  // Convertir PROTECTED_PATHS en reglas DENY
  for (const p of protectedPaths) {
    rules.push({
      name: `deny-protected-path-${p.replace(/[^a-z0-9]/gi, '-')}`,
      tool: 'Write|Edit',
      match: 'path',
      decision: 'deny',
      priority: 1,
      patterns: [p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')],
      except: [],
      reason: `Path protegido: ${p} no puede ser modificado por IA.`,
      suggestion: 'Modifica este archivo manualmente.',
    });
  }

  // Ordenar por prioridad
  rules.sort((a, b) => a.priority - b.priority);

  // Compilar patrones a strings (se compilarán a RegExp en el engine)
  return { rules, version: new Date().toISOString(), source: 'SECURITY_POLICY.md' };
}

try {
  const md = readFileSync(policyPath, 'utf8');
  const compiled = parsePolicy(md);
  writeFileSync(outputPath, JSON.stringify(compiled, null, 2), 'utf8');
  console.log(`✅ Compiladas ${compiled.rules.length} reglas → policy-compiled.json`);
  for (const r of compiled.rules) {
    console.log(`   [${r.priority}] ${r.decision.toUpperCase().padEnd(4)} ${r.name}`);
  }
} catch (err) {
  console.error('❌ Error compilando policy:', err.message);
  process.exit(1);
}

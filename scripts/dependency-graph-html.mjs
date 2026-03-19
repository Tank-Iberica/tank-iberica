#!/usr/bin/env node
/**
 * F45 — Interactive Dependency Graph (HTML with Mermaid.js)
 *
 * Extends composable-deps.mjs to generate an interactive HTML page
 * that renders the Mermaid diagram with pan/zoom/filter capabilities.
 *
 * Usage: node scripts/dependency-graph-html.mjs
 * Output: docs/dependency-graph.html
 */

import { readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { resolve, relative } from 'node:path'

const ROOT = resolve(import.meta.dirname, '..')
const COMPOSABLES_DIR = resolve(ROOT, 'app/composables')
const OUTPUT = resolve(ROOT, 'docs/dependency-graph.html')

function getAllFiles(dir) {
  const files = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = resolve(dir, entry.name)
    if (entry.isDirectory()) files.push(...getAllFiles(full))
    else if (entry.name.endsWith('.ts')) files.push(full)
  }
  return files
}

function extractComposableNames(content) {
  const names = []
  const regex = /export\s+(?:function|const)\s+(use[A-Z]\w*)/g
  let match
  while ((match = regex.exec(content)) !== null) names.push(match[1])
  return names
}

function extractDependencies(content, allNames) {
  const deps = new Set()
  for (const name of allNames) {
    if (new RegExp(`\\b${name}\\s*\\(`).test(content)) deps.add(name)
  }
  return [...deps]
}

// Collect composable data
const files = getAllFiles(COMPOSABLES_DIR)
const composableMap = new Map()
const fileExports = new Map()
const allNames = []

for (const file of files) {
  const content = readFileSync(file, 'utf-8')
  const names = extractComposableNames(content)
  fileExports.set(file, names)
  for (const name of names) {
    composableMap.set(name, relative(ROOT, file))
    allNames.push(name)
  }
}

// Build edges
const edges = []
const nodeSet = new Set()
const dirGroups = new Map()

for (const file of files) {
  const content = readFileSync(file, 'utf-8')
  const myNames = fileExports.get(file) || []
  const deps = extractDependencies(content, allNames)
  for (const myName of myNames) {
    const filePath = composableMap.get(myName) || ''
    const parts = filePath.split('/')
    const dir = parts.length > 3 ? parts[2] : 'root'
    if (!dirGroups.has(dir)) dirGroups.set(dir, [])
    if (!dirGroups.get(dir).includes(myName)) dirGroups.get(dir).push(myName)
    for (const dep of deps) {
      if (myNames.includes(dep)) continue
      edges.push([myName, dep])
      nodeSet.add(myName)
      nodeSet.add(dep)
    }
  }
}

// Build Mermaid diagram text
const mermaidLines = ['flowchart LR']
for (const [dir, names] of dirGroups) {
  if (names.length > 1) {
    mermaidLines.push(`  subgraph ${dir}`)
    for (const name of names) mermaidLines.push(`    ${name}`)
    mermaidLines.push('  end')
  }
}
const edgeSet = new Set()
for (const [from, to] of edges) {
  const key = `${from}-->${to}`
  if (!edgeSet.has(key)) {
    edgeSet.add(key)
    mermaidLines.push(`  ${from} --> ${to}`)
  }
}

// Cycle detection
const cycles = []
const adjacency = new Map()
for (const [from, to] of edges) {
  if (!adjacency.has(from)) adjacency.set(from, [])
  adjacency.get(from).push(to)
}
function findCycles(node, visited, path) {
  if (path.includes(node)) {
    cycles.push([...path.slice(path.indexOf(node)), node])
    return
  }
  if (visited.has(node)) return
  visited.add(node)
  path.push(node)
  for (const next of adjacency.get(node) || []) findCycles(next, visited, path)
  path.pop()
}
for (const node of nodeSet) findCycles(node, new Set(), [])

// Build JSON data for interactive features
const graphData = {
  nodes: [...nodeSet].map(n => ({ id: n, group: composableMap.get(n)?.split('/')[2] || 'root' })),
  edges: [...edgeSet].map(e => { const [f, t] = e.split('-->'); return { from: f, to: t } }),
  cycles: cycles.length,
  generated: new Date().toISOString(),
}

// Generate HTML
const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tracciona — Composable Dependency Graph</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Inter, sans-serif; background: #f5f5f5; color: #23424A; }
    .header { background: #23424A; color: white; padding: 16px 24px; display: flex; justify-content: space-between; align-items: center; }
    .header h1 { font-size: 18px; font-weight: 600; }
    .stats { display: flex; gap: 24px; font-size: 14px; }
    .stats span { opacity: 0.8; }
    .stats strong { color: #4ade80; }
    .controls { padding: 12px 24px; background: white; border-bottom: 1px solid #e5e7eb; display: flex; gap: 12px; align-items: center; }
    .controls input { padding: 6px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; width: 300px; }
    .controls select { padding: 6px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; }
    #graph { padding: 24px; overflow: auto; max-height: calc(100vh - 140px); }
    .mermaid { background: white; padding: 24px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .cycles { padding: 12px 24px; background: #fef3cd; color: #856404; font-size: 14px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Composable Dependency Graph</h1>
    <div class="stats">
      <span>Composables: <strong>${allNames.length}</strong></span>
      <span>Dependencies: <strong>${edgeSet.size}</strong></span>
      <span>Modules: <strong>${dirGroups.size}</strong></span>
      <span>Cycles: <strong>${cycles.length}</strong></span>
      <span>Generated: ${new Date().toISOString().slice(0, 10)}</span>
    </div>
  </div>
  ${cycles.length > 0 ? `<div class="cycles">&#9888; ${cycles.length} circular dependencies detected</div>` : ''}
  <div class="controls">
    <input id="filter" type="text" placeholder="Filter composables..." oninput="filterGraph(this.value)">
    <select id="module" onchange="filterModule(this.value)">
      <option value="">All modules</option>
      ${[...dirGroups.keys()].sort().map(d => `<option value="${d}">${d} (${dirGroups.get(d).length})</option>`).join('\n      ')}
    </select>
  </div>
  <div id="graph">
    <pre class="mermaid">
${mermaidLines.join('\n')}
    </pre>
  </div>
  <script type="module">
    import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs';
    mermaid.initialize({ startOnLoad: true, theme: 'neutral', flowchart: { curve: 'basis' } });
  </script>
  <script>
    const graphData = ${JSON.stringify(graphData)};
    function filterGraph(term) {
      const nodes = document.querySelectorAll('.node');
      nodes.forEach(n => {
        const label = n.textContent || '';
        n.style.opacity = !term || label.toLowerCase().includes(term.toLowerCase()) ? '1' : '0.15';
      });
    }
    function filterModule(mod) {
      const nodes = document.querySelectorAll('.node');
      nodes.forEach(n => {
        const label = (n.textContent || '').trim();
        const node = graphData.nodes.find(gn => gn.id === label);
        n.style.opacity = !mod || (node && node.group === mod) ? '1' : '0.15';
      });
    }
  </script>
</body>
</html>`

writeFileSync(OUTPUT, html)
console.log(`Dependency graph generated: ${relative(ROOT, OUTPUT)}`)
console.log(`  ${allNames.length} composables, ${edgeSet.size} edges, ${cycles.length} cycles`)

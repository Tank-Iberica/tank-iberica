#!/usr/bin/env node
/**
 * Composable Dependency Graph Generator
 * Scans all composables and generates a Mermaid diagram showing
 * which composables depend on which others.
 *
 * Usage: node scripts/composable-deps.mjs
 * Output: docs/composable-deps.md (Mermaid flowchart)
 */

import { readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { resolve, relative } from 'node:path'

const ROOT = resolve(import.meta.dirname, '..')
const COMPOSABLES_DIR = resolve(ROOT, 'app/composables')
const OUTPUT = resolve(ROOT, 'docs/composable-deps.md')

function getAllFiles(dir) {
  const files = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = resolve(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...getAllFiles(full))
    } else if (entry.name.endsWith('.ts')) {
      files.push(full)
    }
  }
  return files
}

function extractComposableNames(content) {
  const names = []
  const regex = /export\s+(?:function|const)\s+(use[A-Z]\w*)/g
  let match
  while ((match = regex.exec(content)) !== null) {
    names.push(match[1])
  }
  return names
}

function extractDependencies(content, allComposableNames) {
  const deps = new Set()
  for (const name of allComposableNames) {
    // Check if this composable is called (not just exported)
    const callRegex = new RegExp(`\\b${name}\\s*\\(`, 'g')
    if (callRegex.test(content)) {
      deps.add(name)
    }
  }
  return [...deps]
}

// 1. Collect all composable files and their exports
const files = getAllFiles(COMPOSABLES_DIR)
const composableMap = new Map() // name -> file path
const fileExports = new Map() // file -> [exported names]
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

// 2. For each file, find which other composables it uses
const edges = [] // [from, to]
const nodeSet = new Set()

for (const file of files) {
  const content = readFileSync(file, 'utf-8')
  const myNames = fileExports.get(file) || []
  const deps = extractDependencies(content, allNames)

  for (const myName of myNames) {
    for (const dep of deps) {
      // Don't count self-references
      if (myNames.includes(dep)) continue
      edges.push([myName, dep])
      nodeSet.add(myName)
      nodeSet.add(dep)
    }
  }
}

// 3. Generate Mermaid diagram
const lines = ['# Composable Dependency Graph\n']
lines.push('```mermaid')
lines.push('flowchart LR')

// Group by directory for subgraphs
const dirGroups = new Map()
for (const name of nodeSet) {
  const filePath = composableMap.get(name) || ''
  const parts = filePath.split('/')
  const dir = parts.length > 3 ? parts[2] : 'root'
  if (!dirGroups.has(dir)) dirGroups.set(dir, [])
  dirGroups.get(dir).push(name)
}

for (const [dir, names] of dirGroups) {
  if (names.length > 1) {
    lines.push(`  subgraph ${dir}`)
    for (const name of names) {
      lines.push(`    ${name}`)
    }
    lines.push('  end')
  }
}

// Edges (deduplicated)
const edgeSet = new Set()
for (const [from, to] of edges) {
  const key = `${from}-->${to}`
  if (!edgeSet.has(key)) {
    edgeSet.add(key)
    lines.push(`  ${from} --> ${to}`)
  }
}

lines.push('```\n')
lines.push(`**Generated:** ${new Date().toISOString().split('T')[0]}`)
lines.push(`**Total composables:** ${allNames.length}`)
lines.push(`**Total dependencies:** ${edgeSet.size}`)
lines.push(`**Files scanned:** ${files.length}`)

writeFileSync(OUTPUT, lines.join('\n'))

console.log(`✅ Generated dependency graph: ${relative(ROOT, OUTPUT)}`)
console.log(`   ${allNames.length} composables, ${edgeSet.size} dependencies, ${files.length} files`)

import { readFileSync, existsSync } from 'node:fs'
import { basename } from 'node:path'

const manifest = JSON.parse(readFileSync('tests/pure-utils.manifest.json', 'utf8'))
let missing = 0

for (const util of manifest.utils) {
  const base = basename(util.replace('.ts', ''))
  const candidates = [
    `tests/unit/${base}.test.ts`,
    `tests/unit/server/${base}.test.ts`,
  ]
  if (!candidates.some(existsSync)) {
    console.error(`❌ Sin test: ${util}`)
    missing++
  }
}

if (missing > 0) {
  console.error(`\n${missing} util(s) sin test. Añade el test o actualiza el manifest.`)
  process.exit(1)
}

console.log(`✅ Todos los utils puros tienen test (${manifest.utils.length} verificados)`)

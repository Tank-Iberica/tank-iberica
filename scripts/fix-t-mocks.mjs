import { readFileSync, writeFileSync } from 'node:fs'

// Files that had local $t mock added — revert those additions
// since setup.ts now provides a proper global $t mock
const files = [
  'tests/unit/components/AdminAgendaFormModal.test.ts',
  'tests/unit/components/AdminHeader.test.ts',
  'tests/unit/components/AdminVehicleDeleteModal.test.ts',
  'tests/unit/components/AnunciantesDetailModal.test.ts',
  'tests/unit/components/CaracteristicasDeleteModal.test.ts',
  'tests/unit/components/CaracteristicasFormModal.test.ts',
  'tests/unit/components/NoticiasTable.test.ts',
  'tests/unit/components/SubcategoriasDeleteModal.test.ts',
  'tests/unit/components/SubcategoriasFormModal.test.ts',
  'tests/unit/components/TiposDeleteModal.test.ts',
]

const mockLine = "mocks: { $t: (k: string) => k },"

let fixed = 0
for (const f of files) {
  const path = `C:/TradeBase/Tracciona/${f}`
  let content = readFileSync(path, 'utf8')

  if (!content.includes(mockLine)) {
    console.log('SKIP (no local $t mock found):', f)
    continue
  }

  // Remove the local $t mock that was added by the previous script run
  content = content.replaceAll(`global: { ${mockLine} stubs:`, 'global: { stubs:')
  content = content.replaceAll(`global: { ${mockLine} }`, 'global: {}')

  // Also handle multiline version if it was inserted as a separate line
  content = content.replace(
    new RegExp(`\\n\\s+${mockLine.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\n`, 'g'),
    '\n'
  )

  writeFileSync(path, content, 'utf8')
  console.log('REVERTED:', f)
  fixed++
}
console.log(`\nTotal reverted: ${fixed}`)

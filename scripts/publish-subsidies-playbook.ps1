$ErrorActionPreference = 'Stop'

$src = 'C:\TradeBase\Tracciona\docs\SUBVENCIONES-PLAYBOOK.md'
$dst = 'C:\TradeBase\SUBVENCIONES-PLAYBOOK.md'
$readme = 'C:\TradeBase\README-documental.md'

Copy-Item $src $dst -Force

$text = Get-Content $readme -Raw

if ($text -notmatch 'SUBVENCIONES-PLAYBOOK\.md') {
  $oldRow = '| [DECISIONES-FINANCIERAS.md](DECISIONES-FINANCIERAS.md) | Maestro | Sede, estructura societaria, prioridades, roadmap y orden de ejecución |'
  $newRow = @"
| [DECISIONES-FINANCIERAS.md](DECISIONES-FINANCIERAS.md) | Maestro | Sede, estructura societaria, prioridades, roadmap y orden de ejecución |
| [SUBVENCIONES-PLAYBOOK.md](SUBVENCIONES-PLAYBOOK.md) | Apoyo profundo | Playbook de preparación de expedientes, optimización y evidencia por ayuda |
"@
  $text = $text.Replace($oldRow, $newRow.TrimEnd())

  $oldPdfRow = '- [DECISIONES-FINANCIERAS.pdf](DECISIONES-FINANCIERAS.pdf)'
  $newPdfRow = @"
- [DECISIONES-FINANCIERAS.pdf](DECISIONES-FINANCIERAS.pdf)
- [SUBVENCIONES-PLAYBOOK.pdf](SUBVENCIONES-PLAYBOOK.pdf)
"@
  $text = $text.Replace($oldPdfRow, $newPdfRow.TrimEnd())

  Set-Content -Path $readme -Value $text -Encoding UTF8
}

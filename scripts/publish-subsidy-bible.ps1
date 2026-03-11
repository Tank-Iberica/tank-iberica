$ErrorActionPreference = 'Stop'

$srcRoot = 'C:\TradeBase\Tracciona\docs'
$dstRoot = 'C:\TradeBase'
$srcBibleRoot = Join-Path $srcRoot 'subvenciones-biblia'
$dstBibleRoot = Join-Path $dstRoot 'subvenciones-biblia'
$readme = Join-Path $dstRoot 'README-documental.md'

New-Item -ItemType Directory -Force -Path $dstBibleRoot | Out-Null

Copy-Item (Join-Path $srcRoot 'SUBVENCIONES-BIBLIA.md') (Join-Path $dstRoot 'SUBVENCIONES-BIBLIA.md') -Force
Get-ChildItem -Path $srcBibleRoot -Filter *.md | ForEach-Object {
  Copy-Item $_.FullName (Join-Path $dstBibleRoot $_.Name) -Force
}

$text = Get-Content $readme -Raw

if ($text -notmatch 'SUBVENCIONES-BIBLIA\.md') {
  $needle = '| [SUBVENCIONES-PLAYBOOK.md](SUBVENCIONES-PLAYBOOK.md) | Apoyo profundo | Playbook de preparación de expedientes, optimización y evidencia por ayuda |'
  $insert = @"
| [SUBVENCIONES-PLAYBOOK.md](SUBVENCIONES-PLAYBOOK.md) | Apoyo profundo | Playbook de preparación de expedientes, optimización y evidencia por ayuda |
| [SUBVENCIONES-BIBLIA.md](SUBVENCIONES-BIBLIA.md) | Apoyo monográfico | Biblia modular por ayuda, con tomos individuales de profundidad alta |
"@
  $text = $text.Replace($needle, $insert.TrimEnd())

  $supportNeedle = '| [PLANTILLAS-EXPEDIENTES-PRIORITARIOS.md](PLANTILLAS-EXPEDIENTES-PRIORITARIOS.md) | Plantillas operativas para convertir el foco 2026 en expedientes reales |'
  $supportInsert = @"
| [PLANTILLAS-EXPEDIENTES-PRIORITARIOS.md](PLANTILLAS-EXPEDIENTES-PRIORITARIOS.md) | Plantillas operativas para convertir el foco 2026 en expedientes reales |
| [subvenciones-biblia/12-certificacion-startup.md](subvenciones-biblia/12-certificacion-startup.md) | Tomo monográfico de la certificación startup |
| [subvenciones-biblia/27-irpf-socios.md](subvenciones-biblia/27-irpf-socios.md) | Tomo monográfico de la deducción IRPF socios |
"@
  $text = $text.Replace($supportNeedle, $supportInsert.TrimEnd())

  $pdfNeedle = '- [SUBVENCIONES-PLAYBOOK.pdf](SUBVENCIONES-PLAYBOOK.pdf)'
  $pdfInsert = @"
- [SUBVENCIONES-PLAYBOOK.pdf](SUBVENCIONES-PLAYBOOK.pdf)
- [SUBVENCIONES-BIBLIA.pdf](SUBVENCIONES-BIBLIA.pdf)
- [subvenciones-biblia/12-certificacion-startup.pdf](subvenciones-biblia/12-certificacion-startup.pdf)
- [subvenciones-biblia/27-irpf-socios.pdf](subvenciones-biblia/27-irpf-socios.pdf)
"@
  $text = $text.Replace($pdfNeedle, $pdfInsert.TrimEnd())
}

Set-Content -Path $readme -Value $text -Encoding UTF8

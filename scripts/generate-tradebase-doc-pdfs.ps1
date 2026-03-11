param(
  [string]$SourceRoot = 'C:\TradeBase',
  [string]$BuildDir = 'C:\TradeBase\Tracciona\.pdf-build\rendered'
)

$ErrorActionPreference = 'Stop'

$chromeCandidates = @(
  'C:\Program Files\Google\Chrome\Application\chrome.exe',
  'C:\Program Files (x86)\Google\Chrome\Application\chrome.exe',
  'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe',
  'C:\Program Files\Microsoft\Edge\Application\msedge.exe'
)

$chrome = $chromeCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $chrome) {
  throw 'No se encontro Chrome o Edge para generar PDFs.'
}

New-Item -ItemType Directory -Force -Path $BuildDir | Out-Null
$profileDir = Join-Path $BuildDir 'chrome-profile'
New-Item -ItemType Directory -Force -Path $profileDir | Out-Null

function Convert-ToSlug {
  param([string]$Text)

  $normalized = $Text.Normalize([Text.NormalizationForm]::FormD)
  $builder = New-Object System.Text.StringBuilder
  foreach ($char in $normalized.ToCharArray()) {
    $category = [Globalization.CharUnicodeInfo]::GetUnicodeCategory($char)
    if ($category -ne [Globalization.UnicodeCategory]::NonSpacingMark) {
      [void]$builder.Append($char)
    }
  }

  $slug = $builder.ToString().ToLowerInvariant()
  $slug = [regex]::Replace($slug, '[^a-z0-9]+', '-')
  $slug = $slug.Trim('-')
  return $slug
}

function Get-TocHtml {
  param([string]$Markdown)

  $items = New-Object System.Collections.Generic.List[string]
  foreach ($line in ($Markdown -split "`r?`n")) {
    if ($line -match '^(#{2,3})\s+(.+?)\s*$') {
      $level = $matches[1].Length
      $label = $matches[2].Trim()
      $slug = Convert-ToSlug $label
      $class = if ($level -eq 2) { 'toc-l2' } else { 'toc-l3' }
      $items.Add("<li class='$class'><a href='#$slug'>$label</a></li>")
    }
  }

  if ($items.Count -eq 0) {
    return ''
  }

  return "<ol class='toc'>$($items -join [Environment]::NewLine)</ol>"
}

function Convert-MarkdownBody {
  param([string]$Markdown)

  $converted = ConvertFrom-Markdown -InputObject $Markdown
  return $converted.Html
}

function Get-DocumentHtml {
  param(
    [string]$Title,
    [string]$Subtitle,
    [string]$Markdown,
    [bool]$Compact = $false,
    [bool]$IncludeToc = $true
  )

  $tocHtml = if ($IncludeToc) { Get-TocHtml -Markdown $Markdown } else { '' }
  $bodyHtml = Convert-MarkdownBody -Markdown $Markdown

  if ($Compact) {
    $pageMargin = '8mm 9mm 9mm 9mm'
    $htmlSize = '10.2px'
    $lineHeight = '1.28'
    $coverHtml = @"
  <section class="cover cover-compact">
    <div class="eyebrow">TradeBase</div>
    <h1>$Title</h1>
    <p>$Subtitle</p>
  </section>
"@
    $tocSection = if ($tocHtml) {
      @"
  <section class="toc-wrap toc-inline">
    $tocHtml
  </section>
"@
    } else { '' }
  } else {
    $pageMargin = '11mm 10mm 12mm 10mm'
    $htmlSize = '11.6px'
    $lineHeight = '1.38'
    $coverHtml = @"
  <section class="cover">
    <div class="eyebrow">TradeBase</div>
    <h1>$Title</h1>
    <p>$Subtitle</p>
  </section>
"@
    $tocSection = if ($tocHtml) {
      @"
  <section class="toc-wrap">
    <h2 class="toc-title">Indice</h2>
    $tocHtml
  </section>
"@
    } else { '' }
  }

  return @"
<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>$Title</title>
<style>
@page { size: A4; margin: $pageMargin; }
html { font-size: $htmlSize; }
body {
  font-family: Segoe UI, Arial, sans-serif;
  color: #111;
  line-height: $lineHeight;
  margin: 0;
}
main {
  max-width: 1020px;
  margin: 0 auto;
}
.cover {
  min-height: 236mm;
  display: flex;
  flex-direction: column;
  justify-content: center;
  border-bottom: 2px solid #111;
  page-break-after: always;
}
.cover-compact {
  min-height: auto;
  display: block;
  border-bottom: 2px solid #111;
  padding-bottom: 8px;
  margin-bottom: 8px;
  page-break-after: auto;
}
.eyebrow {
  font-size: 10px;
  letter-spacing: .08em;
  text-transform: uppercase;
  color: #666;
  margin-bottom: 10px;
}
.cover h1 {
  font-size: 30px;
  line-height: 1.08;
  margin: 0 0 10px 0;
}
.cover-compact h1 {
  font-size: 22px;
  line-height: 1.05;
  margin: 4px 0 6px 0;
}
.cover p {
  max-width: 760px;
  color: #333;
  font-size: 13px;
  margin: 0;
}
.toc-wrap {
  page-break-after: always;
}
.toc-inline {
  page-break-after: auto;
}
.toc-title {
  font-size: 22px;
  margin: 0 0 10px 0;
}
.toc {
  margin: 0;
  padding-left: 0;
  list-style: none;
}
.toc-inline .toc {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 14px;
}
.toc li {
  margin: 3px 0;
  break-inside: avoid;
}
.toc-inline li {
  margin: 0;
}
.toc a {
  color: #0b57d0;
  text-decoration: none;
}
.toc-l2 {
  font-weight: 600;
  margin-top: 8px;
}
.toc-l3 {
  padding-left: 14px;
  font-size: 11px;
  color: #333;
}
.toc-inline .toc-l3,
.toc-inline .toc-l2 {
  padding-left: 0;
  margin-top: 0;
  font-size: 9.4px;
}
hr {
  border: 0;
  border-top: 1px solid #d0d7de;
  margin: 16px 0;
}
h1, h2, h3, h4 {
  page-break-after: avoid;
  break-after: avoid-page;
}
h1 {
  font-size: 28px;
  line-height: 1.15;
  margin: 0 0 12px 0;
}
h2 {
  font-size: 20px;
  margin-top: 22px;
  padding-top: 6px;
  border-top: 1px solid #e5e7eb;
}
h3 {
  font-size: 15px;
  margin-top: 16px;
}
h4 {
  font-size: 13px;
  margin-top: 14px;
}
p, li {
  orphans: 3;
  widows: 3;
}
ul, ol {
  padding-left: 18px;
}
blockquote {
  margin: 10px 0;
  padding: 7px 10px;
  border-left: 4px solid #d0d7de;
  color: #333;
  background: #fafafa;
}
a {
  color: #0b57d0;
  text-decoration: none;
}
pre, code {
  font-family: Consolas, 'Courier New', monospace;
}
code {
  background: #f6f8fa;
  padding: 1px 3px;
  border-radius: 4px;
}
pre {
  white-space: pre-wrap;
  word-break: break-word;
  background: #f6f8fa;
  border: 1px solid #d0d7de;
  border-radius: 6px;
  padding: 10px;
  overflow-wrap: anywhere;
}
table {
  border-collapse: collapse;
  width: 100%;
  margin: 10px 0;
  font-size: 10.2px;
  table-layout: fixed;
}
th, td {
  border: 1px solid #d0d7de;
  padding: 5px 6px;
  text-align: left;
  vertical-align: top;
  overflow-wrap: anywhere;
  word-break: break-word;
}
th {
  background: #f3f4f6;
  font-weight: 700;
}
tr:nth-child(even) td {
  background: #fcfcfd;
}
img {
  max-width: 100%;
}
</style>
</head>
<body>
<main>
$coverHtml
$tocSection
  <section class="content">
$bodyHtml
  </section>
</main>
</body>
</html>
"@
}

$documents = @(
  @{
    Input = Join-Path $SourceRoot 'SUBVENCIONES-PLAYBOOK.md'
    Html = Join-Path $BuildDir 'SUBVENCIONES-PLAYBOOK.print.html'
    Pdf = Join-Path $SourceRoot 'SUBVENCIONES-PLAYBOOK.pdf'
    Title = 'TradeBase - Playbook Profundo de Subvenciones'
    Subtitle = 'Documento operativo profundo para revisar, optimizar y preparar expedientes de ayudas uno a uno.'
    Compact = $false
    IncludeToc = $true
  },
  @{
    Input = Join-Path $SourceRoot 'SUBVENCIONES-BIBLIA.md'
    Html = Join-Path $BuildDir 'SUBVENCIONES-BIBLIA.print.html'
    Pdf = Join-Path $SourceRoot 'SUBVENCIONES-BIBLIA.pdf'
    Title = 'TradeBase - Biblia de Subvenciones'
    Subtitle = 'Indice maestro de la capa monografica: un tomo por ayuda, con desarrollo exhaustivo de expediente.'
    Compact = $false
    IncludeToc = $true
  },
  @{
    Input = Join-Path $SourceRoot 'subvenciones-biblia\12-certificacion-startup.md'
    Html = Join-Path $BuildDir '12-certificacion-startup.print.html'
    Pdf = Join-Path $SourceRoot 'subvenciones-biblia\12-certificacion-startup.pdf'
    Title = 'TradeBase - Tomo #12 Certificacion Startup'
    Subtitle = 'Monografia operativa para preparar la certificacion de empresa emergente ante ENISA.'
    Compact = $false
    IncludeToc = $true
  },
  @{
    Input = Join-Path $SourceRoot 'subvenciones-biblia\27-irpf-socios.md'
    Html = Join-Path $BuildDir '27-irpf-socios.print.html'
    Pdf = Join-Path $SourceRoot 'subvenciones-biblia\27-irpf-socios.pdf'
    Title = 'TradeBase - Tomo #27 IRPF Socios'
    Subtitle = 'Monografia fiscal y probatoria para la deduccion por inversion en empresa nueva o de reciente creacion.'
    Compact = $false
    IncludeToc = $true
  },
  @{
    Input = Join-Path $SourceRoot 'PLANTILLAS-EXPEDIENTES-PRIORITARIOS.md'
    Html = Join-Path $BuildDir 'PLANTILLAS-EXPEDIENTES-PRIORITARIOS.print.html'
    Pdf = Join-Path $SourceRoot 'PLANTILLAS-EXPEDIENTES-PRIORITARIOS.pdf'
    Title = 'TradeBase - Plantillas de Expedientes Prioritarios'
    Subtitle = 'Plantillas operativas para preparar los expedientes prioritarios de ayudas y fiscalidad.'
    Compact = $false
    IncludeToc = $true
  },
  @{
    Input = Join-Path $SourceRoot 'SUBVENCIONES.md'
    Html = Join-Path $BuildDir 'SUBVENCIONES.print.html'
    Pdf = Join-Path $SourceRoot 'SUBVENCIONES.pdf'
    Title = 'TradeBase - Subvenciones y Ayudas'
    Subtitle = 'Maestro de referencia de ayudas, metodologia, fichas, compatibilidades y alertas.'
    Compact = $false
    IncludeToc = $true
  },
  @{
    Input = Join-Path $SourceRoot 'PRESUPUESTOS.md'
    Html = Join-Path $BuildDir 'PRESUPUESTOS.print.html'
    Pdf = Join-Path $SourceRoot 'PRESUPUESTOS.pdf'
    Title = 'TradeBase - Presupuestos'
    Subtitle = 'Maestro de costes, tesoreria y lectura de capitalizacion.'
    Compact = $false
    IncludeToc = $true
  },
  @{
    Input = Join-Path $SourceRoot 'DECISIONES-FINANCIERAS.md'
    Html = Join-Path $BuildDir 'DECISIONES-FINANCIERAS.print.html'
    Pdf = Join-Path $SourceRoot 'DECISIONES-FINANCIERAS.pdf'
    Title = 'TradeBase - Decisiones Financieras'
    Subtitle = 'Maestro de decisiones: sede, estructura societaria, roadmap, pools y orden de ejecucion.'
    Compact = $false
    IncludeToc = $true
  },
  @{
    Input = Join-Path $SourceRoot 'README-documental.md'
    Html = Join-Path $BuildDir 'README-documental.print.html'
    Pdf = Join-Path $SourceRoot 'README-documental.pdf'
    Title = 'TradeBase - Mapa Documental'
    Subtitle = 'Mapa general de la arquitectura documental, reglas de uso y flujo de regeneracion.'
    Compact = $false
    IncludeToc = $true
  },
  @{
    Input = Join-Path $SourceRoot 'CONSEJO-MULTI-AI.md'
    Html = Join-Path $BuildDir 'CONSEJO-MULTI-AI.print.html'
    Pdf = Join-Path $SourceRoot 'CONSEJO-MULTI-AI.pdf'
    Title = 'TradeBase - Consejo Multi-AI'
    Subtitle = 'Documento paralelo de producto: sistema de toma de decisiones multiagente, fuera del nucleo financiero principal.'
    Compact = $false
    IncludeToc = $true
  },
  @{
    Input = Join-Path $SourceRoot 'SUBVENCIONES-TANK-IBERICA.md'
    Html = Join-Path $BuildDir 'SUBVENCIONES-TANK-IBERICA.print.html'
    Pdf = Join-Path $SourceRoot 'SUBVENCIONES-TANK-IBERICA.pdf'
    Title = 'Tank Iberica - Subvenciones y Ayudas'
    Subtitle = 'Documento operativo de ayudas, lineas accionables, monitor y descartes para Tank Iberica, S.L.'
    Compact = $false
    IncludeToc = $true
    Required = $false
  },
  @{
    Input = Join-Path $SourceRoot 'SUBVENCIONES-resumen.md'
    Html = Join-Path $BuildDir 'SUBVENCIONES-resumen.print.html'
    Pdf = Join-Path $SourceRoot 'SUBVENCIONES-resumen.pdf'
    Title = 'TradeBase - Subvenciones (Resumen)'
    Subtitle = 'Resumen ejecutivo derivado de SUBVENCIONES.md y DECISIONES-FINANCIERAS.md.'
    Compact = $false
    IncludeToc = $true
  },
  @{
    Input = Join-Path $SourceRoot 'PRESUPUESTOS-resumen.md'
    Html = Join-Path $BuildDir 'PRESUPUESTOS-resumen.print.html'
    Pdf = Join-Path $SourceRoot 'PRESUPUESTOS-resumen.pdf'
    Title = 'TradeBase - Presupuestos (Resumen)'
    Subtitle = 'Resumen ejecutivo derivado de PRESUPUESTOS.md.'
    Compact = $false
    IncludeToc = $true
  },
  @{
    Input = Join-Path $SourceRoot 'TradeBase-dossier-ejecutivo.md'
    Html = Join-Path $BuildDir 'TradeBase-dossier-ejecutivo.print.html'
    Pdf = Join-Path $SourceRoot 'TradeBase-dossier-ejecutivo.pdf'
    Title = 'TradeBase - Dossier Ejecutivo'
    Subtitle = 'Sintesis ejecutiva derivada de los 3 maestros para conversacion con socios o terceros.'
    Compact = $false
    IncludeToc = $true
  },
  @{
    Input = Join-Path $SourceRoot 'TradeBase-one-pager.md'
    Html = Join-Path $BuildDir 'TradeBase-one-pager.print.html'
    Pdf = Join-Path $SourceRoot 'TradeBase-one-pager.pdf'
    Title = 'TradeBase - One Pager'
    Subtitle = 'Hoja corta de decision derivada de los 3 maestros.'
    Compact = $true
    IncludeToc = $true
  }
)

$rendered = New-Object System.Collections.Generic.List[object]

$bibleDir = Join-Path $SourceRoot 'subvenciones-biblia'
if (Test-Path $bibleDir) {
  $bibleDocs = Get-ChildItem -Path $bibleDir -Filter *.md | Sort-Object Name
  foreach ($bibleDoc in $bibleDocs) {
    if ($documents.Input -contains $bibleDoc.FullName) {
      continue
    }

    $baseName = [IO.Path]::GetFileNameWithoutExtension($bibleDoc.Name)
    $titleName = ($baseName -replace '-', ' ').Trim()
    $documents += @{
      Input = $bibleDoc.FullName
      Html = Join-Path $BuildDir "$baseName.print.html"
      Pdf = Join-Path $bibleDir "$baseName.pdf"
      Title = "TradeBase - Biblia de Subvenciones - $titleName"
      Subtitle = 'Tomo monografico de la biblia de subvenciones para desarrollo exhaustivo por linea.'
      Compact = $false
      IncludeToc = $true
    }
  }
}

foreach ($doc in $documents) {
  if (-not (Test-Path $doc.Input)) {
    $required = if ($doc.ContainsKey('Required')) { [bool]$doc.Required } else { $true }
    if ($required) {
      throw "No existe el archivo de entrada: $($doc.Input)"
    }

    Write-Warning "Se omite documento opcional ausente: $($doc.Input)"
    continue
  }

  $markdown = Get-Content $doc.Input -Raw
  $html = Get-DocumentHtml -Title $doc.Title -Subtitle $doc.Subtitle -Markdown $markdown -Compact $doc.Compact -IncludeToc $doc.IncludeToc
  Set-Content -Path $doc.Html -Value $html -Encoding UTF8

  $url = 'file:///' + ($doc.Html -replace '\\', '/')
  & $chrome --headless=new --disable-gpu --disable-crash-reporter --user-data-dir="$profileDir" --no-pdf-header-footer --print-to-pdf="$($doc.Pdf)" $url | Out-Null

  $rendered.Add((Get-Item $doc.Pdf))
}

$rendered | Select-Object Name, Length, LastWriteTime | Format-Table -AutoSize

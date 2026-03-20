$ErrorActionPreference = 'Stop'

$root = 'C:\TradeBase'

# Rutas centralizadas post-migración documental (Bloque 4)
$DocsFinanciero = Join-Path $root 'Proyecto\05-financiero'
$DocsSubvenciones = Join-Path $root 'Proyecto\06-subvenciones'

function Write-Utf8File {
  param(
    [Parameter(Mandatory = $true)][string]$Path,
    [Parameter(Mandatory = $true)][string]$Content
  )

  $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
  [System.IO.File]::WriteAllText($Path, $Content.Trim() + "`r`n", $utf8NoBom)
}

function Apply-Replacements {
  param(
    [Parameter(Mandatory = $true)][string]$Path,
    [Parameter(Mandatory = $true)][array]$Pairs
  )

  $text = Get-Content $Path -Raw
  foreach ($pair in $Pairs) {
    $text = $text.Replace($pair[0], $pair[1])
  }
  Write-Utf8File -Path $Path -Content $text
}

$subvencionesPath = Join-Path $DocsSubvenciones 'SUBVENCIONES.md'
$subvencionesPairs = @(
  @('> **Documento de trabajo · Marzo 2026 · Versión 1.13**', '> **Documento de trabajo · Marzo 2026 · Versión 1.14**'),
  @('**27 lineas de ayuda principales + 9 ayudas/incentivos complementarios', '**27 líneas de ayuda principales + 9 ayudas/incentivos complementarios'),
  @('> **Disclaimer:**', '> **Nota:**'),
  @('dos lineas ayudas digitalizacion seguridad tecnologica pymes', 'dos lineas ayudas digitalizacion seguridad tecnologica pymes'),
  @('Las 9 ayudas e incentivos adicionales (A1-A9) amplian el abanico:', 'Las 9 ayudas e incentivos adicionales (A1-A9) amplían el abanico:'),
  @('Digitalizacion Pymes CyL', 'Digitalización Pymes CyL'),
  @('contratacion indefinida ECYL', 'contratación indefinida ECYL'),
  @('Transicion Justa empresas', 'Transición Justa empresas'),
  @('apoyo de implantacion', 'apoyo de implantación'),
  @('incubacion no dineraria', 'incubación no dineraria'),
  @('> **Version:** 1.13', '> **Versión:** 1.14'),
  @('no acumulacion estatal/CyL', 'no acumulación estatal/CyL'),
  @('derivados explicitos', 'derivados explícitos'),
  @('v1.13: enlace al mapa general README-documental.md)', 'v1.13: enlace al mapa general README-documental.md. v1.14: normalización editorial, terminología y maquetación del maestro.)'),
  @("`r`n> - Mapa general: [README-documental.md](README-documental.md).`r`n---", "`r`n> - Mapa general: [README-documental.md](README-documental.md).`r`n`r`n---")
)

$presupuestosPath = Join-Path $DocsFinanciero 'PRESUPUESTOS.md'
$presupuestosPairs = @(
  @('mantener abierta la via ENISA/IRPF', 'mantener abierta la vía ENISA/IRPF'),
  @('24.000€ aportacion adicional de socios', '24.000€ de aportación adicional de socios'),
  @('sin tension de liquidez', 'sin tensión de liquidez'),
  @('financiacion blanda', 'financiación blanda'),
  @('prefinanciacion', 'prefinanciación'),
  @('ENISA Jovenes Emprendedores', 'ENISA Jóvenes Emprendedores'),
  @('**PRESUPUESTOS.md** responde a la pregunta: "cuanto cuesta operar TradeBase 3 anos".', '**PRESUPUESTOS.md** responde a la pregunta: "cuánto cuesta operar TradeBase 3 años".'),
  @('**SUBVENCIONES.md** responde a la pregunta: "con que estructura financiera conviene arrancar para maximizar ayudas y mantener abierta financiacion blanda".', '**SUBVENCIONES.md** responde a la pregunta: "con qué estructura financiera conviene arrancar para maximizar ayudas y mantener abierta financiación blanda".'),
  @('contradiccion', 'contradicción'),
  @('coste operativo Ano 1', 'coste operativo Año 1'),
  @('Los **30.000€** no significan que el Ano 1', 'Los **30.000€** no significan que el Año 1'),
  @('ejecutar el presupuesto del Ano 1', 'ejecutar el presupuesto del Año 1'),
  @('una operacion ENISA', 'una operación ENISA'),
  @('> **Sintesis operativa:**', '> **Síntesis operativa:**'),
  @('el minimo de caja del Ano 1', 'el mínimo de caja del Año 1'),
  @('sin tensionar la tesoreria', 'sin tensionar la tesorería'),
  @('14.4 bis Reconciliacion con SUBVENCIONES.md', '14.4 bis Reconciliación con SUBVENCIONES.md'),
  @('con que estructura financiera', 'con qué estructura financiera'),
  @('CyL Creacion', 'CyL Creación'),
  @('> Documento de trabajo · Marzo 2026 · Versión 1.4', '> Documento de trabajo · Marzo 2026 · Versión 1.5'),
  @("`r`n---`r`n## 2. RETA", "`r`n`r`n---`r`n`r`n## 2. RETA")
)

$decisionesPath = Join-Path $DocsFinanciero 'DECISIONES-FINANCIERAS.md'
$decisionesPairs = @(
  @('> **Documento de trabajo · Marzo 2026 · Versión 1.4**', '> **Documento de trabajo · Marzo 2026 · Versión 1.5**'),
  @('Certificacion startup', 'Certificación startup'),
  @('Coste operativo Ano 1', 'Coste operativo Año 1'),
  @('Coste total 3 anos', 'Coste total 3 años'),
  @('Minimo operativo puro Ano 1', 'Mínimo operativo puro Año 1'),
  @('Caja comoda Ano 1', 'Caja cómoda Año 1'),
  @('el Ano 1 no “cuesta”', 'el Año 1 no “cuesta”'),
  @('la via ENISA / IRPF', 'la vía ENISA / IRPF'),
  @('simplicidad economica', 'simplicidad económica'),
  @('sin certificacion startup', 'sin certificación startup'),
  @('ambos fundadores validos', 'ambos fundadores válidos'),
  @('techo teorico estatal conjunto', 'techo teórico estatal conjunto'),
  @('interaccion entre certificacion startup', 'interacción entre certificación startup'),
  @('Numero de socios', 'Número de socios'),
  @('una decision maestra', 'una decisión maestra'),
  @('pre-constitucion y Ano 3', 'preconstitución y Año 3'),
  @('Digitalizacion Pymes CyL', 'Digitalización Pymes CyL'),
  @('contratacion indefinida ECYL', 'contratación indefinida ECYL'),
  @('incubacion no dineraria', 'incubación no dineraria'),
  @('no estan incluidos aun en los calculos acumulados', 'no están incluidos aún en los cálculos acumulados'),
  @('contratacion/espacio/negociacion local', 'contratación/espacio/negociación local'),
  @('La metodologia de "Cómo justificar proyectos diferentes" se mantiene en [SUBVENCIONES.md](SUBVENCIONES.md), que sigue siendo el maestro de referencia para catalogo, metodologia y compatibilidades.', 'La metodología de "Cómo justificar proyectos diferentes" se mantiene en [SUBVENCIONES.md](SUBVENCIONES.md), que sigue siendo el maestro de referencia para catálogo, metodología y compatibilidades.'),
  @('`DECIDIDO` | `30.000 EUR FP / 6.000 EUR capital`', '`DECIDIDO` | `30.000€ FP / 6.000€ capital`'),
  @('**30.000 EUR fondos propios / 6.000 EUR capital social**', '**30.000€ de fondos propios / 6.000€ de capital social**'),
  @('Es critica para capturar bien', 'Es crítica para capturar bien'),
  @('## Reconciliacion rapida con PRESUPUESTOS.md', '## Reconciliación rápida con PRESUPUESTOS.md'),
  @('| Coste operativo Año 1 | ~15.000 EUR |', '| Coste operativo Año 1 | ~15.000€ |'),
  @('| Coste total 3 años | ~50.997 EUR |', '| Coste total 3 años | ~50.997€ |'),
  @('| Mínimo operativo puro Año 1 | ~15.313 EUR |', '| Mínimo operativo puro Año 1 | ~15.313€ |'),
  @('| Caja cómoda Año 1 | ~17.800 EUR |', '| Caja cómoda Año 1 | ~17.800€ |'),
  @('| **Estructura recomendada para jugar ayudas** | **30.000 EUR fondos propios / 6.000 EUR capital** |', '| **Estructura recomendada para jugar ayudas** | **30.000€ de fondos propios / 6.000€ de capital** |'),
  @('30.000 EUR. Ese importe', '30.000€. Ese importe'),
  @('0 EUR**', '0€**'),
  @('**15.000 EUR**', '**15.000€**'),
  @('30.000 EUR de fondos propios totales', '30.000€ de fondos propios totales'),
  @('Con certificacion startup', 'Con certificación startup'),
  @('redaccion del reparto 50/50', 'redacción del reparto 50/50'),
  @('clausulas anti-bloqueo', 'cláusulas anti-bloqueo')
)

Apply-Replacements -Path $subvencionesPath -Pairs $subvencionesPairs
Apply-Replacements -Path $presupuestosPath -Pairs $presupuestosPairs
Apply-Replacements -Path $decisionesPath -Pairs $decisionesPairs

foreach ($path in @($subvencionesPath, $presupuestosPath, $decisionesPath)) {
  $text = Get-Content $path -Raw
  $text = $text.Replace("`r`n---`r`n##", "`r`n---`r`n`r`n##")
  $text = $text.Replace("`r`n> - Mapa general: [README-documental.md](README-documental.md).`r`n---", "`r`n> - Mapa general: [README-documental.md](README-documental.md).`r`n`r`n---")
  Write-Utf8File -Path $path -Content $text
}

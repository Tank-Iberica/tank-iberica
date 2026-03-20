$ErrorActionPreference = 'Stop'

$decPath = 'C:\TradeBase\Proyecto\05-financiero\DECISIONES-FINANCIERAS.md'
$summaryPath = 'C:\TradeBase\Proyecto\06-subvenciones\SUBVENCIONES-resumen.md'
$dossierPath = 'C:\TradeBase\Proyecto\05-financiero\derivados\TradeBase-dossier-ejecutivo.md'
$onePagerPath = 'C:\TradeBase\Proyecto\05-financiero\derivados\TradeBase-one-pager.md'

$dec = Get-Content $decPath -Raw
$summary = Get-Content $summaryPath -Raw
$dossier = Get-Content $dossierPath -Raw
$onePager = Get-Content $onePagerPath -Raw

$dec = $dec.Replace('> **Documento de trabajo · Marzo 2026 · Versión 1.8**', '> **Documento de trabajo · Marzo 2026 · Versión 1.9**')

$oldCompact = @"
### Cronograma compacto

| Tramo | Foco |
|---|---|
| Pre-constitución | Sede, escritura, aportaciones, pacto de socios, validación IRPF |
| Q2 2026 | Certificación startup, trazabilidad I+D+i, #4 y primeras líneas de baja fricción |
| Q3-Q4 2026 | Líneas provinciales / Cámara y preparación condicional de MITECO o LEADER |
| 2027 | CampoIndustrial, repetición selectiva de convocatorias y posible ENISA 2 |
| 2028 | Tercera vertical, fiscalidad madura y financiación de crecimiento si hay tracción |
"@

$newCompact = @"
### Plan mensual 2026 — foco operativo

| Mes | Acción prioritaria | Documento / expediente | Responsable |
|---|---|---|---|
| Marzo 2026 | Cerrar sede usable, escritura, cap table `30k/6k`, pacto de socios y validación IRPF | Escritura SL, pacto de socios, [DECISIONES-FINANCIERAS.md](DECISIONES-FINANCIERAS.md) | Socios + gestoría + abogado mercantil |
| Abril 2026 | Constituir la SL, pedir `#12 Certificación startup` y arrancar la trazabilidad de `#24 I+D+i` | Expediente ENISA startup, registro técnico-contable I+D+i | Socios + gestoría + asesoría fiscal |
| Mayo 2026 | Consolidar memoria de innovación y preparar el expediente base de `#4` y `#1` | Memoria de innovación, presupuesto trazable, expediente base ayudas 2026 | Socios |
| Junio 2026 | Presentar `#4` y `#1` si ya están publicadas y activar el bloque cameral si abre ventana 2026 | Solicitudes `#4/#1`, diagnósticos Cámara, alta en `#18` | Socios + Cámara + gestoría |
| Julio 2026 | Ejecutar implantaciones de baja fricción y mantener la evidencia de `#24` | Informes de implantación, archivo técnico y contable | Socios |
| Agosto 2026 | No abrir líneas nuevas salvo publicación clara; ordenar facturas, evidencias y seguimiento | Archivo de justificación, tablero de convocatorias | Socios |
| Septiembre 2026 | Revisar segunda ola de convocatorias y decidir si entra una línea secundaria | Matriz de decisión, expedientes Cámara / provincial si siguen vivos | Socios |
| Octubre 2026 | Si la sede final es elegible, preparar la base territorial de `#21 MITECO` para 2027 | Borrador de memoria territorial y encaje CampoIndustrial | Socios |
| Noviembre 2026 | Cerrar la evidencia anual de `#24 I+D+i` y prevalidar la base para IMV | Memoria técnica anual, horas, gastos y trazabilidad | Socios + asesoría fiscal |
| Diciembre 2026 | Cerrar el año, revisar retorno real y fijar el foco activo 2027 | Cierre documental, actualización de maestros y plan 2027 | Socios |

### Hitos 2027-2028

| Tramo | Foco |
|---|---|
| 2027 | CampoIndustrial, repetición selectiva de convocatorias y posible ENISA 2 |
| 2028 | Tercera vertical, fiscalidad madura y financiación de crecimiento si hay tracción |
"@

if ($dec.Contains($oldCompact)) {
    $dec = $dec.Replace($oldCompact, $newCompact)
} else {
    throw 'No se encontró el bloque "Cronograma compacto" en DECISIONES-FINANCIERAS.md'
}

$summaryAnchor = @"
**Queda fuera del foco base 2026:**

- #21 MITECO hasta cerrar sede elegible y memoria territorial propia
- #2 Hacendera salvo que compense su lógica de matchfunding
- #13 ENISA salvo necesidad real de financiación
- #7 Red Argos Ciber solo si queda capacidad real tras activar el núcleo
"@

$summaryInsert = @"
**Queda fuera del foco base 2026:**

- #21 MITECO hasta cerrar sede elegible y memoria territorial propia
- #2 Hacendera salvo que compense su lógica de matchfunding
- #13 ENISA salvo necesidad real de financiación
- #7 Red Argos Ciber solo si queda capacidad real tras activar el núcleo

**Plan mensual detallado:** vive en [DECISIONES-FINANCIERAS.md](DECISIONES-FINANCIERAS.md), en la sección `Plan mensual 2026 — foco operativo`.
"@

if ($summary.Contains($summaryAnchor) -and -not $summary.Contains('Plan mensual detallado')) {
    $summary = $summary.Replace($summaryAnchor, $summaryInsert)
}

$dossierAnchor = @"
**No entra en el foco base 2026 salvo condición:**

- #21 MITECO: solo con sede elegible y memoria territorial propia
- #2 Hacendera: solo si compensa la lógica de matchfunding
- #13 ENISA: solo si hace falta financiación adicional real
- #7 Red Argos Ciber: secundaria real, pero no por delante del núcleo anterior
"@

$dossierInsert = @"
**No entra en el foco base 2026 salvo condición:**

- #21 MITECO: solo con sede elegible y memoria territorial propia
- #2 Hacendera: solo si compensa la lógica de matchfunding
- #13 ENISA: solo si hace falta financiación adicional real
- #7 Red Argos Ciber: secundaria real, pero no por delante del núcleo anterior

### Plan mensual 2026

| Mes | Acción prioritaria | Documento | Responsable |
|---|---|---|---|
| Marzo | Cerrar sede, escritura, pacto e IRPF | Escritura SL + pacto de socios | Socios + gestoría |
| Abril | Constituir la SL, pedir `#12` y arrancar `#24` | Expediente ENISA startup + trazabilidad I+D+i | Socios + gestoría |
| Mayo | Preparar memoria base de `#4` y `#1` | Presupuesto trazable + expediente de ayuda | Socios |
| Junio | Presentar `#4` y `#1` si ya están publicadas y activar Cámara / `#18` | Solicitudes + diagnósticos | Socios + Cámara |
| Julio | Ejecutar implantaciones y mantener evidencia técnica | Archivo técnico-contable | Socios |
| Agosto | Ordenar seguimiento y no abrir líneas nuevas sin encaje claro | Archivo de justificación | Socios |
| Septiembre | Revisar segunda ola de convocatorias | Matriz de decisión secundaria | Socios |
| Octubre | Preparar la base territorial de `#21` para 2027 si la sede lo permite | Borrador de memoria territorial | Socios |
| Noviembre | Cerrar evidencia anual de `#24` | Memoria técnica anual | Socios + asesoría fiscal |
| Diciembre | Cerrar el año y fijar foco 2027 | Actualización de maestros | Socios |
"@

if ($dossier.Contains($dossierAnchor) -and -not $dossier.Contains('### Plan mensual 2026')) {
    $dossier = $dossier.Replace($dossierAnchor, $dossierInsert)
}

$onePagerAnchor = '- Regla operativa: **trabajar 6 líneas/bloques activos y dejar el resto en vigilancia**'
$onePagerInsert = "- Regla operativa: **trabajar 6 líneas/bloques activos y dejar el resto en vigilancia**`r`n- Plan mensual de ejecución 2026: [DECISIONES-FINANCIERAS.md](DECISIONES-FINANCIERAS.md), sección ``Plan mensual 2026 — foco operativo``"

if ($onePager.Contains($onePagerAnchor) -and -not $onePager.Contains('Plan mensual de ejecución 2026')) {
    $onePager = $onePager.Replace($onePagerAnchor, $onePagerInsert.TrimEnd())
}

Set-Content -Path $decPath -Value $dec -Encoding UTF8
Set-Content -Path $summaryPath -Value $summary -Encoding UTF8
Set-Content -Path $dossierPath -Value $dossier -Encoding UTF8
Set-Content -Path $onePagerPath -Value $onePager -Encoding UTF8

Get-Item $decPath, $summaryPath, $dossierPath, $onePagerPath | Select-Object FullName, Length, LastWriteTime

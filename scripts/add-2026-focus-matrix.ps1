$ErrorActionPreference = 'Stop'

$decPath = 'C:\TradeBase\DECISIONES-FINANCIERAS.md'
$summaryPath = 'C:\TradeBase\SUBVENCIONES-resumen.md'
$dossierPath = 'C:\TradeBase\TradeBase-dossier-ejecutivo.md'
$onePagerPath = 'C:\TradeBase\TradeBase-one-pager.md'

function Set-Utf8NoBom {
  param(
    [Parameter(Mandatory = $true)][string]$Path,
    [Parameter(Mandatory = $true)][string]$Content
  )

  $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
  [System.IO.File]::WriteAllText($Path, $Content, $utf8NoBom)
}

$dec = Get-Content $decPath -Raw
$dec = $dec.Replace('> Regla operativa: **máximo 6-8 líneas activas en 2026**. Si una ayuda exige mucha memoria y el encaje no es claro, se aparca.', '> Regla operativa: **máximo 6 líneas o bloques activos en 2026**. Si una ayuda exige mucha memoria y el encaje no es claro, se aparca o pasa a vigilancia.')
$focusSection = @"
### 6. Matriz final de foco 2026 — 6 líneas activas

> **Criterio:** esto no es el mapa completo de ayudas; es el **foco real de ejecución** para 2026. Todo lo que no entra aquí queda en vigilancia o condicionado a sede, tracción o capacidad operativa adicional.

| Ventana | Línea / bloque activo | Tipo | Motivo de entrada | Salida mínima 2026 |
|---|---|---|---|---|
| Pre-constitución / escritura | **#27 IRPF socios** | Fiscal | Se decide en la constitución; si se estructura mal, se pierde | Escritura y aportación documentadas, coordinadas con gestoría |
| Abril-mayo 2026 | **#12 Certificación startup** | Certificación | Desbloquea IRPF estatal, IS al 15% y mejora el relato institucional | Solicitud ENISA presentada con memoria sólida |
| Abril-diciembre 2026 | **#24 I+D+i** | Fiscal estructural | No depende de convocatoria y se construye desde el día 1 | Registro técnico-contable y base preparada para IMV |
| En cuanto publique 2026 | **#4 Creación Empresas CyL** | Fondo perdido | Es la ayuda de Año 1 con mejor encaje estructural | Memoria + presupuesto + solicitud completa |
| En cuanto publique 2026 | **#1 Plan Emprendedores León** | Fondo perdido | Importe pequeño, baja fricción y buen encaje territorial | Solicitud completa en plazo |
| Q2-Q4 2026 | **Bloque cameral: #8 / #9 / #10 + #18** | Asesoramiento / implantación | Valor práctico alto y coste documental contenido | Diagnósticos, plan de implantación y acompañamiento activados |

**Fuera del foco base 2026, salvo condición expresa:**

- **#7 Red Argos Ciber**: entra solo si queda capacidad real tras activar `#4` y el bloque cameral, o si aparece un hueco claro de ciberseguridad que justifique priorizarla.
- **#21 MITECO**: no entra en el foco base hasta cerrar una **sede elegible** y tener una memoria territorial propia, no un reciclaje de la del Año 1.
- **#2 Hacendera**: se mantiene en vigilancia; solo se activa si compensa de verdad su lógica de `matchfunding`.
- **#13 ENISA**: no entra como línea activa por defecto; se abre solo si hace falta financiación adicional y no como sustituto de disciplina de caja.

"@
$dec = [regex]::Replace(
  $dec,
  '(?s)(> \*\*Revalidación oficial a 10/03/2026:\*\* .*?)\r?\n\r?\n## Análisis de sede — decisión práctica',
  '$1' + "`r`n`r`n" + $focusSection + '## Análisis de sede — decisión práctica'
)
$dec = $dec.Replace('- **#13 ENISA**: no entra como línea activa por defecto; se abre solo si hace falta financiación adicional y no como sustituto de disciplina de caja.' + "`r`n" + '## Análisis de sede — decisión práctica', '- **#13 ENISA**: no entra como línea activa por defecto; se abre solo si hace falta financiación adicional y no como sustituto de disciplina de caja.' + "`r`n`r`n" + '## Análisis de sede — decisión práctica')
$dec = $dec.Replace('Versión 1.7', 'Versión 1.8')
Set-Utf8NoBom -Path $decPath -Content $dec

$summary = Get-Content $summaryPath -Raw
$summary = $summary.Replace('- En 2026 conviene trabajar **máximo 6-8 líneas**, no perseguir todo el mapa.', '- En 2026 conviene trabajar **6 líneas o bloques activos**, no perseguir todo el mapa.')
$summary = $summary.Replace(
"## 6. Líneas condicionales",
@"
## 6. Foco cerrado 2026

| Ventana | Foco activo |
|---|---|
| Pre-constitución | `#27 IRPF socios` |
| Tras constituir | `#12 Certificación startup` |
| Todo el año | `#24 I+D+i` |
| En cuanto abra 2026 | `#4 Creación Empresas CyL` |
| En cuanto abra 2026 | `#1 Plan Emprendedores León` |
| Q2-Q4 | `#8 / #9 / #10 + #18` como bloque cameral de baja fricción |

**Queda fuera del foco base 2026:**

- `#21 MITECO` hasta cerrar sede elegible y memoria territorial propia
- `#2 Hacendera` salvo que compense su lógica de `matchfunding`
- `#13 ENISA` salvo necesidad real de financiación
- `#7 Red Argos Ciber` solo si queda capacidad real tras activar el núcleo

## 7. Líneas condicionales
"@
)
$summary = $summary.Replace('## 7. Cómo leer el retorno', '## 8. Cómo leer el retorno')
$summary = $summary.Replace('## 8. Fuentes oficiales clave', '## 9. Fuentes oficiales clave')
Set-Utf8NoBom -Path $summaryPath -Content $summary

$dossier = Get-Content $dossierPath -Raw
$dossier = $dossier.Replace(
"## 6. Fotografía económica",
@"
## 6. Foco 2026 cerrado

| Ventana | Línea / bloque activo | Motivo |
|---|---|---|
| Pre-constitución | `#27 IRPF socios` | Se decide en la escritura y no se puede corregir bien a posteriori |
| Q2 2026 | `#12 Certificación startup` | Desbloquea la lógica fiscal y refuerza la narrativa institucional |
| Todo 2026 | `#24 I+D+i` | Se construye desde el día 1 y no depende de convocatoria |
| Cuando publique 2026 | `#4 Creación Empresas CyL` | Mejor ayuda de fondo perdido para el Año 1 |
| Cuando publique 2026 | `#1 Plan Emprendedores León` | Pequeña, pero razonablemente capturable |
| Q2-Q4 2026 | `#8 / #9 / #10 + #18` | Bloque cameral de baja fricción y valor práctico alto |

**No entra en el foco base 2026 salvo condición:**

- `#21 MITECO`: solo con sede elegible y memoria territorial propia
- `#2 Hacendera`: solo si compensa la lógica de `matchfunding`
- `#13 ENISA`: solo si hace falta financiación adicional real
- `#7 Red Argos Ciber`: secundaria real, pero no por delante del núcleo anterior

## 7. Fotografía económica
"@
)
$dossier = $dossier.Replace('- En 2026 conviene trabajar **máximo 6-8 líneas reales**.', '- En 2026 conviene trabajar **6 líneas o bloques activos**.')
$dossier = $dossier.Replace('## 7. Riesgos a vigilar', '## 8. Riesgos a vigilar')
$dossier = $dossier.Replace('## 8. Próximo ciclo de decisión', '## 9. Próximo ciclo de decisión')
$dossier = $dossier.Replace('## 9. Documentos soporte', '## 10. Documentos soporte')
$dossier = $dossier.Replace('## 10. Fuentes oficiales clave', '## 11. Fuentes oficiales clave')
Set-Utf8NoBom -Path $dossierPath -Content $dossier

$onePager = Get-Content $onePagerPath -Raw
$onePager = $onePager.Replace(
'- Prioridad alta: `#12 Certificación startup`, `#24 I+D+i`, `#27 IRPF socios`, `#4 Creación Empresas CyL` (última edición oficial verificada en 2025; 2026 pendiente) (última edición oficial verificada en 2025; 2026 pendiente) (última edición oficial verificada en 2025; 2026 pendiente) (última edición oficial verificada en 2025; 2026 pendiente) (última edición oficial verificada en 2025; 2026 pendiente)',
'- Núcleo activo 2026: `#27 IRPF socios`, `#12 Certificación startup`, `#24 I+D+i`, `#4 Creación Empresas CyL`, `#1 Plan Emprendedores León` y bloque `#8 / #9 / #10 + #18`'
)
$onePager = $onePager.Replace(
'- Paquete de baja fricción: `#1 Plan Emprendedores`, `#8 / #9 / #10 Cámaras` y `#18 España Emprende`, sabiendo que varias ediciones verificadas son 2025 y su reedición 2026 sigue pendiente',
'- Fuera del foco base 2026: `#21 MITECO` hasta cerrar sede elegible, `#2 Hacendera` salvo matchfunding bien planteado, `#13 ENISA` solo si hace falta caja y `#7 Red Argos Ciber` solo si sobra capacidad'
)
$onePager = $onePager.Replace(
'- Ayudas condicionales: `#21 MITECO` (solo sede elegible), `A2` (solo `La Robla / Pola`), `A7` (solo `Fresno`)',
'- Ayudas condicionales de sede: `#21 MITECO` (solo sede elegible), `A2` (solo `La Robla / Pola`), `A7` (solo `Fresno`)'
)
$onePager = $onePager.Replace(
'- Regla operativa: **trabajar máximo 6-8 líneas reales en 2026**',
'- Regla operativa: **trabajar 6 líneas/bloques activos y dejar el resto en vigilancia**'
)
Set-Utf8NoBom -Path $onePagerPath -Content $onePager

@($decPath, $summaryPath, $dossierPath, $onePagerPath) | ForEach-Object {
  Write-Output ("{0}`t{1}" -f (Get-Item $_).Length, $_)
}

$ErrorActionPreference = 'Stop'

$path = 'C:\TradeBase\Proyecto\05-financiero\DECISIONES-FINANCIERAS.md'
$text = Get-Content $path -Raw

$text = $text.Replace(
  '> **Documento de trabajo · Marzo 2026 · Versión 1.13**',
  '> **Documento de trabajo · Marzo 2026 · Versión 1.14**'
)

$section = @'
#### Checklist trimestral 2026

| Trimestre | Mejora / frente | Qué debe quedar hecho | Evidencia de cierre | Responsable |
|---|---|---|---|---|
| **Q2 2026** | **#27 IRPF socios** | Escritura, aportaciones y estructura societaria cerradas sin fisuras | Escritura firmada, justificantes de desembolso y cap table | Socios + gestoría |
| **Q2 2026** | **#12 Certificación startup** | Memoria ENISA montada y narrativa de startup tecnológica cerrada | Dossier ENISA, capturas del producto, roadmap y relato de escalabilidad | Socios |
| **Q2 2026** | **#24 I+D+i** | Sistema mínimo de trazabilidad técnica y contable arrancado | Repos ordenados, registro de horas/tareas y clasificación inicial de gastos | Socios + asesoría fiscal |
| **Q2 2026** | **#4 Creación Empresas CyL** | Expediente base preparado para presentar en cuanto abra | Memoria, presupuesto elegible y cronograma listos | Socios |
| **Q2 2026** | **#1 Plan Emprendedores León** | Expediente territorial y de actividad listo | Alta IAE, memoria breve, base de sede en Fresno y presupuesto resumido | Socios + gestoría |
| **Q2 2026** | **Bloque cameral** | Diagnósticos y primera conversación con Cámara activados | Alta/contacto, ficha de necesidades y calendario de implantación | Socios |
| **Q3 2026** | **Producto / mercado** | Motor de valoración más visible, capa dealer y primeras señales de mercado | Demo funcional, backlog, cartas de interés o primeras altas/leads | Socios |
| **Q3 2026** | **Bloque cameral** | Implantaciones de digitalización/ciber/innovación ejecutándose | Informes, entregables o planes de implantación | Socios + Cámara |
| **Q3 2026** | **#24 I+D+i** | Evidencia técnica acumulada sin lagunas | Memoria técnica viva, issues, commits, datasets y gastos trazados | Socios |
| **Q3 2026** | **#4 / #1** | Solicitudes presentadas si ya han abierto | Resguardos de presentación y expediente completo | Socios + gestoría |
| **Q4 2026** | **#24 I+D+i** | Cierre anual ordenado para base fiscal e IMV | Memoria anual, horas consolidadas y base documental cerrada | Socios + asesoría fiscal |
| **Q4 2026** | **#12 / #27** | Validar impacto fiscal real tras constitución y certificación | Revisión con gestoría de deducción esperable y documentación soporte | Socios + gestoría |
| **Q4 2026** | **#21 MITECO** | Decidir si hay base suficiente para abrir expediente propio en siguiente ventana | Memo territorial específica Fresno + presupuesto separado + criterio go/no-go | Socios |

> **Regla de cierre:** una línea no cuenta como “trabajada” porque exista una idea o un borrador. Solo cuenta cuando existe **evidencia documental reutilizable**.

'@

$anchor = "## Análisis de sede — Fresno decidido y alternativas valoradas"

if ($text.Contains('#### Checklist trimestral 2026')) {
  throw 'La checklist trimestral ya existe.'
}

if (-not $text.Contains($anchor)) {
  throw 'No se encontró el ancla de inserción.'
}

$text = $text.Replace($anchor, $section + $anchor)

# Small formatting cleanup around section boundaries.
$text = $text.Replace(
  '> **Criterio práctico:** si una mejora no ayuda al menos a dos de estas líneas, no debería ganar prioridad frente al roadmap normal de producto.' + "`r`n" + '#### Checklist trimestral 2026',
  '> **Criterio práctico:** si una mejora no ayuda al menos a dos de estas líneas, no debería ganar prioridad frente al roadmap normal de producto.' + "`r`n`r`n" + '#### Checklist trimestral 2026'
)

$text = $text.Replace(
  '> **Regla de cierre:** una línea no cuenta como “trabajada” porque exista una idea o un borrador. Solo cuenta cuando existe **evidencia documental reutilizable**.' + "`r`n" + '## Análisis de sede — Fresno decidido y alternativas valoradas',
  '> **Regla de cierre:** una línea no cuenta como “trabajada” porque exista una idea o un borrador. Solo cuenta cuando existe **evidencia documental reutilizable**.' + "`r`n`r`n" + '## Análisis de sede — Fresno decidido y alternativas valoradas'
)

Set-Content -Path $path -Value $text -Encoding UTF8

rg -n "Versión 1\.14|#### Checklist trimestral 2026|Regla de cierre" $path

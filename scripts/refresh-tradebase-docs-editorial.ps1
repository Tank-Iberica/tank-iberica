$ErrorActionPreference = 'Stop'

$root = 'C:\TradeBase'

# Rutas centralizadas post-migración documental (Bloque 4)
$DocsFinanciero = Join-Path $root 'Proyecto\05-financiero'
$DocsSubvenciones = Join-Path $root 'Proyecto\06-subvenciones'
$DocsDerivados = Join-Path $DocsFinanciero 'derivados'
$DocsArchivo = Join-Path $root 'archivo'

function Write-Utf8File {
  param(
    [Parameter(Mandatory = $true)][string]$Path,
    [Parameter(Mandatory = $true)][string]$Content
  )

  $parent = Split-Path -Parent $Path
  if ($parent -and -not (Test-Path $parent)) {
    New-Item -ItemType Directory -Path $parent -Force | Out-Null
  }

  $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
  [System.IO.File]::WriteAllText($Path, $Content.Trim() + "`r`n", $utf8NoBom)
}

function Replace-Block {
  param(
    [Parameter(Mandatory = $true)][string]$Path,
    [Parameter(Mandatory = $true)][string]$Old,
    [Parameter(Mandatory = $true)][string]$New
  )

  $text = Get-Content $Path -Raw
  if (-not $text.Contains($Old)) {
    throw "No se encontró el bloque esperado en $Path"
  }

  $text = $text.Replace($Old, $New)
  Write-Utf8File -Path $Path -Content $text
}

$readmeDoc = @'
# TradeBase - Mapa Documental

> Guía corta para saber qué documento editar, qué documento consultar y qué documentos se regeneran al final de cada ciclo.

## Núcleo principal

| Documento | Tipo | Rol |
|---|---|---|
| [PRESUPUESTOS.md](PRESUPUESTOS.md) | Maestro | Costes, tesorería, OPEX/COGS y lectura de capitalización |
| [SUBVENCIONES.md](SUBVENCIONES.md) | Maestro | Catálogo de ayudas, fichas, metodología, compatibilidades, alertas y fuentes |
| [DECISIONES-FINANCIERAS.md](DECISIONES-FINANCIERAS.md) | Maestro | Sede, estructura societaria, prioridades, roadmap y orden de ejecución |

## Derivados regenerables

| Documento | Rol |
|---|---|
| [PRESUPUESTOS-resumen.md](PRESUPUESTOS-resumen.md) | Resumen ejecutivo de costes y capitalización |
| [SUBVENCIONES-resumen.md](SUBVENCIONES-resumen.md) | Resumen ejecutivo del mapa de ayudas |
| [TradeBase-one-pager.md](TradeBase-one-pager.md) | Síntesis corta para socios, asesoría o terceros |
| [TradeBase-dossier-ejecutivo.md](TradeBase-dossier-ejecutivo.md) | Dossier de decisión y conversación externa |

## Documentos paralelos fuera del núcleo principal

| Documento | Rol |
|---|---|
| [CONSEJO-MULTI-AI.md](CONSEJO-MULTI-AI.md) | Nota de producto paralela sobre un sistema multiagente; no forma parte del núcleo financiero ni del mapa de ayudas |

## Regla de uso

1. Si cambia una cifra de coste, caja o tesorería, se edita primero `PRESUPUESTOS.md`.
2. Si cambia una ayuda, una compatibilidad, una condición o una fuente oficial, se edita primero `SUBVENCIONES.md`.
3. Si cambia una decisión de sede, socios, estructura financiera o prioridad anual, se edita primero `DECISIONES-FINANCIERAS.md`.
4. Los derivados no son fuente de verdad y no deben contener información única.

## Criterio editorial

- Los maestros contienen criterio, detalle y justificación.
- Los derivados sintetizan y ordenan; no deben abrir debates nuevos por su cuenta.
- Cuando una afirmación ejecutiva dependa de una ayuda, una deducción o un precio externo, debe llevar enlace oficial de apoyo.
- El estilo correcto es: una idea por bloque, terminología estable, tablas cortas y lenguaje directo.

## Flujo correcto de trabajo

1. Editar primero el maestro correcto.
2. Revisar si el cambio afecta a otro maestro y reconciliarlo si hace falta.
3. Regenerar derivados Markdown si cambia la narrativa ejecutiva.
4. Regenerar PDFs al final del ciclo.

## Versionado y regeneración

### Cuándo subir versión

- Si cambia el contenido de un maestro de forma sustantiva, se sube versión en ese maestro.
- Si el cambio es solo tipográfico o de maquetación menor, se puede mantener la versión si no altera criterio, cifras ni decisiones.
- Los derivados no necesitan versión propia salvo que se quiera congelar una edición concreta para compartir.

### Cuándo regenerar derivados Markdown

- Si cambia una decisión, una cifra visible en resumen o una narrativa ejecutiva.
- Si cambian fuentes oficiales que sostienen una conclusión externa.
- Si hay duda, se regeneran: son cortos y sale más barato que mantener incoherencias.

### Cuándo regenerar PDFs

- Siempre que cambie un maestro o un derivado que vaya a compartirse.
- Si el cambio es solo interno y nadie va a leer el PDF, se puede posponer.
- Antes de compartir fuera, la regla es simple: PDFs regenerados al final del ciclo.

## Script de generación

Script actual:

- [generate-tradebase-doc-pdfs.ps1](C:/TradeBase/Tracciona/scripts/generate-tradebase-doc-pdfs.ps1)

Uso desde `C:\TradeBase\Tracciona`:

```powershell
C:\Program Files\PowerShell\7\pwsh.exe -File scripts\generate-tradebase-doc-pdfs.ps1
```

## PDFs vigentes

- [PRESUPUESTOS.pdf](PRESUPUESTOS.pdf)
- [SUBVENCIONES.pdf](SUBVENCIONES.pdf)
- [DECISIONES-FINANCIERAS.pdf](DECISIONES-FINANCIERAS.pdf)
- [README-documental.pdf](README-documental.pdf)
- [PRESUPUESTOS-resumen.pdf](PRESUPUESTOS-resumen.pdf)
- [SUBVENCIONES-resumen.pdf](SUBVENCIONES-resumen.pdf)
- [TradeBase-one-pager.pdf](TradeBase-one-pager.pdf)
- [TradeBase-dossier-ejecutivo.pdf](TradeBase-dossier-ejecutivo.pdf)
- [CONSEJO-MULTI-AI.pdf](CONSEJO-MULTI-AI.pdf)

## Estado actual

- Arquitectura principal cerrada en 3 maestros y 4 derivados regenerables.
- `Proyecto CONSEJO.md` queda absorbido por `CONSEJO-MULTI-AI.md` como documento paralelo, fuera del núcleo financiero.
- Los derivados ejecutivos incorporan enlaces oficiales para justificar ayudas, fiscalidad y fuentes base de costes.
'@

$dossier = @'
# TradeBase - Dossier Ejecutivo

> Derivado regenerable a partir de [DECISIONES-FINANCIERAS.md](DECISIONES-FINANCIERAS.md), [SUBVENCIONES.md](SUBVENCIONES.md) y [PRESUPUESTOS.md](PRESUPUESTOS.md). Documento de síntesis para socios, asesoría o conversaciones externas.

## 1. Tesis ejecutiva

TradeBase puede lanzarse con un presupuesto operativo austero, pero si se quiere capturar ayudas con rigor no conviene arrancar con una SL mínima. La lectura correcta hoy es:

- **coste operativo Año 1**: `~15.000 EUR`
- **coste total 3 años**: `~50.997 EUR`
- **estructura financiera recomendada**: **`30.000 EUR` de fondos propios**, con `6.000 EUR` de capital social y `24.000 EUR` de aportación adicional

La diferencia entre coste y capitalización es la base del plan.

## 2. Decisiones cerradas y abiertas

| Tema | Estado | Lectura actual |
|---|---|---|
| Número de socios | `DECIDIDO` | `2 socios` |
| Reparto de socios | `DECIDIDO` | `50/50` |
| Estructura financiera inicial | `DECIDIDO` | `30.000 EUR FP / 6.000 EUR capital` |
| Certificación startup | `DECIDIDO` | prioridad alta tras constituir |
| Sede definitiva | `PENDIENTE` | shortlist real: `Fresno / La Robla / Pola / Santovenia / Onzonilla` |
| Valencia de Don Juan | `DESCARTADO` si se priorizan ayudas | deja fuera `#21 MITECO` mientras siga por encima de 5.000 habitantes |

## 3. Sede: shortlist real

| Opción | Lectura ejecutiva | Subvención 3 años esperable |
|---|---|---:|
| **Fresno de la Vega** | Mejor equilibrio general: `MITECO + Tierra de Campos + relato rural + cercanía razonable` | `38.000-50.000 EUR` |
| **La Robla** | Muy fuerte si se quiere apretar subvención con mejor soporte operativo que Pola | `45.000-60.000 EUR` |
| **Pola de Gordón** | Mayor techo bruto por `MITECO + Transición Justa`, pero con más fricción real | `50.000-70.000 EUR` |
| **Onzonilla** | Mejor base operativa diaria, con menos extras exclusivos | `28.000-38.000 EUR` |
| **Santovenia** | Opción cómoda; mejora a VdDJ, pero con menor upside | `20.000-28.000 EUR` |

**Lectura corta**

- **Fresno** es la mejor combinación de dinero probable, narrativa y cercanía.
- **La Robla** es la opción fuerte si se quiere apretar subvención sin irse a la fricción máxima de Pola.
- **Pola** gana solo si se prioriza techo puro y la operativa no penaliza demasiado.
- **Onzonilla** y **Santovenia** solo ganan si la comodidad pesa más que el upside.
'@

$onePager = @'
# TradeBase - One Pager

> Derivado regenerable a partir de [DECISIONES-FINANCIERAS.md](DECISIONES-FINANCIERAS.md), [SUBVENCIONES.md](SUBVENCIONES.md) y [PRESUPUESTOS.md](PRESUPUESTOS.md). Marzo 2026.

## Tesis

TradeBase puede lanzarse con un presupuesto operativo muy contenido, pero si se quiere capturar ayudas con rigor no conviene arrancar con una SL mínima.

- **coste operativo Año 1**: `~15.000 EUR`
- **coste total 3 años**: `~50.997 EUR`
- **estructura recomendada**: **`30.000 EUR` de fondos propios**, con `6.000 EUR` de capital social y `24.000 EUR` de aportación adicional

## Decisiones cerradas

| Punto | Estado | Lectura actual |
|---|---|---|
| Número de socios | `DECIDIDO` | `2 socios` |
| Reparto de socios | `DECIDIDO` | `50/50` |
| Estructura financiera | `DECIDIDO` | `30.000 EUR FP / 6.000 EUR capital` |
| Certificación startup | `DECIDIDO` | prioridad alta tras constituir |
| VdDJ como sede | `DESCARTADO` si se priorizan ayudas | deja fuera `#21 MITECO` |
| Sede definitiva | `PENDIENTE` | `Fresno / La Robla / Pola / Santovenia / Onzonilla` |
'@

$subvencionesResumen = @'
# TradeBase - Resumen Ejecutivo de Subvenciones

> Derivado regenerable a partir de [SUBVENCIONES.md](SUBVENCIONES.md) y [DECISIONES-FINANCIERAS.md](DECISIONES-FINANCIERAS.md). Documento pensado para lectura ejecutiva rápida.

## 1. Lectura ejecutiva

- Si las subvenciones importan de verdad, **no conviene constituir en Valencia de Don Juan** mientras siga por encima de 5.000 habitantes y deje fuera `#21 MITECO`.
- La **estructura financiera recomendada** para jugar ayudas con seriedad es **`30.000 EUR` de fondos propios**: `6.000 EUR` de capital social y `24.000 EUR` de aportación adicional.
- En 2026 conviene trabajar **máximo 6-8 líneas**, no perseguir todo el mapa.
- Con el reparto acordado, **sin certificación startup el IRPF estatal y CyL es `0 EUR`**. Con certificación startup y ambos fundadores válidos, el techo teórico conjunto es **`15.000 EUR`**.

## 2. Decisiones que ya afectan al mapa

| Tema | Estado | Efecto sobre ayudas |
|---|---|---|
| Número de socios | `DECIDIDO` | `2 socios` |
| Reparto | `DECIDIDO` | `50/50`; la certificación startup pasa a ser clave para el IRPF |
| Fondos propios iniciales | `DECIDIDO` | `30.000 EUR`; mantiene abiertas las líneas serias sin sobredimensionar la SL |
| Sede definitiva | `PENDIENTE` | condiciona `#21 MITECO`, `A2`, `A7` y `A8` |

## 3. Ranking de sede

| Opción | Lectura ejecutiva | Upside subvencional 3 años |
|---|---|---:|
| **Fresno de la Vega** | Mejor equilibrio general: `MITECO + Tierra de Campos + relato rural + cercanía razonable` | `38.000-50.000 EUR` |
| **La Robla** | Muy fuerte si se quiere apretar subvención con más soporte operativo que Pola | `45.000-60.000 EUR` |
| **Pola de Gordón** | Máximo techo bruto por `MITECO + Transición Justa`, pero con más fricción real | `50.000-70.000 EUR` |
| **Onzonilla** | Mejor base operativa diaria, con menos extras exclusivos | `28.000-38.000 EUR` |
| **Santovenia** | Opción cómoda; mejora a VdDJ, pero con menor upside | `20.000-28.000 EUR` |
| **VdDJ** | Solo si se acepta conscientemente perder `MITECO` | `15.000-22.000 EUR` |

## 4. Paquete que sí merece la pena trabajar en 2026

| Prioridad | Línea | Motivo |
|---|---|---|
| Muy alta | `#12 Certificación startup` | Multiplica la lógica fiscal y mejora el relato institucional |
| Muy alta | `#24 I+D+i` | Recurrente, estructural y no dependiente de convocatoria |
| Muy alta | `#27 IRPF socios` | Retorno fuerte si la estructura societaria y fiscal está bien montada |
| Alta | `#4 Creación Empresas CyL` | Principal ayuda de fondo perdido realista del Año 1 |
| Alta | `#1 Plan Emprendedores León` | Importe pequeño, pero con fricción baja |
| Alta | `#8 / #9 / #10 Cámaras + #18 España Emprende` | Valor práctico con carga documental contenida |
| Media | `#2 Hacendera` | Buena si el relato rural está bien armado |
| Media | `#5 ICECYL Digitalización` o `#7 Digital. Pymes CyL` | Elegir una como secundaria real |
'@

$presupuestosResumen = @'
# TradeBase - Resumen Ejecutivo de Presupuestos

> Derivado regenerable a partir de [PRESUPUESTOS.md](PRESUPUESTOS.md) y reconciliado con [DECISIONES-FINANCIERAS.md](DECISIONES-FINANCIERAS.md) para la lectura de capitalización.

## 1. Lectura ejecutiva

- TradeBase no necesita una estructura pesada para operar.
- El coste total de tres años es contenido para un proyecto que cubre producto, operación, contenido, administración y crecimiento comercial básico.
- El error sería confundir el **mínimo para sobrevivir** con la **capitalización recomendable** para jugar ayudas con rigor.

## 2. Fotografía de 3 años

| Magnitud | Importe |
|---|---:|
| Año 1 | `~15.000 EUR` |
| Año 2 | `~16.100 EUR` |
| Año 3 | `~19.900 EUR` |
| **Total 3 años** | **`~50.997 EUR`** |

## 3. Dónde se va el dinero

| Bloque | Total 3 años |
|---|---:|
| Marketing | `~15.490 EUR` |
| Desarrollo (tooling IA) | `~8.850 EUR` |
| Operaciones / administración | `~7.880 EUR` |
| Contingencia 10% | `~4.236 EUR` |
| Legal / GDPR | `~3.750 EUR` |
| Infraestructura SaaS | `~2.196 EUR` |
| APIs de producto (`IA + WhatsApp`) | `~2.123 EUR` |
| Stripe COGS variable | `~4.400 EUR` |
'@

$consejo = @'
# TradeBase - Consejo Multi-AI

> Documento paralelo de producto. No forma parte del núcleo financiero principal formado por [PRESUPUESTOS.md](PRESUPUESTOS.md), [SUBVENCIONES.md](SUBVENCIONES.md) y [DECISIONES-FINANCIERAS.md](DECISIONES-FINANCIERAS.md).

## Estado

| Punto | Estado | Lectura |
|---|---|---|
| Encaje en la arquitectura principal | `FUERA DEL NÚCLEO` | No condiciona presupuesto, subvenciones ni estructura societaria de TradeBase |
| Madurez | `CONCEPTO` | Documento de producto en fase de definición |
| Objetivo | `CLARO` | Diseñar un sistema multiagente para apoyar decisiones complejas |
| Implementación | `PENDIENTE` | Falta validar stack, flujo y coste operativo real |

## Qué es

Un sistema de toma de decisiones con múltiples IAs organizadas en dos niveles:

1. **Consejo general**: roles especializados como CTO, Seguridad, Comercial, Marketing, Finanzas o Legal.
2. **Subconsejos por rol**: cada rol consolida internamente posiciones de varios modelos antes de elevar una respuesta al consejo general.

La idea no es “preguntar a muchos modelos y mezclar texto”, sino **obtener desacuerdo útil, síntesis y trazabilidad**.
'@

$subvencionesUsageOld = @'
## Uso del documento

> **Rol:** maestro de referencia de ayudas.
>
> - Sirve para: catalogo, fichas, tabla maestra, metodologia, compatibilidades, alertas y fuentes.
> - No sirve para: cerrar decisiones ejecutivas de sede, estructura societaria o roadmap.
> - Derivados: [SUBVENCIONES-resumen.md](SUBVENCIONES-resumen.md), [TradeBase-one-pager.md](TradeBase-one-pager.md) y [TradeBase-dossier-ejecutivo.md](TradeBase-dossier-ejecutivo.md) en su parte de ayudas.
> - Para decisiones de ejecucion: [DECISIONES-FINANCIERAS.md](DECISIONES-FINANCIERAS.md). Para costes y tesoreria: [PRESUPUESTOS.md](PRESUPUESTOS.md).
> - Mapa general: [README-documental.md](README-documental.md).
---
'@

$subvencionesUsageNew = @'
## Uso del documento

> **Rol:** maestro de referencia de ayudas.
>
> - Sirve para: catálogo, fichas, tabla maestra, metodología, compatibilidades, alertas y fuentes.
> - No sirve para: cerrar decisiones ejecutivas de sede, estructura societaria o roadmap.
> - Derivados: [SUBVENCIONES-resumen.md](SUBVENCIONES-resumen.md), [TradeBase-one-pager.md](TradeBase-one-pager.md) y [TradeBase-dossier-ejecutivo.md](TradeBase-dossier-ejecutivo.md) en su parte de ayudas.
> - Para decisiones de ejecución: [DECISIONES-FINANCIERAS.md](DECISIONES-FINANCIERAS.md). Para costes y tesorería: [PRESUPUESTOS.md](PRESUPUESTOS.md).
> - Mapa general: [README-documental.md](README-documental.md).

---
'@

$presupuestosUsageOld = @'
## Uso del documento

> **Rol:** maestro de costes y tesoreria.
>
> - Sirve para: presupuesto operativo, lectura de caja minima, OPEX/COGS y capitalizacion recomendada.
> - No sirve para: decidir sede ni mantener el catalogo completo de ayudas.
> - Derivados: [PRESUPUESTOS-resumen.md](PRESUPUESTOS-resumen.md), [TradeBase-one-pager.md](TradeBase-one-pager.md) y [TradeBase-dossier-ejecutivo.md](TradeBase-dossier-ejecutivo.md) en su parte numerica.
> - Mapa general: [README-documental.md](README-documental.md).

---
'@

$presupuestosUsageNew = @'
## Uso del documento

> **Rol:** maestro de costes y tesorería.
>
> - Sirve para: presupuesto operativo, lectura de caja mínima, OPEX/COGS y capitalización recomendada.
> - No sirve para: decidir sede ni mantener el catálogo completo de ayudas.
> - Derivados: [PRESUPUESTOS-resumen.md](PRESUPUESTOS-resumen.md), [TradeBase-one-pager.md](TradeBase-one-pager.md) y [TradeBase-dossier-ejecutivo.md](TradeBase-dossier-ejecutivo.md) en su parte numérica.
> - Mapa general: [README-documental.md](README-documental.md).

---
'@

$decisionesHeaderOld = @'
# TradeBase SL — Decisiones Financieras

> **Documento de trabajo · Marzo 2026 · Version 1.4**
> **Ultima actualizacion:** 10/03/2026
> **Rol:** maestro de decisiones. Este documento concentra lo que TradeBase va a hacer, en que orden y por que.
> **Referencia de ayudas:** [SUBVENCIONES.md](SUBVENCIONES.md)
> **Referencia de costes y tesoreria:** [PRESUPUESTOS.md](PRESUPUESTOS.md)
> **Derivados regenerables:** [TradeBase-one-pager.md](TradeBase-one-pager.md) · [TradeBase-dossier-ejecutivo.md](TradeBase-dossier-ejecutivo.md)
'@

$decisionesHeaderNew = @'
# TradeBase SL — Decisiones Financieras

> **Documento de trabajo · Marzo 2026 · Versión 1.4**
> **Última actualización:** 10/03/2026
> **Rol:** maestro de decisiones. Este documento concentra lo que TradeBase va a hacer, en qué orden y por qué.
> **Referencia de ayudas:** [SUBVENCIONES.md](SUBVENCIONES.md)
> **Referencia de costes y tesorería:** [PRESUPUESTOS.md](PRESUPUESTOS.md)
> **Derivados regenerables:** [TradeBase-one-pager.md](TradeBase-one-pager.md) · [TradeBase-dossier-ejecutivo.md](TradeBase-dossier-ejecutivo.md)
'@

$decisionesUsageOld = @'
## Uso del documento

> **Rol:** maestro de decisiones.
>
> - Sirve para: sede, estructura societaria, roadmap, pools y orden de ejecucion.
> - No sirve para: sustituir el catalogo completo de ayudas ni el presupuesto detallado.
> - Derivados: [TradeBase-one-pager.md](TradeBase-one-pager.md) y [TradeBase-dossier-ejecutivo.md](TradeBase-dossier-ejecutivo.md).
> - Referencias maestras: [SUBVENCIONES.md](SUBVENCIONES.md) para ayudas y [PRESUPUESTOS.md](PRESUPUESTOS.md) para costes y tesoreria.
> - Mapa general: [README-documental.md](README-documental.md).
'@

$decisionesUsageNew = @'
## Uso del documento

> **Rol:** maestro de decisiones.
>
> - Sirve para: sede, estructura societaria, roadmap, pools y orden de ejecución.
> - No sirve para: sustituir el catálogo completo de ayudas ni el presupuesto detallado.
> - Derivados: [TradeBase-one-pager.md](TradeBase-one-pager.md) y [TradeBase-dossier-ejecutivo.md](TradeBase-dossier-ejecutivo.md).
> - Referencias maestras: [SUBVENCIONES.md](SUBVENCIONES.md) para ayudas y [PRESUPUESTOS.md](PRESUPUESTOS.md) para costes y tesorería.
> - Mapa general: [README-documental.md](README-documental.md).
'@

$dossier += @'

## 4. Estructura financiera y societaria

| Magnitud | Valor |
|---|---:|
| Fondos propios recomendados | `30.000 EUR` |
| Capital social recomendado | `6.000 EUR` |
| Aportación adicional | `24.000 EUR` |
| Número de socios | `2` |
| Reparto acordado | `50/50` |

**Lectura**

- `15k-18k` describen el mínimo para sobrevivir el Año 1.
- `30k` describen la estructura correcta para jugar ayudas con rigor, prefinanciar convocatorias y mantener abierta la vía ENISA/IRPF.
- Con el reparto acordado, **sin certificación startup el IRPF estatal y CyL es `0 EUR`**.
- Con certificación startup y ambos fundadores válidos, el techo teórico conjunto del IRPF estatal es **`15.000 EUR`**.

## 5. Prioridades de ayudas 2026

| Prioridad | Línea | Motivo |
|---|---|---|
| Muy alta | `#12 Certificación startup` | Multiplica la lógica fiscal y mejora el relato institucional |
| Muy alta | `#24 I+D+i` | Recurrente, estructural y no dependiente de convocatoria |
| Muy alta | `#27 IRPF socios` | Retorno fuerte si la estructura societaria y fiscal está bien montada |
| Alta | `#4 Creación Empresas CyL` | Principal ayuda de fondo perdido realista del Año 1 |
| Alta | `#1 Plan Emprendedores León` | Importe pequeño, pero con fricción baja |
| Alta | `#8 / #9 / #10 Cámaras + #18 España Emprende` | Valor práctico con carga documental contenida |
| Condicional | `#21 MITECO` | Solo tiene sentido con sede elegible y un proyecto bien separado |
| Condicional | `A2 / A7 / A8 / A9` | Activación según sede final y encaje real |

**Regla operativa**

- En 2026 conviene trabajar **máximo 6-8 líneas reales**.
- El error sería perseguir todo el mapa a la vez.

## 6. Fotografía económica

| Magnitud | Importe |
|---|---:|
| Coste operativo Año 1 | `~15.000 EUR` |
| Coste total 3 años | `~50.997 EUR` |
| OPEX fijo sin Stripe | `~46.597 EUR` |
| Stripe como COGS variable | `~4.400 EUR` |
| Mínimo operativo puro Año 1 | `~15.313 EUR` |
| Caja cómoda Año 1 | `~17.800 EUR` |

## 7. Riesgos a vigilar

- **Sede sin espacio real**: una buena sede en Excel no sirve si no hay espacio utilizable, conectividad o implantación defendible.
- **Exceso de líneas activas**: perseguir demasiadas convocatorias degrada foco y ejecución.
- **IRPF mal interpretado**: con `50/50` la certificación startup no es un bonus; es una pieza crítica.
- **Confusión entre coste y capitalización**: el negocio no “cuesta” `30k` el Año 1; esa cifra es estructura financiera, no gasto operativo.

## 8. Próximo ciclo de decisión

1. Cerrar sede definitiva con criterio operativo, no solo subvencional.
2. Preparar escritura y pacto de socios coherentes con `50/50`.
3. Constituir la SL con `30.000 EUR` de fondos propios totales.
4. Activar certificación startup y paquete 2026 de ayudas de baja fricción.

## 9. Documentos soporte

- [DECISIONES-FINANCIERAS.md](DECISIONES-FINANCIERAS.md)
- [SUBVENCIONES.md](SUBVENCIONES.md)
- [PRESUPUESTOS.md](PRESUPUESTOS.md)
- [README-documental.md](README-documental.md)

## 10. Fuentes oficiales clave

- [ENISA - Certificación startup](https://www.enisa.es/es/certifica-tu-startup/faqs)
- [ENISA - Jóvenes Emprendedores](https://www.enisa.es/es/financia-tu-empresa/lineas-de-financiacion/d/jovenes-emprendedores)
- [AEAT - Deducción por inversión en empresas de nueva creación](https://sede.agenciatributaria.gob.es/Sede/Ayuda/24Presentacion/100/9_2.html)
- [Junta de Castilla y León - Tramitación electrónica](https://www.tramitacastillayleon.jcyl.es/)
- [Diputación de León - Ayudas y subvenciones](https://www.dipuleon.es/anuncios-y-convocatorias/ayudas-y-subvenciones/)
- [Cámara de Comercio de León](https://www.camaraleon.com/)
- [MITECO - Convocatoria oficial 2025 para proyectos innovadores de transformación territorial](https://www.miteco.gob.es/es/prensa/ultimas-noticias/2025/diciembre/miteco-convoca-ayudas-por-valor-de-52-millones-de-euros-para-fin.html)
- [Instituto para la Transición Justa](https://www.transicionjusta.gob.es/es/)
- [INCIBE - Emprendimiento](https://www.incibe.es/emprendimiento)
'@

$onePager += @'

## Sede

| Opción | Lectura |
|---|---|
| **Fresno de la Vega** | Mejor equilibrio general: `MITECO + Tierra de Campos + relato rural + cercanía razonable` |
| **La Robla** | Opción fuerte si se quiere apretar subvención con mejor soporte operativo que Pola |
| **Pola de Gordón** | Mayor techo bruto, pero con más fricción real |
| **Onzonilla / Santovenia** | Más cómodas, pero con menor upside |

## Ayudas 2026

- Prioridad alta: `#12 Certificación startup`, `#24 I+D+i`, `#27 IRPF socios`, `#4 Creación Empresas CyL`
- Paquete de baja fricción: `#1 Plan Emprendedores`, `#8 / #9 / #10 Cámaras`, `#18 España Emprende`
- Ayudas condicionales: `#21 MITECO` (solo sede elegible), `A2` (solo `La Robla / Pola`), `A7` (solo `Fresno`)
- Regla operativa: **trabajar máximo 6-8 líneas reales en 2026**

## Números clave

| Magnitud | Importe |
|---|---:|
| OPEX fijo sin Stripe | `~46.597 EUR` |
| Total con Stripe | `~50.997 EUR` |
| Mínimo operativo puro Año 1 | `~15.313 EUR` |
| Caja cómoda Año 1 | `~17.800 EUR` |
| **Estructura correcta para jugar ayudas** | **`30.000 EUR`** |

## Soporte documental y fuentes oficiales

- Maestros: [DECISIONES-FINANCIERAS.md](DECISIONES-FINANCIERAS.md), [SUBVENCIONES.md](SUBVENCIONES.md), [PRESUPUESTOS.md](PRESUPUESTOS.md)
- ENISA: [certificación startup](https://www.enisa.es/es/certifica-tu-startup/faqs) · [Jóvenes Emprendedores](https://www.enisa.es/es/financia-tu-empresa/lineas-de-financiacion/d/jovenes-emprendedores)
- AEAT: [deducción por inversión en empresas de nueva creación](https://sede.agenciatributaria.gob.es/Sede/Ayuda/24Presentacion/100/9_2.html)
- JCyL: [tramitación electrónica](https://www.tramitacastillayleon.jcyl.es/)
'@

$subvencionesResumen += @'

## 5. Líneas condicionales

- `#21 MITECO`: solo con sede final en municipio `<5.000` habitantes.
- `A2 Transición Justa`: solo en **La Robla / Pola de Gordón**.
- `A7 Tierra de Campos`: diferencial territorial de **Fresno de la Vega**.
- `A8 Centro de Empresas`: solo tiene sentido en **La Robla**.
- `A9 FELE INCIBE Emprende`: ayuda no dineraria; premio potencial de `3.000 EUR` si el relato de ciberseguridad es defendible.
- `#13 ENISA`: solo si realmente hace falta financiación y se mantiene coherencia con fondos propios.

## 6. Cómo leer el retorno

| Capa | Conservador | Optimista |
|---|---:|---:|
| Fondo perdido | `2.700 EUR` | `36.332 EUR` |
| Fiscal (`IRPF + I+D+i + Patent Box`) | `4.619 EUR` | `30.853 EUR` |
| Préstamos blandos | `20.000 EUR` | `1.875.000 EUR` |
| Asesoramiento (valor) | `21.000 EUR` | `38.500 EUR` |
| **Efectivo directo (`fondo perdido + fiscal`)** | **`7.319 EUR`** | **`67.185 EUR`** |

**Lectura correcta**

- El dinero verdaderamente comparable con gasto es **fondo perdido + fiscal**.
- Los préstamos no son retorno; son capacidad de financiación.
- El caso central realista está bastante por debajo del techo optimista.

## 7. Fuentes oficiales clave

- [ENISA - Certificación startup](https://www.enisa.es/es/certifica-tu-startup/faqs)
- [ENISA - Jóvenes Emprendedores](https://www.enisa.es/es/financia-tu-empresa/lineas-de-financiacion/d/jovenes-emprendedores)
- [AEAT - Deducción por inversión en empresas de nueva creación](https://sede.agenciatributaria.gob.es/Sede/Ayuda/24Presentacion/100/9_2.html)
- [Junta de Castilla y León - Tramitación electrónica](https://www.tramitacastillayleon.jcyl.es/)
- [Diputación de León - Ayudas y subvenciones](https://www.dipuleon.es/anuncios-y-convocatorias/ayudas-y-subvenciones/)
- [Cámara de Comercio de León](https://www.camaraleon.com/)
- [MITECO - Convocatoria oficial 2025 para proyectos innovadores de transformación territorial](https://www.miteco.gob.es/es/prensa/ultimas-noticias/2025/diciembre/miteco-convoca-ayudas-por-valor-de-52-millones-de-euros-para-fin.html)
- [Instituto para la Transición Justa](https://www.transicionjusta.gob.es/es/)
- [INCIBE - Emprendimiento](https://www.incibe.es/emprendimiento)
- [FELE - Incubadora INCIBE Emprende](https://fele.es/incubadora-incibe-emprende/)

> Antes de solicitar, verificar siempre la convocatoria viva en la URL oficial correspondiente. El resumen sirve para decidir foco; la validación final siempre se hace contra la fuente primaria.
'@

$presupuestosResumen += @'

**Lectura**

- Los dos bloques que más pesan son **marketing** y **desarrollo**.
- `Stripe` está dentro del total, pero es **coste variable** ligado a ingresos y no OPEX fijo puro.

## 4. OPEX fijo vs coste variable

| Capa | Total 3 años |
|---|---:|
| OPEX fijo sin Stripe | `~46.597 EUR` |
| Stripe COGS variable | `~4.400 EUR` |
| **Total con Stripe** | **`~50.997 EUR`** |

## 5. Caja mínima vs estructura correcta

| Escenario | Importe |
|---|---:|
| Mínimo operativo puro | `~15.313 EUR` |
| Caja cómoda Año 1 | `~17.800 EUR` |
| **Recomendado para maximizar ayudas** | **`30.000 EUR`** |

**Lectura correcta**

- `15k-18k` describen cuánto hace falta para sobrevivir el Año 1.
- **No** describen la mejor estructura para jugar subvenciones.
- Para eso, el documento queda reconciliado con `DECISIONES-FINANCIERAS.md`: **`30.000 EUR` de fondos propios totales**.

## 6. Reglas de lectura

- El presupuesto es austero, pero no improvisado: combina tasas públicas, SaaS básicos, marketing mínimo y contingencia.
- La cifra de `30k` no es gasto operativo; es capitalización inicial recomendable.
- Antes de cerrar un deck o un compromiso de caja, las tarifas SaaS y las tasas se vuelven a verificar en la fuente oficial.

## 7. Fuentes base de costes

- [RMNC - Certificación negativa de denominación social](https://www.rmc.es/deno_solicitud.aspx)
- [FNMT - Certificado de representante para persona jurídica](https://www.sede.fnmt.gob.es/certificados/certificado-de-representante/persona-juridica)
- [OEPM - Tasas de marcas y nombres comerciales](https://www.oepm.es/es/tasas-y-precios-publicos/tasas-de-marcas-y-nombres-comerciales/)
- [Stripe - Pricing](https://stripe.com/en-es/pricing)
- [Anthropic - Pricing](https://www.anthropic.com/pricing)
- [Anthropic - API pricing](https://docs.anthropic.com/en/docs/about-claude/pricing)
- [WhatsApp Business Platform - Pricing](https://business.whatsapp.com/products/platform-pricing)
- [Supabase - Pricing](https://supabase.com/pricing)
- [Cloudflare - Plans and pricing](https://www.cloudflare.com/plans/)

> Las cifras del presupuesto son una foto razonada para planificar. Antes de contratar o presentar a terceros, se revalidan las tarifas variables en estas URLs oficiales.
'@

$consejo += @'

## Qué no es

- No es un documento de financiación.
- No es una pieza del stack operativo actual de Tracciona.
- No es una decisión cerrada de producto; es una línea paralela que puede o no convertirse en proyecto ejecutable.

## Arquitectura conceptual

```text
Pregunta de entrada
        |
        v
Consejo general
  |-- CTO
  |-- Seguridad
  |-- Comercial
  |-- Marketing
  |-- Finanzas
  |-- Legal
        |
        v
Subconsejo por rol
  |-- Modelo A
  |-- Modelo B
  |-- Modelo C
        |
        v
Posición consolidada por rol
        |
        v
Debate final + decisión ejecutiva + registro
```

## Criterios de valor

| Criterio | Qué debería aportar |
|---|---|
| Calidad de decisión | Menos respuestas superficiales y más contraste real entre enfoques |
| Trazabilidad | Registro de qué agentes participaron y por qué ganó una posición |
| Reutilización | Plantillas de roles y flujos repetibles por tipo de decisión |
| Seguridad operativa | Separar bien datos sensibles, prompts del sistema y ejecución de herramientas |

## Stack mínimo viable

| Capa | Opción razonable | Motivo |
|---|---|---|
| Orquestación multiagente | AutoGen, CrewAI o LangGraph | Permiten roles, turnos, herramientas y consolidación |
| Modelos | OpenAI, Anthropic y uno o dos open-weight | Mezcla de calidad, coste y diversidad |
| Persistencia | SQLite o Postgres | Registro de sesiones, votos y salidas |
| Observabilidad | Logs estructurados y trazas por sesión | Sin trazas, el sistema pierde valor |
| Interfaz | CLI o panel web mínimo | Conviene validar primero el flujo, no el frontend |

## Riesgos

- **Complejidad innecesaria**: es fácil construir una demo llamativa y un sistema débil.
- **Coste por consulta**: varios agentes por ronda pueden disparar consumo si no se controla.
- **Falsa sensación de rigor**: más voces no equivalen automáticamente a mejor decisión.
- **Gobierno del sistema**: hay que decidir quién arbitra empates, cuándo se para el debate y qué peso tiene cada rol.

## Próximos pasos razonables

1. Cerrar un caso de uso concreto: por ejemplo, decisiones de producto o evaluación de riesgos.
2. Probar un MVP con `3` roles y `2-3` agentes por rol, no con un consejo completo desde el día 1.
3. Medir coste, latencia y calidad frente a una respuesta única de modelo.
4. Solo después decidir si merece convertirse en proyecto real separado.

## Fuentes técnicas oficiales

- [Microsoft AutoGen](https://microsoft.github.io/autogen/stable/)
- [CrewAI - Documentation](https://docs.crewai.com/)
- [LangGraph - Overview](https://langchain-ai.github.io/langgraph/)
- [OpenAI API - Overview](https://platform.openai.com/docs/overview)
- [Anthropic API - Overview](https://docs.anthropic.com/en/api/overview)
- [SQLite Documentation](https://www.sqlite.org/docs.html)

> Si este documento evoluciona hacia proyecto real, conviene convertirlo en un repositorio o carpeta propia y dejarlo explícitamente separado del núcleo financiero de TradeBase.
'@

Write-Utf8File -Path (Join-Path $root 'README-documental.md') -Content $readmeDoc
Write-Utf8File -Path (Join-Path $DocsDerivados 'TradeBase-dossier-ejecutivo.md') -Content $dossier
Write-Utf8File -Path (Join-Path $DocsDerivados 'TradeBase-one-pager.md') -Content $onePager
Write-Utf8File -Path (Join-Path $DocsSubvenciones 'SUBVENCIONES-resumen.md') -Content $subvencionesResumen
Write-Utf8File -Path (Join-Path $DocsDerivados 'PRESUPUESTOS-resumen.md') -Content $presupuestosResumen

$newCouncil = Join-Path $DocsArchivo 'CONSEJO-MULTI-AI.md'
Write-Utf8File -Path $newCouncil -Content $consejo

$subvencionesPath = Join-Path $DocsSubvenciones 'SUBVENCIONES.md'
$subvencionesText = Get-Content $subvencionesPath -Raw
$subvencionesText = $subvencionesText.Replace('> **Documento de trabajo · Marzo 2026 · Version 1.13**', '> **Documento de trabajo · Marzo 2026 · Versión 1.13**')
$subvencionesText = $subvencionesText.Replace('catalogo, fichas, tabla maestra, metodologia, compatibilidades, alertas y fuentes.', 'catálogo, fichas, tabla maestra, metodología, compatibilidades, alertas y fuentes.')
$subvencionesText = $subvencionesText.Replace('Para decisiones de ejecucion: [DECISIONES-FINANCIERAS.md](DECISIONES-FINANCIERAS.md). Para costes y tesoreria: [PRESUPUESTOS.md](PRESUPUESTOS.md).', 'Para decisiones de ejecución: [DECISIONES-FINANCIERAS.md](DECISIONES-FINANCIERAS.md). Para costes y tesorería: [PRESUPUESTOS.md](PRESUPUESTOS.md).')
$subvencionesText = $subvencionesText.Replace("`r`n> - Mapa general: [README-documental.md](README-documental.md).`r`n---", "`r`n> - Mapa general: [README-documental.md](README-documental.md).`r`n`r`n---")
Write-Utf8File -Path $subvencionesPath -Content $subvencionesText

$presupuestosPath = Join-Path $DocsFinanciero 'PRESUPUESTOS.md'
$presupuestosText = Get-Content $presupuestosPath -Raw
$presupuestosText = $presupuestosText.Replace('maestro de costes y tesoreria.', 'maestro de costes y tesorería.')
$presupuestosText = $presupuestosText.Replace('lectura de caja minima, OPEX/COGS y capitalizacion recomendada.', 'lectura de caja mínima, OPEX/COGS y capitalización recomendada.')
$presupuestosText = $presupuestosText.Replace('catalogo completo de ayudas.', 'catálogo completo de ayudas.')
$presupuestosText = $presupuestosText.Replace('en su parte numerica.', 'en su parte numérica.')
Write-Utf8File -Path $presupuestosPath -Content $presupuestosText

$decisionesPath = Join-Path $DocsFinanciero 'DECISIONES-FINANCIERAS.md'
$decisionesText = Get-Content $decisionesPath -Raw
$decisionesText = $decisionesText.Replace('> **Documento de trabajo · Marzo 2026 · Version 1.4**', '> **Documento de trabajo · Marzo 2026 · Versión 1.4**')
$decisionesText = $decisionesText.Replace('> **Ultima actualizacion:** 10/03/2026', '> **Última actualización:** 10/03/2026')
$decisionesText = $decisionesText.Replace('Este documento concentra lo que TradeBase va a hacer, en que orden y por que.', 'Este documento concentra lo que TradeBase va a hacer, en qué orden y por qué.')
$decisionesText = $decisionesText.Replace('costes y tesoreria', 'costes y tesorería')
$decisionesText = $decisionesText.Replace('roadmap, pools y orden de ejecucion.', 'roadmap, pools y orden de ejecución.')
$decisionesText = $decisionesText.Replace('catalogo completo de ayudas', 'catálogo completo de ayudas')
$decisionesText = $decisionesText.Replace('Numero de socios', 'Número de socios')
$decisionesText = $decisionesText.Replace('Proximo paso', 'Próximo paso')
$decisionesText = $decisionesText.Replace('compromiso real de implantacion', 'compromiso real de implantación')
$decisionesText = $decisionesText.Replace('Mantener coherencia en escritura, cap table y tesoreria', 'Mantener coherencia en escritura, cap table y tesorería')
Write-Utf8File -Path $decisionesPath -Content $decisionesText

$formatFiles = @(
  (Join-Path $root 'README-documental.md'),
  (Join-Path $DocsDerivados 'TradeBase-dossier-ejecutivo.md'),
  (Join-Path $DocsDerivados 'TradeBase-one-pager.md'),
  (Join-Path $DocsSubvenciones 'SUBVENCIONES-resumen.md'),
  (Join-Path $DocsDerivados 'PRESUPUESTOS-resumen.md'),
  (Join-Path $DocsArchivo 'CONSEJO-MULTI-AI.md'),
  (Join-Path $DocsSubvenciones 'SUBVENCIONES.md'),
  (Join-Path $DocsFinanciero 'DECISIONES-FINANCIERAS.md')
)

foreach ($path in $formatFiles) {
  $text = Get-Content $path -Raw
  $text = [regex]::Replace($text, "([^\r\n])\r?\n(## )", '$1' + "`r`n`r`n" + '$2')
  Write-Utf8File -Path $path -Content $text
}

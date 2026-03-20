$ErrorActionPreference = 'Stop'

function Replace-Exact {
  param(
    [string]$Text,
    [string]$Old,
    [string]$New,
    [string]$Label
  )

  if (-not $Text.Contains($Old)) {
    throw "No se encontró el bloque exacto esperado: $Label"
  }

  return $Text.Replace($Old, $New)
}

$decPath = 'C:\TradeBase\Proyecto\05-financiero\DECISIONES-FINANCIERAS.md'
$subvPath = 'C:\TradeBase\Proyecto\06-subvenciones\SUBVENCIONES.md'
$sumPath = 'C:\TradeBase\Proyecto\06-subvenciones\SUBVENCIONES-resumen.md'
$dossierPath = 'C:\TradeBase\Proyecto\05-financiero\derivados\TradeBase-dossier-ejecutivo.md'
$onePath = 'C:\TradeBase\Proyecto\05-financiero\derivados\TradeBase-one-pager.md'

$dec = Get-Content $decPath -Raw
$subv = Get-Content $subvPath -Raw
$sum = Get-Content $sumPath -Raw
$dossier = Get-Content $dossierPath -Raw
$one = Get-Content $onePath -Raw

$dec = Replace-Exact $dec '> **Documento de trabajo · Marzo 2026 · Versión 1.9**' '> **Documento de trabajo · Marzo 2026 · Versión 1.10**' 'version DECISIONES'
$dec = Replace-Exact $dec '| Sede definitiva | ⏳ **PENDIENTE** | Shortlist real: Fresno / La Robla / Pola / Santovenia / Onzonilla | Cerrar espacio usable, conectividad y compromiso real de implantación |' '| Sede definitiva | ✅ **DECIDIDA** | **Fresno de la Vega** | Mantener coherencia entre escritura, dirección operativa, conectividad y relato territorial |' 'fila sede DECISIONES'
$dec = Replace-Exact $dec '| **Alta** | #8/#9/#10 Cámaras + #18 España Emprende | Siguen siendo líneas de baja fricción, pero a 10/03/2026 las ediciones verificadas son 2025; España Emprende opera más como servicio permanente que como ayuda de caja |' '| **Alta** | #8/#9/#10 Cámaras + #18 España Emprende | Las líneas de Cámara León ya están verificadas y abiertas en 2026; España Emprende sigue operando más como servicio permanente que como ayuda de caja |' 'prioridad camaras DECISIONES'
$dec = Replace-Exact $dec '| #21 MITECO | **Solo** con sede final en municipio <5.000 hab. |' '| #21 MITECO | **Territorio ya desbloqueado** con sede en **Fresno de la Vega**; falta memoria territorial propia y proyecto bien separado |' '#21 condicional DECISIONES'
$dec = Replace-Exact $dec '| A2 Transición Justa | Solo si la sede está en **La Robla** o **Pola de Gordón** |' '| A2 Transición Justa | **Descartada** por sede elegida en Fresno; habría aplicado solo en **La Robla** o **Pola de Gordón** |' 'A2 DECISIONES'
$dec = Replace-Exact $dec '| A7 Tierra de Campos 2024-2031 | Solo si la sede final queda en **Fresno de la Vega** y se confirma el anexo territorial vigente |' '| A7 Tierra de Campos 2024-2031 | **Activada territorialmente** por sede en **Fresno de la Vega**; confirmar siempre anexo vigente y encaje práctico |' 'A7 DECISIONES'
$dec = Replace-Exact $dec '| A8 Centro de Empresas La Robla | Solo si la sede está en **La Robla** y el ayuntamiento ofrece espacio/condiciones viables |' '| A8 Centro de Empresas La Robla | **Descartada** por sede elegida en Fresno; habría aplicado solo en **La Robla** si el espacio municipal fuese viable |' 'A8 DECISIONES'
$dec = Replace-Exact $dec '> **Revalidación oficial a 10/03/2026:** #12, #24 y #27 siguen plenamente vigentes como palancas estructurales; #1, #4 y #8-#10 tienen última edición oficial verificada en 2025 y 2026 sigue pendiente; #2 Hacendera debe tratarse como matchfunding; y la línea digital secundaria hoy verificable es la convocatoria viva en CyL, no una ventana genérica futura.' '> **Revalidación oficial a 10/03/2026:** #12, #24 y #27 siguen plenamente vigentes como palancas estructurales; #1 y #4 tienen última edición oficial verificada en 2025 y 2026 sigue pendiente; #8-#10 ya tienen edición 2026 verificada y abierta en León; #2 Hacendera debe tratarse como matchfunding; y la línea digital secundaria hoy verificable es la convocatoria viva en CyL, no una ventana genérica futura.' 'revalidacion DECISIONES'
$dec = Replace-Exact $dec '- **#21 MITECO**: no entra en el foco base hasta cerrar una **sede elegible** y tener una memoria territorial propia, no un reciclaje de la del Año 1.' '- **#21 MITECO**: aunque la sede elegible ya está fijada en **Fresno**, no entra en el foco base hasta tener una memoria territorial propia, no un reciclaje de la del Año 1.' 'MITECO foco DECISIONES'

$newSeatSection = @"
### 1. Decisión de sede

**Sede decidida:** **Fresno de la Vega**.

**Motivos de la decisión**

- desbloquea `#21 MITECO` por territorio;
- activa el diferencial `A7 Tierra de Campos`;
- mantiene un relato rural fuerte y coherente con TradeBase y con `CampoIndustrial`;
- ofrece mejor equilibrio entre subvención probable, narrativa y cercanía razonable a León.

**Alternativas valoradas**

| Opción | Pros | Contras | Qué ayudas / diferencial habría aportado |
|---|---|---|---|
| **Fresno de la Vega** | Mejor equilibrio general; narrativa rural fuerte; buena sinergia con `CampoIndustrial`; desbloquea `MITECO` | Hay que sostener bien espacio usable y conectividad | `#21 MITECO` + `A7 Tierra de Campos` + `LEADER` |
| **La Robla** | Buen techo subvencional y mejor soporte operativo que Pola | Menor diferencial rural que Fresno y más fricción diaria | `#21 MITECO` + `A2 Transición Justa` + `A8 Centro de Empresas` |
| **Pola de Gordón** | Mayor techo bruto de subvención pública | Más fricción operativa, distancia y menor comodidad de ejecución | `#21 MITECO` + `A2 Transición Justa` |
| **Onzonilla** | Muy buena operativa diaria y base logística | Menor relato rural y sin extras territoriales exclusivos | `#21 MITECO` + `LEADER` |
| **Santovenia** | Comodidad y proximidad a León | Menor upside y menos narrativa territorial | `#21 MITECO` + `LEADER` |
| **Valencia de Don Juan** | Comodidad / arraigo | Queda fuera de `#21 MITECO` con **5.094 hab.** | Solo líneas provinciales y generales; pierde el diferencial territorial fuerte |

### Estructura financiera recomendada para maximizar ayudas
"@
$dec = [regex]::Replace($dec, '(?s)### 1\. Decisión de sede.*?### Estructura financiera recomendada para maximizar ayudas', $newSeatSection)

$newAnalysis = @"
## Análisis de sede — Fresno decidido y alternativas valoradas

> **Decisión cerrada:** Fresno de la Vega queda fijada como sede por equilibrio entre elegibilidad, relato y cercanía. Las demás opciones se preservan aquí como referencia de alternativas valoradas.

### Comparativa de alternativas no elegidas

| Opción | Pros | Contras | Qué habría aportado |
|---|---|---|---|
| **La Robla** | Mejor soporte operativo que Pola y buen techo subvencional | Menos diferencial rural que Fresno | `A2 Transición Justa` + `A8 Centro de Empresas` + `#21 MITECO` |
| **Pola de Gordón** | Techo máximo de ayudas entre las opciones valoradas | Más fricción operativa y mayor coste de ejecución diaria | `A2 Transición Justa` + `#21 MITECO` |
| **Onzonilla** | Operativa/logística diaria muy buena | Menor relato rural y ningún diferencial territorial exclusivo | `#21 MITECO` + `LEADER` |
| **Santovenia** | Proximidad y comodidad | Upside subvencional más limitado y relato rural flojo | `#21 MITECO` + `LEADER` |
| **Valencia de Don Juan** | Arraigo y operativa cómoda | Queda fuera de `#21 MITECO` mientras siga por encima de 5.000 habitantes | Solo líneas generales y provinciales; sin diferencial territorial fuerte |

### Pendientes operativos con Fresno

- fijar la **dirección exacta** de la sede y mantenerla coherente en escritura, AEAT, TGSS y resto de expedientes;
- confirmar **espacio usable** y **conectividad suficiente**;
- preparar la memoria territorial de `#21 MITECO` desde el relato real de Fresno, no como adaptación genérica.

### Conclusión operativa

1. **Fresno de la Vega** queda como sede definitiva.
2. **La Robla** habría sido la principal alternativa si se quisiera priorizar `Transición Justa` con menor fricción que Pola.
3. **Pola de Gordón** habría sido la alternativa más agresiva en techo bruto.
4. **Onzonilla / Santovenia** eran alternativas de comodidad, no de máximo upside.

## Roadmap de 3 años — orden de ejecución
"@
$dec = [regex]::Replace($dec, '(?s)## Análisis de sede — decisión práctica.*?## Roadmap de 3 años — orden de ejecución', $newAnalysis)

$sum = Replace-Exact $sum '| Sede definitiva | `PENDIENTE` | condiciona `#21 MITECO`, `A2`, `A7` y `A8` |' '| Sede definitiva | `DECIDIDA` | **Fresno de la Vega**; desbloquea `#21 MITECO` y activa `A7`, mientras deja fuera `A2` y `A8` |' 'fila sede resumen'
$sum = Replace-Exact $sum '| Alta | `#8 / #9 / #10 Cámaras + #18 España Emprende` | Baja fricción; cámaras verificadas en 2025 y España Emprende como servicio permanente |' '| Alta | `#8 / #9 / #10 Cámaras + #18 España Emprende` | Baja fricción; Cámaras León ya verificadas y abiertas en 2026, y España Emprende como servicio permanente |' 'prioridad camaras resumen'
$sum = Replace-Exact $sum '- #1, #4 y #8-#10 tienen última edición oficial verificada en 2025; la edición 2026 sigue pendiente de publicación.' '- #1 y #4 tienen última edición oficial verificada en 2025; #8-#10 ya tienen edición 2026 verificada y abierta en León.' 'revalidacion resumen'
$sum = Replace-Exact $sum '- #21 MITECO hasta cerrar sede elegible y memoria territorial propia' '- #21 MITECO aunque la sede ya está cerrada en Fresno, hasta tener memoria territorial propia' 'MITECO foco resumen'
$sum = Replace-Exact $sum '- `#21 MITECO`: solo con sede final en municipio `<5.000` habitantes.' '- `#21 MITECO`: territorio ya desbloqueado con **Fresno de la Vega**; sigue faltando memoria territorial propia.' '#21 resumen'
$sum = Replace-Exact $sum '- `A2 Transición Justa`: solo en **La Robla / Pola de Gordón**.' '- `A2 Transición Justa`: habría aplicado solo en **La Robla / Pola de Gordón**; queda fuera con Fresno.' 'A2 resumen'
$sum = Replace-Exact $sum '- `A7 Tierra de Campos`: diferencial territorial de **Fresno de la Vega**.' '- `A7 Tierra de Campos`: diferencial territorial **activo** en **Fresno de la Vega**.' 'A7 resumen'
$sum = Replace-Exact $sum '- `A8 Centro de Empresas`: solo tiene sentido en **La Robla**.' '- `A8 Centro de Empresas`: habría tenido sentido solo en **La Robla**; queda fuera con Fresno.' 'A8 resumen'

$newSumSeatSection = @"
## 3. Sede elegida y alternativas valoradas

| Opción | Estado | Pros | Contras | Diferencial de ayudas |
|---|---|---|---|---|
| **Fresno de la Vega** | **DECIDIDA** | Mejor equilibrio general: `MITECO + Tierra de Campos + relato rural + cercanía razonable` | Exige cuidar espacio usable y conectividad | `#21 MITECO` + `A7 Tierra de Campos` + `LEADER` |
| **La Robla** | Valorada | Muy fuerte si se quiere apretar subvención con más soporte operativo que Pola | Menor diferencial rural que Fresno | `#21 MITECO` + `A2 Transición Justa` + `A8 Centro de Empresas` |
| **Pola de Gordón** | Valorada | Máximo techo bruto por `MITECO + Transición Justa` | Mayor fricción real | `#21 MITECO` + `A2 Transición Justa` |
| **Onzonilla** | Valorada | Mejor base operativa diaria | Menos extras exclusivos | `#21 MITECO` + `LEADER` |
| **Santovenia** | Valorada | Opción cómoda y cercana | Menor upside y narrativa más floja | `#21 MITECO` + `LEADER` |
| **VdDJ** | Descartada | Comodidad / arraigo | Queda fuera de `#21 MITECO` | Solo líneas provinciales y generales |

## 4. Paquete que sí merece la pena trabajar en 2026
"@
$sum = [regex]::Replace($sum, '(?s)## 3\. Ranking de sede.*?## 4\. Paquete que sí merece la pena trabajar en 2026', $newSumSeatSection)

$dossier = Replace-Exact $dossier '| Sede definitiva | `PENDIENTE` | shortlist real: `Fresno / La Robla / Pola / Santovenia / Onzonilla` |' '| Sede definitiva | `DECIDIDA` | **Fresno de la Vega** como mejor equilibrio entre subvención, narrativa y cercanía |' 'fila sede dossier'
$dossier = Replace-Exact $dossier '| Alta | `#8 / #9 / #10 Cámaras + #18 España Emprende` | Baja fricción; cámaras verificadas en 2025 y España Emprende como servicio permanente |' '| Alta | `#8 / #9 / #10 Cámaras + #18 España Emprende` | Baja fricción; Cámaras León verificadas y abiertas en 2026, y España Emprende como servicio permanente |' 'prioridad camaras dossier'
$dossier = Replace-Exact $dossier '- #21 MITECO: solo con sede elegible y memoria territorial propia' '- #21 MITECO: aunque la sede ya está fijada en Fresno, solo entra cuando exista memoria territorial propia' 'MITECO foco dossier'
$dossier = Replace-Exact $dossier '1. Cerrar sede definitiva con criterio operativo, no solo subvencional.' '1. Operativizar Fresno: dirección exacta, espacio usable y conectividad suficiente.' 'proximo ciclo dossier'

$newDossierSeat = @"
## 3. Sede decidida y alternativas valoradas

| Opción | Estado | Pros | Contras | Qué habría aportado |
|---|---|---|---|---|
| **Fresno de la Vega** | **DECIDIDA** | Mejor combinación de dinero probable, narrativa y cercanía | Requiere sostener bien espacio usable y conectividad | `#21 MITECO` + `A7 Tierra de Campos` + `LEADER` |
| **La Robla** | Valorada | Muy fuerte si se quiere apretar subvención con mejor soporte operativo que Pola | Menos diferencial rural que Fresno | `#21 MITECO` + `A2 Transición Justa` + `A8 Centro de Empresas` |
| **Pola de Gordón** | Valorada | Mayor techo bruto por `MITECO + Transición Justa` | Más fricción real | `#21 MITECO` + `A2 Transición Justa` |
| **Onzonilla** | Valorada | Mejor base operativa diaria, con menos fricción de ejecución | Menor upside y menos extras exclusivos | `#21 MITECO` + `LEADER` |
| **Santovenia** | Valorada | Opción cómoda y muy cercana a León | Upside menor y narrativa territorial más débil | `#21 MITECO` + `LEADER` |
| **VdDJ** | Descartada | Comodidad / arraigo | Deja fuera `#21 MITECO` | Solo líneas provinciales y generales |

**Lectura corta**

- **Fresno** queda elegida porque es la mejor mezcla de upside, coherencia estratégica y cercanía razonable.
- **La Robla** habría sido la principal alternativa si se quisiera priorizar `Transición Justa` con mejor operativa que Pola.
- **Pola** habría sido la alternativa de techo puro.
- **Onzonilla** y **Santovenia** eran alternativas de comodidad, no de máximo recorrido subvencional.

## 4. Estructura financiera y societaria
"@
$dossier = [regex]::Replace($dossier, '(?s)## 3\. Sede: shortlist real.*?## 4\. Estructura financiera y societaria', $newDossierSeat)

$one = Replace-Exact $one '| Sede definitiva | `PENDIENTE` | `Fresno / La Robla / Pola / Santovenia / Onzonilla` |' '| Sede definitiva | `DECIDIDA` | **Fresno de la Vega** |' 'fila sede onepager'
$one = Replace-Exact $one '- Fuera del foco base 2026: `#21 MITECO` hasta cerrar sede elegible, `#2 Hacendera` salvo matchfunding bien planteado, `#13 ENISA` solo si hace falta caja y `#7 Red Argos Ciber` solo si sobra capacidad' '- Fuera del foco base 2026: `#21 MITECO` hasta preparar memoria territorial propia en Fresno, `#2 Hacendera` salvo matchfunding bien planteado, `#13 ENISA` solo si hace falta caja y `#7 Red Argos Ciber` solo si sobra capacidad' 'MITECO foco onepager'
$one = Replace-Exact $one '- Ayudas condicionales de sede: `#21 MITECO` (solo sede elegible), `A2` (solo `La Robla / Pola`), `A7` (solo `Fresno`)' '- Ayudas condicionales de sede: `#21 MITECO` ya desbloqueada territorialmente con `Fresno`, `A7` activa en `Fresno`; `A2` y `A8` habrían sido exclusivas de `La Robla / Pola`' 'condicionales sede onepager'

$newOneSeat = @"
## Sede

| Opción | Lectura |
|---|---|
| **Fresno de la Vega** | **DECIDIDA**. Mejor equilibrio general: `MITECO + Tierra de Campos + relato rural + cercanía razonable` |
| **La Robla / Pola de Gordón** | Alternativa agresiva: más techo por `Transición Justa`, pero más fricción real |
| **Onzonilla / Santovenia** | Alternativas cómodas, pero con menor upside y sin diferenciales exclusivos |
| **VdDJ** | Descartada si se priorizan ayudas, porque deja fuera `#21 MITECO` |

## Ayudas 2026
"@
$one = [regex]::Replace($one, '(?s)## Sede.*?## Ayudas 2026', $newOneSeat)

$subv = Replace-Exact $subv '> **Documento de trabajo · Marzo 2026 · Versión 1.16**' '> **Documento de trabajo · Marzo 2026 · Versión 1.18**' 'version top SUBVENCIONES'
$subv = Replace-Exact $subv '> Sede social base: **Valencia de Don Juan**, León (CyL, **5.094 hab. INE 2024** — NO cumple requisito MITECO <5.000)' '> Sede social decidida: **Fresno de la Vega**, León (CyL, **~700 hab. INE 2024** — sí cumple requisito MITECO <5.000)' 'sede top SUBVENCIONES'
$subv = Replace-Exact $subv '> Alternativas evaluadas: Onzonilla, Santovenia de la Valdoncina, La Robla, Pola de Gordón, Fresno de la Vega' '> Alternativas valoradas: La Robla, Pola de Gordón, Onzonilla, Santovenia de la Valdoncina y Valencia de Don Juan' 'alternativas top SUBVENCIONES'
$subv = Replace-Exact $subv '| 8 | Cámara: Pyme Digital | Cámara León | Demarcación Cámara León | ⏳ Última edición verificada 2025 · 2026 pendiente | Asesoramiento | **75%** | Sin mínimo | N/A | **Diagnóstico 85% + implantación 40% (máx. 4.494€)** |' '| 8 | Cámara: Pyme Digital | Cámara León | Demarcación Cámara León | ✅ 2026 abierta y verificada · cierre 30/09/2026 o agotamiento | Asesoramiento | **80%** | Sin mínimo | N/A | **Diagnóstico 85% + implantación 60% (máx. 4.494€)** |' 'fila 8 SUBVENCIONES'
$subv = Replace-Exact $subv '| 9 | Cámara: Pyme Innova | Cámara León | Demarcación Cámara León | ⏳ Última edición verificada 2025 · 2026 pendiente | Asesoramiento | **65%** | Sin mínimo | N/A | **Diagnóstico 85% + implantación 40% (máx. 4.494€)** |' '| 9 | Cámara: Pyme Innova | Cámara León | Demarcación Cámara León | ✅ 2026 abierta y verificada · cierre 30/09/2026 o agotamiento | Asesoramiento | **70%** | Sin mínimo | N/A | **Diagnóstico 85% + implantación 60% (máx. 4.494€)** |' 'fila 9 SUBVENCIONES'
$subv = Replace-Exact $subv '| 10 | Cámara: Cibersegura | Cámara León | Demarcación Cámara León | ⏳ Última edición verificada 2025 · 2026 pendiente | Asesoramiento | **70%** | Sin mínimo | N/A | **Diagnóstico 85% + implantación 40% (máx. 2.568€)** |' '| 10 | Cámara: Cibersegura | Cámara León | Demarcación Cámara León | ✅ 2026 abierta y verificada · cierre 30/09/2026 o agotamiento | Asesoramiento | **75%** | Sin mínimo | N/A | **Diagnóstico 85% + implantación 60% (máx. 2.568€)** |' 'fila 10 SUBVENCIONES'
$subv = Replace-Exact $subv '| 21 | MITECO Reto Demográfico | Min. Trans. Ecol. | Nacional (<5k hab.) | ⏳ Q4 2026 | Fondo perdido | **5%/35%** | **25.000€** | **200.000€** | **17.500–140.000€** (70%) ⚠️ VdDJ NO cumple |' '| 21 | MITECO Reto Demográfico | Min. Trans. Ecol. | Nacional (<5k hab.) | ⏳ Q4 2026 | Fondo perdido | **35% con Fresno / 5% con VdDJ** | **25.000€** | **200.000€** | **17.500–140.000€** (70%) · territorio ya desbloqueado en Fresno |' 'fila 21 tabla maestra SUBVENCIONES'
$subv = Replace-Exact $subv '| 21 | MITECO | **5% con VdDJ / 35% con sede elegible** | Con VdDJ queda prácticamente fuera. Con Onzonilla, Fresno, La Robla o Pola sí se abre, pero sigue siendo competitiva y exige memoria territorial seria. |' '| 21 | MITECO | **35% con Fresno / 5% con VdDJ** | Con la sede ya decidida en **Fresno**, el territorio queda desbloqueado. Aun así sigue siendo competitiva y exige memoria territorial seria. |' 'fila 21 probabilidades SUBVENCIONES'
$subv = Replace-Exact $subv '| **Encaje TradeBase** | **Muy fuerte SI se elige municipio <5.000 hab.** VdDJ tiene **5.094 hab. (INE 2024) → NO CUMPLE**. Tendencia: -91/año (podría bajar del umbral en 2026-2027 pero no es seguro). Si sede en Onzonilla (~1.800), Fresno (~700), La Robla (~3.500) o Pola (~3.200) → cumple sin problema. El relato es potente: marketplace B2B desde la España rural, IberHaul como logística propia, CampoIndustrial como vertical que digitaliza el campo. |' '| **Encaje TradeBase** | **Muy fuerte con sede ya decidida en Fresno de la Vega.** Fresno cumple con holgura el requisito territorial y además activa el diferencial `A7 Tierra de Campos`. Las alternativas valoradas que también habrían desbloqueado MITECO eran Onzonilla, La Robla, Pola y Santovenia; VdDJ queda fuera con **5.094 hab. (INE 2024)**. |' 'encaje 21 SUBVENCIONES'
$subv = Replace-Exact $subv '| **Probabilidad** | **5% con VdDJ / 35% con otro municipio** — Con VdDJ prácticamente descartada (>5.000 hab.). Con municipio elegible: convocatoria competitiva (52M€ para toda España), pero relato de impacto territorial muy sólido |' '| **Probabilidad** | **35% con Fresno / 5% con VdDJ** — Con Fresno el territorio ya queda desbloqueado, pero sigue siendo una convocatoria competitiva a escala nacional. |' 'probabilidad 21 SUBVENCIONES'
$subv = Replace-Exact $subv '| **Acción** | **Decisión crítica:** Elegir sede <5.000 hab. al constituir para desbloquear MITECO. Onzonilla, Fresno, La Robla o Pola son opciones válidas. Preparar memoria con énfasis en arraigo rural, empleo digital, digitalización del sector agrícola/industrial |' '| **Acción** | **Sede ya fijada en Fresno.** Preparar memoria con énfasis en arraigo rural, empleo digital, Tierra de Campos y digitalización del sector agrícola/industrial |' 'accion 21 SUBVENCIONES'
$subv = Replace-Exact $subv '> **Versión:** 1.17 · Marzo 2026 (v1.7: matriz semáforo + 30K FP / 6K capital. v1.8: bloque IRPF corregido y alineado con 50/50, cert. startup y no acumulación estatal/CyL. v1.9: matriz operativa por sede con escenarios S1-S5 y probabilidades. v1.10: A9 FELE INCIBE Emprende incorporado como incentivo complementario. v1.11: split de contenido operativo hacia DECISIONES-FINANCIERAS.md. v1.12: nota de gobierno documental y derivados explícitos. v1.13: enlace al mapa general README-documental.md. v1.14: normalización editorial, terminología y maquetación del maestro. v1.17: probabilidades reescritas por línea y tipo, con actualización de Cámara León 2026.)' '> **Versión:** 1.18 · Marzo 2026 (v1.7: matriz semáforo + 30K FP / 6K capital. v1.8: bloque IRPF corregido y alineado con 50/50, cert. startup y no acumulación estatal/CyL. v1.9: matriz operativa por sede con escenarios S1-S5 y probabilidades. v1.10: A9 FELE INCIBE Emprende incorporado como incentivo complementario. v1.11: split de contenido operativo hacia DECISIONES-FINANCIERAS.md. v1.12: nota de gobierno documental y derivados explícitos. v1.13: enlace al mapa general README-documental.md. v1.14: normalización editorial, terminología y maquetación del maestro. v1.17: probabilidades reescritas por línea y tipo, con actualización de Cámara León 2026. v1.18: sede decidida en Fresno y reseña de alternativas valoradas.)' 'version footer SUBVENCIONES'

Set-Content -Path $decPath -Value $dec -Encoding UTF8
Set-Content -Path $subvPath -Value $subv -Encoding UTF8
Set-Content -Path $sumPath -Value $sum -Encoding UTF8
Set-Content -Path $dossierPath -Value $dossier -Encoding UTF8
Set-Content -Path $onePath -Value $one -Encoding UTF8

Get-Item $decPath, $subvPath, $sumPath, $dossierPath, $onePath | Select-Object FullName, Length, LastWriteTime

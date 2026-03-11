$ErrorActionPreference = 'Stop'

$subsidiesPath = 'C:\TradeBase\SUBVENCIONES.md'
$decisionsPath = 'C:\TradeBase\DECISIONES-FINANCIERAS.md'
$dossierPath = 'C:\TradeBase\TradeBase-dossier-ejecutivo.md'

function Replace-Literal {
    param(
        [string]$Text,
        [string]$Old,
        [string]$New
    )

    if (-not $Text.Contains($Old)) {
        throw "No se encontró el bloque esperado:`n$Old"
    }

    return $Text.Replace($Old, $New)
}

$subsidies = Get-Content $subsidiesPath -Raw
$subsidies = Replace-Literal $subsidies `
    '| 1 | Plan Emprendedores | Dip. de León | Provincia León (mun. <20k hab.) | ⏳ Última edición verificada 2025 · 2026 pendiente | Fondo perdido | **60%** | Sin mínimo | Sin máximo | **2.700–4.500€** |' `
    '| 1 | Plan Emprendedores | Dip. de León | Provincia León (mun. <20k hab.) | ⏳ Última edición verificada 2025 · 2026 pendiente | Fondo perdido | **55%** | Sin mínimo | Sin máximo | **2.700–4.500€** |'
$subsidies = Replace-Literal $subsidies `
    '| 2 | Hacendera de Proyectos | Dip. de León | Provincia León (rural) | ⏳ Última edición verificada 2025 · 2026 pendiente | Matchfunding | **25%** | Campaña validada | **20.000€** | **Hasta 20.000€** |' `
    '| 2 | Hacendera de Proyectos | Dip. de León | Provincia León (rural) | ⏳ Última edición verificada 2025 · 2026 pendiente | Matchfunding | **20%** | Campaña validada | **20.000€** | **Hasta 20.000€** |'
$subsidies = Replace-Literal $subsidies `
    '| 25 | Sello Pyme Innovadora | MCINU | Nacional | ✅ Permanente | Certificación | **30%** | Sin mínimo | N/A | **Bonificaciones SS** + puntuación extra convocatorias |' `
    '| 25 | Sello Pyme Innovadora | MCINU | Nacional | ✅ Permanente | Certificación | **25%** | Sin mínimo | N/A | **Bonificaciones SS** + puntuación extra convocatorias |'
$subsidies = Replace-Literal $subsidies `
    '| **Encaje TradeBase** | **Directo.** Valencia de Don Juan (~5.000 hab.) cumple. TradeBase SL es empresa nueva con sede en provincia de León. La actividad digital (marketplace, SaaS) es elegible — no se limita a industria física. |' `
    '| **Encaje TradeBase** | **Directo.** Con la sede ya decidida en **Fresno de la Vega**, TradeBase sigue cumpliendo con holgura el requisito territorial de municipio leonés <20.000 hab. La actividad digital (marketplace, SaaS) es elegible — no se limita a industria física. |'
$subsidies = Replace-Literal $subsidies `
    '| **Probabilidad** | **Alta (60%)** — convocatoria histórica, pocas exclusiones, Valencia de Don Juan cumple todos los criterios |' `
    '| **Probabilidad** | **Media-alta (55%)** — convocatoria histórica y con buen encaje territorial, pero sigue siendo competitiva y el importe pequeño atrae mucha demanda |'
$subsidies = Replace-Literal $subsidies `
    '| **Probabilidad** | **Media-baja (25%)** — no depende solo de la memoria; depende también de ejecutar bien el esquema de crowdfunding |' `
    '| **Probabilidad** | **Media-baja (20%)** — no depende solo de la memoria; depende también de ejecutar bien el esquema de crowdfunding |'
$subsidies = Replace-Literal $subsidies `
    '| **Estado** | ✅ **VERIFICADO.** VdDJ está cubierto por **[POEDA](https://poeda.eu/)** (Páramo, Órbigo, Esla y Desarrollo Asociado). Convocatoria productiva abierta hasta 31/12/2027. Si se elige La Robla o Pola de Gordón → GAL es **[Cuatro Valles](https://cuatrovalles.es/)** (también con convocatoria abierta). |' `
    '| **Estado** | ✅ **VERIFICADO.** **Fresno de la Vega** está cubierto por **[POEDA](https://poeda.eu/planes-de-desarrollo/programa-leader-2023-2027/)** (Páramo, Órbigo y Esla Desarrollo Asociado), cuya convocatoria productiva LEADER 2023-2027 sigue abierta hasta **31/12/2027**. Como alternativas valoradas, **Onzonilla** y **Santovenia** también quedarían en POEDA; **La Robla** y **Pola de Gordón** pasarían a **[Cuatro Valles](https://cuatrovalles.es/)**. |'
$subsidies = Replace-Literal $subsidies `
    '| **Probabilidad** | **Media (30%)** — GAL verificado (POEDA cubre VdDJ), convocatoria abierta. Los GAL LEADER suelen priorizar impacto físico local, pero un marketplace B2B con sede rural y empleo digital tiene argumento sólido |' `
    '| **Probabilidad** | **Media (30%)** — GAL verificado para **Fresno en POEDA**, convocatoria abierta y relato rural más coherente que con VdDJ, pero LEADER sigue priorizando impacto físico y empleo local visible |'
$subsidies = Replace-Literal $subsidies `
    '| **Acción** | Contactar POEDA (Tel: 987 700 991 · poeda@poeda.eu) para conocer criterios de evaluación de proyectos productivos digitales. Si sede en La Robla/Pola Gordón → contactar Cuatro Valles (987 581 666 · cuatrovalles@cuatrovalles.es) |' `
    '| **Acción** | Contactar **POEDA** como GAL de trabajo para Fresno ([Programa LEADER 2023-2027](https://poeda.eu/planes-de-desarrollo/programa-leader-2023-2027/) · 987 351 026 / 987 351 161 · poeda@poeda.eu). Mantener **Cuatro Valles** solo como referencia histórica de la alternativa La Robla / Pola. |'
$subsidies = Replace-Literal $subsidies `
    '| **Probabilidad** | 🔭 **Media (30%)** — necesita evidencia formal: proyecto CDTI, patentes, UNE 166002 o IMV. Sin ninguna vía formalizada, no se puede solicitar |' `
    '| **Probabilidad** | 🔭 **Media-baja (25%)** — necesita evidencia formal: proyecto CDTI, patentes, UNE 166002 o IMV. Sin ninguna vía formalizada, no se puede solicitar |'
$subsidies = Replace-Literal $subsidies `
    '> **Versión:** 1.18' `
    '> **Versión:** 1.19'
$subsidies = Replace-Literal $subsidies `
    'v1.18: sede decidida en Fresno y reseña de alternativas valoradas.)' `
    'v1.18: sede decidida en Fresno y reseña de alternativas valoradas. v1.19: reconciliación de probabilidades y fichas con la sede ya fijada en Fresno.)'
Set-Content -Path $subsidiesPath -Value $subsidies -Encoding UTF8

$decisions = Get-Content $decisionsPath -Raw
$decisions = Replace-Literal $decisions `
    '| A5 UNICO Rural | Solo si la sede final tiene carencia real de conectividad |' `
    '| A5 UNICO Rural | Solo si la sede en **Fresno** tiene carencia real de conectividad |'
$decisions = Replace-Literal $decisions `
    '| Condicionales | Activar MITECO, LEADER o A2 solo si la sede lo permite y el encaje es real | #21, #3 / A3, A2 | Evitar memorias forzadas |' `
    '| Condicionales | Activar MITECO o LEADER solo si el encaje es real; **A2** ya queda fuera con Fresno | #21, #3 / A3 | Evitar memorias forzadas |'
$decisions = Replace-Literal $decisions `
    '> **Documento de trabajo · Marzo 2026 · Versión 1.10**' `
    '> **Documento de trabajo · Marzo 2026 · Versión 1.11**'
Set-Content -Path $decisionsPath -Value $decisions -Encoding UTF8

$dossier = Get-Content $dossierPath -Raw
$dossier = Replace-Literal $dossier `
    '| Condicional | `#21 MITECO` | Solo tiene sentido con sede elegible y un proyecto bien separado |' `
    '| Condicional | `#21 MITECO` | Territorio ya desbloqueado con Fresno; entra solo con memoria territorial propia y proyecto bien separado |'
$dossier = Replace-Literal $dossier `
    '| Condicional | `A2 / A7 / A8 / A9` | Activación según sede final y encaje real |' `
    '| Condicional | `A7 / A9` | `A7` ya queda activada territorialmente con Fresno; `A9` solo entra si el relato de ciberseguridad es defendible |'
$dossier = Replace-Literal $dossier `
    '| Octubre | Preparar la base territorial de #21 para 2027 si la sede lo permite | Borrador de memoria territorial | Socios |' `
    '| Octubre | Preparar la base territorial de #21 para 2027 desde Fresno de la Vega | Borrador de memoria territorial | Socios |'
Set-Content -Path $dossierPath -Value $dossier -Encoding UTF8

rg -n "Valencia de Don Juan \(~5\.000 hab\.\)|POEDA cubre VdDJ|sede final tiene carencia real|Activar MITECO, LEADER o A2 solo si la sede lo permite|sede elegible y un proyecto bien separado|A2 / A7 / A8 / A9|si la sede lo permite|\| 1 \| Plan Emprendedores .*\*\*55%\*\*|\| 2 \| Hacendera de Proyectos .*\*\*20%\*\*|\| 25 \| Sello Pyme Innovadora .*\*\*25%\*\*|Versión 1\.11|Versión:\*\* 1\.19" `
    $subsidiesPath $decisionsPath $dossierPath

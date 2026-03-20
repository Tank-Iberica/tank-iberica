$ErrorActionPreference = 'Stop'

$decisionsPath = 'C:\TradeBase\Proyecto\05-financiero\DECISIONES-FINANCIERAS.md'
$subsidiesPath = 'C:\TradeBase\Proyecto\06-subvenciones\SUBVENCIONES.md'
$dossierPath = 'C:\TradeBase\Proyecto\05-financiero\derivados\TradeBase-dossier-ejecutivo.md'

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

$decisions = Get-Content $decisionsPath -Raw
$oldPendings = @'
### Pendientes operativos con Fresno

- fijar la **dirección exacta** de la sede y mantenerla coherente en escritura, AEAT, TGSS y resto de expedientes;
- confirmar **espacio usable** y **conectividad suficiente**;
- preparar la memoria territorial de #21 MITECO desde el relato real de Fresno, no como adaptación genérica.
'@
$newPendings = @'
### Pendientes operativos con Fresno

- fijar la **dirección exacta** de la sede y mantenerla coherente en escritura, AEAT, TGSS y resto de expedientes;
- confirmar **espacio usable** y **conectividad suficiente**;
- preparar la memoria territorial de #21 MITECO desde el relato real de Fresno, no como adaptación genérica.

### Checklist documental de sede — Fresno de la Vega

| Pieza | Qué debe quedar cerrado | Evidencia mínima |
|---|---|---|
| Dirección de sede | Una única dirección exacta para uso societario y fiscal | Dirección completa con calle, número, código postal y municipio |
| Título de uso | Derecho de uso real del espacio | Contrato de alquiler, cesión, autorización firmada o título equivalente |
| Escritura y estatutos | Domicilio social idéntico al del resto de expedientes | Escritura revisada antes de firma |
| AEAT | Alta censal coherente con la sede decidida | Modelo 036/037 presentado |
| TGSS / Seguridad Social | Mismo domicilio cuando proceda | Alta de empresa / comunicaciones coherentes |
| Prueba de operatividad | Que no sea una sede vacía o puramente nominal | Fotos del espacio, inventario básico y descripción de uso |
| Conectividad | Capacidad mínima para operar de forma continuada | Contrato, factura o test de velocidad guardado |
| Carpeta de sede | Dossier único reutilizable para ayudas y fiscalidad | PDF con contrato, fotos, mapa, conectividad y breve memoria |

### Base territorial de trabajo para #21 MITECO — Fresno

**Tesis de proyecto**

TradeBase opera desde **Fresno de la Vega** para crear empleo digital y actividad económica cualificada en un municipio rural, profesionalizando un mercado B2B industrial todavía muy analógico y preparando una segunda vertical con encaje directo en el entorno agroindustrial.

**Argumentos que sí conviene sostener**

- Fresno cumple con holgura el umbral territorial de municipio rural y encaja en la lógica de reto demográfico.
- La sede activa el marco **Tierra de Campos**, reforzando la narrativa territorial del proyecto.
- El proyecto no se plantea como teletrabajo deslocalizado sin arraigo, sino como actividad digital con base operativa rural y continuidad documental.
- La segunda vertical prevista, **CampoIndustrial**, conecta mejor con el entorno económico local que una narrativa puramente urbana o genérica.
- La propuesta genera digitalización, intermediación profesional, captación de demanda y posibilidad de empleo cualificado desde territorio rural.

**Evidencias recomendadas para la memoria**

- dirección de sede cerrada y título de uso;
- fotos del espacio y prueba de conectividad;
- breve ficha del municipio y del encaje en Tierra de Campos;
- mapa del problema que resuelve Tracciona en compraventa industrial analógica;
- explicación separada de CampoIndustrial como evolución coherente, no como copia del Año 1;
- presupuesto específico de MITECO separado del pool del Año 1;
- si es posible, cartas de interés, apoyos locales o contactos sectoriales ligados al entorno rural.
'@
$decisions = Replace-Literal $decisions $oldPendings $newPendings
$decisions = Replace-Literal $decisions '> **Documento de trabajo · Marzo 2026 · Versión 1.11**' '> **Documento de trabajo · Marzo 2026 · Versión 1.12**'
Set-Content -Path $decisionsPath -Value $decisions -Encoding UTF8

$subsidies = Get-Content $subsidiesPath -Raw
$oldMitecoAction = '| **Acción** | **Sede ya fijada en Fresno.** Preparar memoria con énfasis en arraigo rural, empleo digital, Tierra de Campos y digitalización del sector agrícola/industrial |'
$newMitecoAction = @'
| **Acción** | **Sede ya fijada en Fresno.** Preparar memoria con énfasis en arraigo rural, empleo digital, Tierra de Campos y digitalización del sector agrícola/industrial |
| **Base territorial Fresno** | Municipio rural elegible, encaje en Tierra de Campos, base operativa digital desde territorio y puente natural hacia CampoIndustrial. La memoria debe apoyarse en dirección exacta, prueba de uso real del espacio, conectividad y relato económico ligado al entorno. |
| **Evidencia mínima recomendada** | Título de uso de la sede, fotos, conectividad, ficha territorial, presupuesto propio MITECO y narrativa separada del proyecto de Año 1. |
'@
$subsidies = Replace-Literal $subsidies $oldMitecoAction $newMitecoAction.TrimEnd()
$subsidies = Replace-Literal $subsidies '> **Versión:** 1.19' '> **Versión:** 1.20'
$subsidies = Replace-Literal $subsidies 'v1.19: reconciliación de probabilidades y fichas con la sede ya fijada en Fresno.)' 'v1.19: reconciliación de probabilidades y fichas con la sede ya fijada en Fresno. v1.20: checklist documental de sede y base territorial MITECO aterrizada a Fresno.)'
Set-Content -Path $subsidiesPath -Value $subsidies -Encoding UTF8

$dossier = Get-Content $dossierPath -Raw
$oldShort = @'
**Lectura corta**

- **Fresno** queda elegida porque es la mejor mezcla de upside, coherencia estratégica y cercanía razonable.
- **La Robla** habría sido la principal alternativa si se quisiera priorizar Transición Justa con mejor operativa que Pola.
- **Pola** habría sido la alternativa de techo puro.
- **Onzonilla** y **Santovenia** eran alternativas de comodidad, no de máximo recorrido subvencional.
'@
$newShort = @'
**Lectura corta**

- **Fresno** queda elegida porque es la mejor mezcla de upside, coherencia estratégica y cercanía razonable.
- **La Robla** habría sido la principal alternativa si se quisiera priorizar Transición Justa con mejor operativa que Pola.
- **Pola** habría sido la alternativa de techo puro.
- **Onzonilla** y **Santovenia** eran alternativas de comodidad, no de máximo recorrido subvencional.

**Pendientes inmediatos con Fresno**

- cerrar la **dirección exacta** que irá a escritura, AEAT y TGSS;
- conservar prueba de **uso real del espacio** y **conectividad suficiente**;
- preparar la base territorial de `#21 MITECO` desde el relato real de Fresno y su encaje en Tierra de Campos.
'@
$dossier = Replace-Literal $dossier $oldShort $newShort
Set-Content -Path $dossierPath -Value $dossier -Encoding UTF8

rg -n "Versión 1\.12|Checklist documental de sede|Base territorial de trabajo para #21 MITECO|Base territorial Fresno|Pendientes inmediatos con Fresno|Versión:\*\* 1\.20" `
    $decisionsPath $subsidiesPath $dossierPath

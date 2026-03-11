$ErrorActionPreference = 'Stop'

$path = 'C:\TradeBase\SUBVENCIONES.md'
$text = Get-Content $path -Raw

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

$text = Replace-Literal $text `
    '> **Documento de trabajo · Marzo 2026 · Versión 1.18**' `
    '> **Documento de trabajo · Marzo 2026 · Versión 1.21**'

$text = Replace-Literal $text `
    '| 14 | ICO MRR | ICO vía bancos | Nacional | ✅ **Abierta** (jun 2026) | Préstamo | **40%** | Sin mínimo | 100% proyecto | **10.000–50.000€** (blando) |' `
    '| 14 | ICO MRR | ICO vía bancos | Nacional | ✅ **Abierta hasta 30/06/2026** | Préstamo | **40%** | Sin mínimo | 100% proyecto | **10.000–50.000€** (blando) |'
$text = Replace-Literal $text `
    '| 16 | Kit Digital | Red.es | Nacional | ⏳ Verificar ventana | Fondo perdido | **35%** | Antigüedad ≥6m | 2.000€ | **2.000€** (bono fijo) |' `
    '| 16 | Kit Digital | Red.es | Nacional | 🔭 Sin ventana 2026 verificada a 10/03/2026 | Fondo perdido | **10%** | Antigüedad ≥6m | 2.000€ | **2.000€** (bono fijo) |'
$text = Replace-Literal $text `
    '| 17 | Kit Consulting | Red.es | Nacional | ⏳ Verificar | Fondo perdido | **5%** | **10 empleados** | 24.000€ | **N/A** (no cumple) |' `
    '| 17 | Kit Consulting | Red.es | Nacional | 🔭 Sin convocatoria activa verificada · no cumple tamaño actual | Fondo perdido | **0% hoy** | **10 empleados** | 24.000€ | **N/A** (no cumple) |'
$text = Replace-Literal $text `
    '| 19 | Activa Startups | EOI, Min. Industria | Nacional | ⏳ 2026 | Aceleración | **20%** | Sin mínimo | N/A | **Aceleración** (~5.000–10.000€ valor) |' `
    '| 19 | Activa Startups | EOI, Min. Industria | Nacional | 🔭 Sin convocatoria abierta verificada a 10/03/2026 | Innovación abierta / asesoramiento | **15%** | Según convocatoria | N/A | **Proyecto de colaboración / asesoramiento, no cash fijo** |'

$text = Replace-Literal $text `
    '| 16 | Kit Digital (segmento I, 0-2 empleados) | **20%** | A 10/03/2026 no hay una ventana 2026 verificada para este caso y, además, se exige antigüedad mínima. No conviene modelarlo como línea probable de 2026. |' `
    '| 16 | Kit Digital (segmento I, 0-2 empleados) | **10%** | A 10/03/2026 no hay una ventana 2026 verificada para este caso y, además, se exige antigüedad mínima. Debe quedarse en vigilancia, no en foco activo. |'
$text = Replace-Literal $text `
    '| 17 | Kit Consulting | **5%** | Requiere 10 o más empleados. Con TradeBase actual, queda fuera. |' `
    '| 17 | Kit Consulting | **0% hoy / 5% futuro** | Con TradeBase actual queda fuera por tamaño y, además, no hay convocatoria activa verificada a 10/03/2026. |'
$text = Replace-Literal $text `
    '| 19 | Activa Startups | **20%** | Es competitiva y compites con startups con métricas y más estructura. Interesante, pero hoy no es una de las líneas probables. |' `
    '| 19 | Activa Startups | **15%** | No conviene tratarla como aceleración genérica: su encaje mejora solo si TradeBase puede articular un proyecto formal de colaboración con una pyme o actor sectorial. |'

$old16 = @'
### 16. Kit Digital

| Campo | Detalle |
|---|---|
| **Organismo** | Red.es — Ministerio para la Transformación Digital |
| **URL** | [red.es/kit-digital](https://www.red.es/es/iniciativas/proyectos/kit-digital) |
| **Tipo** | Subvención a fondo perdido (bono digital) |
| **Concurrencia** | No competitiva (plazas limitadas por orden de solicitud) |
| **Periodicidad** | Programa NextGenerationEU, varias convocatorias |
| **Recurrencia** | **1 vez** por segmento — bono digital de 2.000€ para segmento I; no repetible |
| **Estado** | ⏳ Confirmar si hay ventana viva en 2026 para segmento I (0-2 empleados) |
| **Importe** | Hasta 2.000€ para segmento I (0-2 empleados) |
| **Requisitos** | Pyme o autónomo · Antigüedad mínima 6 meses · Test de autodiagnóstico digital |
| **Encaje TradeBase** | **Parcial.** El bono de 2.000€ es modesto pero gratuito. Puede cubrir parcialmente herramientas como Google Workspace, Sentry, o consultoría de ciberseguridad. Limitación: TradeBase necesita 6 meses de antigüedad para solicitar. |
| **Probabilidad** | **Media (35%)** — depende de que haya ventana abierta para segmento I (0-2 empleados) y de tener 6 meses de antigüedad |
| **Acción** | Verificar en accelerapyme.gob.es si hay convocatoria activa para segmento I. Solicitar tras 6 meses de constitución |
'@
$new16 = @'
### 16. Kit Digital

| Campo | Detalle |
|---|---|
| **Organismo** | Red.es — Ministerio para la Transformación Digital |
| **URL** | [red.es/kit-digital](https://www.red.es/es/iniciativas/proyectos/kit-digital) · [Cierre último segmento verificado (31/10/2025)](https://www.red.es/es/actualidad/noticias/finaliza-plazo-solicitudes-kitdigital) |
| **Tipo** | Subvención a fondo perdido (bono digital) |
| **Concurrencia** | No competitiva (plazas limitadas por orden de solicitud) |
| **Periodicidad** | Programa NextGenerationEU, con convocatorias por segmentos |
| **Recurrencia** | **1 vez** por segmento — bono digital no repetible |
| **Estado** | 🔭 **Sin ventana 2026 verificada a 10/03/2026** para el segmento que interesaría a TradeBase (0-2 empleados). La última ventana verificada del segmento III cerró el **31/10/2025** |
| **Importe** | Hasta 2.000€ para segmento III (0-2 empleados) en la última ventana verificada |
| **Requisitos** | Pyme o autónomo · Antigüedad mínima 6 meses · Test de autodiagnóstico digital · disponibilidad de convocatoria abierta para el segmento aplicable |
| **Encaje TradeBase** | **Parcial y hoy no prioritario.** El bono es pequeño y útil, pero no conviene orientar el roadmap ni el producto a una línea que no tiene ventana 2026 verificada a fecha **10/03/2026** |
| **Probabilidad** | **Baja (10%)** — sin convocatoria abierta verificada hoy y con antigüedad mínima exigida, debe tratarse como vigilancia documental |
| **Acción** | Mantener en vigilancia. No planificar producto ni caja sobre esta línea hasta que Red.es publique una nueva ventana aplicable al segmento de TradeBase |
'@
$text = Replace-Literal $text $old16 $new16

$old17 = @'
### 17. Kit Consulting

| Campo | Detalle |
|---|---|
| **Organismo** | Red.es — Ministerio para la Transformación Digital |
| **URL** | [red.es/kit-consulting](https://www.red.es/es/iniciativas/proyectos/kit-consulting) |
| **Tipo** | Subvención a fondo perdido (bono de asesoramiento) |
| **Concurrencia** | No competitiva (plazas limitadas por orden de solicitud) |
| **Periodicidad** | Programa NextGenerationEU, convocatorias periódicas |
| **Recurrencia** | **1 vez** por empresa — bono de asesoramiento no repetible |
| **Estado** | ⏳ Verificar convocatoria activa 2026 |
| **Importe** | 12.000–24.000€ en asesoramiento especializado |
| **Requisitos** | Pyme de 10-249 empleados (segmento principal) |
| **Encaje TradeBase** | **⚠️ Limitado.** Kit Consulting está orientado a empresas medianas (10-249 empleados). TradeBase con 0 empleados probablemente no cumple el requisito de tamaño mínimo. Verificar si hay segmento para microempresas. |
| **Probabilidad** | **Muy baja (5%)** — requiere 10+ empleados; TradeBase tiene 0 |
| **Acción** | Verificar requisitos de tamaño actualizados. Si no aplica ahora, puede aplicar en el futuro con contratación |
'@
$new17 = @'
### 17. Kit Consulting

| Campo | Detalle |
|---|---|
| **Organismo** | Red.es — Ministerio para la Transformación Digital |
| **URL** | [red.es/kit-consulting](https://www.red.es/es/iniciativas/proyectos/kit-consulting) · [Último plazo verificado (31/03/2025)](https://www.red.es/es/actualidad/noticias/hasta-el-31-de-marzo-puedes-solicitar-los-bonos-de-asesoramiento-digital) |
| **Tipo** | Subvención a fondo perdido (bono de asesoramiento) |
| **Concurrencia** | No competitiva (plazas limitadas por orden de solicitud) |
| **Periodicidad** | Programa NextGenerationEU, por convocatorias |
| **Recurrencia** | **1 vez** por empresa — bono no repetible |
| **Estado** | 🔭 **Sin convocatoria activa verificada a 10/03/2026** y, además, TradeBase no cumple el tamaño mínimo actual |
| **Importe** | 12.000–24.000€ en asesoramiento especializado en la última estructura conocida |
| **Requisitos** | Pyme de **10 a menos de 250 empleados** según la referencia oficial verificada |
| **Encaje TradeBase** | **No encaja hoy.** TradeBase tiene 0 empleados y no debe modelar esta línea como opción real mientras no cambie de tamaño o se publique un segmento distinto |
| **Probabilidad** | **0% hoy / 5% futuro con plantilla** — a día **10/03/2026** no es una línea aplicable al proyecto |
| **Acción** | Sacarla del foco. Reabrirla solo si TradeBase alcanza el tamaño exigido o Red.es publica un segmento nuevo que sí cubra microempresa |
'@
$text = Replace-Literal $text $old17 $new17

$old19 = @'
### 19. Activa Startups

| Campo | Detalle |
|---|---|
| **Organismo** | Escuela de Organización Industrial (EOI) — Ministerio de Industria y Turismo |
| **URL** | [espanadigital.gob.es](https://espanadigital.gob.es/lineas-de-actuacion/programa-activa-start-ups) |
| **Tipo** | Programa de aceleración / asesoramiento (no es subvención directa) |
| **Concurrencia** | Competitiva (selección de participantes) |
| **Periodicidad** | Anual |
| **Recurrencia** | **1 vez** — programa de aceleración; una vez completado, no se repite |
| **Próxima estimada** | ⏳ 2026 |
| **Importe** | Asesoramiento especializado valorado en ~5.000-10.000€ (no cash) |
| **Requisitos** | Startup tech constituida · Modelo de negocio escalable |
| **Encaje TradeBase** | **Fuerte.** TradeBase es exactamente el perfil: startup tech con modelo escalable (7 verticales, cero código para clonar). El programa ofrece mentorización, conexión con inversores y asesoramiento estratégico. La certificación startup (Ley Startups, #12) refuerza la candidatura. |
| **Probabilidad** | **Baja-media (20%)** — selección competitiva entre startups de toda España; sin tracción, sin métricas, sin equipo estructurado |
| **Acción** | Solicitar cuando abra convocatoria 2026. Preparar pitch deck con foco en escalabilidad (7 verticales, vertical_config, modelo zero-code cloning) |
'@
$new19 = @'
### 19. Activa Startups

| Campo | Detalle |
|---|---|
| **Organismo** | Escuela de Organización Industrial (EOI) — Ministerio de Industria y Turismo |
| **URL** | [EOI Activa Startups](https://www.eoi.es/es/empresas/programas-activa/activa-startups) |
| **Tipo** | Programa de innovación abierta / asesoramiento para proyectos de colaboración entre pymes y startups (no es subvención directa) |
| **Concurrencia** | Competitiva |
| **Periodicidad** | Convocatorias periódicas; no abierta a fecha **10/03/2026** |
| **Recurrencia** | Depende de la convocatoria; no conviene modelarla hoy como línea estable de repetición |
| **Próxima estimada** | 🔭 Sin convocatoria abierta verificada a **10/03/2026** |
| **Importe** | El alcance depende de cada convocatoria; no conviene modelarlo como cash fijo ni como aceleración genérica |
| **Requisitos** | Según convocatoria. El marco oficial se orienta a **proyectos de colaboración entre pymes y startups**, pudiendo dirigirse a pymes, startups o sus agrupaciones |
| **Encaje TradeBase** | **Condicional.** Tiene sentido si TradeBase puede estructurar un piloto o reto de innovación abierta con una pyme o actor sectorial real. Tiene menos sentido si se intenta presentar como mera startup escalable sin proyecto de colaboración definido |
| **Probabilidad** | **Baja (15%)** — no hay convocatoria abierta verificada y el encaje mejora solo si existe un piloto formal de colaboración |
| **Acción** | No activarla como línea base. Reabrirla solo cuando exista convocatoria y se pueda formular un proyecto concreto de colaboración con una pyme o socio sectorial |
'@
$text = Replace-Literal $text $old19 $new19

$oldInsert = @'
#### D. Apoyo y condicionales personales

| # | Línea | Prob. real 2026 | Lectura con los pies en la tierra |
|---|---|---|---|
| 18 | España Emprende | **65%** | Más que dinero, es acompañamiento. La accesibilidad es relativamente buena, pero no debe leerse como cash comparable a una subvención. |
| 20 | Capitalización del paro | **10%** | Solo existe si algún socio tiene prestación pendiente. Si no se da esa condición personal, la probabilidad real es 0. |

---

## A. Ámbito local y provincial (León)
'@
$newInsert = @'
#### D. Apoyo y condicionales personales

| # | Línea | Prob. real 2026 | Lectura con los pies en la tierra |
|---|---|---|---|
| 18 | España Emprende | **65%** | Más que dinero, es acompañamiento. La accesibilidad es relativamente buena, pero no debe leerse como cash comparable a una subvención. |
| 20 | Capitalización del paro | **10%** | Solo existe si algún socio tiene prestación pendiente. Si no se da esa condición personal, la probabilidad real es 0. |

### Cómo potenciar producto / evidencia por línea

| # | Línea | Cómo potenciar producto / evidencia |
|---|---|---|
| 1 | Plan Emprendedores | MVP funcional, primeras altas o interés comercial y actividad real operando desde Fresno. |
| 2 | Hacendera | Landing de campaña, vídeo, comunidad/relato rural y objetivo público medible. |
| 3 | LEADER | Impacto local visible: empleo, formación, presencia operativa y arraigo en Fresno. |
| 4 | Creación Empresas CyL | Producto lanzable, presupuesto limpio, plan de lanzamiento y señales tempranas de demanda. |
| 5 | ICECYL Digitalización | Automatización dealer, intake por WhatsApp, CRM, importación de stock y reporting. |
| 6 | ICECYL Innovación | Motor propio, datasets, experimentos, benchmark y memoria técnica de I+D. |
| 7 | Red Argos Ciber | MFA, backups, logs, control de accesos, hardening y auditoría de seguridad. |
| 8 | Pyme Digital | CRM, embudo comercial, automatización interna y reporting operativo. |
| 9 | Pyme Innova | Hipótesis, KPIs, experimentos y documentación clara de innovación. |
| 10 | Pyme Cibersegura | Baseline de seguridad, gap assessment y plan de remediación. |
| 11 | SODICAL | Tracción medible: GMV, dealers activos, ingresos, recurrencia y unit economics. |
| 12 | Certificación startup | Innovación propia demostrable, arquitectura escalable, diferenciación y primeras métricas. |
| 13 | ENISA | Pipeline comercial, uso de fondos, forecast defendible y prueba de mercado. |
| 14 | ICO MRR | Paquete bancarizable: inversión concreta, hitos, flujo de caja y repago. |
| 15 | MicroBank | Plan de negocio simple, claro y sin complejidad narrativa innecesaria. |
| 16 | Kit Digital | No orientar producto ahora; solo mantener vigilancia documental por si reabre ventana. |
| 17 | Kit Consulting | No orientar producto ahora; la limitación real es el tamaño de plantilla. |
| 18 | España Emprende | Deck, tesis y necesidades claras para aprovechar el acompañamiento. |
| 19 | Activa Startups | Piloto formal de colaboración con pyme/actor sectorial, no solo narrativa de startup escalable. |
| 20 | SEPE capitalización | No depende del producto; depende de la situación personal y del timing societario. |
| 21 | MITECO | Caso Fresno, vertical rural/agroindustrial, empleo digital rural y apoyo territorial. |
| 22 | NEOTEC / CDTI | Equipo técnico visible, roadmap I+D, prototipos, IP y experimentación propia. |
| 23 | Eurostars | Arquitectura API, work packages y socio europeo real para co-desarrollo. |
| 24 | I+D+i | Time tracking técnico, experiment logs, repos limpios, datasets y memorias. |
| 25 | Sello Pyme Innovadora | IMV o vía formal equivalente, software registrado y evidencia homologable. |
| 26 | Patent Box | Activos licenciables y registro de IP desde el inicio. |
| 27 | IRPF socios | No depende del producto; depende de `#12`, escritura y estructura societaria. |

---

## A. Ámbito local y provincial (León)
'@
$text = Replace-Literal $text $oldInsert $newInsert

$text = Replace-Literal $text '> **Versión:** 1.20' '> **Versión:** 1.21'
$text = Replace-Literal $text 'v1.20: checklist documental de sede y base territorial MITECO aterrizada a Fresno.)' 'v1.20: checklist documental de sede y base territorial MITECO aterrizada a Fresno. v1.21: revisión de requisitos sensibles, ajuste de líneas temporales y sección de palancas de producto/evidencia por ayuda.)'

Set-Content -Path $path -Value $text -Encoding UTF8

rg -n "Versión 1\.21|Kit Digital|Kit Consulting|Activa Startups|Cómo potenciar producto / evidencia por línea|Abierta hasta 30/06/2026|0% hoy / 5% futuro|Baja \(10%\)|Baja \(15%\)" $path

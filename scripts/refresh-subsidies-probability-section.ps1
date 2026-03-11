$ErrorActionPreference = 'Stop'

$path = 'C:\TradeBase\SUBVENCIONES.md'
$text = Get-Content $path -Raw

$text = $text -replace [regex]::Escape('> **Versión:** 1.16 · Marzo 2026 (v1.7: matriz semáforo + 30K FP / 6K capital. v1.8: bloque IRPF corregido y alineado con 50/50, cert. startup y no acumulación estatal/CyL. v1.9: matriz operativa por sede con escenarios S1-S5 y probabilidades. v1.10: A9 FELE INCIBE Emprende incorporado como incentivo complementario. v1.11: split de contenido operativo hacia DECISIONES-FINANCIERAS.md. v1.12: nota de gobierno documental y derivados explícitos. v1.13: enlace al mapa general README-documental.md. v1.14: normalización editorial, terminología y maquetación del maestro.)'), '> **Versión:** 1.17 · Marzo 2026 (v1.7: matriz semáforo + 30K FP / 6K capital. v1.8: bloque IRPF corregido y alineado con 50/50, cert. startup y no acumulación estatal/CyL. v1.9: matriz operativa por sede con escenarios S1-S5 y probabilidades. v1.10: A9 FELE INCIBE Emprende incorporado como incentivo complementario. v1.11: split de contenido operativo hacia DECISIONES-FINANCIERAS.md. v1.12: nota de gobierno documental y derivados explícitos. v1.13: enlace al mapa general README-documental.md. v1.14: normalización editorial, terminología y maquetación del maestro. v1.17: probabilidades reescritas por línea y tipo, con actualización de Cámara León 2026.)'

$newProbSection = @"
### Justificación de probabilidades 2026 (con referencias explícitas)

> Perfil base usado para estimar probabilidades: SL de nueva constitución, sin facturación ni empleados, con producto funcional pero sin tracción comercial validada.
>
> **Cómo leer esta sección:**
>
> - aquí "probabilidad" significa **probabilidad de capturar algo útil entre marzo y diciembre de 2026**;
> - no todos los porcentajes significan lo mismo: en subvención es probabilidad de aprobación/cobro, en fiscal es probabilidad de poder aplicar el beneficio y en financiación es probabilidad de aprobación;
> - la lectura honesta para TradeBase es que **las líneas de probabilidad alta son pocas**, y eso es normal para una SL nueva, pre-revenue y sin tracción validada.

#### A. Subvención, cash y convocatorias

| # | Línea | Prob. real 2026 | Lectura con los pies en la tierra |
|---|---|---|---|
| 1 | Plan Emprendedores León | **55%** | Convocatoria provincial relativamente accesible, pero sigue siendo competitiva y el importe pequeño atrae mucha demanda. |
| 2 | Hacendera | **20%** | La última edición verificada funciona como `matchfunding`: no basta con pedir, hay que ejecutar bien la campaña y el encaje no es lineal ni automático. |
| 3 | LEADER | **25%** | GAL y territorio están verificados, pero TradeBase sigue siendo un negocio digital y los GAL suelen priorizar impacto físico local más visible. |
| 4 | Creación Empresas CyL | **45%** | La edición 2025 fue no competitiva y por orden de presentación, pero la edición 2026 aún no está publicada; el encaje sigue siendo bueno, no garantizado. |
| 5 | ICECYL Digitalización | **25%** | Sigue orientada a pymes que se digitalizan desde una base más tradicional; una pyme nativa digital puede encajar peor en el espíritu de la línea. |
| 6 | ICECYL Innovación | **15%** | Requiere una memoria de I+D más convincente que "usar IA"; para una startup tan temprana el riesgo de no pasar filtro es alto. |
| 7 | Red Argos Ciber / línea digital secundaria viva | **20%** | Puede servir como línea secundaria real, pero no es el mejor foco para una startup que todavía no ha capturado `#4` ni el bloque cameral. |
| 8 | Cámara León - Pyme Digital 2026 | **80%** | Convocatoria 2026 ya verificada y abierta, con baja fricción y encaje directo. La probabilidad real sube, siempre que la SL llegue a tiempo y no encaje en una exclusión sectorial concreta. |
| 9 | Cámara León - Pyme Innova 2026 | **70%** | También abierta y verificable en 2026. Menos directa que Pyme Digital, pero sigue siendo una de las líneas más accesibles para ordenar el relato de innovación. |
| 10 | Cámara León - Pyme Cibersegura 2026 | **75%** | Convocatoria 2026 abierta y muy buen encaje técnico; ayuda pequeña, documentación acotada y necesidad real de ciberseguridad. |
| 16 | Kit Digital (segmento I, 0-2 empleados) | **20%** | A 10/03/2026 no hay una ventana 2026 verificada para este caso y, además, se exige antigüedad mínima. No conviene modelarlo como línea probable de 2026. |
| 17 | Kit Consulting | **5%** | Requiere 10 o más empleados. Con TradeBase actual, queda fuera. |
| 19 | Activa Startups | **20%** | Es competitiva y compites con startups con métricas y más estructura. Interesante, pero hoy no es una de las líneas probables. |
| 21 | MITECO | **5% con VdDJ / 35% con sede elegible** | Con VdDJ queda prácticamente fuera. Con Onzonilla, Fresno, La Robla o Pola sí se abre, pero sigue siendo competitiva y exige memoria territorial seria. |
| 22 | NEOTEC | **10%** | Incluso con tasas generales de éxito razonables, el perfil actual de TradeBase está por debajo del candidato tipo por falta de equipo, tracción y madurez técnica formal. |
| 23 | Eurostars | **5%** | Necesita socio europeo, consorcio y proyecto I+D internacional. Hoy es una línea demasiado lejana. |

#### B. Fiscalidad y certificación

| # | Línea | Prob. real 2026 | Lectura con los pies en la tierra |
|---|---|---|---|
| 12 | Certificación startup | **50%** | El encaje existe, pero ENISA evalúa innovación y escalabilidad; no basta con ser una SL nueva con software. |
| 24 | I+D+i | **70%** | La probabilidad alta significa **poder capturar alguna deducción** si se documenta bien; no significa capturar automáticamente el tramo alto de I+D. |
| 25 | Sello Pyme Innovadora | **25%** | Sigue dependiendo de una vía formal de prueba: IMV, CDTI, patente o esquema equivalente. Sin eso, el sello no sale. |
| 26 | Patent Box | **15%** | Es una palanca a más largo plazo: requiere software registrado e ingresos por intangible. |
| 27 | IRPF socios | **0% sin #12 / 70% con #12** | En el reparto 50/50 actual, sin certificación startup el retorno fiscal efectivo es 0. Si sale `#12` y ambos fundadores cumplen, vuelve a ser una palanca fuerte. |

#### C. Financiación

| # | Línea | Prob. real 2026 | Lectura con los pies en la tierra |
|---|---|---|---|
| 11 | SODICAL | **10% ahora / 35-40% con tracción** | Para una SL recién constituida es prematuro. Tiene más sentido como conversación de 6-12 meses si hay datos reales. |
| 13 | ENISA | **35%** | Sigue siendo la mejor financiación pública para el perfil startup, pero TradeBase llega muy pronto y sin ingresos. |
| 14 | ICO MRR Empresas y Emprendedores | **40%** | No es competitiva, pero el banco sí filtra riesgo y una SL sin facturación puede quedarse fuera o exigir garantías. |
| 15 | MicroBank | **50%** | Existe justo para perfiles pequeños, pero la viabilidad y la capacidad de devolución siguen siendo decisivas. |

#### D. Apoyo y condicionales personales

| # | Línea | Prob. real 2026 | Lectura con los pies en la tierra |
|---|---|---|---|
| 18 | España Emprende | **65%** | Más que dinero, es acompañamiento. La accesibilidad es relativamente buena, pero no debe leerse como cash comparable a una subvención. |
| 20 | Capitalización del paro | **10%** | Solo existe si algún socio tiene prestación pendiente. Si no se da esa condición personal, la probabilidad real es 0. |
"@

$patternProb = '(?s)### Justificación de los porcentajes \(con los pies en la tierra\).*?---\r?\n\r?\n## A\. Ámbito local y provincial \(León\)'
$replacementProb = $newProbSection + "`r`n`r`n---`r`n`r`n## A. Ámbito local y provincial (León)"
$text = [regex]::Replace($text, $patternProb, $replacementProb)

$new8 = @"
### 8. Cámara de Comercio de León: Pyme Digital

| Campo | Detalle |
|---|---|
| **Organismo** | Cámara de Comercio de León |
| **URL** | [Pyme Digital 2026 - BOP León](https://bop.dipuleon.es/publica/buscador-anuncios/anuncio/Extracto-de-la-convocatoria-de-ayudas-para-el-desarrollo-de-planes-de-apoyo-de-soluciones-TIC-en-el-marco-del-Programa-Pyme-Digital-BDNS-887374/) |
| **Tipo** | Diagnóstico + ayuda a implantación |
| **Concurrencia** | No competitiva, con presupuesto limitado y cierre por agotamiento posible |
| **Periodicidad** | Ediciones recurrentes; **2026 ya abierta y verificada** |
| **Recurrencia** | **Repetible** por edición y fase |
| **Última edición verificada** | 2026 |
| **Estado actual** | ✅ Publicación BOP **18/02/2026** · apertura **26/02/2026** · cierre **30/09/2026** o agotamiento |
| **Importe** | Diagnóstico subvencionado al **85%** y ayuda a implantación del **60%**, con **máximo 4.494€** sobre **7.490€** |
| **Requisitos** | Pyme con sede en el ámbito de la Cámara de León · alta en IAE · exclusión general para IAE 845 |
| **Encaje TradeBase** | **Directo.** Sigue siendo una de las líneas de menor fricción real para lanzar Tracciona. |
| **Probabilidad** | **Alta (80%)** — convocatoria 2026 abierta, encaje fuerte y carga documental contenida |
| **Acción** | Activar durante 2026 en cuanto la SL esté constituida, dada de alta y con gasto no solapado |
"@

$new9 = @"
### 9. Cámara de Comercio de León: Pyme Innova

| Campo | Detalle |
|---|---|
| **Organismo** | Cámara de Comercio de León |
| **URL** | [Pyme Innova 2026 - BOP León](https://bop.dipuleon.es/publica/buscador-anuncios/anuncio/Extracto-de-la-convocatoria-de-subvenciones-para-el-desarrollo-de-Planes-de-implantacion-de-soluciones-innovadoras-en-el-marco-del-Programa-Pyme-Innova-BDNS-887205/) |
| **Tipo** | Diagnóstico + ayuda a implantación en innovación |
| **Concurrencia** | No competitiva, con presupuesto limitado y cierre por agotamiento posible |
| **Periodicidad** | Ediciones recurrentes; **2026 ya abierta y verificada** |
| **Recurrencia** | **Repetible** por edición |
| **Última edición verificada** | 2026 |
| **Estado actual** | ✅ Publicación BOP **17/02/2026** · apertura estimada **25/02/2026** · cierre **30/09/2026** o agotamiento |
| **Importe** | Diagnóstico subvencionado al **85%** y ayuda a implantación del **60%**, con **máximo 4.494€** sobre **7.490€** |
| **Requisitos** | Pyme innovadora con sede en el ámbito de la Cámara de León |
| **Encaje TradeBase** | **Fuerte.** Buen instrumento para ordenar el relato de innovación y preparar Sello Pyme Innovadora o certificación startup. |
| **Probabilidad** | **Alta (70%)** — convocatoria 2026 abierta y encaje bueno, aunque exige hilar mejor el relato de innovación que Pyme Digital |
| **Acción** | Activar si la SL ya está constituida y se quiere reforzar la capa metodológica de innovación en 2026 |
"@

$new10 = @"
### 10. Cámara de Comercio de León: Pyme Cibersegura

| Campo | Detalle |
|---|---|
| **Organismo** | Cámara de Comercio de León |
| **URL** | [Pyme Cibersegura 2026 - BOP León](https://bop.dipuleon.es/publica/buscador-anuncios/anuncio/Extracto-de-la-convocatoria-de-ayudas-para-el-desarrollo-de-planes-de-apoyo-de-soluciones-TIC-en-el-marco-del-programa-Pyme-Cibersegura-BDNS-888013/) |
| **Tipo** | Diagnóstico + ayuda a implantación en ciberseguridad |
| **Concurrencia** | No competitiva, con presupuesto limitado y cierre por agotamiento posible |
| **Periodicidad** | Ediciones recurrentes; **2026 ya abierta y verificada** |
| **Recurrencia** | **Repetible** por edición |
| **Última edición verificada** | 2026 |
| **Estado actual** | ✅ Publicación BOP **20/02/2026** · apertura **02/03/2026** · cierre **30/09/2026** o agotamiento |
| **Importe** | Diagnóstico subvencionado al **85%** y ayuda a implantación del **60%**, con **máximo 2.568€** sobre **4.280€** |
| **Requisitos** | Pyme con sede en el ámbito de la Cámara de León |
| **Encaje TradeBase** | **Directo.** Útil para reforzar el relato de seguridad y cubrir un gap real de control externo. |
| **Probabilidad** | **Alta (75%)** — convocatoria 2026 abierta y muy buen encaje técnico para el proyecto |
| **Acción** | Activarla como soporte técnico/documental si la SL está ya operativa y se quiere cubrir ciberseguridad real en 2026 |
"@

$text = [regex]::Replace($text, '(?s)### 8\. Cámara de Comercio de León: Pyme Digital.*?---\r?\n\r?\n### 9\.', $new8 + "`r`n`r`n---`r`n`r`n### 9.")
$text = [regex]::Replace($text, '(?s)### 9\. Cámara de Comercio de León: Pyme Innova.*?---\r?\n\r?\n### 10\.', $new9 + "`r`n`r`n---`r`n`r`n### 10.")
$text = [regex]::Replace($text, '(?s)### 10\. Cámara de Comercio de León: Pyme Cibersegura.*?---\r?\n\r?\n### 11\.', $new10 + "`r`n`r`n---`r`n`r`n### 11.")

Set-Content -Path $path -Value $text -Encoding UTF8
Get-Item $path | Select-Object FullName, Length, LastWriteTime

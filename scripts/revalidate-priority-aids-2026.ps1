$ErrorActionPreference = 'Stop'

$subvPath = 'C:\TradeBase\SUBVENCIONES.md'
$decPath = 'C:\TradeBase\DECISIONES-FINANCIERAS.md'
$subvSummaryPath = 'C:\TradeBase\SUBVENCIONES-resumen.md'
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

$subv = Get-Content $subvPath -Raw

$subv = $subv.Replace(
'| 1 | Plan Emprendedores | Dip. de León | Provincia León (mun. <20k hab.) | ⏳ May-jun 2026 | Fondo perdido | **60%** | Sin mínimo | Sin máximo | **2.700–4.500€** |',
'| 1 | Plan Emprendedores | Dip. de León | Provincia León (mun. <20k hab.) | ⏳ Última edición verificada 2025 · 2026 pendiente | Fondo perdido | **60%** | Sin mínimo | Sin máximo | **2.700–4.500€** |'
)
$subv = $subv.Replace(
'| 2 | Hacendera de Proyectos | Dip. de León | Provincia León (rural) | ⏳ Q2-Q3 2026 | Fondo perdido | **30%** | ~2.000€ | ~30.000€ | **5.000–15.000€** |',
'| 2 | Hacendera de Proyectos | Dip. de León | Provincia León (rural) | ⏳ Última edición verificada 2025 · 2026 pendiente | Matchfunding | **25%** | Campaña validada | **20.000€** | **Hasta 20.000€** |'
)
$subv = $subv.Replace(
'| 2 | Hacendera de Proyectos | Dip. de León | Provincia León (rural) | ⏳ Última edición verificada 2025 · 2026 pendiente | Matchfunding | **30%** | Campaña validada | **20.000€** | **Hasta 20.000€** |',
'| 2 | Hacendera de Proyectos | Dip. de León | Provincia León (rural) | ⏳ Última edición verificada 2025 · 2026 pendiente | Matchfunding | **25%** | Campaña validada | **20.000€** | **Hasta 20.000€** |'
)
$subv = $subv.Replace(
'| 4 | Creación Empresas CyL | Consejería Industria | CyL | ⏳ Q1-Q2 2026 | Fondo perdido | **45%** | **10.000€** | **150.000€** | **3.500–52.500€** (35%) |',
'| 4 | Creación Empresas CyL | Consejería Industria | CyL | ⏳ Última edición verificada 2025 · 2026 pendiente | Fondo perdido | **45%** | **10.000€** | **150.000€** | **3.500–52.500€** (35-45%) |'
)
$subv = $subv.Replace(
'| 5 | ICECYL Digitalización | ICE, Junta CyL | CyL | ⏳ Q2-Q3 2026 | Fondo perdido | **30%** | Según convoc. | Según convoc. | **3.000–30.000€** (50-75%) |',
'| 5 | ICECYL Digitalización | ICE, Junta CyL | CyL | 🔭 Sin convocatoria 2026 verificada a 10/03/2026 | Fondo perdido | **30%** | Según línea vigente | Según línea vigente | **Variable; revisar convocatoria viva** |'
)
$subv = $subv.Replace(
'| 7 | Digital. Pymes CyL | Consejería Industria | CyL | ⏳ Q2-Q3 2026 | Fondo perdido | **25%** | Sin mínimo | ~40.000€ | **3.000–20.000€** (50-75%) |',
'| 7 | Digital. Pymes CyL | Consejería Industria | CyL | ✅ Red Argos Ciber 2025 abierta hasta 31/03/2026 | Fondo perdido | **25%** | Sin mínimo | **20.000€** | **50% hardware / 75% consultoría (máx. 20.000€)** |'
)
$subv = $subv.Replace(
'| 8 | Cámara: Pyme Digital | Cámara León | Demarcación Cámara León | ⏳ 2026 | Asesoramiento | **75%** | Sin mínimo | N/A | **Asesoramiento** (~2.000–5.000€ valor) |',
'| 8 | Cámara: Pyme Digital | Cámara León | Demarcación Cámara León | ⏳ Última edición verificada 2025 · 2026 pendiente | Asesoramiento | **75%** | Sin mínimo | N/A | **Diagnóstico 85% + implantación 40% (máx. 4.494€)** |'
)
$subv = $subv.Replace(
'| 9 | Cámara: Pyme Innova | Cámara León | Demarcación Cámara León | ⏳ 2026 | Asesoramiento | **65%** | Sin mínimo | N/A | **Asesoramiento** (~3.000–6.000€ valor) |',
'| 9 | Cámara: Pyme Innova | Cámara León | Demarcación Cámara León | ⏳ Última edición verificada 2025 · 2026 pendiente | Asesoramiento | **65%** | Sin mínimo | N/A | **Diagnóstico 85% + implantación 40% (máx. 4.494€)** |'
)
$subv = $subv.Replace(
'| 10 | Cámara: Cibersegura | Cámara León | Demarcación Cámara León | ⏳ 2026 | Asesoramiento | **70%** | Sin mínimo | N/A | **Diagnóstico** (~1.500–3.000€ valor) |',
'| 10 | Cámara: Cibersegura | Cámara León | Demarcación Cámara León | ⏳ Última edición verificada 2025 · 2026 pendiente | Asesoramiento | **70%** | Sin mínimo | N/A | **Diagnóstico 85% + implantación 40% (máx. 2.568€)** |'
)
$subv = $subv.Replace(
'| 18 | España Emprende | Cámaras España | Nacional | ⏳ 2026 | Asesoramiento | **65%** | Sin mínimo | N/A | **Asesoramiento** (~2.000–4.000€ valor) |',
'| 18 | España Emprende | Cámaras España | Nacional | ✅ Servicio permanente / red cameral | Asesoramiento | **65%** | Sin mínimo | N/A | **Orientación y acompañamiento emprendedor** |'
)
$subv = $subv.Replace(
'| 24 | Deducciones I+D+i IS | AEAT | Nacional | ✅ Permanente | Deducción fiscal | **70%** | Sin mínimo | Sin máximo | **25-42% de gastos I+D** como deducción en IS |',
'| 24 | Deducciones I+D+i IS | AEAT | Nacional | ✅ Permanente | Deducción fiscal | **70%** | Sin mínimo | Sin máximo | **12-42% según calificación (IT vs I+D)** |'
)

$subv = $subv.Replace(
'| **Próxima estimada** | ⏳ Mayo-junio 2026 |',
'| **Próxima estimada** | ⏳ 2026 pendiente de publicación oficial |'
)

$subv = [regex]::Replace(
  $subv,
  '(?s)### 2\. Hacendera de Proyectos — Diputación de León.*?---\r?\n\r?\n### 3\. POEDA / LEADER',
@"
### 2. Hacendera de Proyectos — Diputación de León

| Campo | Detalle |
|---|---|
| **Organismo** | Diputación Provincial de León |
| **URL** | [dipuleon.es](https://www.dipuleon.es/actualidad-y-comunicacion/noticias-de-diputacion/hp121124/) |
| **Tipo** | Matchfunding / fondo perdido |
| **Concurrencia** | Competitiva |
| **Periodicidad** | Convocatorias periódicas, con ediciones verificadas desde 2020 |
| **Recurrencia** | **Repetible** — solo si cada edición plantea un proyecto distinto y una nueva campaña válida |
| **Última convocatoria verificada** | 2025 |
| **Próxima estimada** | ⏳ 2026 pendiente de publicación oficial |
| **Importe** | La Diputación **duplica cada euro captado** en crowdfunding hasta **20.000€ por proyecto** (última edición oficial verificada) |
| **Requisitos** | Proyecto innovador para el medio rural leonés + campaña de financiación colectiva validada |
| **Encaje TradeBase** | **Condicional.** Puede servir para proyectos con relato rural fuerte, pero exige una lógica de comunidad/campaña que no encaja igual de bien que una subvención clásica. |
| **Probabilidad** | **Media-baja (25%)** — no depende solo de la memoria; depende también de ejecutar bien el esquema de crowdfunding |
| **Acción** | Tratarla como línea oportunista, no como subvención lineal base del Año 1 |

---

### 3. POEDA / LEADER
"@
)

$subv = [regex]::Replace(
  $subv,
  '(?s)### 4\. Subvenciones para Creación de Empresas CyL.*?---\r?\n\r?\n### 5\. ICECYL — Digitalización / Transformación digital',
@"
### 4. Subvenciones para Creación de Empresas CyL

| Campo | Detalle |
|---|---|
| **Organismo** | Consejería de Industria, Comercio y Empleo — Junta de Castilla y León |
| **URL** | [tramitacastillayleon.jcyl.es](https://www.tramitacastillayleon.jcyl.es/web/jcyl/AdministracionElectronica/es/Plantilla100Detalle/1251181050732/Ayuda012/1285499531893/Propuesta) |
| **Tipo** | Subvención a fondo perdido |
| **Concurrencia** | **No competitiva en la última edición verificada (2025)** — por orden de presentación hasta agotar crédito |
| **Periodicidad** | Convocatoria recurrente; última edición oficial verificada en 2025 |
| **Recurrencia** | **1 vez** — subvención a creación de empresa; no repetible para la misma SL |
| **Última convocatoria verificada** | 2025 (fin de plazo: 31/12/2025) |
| **Próxima estimada** | ⏳ 2026 pendiente de publicación oficial |
| **Importe** | **35%** del coste subvencionable, ampliable con criterios adicionales hasta **45%**, sobre proyectos de **10.000€ a 150.000€** |
| **Requisitos** | Empresa nueva en CyL · Proyecto de creación y lanzamiento de actividad |
| **Encaje TradeBase** | **Perfecto.** Sigue siendo la ayuda de fondo perdido más lógica para el Año 1 si reaparece una edición equivalente. |
| **Probabilidad** | **Media-alta (45%)** — el encaje es directo, pero la prioridad real depende de que la edición 2026 mantenga estructura similar y de presentar la memoria completa a tiempo |
| **Acción** | Vigilar BOCyL / Tramita Castilla y León. Preparar memoria y presupuesto listos para presentar en cuanto se publique |

---

### 5. ICECYL — Digitalización / Transformación digital
"@
)

$subv = [regex]::Replace(
  $subv,
  '(?s)### 7\. Digitalización y Seguridad Tecnológica para Pymes CyL 2026.*?---\r?\n\r?\n### 8\. Cámara de Comercio de León: Pyme Digital',
@"
### 7. Digitalización y Seguridad Tecnológica para Pymes CyL

| Campo | Detalle |
|---|---|
| **Organismo** | Consejería de Industria, Comercio y Empleo — Junta de Castilla y León |
| **URL** | [Red Argos Ciber 2025](https://www.tramitacastillayleon.jcyl.es/web/jcyl/AdministracionElectronica/es/Plantilla100Detalle/1284933058677/Ayuda012/1285592445096/Propuesta) · [Tramita Castilla y León](https://www.tramitacastillayleon.jcyl.es/) |
| **Tipo** | Subvención a fondo perdido |
| **Concurrencia** | Competitiva |
| **Periodicidad** | Líneas periódicas de digitalización / ciberseguridad |
| **Recurrencia** | **Repetible** — según línea, proyecto y edición |
| **Última situación oficial verificada** | **Red Argos Ciber 2025 abierta hasta 31/03/2026** · la línea de digitalización avanzada 2025 cerró el **27/02/2026** salvo sustitución por nueva convocatoria |
| **Importe** | En Red Argos Ciber: **50%** para hardware/software y **75%** para consultoría, con **máximo 20.000€**. En la última línea de digitalización avanzada localizada, el tope llegó a **65.000€** |
| **Requisitos** | Pyme en CyL · proyecto ajustado a la línea vigente |
| **Encaje TradeBase** | **Útil como línea secundaria real**, sobre todo en ciberseguridad, pero ya no conviene modelarla como una bolsa genérica `Q2-Q3 2026` sin convocatoria viva confirmada |
| **Probabilidad** | **Media-baja (25%)** — depende de que la línea vigente acepte bien a una pyme nativa digital |
| **Acción** | Si se quiere trabajar una línea secundaria hoy, priorizar la vigente con base oficial (`Red Argos Ciber`) o esperar la siguiente convocatoria viva |

---

### 8. Cámara de Comercio de León: Pyme Digital
"@
)

$subv = [regex]::Replace(
  $subv,
  '(?s)### 8\. Cámara de Comercio de León: Pyme Digital.*?---\r?\n\r?\n### 9\. Cámara de Comercio de León: Pyme Innova',
@"
### 8. Cámara de Comercio de León: Pyme Digital

| Campo | Detalle |
|---|---|
| **Organismo** | Cámara de Comercio de León |
| **URL** | [Programa Pyme Digital 2025](https://camaraleon.com/programa-pyme-digital-2025/) |
| **Tipo** | Diagnóstico + ayuda a implantación |
| **Concurrencia** | No competitiva, con plazas limitadas |
| **Periodicidad** | Ediciones recurrentes; última verificada en 2025 |
| **Recurrencia** | **Repetible** por edición y fase |
| **Última edición verificada** | 2025 |
| **Próxima estimada** | ⏳ 2026 pendiente de publicación oficial |
| **Importe** | Diagnóstico subvencionado al **85%** y ayuda a implantación del **40%**, con **máximo 4.494€** |
| **Requisitos** | Pyme con sede en el ámbito de la Cámara de León |
| **Encaje TradeBase** | **Directo.** Sigue siendo una de las líneas de menor fricción real para lanzar Tracciona. |
| **Probabilidad** | **Alta (75%)** — baja carga documental, última edición oficial verificada y encaje claro |
| **Acción** | Vigilar la publicación de la edición 2026 y activar en cuanto salga |

---

### 9. Cámara de Comercio de León: Pyme Innova
"@
)

$subv = [regex]::Replace(
  $subv,
  '(?s)### 9\. Cámara de Comercio de León: Pyme Innova.*?---\r?\n\r?\n### 10\. Cámara de Comercio de León: Pyme Cibersegura',
@"
### 9. Cámara de Comercio de León: Pyme Innova

| Campo | Detalle |
|---|---|
| **Organismo** | Cámara de Comercio de León |
| **URL** | [Pyme Innova 2025](https://camaraleon.com/pyme-innova-2025/) |
| **Tipo** | Diagnóstico + ayuda a implantación en innovación |
| **Concurrencia** | No competitiva, con plazas limitadas |
| **Periodicidad** | Ediciones recurrentes; última verificada en 2025 |
| **Recurrencia** | **Repetible** por edición |
| **Última edición verificada** | 2025 |
| **Próxima estimada** | ⏳ 2026 pendiente de publicación oficial |
| **Importe** | Diagnóstico subvencionado al **85%** y ayuda a implantación del **40%**, con **máximo 4.494€** |
| **Requisitos** | Pyme innovadora con sede en el ámbito de la Cámara de León |
| **Encaje TradeBase** | **Fuerte.** Buen instrumento para ordenar el relato de innovación y preparar Sello Pyme Innovadora o certificación startup. |
| **Probabilidad** | **Alta (65%)** — menos automática que Pyme Digital, pero con buen encaje documental |
| **Acción** | Vigilar la edición 2026 y usarla como apoyo metodológico, no como pieza financiera principal |

---

### 10. Cámara de Comercio de León: Pyme Cibersegura
"@
)

$subv = [regex]::Replace(
  $subv,
  '(?s)### 10\. Cámara de Comercio de León: Pyme Cibersegura.*?---\r?\n\r?\n### 11\. SODICAL — Préstamo participativo / Capital riesgo',
@"
### 10. Cámara de Comercio de León: Pyme Cibersegura

| Campo | Detalle |
|---|---|
| **Organismo** | Cámara de Comercio de León |
| **URL** | [Pyme Cibersegura 2025](https://camaraleon.com/pyme-cibersegura-2025/) |
| **Tipo** | Diagnóstico + ayuda a implantación en ciberseguridad |
| **Concurrencia** | No competitiva, con plazas limitadas |
| **Periodicidad** | Ediciones recurrentes; última verificada en 2025 |
| **Recurrencia** | **Repetible** por edición |
| **Última edición verificada** | 2025 |
| **Próxima estimada** | ⏳ 2026 pendiente de publicación oficial |
| **Importe** | Diagnóstico subvencionado al **85%** y ayuda a implantación del **40%**, con **máximo 2.568€** |
| **Requisitos** | Pyme con sede en el ámbito de la Cámara de León |
| **Encaje TradeBase** | **Directo.** Útil para reforzar el relato de seguridad y cubrir un gap real de control externo. |
| **Probabilidad** | **Alta (70%)** — sigue siendo una línea de acceso relativamente fácil cuando la edición está abierta |
| **Acción** | Vigilar la edición 2026 y activarla como soporte técnico/documental, no como gran fuente de cash |

---

### 11. SODICAL — Préstamo participativo / Capital riesgo
"@
)

$subv = [regex]::Replace(
  $subv,
  '(?s)### 18\. España Emprende.*?---\r?\n\r?\n### 19\. Activa Startups',
@"
### 18. España Emprende

| Campo | Detalle |
|---|---|
| **Organismo** | Cámara de España / red cameral |
| **URL** | [cámara.es/creacion-de-empresas](https://www.camara.es/creacion-de-empresas) |
| **Tipo** | Servicio de orientación y acompañamiento emprendedor |
| **Concurrencia** | No competitiva |
| **Periodicidad** | **Permanente** como servicio / red de apoyo |
| **Recurrencia** | **Seguimiento recurrente** mientras el programa y la red territorial lo permitan |
| **Importe** | No es una ayuda económica automática; aporta asesoramiento y acompañamiento |
| **Requisitos** | Emprendedor o empresa nueva |
| **Encaje TradeBase** | **Directo.** Tiene sentido como soporte práctico y acompañamiento, no como subvención de caja. |
| **Probabilidad** | **Alta (65%)** — por accesibilidad y baja fricción, no por retorno monetario |
| **Acción** | Canalizarlo a través de Cámara León como servicio de apoyo, no como partida principal del plan financiero |

---

### 19. Activa Startups
"@
)

$subv = [regex]::Replace(
  $subv,
  '(?s)### 24\. Deducciones I\+D\+i en Impuesto de Sociedades.*?---\r?\n\r?\n### 25\. Sello Pyme Innovadora',
@"
### 24. Deducciones I+D+i en Impuesto de Sociedades

| Campo | Detalle |
|---|---|
| **Organismo** | AEAT (arts. 35-39 Ley del Impuesto de Sociedades) |
| **URL** | [AEAT](https://sede.agenciatributaria.gob.es/Sede/impuesto-sobre-sociedades/deducciones-beneficios-fiscales-impuesto-sobre-sociedades.html) |
| **Tipo** | Deducción fiscal en Impuesto de Sociedades |
| **Concurrencia** | No competitiva (derecho fiscal) |
| **Periodicidad** | ✅ Permanente |
| **Recurrencia** | **Anual** — se aplica en cada ejercicio fiscal del IS |
| **Importe** | **I+D:** 25% de los gastos, 42% sobre el exceso respecto a la media previa, 17% adicional para investigadores y 8% para determinadas inversiones. **Innovación tecnológica:** **12%** |
| **Requisitos** | Actividad calificable como I+D o innovación tecnológica, bien documentada. Recomendable: Informe Motivado Vinculante |
| **Encaje TradeBase** | **Muy bueno, con matiz.** El proyecto encaja con seguridad al menos como **innovación tecnológica**; para sostener una deducción en la banda de **25-42%** hay que defender bien el salto de I+D frente al estado del arte. |
| **Probabilidad** | **Alta (70%)** — el derecho existe, pero la intensidad real depende de la calificación técnica y de la calidad documental |
| **Acción** | Documentar desde el primer día la actividad técnica y separar claramente qué parte es innovación tecnológica (12%) y qué parte podría defenderse como I+D (25-42%) |

---

### 25. Sello Pyme Innovadora
"@
)

$subv = $subv.Replace(
'| 2 | **30%** | Depende de la edición y de cómo valoren un proyecto 100% digital en un programa de arraigo rural. El relato de arraigo rural ayuda pero no es seguro. |',
'| 2 | **25%** | La última edición verificada funciona como `matchfunding`: no basta con la memoria, también hay que ejecutar bien la campaña de crowdfunding. Por eso es menos predecible que una subvención lineal. |'
)
$subv = $subv.Replace(
'| 4 | **45%** | Programa maduro con 6-9M€/año, pero muy solicitado. TradeBase es empresa nueva sin historial, sin empleados, sin facturación — compite con proyectos que ya tienen local, empleados o inversión física. El 35% a fondo perdido es atractivo → mucha competencia. |',
'| 4 | **45%** | La última edición oficial verificada (2025) fue no competitiva y por orden de presentación, pero la edición 2026 todavía no está publicada. El encaje sigue siendo fuerte, pero no conviene asumir sin más que se repetirá con la misma mecánica. |'
)
$subv = $subv.Replace(
'| 8 | **75%** | Programas de cámaras suelen tener plazas amplias y pocos filtros. Es asesoramiento, no dinero — la cámara tiene interés en rellenar plazas. |',
'| 8 | **75%** | Última edición oficial verificada en 2025. Programa de baja fricción, con importes acotados y plazas relativamente accesibles cuando se publica. |'
)
$subv = $subv.Replace(
'| 9 | **65%** | Similar a #8 pero "Innova" puede tener criterios más exigentes de innovación demostrable. |',
'| 9 | **65%** | Última edición oficial verificada en 2025. Sigue siendo accesible, pero exige sostener mejor el relato de innovación que Pyme Digital. |'
)
$subv = $subv.Replace(
'| 10 | **70%** | Diagnóstico de ciberseguridad — interés de la cámara en captar empresas. Un marketplace que maneja pagos y datos personales es candidato natural. |',
'| 10 | **70%** | Última edición oficial verificada en 2025. El encaje técnico es muy bueno y la ayuda tiene importes modestos, por lo que suele ser más accesible que una subvención grande. |'
)
$subv = $subv.Replace(
'| 18 | **65%** | Programa de cámaras con fondos europeos, plazas amplias. Similar a #8 pero a nivel nacional. |',
'| 18 | **65%** | Más que una convocatoria puntual, funciona como red cameral de apoyo al emprendimiento. Su valor está en el acompañamiento, no en una ayuda monetaria alta. |'
)
$subv = $subv.Replace(
'| 24 | **70%** | Es derecho fiscal, no concurrencia — si documentas bien la actividad de IA como I+D+i, aplica. El 30% de riesgo es que Hacienda no acepte la actividad como I+D+i (necesitas Informe Motivado Vinculante para blindarte). Sin IMV, el riesgo de inspección es real. Con IMV sube a 90%. |',
'| 24 | **70%** | El derecho fiscal existe, pero la intensidad real no es binaria: si la actividad se queda en innovación tecnológica, la deducción baja al 12%; si se sostiene como I+D, entra en 25-42%. El cuello de botella es documental, no de convocatoria. |'
)

$subv = $subv.Replace('Versión 1.15', 'Versión 1.16')
$subv = $subv.Replace('> **Versión:** 1.15', '> **Versión:** 1.16')
Set-Utf8NoBom -Path $subvPath -Content $subv

$dec = Get-Content $decPath -Raw
$dec = $dec.Replace(
'| **Alta** | #8/#9/#10 Cámaras + #18 España Emprende | Mucho valor práctico con baja fricción y alta probabilidad |',
'| **Alta** | #8/#9/#10 Cámaras + #18 España Emprende | Siguen siendo líneas de baja fricción, pero a 10/03/2026 las ediciones verificadas son 2025; España Emprende opera más como servicio permanente que como ayuda de caja |'
)
$dec = $dec.Replace(
'| **Alta** | #1 Plan Emprendedores León | Importe pequeño pero capturable y con buen encaje territorial |',
'| **Alta** | #1 Plan Emprendedores León | Última edición oficial verificada en 2025; sigue siendo prioritaria cuando reaparezca la convocatoria 2026 |'
)
$dec = $dec.Replace(
'| **Alta** | #4 Creación Empresas CyL | Es la principal ayuda de fondo perdido realmente lógica para Año 1 |',
'| **Alta** | #4 Creación Empresas CyL | Sigue siendo la principal ayuda de fondo perdido lógica para Año 1; la última edición verificada (2025) fue no competitiva y 2026 está pendiente |'
)
$dec = $dec.Replace(
'| **Media-alta** | #2 Hacendera | Buen encaje si el relato local está bien armado |',
'| **Media** | #2 Hacendera | Solo tiene sentido si se acepta su lógica de `matchfunding`; no conviene modelarla como subvención lineal base |'
)
$dec = $dec.Replace(
'| **Media** | #5 ICECYL Digitalización o #7 Digital. Pymes CyL | Trabajar solo una como prioridad real si no hay capacidad para ambas |',
'| **Media** | #7 Red Argos Ciber o la siguiente línea digital viva en CyL | La línea secundaria real verificable hoy es la vigente; evitar modelar convocatorias genéricas no publicadas |'
)
$revalidationNote = '> **Revalidación oficial a 10/03/2026:** #12, #24 y #27 siguen plenamente vigentes como palancas estructurales; #1, #4 y #8-#10 tienen última edición oficial verificada en 2025 y 2026 sigue pendiente; #2 Hacendera debe tratarse como matchfunding; y la línea digital secundaria hoy verificable es la convocatoria viva en CyL, no una ventana genérica futura.'
$dec = [regex]::Replace($dec, '(?m)^> \*\*Revalidación oficial a 10/03/2026:\*\* .*\r?\n?', '')
$dec = $dec.Replace(
"8. Activar #21 MITECO **solo** si la sede final es elegible.",
"8. Activar #21 MITECO **solo** si la sede final es elegible." + "`r`n`r`n" + $revalidationNote
)
$dec = $dec.Replace('Versión 1.6', 'Versión 1.7')
Set-Utf8NoBom -Path $decPath -Content $dec

$subvSummary = Get-Content $subvSummaryPath -Raw
$subvSummary = $subvSummary.Replace(
'| Alta | `#8 / #9 / #10 Cámaras + #18 España Emprende` | Valor práctico con carga documental contenida |',
'| Alta | `#8 / #9 / #10 Cámaras + #18 España Emprende` | Baja fricción; cámaras verificadas en 2025 y España Emprende como servicio permanente |'
)
$subvSummary = $subvSummary.Replace(
'| Media | `#2 Hacendera` | Buena si el relato rural está bien armado |',
'| Media | `#2 Hacendera` | Solo si se acepta su lógica de `matchfunding`; no como subvención lineal base |'
)
$subvSummary = $subvSummary.Replace(
'| Media | `#5 ICECYL Digitalización` o `#7 Digital. Pymes CyL` | Elegir una como secundaria real |',
'| Media | `#7 Red Argos Ciber` o la siguiente línea digital viva en CyL | Elegir una secundaria real con convocatoria oficial publicada |'
)
$subvSummary = $subvSummary.Replace(
"## 5. Líneas condicionales",
"## 5. Revalidación oficial a 10/03/2026`r`n`r`n- `#12`, `#24` y `#27` siguen plenamente vigentes y no dependen de convocatoria.`r`n- `#1`, `#4` y `#8-#10` tienen última edición oficial verificada en `2025`; la edición `2026` sigue pendiente de publicación.`r`n- `#2 Hacendera` debe tratarse como `matchfunding` con tope oficial verificado de `20.000 EUR`, no como subvención lineal al 30%.`r`n- La línea secundaria real verificable hoy en CyL es `Red Argos Ciber`; el resto debe entrar en vigilancia hasta nueva convocatoria viva.`r`n`r`n## 6. Líneas condicionales"
)
$subvSummary = $subvSummary.Replace('## 6. Cómo leer el retorno', '## 7. Cómo leer el retorno')
$subvSummary = $subvSummary.Replace('## 7. Fuentes oficiales clave', '## 8. Fuentes oficiales clave')
Set-Utf8NoBom -Path $subvSummaryPath -Content $subvSummary

$dossier = Get-Content $dossierPath -Raw
$dossier = $dossier.Replace(
'| Alta | `#8 / #9 / #10 Cámaras + #18 España Emprende` | Valor práctico con carga documental contenida |',
'| Alta | `#8 / #9 / #10 Cámaras + #18 España Emprende` | Baja fricción; cámaras verificadas en 2025 y España Emprende como servicio permanente |'
)
$dossier = $dossier.Replace(
"**Regla operativa**`r`n`r`n- En 2026 conviene trabajar **máximo 6-8 líneas reales**.`r`n- El error sería perseguir todo el mapa a la vez.",
"**Regla operativa**`r`n`r`n- En 2026 conviene trabajar **máximo 6-8 líneas reales**.`r`n- El error sería perseguir todo el mapa a la vez.`r`n- Revalidación oficial a `10/03/2026`: `#12`, `#24` y `#27` siguen firmes; `#1`, `#4` y `#8-#10` mantienen última edición verificada en `2025`; `#2` es `matchfunding`; y la línea secundaria viva hoy en CyL es `Red Argos Ciber`."
)
Set-Utf8NoBom -Path $dossierPath -Content $dossier

$onePager = Get-Content $onePagerPath -Raw
$onePager = $onePager.Replace(
'- Prioridad alta: `#12 Certificación startup`, `#24 I+D+i`, `#27 IRPF socios`, `#4 Creación Empresas CyL`',
'- Prioridad alta: `#12 Certificación startup`, `#24 I+D+i`, `#27 IRPF socios`, `#4 Creación Empresas CyL` (última edición oficial verificada en 2025; 2026 pendiente)'
)
$onePager = $onePager.Replace(
'- Paquete de baja fricción: `#1 Plan Emprendedores`, `#8 / #9 / #10 Cámaras`, `#18 España Emprende`',
'- Paquete de baja fricción: `#1 Plan Emprendedores`, `#8 / #9 / #10 Cámaras` y `#18 España Emprende`, sabiendo que varias ediciones verificadas son 2025 y su reedición 2026 sigue pendiente'
)
Set-Utf8NoBom -Path $onePagerPath -Content $onePager

@($subvPath, $decPath, $subvSummaryPath, $dossierPath, $onePagerPath) | ForEach-Object {
  Write-Output ("{0}`t{1}" -f (Get-Item $_).Length, $_)
}

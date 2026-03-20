$ErrorActionPreference = 'Stop'

# Rutas centralizadas post-migración documental (Bloque 4)
$DocsFinanciero = 'C:\TradeBase\Proyecto\05-financiero'
$DocsSubvenciones = 'C:\TradeBase\Proyecto\06-subvenciones'

$subvPath = Join-Path $DocsSubvenciones 'SUBVENCIONES.md'
$presPath = Join-Path $DocsFinanciero 'PRESUPUESTOS.md'
$decPath = Join-Path $DocsFinanciero 'DECISIONES-FINANCIERAS.md'

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
@"
**27 líneas de ayuda principales + 9 ayudas/incentivos complementarios para SL identificados** para TradeBase SL, distribuidos en 5 ámbitos (local, provincial, autonómico, nacional, europeo) más beneficios fiscales permanentes. Se clasifican por tipo de concurrencia, periodicidad y encaje con el proyecto.
"@,
@"
**27 líneas de ayuda principales + 9 ayudas/incentivos complementarios** identificados para TradeBase SL, clasificados por ámbito, probabilidad, recurrencia y encaje real.
"@
)
$subv = $subv.Replace(
@"
**Columna ""Alcance"":** indica el ámbito geográfico de la ayuda — desde ""Provincia León"" (cualquier municipio) hasta ""Nacional"" (cualquier punto de España). La #21 MITECO requiere municipio <5.000 hab. (VdDJ NO cumple con 5.094 hab.).
"@,
@"
> **Lectura rápida:** la columna ""Alcance"" indica si la ayuda depende del municipio exacto, de la provincia, de Castilla y León o de España. La #21 MITECO exige municipio <5.000 hab.; VdDJ no cumple hoy ese umbral.
"@
)
$subv = $subv.Replace(
@"
> Perfil real: SL sin constituir, 0 facturación, 0 empleados, 2 socios, producto funcional pero sin tracción de mercado. El fundador-desarrollador usa IA como ingeniero — innovador pero difícil de encajar en categorías tradicionales de I+D.
"@,
@"
> Perfil base usado para estimar probabilidades: SL de nueva constitución, sin facturación ni empleados, con producto funcional pero sin tracción comercial validada.
"@
)
$subv = [regex]::Replace(
  $subv,
  '(?s)\*\*Resumen de dependencia geográfica:\*\*.*?---\r?\n\r?\n## A\. Ámbito local y provincial \(León\)',
@"
---

## A. Ámbito local y provincial (León)
"@
)
$subv = [regex]::Replace(
  $subv,
  '(?s)> \*\*Clave de optimización:\*\*.*?---\r?\n\r?\n### Cómo justificar proyectos diferentes cada año',
@"
> **Clave de optimización:** las ayudas repetibles (#2, #5, #6, #7, #21) solo tienen sentido si cada año se presenta un proyecto distinto y bien documentado. La estrategia multi-vertical de TradeBase permite hacerlo sin forzar memorias artificiales.

---

### Cómo justificar proyectos diferentes cada año
"@
)
$subv = $subv -replace 'Versión 1\.14', 'Versión 1.15'
$subv = $subv -replace '> \*\*Versión:\*\* 1\.14', '> **Versión:** 1.15'
Set-Utf8NoBom -Path $subvPath -Content $subv

$pres = Get-Content $presPath -Raw
$pres = [regex]::Replace(
  $pres,
  '(?s)### 14\.3 Cash necesario real por año.*?### 14\.5 Calendario trimestral de IVA \(Año 1\)',
@"
### 14.3 Cash necesario real por año

| Concepto | Año 1 | Año 2 | Año 3 |
|---|---:|---:|---:|
| Gastos netos (punto medio, sin IVA) | ~15.000€ | ~16.100€ | ~19.900€ |
| IVA adelantado (proveedores españoles) | ~1.253€ | ~888€ | ~901€ |
| **Subtotal desembolso bruto** | **~16.253€** | **~16.988€** | **~20.801€** |
| IVA recuperado (modelo 303, trimestral) | −1.253€ | −888€ | −901€ |
| **Coste real neto a fin de año** | **~15.000€** | **~16.100€** | **~19.900€** |

> **Lectura correcta:** el IVA adelantado es tensión temporal de caja, no coste estructural. El coste neto de operar sigue siendo el OPEX sin IVA.

### 14.4 Caja inicial recomendada y reconciliación con subvenciones

| Escenario | Caja / fondos | Qué permite |
|---|---:|---|
| **Mínimo operativo puro** | **~15.313€** | Cubrir el Año 1 y el float medio de IVA con muy poco margen |
| **Caja cómoda Año 1** | **~17.800€** | Ejecutar el Año 1 con un colchón básico de imprevistos |
| **Estructura recomendada para ayudas** | **30.000€ FP = 6.000€ capital + 24.000€ aportación adicional** | Alinear la SL con subvenciones, ENISA Jóvenes y la vía IRPF descrita en los otros maestros |

- El **capital social** forma parte de la caja disponible una vez desembolsado; no es dinero inmovilizado sin uso.
- Los **30.000€ de fondos propios** no significan que el Año 1 ""cueste"" 30.000€; significan que la sociedad arranca con balance y liquidez suficientes para prefinanciar convocatorias, separar pools de gasto y no parecer infracapitalizada.
- La diferencia entre este documento y [SUBVENCIONES.md](SUBVENCIONES.md) / [DECISIONES-FINANCIERAS.md](DECISIONES-FINANCIERAS.md) es de enfoque: aquí se mide **coste operativo**; allí se define la **capitalización recomendada** para jugar ayudas con agresividad.

### 14.5 Calendario trimestral de IVA (Año 1)
"@
)
$pres = $pres -replace 'Versión 1\.5', 'Versión 1.6'
$pres = $pres -replace '## 14\. Planificación de tesorería — Cash real necesario', '## 14. Planificación de tesorería — caja real necesaria'
Set-Utf8NoBom -Path $presPath -Content $pres

$dec = Get-Content $decPath -Raw
$dec = [regex]::Replace(
  $dec,
  '(?s)### Lectura 50/50.*?## Versión ejecutiva — Qué hacer de verdad',
@"
### Lectura operativa

- Estructura simple y alineada con una SL de **30.000€ de fondos propios totales**.
- En **50/50**, el IRPF estatal y CyL es **0€** sin certificación startup.
- Con certificación startup y ambos fundadores válidos, el techo teórico estatal conjunto asciende a **15.000€**.
- Antes de firmar escritura: revisar pacto de socios, cláusulas anti-bloqueo y base deducible de IRPF (capital / prima) con gestoría y abogado mercantil.

## Versión ejecutiva — Qué hacer de verdad
"@
)
$dec = [regex]::Replace(
  $dec,
  '(?s)## Análisis de sede — ¿Merece la pena cambiar de municipio\?.*?## Roadmap de 3 años — Optimización de ayudas',
@"
## Análisis de sede — decisión práctica

> **Hecho base:** VdDJ tiene 5.094 habitantes (INE 2024) y hoy queda fuera de #21 MITECO. Cambiar la sede altera poco la operativa administrativa y mucho el techo subvencional.

### Comparativa rápida de municipios

| Factor | VdDJ | Santovenia | Onzonilla | La Robla | Pola de Gordón | Fresno de la Vega |
|---|---|---|---|---|---|---|
| Habitantes (INE 2024) | **5.094** | ~2.081 | ~1.800 | ~3.500 | ~3.200 | **~700** |
| MITECO (<5.000 hab.) | **No** | Sí | Sí | Sí | Sí | **Sí** |
| Transición Justa | No | No | No | **Sí** | **Sí** | No |
| LEADER / GAL | POEDA | POEDA | POEDA | Cuatro Valles | Cuatro Valles | POEDA |
| Relato rural / despoblación | Medio | Débil | Medio | Medio | Alto | **Máximo** |
| Operativa diaria | Alta | **Muy alta** | **Alta** | Media | Baja | Media |
| Distancia a León | ~35 min | ~5 min | ~10 min | ~25 min | ~40 min | ~30 min |
| Fibra / conectividad | Sí | Sí | Sí | Sí | Verificar | Verificar |
| Sinergia con CampoIndustrial | Media | Baja | Media | Baja | Baja | **Alta** |

### Bonus territoriales relevantes

| Municipio | Palanca diferencial | Lectura operativa |
|---|---|---|
| **Fresno de la Vega** | A7 Tierra de Campos + relato rural muy fuerte | Mejor equilibrio entre elegibilidad, narrativa y cercanía |
| **La Robla / Pola de Gordón** | A2 Transición Justa | Máximo upside público; **La Robla** es más operable, **Pola** más agresiva |
| **La Robla** | A8 Centro de Empresas | Puede reducir fricción de implantación si el espacio municipal es viable |
| **Onzonilla** | Operativa/logística | Menos extras exclusivos, pero mejor base diaria para ejecutar |

> **Transición Justa** queda verificada en el [Convenio de Transición Justa de la Montaña Central Leonesa – La Robla](https://www.transicionjusta.gob.es/en/ctj-montana-central-leonesa-la-robla.html). El detalle de bases, importes y URLs oficiales se mantiene en [SUBVENCIONES.md](SUBVENCIONES.md).

### Matriz semáforo por sede

| Factor | Fresno | La Robla / Pola | Onzonilla | Lectura |
|---|---|---|---|---|
| #21 MITECO | Verde | Verde | Verde | Los tres escenarios quedan por debajo de 5.000 habitantes |
| A2 Transición Justa | Rojo | Verde | Rojo | Solo La Robla y Pola están dentro del convenio |
| A7 Tierra de Campos | Verde | Rojo | Rojo | Ventaja exclusiva de Fresno |
| A8 Centro de Empresas | Rojo | Amarillo | Rojo | Solo aplica a La Robla |
| LEADER / GAL | Verde | Verde | Verde | Los tres tienen GAL operativo |
| Narrativa rural | Verde | Verde | Amarillo | Onzonilla es válida, pero menos potente |
| Operativa diaria | Amarillo | Amarillo | Verde | Onzonilla gana por cercanía y logística |
| Potencial subvencional total | Verde | Verde | Amarillo | Fresno y La Robla/Pola tienen extras exclusivos |

### Escenarios realistas a 3 años

| Sede | Rango esperable | Techo realista | Escenario más probable | Lectura |
|---|---:|---:|---|---|
| **VdDJ** | 15.000-22.000€ | 32.000-45.000€ | S2-S3 | Solo tiene sentido si se acepta renunciar a MITECO |
| **Santovenia** | 20.000-28.000€ | 42.000-55.000€ | S2-S3 | Muy cómoda, pero con relato rural flojo |
| **Onzonilla** | 28.000-38.000€ | 55.000-70.000€ | S3 | Mejor sede operativa pura |
| **Fresno de la Vega** | 38.000-50.000€ | 60.000-80.000€ | S3-S4 | Mejor equilibrio general |
| **La Robla** | 45.000-60.000€ | 70.000-90.000€ | S3-S4 | Muy fuerte si además se quiere algo de operativa real |
| **Pola de Gordón** | 50.000-70.000€ | 85.000-110.000€ | S4 | Máximo upside, mayor fricción de ejecución |

### Verificaciones pendientes antes de escriturar

- Verificar **fibra y espacio usable** en Fresno y Pola.
- Confirmar condiciones reales del **Centro de Empresas** si se elige La Robla.
- Cerrar la **dirección definitiva** antes de la escritura para no perder tracción administrativa ni narrativa territorial.

### Conclusión operativa

1. **Fresno de la Vega**: mejor equilibrio entre subvención, narrativa y practicidad.
2. **La Robla / Pola de Gordón**: mejor opción si se quiere apretar Transición Justa; La Robla es más usable, Pola más agresiva.
3. **Onzonilla**: mejor sede si la prioridad es operar cómodo desde el día 1.
4. **VdDJ**: solo tiene sentido si conscientemente se acepta dejar fuera MITECO.

## Roadmap de 3 años — orden de ejecución
"@
)
$dec = [regex]::Replace(
  $dec,
  '(?s)## Roadmap de 3 años — orden de ejecución.*\z',
@"
## Roadmap de 3 años — orden de ejecución

> El detalle de requisitos, bases y URLs oficiales vive en [SUBVENCIONES.md](SUBVENCIONES.md). Aquí solo queda el orden de trabajo y la lógica de asignación.

### Año 1 (2026) — constitución y primeras capturas

| Bloque | Qué hacer | Ayudas principales | Objetivo |
|---|---|---|---|
| Sede y estructura | Cerrar municipio, escritura y aportaciones | #21, #27 | No bloquear MITECO ni el IRPF socios |
| Certificaciones base | Solicitar certificación startup y montar trazabilidad I+D+i | #12, #24 | Abrir fiscalidad y relato institucional |
| Fondo perdido principal | Preparar la memoria fuerte de empresa nueva | #4 | Capturar la ayuda autonómica más lógica del Año 1 |
| Paquete de baja fricción | Activar Cámara, España Emprende y ayuda local/provincial | #1, #8, #9, #10, #18 | Obtener retorno práctico rápido |
| Financiación blanda | Trabajar préstamo solo si hace falta caja adicional | #13, #14, #15 | No sobredimensionar deuda desde el día 1 |
| Condicionales | Activar MITECO, LEADER o A2 solo si la sede lo permite y el encaje es real | #21, #3 / A3, A2 | Evitar memorias forzadas |

### Año 2 (2027) — tracción y segunda vertical

| Bloque | Qué hacer | Ayudas principales | Objetivo |
|---|---|---|---|
| Nueva vertical | Presentar CampoIndustrial como proyecto distinto | #2, #5, #6, #7 | Repetir convocatorias con memoria propia |
| Subvención estrella | Convertir CampoIndustrial en candidatura fuerte para reto demográfico | #21 | Aprovechar mejor el relato rural |
| Financiación | Reabrir ENISA / SODICAL solo con métricas reales | #13, #11 | Financiar crecimiento, no supervivencia |
| Fiscalidad | Consolidar I+D+i y estudiar Sello Pyme Innovadora | #24, #25 | Preparar ventajas del Año 3 |

### Año 3 (2028) — consolidación y madurez fiscal

| Bloque | Qué hacer | Ayudas principales | Objetivo |
|---|---|---|---|
| Tercera vertical | Presentar un proyecto realmente distinto | #2, #5, #6, #7, #21 | Cerrar el ciclo de convocatorias repetibles |
| Fiscalidad madura | Activar Patent Box si ya hay ingresos por licencias / API | #24, #26 | Convertir I+D acumulada en ahorro real |
| Financiación de escala | Valorar ENISA Crecimiento y ampliaciones solo con tracción clara | #13, #11 | Abrir crecimiento serio sin perder disciplina |

### Cronograma compacto

| Tramo | Foco |
|---|---|
| Pre-constitución | Sede, escritura, aportaciones, pacto de socios, validación IRPF |
| Q2 2026 | Certificación startup, trazabilidad I+D+i, #4 y primeras líneas de baja fricción |
| Q3-Q4 2026 | Líneas provinciales / Cámara y preparación condicional de MITECO o LEADER |
| 2027 | CampoIndustrial, repetición selectiva de convocatorias y posible ENISA 2 |
| 2028 | Tercera vertical, fiscalidad madura y financiación de crecimiento si hay tracción |

## Pools de gasto — asignación recomendada

> **Regla fija:** una factura, una subvención. Los importes son orientativos y se recalculan contra [PRESUPUESTOS.md](PRESUPUESTOS.md) antes de presentar cada solicitud.

### Año 1 — Tracciona

| Pool | Ayuda | Importe orientativo | Qué contiene |
|---|---|---:|---|
| A | #4 Creación Empresas CyL | ~10.054€ | Constitución, legal, desarrollo, infra, marcas, dominios, sede y operaciones parciales |
| B | #2 Hacendera | ~2.500€ | Marketing digital y contenido Tracciona |
| C | #5 ICECYL Digitalización | ~2.096€ | Ferias, branding físico y contingencia operativa |
| D | #7 Digital. Pymes CyL | ~1.104€ | Operaciones y administración restante |
| E | #1 Plan Emprendedores | ~1.000€ | Marketing restante |

### Año 2 — CampoIndustrial

| Pool | Ayuda | Importe orientativo | Qué contiene |
|---|---|---:|---|
| A | #6 ICECYL Innovación | ~4.732€ | Motor IA de valoración agrícola |
| B | #2 Hacendera | ~2.700€ | Relato rural y captación agrícola |
| C | #5 ICECYL Digitalización | ~1.128€ | Legal, marcas y dominios de expansión |
| D | #21 MITECO | ~6.241€ | Sede elegible, marketing rural, material y contingencia |
| E | #7 Digital. Pymes CyL | ~2.450€ | Automatización y operaciones multi-vertical |

### Año 3 — tercera vertical

| Pool | Ayuda | Importe orientativo | Qué contiene |
|---|---|---:|---|
| A | #6 ICECYL Innovación | ~5.670€ | API de datos y motor multi-sector |
| B | #2 Hacendera | ~3.000€ | Nuevo relato sectorial |
| C | #5 ICECYL Digitalización | ~1.153€ | Expansión de la vertical |
| D | #7 Digital. Pymes CyL | ~2.600€ | Automatización cross-vertical |
| E | #21 MITECO | ~6.492€ | Impacto rural con historial de dos años |

### Regla de documentación

- Cada pool debe tener **memoria, presupuesto y facturas** propias.
- Cada vertical debe presentarse como **proyecto distinto**, no como clon sectorial.
- Si la sede final cambia, hay que recalcular solo los pools afectados por territorio: **#21, A2, A3, A7 y A8**.

## Retorno acumulado — lectura realista

| Métrica | Conservador | Optimista |
|---|---:|---:|
| Fondo perdido | 2.700€ | 36.332€ |
| Fiscal (IRPF + I+D + Patent Box) | 4.619€ | 30.853€ |
| Préstamos blandos | 20.000€ | 1.875.000€ |
| Asesoramiento (valor) | 21.000€ | 38.500€ |
| **Retorno total** | **48.319€** | **1.980.685€** |
| **Gasto total 3 años** | **50.997€** | **50.997€** |
| Retorno en efectivo (fondo perdido + fiscal) | 7.319€ | 67.185€ |
| Retorno en efectivo como % del gasto | **14%** | **132%** |
| Financiación neta disponible (préstamos - gasto) | −30.997€ | +1.824.003€ |

- **Lo más controlable:** Cámara, España Emprende, trazabilidad I+D+i y la memoria de #4.
- **Lo más sensible:** el IRPF socios en 50/50 depende de obtener certificación startup y cumplir la excepción de fundadores.
- **La sede cambia el techo, no la lógica:** Fresno y La Robla/Pola amplían el upside; Onzonilla mejora la operativa; VdDJ reduce el recorrido.

> **Criterio de lectura:** este documento no promete el extremo optimista. Sirve para ordenar decisiones, dimensionar el upside y evitar perseguir ayudas incompatibles con la fase real del proyecto.
"@
)
$dec = $dec -replace 'Versión 1\.5', 'Versión 1.6'
Set-Utf8NoBom -Path $decPath -Content $dec

$pres = Get-Content $presPath -Raw
$pres = $pres.Replace('Año 1 ""cueste"" 30.000€', 'Año 1 "cueste" 30.000€')
Set-Utf8NoBom -Path $presPath -Content $pres

$files = @($subvPath, $presPath, $decPath)
foreach ($file in $files) {
  $count = (Get-Content $file).Count
  Write-Output ("{0}`t{1}" -f $count, $file)
}

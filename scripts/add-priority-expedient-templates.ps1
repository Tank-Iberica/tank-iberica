$ErrorActionPreference = 'Stop'

$playbookSource = 'C:\TradeBase\Tracciona\docs\SUBVENCIONES-PLAYBOOK.md'
$playbookRoot = 'C:\TradeBase\SUBVENCIONES-PLAYBOOK.md'
$templatesSource = 'C:\TradeBase\Tracciona\docs\PLANTILLAS-EXPEDIENTES-PRIORITARIOS.md'
$templatesRoot = 'C:\TradeBase\PLANTILLAS-EXPEDIENTES-PRIORITARIOS.md'
$readmeRoot = 'C:\TradeBase\README-documental.md'

$playbook = Get-Content $playbookSource -Raw

$newBlock = @"
## Cambios pequeños de visión o producto que mejorarían algunas líneas y requieren confirmación expresa

Estos cambios **no se asumen por defecto**. La tabla fija el estado actual de trabajo para no mezclar ideas con decisiones cerradas.

| Cambio propuesto | Estado actual | Ayudas que mejora | Impacto | Motivo actual / criterio de uso |
|---|---|---|---|---|
| Reforzar `CampoIndustrial` como evolución natural desde Fresno y Tierra de Campos | `APROBADO` | `#21`, `#3/A3`, `#1`, `#4` | Muy alto | Ya forma parte de la narrativa de evolución del proyecto y refuerza la sede en Fresno sin obligar a lanzarlo todo en 2026. |
| Formalizar un `motor de valoración` propio como activo central | `PENDIENTE` | `#6`, `#12`, `#13`, `#24`, `#25`, `#26`, `#22` | Muy alto | Mejora mucho innovación y fiscalidad, pero exige decidir alcance real y recursos de desarrollo. |
| Estructurar una futura `API/licencia` separable del SaaS principal | `PENDIENTE` | `#26`, `#22`, `#23` | Alto | Solo compensa si se quiere abrir una vía clara de licenciamiento o datos, no por cosmética de expediente. |
| Montar una `capa ciber` visible: identidad, antifraude, hardening y seguridad de operaciones | `PENDIENTE` | `#7`, `#10`, `A9`, mejora `#12/#13` | Medio-alto | Puede abrir mejor FELE/INCIBE y reforzar producto, pero requiere decidir si esa capa será una propuesta visible y no solo técnica interna. |
| Diseñar una campaña pública de `crowdfunding/matchfunding` para Hacendera | `PENDIENTE` | `#2` | Medio | Solo tiene sentido si se acepta salir a campaña pública y dedicar esfuerzo específico a comunidad. |
| Buscar un `socio pyme` o actor sectorial para piloto formal | `PENDIENTE` | `#19`, mejora `#13` y `#22` | Medio | Puede reforzar colaboración e innovación aplicada, pero requiere tiempo comercial y un acuerdo real. |
| Buscar un `socio europeo` para co-desarrollo | `PENDIENTE` | `#23` | Alto | Solo tiene sentido si se decide jugar Europa de verdad; hoy no es foco base. |

**Regla de uso**

- `APROBADO`: ya puede incorporarse a memorias y narrativas como decisión válida.
- `PENDIENTE`: no se mete como hecho cerrado hasta confirmación explícita.
- Si alguno cambia de estado, hay que actualizar este bloque y el roadmap de [DECISIONES-FINANCIERAS.md](C:/TradeBase/DECISIONES-FINANCIERAS.md).
"@

if ($playbook -notmatch '(?s)## Cambios pequeños de visión o producto que mejorarían algunas líneas y requieren confirmación expresa.*?## Orden real de ataque') {
  throw 'No se encontro el bloque original de cambios sujetos a confirmacion en el playbook.'
}

$playbook = [regex]::Replace(
  $playbook,
  '(?s)## Cambios pequeños de visión o producto que mejorarían algunas líneas y requieren confirmación expresa.*?(?=## Orden real de ataque)',
  ($newBlock.Trim() + "`r`n`r`n")
)
Set-Content -Path $playbookSource -Value $playbook -Encoding UTF8
Copy-Item $playbookSource $playbookRoot -Force

$templates = @'
# TradeBase — Plantillas de Expedientes Prioritarios

> **Fecha de corte:** 10/03/2026  
> **Rol:** plantillas operativas para convertir el foco 2026 en expedientes presentables.  
> **Ámbito:** TradeBase SL con sede en **Fresno de la Vega**, 2 socios `50/50`, `30.000 EUR` de fondos propios y primera vertical **Tracciona**.  
> **Se usan junto con:** [SUBVENCIONES-PLAYBOOK.md](C:/TradeBase/SUBVENCIONES-PLAYBOOK.md), [SUBVENCIONES.md](C:/TradeBase/SUBVENCIONES.md), [DECISIONES-FINANCIERAS.md](C:/TradeBase/DECISIONES-FINANCIERAS.md) y [PRESUPUESTOS.md](C:/TradeBase/PRESUPUESTOS.md).

---

## Uso del documento

- Cada plantilla está pensada para abrir una carpeta o expediente real.
- No sustituye la convocatoria viva ni el criterio del asesor.
- El objetivo es evitar empezar cada línea desde cero.

## Carpeta base recomendada

```text
EXPEDIENTE-XX-NOMBRE/
  01-portada-y-resumen/
  02-societario/
  03-financiero/
  04-producto-y-mercado/
  05-innovacion-y-tecnica/
  06-territorio-y-sede/
  07-fiscal/
  08-anexos-y-evidencias/
```

---

## 1. Plantilla `#12` — Certificación startup

**Fuente oficial**

- ENISA: https://www.enisa.es/es/certifica-tu-startup/faqs
- Ley 28/2022: https://www.boe.es/eli/es/l/2022/12/21/28

**Objetivo**

- Obtener la certificación de empresa emergente.
- Abrir la excepción fiscal relevante para el `50/50`.
- Reforzar señal institucional de innovación y escalabilidad.

**Núcleo del expediente**

| Bloque | Qué debe contener |
|---|---|
| Sociedad | escritura, cap table, NIF, alta y estructura de socios |
| Innovación | arquitectura, diferenciación, backlog técnico, automatización y propuesta tecnológica |
| Escalabilidad | multi-vertical, coste marginal bajo, modelo SaaS/plataforma, recurrencia |
| Mercado | problema, cliente, vertical inicial, expansión prevista |
| Equipo | rol de cada socio y capacidad de ejecución |

**Narrativa base para TradeBase**

- Plataforma tecnológica B2B vertical.
- Primera vertical: `Tracciona`.
- Evolución natural: `CampoIndustrial`.
- Base tecnológica propia y reutilizable.
- Sede en Fresno con posibilidad de empleo digital rural.

**Checklist mínimo**

- escritura con ambos socios fundadores
- explicación clara de producto y no solo de intermediación
- capturas, flujos y demo
- memoria breve de innovación
- explicación de escalabilidad

**Errores a evitar**

- venderlo como “marketplace sin tecnología propia”
- centrar el relato en compraventa manual
- no explicar escalabilidad

---

## 2. Plantilla `#27` — IRPF socios

**Fuentes oficiales**

- AEAT deducción estatal: https://sede.agenciatributaria.gob.es/Sede/Ayuda/24Presentacion/100/9_2.html
- AEAT Castilla y León: https://sede.agenciatributaria.gob.es/Sede/eu_es/ayuda/manuales-videos-folletos/manuales-practicos/irpf-2023/c17-deducciones-autonomicas-cuota/comunidad-castilla-leon/fomento-emprendimiento.html

**Objetivo**

- Dejar listo el pack fiscal para que el `50/50` no quede mal montado.

**Núcleo del expediente**

| Bloque | Qué debe contener |
|---|---|
| Inversión | desembolso de cada socio y prueba bancaria |
| Escritura | participaciones, socios fundadores, fecha |
| Fondos propios | capital + aportación adicional correctamente instrumentada |
| Certificación startup | si se obtiene, documento acreditativo para la excepción estatal |
| Asesoría | nota fiscal final sobre aplicación concreta |

**Checklist mínimo**

- justificante de desembolso de ambos socios
- escritura inscrita
- cuadro de fondos propios
- criterio fiscal final del asesor

**Errores a evitar**

- asumir que estatal y CyL suman sobre la misma base
- asumir que el `50/50` funciona fiscalmente igual sin certificación startup

---

## 3. Plantilla `#24` — I+D+i

**Fuentes oficiales**

- AEAT I+D+i: https://sede.agenciatributaria.gob.es/Sede/impuesto-sobre-sociedades/brexit/deduccion-actividades-investigacion-desarrollo-innovacion.html
- LIS: https://www.boe.es/buscar/act.php?id=BOE-A-2014-12328

**Objetivo**

- Convertir trabajo técnico real en soporte fiscal defendible.

**Núcleo del expediente**

| Bloque | Qué debe contener |
|---|---|
| Proyecto técnico | módulos, hipótesis, incertidumbre técnica, resultados |
| Trazabilidad | horas, commits, issues, decisiones de arquitectura |
| Costes | personal, colaboradores, servicios y materiales elegibles |
| Evidencia | demos, pruebas, experimentos, errores, benchmark |
| Cierre fiscal | clasificación preliminar I+D vs IT y cuadro de gastos |

**Narrativa base para TradeBase**

- Motor de valoración y automatización comercial/documental.
- Procesamiento de datos del mercado B2B industrial.
- Arquitectura reusable multi-vertical.

**Checklist mínimo**

- timesheet técnico
- issues / sprints
- repositorio ordenado
- memoria trimestral
- cuadro de gastos por proyecto

**Errores a evitar**

- llamar I+D a simple integración de SaaS externos
- mezclar gasto comercial con gasto técnico

---

## 4. Plantilla `#4` — Creación de Empresas CyL

**Fuentes oficiales**

- Sede JCyL 2025: https://www.tramitacastillayleon.jcyl.es/web/jcyl/AdministracionElectronica/es/Plantilla100Detalle/1251181050732/Ayuda012/1285499531893/Propuesta
- BOCyL bases: https://bocyl.jcyl.es/eli/es-cl/o/2025/03/03/eyh201/

**Objetivo**

- Presentar proyecto de creación y puesta en marcha de nueva actividad **antes de su ejecución completa**.

**Núcleo del expediente**

| Bloque | Qué debe contener |
|---|---|
| Proyecto | descripción de la actividad nueva en CyL |
| Presupuesto | pool específico `#4`, entre mínimos y máximos elegibles |
| Calendario | qué está hecho y qué sigue pendiente a fecha de solicitud |
| Finanzas | plan de financiación y sostenibilidad |
| Actividad | CNAE, encaje sectorial y lanzamiento |

**Checklist mínimo**

- memoria de creación y puesta en marcha
- presupuesto elegible separado
- cronograma que pruebe que el proyecto no está concluido materialmente
- documentación societaria

**Errores a evitar**

- presentar cuando el proyecto ya está prácticamente terminado
- meter gastos sin separar del resto del lanzamiento
- usar una descripción ambigua de la actividad

---

## 5. Plantilla `#1` — Plan Emprendedores León

**Fuente oficial**

- Diputación de León: https://sede.dipuleon.es/carpetaciudadana/tramite.aspx?idtramite=27635

**Objetivo**

- Aprovechar la línea provincial más lógica de Año 1.

**Núcleo del expediente**

| Bloque | Qué debe contener |
|---|---|
| Empresa | datos básicos, sede y forma jurídica |
| Proyecto | actividad, lanzamiento y empleo previsto |
| Territorio | encaje rural y provincial |
| Inversión | gastos e inversión subvencionable |
| Viabilidad | plan de ingresos y tesorería |

**Narrativa base para TradeBase**

- Empresa tecnológica implantada en Fresno.
- Actividad económica real desde León rural.
- Digitalización de un mercado B2B tradicional.

**Checklist mínimo**

- memoria ejecutiva
- presupuesto
- calendario de lanzamiento
- soporte de sede

**Errores a evitar**

- no aterrizar la utilidad provincial del proyecto
- sonar a startup abstracta sin implantación real

---

## 6. Plantilla `#21` — MITECO Reto Demográfico

**Fuentes oficiales**

- Sede MITECO: https://sede.miteco.gob.es/portal/site/seMITECO/ficha-procedimiento?procedure_suborg_responsable=257&procedure_etiqueta_pdu=null&procedure_id=1130&by=theme
- Nota 2025: https://www.lamoncloa.gob.es/serviciosdeprensa/notasprensa/transicion-ecologica/paginas/2025/041225-proyectos-despoblacion.aspx

**Objetivo**

- Preparar una memoria territorial específica y separada del lanzamiento base.

**Núcleo del expediente**

| Bloque | Qué debe contener |
|---|---|
| Territorio | Fresno, población, entorno, necesidad y oportunidad |
| Proyecto | qué problema rural resuelve el proyecto |
| Innovación | por qué no es solo comercio electrónico |
| Impacto | empleo, fijación de actividad, digitalización local |
| Presupuesto | pool propio `#21`, independiente del Año 1 base |

**Narrativa base para TradeBase**

- Plataforma tecnológica implantada en municipio rural elegible.
- Empleo digital cualificado desde Fresno.
- Evolución hacia `CampoIndustrial` y digitalización del tejido agroindustrial.

**Checklist mínimo**

- dirección exacta de sede
- título de uso del espacio
- prueba de conectividad
- memoria territorial
- presupuesto independiente
- cartas o apoyos si existen

**Errores a evitar**

- presentar un proyecto genérico sin anclaje territorial
- reciclar la memoria de lanzamiento sin adaptación
- depender solo del argumento “estamos en un pueblo”

---

## Orden de uso recomendado

1. Abrir primero `#12`, `#27` y `#24`.
2. Preparar `#4` y `#1` en paralelo.
3. Dejar `#21` en pre-expediente hasta tener base territorial completa.

## Regla final

- Si una plantilla se empieza a usar de verdad, debe convertirse en carpeta/expediente con nombre, fecha y responsable.
- Si cambia la convocatoria viva, se corrige primero la plantilla y luego el expediente.
'@

Set-Content -Path $templatesSource -Value $templates -Encoding UTF8
Copy-Item $templatesSource $templatesRoot -Force

$readme = Get-Content $readmeRoot -Raw

if ($readme -notmatch 'PLANTILLAS-EXPEDIENTES-PRIORITARIOS\.md') {
  $newSupport = @"
## Documentos de apoyo operativo

| Documento | Rol |
|---|---|
| [SUBVENCIONES-PLAYBOOK.md](SUBVENCIONES-PLAYBOOK.md) | Playbook profundo para leer cada ayuda, optimizar el encaje y preparar expedientes |
| [PLANTILLAS-EXPEDIENTES-PRIORITARIOS.md](PLANTILLAS-EXPEDIENTES-PRIORITARIOS.md) | Plantillas operativas para convertir el foco 2026 en expedientes reales |
"@

  $readme = [regex]::Replace(
    $readme,
    '(?s)## Documentos paralelos fuera del núcleo principal',
    ($newSupport.TrimEnd() + "`r`n`r`n## Documentos paralelos fuera del núcleo principal"),
    1
  )

  $oldPdf = '- [SUBVENCIONES-PLAYBOOK.pdf](SUBVENCIONES-PLAYBOOK.pdf)'
  $newPdf = @"
- [SUBVENCIONES-PLAYBOOK.pdf](SUBVENCIONES-PLAYBOOK.pdf)
- [PLANTILLAS-EXPEDIENTES-PRIORITARIOS.pdf](PLANTILLAS-EXPEDIENTES-PRIORITARIOS.pdf)
"@
  $readme = $readme.Replace($oldPdf, $newPdf.TrimEnd())

  Set-Content -Path $readmeRoot -Value $readme -Encoding UTF8
}

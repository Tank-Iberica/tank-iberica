$ErrorActionPreference = 'Stop'

$path = 'C:\TradeBase\Proyecto\05-financiero\DECISIONES-FINANCIERAS.md'
$text = Get-Content $path -Raw

$text = $text.Replace(
  '> **Documento de trabajo · Marzo 2026 · Versión 1.12**',
  '> **Documento de trabajo · Marzo 2026 · Versión 1.13**'
)

$section = @'
### 7. Producto, evidencia y expediente — foco 2026

> Regla operativa: no conviene intentar “optimizar el producto para todas las ayudas”. En 2026 solo merece la pena reforzar el producto y la evidencia en las **6 líneas activas**, y hacerlo de forma reutilizable.

| Línea / bloque | Qué tiene que ver un tercero para creerlo | Qué conviene reforzar en producto | Evidencia mínima a preparar |
|---|---|---|---|
| **#27 IRPF socios** | Que la inversión está bien estructurada y que la sociedad puede acogerse a la deducción sin fisuras formales | Aquí el producto pesa poco de forma directa; lo que ayuda es que la narrativa de startup sea consistente con `#12` | Escritura, aportaciones, cap table, coordinación con gestoría y trazabilidad de desembolso |
| **#12 Certificación startup** | Que TradeBase es una startup tecnológica escalable, no una web sectorial básica | Arquitectura propia, motor de valoración, capa dealer profesional y diferenciación clara frente a clasificados tradicionales | Memoria ENISA, capturas del producto, roadmap técnico, relato de escalabilidad y primeras señales de mercado |
| **#24 I+D+i** | Que existe trabajo técnico real, no solo desarrollo rutinario | Registro de experimentos, datasets, iteraciones de producto, decisiones de arquitectura y evolución del motor propio | Repos limpios, issues, horas, memoria técnica, gastos asociados y trazabilidad contable |
| **#4 Creación Empresas CyL** | Que la empresa nace con producto real, presupuesto serio y salida al mercado plausible | MVP funcional, onboarding inicial, propuesta de valor bien cerrada y roadmap de 12 meses defendible | Memoria de proyecto, presupuesto elegible, cronograma, actividad prevista y soporte societario/fiscal |
| **#1 Plan Emprendedores León** | Que la actividad es real, reciente y con base efectiva en León rural | Prueba de operativa desde Fresno, primeras acciones comerciales y servicio identificable | Alta IAE, memoria breve, dirección operativa, presupuesto y evidencias básicas de actividad |
| **Bloque #8 / #9 / #10 + #18** | Que hay necesidades concretas de digitalización, innovación y ciberseguridad sobre las que actuar | CRM, analítica de leads, reporting comercial, flujos internos y security-by-design visibles | Diagnósticos, plan de implantación, inventario de procesos, medidas de ciber y hoja de mejora |

#### Palancas transversales que mejoran varias líneas a la vez

1. **Motor de valoración propio**: refuerza `#12`, `#24` y mejora el relato en `#4`.
2. **Capa dealer profesional completa**: refuerza `#4`, `#8`, `#9`, `#10` y la credibilidad operativa general.
3. **Trazabilidad técnica y fiscal desde el día 1**: hace viable `#24` y evita perder orden documental cuando lleguen más líneas.
4. **Narrativa territorial real desde Fresno**: mejora `#1`, prepara `#21` y hace más coherente el proyecto ante terceros.
5. **Señales tempranas de mercado**: cartas de interés, primeras altas, leads o pilotos mejoran `#4`, `#12` y cualquier conversación futura de financiación.

> **Criterio práctico:** si una mejora no ayuda al menos a dos de estas líneas, no debería ganar prioridad frente al roadmap normal de producto.

'@

$anchor = "## Análisis de sede — Fresno decidido y alternativas valoradas"
if ($text.Contains($section.Trim())) {
  throw 'La sección ya existe.'
}

if (-not $text.Contains($anchor)) {
  throw 'No se encontró el ancla de inserción.'
}

$text = $text.Replace($anchor, $section + $anchor)

Set-Content -Path $path -Value $text -Encoding UTF8

rg -n "Versión 1\.13|### 7\. Producto, evidencia y expediente|Palancas transversales" $path

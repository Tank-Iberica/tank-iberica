# Tomo #24 - Deducciones I+D+i en el Impuesto sobre Sociedades

> **Rol:** monografía operativa, técnica y fiscal para convertir el trabajo de producto de TradeBase en una deducción defendible por I+D o innovación tecnológica, sin improvisar la prueba al cierre del ejercicio.  
> **Ámbito:** TradeBase, S.L. en fase temprana, con producto software B2B, sede en Fresno de la Vega y primera vertical Tracciona.  
> **Fecha de corte:** 11/03/2026.  
> **Fuentes principales:**
> - AEAT I+D+i: https://sede.agenciatributaria.gob.es/Sede/impuesto-sobre-sociedades/brexit/deduccion-actividades-investigacion-desarrollo-innovacion.html
> - Ley 27/2014 del Impuesto sobre Sociedades: https://www.boe.es/buscar/act.php?id=BOE-A-2014-12328
> - Documento interno: [ARQUITECTURA-ESCALABILIDAD.md](C:/TradeBase/Tracciona/docs/tracciona-docs/referencia/ARQUITECTURA-ESCALABILIDAD.md)
> - Documento interno: [ESTRATEGIA-NEGOCIO.md](C:/TradeBase/Tracciona/docs/ESTRATEGIA-NEGOCIO.md)

---

## 1. Ficha de trabajo

| Campo | Detalle |
|---|---|
| Organismo | AEAT |
| Naturaleza | Incentivo fiscal en el IS |
| Qué reconoce | Gastos de I+D o innovación tecnológica bien documentados |
| Qué no es | No es subvención competitiva ni ayuda con convocatoria |
| Cuello de botella TradeBase | Mezclar desarrollo normal con verdadera innovación y no dejar trazabilidad técnica-contable desde el día 1 |
| Hipótesis de partida | TradeBase puede defender con bastante seguridad innovación tecnológica; I+D en sentido fuerte dependerá de cómo se formalicen algunos módulos propios |
| Decisión actual | `GO`, pero solo si se trata como disciplina continua, no como reconstrucción en diciembre |

---

## 2. Qué se está decidiendo realmente

La línea `#24` no premia el hecho de programar. Premia una cosa más exigente: que podáis probar que parte del gasto incurrido por la sociedad se destinó a actividades que, a efectos fiscales, son:

1. **Investigación y desarrollo**, o
2. **Innovación tecnológica**.

La diferencia importa porque cambia:

- la intensidad de la deducción;
- el nivel de defensa técnica;
- el riesgo de inspección;
- y la documentación necesaria.

En una empresa como TradeBase, el error típico es tratar todo el desarrollo del producto como si fuera automáticamente I+D. Eso no se sostiene. El criterio correcto es separar:

- lo que es desarrollo normal o adaptación de software;
- lo que es innovación tecnológica defendible;
- y lo que, si se trabaja bien, podría llegar al umbral de I+D.

---

## 3. Marco normativo: qué base legal manda

La LIS distingue dos categorías relevantes:

### 3.1 Investigación y desarrollo

Es la categoría fuerte. Exige novedad o avance técnico más serio, con incertidumbre real y generación de conocimiento o resolución no obvia de problemas técnicos.

### 3.2 Innovación tecnológica

Es la categoría más probable para una software company temprana como TradeBase. No exige la misma intensidad de salto científico o tecnológico, pero sí una mejora tecnológica apreciable en productos o procesos, bien acreditada.

### 3.3 Qué significa esto para TradeBase

TradeBase no debe construir el expediente diciendo "todo es I+D". Debe construirlo en dos capas:

- **capa base segura:** innovación tecnológica (`12%`);
- **capa ambiciosa y selectiva:** solo algunos módulos concretos podrían defenderse como I+D si el expediente técnico se eleva de verdad.

---

## 4. Qué partes del producto son candidatas reales

## 4.1 Capa que casi seguro puede defenderse como innovación tecnológica

### Plataforma vertical B2B con flujos específicos de captación y estructuración

El producto no es una web estática ni un CMS genérico. Tiene lógica de proceso, captación profesional, publicación y monetización específica. Eso ayuda a defender innovación tecnológica si se acredita la mejora funcional y operativa.

### Dealer stack y automatización operativa

Todo lo que convierta un proceso sectorial manual en un flujo digital estructurado ayuda mucho:

- intake profesional;
- CRM o backoffice dealer;
- estructuración de información;
- reporting;
- flujos documentales.

### Infraestructura multi-vertical y configuración reusable

La capacidad de desplegar verticales con un núcleo común y configuración diferencial puede ser una mejora tecnológica defendible. No porque "escale", sino porque existe un diseño de producto y arquitectura que resuelve reutilización real.

## 4.2 Capa que podría aspirar a I+D si se documenta muy bien

### Motor de valoración propio

Si se queda en heurísticas de negocio y reglas sencillas, será innovación tecnológica o incluso desarrollo normal. Si incorpora:

- modelos propios;
- datasets estructurados propios;
- problemas de calidad de datos;
- validación y comparación sistemática;
- incertidumbre técnica real;

entonces puede empezar a acercarse al terreno I+D.

### Pipeline de extracción, normalización y enriquecimiento no trivial

Si el trabajo se limita a conectar APIs, la defensa flojea. Si se demuestra que había problemas no resueltos de:

- extracción estructurada;
- normalización consistente;
- control de error;
- robustez del pipeline;
- o tratamiento de datos heterogéneos,

entonces la defensa mejora mucho.

---

## 5. Qué NO cuenta o cuenta muy mal

### 5.1 Trabajo comercial o de marketing

No entra por el simple hecho de apoyar al producto.

### 5.2 Mantenimiento ordinario

Bugfixes normales, soporte rutinario, operaciones corrientes o mejoras cosméticas no deberían formar parte de la base.

### 5.3 Integraciones triviales

Conectar herramientas de terceros sin aportar problema técnico propio no suele bastar para una defensa fuerte.

### 5.4 Trabajo reconstruido sin rastro

Horas inventadas a final de ejercicio, sin commits, sin issues, sin decisiones técnicas, sin hitos, es uno de los mayores riesgos.

---

## 6. Cómo clasificar el trabajo de TradeBase sin autoengañarse

Necesitáis una taxonomía interna de tareas. Recomiendo esta:

| Categoría | Entra | Intensidad probable |
|---|---|---|
| Operación comercial / marketing | No | Ninguna |
| Desarrollo rutinario / mantenimiento | No o muy débil | No deducible o muy discutible |
| Mejora tecnológica del producto o proceso | Sí | Innovación tecnológica |
| Resolución de incertidumbre técnica no obvia | Sí, si se prueba | Potencial I+D |

### Regla de prudencia

Si una tarea puede explicarse como "desarrollo normal que cualquier equipo haría sin incertidumbre técnica reseñable", no la subáis a I+D.

---

## 7. Qué prueba técnica hace falta de verdad

## 7.1 Repositorio y commits

No basta con tener Git. Hay que poder leer el repositorio como prueba:

- ramas o hitos reconocibles;
- issues enlazables a trabajo;
- commits con sentido;
- milestones de evolución.

## 7.2 Backlog y decisiones de arquitectura

Debe existir una memoria viva de:

- problema técnico a resolver;
- alternativas contempladas;
- decisión adoptada;
- riesgos;
- validación.

## 7.3 Registro de horas

Sin hours tracking o al menos imputación razonable y continua, la base fiscal se deshace.

### Estándar mínimo defendible

- imputación mensual;
- por persona;
- por proyecto o módulo;
- distinguiendo técnico deducible de no deducible.

## 7.4 Evidencia de incertidumbre

Aquí se gana o se pierde la parte de I+D. Hay que poder enseñar:

- hipótesis;
- pruebas;
- iteraciones;
- fallos;
- restricciones técnicas;
- y por qué la solución no era trivial.

---

## 8. Qué costes son los más útiles para construir base

No voy a inflar una lista cerrada donde la AEAT y la práctica contable exigen lectura fina, pero sí te doy la lógica correcta.

### 8.1 Costes que normalmente ayudan mucho

- dedicación técnica imputable de socios o personal si está correctamente soportada;
- servicios externos técnicos vinculados a módulos concretos;
- consumos tecnológicos directamente ligados al desarrollo experimental o innovador;
- amortización o uso de activos afectos cuando proceda y esté bien soportado.

### 8.2 Costes que suelen contaminar la base si se meten sin criterio

- comercial;
- marketing;
- branding;
- administración general;
- operaciones ordinarias no ligadas a innovación.

### Regla práctica

Todo coste debe poder responder a esta pregunta:

> ¿Qué parte concreta de este gasto se destinó al módulo innovador, y con qué prueba lo puedo demostrar?

Si no se puede responder, no debe ir a la base.

---

## 9. Cómo aterrizarlo a TradeBase: módulos y tratamiento recomendado

## 9.1 Core multi-vertical

**Tratamiento prudente:** innovación tecnológica.

**Qué habría que probar para subirlo a I+D:**

- que la arquitectura resuelve un problema técnico no obvio de configuración, despliegue y reutilización;
- que hubo incertidumbre real en el diseño.

## 9.2 Motor de valoración de mercado

**Tratamiento prudente:** innovación tecnológica alta o potencial I+D selectivo.

**Qué le falta hoy para ser I+D fuerte:**

- diseño explícito de hipótesis;
- datasets y variables estructuradas;
- validación técnica documentada;
- fracaso y aprendizaje trazables.

## 9.3 Pipeline de captación y estructuración de oferta

**Tratamiento prudente:** innovación tecnológica.

**Qué le haría subir de nivel:**

- mostrar problemas duros de extracción, normalización y calidad de datos;
- demostrar que la solución no era configuración estándar.

## 9.4 Dealer toolkit y reporting

**Tratamiento prudente:** innovación tecnológica si la mejora de proceso es real.

**Qué no conviene hacer:**

vender esto como I+D si en realidad es una capa de software profesional bien ejecutada pero sin incertidumbre técnica especial.

---

## 10. Qué estructura documental os recomiendo implantar ya

### Carpeta `IDI/00-criterio`

- nota interna con taxonomía de tareas;
- criterio de clasificación `I+D / IT / no deducible`.

### Carpeta `IDI/01-horas`

- hojas mensuales;
- imputación por módulo.

### Carpeta `IDI/02-tecnico`

- decisiones de arquitectura;
- issues;
- experimentos;
- capturas o esquemas.

### Carpeta `IDI/03-costes`

- cuadro de costes por módulo;
- facturas técnicas;
- criterio de imputación.

### Carpeta `IDI/04-memoria`

- memoria acumulativa trimestral;
- versión anual consolidada.

---

## 11. Cómo redactar la memoria técnica para que sirva ante tercero

No hace falta que la memoria sea académica, pero sí debe poder sostener cuatro cosas:

1. **qué problema existía**;
2. **qué incertidumbre o reto técnico real había**;
3. **qué solución se probó o desarrolló**;
4. **qué resultado se obtuvo**.

### Forma mala

> Desarrollamos una plataforma con IA y automatización.

### Forma defendible

> Se diseñó y validó un flujo de captura y estructuración de información profesional heterogénea para un mercado industrial con datos incompletos, mediante un sistema propio de normalización, categorización y validación, cuyo desarrollo exigió iteraciones sucesivas de diseño, pruebas de consistencia y ajuste de arquitectura para garantizar reutilización multi-vertical y rendimiento aceptable.

---

## 12. Errores que tumban esta línea

### Error 1: intentar decidir la calificación en diciembre

Eso lleva a reconstrucción, no a prueba.

### Error 2: llamar I+D a todo

Eso hace el expediente menos creíble, no más.

### Error 3: no separar módulos

Sin separación por proyecto o módulo, la base fiscal se vuelve un saco.

### Error 4: mezclar gasto técnico y no técnico

El expediente pierde limpieza y aumenta el riesgo.

### Error 5: no tener respaldo externo si la ambición sube

Si queréis defender importes relevantes o calificación exigente, conviene valorar informe experto o informe motivado vinculante.

---

## 13. Informe Motivado Vinculante y estrategia de prudencia

No siempre es obligatorio, pero en una empresa como TradeBase puede convertirse en la diferencia entre:

- una deducción razonable y tranquila;
- y una deducción agresiva pero frágil.

### Mi recomendación

- Año 1: implantar disciplina documental;
- cierre del primer ejercicio: valorar si la cuantía y la ambición justifican informe motivado;
- si se busca además `#25` Sello Pyme Innovadora, esta vía gana todavía más sentido.

---

## 14. Secuencia operativa correcta

1. Definir la taxonomía de tareas.
2. Empezar registro mensual de horas y módulos.
3. Separar lo técnico deducible de lo no deducible.
4. Consolidar memoria trimestral.
5. Cerrar memoria anual y base de costes.
6. Decidir el nivel de ambición: innovación tecnológica segura o defensa selectiva de I+D.
7. Liquidar con criterio y soporte probatorio.

---

## 15. Go / no-go

### GO

- existe trazabilidad técnica continua;
- existe trazabilidad de costes;
- se distinguen módulos y categorías de trabajo;
- se adopta una postura prudente sobre I+D vs innovación tecnológica.

### NO-GO

- todo el expediente depende de reconstrucción retrospectiva;
- no hay hours tracking;
- no hay separación de módulos;
- se pretende llamar I+D a desarrollo ordinario sin prueba.

### NOT YET

- el producto existe, pero aún no se implantó disciplina documental;
- o hay cierta trazabilidad técnica, pero no contable.

---

## 16. Conclusión

Para TradeBase, `#24` puede ser una de las líneas más valiosas y repetibles del mapa, pero solo si se trata como una función de control desde el inicio. Si se intenta salvar al cierre del ejercicio, se convertirá en una deducción pequeña, frágil o directamente descartable. El enfoque correcto es simple:

- separar módulos;
- separar tipos de trabajo;
- documentar cada mes;
- y defender con prudencia lo que de verdad sea innovación o, si procede, I+D.

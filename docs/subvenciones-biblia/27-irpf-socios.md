# Tomo #27 — IRPF socios en empresa de nueva o reciente creación

> **Rol:** monografía operativa y fiscal para decidir si TradeBase puede capturar la deducción estatal por inversión en empresa nueva o de reciente creación, qué requisitos exactos hay que cumplir y cómo blindar el expediente probatorio.  
> **Ámbito:** TradeBase, S.L. con 2 socios al `50/50`, `30.000 EUR` de fondos propios iniciales y sede en Fresno de la Vega.  
> **Fecha de corte:** 11/03/2026.  
> **Fuentes principales:**
> - AEAT deducción estatal: https://sede.agenciatributaria.gob.es/Sede/Ayuda/24Presentacion/100/9_2.html
> - Ley IRPF: https://www.boe.es/buscar/act.php?id=BOE-A-2006-20764
> - AEAT Castilla y León: https://sede.agenciatributaria.gob.es/Sede/eu_es/ayuda/manuales-videos-folletos/manuales-practicos/irpf-2023/c17-deducciones-autonomicas-cuota/comunidad-castilla-leon/fomento-emprendimiento.html
> - ENISA certificación startup: https://www.enisa.es/es/certifica-tu-startup/faqs

---

## 1. Ficha de trabajo

| Campo | Detalle |
|---|---|
| Organismo | AEAT / Junta de Castilla y León |
| Naturaleza | Incentivo fiscal en IRPF, no subvención competitiva |
| Qué premia | La inversión en participaciones/acciones de empresa que cumple los requisitos legales |
| Qué no es | No es una ayuda que se "conceda" con expediente separado |
| Cuello de botella TradeBase | `50/50` + necesidad de encajar actividad económica real + dependencia práctica de `#12` |
| Resultado máximo práctico hoy | Vía estatal, condicionada; vía autonómica bloqueada en `50/50` |
| Decisión operativa actual | `NOT YET` hasta cerrar estructura probatoria y resultado de `#12` |

---

## 2. Qué se está jugando realmente aquí

La línea `#27` solo parece simple cuando se describe mal. La realidad es otra: no estáis intentando "pedir una deducción"; estáis intentando demostrar que una inversión hecha por dos socios fundadores en una sociedad recién creada cumple simultáneamente:

1. los requisitos de la entidad;
2. los requisitos de cada contribuyente;
3. los requisitos de base deducible;
4. las reglas de incompatibilidad entre deducción estatal y autonómica;
5. y, en vuestro caso, la excepción por empresa emergente para que el `50/50` no mate la estatal.

Por eso esta línea no se resuelve con una tabla. Se resuelve con diseño societario, prueba bancaria, prueba de actividad económica y disciplina documental.

---

## 3. Marco normativo de verdad

### 3.1 Capa estatal

La deducción estatal descansa en la normativa del IRPF y en el criterio operativo de la AEAT sobre inversión en empresas de nueva o reciente creación. La AEAT no mira solo la existencia de la sociedad. Mira:

- forma societaria válida;
- naturaleza no cotizada;
- fondos propios dentro del límite;
- existencia de actividad económica real;
- porcentaje máximo de participación;
- permanencia mínima;
- certificación societaria;
- y, si se invoca la excepción de fundadores de empresa emergente, que `#12` exista y sea defendible.

### 3.2 Capa autonómica de Castilla y León

La deducción autonómica de Castilla y León no es una simple "capa extra". Tiene reglas propias:

- porcentaje distinto;
- máximo de deducción propio;
- límite de participación distinto (`45%`);
- condición territorial de inversión en Castilla y León;
- y condición laboral/empleo o asimilada.

En una estructura `50/50`, esto no os sirve hoy como vía natural. La línea autonómica importa para evitar un error: **no presupuestar una deducción que el cap table ya impide**.

---

## 4. Requisitos estatales desglosados uno por uno

### 4.1 La entidad debe ser SA, SL, SAL o SLL y no cotizar

**Qué significa realmente**

TradeBase debe existir como sociedad de capital válida para la deducción. Una SL encaja. No hace falta complejidad adicional.

**Qué prueba vale**

- escritura de constitución;
- NIF definitivo;
- inscripción registral o, como mínimo, trazabilidad de constitución si el registro está en curso;
- pacto de socios, si existe, como apoyo interno, no como prueba principal.

**Qué no vale**

- operar como autónomo y pensar que luego eso se traslada automáticamente;
- una sociedad en formación con papeles sin cerrar, si luego la fecha de suscripción o la participación se vuelve confusa.

**Cómo se resuelve para TradeBase**

- constitución de SL con 2 socios fundadores;
- mención clara en escritura de ambos como otorgantes fundadores;
- reparto `50/50` perfectamente definido desde el día 1.

### 4.2 La entidad debe ejercer una actividad económica con medios personales y materiales

Este es el requisito peor entendido y el que más fácil mata la deducción si se improvisa.

#### Qué exige la AEAT en sustancia

No pide una oficina grande ni facturación elevada. Pide que la sociedad no sea una mera caja con dinero o una patrimonial. Debe existir una ordenación por cuenta propia de medios para intervenir en el mercado con bienes o servicios.

#### Umbral mínimo prudencial que yo considero defendible para TradeBase

No es un umbral legal numérico; es un estándar de defensa prudente.

**Medios personales mínimos defendibles**

- ambos socios trabajando en el proyecto o, como mínimo, uno de ellos con dedicación intensa y el otro con participación real acreditable;
- funciones separadas y explicables:
  - socio producto/tecnología;
  - socio negocio/operaciones;
- rastro de trabajo:
  - commits;
  - documentos de producto;
  - calendario de reuniones;
  - pipeline comercial;
  - emails y contactos con dealers o proveedores.

**Medios materiales mínimos defendibles**

- sede en Fresno con título de uso real;
- cuenta bancaria de la sociedad;
- dominio y correo corporativo;
- infraestructura cloud contratada;
- software operativo;
- gestoría/contabilidad;
- demo funcional o entorno de producto real.

**Actividad económica mínima defendible**

- plataforma en fase funcional, no idea vacía;
- capacidad de captar oferta profesional o al menos probar ese flujo;
- narrativa comercial identificable;
- primeras acciones reales de salida a mercado.

#### Qué os da fuerza probatoria adicional

- contrato o cesión de sede con duración razonable;
- facturas de cloud, dominio, correo, gestoría, analítica, SaaS;
- acta o documento interno describiendo actividad, funciones de socios y medios;
- capturas del producto y del panel de gestión;
- primeras comunicaciones comerciales y reuniones.

#### Qué no cuenta o cuenta poco

- solo el dinero ingresado por socios;
- un logo o una landing sin operativa;
- domicilio formal sin prueba de uso real;
- un deck de negocio sin producto o sin rastro operativo.

### 4.3 Fondos propios no superiores a `400.000 EUR`

**Qué significa**

La deducción estatal tiene techo de fondos propios de la entidad en el inicio del período impositivo en que el socio adquiere la participación.

**Aplicación a TradeBase**

Con `30.000 EUR` de fondos propios iniciales, estáis lejísimos del límite. El problema aquí no es cumplir, sino **documentar bien** el importe real de fondos propios y no confundirlo con capital nominal.

**Qué prueba vale**

- balance de apertura;
- cuadro de fondos propios;
- detalle capital / aportación adicional;
- asiento o informe de apertura contable.

### 4.4 La suscripción debe hacerse en constitución o ampliación dentro del plazo legal

En vuestro caso, la vía limpia es la constitución. Eso simplifica todo:

- fecha de entrada del dinero;
- condición de fundadores;
- cap table inicial;
- y conexión posterior con `#12`.

### 4.5 Permanencia mínima superior a 3 años e inferior a 12

**Qué implica en la práctica**

No debéis estructurar la entrada de socios pensando en salida temprana, reordenación inmediata o reventa rápida. En particular:

- no vender participaciones antes del umbral temporal;
- no plantear una reestructuración que destruya la lógica de la inversión original sin revisar antes el impacto fiscal.

**Qué control recomiendo**

- hoja interna con fecha de adquisición;
- fecha mínima a partir de la que podría analizarse salida;
- aviso a socios y asesoría de que cualquier cambio societario afecta a esta línea.

### 4.6 Participación máxima del `40%` para contribuyente + familiares

Aquí está el núcleo del problema.

**Sin empresa emergente certificada**

- socio A al `50%` incumple la regla;
- socio B al `50%` incumple la regla;
- la deducción estatal cae.

**Con empresa emergente certificada y ambos fundadores**

La excepción para socios fundadores de empresa emergente puede reabrir la vía estatal. Esa es la razón por la que `#12` no es solo reputacional: **es pieza fiscal estructural**.

### 4.7 Certificación de la sociedad para la deducción

No basta con que vosotros creáis que cumplís. Debe poder emitirse certificado societario coherente con:

- fecha de constitución;
- reparto;
- importe aportado por cada socio;
- fondos propios;
- actividad económica;
- condición de empresa emergente, si se invoca.

---

## 5. Requisitos autonómicos de Castilla y León, bien leídos

### 5.1 Participación máxima del `45%`

Con `50/50`, la vía CyL ya falla por pura estructura. No hay nada que interpretar aquí.

### 5.2 Inversión destinada a proyectos en Castilla y León

Aquí sí encajáis bien por sede en Fresno. Pero este requisito no os sirve de nada si el `50/50` ya os ha dejado fuera por porcentaje.

### 5.3 Empleo o condición asimilada

Esta es otra razón por la que la vía autonómica no debe ponerse en el modelo financiero base. Aunque resolvierais el problema del porcentaje, todavía habría que defender el componente de empleo y mantenimiento.

**Conclusión autonómica para TradeBase hoy**

- no modelarla como ayuda activa;
- no duplicar base con la estatal;
- solo reabrirla si algún día cambia la estructura de socios.

---

## 6. Qué significa realmente “mala instrumentación del desembolso”

Esta expresión no es retórica. Significa que el dinero entra en la sociedad de forma que luego no puede demostrarse con precisión:

- cuánto puso cada socio;
- qué parte fue capital;
- qué parte fue aportación adicional;
- qué fecha exacta tuvo cada ingreso;
- y cómo se refleja todo eso en escritura y contabilidad.

### 6.1 Estándar documental que recomiendo

Antes de firmar, debe existir un cuadro de inversión con estas columnas:

| Socio | Importe total | Capital social | Aportación adicional / prima | Fecha prevista de transferencia | Cuenta origen | Cuenta destino |
|---|---:|---:|---:|---|---|---|
| Socio A | `15.000` | `3.000` | `12.000` | dd/mm/2026 | IBAN origen | IBAN sociedad |
| Socio B | `15.000` | `3.000` | `12.000` | dd/mm/2026 | IBAN origen | IBAN sociedad |

### 6.2 Prueba bancaria mínima

- justificante individual de cada transferencia;
- reflejo en extracto de la sociedad;
- identificación del ordenante;
- concepto que no induzca a error.

### 6.3 Prueba societaria mínima

- escritura que refleje coherentemente la operación;
- número de participaciones;
- valor nominal;
- y, si existe prima o aportación adicional, tratamiento claro.

### 6.4 Prueba contable mínima

- asiento de apertura;
- cuadro de fondos propios;
- soporte del criterio contable aplicado.

---

## 7. Qué significa “doble cómputo estatal + autonómica” y por qué hay que prohibirlo desde el diseño

Este error nace cuando se hace el modelo financiero antes de leer bien la fiscalidad. Se suman:

- estatal `50%`;
- autonómica `20%`;
- y se presume que todo eso opera sobre la misma inversión.

Eso no es la lectura correcta.

### 7.1 Regla de prudencia para TradeBase

- no modelar estatal y CyL sobre la misma base;
- en `50/50`, ni siquiera abrir la CyL como respaldo;
- tratar `#27` como estatal condicionada por `#12`.

### 7.2 Documento interno recomendado

Preparad una nota fiscal corta con tres escenarios:

1. `50/50` sin `#12`;
2. `50/50` con `#12`;
3. escenario alternativo si algún día se altera la estructura.

Eso evita que el número fiscal se convierta en argumento comercial sin base.

---

## 8. Relato de actividad económica que deberíais poder sostener mañana

Si mañana un tercero os pide justificar que TradeBase ejerce actividad económica real, la respuesta no debe ser improvisada. Debe existir un texto estable de 1-2 páginas que diga algo parecido a esto:

> TradeBase, S.L. desarrolla y explota una plataforma tecnológica B2B para la digitalización de mercados industriales especializados. Su primera vertical operativa es Tracciona, centrada en vehículos industriales, y el modelo se apoya en infraestructura propia de software, servicios cloud, herramientas de gestión y trabajo directo de los socios fundadores en desarrollo, operaciones y salida a mercado. La sociedad cuenta con sede operativa en Fresno de la Vega, medios técnicos contratados, demo funcional, dominio propio, proveedores operativos y actividad preparatoria y comercial orientada a la captación de oferta profesional, normalización de datos y monetización recurrente.

Ese relato tiene que estar respaldado por prueba. Si no, es prosa.

---

## 9. Carpeta de prueba que deberíais poder enseñar sin improvisar

### 9.1 Carpeta societaria

- escritura;
- NIF;
- inscripción registral;
- cap table inicial;
- pacto de socios si existe.

### 9.2 Carpeta bancaria

- justificantes de aportación de los socios;
- extracto de la cuenta de la sociedad;
- cuadro de control de entradas.

### 9.3 Carpeta de actividad económica

- contrato o cesión de sede;
- facturas de dominio, cloud, correo, gestoría, herramientas;
- demo funcional;
- capturas del producto;
- roadmap técnico;
- primeras acciones comerciales.

### 9.4 Carpeta fiscal

- cuadro de fondos propios;
- certificado societario para la deducción;
- nota de criterio fiscal;
- calendario de permanencia mínima.

---

## 10. Secuencia operativa correcta para TradeBase

1. Cerrar escritura con ambos socios fundadores al `50/50`.
2. Ejecutar transferencias trazables de cada socio.
3. Cerrar balance de apertura con `30.000 EUR` de fondos propios.
4. Formalizar sede y medios operativos mínimos.
5. Congelar carpeta probatoria de actividad económica.
6. Lanzar `#12` como expediente crítico.
7. Solo después de `#12`, recalcular el uso real de `#27`.

---

## 11. Árbol de decisión real

| Pregunta | Si sí | Si no |
|---|---|---|
| ¿La sociedad está constituida y ambos figuran como fundadores? | seguir | parar |
| ¿El desembolso de ambos está trazado y documentado? | seguir | no modelar deducción |
| ¿Existen sede, medios y actividad económica defendibles? | seguir | reconstruir prueba antes de usar la línea |
| ¿El `50/50` sigue vigente? | exigir `#12` | revisar fiscalidad según nueva estructura |
| ¿Ha salido `#12`? | valorar estatal con seriedad | asumir que la estatal está muy comprometida |

---

## 12. Go / no-go

### GO

- sociedad constituida;
- ambos socios fundadores;
- dinero trazado;
- fondos propios claros;
- actividad económica real demostrable;
- `#12` favorable o, al menos, expediente muy sólido en curso si se toma postura prudente.

### NO-GO

- sociedad vacía o patrimonial de hecho;
- ausencia de prueba bancaria ordenada;
- ausencia de prueba de actividad económica;
- cap table `50/50` sin `#12` y aun así modelar ahorro fiscal como hecho.

### NOT YET

- hay escritura y dinero, pero aún no hay sede o producto defendible;
- o hay sede y producto, pero la carpeta fiscal está incompleta.

---

## 13. Conclusión

La deducción `#27` no es un bonus simpático. En TradeBase es una línea delicada y binaria. Con `50/50`, solo se convierte en palanca seria si se cierra bien la secuencia:

- estructura societaria limpia;
- prueba bancaria impecable;
- actividad económica real;
- y `#12` como llave fiscal.

Mientras una de esas cuatro piezas no exista, el enfoque correcto no es “tener cuidado”. Es **no presupuestar la deducción**.

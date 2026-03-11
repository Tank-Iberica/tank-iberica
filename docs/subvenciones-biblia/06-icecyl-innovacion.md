# Tomo #6 - ICECYL Innovacion tecnologica

> **Rol:** monografia de expediente para determinar si una eventual linea autonómica de innovacion del ICECYL puede trabajarse con rigor para TradeBase, que parte del proyecto deberia aislarse, que requisitos suelen tumbar a las pymes software cuando presentan simple desarrollo ordinario y que paquete tecnico, economico y narrativo tendria que existir para que la solicitud no se lea como "queremos subvencionar backlog".  
> **Fecha de corte:** 11/03/2026.  
> **Fuente oficial de referencia:** https://www.tramitacastillayleon.jcyl.es/web/jcyl/AdministracionElectronica/es/Plantilla100Detalle/1284933058677/Ayuda012/1285292642303/Propuesta

---

## 1. Ficha de trabajo

| Campo | Detalle |
|---|---|
| Organismo | ICECYL |
| Naturaleza | Subvencion autonómica a fondo perdido para proyectos de innovacion / I+D segun convocatoria viva |
| Estado verificable a 11/03/2026 | Sin convocatoria especifica 2026 verificada con bases nuevas; se trabaja sobre la familia oficial de ayudas de referencia |
| Cuantia / intensidad verificable en este momento | No debe darse por cerrada sin convocatoria viva; la intensidad exacta depende de la edicion que se publique |
| Pregunta clave del expediente | si el proyecto aislado supera el umbral de mejora funcional ordinaria y entra en innovacion tecnologica defendible |
| Cuello de botella TradeBase | presentar producto, UX o automatizacion generalista como si fueran innovacion subvencionable |
| Decision actual | `NOT YET` hasta que exista convocatoria compatible y paquete tecnico separado; `GO` solo con memoria tecnica propia, presupuesto aislado y problema tecnico real |

---

## 2. Que se esta decidiendo realmente

La linea no decide si TradeBase usa tecnologia. Eso se da por hecho en una startup software. Lo que suele decidir una ayuda de innovacion autonómica es algo mas concreto:

1. si existe un **problema tecnico identificable**;
2. si la solucion propuesta incorpora **incertidumbre, novedad o mejora relevante**;
3. si el proyecto puede separarse del funcionamiento ordinario de la empresa;
4. si el presupuesto que se pide responde a ese proyecto concreto y no a la operacion general.

Ese cuarto punto es el que mas mata expedientes de empresas digitales: el organo concedente suele detectar enseguida cuando el solicitante quiere vestir de innovacion lo que en realidad es desarrollo continuo del producto.

Por tanto, para TradeBase la pregunta correcta no es:

> nuestro producto es tecnologico, por que no pedir una ayuda de innovacion?

La pregunta correcta es:

> que modulo o problema tecnico concreto puede aislarse, justificarse, presupuestarse y evaluarse como proyecto de innovacion por si mismo?

---

## 3. Marco de lectura prudente para TradeBase

TradeBase tiene varios activos que ayudan:

- arquitectura multi-vertical;
- pipeline de estructuracion de datos del sector;
- automatizacion operativa y documental;
- posibilidad de motor de valoracion propio;
- combinacion de capa transaccional, CRM y modelado de informacion de mercado.

Pero ninguno de esos puntos, por si solo, abre la linea. Solo la abre si se transforman en un **proyecto tecnico acotado**.

### 3.1 Lo que podria sostener un expediente serio

1. **motor de valoracion propio con modelo explicable**  
   No como "queremos una IA", sino como sistema de estimacion basado en variables sectoriales, señales de mercado, enriquecimiento de datos y validacion cruzada.

2. **pipeline de estructuracion automatizada de inventario industrial**  
   Si existe un problema tecnico de ingesta, normalizacion, deduplicacion, clasificacion y enriquecimiento que hoy no se resuelve bien con herramientas estandar.

3. **motor de recomendacion o matching profesional**  
   Solo si se puede plantear como problema tecnico de informacion incompleta, segmentacion y priorizacion de demanda/oferta.

4. **sistema documental automatizado con logica propia**  
   Siempre que se demuestre que hay mas complejidad que un flujo no-code o un ensamblaje de APIs de terceros.

### 3.2 Lo que no deberia entrar

- rediseño de interfaz;
- funcionalidades normales de marketplace;
- integraciones triviales con APIs comunes;
- paneles internos sin complejidad tecnica reseñable;
- mantenimiento, correccion de bugs o deuda tecnica;
- compra de herramientas SaaS sin proyecto tecnico propio detras.

---

## 4. Requisitos practicos que yo impondria antes de abrir expediente

### 4.1 Requisito 1 - Proyecto tecnico separable

Debe existir un modulo o subproyecto con:

- objetivo tecnico propio;
- alcance definido;
- hitos;
- presupuesto;
- entregables;
- y prueba de que no coincide con el backlog habitual.

**Para TradeBase hoy:** el candidato mas claro seria el **motor de valoracion** o, en segundo nivel, un **pipeline de estructuracion y normalizacion de inventario**.

### 4.2 Requisito 2 - Incertidumbre tecnica real

No basta con decir que el proyecto es complejo. Hay que poder responder:

- que no se sabe hoy?;
- por que no existe una solucion directa de mercado que resuelva el problema?;
- que se va a experimentar?;
- que riesgo tecnico existe de no lograr el resultado esperado?

Si no puedes escribir cuatro paginas buenas sobre esto, el proyecto probablemente no pasa el filtro.

### 4.3 Requisito 3 - Estado del arte y comparativa

Hay que describir:

- como se resuelve hoy el problema en el mercado;
- donde fallan las soluciones existentes;
- que mejora medible plantea TradeBase;
- y por que la aproximacion propuesta no es un simple ensamblaje de herramientas.

### 4.4 Requisito 4 - Presupuesto tecnico limpio

El gasto elegible debe poder leerse linea por linea:

- personal tecnico;
- colaboraciones tecnicas;
- software o infraestructura estrictamente ligada al proyecto;
- posibles subcontrataciones especializadas;
- validaciones o pruebas.

No deberia mezclarse con:

- marketing;
- legal general;
- gastos comerciales;
- hosting ordinario de la empresa;
- SaaS generalista no ligado al modulo innovador.

---

## 5. Que haria falta crear en TradeBase para que esta linea no sea humo

### 5.1 Dossier tecnico base

Un documento de 8 a 15 paginas con esta estructura:

1. problema tecnico;
2. estado del arte;
3. hipotesis de solucion;
4. arquitectura del modulo;
5. incertidumbres;
6. plan de experimentacion;
7. metrica de exito;
8. hitos y entregables.

### 5.2 Evidencia de punto de partida

Antes de pedir dinero para innovar, hay que poder demostrar desde donde partes:

- capturas o diagrama del sistema actual;
- backlog o limitaciones actuales;
- datos de prueba o de partida;
- problemas observados.

### 5.3 Presupuesto diferenciado

Un excel o tabla donde cada coste responda a:

- que tarea lo justifica;
- que entregable genera;
- en que hito cae;
- por que es necesario para ese proyecto y no para la empresa en general.

### 5.4 Carpeta de prueba tecnica

Yo dejaria una carpeta con:

- notas tecnicas;
- benchmarking;
- experimentos;
- papers o referencias si aplica;
- decisiones de arquitectura;
- repositorio o fragmentos demostrativos.

---

## 6. Obstaculos previsibles y resolucion concreta

### 6.1 Obstaculo 1 - La memoria parece roadmap de producto

**Riesgo real**

Al evaluador le llega una lista de features:

- valoraciones;
- filtros;
- automatizacion;
- dashboard;
- recomendaciones.

Eso es un roadmap, no un proyecto de innovacion.

**Como se resuelve de verdad**

Hay que rehacer el enfoque y forzarlo a este esquema:

1. definir **un solo problema tecnico central**;
2. formularlo como problema de investigacion aplicada o desarrollo experimental;
3. separar lo accesorio;
4. dejar fuera todo lo que sea despliegue funcional ordinario.

**Prueba de que esta resuelto**

Cuando alguien lea el resumen del expediente, debe poder responder:

- cual es exactamente el problema tecnico?;
- cual es la hipotesis?;
- cual es el riesgo?;
- como se medira el exito?

Si no puede, sigue siendo roadmap.

### 6.2 Obstaculo 2 - No hay mejora objetiva frente al estado del arte

**Riesgo real**

La memoria dice "mejora eficiencia", "automatiza", "usa inteligencia artificial", pero no demuestra diferencia medible.

**Como se resuelve de verdad**

Crear una comparativa simple pero dura:

| Solucion actual | Limitacion | Propuesta TradeBase | Mejora esperada |
|---|---|---|---|
| clasificacion manual | lenta e inconsistente | normalizacion automatizada | menos tiempo y menos error |
| estimacion subjetiva | alta dispersion | modelo con variables normalizadas | mayor coherencia |

Y luego traducirla a indicadores:

- tiempo medio por anuncio;
- tiempo de estructuracion de ficha;
- dispersion de valoraciones;
- porcentaje de campos completados;
- mejora en calidad del dato.

### 6.3 Obstaculo 3 - El gasto elegible esta contaminado

**Riesgo real**

Se mezclan en la misma bolsa:

- desarrollo del modulo innovador;
- mantenimiento general;
- cloud normal de la empresa;
- marketing;
- branding.

**Como se resuelve de verdad**

Separar un **pool #6** propio con:

- personal tecnico imputable;
- proveedores tecnicos;
- infraestructuras tecnicas ligadas al modulo;
- pruebas y validaciones.

Y dejar fuera todo lo demas.

### 6.4 Obstaculo 4 - No hay trazabilidad tecnica posterior

**Riesgo real**

Se presenta una memoria aceptable, pero luego no se puede justificar:

- que se hizo;
- quien lo hizo;
- cuando se hizo;
- y que resultado tuvo.

**Como se resuelve de verdad**

Desde antes de pedir:

- repositorio etiquetado por hitos;
- carpeta de actas o decisiones tecnicas;
- diario de proyecto;
- tabla de entregables;
- evidencia de pruebas.

---

## 7. Proyecto concreto que mejor encajaria hoy

Si tuviera que elegir solo uno para TradeBase, hoy elegiria este:

### 7.1 Proyecto candidato

**Sistema propio de valoracion y estructuracion de activos industriales basado en normalizacion de fichas, enriquecimiento semiautomatizado y modelo de estimacion explicable.**

### 7.2 Por que este y no otro

Porque:

- es mas facil aislarlo del resto del producto;
- tiene una tesis tecnica mas clara;
- puede generar incertidumbre real;
- y sirve ademas para `#12`, `#13`, `#21`, `#24`, `#25` y `#26`.

### 7.3 Lo que exigiria para abrirlo

- definir variables;
- definir dataset de partida;
- definir criterio de validacion;
- describir arquitectura;
- separar presupuesto tecnico;
- demostrar que no es solo analitica comercial.

---

## 8. Documentacion exacta que prepararia

### 8.1 Carpeta juridico-administrativa

- escritura;
- NIF;
- acreditacion de representante;
- estar al corriente si la convocatoria lo exige;
- sede y actividad.

### 8.2 Carpeta tecnica

- memoria tecnica larga;
- resumen ejecutivo tecnico;
- diagrama de arquitectura;
- estado del arte;
- matriz de riesgos;
- plan de hitos.

### 8.3 Carpeta economica

- presupuesto desglosado;
- criterio de imputacion;
- calendario de gasto;
- proveedores o estimaciones comparables.

### 8.4 Carpeta de evidencia

- capturas;
- prototipos;
- experimentos;
- comparativas;
- notas de equipo.

---

## 9. Lo que no compraria como evaluador

Yo rechazaria o bajaria mucho la puntuacion si leyera:

- "vamos a aplicar IA";
- "vamos a mejorar la experiencia";
- "vamos a automatizar procesos";
- "vamos a desarrollar nuevas funcionalidades";
- "somos innovadores porque somos startup".

Todo eso puede ser verdad, pero no prueba un proyecto tecnico subvencionable.

---

## 10. GO / NO-GO / NOT YET

### GO

- convocatoria viva compatible;
- proyecto tecnico aislado;
- memoria con incertidumbre real;
- presupuesto limpio;
- trazabilidad preparada desde el inicio.

### NO-GO

- no existe modulo separable;
- la memoria sigue siendo backlog;
- no se puede justificar mejora tecnica diferencial;
- el gasto real es inseparable del desarrollo ordinario.

### NOT YET

- el proyecto candidato existe;
- pero aun no esta formalizado en memoria, presupuesto y evidencias.

---

## 11. Conclusión operativa

`#6` no debe trabajarse para "pedir otra ayuda mas". Solo tiene sentido si se convierte un bloque tecnico muy concreto de TradeBase en expediente propio. Si eso no se hace, la linea es una trampa: consume tiempo, contamina el roadmap y probablemente no pase filtro. Si si se hace, puede convertirse en una de las ayudas mas palanca de todo el mapa, porque refuerza a la vez la narrativa técnica de `#12`, `#13`, `#21`, `#24`, `#25` y `#26`.

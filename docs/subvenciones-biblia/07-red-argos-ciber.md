# Tomo #7 - Red Argos Ciber / linea ciber viva en Castilla y Leon

> **Rol:** monografia de expediente para preparar de verdad una solicitud sobre la linea ciber viva de Castilla y Leon, evitando el error tipico de intentar pasar mantenimiento general o higiene tecnica difusa como si fuera un proyecto de ciberseguridad elegible.  
> **Fecha de corte:** 11/03/2026.  
> **Fuente principal:** https://www.tramitacastillayleon.jcyl.es/web/jcyl/AdministracionElectronica/es/Plantilla100Detalle/1284933058677/Ayuda012/1285592445096/Propuesta

---

## 1. Ficha de trabajo

| Campo | Detalle |
|---|---|
| Organismo | Junta de Castilla y Leon |
| Naturaleza | Subvencion de ciberseguridad / digitalizacion especializada |
| Estado verificable | Convocatoria viva de referencia hasta 31/03/2026 |
| Intensidad verificable | `50%` para hardware y software; `75%` para consultoria; maximo `20.000 EUR` |
| Pregunta clave del expediente | si existe un proyecto ciber delimitado, con situacion de partida, medidas concretas, coste elegible separado y mejora verificable |
| Cuello de botella TradeBase | querer imputar infraestructura ordinaria o mantenimiento tecnico como si fueran un proyecto ciber subvencionable |
| Decision actual | `GO` solo con paquete ciber cerrado y presupuesto separado; `NO-GO` si se intenta usar como bolsa de gasto tecnico general |

---

## 2. Que decide realmente la linea

No decide si la empresa considera importante la seguridad. Eso es irrelevante. Decide si:

1. existe un **riesgo o carencia identificable**;
2. las medidas a implantar son **concretas y elegibles**;
3. el gasto esta **presupuestado y separado**;
4. y el resultado es **verificable**.

En otras palabras, la linea no paga "ser prudentes". Paga proyectos tecnicos delimitados.

---

## 3. Como se traduce eso a TradeBase

TradeBase es especialmente vulnerable a dos errores:

1. tratar seguridad como parte indistinta del stack;
2. pedir para tareas basicas que deberian hacerse igual aunque no hubiera ayuda.

La forma correcta de enfocar la solicitud no es:

> necesitamos mas seguridad porque somos una startup digital.

La forma correcta es:

> hoy existe un conjunto identificable de riesgos en accesos, continuidad, segregacion, logging y hardening; se propone un paquete tecnico cerrado, con entregables y pruebas de implantacion, para elevar el nivel de ciberseguridad de la sociedad.

---

## 4. Lo que probablemente si seria elegible

Tomando como referencia la linea viva, yo concentraria el expediente de TradeBase en estos bloques:

### 4.1 Gestion de identidades y accesos

- MFA obligatorio;
- cuentas privilegiadas separadas;
- gestor de secretos;
- politica de altas/bajas/cambios;
- control de accesos a paneles, infraestructura y herramientas.

### 4.2 Continuidad y recuperacion

- copias de seguridad;
- pruebas de restauracion;
- politica de retencion;
- procedimiento documentado de recuperacion.

### 4.3 Hardening e inventario

- inventario minimo de activos;
- reduccion de superficie de exposicion;
- endurecimiento de configuraciones;
- revisiones de seguridad basicas de servicios criticos.

### 4.4 Logging y monitorizacion

- centralizacion minima de logs;
- alertado basico;
- trazabilidad de accesos y eventos criticos.

### 4.5 Consultoria especializada

- diagnostico externo;
- plan de medidas;
- auditoria de configuracion;
- validacion de implantacion.

---

## 5. Lo que no deberia meterse

No meteria en esta linea:

- gasto cloud ordinario;
- licencias generales de trabajo;
- mantenimiento rutinario;
- refactorizaciones no ligadas a seguridad;
- compra de equipos sin explicacion ciber;
- horas internas difusas sin entregable ni plan.

Si el gasto entraria igual aunque la empresa no hiciera ningun proyecto de ciberseguridad, probablemente no es buen candidato.

---

## 6. Requisitos practicos que yo impondria antes de preparar la solicitud

### 6.1 Tener un punto de partida escrito

Si no puedes describir por escrito:

- que activos tienes;
- que accesos existen;
- que debilidades concretas detectas;
- y que consecuencias tendria no corregirlas,

entonces no tienes expediente; solo intuicion.

### 6.2 Tener un paquete de medidas cerrado

No vale lista abierta de buenas practicas. Tiene que quedar algo como:

| Riesgo actual | Medida | Entregable | Coste |
|---|---|---|---|
| cuentas sin MFA consistente | MFA y politica de acceso | politica + implantacion | X |
| backups no validados | backup + test de restore | informe y evidencia | Y |

### 6.3 Tener proveedor o solucion definida

La ayuda no deberia pedirse para "ya veremos que compramos". Hay que llegar con:

- proveedor;
- alcance;
- presupuesto;
- entregables.

---

## 7. Proyecto candidato razonable para TradeBase

Si tuviera que resumirlo en una sola frase:

> Plan de ciberseguridad base para TradeBase con foco en identidades, secretos, copias, logging, hardening y validacion externa.

### 7.1 Por que este proyecto encaja

- es concreto;
- responde a riesgos reales;
- genera entregables verificables;
- y no depende de inventar una ciber avanzada que todavia no necesitais.

### 7.2 Por que no intentaria hacer algo mas grande

Porque el riesgo aqui es la inflacion del proyecto. Una pyme temprana no necesita fingir un SOC. Necesita un expediente defendible, no grandilocuente.

---

## 8. Documentacion exacta que yo exigiria

### 8.1 Carpeta de situacion actual

- inventario de servicios y accesos;
- diagrama basico de infraestructura;
- lista de cuentas criticas;
- descripcion de backups actuales;
- lista de riesgos detectados.

### 8.2 Carpeta de proyecto

- memoria corta del plan ciber;
- alcance;
- justificacion tecnica;
- cronograma;
- responsables;
- matriz riesgo-medida.

### 8.3 Carpeta economica

- presupuesto por medida;
- identificacion clara de que parte es hardware/software y que parte consultoria;
- tabla de gasto elegible.

### 8.4 Carpeta de cierre

- configuraciones implantadas;
- politicas;
- capturas o reportes;
- informe del proveedor;
- prueba de restauracion o de validacion si aplica.

---

## 9. Obstaculos previsibles y como resolverlos

### 9.1 Obstaculo 1 - Querer financiar higiene basica sin proyecto

**Riesgo real**

La empresa tiene varias tareas de seguridad en mente, pero ninguna esta organizada como expediente.

**Como se resuelve**

Crear un documento unico de proyecto con:

1. estado inicial;
2. medidas;
3. entregables;
4. coste;
5. calendario.

Sin ese documento, el expediente es difuso.

### 9.2 Obstaculo 2 - No poder probar la mejora

**Riesgo real**

Se implantan cosas, pero despues no se sabe demostrar que se hicieron ni como quedo el nivel de seguridad.

**Como se resuelve**

Antes de ejecutar, definir evidencias de cierre:

- politica aprobada;
- panel o captura de MFA;
- reporte de backup;
- informe de consultoria;
- checklists de hardening.

### 9.3 Obstaculo 3 - Mezclar seguridad con infraestructura general

**Riesgo real**

Se intenta colar gasto de cloud, herramientas generales o trabajo de desarrollo normal.

**Como se resuelve**

Separar un **pool #7** propio y no contaminarlo con:

- producto;
- marketing;
- operacion;
- SaaS general.

### 9.4 Obstaculo 4 - Llegar tarde

**Riesgo real**

La ventana esta viva pero corta. Si no esta el paquete montado, la empresa pierde la linea por simple falta de preparacion.

**Como se resuelve**

Trabajar en 72 horas:

1. inventario;
2. plan;
3. presupuesto;
4. proveedor;
5. solicitud.

Esta es una de las pocas lineas donde la preparacion operativa manda mas que el relato.

---

## 10. Umbral minimo defendible para pedirla

Yo no presentaria esta ayuda si no existen, como minimo:

- inventario de activos y accesos;
- lista de riesgos priorizados;
- paquete de medidas definido;
- presupuesto del proveedor o proveedores;
- separacion clara entre consultoria y software/hardware;
- ventana viva.

---

## 11. Escenario optimo

El escenario fuerte seria:

- diagnostico externo corto;
- plan de identidad y accesos;
- backups con prueba de restauracion;
- logging y alertado minimo;
- endurecimiento de configuraciones;
- documentacion de politicas;
- cierre con informe final y evidencias.

Ese paquete no solo sirve para `#7`; tambien mejora:

- `#10` Pyme Cibersegura;
- `#12` por imagen de empresa seria;
- `#13` ENISA por madurez operativa;
- y reduce riesgo real del negocio.

---

## 12. GO / NO-GO / NOT YET

### GO

- paquete ciber acotado;
- presupuesto separado;
- entregables definidos;
- ventana abierta.

### NO-GO

- solo hay ganas de mejorar seguridad;
- no hay proyecto cerrado;
- el gasto es infraestructura ordinaria.

### NOT YET

- necesidad real;
- pero todavia no existe plan, proveedor o tabla de gasto elegible.

---

## 13. Conclusión operativa

`#7` es una buena linea para TradeBase precisamente porque obliga a hacer lo que igual deberiais hacer de todos modos, pero con metodo. No hay que inflarla. Cuanto mas sobria, concreta y verificable sea la solicitud, mejor. Si se intenta convertir en una bolsa de gasto tecnico general, se desactiva sola.

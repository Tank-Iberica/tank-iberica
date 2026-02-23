## ANEXO B: VERTICALES FUTUROS (Posibilidades identificadas)

Estos verticales NO están en el roadmap inmediato pero encajan en la arquitectura multi-vertical. Se documentan para evaluar cuando los 7 primeros estén rodando.

### B.1 Relevo.com — Traspaso de Negocios

**Concepto:** Marketplace de traspasos de negocios en funcionamiento (bares, restaurantes, comercios, gimnasios, ecommerce).

**Por qué encaja:**

- Mercado enorme en España con digitalización muy pobre
- Competencia débil (Milanuncios sección cutre, Traspasalia/Globaliza webs anticuadas)
- Tickets altos (30K-300K€ por traspaso)
- Sinergia natural con Horecaria: alguien que traspasa un bar puede vender equipamiento por separado

**Por qué es diferente:**

- No se vende un activo físico sino un negocio en funcionamiento
- La ficha incluye: facturación, beneficio neto, alquiler, licencias, empleados, clientela, deuda
- Requiere verificación más compleja (¿es real la facturación declarada?)
- El proceso de compra es más largo y complejo (due diligence, contrato, cambio de titularidad)

**Taxonomía preliminar:**

```
Hostelería: Bar/Cafetería, Restaurante, Discoteca/Pub, Hotel/Hostal, Catering
Comercio: Alimentación, Moda/Textil, Peluquería/Estética, Farmacia, Estanco, Ferretería
Servicios: Gimnasio, Autoescuela, Lavandería, Taller mecánico, Guardería, Academia
Industrial: Nave con actividad, Fábrica/Taller, Imprenta, Obrador
Digital: Ecommerce, SaaS, Web con tráfico, App
```

**Atributos específicos:** Facturación anual, beneficio neto, precio traspaso, alquiler mensual, m², licencia de actividad, antigüedad, empleados incluidos, motivo traspaso, stock incluido (sí/no).

**Decisión:** Evaluar como vertical 8 o 9. Requiere adaptación del modelo de ficha (no es idéntico a los otros verticales). Implementar después de validar que la arquitectura multi-vertical funciona con al menos 2-3 verticales activos.

### B.2 Maquinaria de Construcción y Obra Pública

**Concepto:** Excavadoras, retroexcavadoras, grúas torre, bulldozers, compactadoras, hormigoneras, generadores, grupos electrógenos.

**Por qué encaja:**

- Mercado grande, tickets altos (20K-200K€ por máquina)
- Competencia: Mascus (interfaz horrible), MachineryZone (internacional, UX pobre)
- No existe portal ibérico especializado con buena UX
- La estructura de datos es IDÉNTICA a Tracciona: marca, modelo, año, horas, especificaciones técnicas
- Fondos europeos Next Generation empujando obra pública = demanda creciente

**Taxonomía preliminar:**

```
Excavadoras: Mini (<6t), Midi (6-15t), Pesada (>15t), Ruedas, Anfibia
Cargadoras: Frontal (pala), Retroexcavadora, Minicargadora (skid steer), Telescópica
Grúas: Torre, Móvil, Autocargante, Sobre camión
Compactación: Rodillo vibrante, Plancha vibrante, Pisón
Hormigón: Hormigonera, Bomba de hormigón, Planta de hormigón
Elevación: Plataforma tijera, Plataforma articulada, Carretilla elevadora, Manipulador telescópico
Perforación: Pilotadora, Perforadora, Tuneladora (nicho muy específico)
Trituración: Trituradora de mandíbulas, Cribadora, Planta móvil
```

**Decisión:** Vertical de alta prioridad. La arquitectura es 100% compatible (clonar Tracciona, cambiar categorías/subcategorías/atributos). Evaluar dominio. Posible nombre: **Obracción**, **Maquidustria**, o buscar algo mejor.

### B.3 Equipamiento Industrial de Fábrica

**Concepto:** Tornos CNC, fresadoras, prensas, robots industriales, líneas de embalaje, compresores, calderas industriales.

**Por qué encaja:**

- Tickets altos (10K-150K€ por máquina, robots industriales hasta 150K€)
- Competencia: Exapro y Surplex (internacionales, en inglés)
- No hay portal en español centrado en mercado ibérico + LATAM
- Cuando una fábrica cierra o moderniza, vende todo el equipamiento
- Mercado natural para subastas (lotes de maquinaria de fábricas que cierran)

**Taxonomía preliminar:**

```
Mecanizado: Torno CNC, Fresadora CNC, Centro de mecanizado, Rectificadora, Electroerosión
Conformado: Prensa hidráulica, Prensa plegadora, Cizalla, Punzonadora, Laser corte
Soldadura: Robot de soldadura, Equipo MIG/MAG, Equipo TIG, Plasma
Robótica: Robot industrial (ABB, FANUC, KUKA), Cobot, Célula robotizada
Embalaje: Línea de embalaje, Retractiladora, Enfardadora, Etiquetadora
Neumática/Hidráulica: Compresor, Central hidráulica, Cilindro
Calderería: Caldera, Intercambiador, Depósito a presión
```

**Decisión:** Vertical interesante pero más complejo de categorizar. Requiere partner sectorial para validar taxonomía. Evaluar después de maquinaria de construcción.

### B.4 Náutica Profesional y Embarcaciones de Trabajo

**Concepto:** NO yates de recreo (ahí ya hay competencia). Embarcaciones de trabajo: pesqueros, remolcadores, barcazas, lanchas de prácticos, dragas, buques de suministro offshore.

**Por qué encaja:**

- Tickets altísimos (50K€ a varios millones)
- Prácticamente CERO presencia online en español
- Los armadores compran/venden por contactos personales y algún portal internacional en inglés
- Mercado Mediterráneo occidental + costa atlántica ibérica sin servicio

**Por qué es arriesgado:**

- Nicho muy pequeño en número de transacciones
- Proceso de compra extremadamente largo y complejo
- Requiere inspecciones marítimas, documentación de bandera, clasificación
- Difícil captar oferta y demanda simultáneamente en un mercado tan reducido

**Decisión:** Posibilidad a largo plazo. No prioritario por el tamaño del mercado. Pero si algún vertical de los principales genera contactos con armadores o puertos, puede reactivarse.

---

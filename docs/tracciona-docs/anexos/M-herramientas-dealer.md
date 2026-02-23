## ANEXO M: HERRAMIENTAS ADICIONALES DEL DEALER

Complementa K.7. Estas herramientas ya existen parcialmente en el código actual de Tank Ibérica (`utilidades.vue`) y deben adaptarse para que los dealers las usen desde su panel.

### M.1 Generador de facturas para dealers

Ya existe en `/app/pages/admin/utilidades.vue` con:

- Líneas múltiples (venta, alquiler, servicio, reserva)
- Selección de vehículos del catálogo
- Cálculo automático de IVA
- Datos de cliente con NIF/CIF/Pasaporte
- Opción bilingüe (ES/EN)
- Número de factura auto-generado
- PDF con diseño corporativo

**Adaptación para dealers:**

```
/dashboard/herramientas/factura
- Los datos del emisor se prerellenan automáticamente desde el perfil del dealer
  (empresa, CIF, dirección fiscal, logo)
- El dealer selecciona un vehículo de SU catálogo en Tracciona
- Rellena datos del comprador
- Genera PDF profesional con su logo y branding
- Le ahorra 20-30 min por venta
- Cada vez que usa la herramienta, está dentro de Tracciona
```

### M.2 Generador de contratos para dealers

Ya existe en utilidades.vue con dos tipos: arrendamiento y compraventa.

- Arrendamiento: 14+ cláusulas legales, opción de compra, valor residual, fianza
- Compraventa: datos de ambas partes, vehículo, precio, condiciones

**Adaptación:** Misma lógica que facturas. Datos del dealer prerellenados, selección de vehículo del catálogo.

### M.3 Plantilla de presupuesto/oferta

Diferente de la factura. Es un documento PRE-venta que el dealer envía al comprador potencial.

```
┌──────────────────────────────────────────┐
│ [Logo Dealer]          PRESUPUESTO       │
│ Transportes García SL   Nº: P-2026-042  │
│                         Fecha: 17/02/26  │
│                         Válido: 15 días  │
├──────────────────────────────────────────┤
│ CLIENTE: ________________________________│
│                                          │
│ VEHÍCULO:                                │
│ Cisterna Indox Alimentaria 3 ejes 2019   │
│ Mat: XXXX-XXX · 185.000 km · ADR        │
│ [foto principal]                         │
│                                          │
│ PRECIO:                    42.000€ + IVA │
│                                          │
│ SERVICIOS OPCIONALES:                    │
│ ☐ Transporte a destino         600€      │
│ ☐ Gestión transferencia        250€      │
│ ☐ Inspección pre-entrega       300€      │
│ ☐ Seguro primer año     (presupuesto)    │
│                                          │
│ CONDICIONES DE PAGO:                     │
│ 20% reserva + 80% a la entrega          │
│                                          │
│ Ver ficha completa: [QR → tracciona.com] │
└──────────────────────────────────────────┘
```

**Clave:** Los servicios opcionales de Tracciona aparecen integrados en la oferta del dealer. Es venta cruzada natural. El comprador los ve como parte del servicio del dealer, no como un upsell de la plataforma.

### M.4 Calculadora de rentabilidad de alquiler

Para dealers que alquilan vehículos (como Tank Ibérica con cisternas alimentarias).

```
/dashboard/herramientas/calculadora-alquiler

Inputs:
- Precio de compra del vehículo: 45.000€
- Renta mensual cobrada: 2.500€
- Seguro anual: 1.800€
- Mantenimiento anual estimado: 2.000€
- ITV + impuestos anuales: 500€

Outputs:
- Ingresos brutos anuales: 30.000€
- Costes anuales: 4.300€
- Beneficio neto anual: 25.700€
- Meses para recuperar inversión: 21
- Rentabilidad anual sobre inversión: 57%
- Punto de equilibrio: mes 22
- Valor residual estimado al año 3: 28.000€
- Rentabilidad total a 3 años incluyendo residual: 105.100€ (234%)
```

### M.5 Generador de anuncios para otras plataformas

Parece contraintuitivo pero es estratégico. El dealer publica en Tracciona con fotos y datos completos. Un botón le genera texto optimizado para copiar y pegar en Milanuncios, Wallapop, o redes sociales.

```
/dashboard/herramientas/exportar-anuncio

Selecciona vehículo → Selecciona plataforma destino:
- Milanuncios (límite 4.000 caracteres, formato específico)
- Wallapop (límite 640 caracteres)
- Facebook Marketplace
- LinkedIn / Instagram (más visual)

→ Claude genera texto adaptado al formato y límites de cada plataforma
→ Botón "Copiar al portapapeles"
→ Incluye siempre: "Más fotos y detalles en tracciona.com/vehiculo/[slug]"
```

**Resultado:** Tracciona se convierte en la herramienta central de gestión del dealer. Las otras plataformas son canales secundarios donde replica. Cada anuncio en Milanuncios tiene un backlink a Tracciona.

### M.6 CRM básico del dealer

La tabla `leads` (K.2) ya cubre parte de esto. Ampliar con funcionalidad de notas y seguimiento.

```
/dashboard/leads — Vista de CRM:

| Lead | Vehículo | Fecha | Estado | Próxima acción |
|------|----------|-------|--------|---------------|
| Juan P. | Cisterna Indox | 15/02 | 🟡 Negociando | Llamar viernes |
| María L. | Schmitz Frigo | 12/02 | 🔴 Perdido | Compró en Mascus |
| Pedro R. | Renault T480 | 17/02 | 🟢 Nuevo | Responder |
| Ana S. | Parcisa ADR | 10/02 | ✅ Cerrado | Tramitar transfer. |

Clic en un lead → detalle con historial:
- 10/02: Ana contactó por WhatsApp preguntando por la Parcisa
- 12/02: Negociación de precio, bajó a 38.000€
- 15/02: Acuerdo verbal. Pendiente contrato.
- 17/02: Contrato firmado. Venta cerrada por 38.000€.
  → [Generar factura] [Solicitar transporte] [Gestionar transferencia]
```

---

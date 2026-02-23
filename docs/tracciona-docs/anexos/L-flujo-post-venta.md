## ANEXO L: FLUJO POST-VENTA Y FRESCURA DEL CATÁLOGO

### L.1 El problema

El comprador ve la cisterna en Tracciona, llama al dealer por WhatsApp (contacto visible en la ficha), negocian, cierran el trato, y Tracciona no se entera. El anuncio sigue activo con un vehículo que ya no existe. Eso mata la confianza en la plataforma.

**No puedes evitarlo ni deberías intentarlo.** Ocultar el teléfono del dealer o forzar comunicación por chat interno sería un error fatal. Los transportistas y dealers operan por teléfono y WhatsApp. Si les obligas a usar un canal interno, no publicarán. Punto.

**La solución es diseñar el flujo post-venta, no controlar la venta.**

### L.2 Mecanismos para mantener el catálogo fresco

**Mecanismo 1 — Notificación automática periódica (cada 30 días):**

```typescript
// Edge Function / cron semanal:
// Para cada vehículo publicado hace >30 días sin edición:
// → WhatsApp al dealer: "¿Tu [vehículo] sigue disponible?
//   Responde SÍ para renovar o NO para retirarlo."
// Si responde SÍ → updated_at = NOW() (renueva frescura SEO)
// Si responde NO → status = 'sold' + trigger flujo post-venta (L.3)
// Si no responde en 7 días → segundo aviso
// Si no responde en 14 días → status = 'paused' automáticamente
```

**Mecanismo 2 — Detección por inactividad del dealer:**

```typescript
// Si un dealer no ha entrado en su panel, no ha editado ningún listado,
// y no ha respondido a ningún lead en 3+ semanas:
// → Ping automático: "Llevamos tiempo sin saber de ti.
//   ¿Tus 12 vehículos siguen disponibles?"
// No significa que estén vendidos, pero merece verificación.
```

**Mecanismo 3 — Detección por scraping cruzado:**

```typescript
// Script que scrapea periódicamente los listados de los dealers
// en Mascus / Europa-Camiones / Milanuncios.
// Si un vehículo desaparece de otra plataforma pero sigue en Tracciona:
// → Alerta al dealer: "Hemos visto que tu cisterna Indox ya no aparece
//   en Europa-Camiones. ¿Se ha vendido? Si es así, felicidades!
//   Márcalo como vendido para actualizar tu catálogo."
```

**Mecanismo 4 — Incentivo para marcar como vendido:**

```
Cuando el dealer marca un vehículo como "vendido":
1. Pantalla de felicitación: "🎉 ¡Enhorabuena por la venta!"
2. Preguntar: "¿Se vendió a través de un contacto de Tracciona?"
   → Si SÍ: registro en métricas del dealer (alimenta estadísticas K.5)
   → En ambos casos:
3. Ofrecer servicios post-venta con un solo clic:
   "¿Necesitas alguno de estos servicios para completar la operación?"
   [🚛 Transporte — precio cerrado 600€]
   [📄 Gestión transferencia — 250€]
   [🛡 Seguro — presupuesto en 24h]
   [📋 Contrato de compraventa — GRATIS]
4. Sugerencia: "¿Tienes otro vehículo para publicar en su lugar?"
   [Publicar nuevo vehículo]
```

### L.3 Flujo post-venta: potenciar servicios de partners

El momento en que el dealer marca "vendido" es la mejor oportunidad para vender servicios. El comprador YA existe, YA ha pagado por un vehículo, y NECESITA estos servicios.

**Email/WhatsApp automático al comprador (si se tiene su contacto vía lead):**

```
"¡Enhorabuena por tu compra! Para completar la operación,
estos servicios pueden ayudarte:

📄 Transferencia de titularidad — 250€ (gestoría partner)
   Te ahorramos el papeleo. Recogemos datos, tramitamos todo.

🚛 Transporte puerta a puerta — [precio según destino]
   Te lo llevamos donde quieras. Precio cerrado, sin sorpresas.

🛡 Seguro — Presupuesto en 24h
   Correduría partner especializada en vehículos industriales.

📋 Contrato de compraventa — GRATIS
   Generamos el contrato con los datos de ambas partes."
```

**Si NO se tiene contacto del comprador** (venta cerrada fuera de la plataforma):
El dealer puede generar un enlace con los servicios post-venta y enviárselo al comprador por WhatsApp:

```
tracciona.com/servicios-postventa?v=cisterna-indox-3-ejes-2019
```

Esa página muestra los servicios disponibles con precios y botones de contratar. El dealer queda bien porque ofrece un servicio extra, y Tracciona genera ingresos.

### L.4 Auto-despublicación por antigüedad

```sql
-- Vehículos publicados hace >90 días sin renovación:
-- Cron semanal:
UPDATE vehicles SET status = 'expired'
WHERE status = 'published'
  AND updated_at < NOW() - INTERVAL '90 days';

-- Notificar al dealer: "Tu [vehículo] lleva 90 días sin actualizar.
-- Lo hemos pausado para mantener la calidad del catálogo.
-- [Renovar ahora] [Marcar como vendido] [Pasar a subasta]"
```

La opción "Pasar a subasta" conecta con el flujo de auto_auction_after_days del Anexo H.4.

---

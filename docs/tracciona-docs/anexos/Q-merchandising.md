| Traducir artículos a N idiomas | GPT-4o mini Batch API | ~0,01€/artículo |

**Coste mensual estimado:**

- Tracciona (500 fichas, 10 artículos/mes): <1€/mes
- Horecaria futuro (2M fichas): ~790€ con Batch API (50% dto)

---

## ANEXO Q: MERCHANDISING PARA DEALERS

### Q.1 Servicio de merchandising con QR

Cada dealer puede pedir material físico de marketing personalizado con su QR y datos. Tracciona actúa como intermediario con una imprenta partner y cobra comisión.

### Q.2 Productos disponibles

| Producto                       | Precio dealer | Coste imprenta | Comisión Tracciona | Uso                         |
| ------------------------------ | ------------- | -------------- | ------------------ | --------------------------- |
| Tarjetas de visita (250 ud.)   | 35€           | 20-25€         | 10-15€ (30-40%)    | Ferias, visitas, clientes   |
| Imanes de furgoneta (2 ud.)    | 60€           | 35-40€         | 20-25€ (35%)       | Publicidad móvil permanente |
| Lona de feria (2×1m)           | 80€           | 50-55€         | 25-30€ (30%)       | Ferias sectoriales          |
| Cartel A3 plastificado (5 ud.) | 25€           | 12-15€         | 10-13€ (40%)       | Campa, oficina, taller      |
| Pegatinas QR (20 ud.)          | 15€           | 6-8€           | 7-9€ (50%)         | Vehículos en stock          |
| Roll-up (85×200cm)             | 120€          | 70-80€         | 40-50€ (35%)       | Ferias, eventos             |

### Q.3 Flujo de pedido

```
/dashboard/herramientas/merchandising

1. Dealer selecciona producto
2. Preview automático con su logo, datos, QR dinámico y URL
3. Ajusta diseño si quiere (colores, tamaño de logo)
4. Paga vía Stripe
5. Pedido se envía automáticamente a imprenta partner (API o email)
6. Imprenta produce y envía directamente al dealer
7. Tracciona cobra comisión sin tocar producto físico
```

### Q.4 Por qué es estratégico

Cada tarjeta, imán de furgoneta y lona de feria que el dealer reparte lleva:

- URL: **tracciona.com/transportes-garcia**
- QR dinámico que trackea escaneos
- Logo de Tracciona visible

**El dealer PAGA por hacer marketing de Tracciona.** 20 dealers × 250 tarjetas = 5.000 tarjetas/año con nuestra URL circulando. 15% scan rate = 750 visitas orgánicas. CAC = 0€ (o negativo, porque ganamos comisión).

Además, cada producto físico aumenta el switching cost: si el dealer se va a Mascus, tiene que tirar las tarjetas, los imanes y la lona. Reimprimirlo todo con otra URL cuesta dinero y esfuerzo.

### Q.5 Imprenta partner

No necesita ser una única imprenta. Opciones:

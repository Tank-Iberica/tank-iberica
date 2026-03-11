# TradeBase / Tracciona — Presupuesto Total a 3 Años

> **Documento para inversores** — Proyección de costes e ingresos desde cero
> Fecha: Marzo 2026 · Moneda: EUR · IVA excluido salvo indicación

---

## Resumen ejecutivo

| Concepto | Año 1 | Año 2 | Año 3 | Total 3 años |
|---|---|---|---|---|
| **Costes totales** | **18.695€** | **33.280€** | **58.550€** | **110.525€** |
| **Ingresos proyectados** | **4.200–14.400€** | **36.000–96.000€** | **120.000–360.000€** | **160.200–470.400€** |
| **Resultado neto** | -14.495 a -4.295€ | +2.720 a +62.720€ | +61.450 a +301.450€ | — |
| **Break-even estimado** | — | **Mes 14–18** | — | — |

**Inversión mínima requerida: ~40.000€** (cubre año 1 completo + colchón 6 meses año 2)
**Inversión recomendada: ~60.000€** (incluye aceleración marketing año 2)

---

## 1. CONSTITUCIÓN LEGAL Y REGISTROS

### 1.1 Constitución de sociedad

| Concepto | Coste | Frecuencia | Notas |
|---|---|---|---|
| Constitución TradeBase SL | 3.200€ | Único | Notario (~600€) + Registro Mercantil (~200€) + gestoría constitución (~400€) + capital social mínimo (3.000€ depositable) |
| Certificación negativa de denominación (RMNC) | 20€ | Único | Reserva nombre "TradeBase" en Registro Mercantil |
| NIF provisional + definitivo | 0€ | Único | Incluido en gestión de constitución |
| Certificado digital (FNMT) | 15€ | Cada 2 años | Firma electrónica para trámites online |
| Alta censal (IAE/IVA) en Hacienda | 0€ | Único | Modelo 036 |
| Alta RETA autónomos (2 socios administradores) | 960€/año | Anual × 2 | ~80€/mes × 2 socios (tarifa plana nuevos autónomos primer año) |

| | **Año 1** | **Año 2** | **Año 3** |
|---|---|---|---|
| **Subtotal constitución** | **5.155€** | **1.920€** | **3.840€** |

> **Nota Año 1:** 3.200€ constitución + 20€ RMNC + 15€ certificado + 960€ autónomos × 2.
> **Nota Año 2:** Solo cuotas autónomos (960€ × 2).
> **Nota Año 3:** Cuotas autónomos suben a tarifa normal (~320€/mes × 2 = 3.840€/año × 2). Nota: si los fundadores ya son autónomos previamente, la tarifa plana no aplica.

### 1.2 Registro de marcas y dominios

| Concepto | Coste | Frecuencia | Notas |
|---|---|---|---|
| Registro marca "Tracciona" OEPM | 150€ | Único (renueva cada 10 años) | 1 clase (Cl. 35 — servicios de marketplace) |
| Registro marca "TradeBase" OEPM | 150€ | Único | Paraguas corporativo |
| Registro marcas verticales OEPM (×5 más) | 750€ | Repartido años 1-3 | Municipiante, CampoIndustrial, Horecaria, ReSolar, Clinistock |
| Dominio tracciona.com | 15€ | Anual | Ya registrado |
| Dominios verticales (×6) | 90€ | Anual | municipiante.com, campoindustrial.com, horecaria.com, resolar.es, clinistock.com, boxport.es |
| Dominio tradebase.es | 10€ | Anual | Corporativo |

| | **Año 1** | **Año 2** | **Año 3** |
|---|---|---|---|
| **Subtotal marcas/dominios** | **565€** | **415€** | **415€** |

> **Año 1:** 300€ marcas (Tracciona + TradeBase) + 150€ (2 verticales) + 115€ dominios.
> **Años 2-3:** 150€ marca adicional/año + dominios.

---

## 2. INFRAESTRUCTURA TÉCNICA (HOSTING Y SERVICIOS CLOUD)

### 2.1 Hosting y base de datos

| Servicio | Plan | Coste/mes | Función |
|---|---|---|---|
| **Supabase** | Pro | 25$ (~23€) | PostgreSQL + Auth + Realtime + Storage (97 tablas, RLS) |
| **Cloudflare Pages** | Free → Pro | 0€ → 20$/mes | Edge hosting, CDN, Workers, WAF, DDoS |
| **Cloudflare Images** | Pay-as-you-go | ~5€/mes | Almacenamiento de imágenes CDN (cache 30d) |
| **Cloudinary** | Free → Plus | 0€ → 45€/mes | Transformación de imágenes (WebP, resize) |
| **Backblaze B2** | Pay-as-you-go | ~5€/mes | Backups cifrados (AES-256) |

| | **Año 1** | **Año 2** | **Año 3** |
|---|---|---|---|
| Supabase (1 cluster) | 276€ | 276€ | — |
| Supabase (2 clusters, multi-vertical) | — | — | 552€ |
| Cloudflare Pages | 0€ | 230€ | 230€ |
| Cloudflare Images | 60€ | 120€ | 240€ |
| Cloudinary | 0€ | 270€ | 540€ |
| Backblaze B2 | 60€ | 60€ | 60€ |
| **Subtotal hosting** | **396€** | **956€** | **1.622€** |

> **Escalabilidad demostrada:** 1 vertical (1 cluster, ~34$/mes) → 7 verticales (2 clusters, ~100$/mes) → 20 verticales (~5 clusters, ~600$/mes). El coste de infra crece linealmente, no exponencialmente.

### 2.2 APIs y servicios externos

| Servicio | Plan | Coste/mes | Función |
|---|---|---|---|
| **Anthropic Claude API** | Pay-as-you-go | 50–150€ | Descripciones IA, verificación Vision, brokeraje |
| **OpenAI API** | Pay-as-you-go | 10–30€ | Traducciones batch (GPT-4o mini, 30× más barato que DeepL) |
| **WhatsApp Meta Cloud API** | 1.000 conv. gratis/mes | 0–80€ | Pipeline de publicación (fotos → ficha) |
| **Resend** | Free → Pro | 0–20€ | Email transaccional (alertas, facturas, onboarding) |
| **Stripe** | Comisión por transacción | Variable | 1,4% + 0,25€ por cobro (no es coste fijo) |
| **Sentry** | Free → Team | 0–26€ | Monitorización de errores |
| **Turnstile (Cloudflare)** | Gratis | 0€ | CAPTCHA invisible |
| **Google Analytics** | Gratis | 0€ | Analytics (gated por cookie consent) |

| | **Año 1** | **Año 2** | **Año 3** |
|---|---|---|---|
| Anthropic Claude API | 600€ | 1.200€ | 1.800€ |
| OpenAI API | 120€ | 240€ | 360€ |
| WhatsApp Meta Cloud API | 240€ | 600€ | 960€ |
| Resend | 0€ | 240€ | 240€ |
| Stripe (comisiones estimadas) | 200€ | 1.500€ | 5.000€ |
| Sentry | 0€ | 312€ | 312€ |
| **Subtotal APIs** | **1.160€** | **4.092€** | **8.672€** |

> **Nota sobre Stripe:** Las comisiones de Stripe son coste variable proporcional a ingresos. Con 10.000€ de ingresos por Stripe → ~200€ en comisiones. Con 100.000€ → ~1.700€.

---

## 3. DESARROLLO Y HERRAMIENTAS TÉCNICAS

### 3.1 Modelo de desarrollo: IA como ingeniero principal

El proyecto NO contrata desarrolladores. Claude Code (Anthropic) actúa como ingeniero principal. Un desarrollador senior en España cuesta 40.000–60.000€/año. Con Claude Code, el coste es ~2.400€/año — un ahorro del 95%.

| Herramienta | Coste/mes | Función |
|---|---|---|
| **Claude Code (Anthropic)** | ~100–200€ | Desarrollo principal: features, bugs, testing, CI/CD |
| **Claude Max (Anthropic)** | ~100€ | Generación de contenido editorial |
| **GitHub** | 0€ | Repositorio, CI/CD (Actions), Issues |
| **VS Code / IDEs** | 0€ | Editor de código |
| **SonarQube Community** | 0€ | Análisis de calidad de código |

| | **Año 1** | **Año 2** | **Año 3** |
|---|---|---|---|
| Claude Code | 2.400€ | 2.400€ | 2.400€ |
| Claude Max | 1.200€ | 1.200€ | 1.200€ |
| GitHub (gratis, repos privados) | 0€ | 0€ | 0€ |
| **Subtotal desarrollo** | **3.600€** | **3.600€** | **3.600€** |

> **Comparativa:** Un equipo técnico mínimo (1 senior + 1 junior) costaría ~80.000–100.000€/año. Nuestra inversión en IA es de 3.600€/año. Cuando los ingresos recurrentes superen 2.000–3.000€/mes, se evaluará contratar un desarrollador humano.

### 3.2 Estado actual del producto (ya construido)

| Métrica | Valor |
|---|---|
| Páginas Vue (frontend) | 126 |
| Componentes Vue | 424 |
| Composables (lógica reutilizable) | 151 |
| Endpoints API (backend) | 65 |
| Migraciones SQL | 83 |
| Tablas en base de datos | 97 |
| Tests automatizados | 13.862 (747 archivos, 0 fallos) |
| Coverage de código | 74,8% |
| CI/CD workflows | 8 |
| SonarQube Quality Gate | OK (0 bugs, 0 vulns, 0 smells) |
| Idiomas | ES + EN (preparado para N) |

> **Valoración de desarrollo equivalente:** Si se hubiese construido con un equipo tradicional (2 senior devs + 1 junior + 1 diseñador UX), el coste estimado habría sido **250.000–350.000€** en 12–18 meses. El coste real hasta la fecha ha sido **<5.000€** en suscripciones de IA.

---

## 4. MARKETING Y ADQUISICIÓN DE CLIENTES

### 4.1 Marketing digital

| Canal | Coste/mes | Cuándo activar | ROI esperado |
|---|---|---|---|
| **Google Ads (campañas)** | 150–1.200€ | Mes 6+ (>100 vehículos) | CPC <2€, conversión >2% |
| **Retargeting (Meta + Google)** | 180€ | Mes 3+ | 5–15% reconversión |
| **Milanuncios PRO** | 50€ | Mes 2+ | Paraguas para dealers |
| **LinkedIn Ads** | 0–300€ | Mes 12+ (>100 visitas/día) | Fleet managers B2B |
| **SEO orgánico** | 0€ | Día 1 | Canal principal, coste solo tiempo |
| **Content marketing (editorial)** | 0€ | Día 1 | 2 artículos/semana con Claude Max |
| **Redes sociales orgánicas** | 0€ | Día 1 | LinkedIn, YouTube, WhatsApp Channel |

| | **Año 1** | **Año 2** | **Año 3** |
|---|---|---|---|
| Google Ads | 1.500€ | 6.000€ | 14.400€ |
| Retargeting Meta + Google | 1.800€ | 2.160€ | 2.160€ |
| Milanuncios PRO | 550€ | 600€ | 600€ |
| LinkedIn Ads | 0€ | 1.800€ | 3.600€ |
| **Subtotal marketing digital** | **3.850€** | **10.560€** | **20.760€** |

> **Progresión Google Ads:** Mes 6–9 → 150–200€/mes (validar keywords) · Mes 9–12 → 500€/mes (escalar lo que funcione) · Año 2 → 500€/mes · Año 3 → 1.200€/mes. Regla de parada: 200€ sin leads → pausar y revisar.

### 4.2 Marketing físico y offline (único o bajo coste)

| Concepto | Coste | Frecuencia |
|---|---|---|
| Vinilo góndola IberHaul (lateral + trasero) | 300€ | Único (dura 5+ años) |
| QR plastificados para campa Onzonilla | 20€ | Anual |
| Tarjetas de visita Tracciona | 50€ | Anual |
| Flyers para talleres/ITV (500 uds.) | 80€ | Anual |
| Google Business Profile | 0€ | Único |
| Merchandising muestra (camisetas, gorras) | 200€ | Anual |

| | **Año 1** | **Año 2** | **Año 3** |
|---|---|---|---|
| **Subtotal marketing físico** | **650€** | **350€** | **350€** |

### 4.3 Alianzas y partnerships (coste cero o por resultado)

| Aliado | Modelo | Coste fijo |
|---|---|---|
| Gestorías de transferencias | 50€/venta cerrada referida | 0€ fijo |
| Talleres de camiones/maquinaria | Tarjetas en recepción | 0€ |
| Corredores de seguros de flotas | Referido mutuo | 0€ |
| ITV de vehículos pesados | Flyers (incluido arriba) | 0€ |
| Empresas de renting/leasing (ALD, Arval) | "Liquidamos tu flota gratis" | 0€ |

---

## 5. OPERACIONES Y ADMINISTRACIÓN

### 5.1 Gestoría y contabilidad

| Concepto | Coste/mes | Notas |
|---|---|---|
| Gestoría fiscal (IVA trimestral, IS, IRPF) | 150–250€ | Incluye modelos 303, 390, 200, 347 |
| Asesor fiscal puntual (transfer pricing, UK) | Variable | Solo cuando haya facturación entre entidades |

### 5.2 Herramientas de productividad

| Herramienta | Coste/mes | Usuarios |
|---|---|---|
| Google Workspace | 6€ | ×2 = 12€/mes |
| Dominio email @tracciona.com | Incluido en Workspace | — |
| Calendario, Drive, Meet | Incluido | — |

### 5.3 Seguros y varios

| Concepto | Coste/año | Notas |
|---|---|---|
| Seguro RC actividad profesional digital | 350€ | Cubre errores en intermediación digital |
| Protección de datos (compliance GDPR) | 300€ | Consultoría puntual para formalizar RAT y DPIA |

| | **Año 1** | **Año 2** | **Año 3** |
|---|---|---|---|
| Gestoría fiscal | 1.800€ | 2.400€ | 3.000€ |
| Google Workspace | 144€ | 144€ | 144€ |
| Seguro RC | 350€ | 350€ | 400€ |
| Compliance GDPR | 300€ | 0€ | 300€ |
| Material oficina / varios | 200€ | 200€ | 200€ |
| **Subtotal operaciones** | **2.794€** | **3.094€** | **4.044€** |

---

## 6. RECURSOS HUMANOS

### 6.1 Año 1–2: Cero empleados

| Rol | Quién lo cubre | Coste adicional |
|---|---|---|
| CEO / Estrategia | Fundador 1 | 0€ (autónomos, cuota incluida §1) |
| COO / Operaciones / Ventas | Fundador 2 | 0€ (autónomos, cuota incluida §1) |
| CTO / Desarrollo | Claude Code (IA) | 2.400€/año (incluido §3) |
| Content / Marketing | Claude Max (IA) + fundadores | 1.200€/año (incluido §3) |
| Atención al cliente | Fundadores + WhatsApp auto | 0€ |

### 6.2 Año 3: Primera contratación (condicional)

**Condición de activación:** Ingresos recurrentes >3.000€/mes durante 3 meses consecutivos.

| Rol | Tipo | Coste/año | Cuándo |
|---|---|---|---|
| Soporte + ventas (media jornada) | Contrato parcial | 12.000€ | Año 3 (si se alcanza umbral) |
| Freelance diseño UX/UI | Por proyecto | 3.000€ | Año 3 (2–3 proyectos puntuales) |

| | **Año 1** | **Año 2** | **Año 3** |
|---|---|---|---|
| Personal adicional | 0€ | 0€ | 15.000€ |
| **Subtotal RRHH** | **0€** | **0€** | **15.000€** |

> **Nota:** Las cuotas de autónomos de los fundadores se computan en §1. Los costes de IA de desarrollo y contenido en §3.

---

## 7. LEGAL Y COMPLIANCE (COSTES PUNTUALES)

| Concepto | Coste | Cuándo | Notas |
|---|---|---|---|
| Redacción TyC y Política Privacidad | 800€ | Año 1 | Abogado especializado digital |
| Formalización RAT (RGPD) | 500€ | Año 1 | Registro de Actividades de Tratamiento |
| Contrato co-responsables art. 26 RGPD | 400€ | Año 1 | Tracciona ↔ Tank Ibérica (brokeraje) |
| DPIA (Evaluación de Impacto) | 600€ | Año 2 | Requerido por scoring IA automatizado |
| Revisión legal expansión EU | 1.200€ | Año 3 | Multi-jurisdicción si hay verticales fuera ES |
| Compliance DSA (Digital Services Act) | 0€ | — | Ya implementado en código |

| | **Año 1** | **Año 2** | **Año 3** |
|---|---|---|---|
| **Subtotal legal** | **1.700€** | **600€** | **1.200€** |

---

## 8. CONTINGENCIA Y RESERVA

| Concepto | % del total | Notas |
|---|---|---|
| **Reserva de contingencia** | 10% del coste anual | Imprevistos, cambios de pricing de proveedores, urgencias |

| | **Año 1** | **Año 2** | **Año 3** |
|---|---|---|---|
| Base de costes (sin contingencia) | 19.870€ | 23.667€ | 55.503€ |
| Contingencia 10% | 1.987€ | 2.367€ | 5.550€ |

> **Nota:** Tank Ibérica SL ya opera con ~200.000€ en caja y ~500.000€/año de facturación en operaciones físicas. La contingencia cubre el proyecto digital; las operaciones físicas tienen su propia tesorería.

---

## 9. RESUMEN DE COSTES POR CATEGORÍA

| Categoría | Año 1 | Año 2 | Año 3 | Total |
|---|---|---|---|---|
| 1. Constitución y registros | 5.155€ | 1.920€ | 3.840€ | 10.915€ |
| 2. Marcas y dominios | 565€ | 415€ | 415€ | 1.395€ |
| 3. Hosting e infraestructura | 396€ | 956€ | 1.622€ | 2.974€ |
| 4. APIs y servicios externos | 1.160€ | 4.092€ | 8.672€ | 13.924€ |
| 5. Desarrollo (IA) | 3.600€ | 3.600€ | 3.600€ | 10.800€ |
| 6. Marketing digital | 3.850€ | 10.560€ | 20.760€ | 35.170€ |
| 7. Marketing físico | 650€ | 350€ | 350€ | 1.350€ |
| 8. Operaciones y admin | 2.794€ | 3.094€ | 4.044€ | 9.932€ |
| 9. Recursos humanos | 0€ | 0€ | 15.000€ | 15.000€ |
| 10. Legal y compliance | 1.700€ | 600€ | 1.200€ | 3.500€ |
| **Subtotal** | **19.870€** | **25.587€** | **59.503€** | **104.960€** |
| Contingencia (10%) | 1.987€ | 2.559€ | 5.950€ | 10.496€ |
| **TOTAL CON CONTINGENCIA** | **21.857€** | **28.146€** | **65.453€** | **115.456€** |

---

## 10. PROYECCIÓN DE INGRESOS

### 10.1 Fuentes de ingreso por fase

#### Año 1 — Validación y primeros ingresos

| Canal | Escenario conservador | Escenario optimista | Cuándo |
|---|---|---|---|
| AdSense (puente) | 600€ | 2.400€ | Mes 3+ |
| Créditos y destacados | 300€ | 1.200€ | Mes 4+ |
| Suscripciones dealer (Basic 29€) | 0€ | 2.100€ | Mes 6+ (excl. Founding) |
| Publicidad directa local | 0€ | 2.400€ | Mes 6+ |
| Comisión transporte (IberHaul) | 500€ | 1.500€ | Mes 4+ |
| Suscripciones usuario (Classic/Premium) | 0€ | 600€ | Mes 6+ |
| Generación IA fichas (0,99€) | 200€ | 600€ | Mes 3+ |
| **Total Año 1** | **1.600€** | **10.800€** | — |

#### Año 2 — Crecimiento y monetización

| Canal | Conservador | Optimista | Cuándo |
|---|---|---|---|
| Suscripciones dealer (10-30 pagando) | 3.480€ | 14.220€ | Todo el año |
| Suscripciones usuario | 2.280€ | 9.360€ | Todo el año |
| Créditos y destacados | 2.400€ | 6.000€ | Todo el año |
| AdSense + publicidad directa | 3.600€ | 14.400€ | Todo el año |
| Comisión venta (1-3%) | 3.000€ | 15.000€ | Mes 14+ |
| Transporte (IberHaul) | 3.000€ | 6.000€ | Todo el año |
| Verificaciones e informes DGT | 1.200€ | 4.800€ | Mes 14+ |
| Subastas (8% buyer's premium) | 0€ | 6.000€ | Mes 18+ |
| **Total Año 2** | **18.960€** | **75.780€** | — |

#### Año 3 — Escalado y multi-vertical

| Canal | Conservador | Optimista | Cuándo |
|---|---|---|---|
| Suscripciones dealer (30-80 pagando) | 10.440€ | 45.120€ | Todo el año |
| Suscripciones usuario | 9.480€ | 28.080€ | Todo el año |
| Créditos y destacados | 6.000€ | 18.000€ | Todo el año |
| Publicidad (directa + AdSense) | 14.400€ | 43.200€ | Todo el año |
| Comisiones venta | 12.000€ | 36.000€ | Todo el año |
| Transporte | 6.000€ | 12.000€ | Todo el año |
| Verificaciones e informes | 4.800€ | 12.000€ | Todo el año |
| Subastas | 6.000€ | 24.000€ | Todo el año |
| **Datos de mercado (Capa 4)** | 6.000€ | 36.000€ | Mes 24+ |
| **2º vertical (Municipiante)** | 12.000€ | 36.000€ | Mes 30+ |
| **Total Año 3** | **87.120€** | **290.400€** | — |

### 10.2 Supuestos de la proyección

| Métrica | Año 1 | Año 2 | Año 3 |
|---|---|---|---|
| Founding Dealers (gratis) | 10 | 10 | 10 |
| Dealers de pago | 0–6 | 10–30 | 30–80 |
| Vehículos publicados | 50–200 | 500–2.000 | 2.000–10.000 |
| Visitas/mes (final de año) | 5.000 | 30.000 | 100.000+ |
| Transacciones cerradas | 10–30 | 50–200 | 200–1.000 |
| Verticales activos | 1 | 1–2 | 2–3 |

### 10.3 Revenue stacking: ejemplo de 1 transacción

Un vehículo de 40.000€ puede generar **hasta 3.785€** de ingresos acumulados:

| Canal | Ingreso |
|---|---|
| Destacado (5 días × 3€) | 15€ |
| Créditos consumidos (vendedor) | 10€ |
| Comisión venta (3%) | 1.200€ |
| Transporte IberHaul | 600€ |
| Verificación + informe DGT | 30€ |
| Seguro referido (comisión 10%) | 200€ |
| Documentación (contrato, factura) | 30€ |
| Buyer's premium subasta (8%) | 1.700€* |
| **Total potencial** | **3.785€** |

> *Si el vehículo se vende por subasta. Los canales se apilan, no compiten.

---

## 11. MÉTRICAS CLAVE (KPIs PARA INVERSORES)

### 11.1 Unit Economics

| Métrica | Valor |
|---|---|
| **CAC (Coste de Adquisición de Dealer)** | ~50€ (email frío + onboarding) |
| **LTV dealer (12 meses)** | ~348€ (29€/mes × 12) a ~948€ (79€/mes × 12) |
| **LTV/CAC ratio** | 7:1 a 19:1 |
| **Coste por vehículo publicado** | ~0€ (gratis para vendedores) |
| **Margen bruto estimado** | 85–92% (servicios digitales) |
| **Coste de infraestructura por usuario** | <0,01€/mes (edge caching) |

### 11.2 Ventajas competitivas (moat)

| Ventaja | Detalle |
|---|---|
| **Sin competidor directo** | No existe marketplace B2B industrial profesional en España/Europa |
| **Datos irreplicables** | Precio real de venta, tiempo hasta venta, demanda vs oferta — datos que solo el intermediario posee |
| **WhatsApp → ficha IA** | Ningún competidor lo ofrece. Fotos por WhatsApp → ficha bilingüe en minutos |
| **Triple integración** | Marketplace (Tracciona) + compraventa física (Tank Ibérica) + transporte (IberHaul) |
| **Coste de cambio** | Herramientas (CRM, facturas, contratos), reputación (reviews), merchandising (QR → perfil) |
| **Infraestructura existente** | Tank Ibérica: campa, stock, facturación. Sin necesidad de inversión greenfield |

### 11.3 Riesgos y mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| Adopción lenta de dealers | Media | Alto | Founding program gratuito + onboarding WhatsApp + publicación multicanal como servicio |
| Cambio de pricing de Supabase | Baja | Medio | Open source, self-hostable. Plan B: PostgreSQL + Auth0 |
| Competidor entra al mercado | Baja | Medio | 12+ meses de ventaja + datos acumulados + integración física |
| Regulación GDPR estricta | Baja | Bajo | Compliance DSA ya implementado, RAT en borrador, DPO externo si necesario |
| Dependencia de IA (Claude Code) | Media | Medio | Codebase documentado (13.800+ tests), proceso reproducible con cualquier LLM |

---

## 12. USO DE FONDOS (PROPUESTA A INVERSORES)

### 12.1 Ronda seed: 60.000€

| Destino | Importe | % | Retorno esperado |
|---|---|---|---|
| **Operaciones año 1** | 22.000€ | 37% | Producto en mercado + 10 founding dealers |
| **Marketing acelerado año 2** | 15.000€ | 25% | 30+ dealers de pago + 2.000+ vehículos |
| **Reserva de caja (6 meses)** | 15.000€ | 25% | Runway sin presión |
| **Legal y compliance** | 3.000€ | 5% | Marcas registradas + GDPR formal |
| **Contingencia** | 5.000€ | 8% | Imprevistos |

### 12.2 Alternativa bootstrap (sin inversión externa)

| Fuente | Importe | Notas |
|---|---|---|
| Caja Tank Ibérica SL | ~200.000€ disponibles | Sin presión de VC, sin dilución |
| Revenue Tank Ibérica | ~500.000€/año | Financia el experimento digital |
| Stock en activos | ~150.000€ | Vehículos que pueden listarse en Tracciona |

> **El proyecto puede ejecutarse sin inversión externa.** Tank Ibérica ya financia las operaciones. La inversión externa solo aceleraría la velocidad de adquisición y marketing.

### 12.3 Hitos de milestone

| Hito | Cuándo | Trigger de siguiente fase |
|---|---|---|
| **MVP en producción** | Mes 1 | — |
| **10 Founding Dealers activos** | Mes 3 | Activar monetización |
| **100 vehículos publicados** | Mes 4 | Activar Google Ads + AdSense |
| **Primer ingreso recurrente** | Mes 6 | Validación de PMF |
| **Break-even operativo** | Mes 14–18 | Considerar 2º vertical |
| **1.000 vehículos publicados** | Mes 18 | Activar productos de datos |
| **2º vertical live** | Mes 24–30 | Escalar modelo |
| **100.000 visitas/mes** | Mes 30–36 | Contratar primer empleado |

---

## 13. PROYECCIÓN FINANCIERA CONSOLIDADA

### 13.1 P&L simplificado (escenario conservador)

| | **Año 1** | **Año 2** | **Año 3** |
|---|---|---|---|
| **Ingresos** | 1.600€ | 18.960€ | 87.120€ |
| Costes operativos | -19.870€ | -25.587€ | -59.503€ |
| Contingencia | -1.987€ | -2.559€ | -5.950€ |
| **Resultado neto** | **-20.257€** | **-9.186€** | **+21.667€** |
| **Resultado acumulado** | -20.257€ | -29.443€ | **-7.776€** |

### 13.2 P&L simplificado (escenario optimista)

| | **Año 1** | **Año 2** | **Año 3** |
|---|---|---|---|
| **Ingresos** | 10.800€ | 75.780€ | 290.400€ |
| Costes operativos | -19.870€ | -25.587€ | -59.503€ |
| Contingencia | -1.987€ | -2.559€ | -5.950€ |
| **Resultado neto** | **-11.057€** | **+47.634€** | **+224.947€** |
| **Resultado acumulado** | -11.057€ | **+36.577€** | **+261.524€** |

### 13.3 Cash flow acumulado (escenario base = media)

```
Mes  1 ████████████████████████ -5.000€
Mes  3 ██████████████████████████████ -8.000€
Mes  6 ████████████████████████████████████ -12.000€
Mes  9 ██████████████████████████████████ -11.000€  ← primeros ingresos
Mes 12 ████████████████████████████████████████ -15.000€
Mes 15 █████████████████████████████ -10.000€  ← monetización activa
Mes 18 ██████████████████ -5.000€              ← BREAK-EVEN
Mes 24 ██████ +15.000€                         ← cash-positive
Mes 30 ████████████████████████ +60.000€
Mes 36 ████████████████████████████████████████████ +130.000€
```

---

## 14. VALORACIÓN IMPLÍCITA

### 14.1 Comparables del sector

| Empresa | Sector | Valoración | Múltiplo revenue | Empleados |
|---|---|---|---|---|
| Mascus (Ritchie Bros) | Maquinaria industrial | Adquirida $10M+ | — | ~50 |
| AutoScout24 | Vehículos | €2.9B | 8-10× revenue | ~1.000 |
| Idealista | Inmobiliario | €1.3B (venta 2024) | 12× revenue | ~300 |
| Wallapop | Generalista | €690M (2021) | ~20× revenue | ~200 |

### 14.2 Tesis de inversión

1. **Mercado sin incumbente digital:** Nadie posee el marketplace B2B industrial en España/Europa.
2. **Modelo probado en otros sectores:** Idealista (inmobiliario) → TradeBase (industrial). Misma estrategia de datos, diferente vertical.
3. **Multi-vertical = multiplicador:** 1 codebase × 7 verticales = 7× el mercado direccionable con coste incremental mínimo.
4. **Infraestructura física existente:** Tank Ibérica aporta campa, stock, logística y facturación desde día 1.
5. **Coste de operación ultra-bajo:** IA como ingeniero principal → 95% de ahorro vs equipo técnico tradicional.
6. **Moat de datos desde día 1:** Cada transacción genera datos de mercado irreplicables (precios reales, tiempos de venta, flujos geográficos).

---

## ANEXO A — Desglose mensual Año 1

| Mes | Coste acumulado | Ingreso acumulado | Neto | Hito |
|---|---|---|---|---|
| 1 | 5.500€ | 0€ | -5.500€ | Constitución + producto live |
| 2 | 7.000€ | 0€ | -7.000€ | Founding dealers contactados |
| 3 | 8.500€ | 50€ | -8.450€ | 10 dealers, primeros vehículos |
| 4 | 10.200€ | 150€ | -10.050€ | 50 vehículos, AdSense activo |
| 5 | 11.800€ | 350€ | -11.450€ | 100 vehículos, Google Ads |
| 6 | 13.500€ | 700€ | -12.800€ | Primer dealer de pago |
| 7 | 15.000€ | 1.100€ | -13.900€ | Créditos + suscripciones |
| 8 | 16.500€ | 1.600€ | -14.900€ | Crecimiento orgánico SEO |
| 9 | 17.800€ | 2.200€ | -15.600€ | Punto de máxima inversión |
| 10 | 19.000€ | 3.000€ | -16.000€ | Flywheel arrancando |
| 11 | 20.200€ | 4.000€ | -16.200€ | Ingresos mensuales ~1.000€ |
| 12 | 21.857€ | 5.200€ | -16.657€ | Cierre año 1 |

---

## ANEXO B — Stack técnico completo (costes anuales)

| Capa | Servicio | Plan | Coste Año 1 | Coste Año 3 |
|---|---|---|---|---|
| Base de datos | Supabase | Pro ($25/m) | 276€ | 552€ |
| Hosting/CDN | Cloudflare Pages | Free→Pro | 0€ | 230€ |
| Imágenes CDN | CF Images | PAYG | 60€ | 240€ |
| Imágenes transform | Cloudinary | Free→Plus | 0€ | 540€ |
| Backups | Backblaze B2 | PAYG | 60€ | 60€ |
| Email | Resend | Free→Pro | 0€ | 240€ |
| Pagos | Stripe | Comisión | ~200€ | ~5.000€ |
| IA (desarrollo) | Anthropic Claude | PAYG | 600€ | 1.800€ |
| IA (traducciones) | OpenAI | PAYG | 120€ | 360€ |
| WhatsApp | Meta Cloud API | 1K free | 240€ | 960€ |
| Errores | Sentry | Free→Team | 0€ | 312€ |
| CAPTCHA | Turnstile | Gratis | 0€ | 0€ |
| Analytics | Google Analytics | Gratis | 0€ | 0€ |
| CI/CD | GitHub Actions | Gratis | 0€ | 0€ |
| Calidad código | SonarQube | Community | 0€ | 0€ |
| Testing E2E | Playwright | OSS | 0€ | 0€ |
| Dev tools | Claude Code + Max | Sub | 3.600€ | 3.600€ |
| **TOTAL TECH** | | | **5.156€** | **13.894€** |

> El coste de infraestructura técnica por usuario es inferior a **0,01€/mes** gracias al edge caching de Cloudflare y la arquitectura SWR.

---

*Documento generado el 09 de marzo de 2026. Basado en datos reales del proyecto Tracciona y precios de mercado verificados. Las proyecciones de ingresos son estimaciones y no constituyen garantía de rendimiento.*

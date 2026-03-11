> ⚠️ **[LEGACY]** Documento histórico — solo referencia. No modificar ni usar como fuente de verdad. Ver [docs/README.md](../README.md) para navegación activa.

# Flujos Operativos y Evolución por Fases — Tracciona / TradeBase

> **INSTRUCCIÓN:** Este documento complementa a CONTEXTO-COMPLETO-TRACCIONA.md (visión general) y resumen_tank_iberica.md (detalle técnico/SEO). Aquellos explican QUÉ es cada sistema. Este explica CÓMO funciona por dentro y CÓMO escala de fase 1 a fase 4.

---

## ÍNDICE DE DOCUMENTOS DEL PROYECTO

Antes de los flujos, el mapa de documentos que existen:

| Documento                                    | Para qué                                                                | Cuándo leerlo                                              |
| -------------------------------------------- | ----------------------------------------------------------------------- | ---------------------------------------------------------- |
| **CONTEXTO-COMPLETO-TRACCIONA.md**           | Visión general: quién soy, qué construyo, modelo negocio, stack, estado | **Siempre primero**                                        |
| **resumen_tank_iberica.md**                  | Detalle profundo: SEO, arquitectura, decisiones, snippets de código     | Cuando necesites detalle técnico o historial de decisiones |
| **Este documento**                           | Flujos operativos internos y evolución por fases de cada sistema        | Cuando necesites entender CÓMO funciona algo por dentro    |
| **INSTRUCCIONES-MAESTRAS.md** (5.719 líneas) | 42 sesiones de implementación paso a paso para Claude Code              | Cuando vayas a implementar código                          |
| **PLAN-AUDITORIA-TRACCIONA.md** (849 líneas) | Plan de auditoría a 20 años, 12 dimensiones, calendario, plantilla      | Cuando vayas a auditar o evaluar el proyecto               |
| **VALORACION-PROYECTO-1-100.md**             | Puntuación actual por dimensión (77/100 media)                          | Para saber dónde estamos                                   |
| **RECOMENDACIONES-100-PUNTOS.md**            | Acciones para llegar a 100/100 en cada dimensión                        | Para saber qué mejorar                                     |
| **addendum-business-bible.md**               | Decisiones post-Business Bible: i18n, capas, costes traducción          | Contexto de decisiones estratégicas                        |
| **CLAUDE.md**                                | Instrucciones rápidas para Claude Code                                  | Inicio de sesión de desarrollo                             |

---

## 1. PIPELINE DE IMÁGENES — 3 FASES

### Cómo funciona hoy (Fase 1: Cloudinary only)

```
Dealer sube foto → Frontend envía a Cloudinary → Cloudinary genera 4 variantes:
  • thumb (150×150, crop auto)
  • card (400×300, crop auto, mejora calidad)
  • gallery (1200×900, calidad alta)
  • og (1200×630, para compartir en RRSS)
→ URLs de Cloudinary se guardan en BD (vehicle_images)
→ Cloudinary CDN sirve las imágenes al usuario
```

**Transformación Cloudinary:** `g_auto,e_improve,q_auto,f_webp` (foco automático, mejora, calidad adaptativa, WebP).

**Límite free:** 25.000 transformaciones/mes. Con 4 variantes × 10 fotos = 40 transformaciones/vehículo. **Límite: ~625 vehículos/mes.** Suficiente para fase 1 (Tracciona sola).

**Variable de control:** `IMAGE_PIPELINE_MODE=cloudinary` en `.env`

### Fase 2: Pipeline híbrido (trigger: Cloudinary >70% del plan)

```
Dealer sube foto → Frontend envía a Cloudinary → Cloudinary transforma
→ POST /api/images/process:
    1. Descarga variantes desde Cloudinary
    2. Sube a Cloudflare Images (4 variantes nombradas)
    3. Devuelve URLs de CF Images
→ URLs de CF Images se guardan en BD
→ CF Images CDN sirve las imágenes (más barato a volumen)
→ Cloudinary solo procesa, no sirve
```

**Por qué híbrido:** Cloudinary tiene transformaciones superiores (g_auto, e_improve) que CF Images no ofrece. Pero CF Images sirve más barato: $5/100K imágenes servidas vs Cloudinary que cobra por transformación.

**Coste:** Cloudinary sigue cobrando por transformación pero no por serving. CF Images cobra $5/100K servidas. Con 10K imágenes servidas 100 veces/mes = $5/mes.

**Variable:** `IMAGE_PIPELINE_MODE=hybrid`

**Composable `useImageUrl.ts`:** Detecta automáticamente el origen:

- URL contiene `imagedelivery.net` → CF Images → append `/{variant}`
- URL contiene `cloudinary.com` → Cloudinary → insertar transformaciones en URL
- Las imágenes antiguas (Cloudinary) y nuevas (CF Images) conviven sin problemas.

**Migración batch:** Endpoint `/api/infra/migrate-images.post.ts` lee vehículos con URLs Cloudinary, ejecuta pipeline para cada imagen, actualiza BD. Ejecutable desde admin con botón "Migrar imágenes pendientes". Batch de 50, con progreso visible.

### Fase 3: CF Images only (trigger: CF Images añade transformaciones suficientes)

```
Dealer sube foto → Frontend envía directo a CF Images
→ CF Images sirve con variantes predefinidas
→ Cloudinary se elimina completamente
```

**Variable:** `IMAGE_PIPELINE_MODE=cf_images_only`

**Cuándo:** Cuando CF Images soporte `g_auto` equivalente O cuando el volumen haga que pagar Cloudinary Plus ($89/mes) no se justifique. Decisión de negocio, no de código.

### Panel admin de imágenes

Dentro de `/admin/infraestructura`, pestaña "Estado":

- Pipeline activo: `cloudinary` / `hybrid` / `cf_images_only`
- Imágenes en Cloudinary: X (pendientes de migrar) / Y (migradas)
- Imágenes en CF Images: Z
- Botón: "Migrar imágenes pendientes" (batch)
- Botón: "Configurar variantes CF Images" (ejecutar 1 vez)

### Costes por fase

| Fase                | Cloudinary | CF Images | Total/mes | Límite                     |
| ------------------- | ---------- | --------- | --------- | -------------------------- |
| 1 (solo Cloudinary) | 0€ (free)  | —         | 0€        | 625 vehículos/mes          |
| 1 (Cloudinary Plus) | $89/mes    | —         | ~85€      | 12.500 vehículos/mes       |
| 2 (híbrido)         | $89/mes    | ~$5/mes   | ~90€      | 12.500 + serving ilimitado |
| 3 (solo CF)         | 0€         | ~$15/mes  | ~15€      | Ilimitado                  |

### ⚠️ DECISIÓN: Rol de Cloudinary en el pipeline

**Cloudinary transforma, NO almacena.** Las fotos de dealers (mal iluminadas, en naves industriales) se benefician enormemente de `g_auto` (foco automático) y `e_improve` (mejora de calidad). Esto justifica mantener Cloudinary como procesador incluso en fase 2/3. Pero Cloudinary NO debe ser el almacenamiento ni el CDN de serving — eso lo hace CF Images, que es más barato a volumen.

Flujo definitivo: `Dealer sube foto → Cloudinary transforma → CF Images almacena y sirve → Cloudinary NO retiene la imagen.`

### Cache agresivo de imágenes

Las fotos de vehículos no cambian una vez subidas. Aplicar en CF Pages/Workers:

```
Cache-Control: public, max-age=2592000, immutable
```

30 días de cache. Las URLs de imagen usan hash o version query param para invalidar si es necesario. Esto es GRATIS y reduce drásticamente las peticiones a CF Images/Cloudinary.

---

## 2. SUPABASE MULTI-CLUSTER — ESCALADO POR VERTICALES

### Cómo funciona hoy (1 cluster)

Un único proyecto Supabase Pro ($25/mes) con todas las tablas. `vertical_config` filtra datos por vertical. Todas las queries incluyen `WHERE vertical = 'tracciona'` implícita o explícitamente.

### Sistema de peso

Cada vertical tiene un "peso" que refleja cuántos recursos consume:

| Vertical        | Peso | Por qué                                               |
| --------------- | ---- | ----------------------------------------------------- |
| Tracciona       | 1.0  | Miles de vehículos, muchos dealers, queries complejas |
| Horecaria       | 1.0  | Millones de fichas (300K+ bares), muchos idiomas      |
| CampoIndustrial | 1.0  | Alto volumen, similar a Tracciona                     |
| ReSolar         | 0.4  | Volumen medio, lotes grandes pero pocos               |
| Municipiante    | 0.15 | Pocas fichas, pocos dealers, queries simples          |
| Clinistock      | 0.15 | Nicho pequeño, bajo volumen                           |
| BoxPort         | 0.15 | Producto estandarizado, muy simple                    |

**Capacidad de 1 Supabase Pro:** ~4.0 peso total. Es decir, aguanta 4 "Horecarias" o 1 Tracciona + 1 CampoIndustrial + Municipiante + Clinistock + BoxPort + ReSolar (peso total = 1.0 + 1.0 + 0.15 + 0.15 + 0.15 + 0.4 = 2.85).

**La tabla `infra_clusters` almacena:** URL, keys, verticales asignadas, peso usado/límite, estado.

### Cuándo crear segundo cluster

**Trigger automático:** Cuando `weight_used / weight_limit > 0.80` en el panel de monitorización → alerta "Crear nuevo cluster y migrar verticales ligeras".

**Trigger manual:** Cuando una vertical diverge tanto que necesita configuración de BD diferente (por ejemplo, Horecaria con millones de fichas necesita índices y materialización propios).

### Flujo de migración (wizard de 5 pasos en admin)

```
Paso 1: Admin selecciona vertical a migrar (dropdown de verticales del cluster)
Paso 2: Selecciona destino (cluster existente O "Crear nuevo")
        Si "Crear nuevo": instrucciones para crear proyecto en Supabase dashboard
        → copiar URL + anon key + service role key → aplicar migraciones
Paso 3: Sistema genera plan de migración:
        - Tablas a copiar: vehicles, dealers, categories, subcategories, attributes,
          articles, content_translations, vertical_config, active_landings, geo_regions
        - Tablas que NO se copian: users (compartidos), infra_* (admin global)
        - Filas estimadas por tabla
        - Tiempo estimado
        - Warnings (auth sigue siendo compartido)
Paso 4: Admin confirma con checkbox
        - El sistema copia datos tabla por tabla
        - Status cluster → 'migrating' durante el proceso
        - Verificación de conteo por tabla
Paso 5: Resultado + instrucciones para Cloudflare Pages:
        - Crear nuevo deploy con variable SUPABASE_URL=nuevo_cluster
        - Apuntar dominio del vertical al nuevo deploy
```

**Importante:** NO borra datos del origen. Solo copia. Borrado manual después de verificar que todo funciona.

### Routing entre clusters

No hay routing dinámico. Cada deploy de Cloudflare Pages tiene sus propias variables de entorno apuntando a su cluster Supabase. Un deploy = un cluster = una o varias verticales.

```
tracciona.com      → Deploy A → Cluster 1 (Supabase)
municipiante.com   → Deploy A → Cluster 1 (mismo, diferente VERTICAL env)
horecaria.com      → Deploy B → Cluster 2 (Supabase diferente)
```

### Costes de escalado

| Fase                  | Clusters | Verticales    | Coste Supabase |
| --------------------- | -------- | ------------- | -------------- |
| Lanzamiento           | 1 Pro    | 1 (Tracciona) | $25/mes        |
| +2 verticales ligeras | 1 Pro    | 3             | $25/mes        |
| +1 pesada (Horecaria) | 2 Pro    | 4             | $50/mes        |
| 7 verticales          | 2-3 Pro  | 7             | $50-75/mes     |
| 20 verticales         | 5-6 Pro  | 20            | $125-150/mes   |

### ⚠️ DECISIÓN: Dependencia de Supabase y diversificación

**Supabase proporciona 4 servicios críticos simultáneos.** No solo "PostgreSQL":

| Servicio      | Qué usamos                              | Alternativa si falla             |
| ------------- | --------------------------------------- | -------------------------------- |
| PostgreSQL    | BD completa, RLS, vistas materializadas | Neon, Railway, VPS               |
| GoTrue (Auth) | Login, tokens, sesiones, PKCE           | Auth.js, Clerk                   |
| Realtime      | Subastas en vivo (websockets)           | Cloudflare Durable Objects, Ably |
| Vault         | Secretos (si se usa)                    | Variables de entorno CF          |

**Riesgo real:** Si Supabase sube precios, cambia condiciones o tiene incidente prolongado, las 4 capas se afectan simultáneamente. El "Plan B" de migrar en 4-8h es optimista para la BD sola; migrar Auth (sesiones activas de usuarios) y Realtime (subastas) requiere más tiempo.

**Decisión:** Cuando llegue el momento de un segundo cluster, considerar que ese segundo cluster sea **Neon o Railway** (solo PostgreSQL) para empezar a diversificar. Auth y Realtime seguirían en el cluster principal de Supabase, pero la BD de verticales secundarias no dependería de un solo vendor.

---

## 3. SUSCRIPCIONES STRIPE — CICLO DE VIDA COMPLETO

### Planes

| Plan     | Precio                  | Para quién            | Qué incluye                                                       |
| -------- | ----------------------- | --------------------- | ----------------------------------------------------------------- |
| Free     | 0€                      | Cualquier dealer      | 5 listings, presupuestos, calculadora, historial                  |
| Basic    | 29€/mes (290€/año)      | Dealers con volumen   | 50 listings, facturas, contratos, exportar, CRM, estadísticas     |
| Premium  | 79€/mes (790€/año)      | Dealers profesionales | Ilimitado + widget + pipeline + observatorio + comparativa sector |
| Founding | 0€ × 12m, luego Premium | Primeros 15 dealers   | Todo Premium + badge exclusivo permanente                         |

### Flujo completo de vida

```
1. REGISTRO
   Dealer se registra → plan Free automático → onboarding wizard 5 pasos

2. UPGRADE
   Dashboard → "Mejorar plan" → /precios → comparativa → botón "Suscribirse"
   → Stripe Checkout Session (redirige a Stripe)
   → Pago exitoso → webhook checkout.session.completed
   → Server actualiza subscriptions: plan, stripe_subscription_id, stripe_customer_id
   → Email #7 "Suscripción activada" + factura

3. RENOVACIÓN AUTOMÁTICA
   Stripe cobra automáticamente cada mes/año
   → webhook invoice.payment_succeeded
   → Server renueva expires_at
   → Email #7 "Suscripción renovada"

4. PAGO FALLIDO (dunning)
   Stripe intenta cobrar → falla
   → webhook invoice.payment_failed
   → Server: grace period 7 días, flag en subscriptions
   → Email #9 "Pago fallido" + link para actualizar tarjeta
   → Stripe reintenta 3 veces (días 1, 3, 5)
   → Si falla 3 veces → webhook customer.subscription.deleted

5. CANCELACIÓN / DOWNGRADE
   webhook customer.subscription.deleted
   → Server: plan → 'free', status → 'cancelled'
   → Email #10 "Suscripción cancelada" + lo que pierden
   → Datos del dealer SE CONSERVAN (no se borran)
   → Vehículos por encima del límite Free → status 'paused' (no se eliminan)
   → Acceso a herramientas se limita según plan Free

6. REACTIVACIÓN
   Dealer puede volver a suscribirse en cualquier momento
   → Mismo flujo que upgrade
   → Vehículos pausados → se reactivan si dentro del nuevo límite
```

### Stripe Connect (evolución)

```
Fase 1 (ahora): Checkout simple
  - Stripe Checkout para suscripciones
  - PaymentIntent para pagos puntuales (verificación, pase 72h, merchandising)

Fase 2 (mes 6-12): Connect básico
  - Stripe Connect "destination charges"
  - Cada dealer crea Connected Account (onboarding via Stripe)
  - Ventas intermediadas: comprador paga → Tracciona retiene comisión 3-5% → resto al dealer
  - Tabla dealer_stripe_accounts (dealer_id, stripe_account_id, charges_enabled)
  - El % de comisión se lee de vertical_config

Fase 3 (mes 12+): Escrow completo
  - PaymentIntent con hold → confirmar cuando comprador reciba vehículo
  - Resolve disputes automáticamente (comprador confirma recepción → release funds)
  - Habilita cobro automático de comisión (hoy depende de confianza)
```

### Founding Dealers — programa completo

```
Captación:
  - Identificar 15 dealers del sector (contactos de Tank Ibérica + cold outreach)
  - Pitch: "12 meses gratis Premium + badge exclusivo para siempre"
  - Requisito: mínimo 5 vehículos publicados

Activación:
  - Admin crea suscripción manual: plan='founding', precio=0, expires_at=+12 meses
  - Badge "Founding Dealer 🏆" en portal público (permanente aunque cambie de plan)
  - Acceso a todo Premium

Caducidad (mes 12):
  - Email a mes 11: "Tu periodo Founding termina en 30 días"
  - Email a mes 12: "Gracias por ser Founding. Tu plan ahora es Free. Upgrade a Premium para mantener tus herramientas"
  - Si no paga: baja a Free, pierde herramientas Premium, MANTIENE badge Founding
  - Si paga: continúa en Premium + badge Founding
```

---

## 4. VERIFICACIÓN DE VEHÍCULOS — 5 NIVELES OPERATIVOS

### Flujo por nivel

```
NIVEL ✓ (Verificado) — AUTOMÁTICO
  Quién actúa: Dealer + Claude Vision
  1. Dealer sube en /dashboard/vehiculos/[id] → sección "Documentación":
     - Ficha técnica (PDF o foto)
     - Foto del cuadro de km
     - 4+ fotos del estado real
  2. POST /api/verify-document → Claude Vision analiza:
     - Extrae: marca, modelo, matrícula, km, MMA, ejes
     - Compara con datos declarados en el anuncio
  3. Si coinciden → auto-approve → badge ✓ sin intervención humana
  4. Si discrepancia → flag para admin → cola en /admin/verificaciones
  Coste: ~0,05€ (API Claude Vision) | Precio al dealer: GRATIS

NIVEL ✓✓ (Verificado+) — SEMI-AUTOMÁTICO
  Quién actúa: Sistema + proveedor externo
  1. Comprador o vendedor paga informe DGT (Stripe one-time)
  2. POST /api/dgt-report → consulta InfoCar API (o alternativa):
     - Primera matriculación, titulares, historial ITV con km, cargas, seguro
  3. Claude analiza respuesta → genera PDF con Km Score
  4. PDF guardado en verification_documents + nivel actualizado
  Coste: 2-4€ (InfoCar API) | Precio al usuario: 25-35€ | Margen: 15-20€

NIVEL ✓✓✓ (Verificado++) — MANUAL + AUTOMÁTICO
  Quién actúa: Dealer/vendedor + admin
  1. Dealer sube documentación específica del tipo:
     - Cisternas: certificado estanqueidad (obligatorio legalmente)
     - Frigoríficos: certificado ATP
     - Grúas: certificado fabricante + libro de revisiones
  2. Admin verifica manualmente en /admin/verificaciones
  3. Si aprobado → badge ✓✓✓
  Coste: 0€ (documentos del vendedor) | Precio: 50-150€

NIVEL ★ (Auditado) — EXTERNO
  Quién actúa: Perito subcontratado
  1. Solicitud de inspección (comprador o vendedor) + pago Stripe
  2. Admin recibe notificación → coordina con mecánico inspector
  3. Inspector va al vehículo con checklist de 30 puntos (configurable por vertical)
  4. Fotos + resultados → Claude genera informe PDF
  5. PDF en BD + badge ★
  Coste: 100-150€ (inspector subcontratado) | Precio: 300-500€ | Margen: 150-350€

NIVEL 🛡 (Certificado) — PREMIUM
  Quién actúa: Equipo TI completo
  1. Todos los niveles anteriores completados
  2. Garantía de Tracciona sobre el estado del vehículo
  3. Incluye seguro de defectos ocultos (partner asegurador)
  Coste: variable | Precio: a definir | Fase 3+
```

### Escalabilidad del sistema de verificación

```
Fase 1 (manual): Admin revisa cada documento → 10-20 verificaciones/día
Fase 2 (semi-auto): Claude Vision auto-aprueba nivel ✓, admin solo revisa flags → 50-100/día
Fase 3 (automático): Integración directa con InfoCar/DGT para ✓✓, solo ✓✓✓ y ★ requieren humano
Fase 4 (escalado): Inspector network en cada región, formulario digital en vez de papel
```

### ¿Qué pasa si el vehículo se vende?

- La verificación queda asociada al vehículo (vehicle_id), no al vendedor
- Al marcar como vendido: vehículo pasa a histórico, verificación se archiva
- NO se transfiere al nuevo dueño — si revende, necesita verificar de nuevo
- El informe DGT (nivel ✓✓) sigue siendo descargable para el comprador

---

## 5. WHATSAPP → VEHÍCULO — FLUJO COMPLETO

```
PASO 1: El dealer envía fotos al número de WhatsApp de Tracciona
  → Puede enviar: fotos sueltas, fotos con texto, PDF de ficha técnica
  → Puede enviar múltiples mensajes (el sistema agrupa por conversación)

PASO 2: Webhook recibe el mensaje
  → POST /api/whatsapp/webhook (Meta Cloud API)
  → Verifica firma HMAC x-hub-signature-256
  → Identifica dealer: normalizePhone() → buscar en dealers.phone
  → Si dealer no registrado: responde "Regístrate en tracciona.com para publicar"
  → Si dealer registrado: guarda mensaje en whatsapp_submissions

PASO 3: Procesamiento con IA
  → POST /api/whatsapp/process
  → Claude Vision (Sonnet 4.5) analiza todas las fotos:
    - Extrae: marca, modelo, año, km, precio, MMA, ejes, tipo, estado
    - Si hay ficha técnica PDF: extrae datos adicionales
    - Genera descripción profesional (~150 palabras, SEO, bilingüe ES+EN)
  → Crea vehicle con status='draft', dealer_id del dealer detectado

PASO 4: Notificación al dealer
  → Respuesta WhatsApp: "✅ Tu vehículo se ha procesado. Revísalo aquí: [link a /dashboard/vehiculos/[id]]"
  → El dealer revisa, edita si quiere, y publica
  → También visible en admin: cola de vehículos WhatsApp pendientes

SI FALLA:
  → retry_count se incrementa (max 3)
  → last_error se guarda
  → Si Claude no puede extraer datos suficientes: respuesta WhatsApp
    "⚠️ No pudimos procesar tu envío. ¿Puedes enviar la ficha técnica?"
  → Admin ve los fallos en /admin/whatsapp con motivo del error
```

**Coste por publicación:** ~0,05€ (Claude Vision API). Argumento comercial: "Mándame las fichas técnicas por WhatsApp y mañana tienes tus 30 vehículos publicados con anuncios profesionales bilingües".

**Limitaciones actuales:**

- Solo procesa imágenes y PDFs (no vídeo)
- Necesita al menos 1 foto clara del vehículo
- Si no detecta precio, lo deja en 0 y el dealer debe completarlo
- No soporta conversación interactiva (no pregunta datos faltantes, solo informa)

---

## 6. SUBASTAS — FLUJO DE PRINCIPIO A FIN

```
1. CREAR SUBASTA
   Admin en /admin/subastas → "Nueva subasta"
   → Seleccionar vehículo(s) del catálogo
   → Configurar: precio salida, precio reserva (secreto), incremento mínimo,
     buyer premium %, depósito requerido, fechas inicio/fin, anti-snipe seconds
   → O automático: vehículo con auto_auction_after_days expirado → cron crea subasta

2. PUBLICACIÓN
   → Subasta visible en /subastas con countdown
   → Email a suscriptores Pro con demandas que matcheen
   → Aparece banner en ficha del vehículo: "Este vehículo entra en subasta el [fecha]"

3. REGISTRO DE PUJADORES
   → Formulario: DNI/CIF + foto documento + datos fiscales
   → Depósito via Stripe PaymentIntent con capture_method='manual' (retiene sin cobrar)
   → Depósito: 5-10% del precio de salida o 500-1.000€ (lo que sea mayor)
   → Admin aprueba o auto-aprobación si DNI ya verificado en el sistema
   → Sin depósito pagado = no puedes pujar

4. SUBASTA EN VIVO
   → Supabase Realtime: INSERT en bids → todos los pujadores ven en tiempo real
   → Botones de puja rápida: mínima (+incremento), +500€, +1.000€
   → Anti-sniping: puja en últimos N minutos → extiende tiempo automáticamente
   → Buyer premium visible: "Precio final = tu puja + 8%"
   → No registrado = modo lectura (ve pujas pero no puede pujar)

5. CIERRE
   → Tiempo se acaba (o extensión anti-snipe termina)
   → Si puja final >= precio reserva → vendido al ganador
   → Si puja final < reserva → admin decide (adjudicar o no)

6. POST-SUBASTA
   → Ganador: Stripe capture del depósito + cobro del resto + buyer premium
   → Perdedores: Stripe cancel de PaymentIntent (devuelve depósito)
   → Email #23 al ganador: instrucciones de pago + contacto vendedor
   → Email #24 a perdedores: sugerencia de vehículos similares
   → Vehículo → status 'sold'

7. SERVICIOS POST-SUBASTA (cross-sell)
   → Transporte: ¿necesitas que lo llevemos? (IberHaul)
   → Trámites: ¿necesitas transferencia? (Gesturban)
   → Inspección: ¿quieres verificar antes de pagar el resto?
```

**Cuándo se activa:** Cuando el catálogo tenga ≥50-100 vehículos. Antes no tiene sentido.

**Ingreso por subasta:** Una cisterna de 40K€ con buyer premium 8% genera 3.200€ + transporte (~400€) + trámites (~200€) = ~3.800€ de ingresos para la plataforma.

---

## 7. i18n — FLUJO ASÍNCRONO DE TRADUCCIÓN

### ⚠️ DECISIÓN: Lanzar con ES + EN, expandir bajo demanda

**Lanzamiento:** Español + Inglés únicamente. Inglés como lingua franca para compradores internacionales (ya son ~25% de las ventas de Tank Ibérica, incluidos compradores africanos).

**Expandir bajo demanda:** Activar francés cuando haya un dealer francés o tráfico significativo desde Francia. Portugués cuando haya señales desde Portugal. Cada idioma extra multiplica URLs, hreflangs, textos de UI a revisar, y diluye la autoridad SEO en vez de concentrarla.

**La arquitectura está lista para N idiomas desde el día 1:** JSONB, fallback chain, batch translation, locales/XX.json. Activar un idioma nuevo es "solo datos" — se hace en horas, no en semanas.

### Flujo al publicar un vehículo

```
1. Dealer publica vehículo en español
   → Vehículo visible INMEDIATAMENTE en /es/ (idioma original)
   → Campos JSONB: { "es": "Cisterna alimentaria Indox 2019" }

2. Job asíncrono (30-60 segundos)
   → Cron o edge function detecta pending_translations = true
   → Para cada idioma activo (en, fr, de, it, pt, nl):
     - GPT-4o mini Batch API traduce título + descripción
     - Campo source: 'auto_gpt4o_mini'
     - Actualiza JSONB: { "es": "...", "en": "...", "fr": "..." }
   → pending_translations = false

3. Usuario visita /en/vehicle/cisterna-alimentaria-indox-2019
   → localizedField(vehicle.title, 'en') busca:
     1. vehicle.title['en'] → si existe, lo muestra
     2. vehicle.title['es'] → fallback a español
     3. Primer valor disponible → último recurso
```

### Flujo para activar un idioma nuevo

```
1. Añadir 1 línea en nuxt.config.ts: { code: 'pt', file: 'pt.json', name: 'Português' }
2. Crear locales/pt.json con ~500 strings de UI (Claude Max, 0€)
3. Lanzar batch de traducción del catálogo existente:
   → GPT-4o mini: ~0,001€/ficha × 500 fichas = 0,50€
4. Opcionalmente: insertar regiones de Portugal en geo_regions (publicidad geo)
5. Deploy → idioma activo
```

**Coste:** Activar portugués para 500 fichas = 0,50€. Para 2M fichas (Horecaria) = ~113€.

### Campo `source` en traducciones

| Valor             | Significado               | Cuándo                   |
| ----------------- | ------------------------- | ------------------------ |
| `original`        | Escrito por el dealer     | Idioma nativo del dealer |
| `auto_gpt4o_mini` | Traducido por GPT-4o mini | Batch automático         |
| `auto_claude`     | Traducido por Claude      | Artículos editoriales    |
| `auto_deepl`      | Traducido por DeepL       | Si se cambia de motor    |
| `reviewed`        | Revisado por humano       | Post-corrección manual   |

### Workflow dominical de contenido

```
Domingo (sesión con Claude Max):
  1. Generar 4-6 artículos en español (guías, noticias, normativa)
  2. Claude traduce a idiomas activos (EN al lanzar, más según demanda)
     → guardar con scheduled_for martes/jueves
  3. Generar posts RRSS para cada artículo × plataforma × idioma
  4. Todo queda programado para la semana

Martes 09:00 CET: Cron publica artículo 1
Jueves 09:00 CET: Cron publica artículo 2
Lu-Vi 10:00 CET: Posts automáticos en LinkedIn
```

---

## 8. PUBLICIDAD GEO-SEGMENTADA — FLUJO DE MATCHING

### Cómo funciona el matching

```
1. Usuario visita página (ej: /cisternas-alimentarias)
2. useUserLocation detecta ubicación:
   localStorage → navigator.geolocation (Nominatim) → CF cf-ipcountry → null
3. useAds(position, page) busca anuncio:
   a. Filtrar por posición (ej: 'sidebar')
   b. Filtrar por categoría/página si aplica
   c. Filtrar por geo: país del usuario → comunidad → provincia
   d. Si hay anuncio pagado → mostrarlo
   e. Si no → fallback a AdSense (si la posición tiene fallback)
   f. Si posición sin fallback → no mostrar nada
4. Registrar impresión en ad_events
5. Si clic → registrar clic en ad_events
```

### 10 posiciones de anuncio

| #   | Posición         | Dónde                | Floor price/mes    | AdSense fallback   |
| --- | ---------------- | -------------------- | ------------------ | ------------------ |
| 1   | pro_teaser       | Catálogo arriba      | Sistema (no venta) | NO                 |
| 2   | catalog_inline   | Cada 8-10 resultados | 150-300€           | SÍ                 |
| 3   | sidebar          | Landings + artículos | 100-200€           | SÍ                 |
| 4   | search_top       | Arriba resultados    | 300-500€           | NO                 |
| 5   | vehicle_services | Ficha bajo specs     | 200-400€           | NO                 |
| 6   | dealer_portal    | Portal dealer        | 50-100€            | SÍ (si no Premium) |
| 7   | landing_sidebar  | Landing SEO derecha  | 100-200€           | SÍ                 |
| 8   | article_inline   | Entre párrafos 2-3   | 50-100€            | SÍ                 |
| 9   | email_footer     | Emails antes footer  | 100-200€           | NO                 |
| 10  | pdf_footer       | PDFs pie página      | 50-100€            | NO                 |

### Escalado multi-vertical

- Cada vertical tiene sus propios anunciantes (un transportista anuncia en Tracciona, una distribuidora en Horecaria)
- La tabla `advertisements` tiene columna `vertical`
- Un anunciante puede comprar espacio en múltiples verticales (descuento por volumen)
- El admin gestiona todo desde `/admin/publicidad`

---

## 9. CRM DE DEALERS — PIPELINE COMPLETO

```
CAPTACIÓN:
  Lead → Contacto → Demo → Founding/Free → Activo

  1. Lead identificado: el admin registra un potencial dealer
     (contacto de Tank, feria, búsqueda web)
  2. Primer contacto: email/teléfono con pitch
  3. Demo: si interesado, mostrar plataforma
  4. Alta: se registra como dealer (Free o Founding)
  5. Onboarding wizard 5 pasos:
     ✅ Verificar email
     ✅ Completar perfil empresa (nombre, CIF, logo, ubicación)
     ✅ Subir primer vehículo
     ✅ Personalizar portal (colores, bio)
     ✅ Publicar
  6. Health score empieza a calcularse (cron diario, 0-100)

RETENCIÓN:
  - Resumen semanal automático (#5): visitas, leads, comparativa
  - Resumen mensual (#6): métricas del mes, ranking, ROI
  - Health score visible en admin: dealers con score <50 = atención

REACTIVACIÓN:
  - 7 días sin login → email "Tienes leads sin responder"
  - 30 días sin publicar → "Tu catálogo necesita actualización"
  - 60 días inactivo → "¿Necesitas ayuda?"

UPSELL:
  - Free → Basic: "Desbloquea facturas, contratos y CRM"
  - Basic → Premium: "Widget embebible, pipeline, observatorio"
  - Founding (mes 12) → Premium: "Mantén tus herramientas"
```

---

## 10. SISTEMA DE 30 EMAILS AUTOMÁTICOS

### Para DEALERS (15 emails)

| #   | Trigger                 | Email                                  | Template key               |
| --- | ----------------------- | -------------------------------------- | -------------------------- |
| 1   | Registro dealer         | Bienvenida + guía + soporte            | `dealer_welcome`           |
| 2   | Lead recibido           | Datos del interesado + vehículo        | `dealer_new_lead`          |
| 3   | Vehículo publicado      | Link ficha + SEO score + sugerencias   | `dealer_vehicle_published` |
| 4   | Vehículo vendido        | Stats (días, visitas, leads)           | `dealer_vehicle_sold`      |
| 5   | Cron dominical          | Resumen semanal comparativo            | `dealer_weekly_summary`    |
| 6   | Cron día 1 del mes      | Resumen mensual + ranking              | `dealer_monthly_summary`   |
| 7   | Suscripción activada    | Confirmación + factura                 | `dealer_sub_activated`     |
| 8   | 7 días antes expirar    | CTA para renovar                       | `dealer_sub_expiring`      |
| 9   | Pago fallido            | Link actualizar tarjeta + grace period | `dealer_payment_failed`    |
| 10  | Cancelación             | Confirmación + lo que pierden          | `dealer_sub_cancelled`     |
| 11  | Verificación completada | Link al informe                        | `dealer_verification_done` |
| 12  | Subasta: registro ok    | Depósito recibido + detalles           | `auction_registration`     |
| 13  | Subasta en 24h          | Recordatorio + link                    | `auction_reminder`         |
| 14  | Subasta finalizada      | Resultado + siguiente paso             | `auction_result`           |
| 15  | Nuevo artículo sector   | Contenido relevante                    | `dealer_new_article`       |

### Para COMPRADORES (9 emails)

| #   | Trigger                     | Email                             | Template key             |
| --- | --------------------------- | --------------------------------- | ------------------------ |
| 16  | Registro comprador          | Bienvenida + guía búsqueda        | `buyer_welcome`          |
| 17  | Match con filtros guardados | Vehículos nuevos que coinciden    | `buyer_search_alert`     |
| 18  | Favorito baja precio        | Notificación + link               | `buyer_price_drop`       |
| 19  | Favorito vendido            | Aviso + similares                 | `buyer_fav_sold`         |
| 20  | Demanda publicada           | Confirmación búsqueda activa      | `buyer_demand_confirmed` |
| 21  | Match con demanda           | Vehículo nuevo coincide           | `buyer_demand_match`     |
| 22  | Subasta: puja superada      | Link para pujar de nuevo          | `auction_outbid`         |
| 23  | Subasta: ganaste            | Instrucciones + contacto vendedor | `auction_won`            |
| 24  | Subasta: no ganaste         | Resultado + similares             | `auction_lost`           |

### Del SISTEMA (6 emails)

| #   | Trigger                 | Email                          | Template key                  |
| --- | ----------------------- | ------------------------------ | ----------------------------- |
| 25  | Verificación disponible | Badge nuevo en favorito        | `vehicle_verification_update` |
| 26  | Registro                | Confirmar email (doble opt-in) | `confirm_email`               |
| 27  | Solicitud               | Resetear contraseña            | `reset_password`              |
| 28  | Cambio email            | Confirmar nuevo email          | `change_email`                |
| 29  | Borrar cuenta           | Confirmación RGPD              | `account_deleted`             |
| 30  | Login nuevo dispositivo | Aviso seguridad                | `suspicious_login`            |

### Infraestructura

- **Resend** como proveedor (3.000/mes gratis, luego $20/mes para 50K)
- Templates JSONB multi-idioma: se envían en el idioma del destinatario
- Admin en `/admin/config/emails`: CRUD, preview, test, stats (enviados/abiertos/clic)
- Toggle on/off por template
- Colores heredados del vertical automáticamente
- Link "Gestionar preferencias" en footer de cada email
- Tabla `email_preferences`: el usuario controla qué recibe
- "Desuscribirse de todo" excepto transaccionales (confirmar email, reset password)

---

## 11. HERRAMIENTAS DEL DEALER — DETALLE FUNCIONAL

### Widget embebible

```
Dealer en /dashboard/herramientas/widget:
  1. Configura: límite de vehículos, tema (light/dark), categoría
  2. Sistema genera código: <iframe src="tracciona.com/embed/transportes-garcia?limit=6&theme=dark">
  3. Vista previa en la misma página
  4. Botón "Copiar código"

Server route /embed/[dealer-slug]:
  → Renderiza HTML puro con CSS inline (no depende de Nuxt)
  → Grid de vehículos del dealer (limit, theme, category según params)
  → Clic en vehículo → abre ficha en tracciona.com (target="_blank")
  → Responsive, se adapta al ancho del iframe

Plan: Premium/Founding
```

### Sistema de merchandising

```
Dealer en /dashboard/herramientas/merchandising:

  ⚠️ DECISIÓN: Visible como opción, NO implementado como flujo completo.

  El dealer ve un banner/sección atractiva en su portal:
    "Merchandising personalizado — Tarjetas, imanes, lonas con tu marca"
    [Ver catálogo] → Página con preview de productos + formulario de interés

  El formulario recoge: qué producto le interesa, cantidad estimada, email.
  INSERT en service_requests (type='merchandising', metadata={producto, cantidad})

  Esto mide demanda REAL antes de montar logística con imprenta.
  Cuando haya suficientes peticiones → implementar flujo completo:
    1. Catálogo de productos: tarjetas visita, imanes furgoneta, lona feria,
       pegatinas QR, roll-up
    2. Preview automático con logo dealer + QR dinámico
    3. Pago Stripe → PDF diseño → imprenta partner

  El truco sigue siendo el mismo: el dealer PAGA por hacer marketing de Tracciona.

Plan: Free (es gancho cuando se active)
```

---

## 12. FACTURACIÓN Y COMPLIANCE FISCAL

### Flujo de facturación

```
1. Se produce un cobro (suscripción, verificación, pase 72h, merchandising)
2. Stripe webhook confirma pago
3. Server → Quaderno API:
   - Envía datos: cliente (CIF, país), importe, concepto, IVA
   - Quaderno calcula IVA correcto automáticamente:
     - España B2B: 21% IVA
     - UE B2B con VAT válido: 0% (inversión sujeto pasivo)
     - UK: 20% VAT (o 0% si B2B con VAT registration)
   - Quaderno genera factura legal con numeración correlativa
   - PDF guardado en Quaderno + URL en tabla invoices
4. Email al cliente con factura adjunta
5. Factura visible en /dashboard/facturas del dealer
```

### Doble fiscalidad UK/ES

```
Tank Ibérica SL (España):
  - Compraventa física de vehículos
  - Factura con IVA español 21%
  - Declaración trimestral (modelo 303) + anual (modelo 390)

TradeBase SL (España, previsto):
  - Propietaria de la plataforma tech
  - Cobra suscripciones, comisiones, servicios digitales
  - Si clientes en UE: One-Stop Shop (OSS) en AEAT
  - Si clientes en UK: VAT registration en HMRC o Stripe Tax automático

Operador en UK (Liverpool):
  - Fundador vive en UK → Self Assessment para ingresos personales
  - Si TradeBase opera desde UK: considerar UK branch o subsidiary
  - Transfer pricing: documentar transacciones entre entidades

Asesor fiscal actual: informado de estructura dual
Herramienta: Quaderno (auto-calcula IVA por país, integra con Stripe y SII)
```

### Cumplimiento SII (España)

```
Suministro Inmediato de Información:
  - Obligatorio para empresas con facturación >6M€ o voluntario
  - Tank Ibérica (500K€): NO obligatorio ahora, pero preparar
  - Quaderno puede generar fichero SII compatible
  - Exportación mensual CSV para la asesoría: todas las facturas emitidas
```

---

## 13. MONITORIZACIÓN — QUÉ SE MIDE Y CÓMO ALERTA

### Métricas monitorizadas (cron horario)

| Componente | Métrica              | API              | Límite free/pro | Warning 70% | Critical 85% |
| ---------- | -------------------- | ---------------- | --------------- | ----------- | ------------ |
| Supabase   | BD tamaño (bytes)    | Management API   | 500MB/8GB       | 350MB/5.6GB | 425MB/6.8GB  |
| Supabase   | Conexiones activas   | pg_stat_activity | 60/200          | 42/140      | 51/170       |
| Cloudflare | Workers requests/día | CF Analytics     | 100K/10M        | 70K/7M      | 85K/8.5M     |
| Cloudinary | Transformaciones/mes | Admin API        | 25K/100K        | 17.5K/70K   | 21.25K/85K   |
| CF Images  | Imágenes almacenadas | CF Images API    | $5/100K         | —           | —            |
| Resend     | Emails enviados/día  | Contar           | 100/1.667       | 70/1.167    | 85/1.417     |
| Sentry     | Eventos/mes          | Sentry API       | 5K/50K          | 3.5K/35K    | 4.25K/42.5K  |

### Sistema de alertas

```
Warning (≥70%): insertar alerta en BD, visible en admin. Cooldown 7 días.
Critical (≥85%): insertar alerta + badge en sidebar admin. Cooldown 48h.
Emergency (≥95%): insertar + email (Resend) + push notification. Cooldown 24h.
```

### Recomendaciones automáticas

| Situación                             | Recomendación                                               |
| ------------------------------------- | ----------------------------------------------------------- |
| Supabase cluster peso >80%            | "Crear nuevo cluster y migrar verticales ligeras"           |
| Supabase BD >70% plan                 | "Considerar Supabase Pro si estás en free, o limpiar datos" |
| Supabase conexiones >70%              | "Revisar connection pooling o considerar upgrade"           |
| Cloudinary transformaciones >70%      | "Activar pipeline híbrido (CF Images para serving)"         |
| Cloudinary transformaciones >90%      | "Upgrade a Plus ($89/mes) O redirigir serving a CF Images"  |
| CF Workers requests >70%              | "Revisar SWR de routeRules"                                 |
| CF Images almacenamiento >80%         | "Verificar que no se están duplicando imágenes"             |
| Resend emails >80% free (80/día)      | "Upgrade a Resend Pro ($20/mes, 50K/mes)"                   |
| Resend emails >80% Pro                | "Upgrade a Resend Business ($80/mes)"                       |
| Sentry eventos >80%                   | "Upgrade a Sentry Team ($26/mes) o ajustar sample rate"     |
| Stripe volumen >$100K/mes             | "Negociar tarifa personalizada con Stripe"                  |
| Supabase Realtime conexiones >150/200 | "Optimizar subastas o considerar Durable Objects"           |

### ⚠️ DECISIÓN: Panel de expansión del stack en admin

El admin debe tener una vista que muestre **TODOS los servicios** con su estado actual y cuándo hay que actuar. No solo alertas reactivas, sino un mapa proactivo:

```
/admin/infraestructura → Pestaña "Estado del stack"

┌─────────────────────────────────────────────────────────┐
│ Servicio          │ Plan actual │ Uso    │ Próximo paso │
│───────────────────│─────────────│────────│──────────────│
│ Supabase          │ Pro ($25)   │ 45%    │ OK           │
│ Cloudinary        │ Free        │ 68%    │ ⚠️ Activar   │
│                   │             │        │  híbrido     │
│ CF Images         │ $5/100K     │ 12%    │ OK           │
│ Resend            │ Free        │ 35%    │ OK           │
│ Sentry            │ Free        │ 22%    │ OK           │
│ CF Workers        │ Free        │ 8%     │ OK           │
│ Stripe            │ Estándar    │ $2K/m  │ OK           │
│ GitHub Actions    │ Free        │ 1200m  │ OK           │
└─────────────────────────────────────────────────────────┘
```

Cada fila con botón "Ver detalle" que muestra historial de uso, proyección a 3 meses, y enlace directo al dashboard del servicio para hacer el upgrade.

### Métricas de coste real por vertical

Añadir tag `vertical` en todos los logs y métricas de infraestructura desde el día 1:

```
Cron infra-metrics.post.ts:
  → Para cada métrica, desglosar por vertical:
    "Tracciona consume 70% del storage de Supabase"
    "Horecaria consume 60% de las transformaciones de Cloudinary"

Tabla infra_metrics: añadir columna vertical (nullable)
  → Métricas globales: vertical = NULL
  → Métricas por vertical: vertical = 'tracciona' / 'horecaria' / etc.
```

Esto permite tomar decisiones de escalado con datos reales en vez de estimaciones teóricas de peso.

---

## 14. IBERHAUL — TRANSPORTE POR GÓNDOLA

### Qué es una góndola

Una góndola es una plataforma de transporte especializada (camión + remolque bajo) diseñada para mover vehículos pesados que no pueden circular por sí mismos: cisternas, semirremolques, maquinaria, rígidos. Es el equivalente a una grúa portacoches pero para vehículos industriales. Sin góndola, un comprador de Sevilla que compra una cisterna en León no tiene forma práctica de llevársela.

### Modelo operativo actual (subcontratación)

```
Comprador ve ficha en tracciona.com → Componente <TransportCalculator>:
  1. Detecta ubicación del vehículo (vehicle.location)
  2. Pide código postal del comprador (o auto-detect con useUserLocation)
  3. Calcula zona destino → muestra precio cerrado

Zonas y precios (tabla transport_zones, configurables por admin):
  • Local (misma provincia): 300-500€
  • Norte (Galicia, Asturias, Cantabria, País Vasco): 600-900€
  • Centro (Madrid, CyL, Castilla-La Mancha): 500-800€
  • Sur (Andalucía, Extremadura, Murcia): 700-1.100€
  • Portugal: 800-1.200€
  • Francia sur: 1.000-1.500€

Flujo operativo:
  1. Comprador pulsa "Solicitar transporte" → INSERT en transport_requests
  2. Admin recibe notificación → contacta transportista subcontratado
  3. Transportista confirma fecha y precio real
  4. Admin confirma al comprador → status 'confirmed'
  5. Transportista ejecuta → status 'completed'
  6. Factura: Tracciona cobra al comprador el precio cerrado,
     paga al transportista el precio real, margen 10-15% (200-400€)
```

**El margen:** Si el precio cerrado es 900€ y el transportista cobra 650€, Tracciona se queda 250€. Con 0 inversión en flota.

### Evolución: IberHaul SL (góndola propia)

```
Fase 1 (ahora): Subcontratación pura
  - 0€ inversión, margen 10-15%
  - Red de 3-5 transportistas de confianza
  - Funciona desde el día 1

Fase 2 (cuando haya 10+ transportes/mes): Compra de góndola
  - Inversión: 30.000-50.000€ (góndola usada)
  - Conductor: subcontratado por viaje o autónomo asociado
  - Margen sube a 40-60% (el transportista eres tú)
  - IberHaul se convierte en SL real

Fase 3 (cuando haya 30+ transportes/mes): Flota
  - 2-3 góndolas, conductores fijos o autónomos
  - IberHaul como marca independiente
  - Puede ofrecer transporte a clientes fuera de Tracciona
```

**Por qué es la fuente más segura:** Un comprador de vehículo industrial de 40K€ que está a 500km NO va a buscar transportista por su cuenta. La góndola es infraestructura que necesita sí o sí. Por eso tiene 95% de probabilidad de demanda.

---

## 15. COMERCIALIZACIÓN DE DATOS — ESTILO IDEALISTA

> "La fuente de ingresos de mayor margen a largo plazo." Activar a partir del mes 12.

### Infraestructura de datos (Fase A, mes 6-12)

3 vistas materializadas en PostgreSQL, refresh diario a las 03:00:

**`market_data`** — Datos agregados del marketplace:

- Por: vertical, categoría, subcategoría, marca, provincia, país, mes
- Métricas: nº listings, precio medio/mediano/min/max, días promedio hasta venta, nº vendidos
- Cláusula `HAVING COUNT(*) >= 5` → mínimo 5 vehículos por grupo (anonimización RGPD)

**`demand_data`** — Qué busca la gente:

- Agregación de `search_alerts` activas por categoría/marca/provincia/mes
- Revela demanda no satisfecha ("hay 15 alertas de cisternas en Andalucía pero solo 3 publicadas")

**`price_history`** — Tendencias de precios:

- Precio medio semanal por categoría/subcategoría/marca
- Permite gráficos de evolución de precios a 12 meses

**Tracking de eventos** (tabla `analytics_events`):

- `vehicle_view`, `search_performed`, `lead_sent`, `favorite_added`, `price_change`, `vehicle_sold`
- Cron semanal agrega y actualiza vistas materializadas

### Datos para uso interno gratis (Fase B, mes 6-12)

**Valoración automática en ficha del dealer:**

```
Dealer publica cisterna a 45.000€
→ Sistema consulta market_data (misma categoría, marca, año similar, provincia)
→ Precio medio del mercado: 38.000€
→ Badge en dashboard: "🟡 Por encima del mercado (+18%)"
→ Sugerir: "Rango recomendado: 35.000€ - 40.000€"
```

**Índice de precios público (SEO + autoridad):**

- Página `/precios` pública e indexable
- Grid: "Cisternas alimentarias: precio medio 35.000€ (↑12% vs trimestre anterior)"
- Gráficos de tendencia 12 meses
- Schema JSON-LD Dataset para Google
- Esto es exactamente lo que hace Idealista → genera backlinks, autoridad, y posiciona a Tracciona como referencia

**Informe de mercado trimestral (PDF):**

- Generado automáticamente desde market_data
- Portada Tracciona + resumen + gráficos + tendencias
- Primeros 2-3 informes: GRATIS a financieras, asociaciones, fabricantes (gancho)
- Versión resumida en /guia/ como artículo evergreen (SEO)

### Productos de datos de pago (Fase C, mes 12-18)

> ⚠️ **DECISIÓN:** Posponer productos de datos de pago hasta tener volumen estadístico relevante (cientos de transacciones). Con 15 vehículos y pocas ventas/mes, el sample size es insuficiente. El índice de precios público gratuito (Fase B) SÍ tiene sentido desde el día 1 como generador de autoridad SEO. Los productos de pago se activan cuando los datos sean fiables.

| Producto                      | Precio               | Activar cuando...             |
| ----------------------------- | -------------------- | ----------------------------- |
| Informe valoración individual | 50-100€ (one-time)   | ≥500 transacciones históricas |
| Suscripción datos sectoriales | 500-1.000€/trimestre | ≥1.000 vehículos en catálogo  |
| API de valoración             | 1-5€/consulta        | Sample size >50 por categoría |
| Dataset anualizado            | 2.000-5.000€         | ≥12 meses de datos acumulados |

**API de valoración:**

```
GET /api/v1/valuation?brand=indox&model=alimentaria&year=2019&km=120000
→ { estimated_price: {min:32000, median:35000, max:38000},
    market_trend: "rising", trend_pct: 4.2,
    avg_days_to_sell: 45, sample_size: 23, confidence: "high" }
```

Autenticada por API key, rate limiting por plan, documentación Swagger.

### Multi-vertical (Fase D, mes 18+)

Cada vertical genera sus propias vistas materializadas con el mismo código:

- "Índice de precios de equipamiento hostelero" (Horecaria)
- "Índice de precios de maquinaria agrícola" (CampoIndustrial)
- Cross-vertical insights: correlaciones entre mercados

### Compliance de datos

- Anonimización: HAVING >= 5 (nunca menos de 5 vehículos por grupo)
- RGPD Art. 6.1.f: interés legítimo para datos anonimizados
- ToS dealer: acepta al registrarse que precios se usen de forma anonimizada
- Política de privacidad: sección explícita sobre comercialización de datos agregados

---

## 16. FRESCURA DEL CATÁLOGO Y FLUJO POST-VENTA

### Frescura: evitar catálogo de fantasmas

```
Cron cada 30 días → para cada vehículo publicado sin editar:
  1. WhatsApp + email al dealer: "¿Tu [cisterna Indox 2019] sigue disponible?"
  2. Si responde SÍ → updated_at = NOW() (renueva frescura SEO)
  3. Si responde NO → status = 'sold' → trigger flujo post-venta
  4. Sin respuesta 7 días → segundo aviso
  5. Sin respuesta 14 días → status = 'paused'

Auto-despublicación: vehículos >90 días sin actualizar:
  → status = 'expired'
  → Email: "Lo hemos pausado. [Renovar] [Marcar vendido] [Pasar a subasta]"
```

**Por qué importa:** Un catálogo con vehículos ya vendidos destruye confianza y penaliza SEO (señales de contenido stale). Mascus está lleno de anuncios de hace años.

### Flujo post-venta: cross-sell en el momento perfecto

```
Dealer pulsa "Marcar como vendido" en /dashboard/vehiculos:
  1. Pantalla de felicitación: "🎉 ¡Enhorabuena!"
  2. Pregunta: "¿Se vendió a través de Tracciona?" (para métricas)
  3. Cross-sell de servicios con un solo clic:
     🚛 Transporte — precio cerrado según zona (IberHaul)
     📄 Gestión transferencia — 250€ (Gesturban/gestoría)
     🛡 Seguro — presupuesto en 24h (partner asegurador)
     📋 Contrato de compraventa — GRATIS (herramienta sesión 31)
  4. Sugerencia: "¿Tienes otro vehículo para publicar?"
  5. Email al comprador (si hay lead vinculado) con servicios post-venta
  6. Enlace compartible /servicios-postventa?v=[slug] para que el dealer
     envíe por WhatsApp al comprador
```

**El momento post-venta es oro:** El comprador acaba de gastar 40K€ y necesita mover el vehículo, transferirlo y asegurarlo. Están dispuestos a pagar 900€ más por quitarse problemas. Es cuando los servicios integrados generan el grueso de los ingresos.

---

## 17. SISTEMA PRO 24h — MECANISMO DE MONETIZACIÓN

### Cómo funciona

```
Dealer publica vehículo gratis:
  → BD: visible_from = NOW() + INTERVAL '24 hours'
  → El vehículo existe pero NO aparece en el catálogo público durante 24h

Query pública (catálogo):
  WHERE status = 'published' AND visible_from <= NOW()
  → Usuarios gratis ven solo vehículos con >24h de antigüedad

Query Pro:
  WHERE status = 'published'
  → Usuarios Pro ven TODO, incluido lo recién publicado
```

### Elementos de monetización

**Banner FOMO en catálogo:**

> "5 vehículos nuevos publicados hoy — los suscriptores Pro ya los están viendo"

Solo aparece cuando hay vehículos ocultos por la ventana de 24h. Genera urgencia.

**Pase 72h por 9,99€:**

- Compra por impulso para compradores que no quieren suscripción
- Stripe one-time → crear suscripción temporal (expires_at = NOW() + 72h)
- El composable `useSubscription.isPro` devuelve true durante 72h

**Suscripción Pro comprador:**

- Mensual o anual
- Incluye: ver todo sin delay + alertas instantáneas + comparación de precios
- Diferente de la suscripción dealer (que es para publicar y herramientas)

---

## 18. SCRAPING DE CAPTACIÓN DE DEALERS

### ⚠️ DECISIÓN: Script manual, NO cron automatizado

**Ejecución manual desde terminal, nunca automatizada:**

```bash
# Tú decides cuándo prospectar. Sin cron, sin rastro en servidor de producción.
cd scripts/
node scrape-competitors.ts --source=mascus --min-ads=5
node scrape-competitors.ts --source=europa-camiones --min-ads=3
```

**Razón legal:** Los ToS de Mascus y Europa-Camiones prohíben scraping automatizado. Un bot con cron semanal dejando rastro en logs de producción es difícil de defender. La ejecución manual bajo supervisión directa es prospección comercial legítima. Mismo resultado, sin riesgo.

```
El script hace exactamente lo mismo:

1. Scraping de portales:
   - Mascus.es: vendedores con >5 anuncios de vehículo industrial
   - Europa-Camiones.com: idem
   - Milanuncios (cat. vehículos industriales): vendedores profesionales
   - Autoline.es: idem

2. Para cada vendedor profesional detectado:
   - Extraer: nombre empresa, teléfono, email, ubicación, nº anuncios, tipos
   - INSERT en dealer_leads (deduplicado por nombre + fuente)

3. Pipeline en admin /admin/captacion:
   Estado: new → contacted → interested → onboarding → active → rejected
   - Asignar a persona
   - Registrar notas de llamada
   - Ver historial de contacto

IMPORTANTE: El contacto es SIEMPRE manual y humano.
Tú llamas o envías email personalmente. Nunca email masivo automatizado.
```

**Por qué importa:** Es el motor de captación activa. En vez de esperar que los dealers te encuentren, tú los encuentras y les ofreces publicar gratis (Founding) o en plan Free.

---

## 19. COMPLIANCE REGULATORIO DETALLADO

### DSA (Digital Services Act — UE)

```
Obligatorio para cualquier marketplace que opere en la UE:

1. Formulario "Reportar anuncio" (botón 🚩 en cada ficha)
   → Tabla reports (reporter, entity, reason, status, admin_notes)
   → Admin gestiona: pendientes → revisados → acción tomada

2. Punto de contacto único visible en footer y /legal

3. Verificación de identidad dealer al registrarse:
   NIF/CIF obligatorio, nombre legal, dirección

4. Datos vendedor visibles en cada ficha:
   nombre empresa, ubicación, CIF

5. Página /transparencia con informe anual (PDF desde admin)
```

### AI Act (UE, en vigor progresivo 2025-2027)

```
- Badge "Traducido automáticamente" donde source = 'auto_*'
- Badge "Descripción asistida por IA" si generada con Claude
- Campo ai_generated BOOLEAN en vehicles y articles
- Informar en ToS y política de privacidad sobre uso de IA
```

### DAC7 (Intercambio fiscal — UE)

```
Obligatorio para marketplaces:
- Recopilar datos fiscales de dealers: NIF, país, dirección fiscal
- Tabla dealer_fiscal_data
- Cron anual (enero): generar informe DAC7 para dealers que superen:
  >30 operaciones O >2.000€ en el año
- Exportar en formato AEAT
```

### UK Online Safety Act 2023

```
Si hay tráfico/dealers UK:
- Risk assessment de contenido ilegal (fraude, vehículos robados)
- Mecanismo de denuncia (el botón 🚩 del DSA sirve)
- Términos claros en inglés (no basta traducir los españoles)
- Registrarse en ICO (£40/año)
- Política privacidad específica UK
```

---

## 20. CLONAR UN VERTICAL — FLUJO PASO A PASO

### Opción A: mismo deploy, variable de entorno (recomendado para empezar)

```
1. BD: INSERT en vertical_config nueva fila para el vertical
   → nombre, slug, dominio, tema, logo, idiomas activos

2. Admin /admin/config/*: configurar desde el panel
   → Categorías y subcategorías del nuevo sector
   → Atributos/filtros específicos (ej: "potencia" para agrícola, "capacidad" para hostelería)
   → Precios de suscripción
   → Templates de email adaptados

3. Contenido:
   → Generar locales/{idioma}.json con términos del sector
     (no "vehículo" sino "equipo", no "cisterna" sino "horno")
   → Generar categorías y subcategorías en BD
   → Generar 5-10 artículos editoriales iniciales del sector
   → Configurar target_markets según mercados del vertical

4. Deploy: crear nuevo deploy en Cloudflare Pages
   → Variable de entorno: VERTICAL=horecaria
   → Mismo repo, mismo código
   → Apuntar dominio horecaria.com al deploy

5. Verificar:
   → El mismo código filtra todo por vertical_config
   → Categorías, filtros, precios, emails, tema → todo desde BD
   → Cero cambios de código
```

### Opción B: repositorio clonado (cuando los verticales divergen)

```
Solo si un vertical necesita funcionalidad radicalmente diferente
(ej: sistema de lotes para ReSolar, fichas con datos biomédicos para Clinistock)

1. Clonar repo
2. Cambiar constante VERTICAL en useVerticalConfig.ts
3. Personalizar desde admin (todo en BD)
4. Deploy independiente
```

### Tiempo estimado para lanzar nuevo vertical

| Tarea                           | Tiempo     | Quién       |
| ------------------------------- | ---------- | ----------- |
| Configurar vertical_config      | 1h         | Admin       |
| Categorías y atributos          | 2-3h       | Claude Code |
| Generar locales adaptados       | 1h         | Claude Max  |
| Artículos editoriales iniciales | 2-3h       | Claude Max  |
| Deploy Cloudflare + DNS         | 30min      | Dev         |
| Verificar flujos críticos       | 1-2h       | Manual      |
| **TOTAL**                       | **~8-12h** | —           |

### Test de extensibilidad

Cada vez que se lanza un vertical (o anualmente): verificar que añadir una categoría, idioma o mercado es "solo datos" (BD/config) y no requiere cambios de código. Si se detectan acoplamientos, crear issue para corregir.

---

## 21. RESILIENCIA Y PLAN B TÉCNICO

### Plan de migración por servicio

| Servicio         | Si cae...          | Alternativa                      | Tiempo migración     |
| ---------------- | ------------------ | -------------------------------- | -------------------- |
| Supabase         | BD inaccesible     | PostgreSQL en Railway/Neon/VPS   | 4-8h                 |
| Cloudflare Pages | Deploy caído       | Vercel o Netlify                 | 2-4h                 |
| Cloudinary       | Imágenes no cargan | Cloudflare Images (ya preparado) | 1-2h                 |
| Resend           | Emails no salen    | SendGrid o Amazon SES            | 1-2h                 |
| Stripe           | Pagos fallan       | No hay alternativa real          | Esperar restauración |
| GitHub           | Repo inaccesible   | Mirror local + Backblaze         | 0h (mirror existe)   |

### Script de backup semanal

```
Cron semanal (domingo 03:00):
  1. pg_dump completa de la BD (via Supabase CLI)
  2. Cifrar con GPG
  3. Subir a Backblaze B2 (o S3)
  4. Retención: 4 backups semanales + 3 mensuales
  5. Verificar integridad (checksum)

Test de restauración (1x/año mínimo):
  1. Descargar último backup
  2. Restaurar en nueva instancia PostgreSQL
  3. Verificar datos (conteo de tablas, queries de prueba)
  4. Documentar resultado
```

### RTO y RPO

- **RTO (Recovery Time Objective):** 24h para desastre total. 4h para un servicio individual.
- **RPO (Recovery Point Objective):** 1h (Supabase Point-in-Time Recovery). 7 días para backup completo externo.

### Dependencias de terceros

Todo el proyecto depende de 8 servicios externos. GitHub es la fuente de verdad del código. Push diario obligatorio (no depender de OneDrive).

---

## 22. AUTO-PUBLICACIÓN EN REDES SOCIALES

### Flujo automático al publicar vehículo

```
Dealer publica vehículo (status = 'published'):
  → Trigger post-INSERT:
    1. Claude Haiku genera texto adaptado a CADA plataforma:
       - LinkedIn: tono profesional, datos técnicos, hashtags sector
       - Facebook: tono cercano, emoji, llamada a acción
       - Instagram: texto corto, hashtags masivos, enfoque visual
    2. Selecciona la mejor foto del vehículo (la de mayor resolución o la primera)
    3. INSERT en social_posts para cada plataforma:
       (vehicle_id, platform, content, image_url, status='pending')

Admin en /admin/social:
  → Cola de posts pendientes con preview
  → Botones: Aprobar / Editar / Rechazar
  → Al aprobar → publicar vía API de cada plataforma
```

### APIs por plataforma

| Plataforma | API                                          | Auth                     |
| ---------- | -------------------------------------------- | ------------------------ |
| LinkedIn   | POST api.linkedin.com/v2/ugcPosts            | OAuth2 de empresa        |
| Facebook   | POST graph.facebook.com/v18.0/{page_id}/feed | Page token               |
| Instagram  | Vía Facebook Graph API                       | Requiere cuenta business |

### Arquitectura: patrón adapter

```
Composable useSocialPublisher.ts:
  → publish(platform, content, imageUrl)
  → Cada plataforma tiene un adapter independiente
  → Añadir nueva plataforma = crear nuevo adapter sin tocar el resto

Configuración:
  → OAuth tokens en vertical_config.social_tokens (JSONB)
  → Cada vertical puede tener sus propias cuentas de RRSS
```

**Valor:** Cada vehículo publicado genera contenido automático en 3 redes. Con 10 vehículos/día = 30 posts/día = presencia constante sin esfuerzo. El admin solo aprueba (o configura auto-aprobación cuando confíe en la calidad).

---

## 23. SERVICIOS DE PARTNERS Y MODELO DE DERIVACIÓN

### Cómo funciona la derivación

```
Comprador solicita servicio (desde ficha, post-venta, o email):
  → INSERT en service_requests:
    (type, vehicle_id, user_id, status='requested', partner_notified_at=NULL)

Tipos de servicio:
  'transfer'   → Gestoría de transferencia
  'insurance'  → Seguro del vehículo
  'inspection' → Inspección pre-compra
  'transport'  → Transporte (IberHaul, sección 14)

Flujo:
  1. Solicitud creada → email automático al partner correspondiente
  2. Partner contacta al comprador directamente
  3. Admin trackea en /admin/servicios: status requested → in_progress → completed
  4. Facturación: partner paga comisión a Tracciona (mensual o por operación)
```

### Modelo de comisiones por derivación

| Servicio      | Partner                    | Precio al cliente | Comisión Tracciona      | Ingreso Tracciona |
| ------------- | -------------------------- | ----------------- | ----------------------- | ----------------- |
| Transferencia | Gesturban / gestoría local | 250€              | Fijo 50-80€             | 50-80€/operación  |
| Seguro        | Correduría de seguros      | Variable          | 15-25% de prima         | 100-300€/póliza   |
| Inspección    | Perito independiente       | 300-500€          | 10-15%                  | 30-75€/inspección |
| Transporte    | IberHaul / transportistas  | Según zona        | 10-15% (→40-60% propia) | 200-400€/viaje    |

### Escalabilidad

```
Fase 1: 1 partner por servicio (manual, email)
Fase 2: Red de partners por zona (admin asigna según ubicación)
Fase 3: Panel de partner (login propio, ve sus solicitudes, sube facturas)
Fase 4: Marketplace de servicios (partners compiten por el servicio)
```

**Clave:** Tracciona no ejecuta los servicios, solo conecta. Modelo asset-light. El valor está en tener al comprador en el momento exacto que necesita el servicio (acaba de comprar un camión de 40K€ a 500km de su casa).

---

## 24. ZONA DE USUARIO COMPRADOR

### Diferencia comprador vs dealer

```
Registro → "¿Eres comprador o profesional?"

Comprador (user_type = 'buyer'):
  → Acceso a /perfil/*
  → Puede: buscar, guardar favoritos, crear alertas, contactar dealers
  → Suscripción Pro: ver vehículos sin delay 24h + alertas instantáneas

Dealer (user_type = 'dealer'):
  → Acceso a /dashboard/*
  → Puede: publicar, gestionar leads, herramientas, CRM
  → Suscripción: Free / Basic / Premium / Founding
```

### Páginas del comprador (/perfil/\*)

```
/perfil/index.vue — Dashboard:
  • Resumen: X favoritos, X alertas activas, X contactos enviados
  • Últimos vehículos vistos (historial de user_vehicle_views)
  • Vehículos recomendados (basados en búsquedas y favoritos)

/perfil/datos.vue — Datos personales:
  • Nombre, email, teléfono, idioma preferido, avatar

/perfil/favoritos.vue — Vehículos guardados:
  • Grid con botón ❤️ toggle
  • Notificaciones: baja de precio, vehículo vendido
  • Contador visible para el dealer: "Tu cisterna tiene 12 interesados"

/perfil/alertas.vue — Búsquedas guardadas:
  • Alertas creadas desde el catálogo ("Guardar esta búsqueda")
  • Editar filtros de cada alerta
  • Cambiar frecuencia: inmediata / diaria / semanal
  • Activar/desactivar

/perfil/contactos.vue — Historial de leads:
  • Leads enviados a dealers con estado: enviado → leído → respondido

/perfil/notificaciones.vue — Preferencias de email:
  • Toggle por tipo de email (alertas, favoritos, newsletter...)
  • Desuscribir de todo excepto transaccionales

/perfil/suscripcion.vue — Plan Pro:
  • Plan actual (Free / Pro mensual / Pro anual)
  • Historial de pagos
  • Cambiar plan

/perfil/seguridad.vue — Seguridad:
  • Cambiar contraseña
  • Activar 2FA
  • Sesiones activas
  • Eliminar cuenta (con confirmación + periodo de gracia)
```

### Suscripción Pro comprador vs suscripción dealer

| Aspecto    | Pro Comprador                                                  | Suscripción Dealer                          |
| ---------- | -------------------------------------------------------------- | ------------------------------------------- |
| Para qué   | Ver vehículos sin delay 24h                                    | Publicar vehículos + herramientas           |
| Precio     | ~9,99€/mes o pase 72h 9,99€                                    | 29€/mes (Basic) - 79€/mes (Premium)         |
| Incluye    | Catálogo completo + alertas instantáneas + comparación precios | Publicación + CRM + herramientas según plan |
| Tabla BD   | subscriptions (type='buyer_pro')                               | subscriptions (type='dealer\_\*')           |
| Composable | useSubscription.isPro                                          | useSubscription.dealerPlan                  |

**Pase 72h:** Compra por impulso. Stripe one-time → crea suscripción temporal con `expires_at = NOW() + 72h`. El composable `useSubscription.isPro` devuelve true mientras no haya expirado.

---

## 25. PWA, PERFORMANCE Y CORE WEB VITALS

### PWA (Progressive Web App)

```
Configuración: @vite-pwa/nuxt

1. Service Worker: cache offline de páginas visitadas
   → Si el dealer abre catálogo con wifi y luego pierde conexión,
     las fichas que ya visitó siguen visibles

2. Manifest.json dinámico (desde vertical_config):
   → name, short_name, theme_color, background_color, icons
   → Cada vertical tiene su propio manifest

3. Push notifications (opcional):
   → VAPID keys en .env
   → Notificar al dealer: nuevo lead, vehículo vendido
   → Notificar al comprador: baja de precio, match de alerta

4. Instalable:
   → Banner "Añadir a pantalla de inicio" en móvil
   → Abre como app nativa (sin barra del navegador)
```

### Core Web Vitals

```
Objetivos:
  LCP (Largest Contentful Paint): <2.5s
  FID (First Input Delay): <100ms
  CLS (Cumulative Layout Shift): <0.1

Optimizaciones implementadas:
  • Lazy loading imágenes con Cloudinary (sizes + formato WebP automático)
  • Preload de fuentes críticas
  • ISR para páginas de catálogo (Incremental Static Regeneration)
  • Code-splitting: chunks <500KB (sesión 39)
    → manualChunks: vendor-charts, vendor-excel, vendor-stripe, vendor-sanitize
    → Librerías pesadas (Chart.js, ExcelJS) solo cargan en /admin y /dashboard
  • Componentes pesados con defineAsyncComponent
  • Rutas admin lazy-loaded: defineNuxtRouteMiddleware
```

### Accesibilidad (a11y)

```
Auditoría Lighthouse sobre 5 rutas críticas:
  /, /vehiculo/[slug], /subastas, /auth/login, /dashboard

Correcciones:
  • Todas las imágenes con alt descriptivo (o alt="" + aria-hidden si decorativa)
  • Todos los inputs con <label> o aria-label
  • Contraste de colores: ratio 4.5:1 mínimo (AA)
  • :focus-visible con outline 2px solid primary
  • Formularios críticos: validación accesible, errores vinculados con aria-describedby
  • Skip-to-content link oculto (visible con Tab)
```

---

## 26. DASHBOARD DE MÉTRICAS DE NEGOCIO

### Diferencia con monitorización de infraestructura (§13)

```
§13 = Métricas de INFRA: BD, Workers, imágenes, emails, alertas técnicas
§26 = Métricas de NEGOCIO: dinero, dealers, conversión, crecimiento
```

### Página /admin/dashboard

```
4 cards resumen (widget superior):
  • Ingresos este mes (MRR)
  • Vehículos activos
  • Dealers activos
  • Leads este mes
  Cada card con comparativa vs mes anterior (↑↓ con %)

Gráficos (Recharts o Chart.js):
  • MRR y ARR (de subscriptions + invoices)
  • Vehículos publicados/vendidos por mes
  • Leads generados por mes
  • Conversión: visitas → fichas vistas → leads → ventas
  • Churn rate de dealers (cancelaciones/total)
  • Desglose por vertical (cuando haya >1)

Tablas:
  • Top 10 dealers por actividad
  • Top 10 vehículos por visitas

Exportar: CSV/Excel (para asesoría e inversores)
```

### Métricas de monetización por canal (sesión 40)

```
Composable useRevenueMetrics():
  • Suscripciones (MRR dealers)
  • Comisión subastas
  • Publicidad
  • Verificaciones DGT
  • Transporte
  • API valoración
  • Merchandising

Cada canal: MRR actual + evolución mensual + % del total
```

### Cuantificación de lead gen

```
Composable useLeadTracking():
  • trackContactClick(vehicleId, dealerId, method: phone|whatsapp|form)
  • trackFichaView(vehicleId, dealerId)
  • trackFavorite(vehicleId)

Métricas para dealer: "Tracciona te generó 47 contactos este mes, valor: 705€"
Métricas para admin: leads totales, valor por lead (configurable), valor total generado
```

---

## 27. MONETIZACIÓN AVANZADA: TRIALS Y DUNNING

### Trial period

```
Nuevo dealer sin suscripción previa:
  → Checkout Stripe con subscription_data.trial_period_days: 14
  → 14 días de acceso Premium completo gratis
  → UI: "14 días gratis" solo si no ha tenido trial
  → Día 12: email recordatorio "Tu prueba termina en 2 días"
  → Día 14: cobra o baja a Free
```

### Dunning (reintentos de pago fallido)

```
Stripe reintenta automáticamente hasta 4 veces en 3 semanas.
Tracciona reacciona a los eventos:

invoice.payment_failed:
  Intento 1 → email amable "Tu pago no se ha procesado"
  Intento 3 → email urgente + banner en dashboard del dealer
             → dealers.payment_warning = true

customer.subscription.deleted:
  → Downgrade a Free (mantener datos, quitar acceso Premium)
  → Vehículos que excedan límite Free → status = 'paused'
  → Email "Tu suscripción se ha cancelado"
  → payment_warning = false
```

---

## 28. ARQUITECTURA: CAPA DE SERVICIOS Y EXTENSIBILIDAD

### Capa de servicios (server/services/)

```
Regla: endpoint >200 líneas → extraer lógica a server/services/

server/services/
  marketReport.ts    ← Lógica de market-report.get.ts
  billing.ts         ← Lógica compartida checkout/webhook/invoicing
  vehicles.ts        ← Queries comunes de vehículos

Patrón: endpoint solo valida + llama servicio + devuelve.
Servicio contiene toda la lógica de negocio.
```

### Script de extensibilidad

```
scripts/verify-extensibility.sh:
  1. ¿Categorías hardcodeadas en código? → No debería haber
  2. ¿Idiomas hardcodeados fuera de config? → No debería
  3. ¿Dominios hardcodeados? → No debería
  Si algo aparece → hay acoplamiento que corregir

Ejecutar anualmente o al lanzar cada vertical.
```

### Rate limiting documentado

```
Doble capa:
  1. Middleware Nitro (server/middleware/rate-limit.ts):
     /api/auth/*: 10 req/min
     /api/stripe/checkout: 5 req/min
     /api/email/send: 3 req/min
     /api/* general: 60 req/min

  2. Cloudflare WAF (Dashboard):
     Bot Fight Mode: activado
     Rate limiting rules como segunda línea
```

---

## 29. TESTING E2E: 8 USER JOURNEYS

```
Playwright ejecuta 8 flujos completos contra servidor de preview:

| # | Journey               | Flujo                                                    |
|---|-----------------------|----------------------------------------------------------|
| 1 | Comprador anónimo     | Home → catálogo → filtrar → ficha → galería              |
| 2 | Comprador registrado  | Registro → confirmar email → login → favorito → alerta  |
| 3 | Comprador contacta    | Login → ficha → WhatsApp/teléfono → formulario contacto  |
| 4 | Dealer publica        | Login → dashboard → nuevo vehículo → rellenar → publicar |
| 5 | Dealer gestiona       | Login → editar → pausar → marcar vendido                |
| 6 | Admin aprueba         | Login → productos → cambiar estado → verificar          |
| 7 | Subasta básica        | Login → subastas → inscribirse → pujar                  |
| 8 | SEO landing           | Visitar landing → verificar h1, meta, schema.org         |

CI: GitHub Actions ejecuta journeys en cada PR.
Artifact: playwright-report/ se sube si falla.
```

---

## 30. DECISIONES ESTRATÉGICAS (25 FEB 2026)

Resultado de auditoría externa + decisión del fundador. Aplicadas a lo largo de este documento con marcas ⚠️.

| #   | Decisión                                          | Detalle                                                 | Sección afectada |
| --- | ------------------------------------------------- | ------------------------------------------------------- | ---------------- |
| 1   | **Idiomas: ES+EN al lanzar**                      | Arquitectura lista para N idiomas, activar bajo demanda | §7               |
| 2   | **30 emails: se mantienen día 1**                 | Decisión del fundador                                   | §10              |
| 3   | **PWA + push: se mantiene**                       | Decisión del fundador                                   | §25              |
| 4   | **Wizard migración clusters: se mantiene**        | Decisión del fundador                                   | §2               |
| 5   | **Subastas Realtime: websockets, no polling**     | Decisión del fundador                                   | §6               |
| 6   | **Cloudinary transforma, CF Images almacena**     | Cloudinary NO retiene imágenes                          | §1               |
| 7   | **Merchandising: opción visual, no implementado** | Banner + formulario de interés, medir demanda           | §11              |
| 8   | **API valoración de pago: posponer**              | Índice público gratuito sí. Pago cuando haya volumen    | §15              |
| 9   | **Scraping: script manual, no cron**              | Ejecutar desde terminal, contacto siempre humano        | §18              |
| 10  | **Supabase: documentar dependencias reales**      | 2º cluster considerar Neon/Railway para diversificar    | §2               |
| 11  | **Cache imágenes: immutable 30 días**             | `Cache-Control: public, max-age=2592000, immutable`     | §1               |
| 12  | **Métricas coste por vertical**                   | Tag `vertical` en infra_metrics desde día 1             | §13              |

---

## 31. DOCUMENTOS GENERADOS HOY (25 FEB 2026)

Para que una IA nueva sepa qué se creó en esta sesión:

1. **PLAN-AUDITORIA-TRACCIONA.md** — 849 líneas, 12 dimensiones de auditoría, calendario maestro, evolución 20 años, plantilla de informe, criterios de puntuación.
2. **INSTRUCCIONES-MAESTRAS.md actualizado** — Sesión 38 ampliada con Parte F: auditoría documental de carpeta local `C:\Users\j_m_g\OneDrive\Documentos\Tracciona` (inventario, clasificación histórico/Tracciona, comparación cruzada, rescate de ideas).
3. **Este documento** — Flujos operativos de 29 sistemas + índice de documentos + 12 decisiones estratégicas.

---

_Última actualización: 25 febrero 2026_



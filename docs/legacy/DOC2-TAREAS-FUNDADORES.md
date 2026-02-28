> ⚠️ **[LEGACY]** Documento histórico — solo referencia. No modificar ni usar como fuente de verdad. Ver `docs/tracciona-docs/` para documentación activa.

# DOCUMENTO 2 — Tareas que debemos hacer nosotros (Claude Code no puede)

**Generado:** 25 febrero 2026
**Fuente:** Auditoría baseline + recomendaciones 100/100 + análisis de mejoras

---

## 🔴 URGENTE (esta semana)

### 1. Registrar marca "Tracciona" en OEPM

- **Qué:** Registro de marca nacional en la Oficina Española de Patentes y Marcas
- **Por qué:** Si un tercero la registra, la recuperación cuesta miles de euros. El dominio tracciona.com es público y cualquiera puede ver el proyecto
- **Clases:** 35 (publicidad y gestión de negocios comerciales) y/o 42 (diseño y desarrollo de software, plataformas tecnológicas)
- **Coste:** ~150€ por clase (electrónico). ~300€ si registras en 2 clases
- **Dónde:** https://sede.oepm.gob.es → Marcas → Solicitud de marca
- **Tiempo:** 15-30 minutos el trámite online. Concesión en 6-8 meses
- **Protección:** 10 años renovables desde la fecha de solicitud
- **Titular:** Tank Ibérica SL o TradeBase SL (decidir cuál será el titular del IP)

### 2. Comprar dominio defensivo tracciona.es

- **Qué:** Registrar tracciona.es para que nadie lo use
- **Coste:** ~8-12€/año
- **Dónde:** El mismo registrar que usáis para tracciona.com, o cualquier registrador español
- **Acción:** Redirigir a tracciona.com con 301

### 3. Configurar rate limiting en Cloudflare WAF

- **Qué:** El código tiene rate limiting deshabilitado en producción. Hay que configurarlo en el dashboard de Cloudflare
- **Por qué:** Sin esto, cualquiera puede hacer brute force a los endpoints de email, Stripe, login, etc.
- **Dónde:** Cloudflare Dashboard → Security → WAF → Rate limiting rules
- **Reglas a crear:**

| Ruta                  | Límite             | Método                | Acción         |
| --------------------- | ------------------ | --------------------- | -------------- |
| `/api/email/send`     | 10 req/min por IP  | POST                  | Block 429, 60s |
| `/api/lead*`          | 5 req/min por IP   | POST                  | Block 429, 60s |
| `/api/stripe*`        | 20 req/min por IP  | ALL                   | Block 429, 60s |
| `/api/account/delete` | 2 req/min por IP   | POST                  | Block 429, 60s |
| `/api/*` (write)      | 30 req/min por IP  | POST/PUT/PATCH/DELETE | Block 429, 60s |
| `/api/*` (read)       | 200 req/min por IP | GET                   | Block 429, 60s |

- **Tiempo:** 30-45 minutos
- **Coste:** Incluido en plan Cloudflare (free o pro)

### 4. Configurar UptimeRobot

- **Qué:** Monitorización externa que verifica que tracciona.com está up
- **Dónde:** https://uptimerobot.com (plan gratuito: 50 monitores, checks cada 5 min)
- **Monitores a crear:**
  - `https://tracciona.com` — HTTP(S), check cada 5 min
  - `https://tracciona.com/api/health` — HTTP(S), check cada 5 min
- **Alertas:** Email a ambos fundadores + (opcional) Telegram/Slack
- **Tiempo:** 10 minutos
- **Coste:** 0€

### 5. Borrar archivos legacy aprobados

Ejecutar en PowerShell (ya aprobado):

```powershell
cd "C:\Users\j_m_g\OneDrive\Documentos\Tracciona\docs\legacy"
Remove-Item admin-users.js, admin.css, admin.html, apps-script-completo.js, AppsScript.gs, auth-system.js, auth-user-panel.css, generate-png-icons.html, google-sheets-api.js, index.html, intermediacion_estructura.txt, main.css, main.js, sanitize.js, styles.css, tabla_config_inicial.txt, user-panel-functions.js, user-panel.js
```

---

## 🟡 ALTA PRIORIDAD (próximas 2 semanas)

### 6. Verificar que las páginas legales tienen contenido real

- **Qué:** Abrir `/legal/privacidad`, `/legal/condiciones`, `/legal/cookies` en el navegador y verificar que el contenido es real y no un placeholder
- **Cómo verificar:** Si ves un solo párrafo genérico, es un placeholder. Una política de privacidad GDPR real tiene mínimo 10-15 secciones
- **Si es placeholder, necesitas:**

**Política de privacidad (GDPR/LOPD):** Debe incluir:

1. Identidad del responsable: Tank Ibérica SL, CIF, dirección postal, email de contacto
2. Finalidades del tratamiento: gestión de cuentas, publicación de vehículos, procesamiento de pagos, envío de comunicaciones, análisis de uso
3. Base legal: consentimiento, ejecución de contrato, interés legítimo, obligación legal
4. Categorías de datos: identificativos, contacto, financieros, de uso
5. Destinatarios: Stripe (pagos), Supabase/AWS (alojamiento), Cloudflare (CDN), Anthropic (IA), Resend (email)
6. Transferencias internacionales: USA (Cloudflare, Stripe, Anthropic, Supabase) — mencionar SCCs o DPF
7. Plazos de conservación
8. Derechos del interesado: acceso, rectificación, supresión, oposición, portabilidad, limitación
9. Derecho a reclamar ante AEPD
10. Cookies (puede ser página separada)

**Recurso gratuito:** La AEPD tiene una herramienta gratuita para generar políticas: https://www.aepd.es/es/guias-y-herramientas/herramientas/facilita-emprende

- **Términos y condiciones:** Necesitan cubrir: objeto del servicio, condiciones de uso, precios y pagos, propiedad intelectual, limitación de responsabilidad, resolución de conflictos, ley aplicable
- **Coste:** 0€ si usáis plantillas AEPD. 200-500€ si lo encargáis a un abogado
- **Tiempo:** 2-4 horas con plantillas, 1-2 semanas con abogado

### 7. Crear RAT (Registro de Actividades de Tratamiento)

- **Qué:** Documento obligatorio por GDPR para cualquier empresa que trate datos personales
- **Por qué:** Si la AEPD audita (improbable ahora, pero posible si creces), su primera pregunta es "¿dónde está el RAT?"
- **Formato:** Spreadsheet o documento con:

| Actividad                | Finalidad                     | Base legal         | Categorías de datos             | Categorías de interesados | Destinatarios         | Transferencias int. | Plazo conservación         |
| ------------------------ | ----------------------------- | ------------------ | ------------------------------- | ------------------------- | --------------------- | ------------------- | -------------------------- |
| Registro de usuarios     | Gestión de cuentas            | Consentimiento     | Nombre, email, teléfono         | Usuarios registrados      | Supabase (hosting)    | USA (SCCs)          | Hasta baja + 30 días       |
| Publicación de vehículos | Prestación servicio           | Ejecución contrato | Datos vehículo, fotos, contacto | Dealers                   | Cloudinary, Anthropic | USA (SCCs)          | Mientras activo + 2 años   |
| Procesamiento de pagos   | Cobro de servicios            | Ejecución contrato | Datos fiscales, pago            | Clientes de pago          | Stripe, Quaderno      | USA/UE              | 5 años (obligación fiscal) |
| Análisis de IA           | Procesamiento fotos vehículos | Interés legítimo   | Imágenes, texto                 | Dealers                   | Anthropic             | USA (DPF)           | 30 días (procesamiento)    |
| Email transaccional      | Notificaciones servicio       | Ejecución contrato | Email, nombre                   | Usuarios registrados      | Resend                | USA                 | Mientras activo            |

- **Recurso:** https://www.aepd.es/es/documento/modelo-rat-responsable.rtf
- **Coste:** 0€
- **Tiempo:** 1-2 horas

### 8. Verificar banner de cookies

- **Qué:** Verificar que el CookieBanner realmente bloquea scripts de terceros (Google Analytics, Sentry, etc.) ANTES de que el usuario acepte
- **Cómo verificar:**
  1. Abrir tracciona.com en modo incógnito
  2. Abrir DevTools → Network
  3. ANTES de aceptar cookies, verificar que NO hay requests a googletagmanager.com, google-analytics.com, o sentry.io
  4. Aceptar cookies
  5. Verificar que ahora SÍ aparecen esos requests
- **Si no bloquea:** Es un banner decorativo que no cumple GDPR. La AEPD multa por esto
- **Solución si falla:** El composable `useConsent.ts` debería condicionar la carga de scripts de terceros al consentimiento

### 9. Documentar quién llama los 12 cron jobs

- **Qué:** Los 12 endpoints en `/api/cron/` existen pero no hay documentación de quién los ejecuta
- **Verificar:**
  - ¿Hay un servicio externo configurado? (cron-job.org, easycron.com, Cloudflare Workers Cron Triggers)
  - ¿Los GitHub Actions los llaman? (revisar los workflows — parece que no)
  - ¿Están configurados en algún panel que no sea el repo?
- **Si no están configurados:** Los crons no se ejecutan. Esto significa: alertas de búsqueda no se envían, vehículos no se marcan como inactivos, subastas no se cierran automáticamente, stats semanales no se generan
- **Solución más simple:** Crear un workflow GitHub Actions que los llame con schedule:

```yaml
# .github/workflows/cron-scheduler.yml
name: Cron Scheduler
on:
  schedule:
    - cron: '0 7 * * *' # Diario 07:00 UTC
jobs:
  run-crons:
    runs-on: ubuntu-latest
    steps:
      - run: |
          curl -X POST https://tracciona.com/api/cron/freshness-check -H "x-cron-secret: ${{ secrets.CRON_SECRET }}"
          curl -X POST https://tracciona.com/api/cron/search-alerts -H "x-cron-secret: ${{ secrets.CRON_SECRET }}"
          # ... etc
```

Esto lo puede crear Claude Code, pero primero necesitáis verificar si ya están configurados en algún sitio.

### 10. Probar restore de backup manualmente (una vez)

- **Qué:** Descargar el último backup diario de Backblaze B2, descifrarlo, y restaurarlo en una BD temporal
- **Por qué:** Un backup que nunca se ha restaurado es una esperanza, no un plan
- **Pasos:**
  1. Instalar b2 CLI: `pip install b2`
  2. Descargar: `b2 download-file tracciona-backups/daily/[ultimo-backup].sql.enc`
  3. Descifrar: `openssl enc -aes-256-cbc -d -pbkdf2 -iter 100000 -in backup.sql.enc -out backup.sql -pass pass:"$BACKUP_ENCRYPTION_KEY"`
  4. Crear BD temporal en Neon (free tier: https://neon.tech) o Railway
  5. Restaurar: `psql $TEMP_DB_URL < backup.sql`
  6. Verificar: `SELECT COUNT(*) FROM vehicles; SELECT COUNT(*) FROM dealers; SELECT COUNT(*) FROM users;`
  7. Documentar resultado
  8. Eliminar BD temporal
- **Tiempo:** 30-60 minutos la primera vez
- **Coste:** 0€ (Neon free tier)

---

## 🟢 PRIORIDAD MEDIA (próximo mes)

### 11. Correr Lighthouse manualmente y documentar

- **Qué:** Ejecutar Lighthouse en Chrome DevTools para las 5 rutas críticas
- **Rutas:** `/`, una ficha de vehículo, `/noticias`, `/subastas`, `/dashboard` (con auth)
- **Anotar:** Performance, Accessibility, Best Practices, SEO scores
- **Objetivo:** Todo >80. Si algo está bajo, priorizar fix
- **Tiempo:** 30 minutos

### 12. Verificar Google Analytics

- **Qué:** ¿Está configurado Google Analytics? El CSP permite googletagmanager.com y el nuxt.config tiene `googleAdsId`
- **Verificar:**
  - ¿Hay una propiedad GA4 configurada para tracciona.com?
  - ¿Se están recopilando datos de visitas?
  - ¿Se pueden ver: usuarios únicos, páginas vistas, tiempo en página, bounce rate?
- **Si no está configurado:** Configurar GA4 básico. Es la única forma de saber si alguien visita el sitio
- **Tiempo:** 15-30 minutos

### 13. Tank Ibérica como primer dealer (dogfooding)

- **Qué:** Si Tank Ibérica tiene stock de vehículos (aunque sean pocos), publicarlos en Tracciona
- **Por qué:** Resuelve el chicken-and-egg: el marketplace tiene contenido real desde el día 1
- **Beneficios:**
  - Prueba el flujo completo end-to-end (publicación, gestión, contacto)
  - Genera datos reales para market intelligence
  - Da credibilidad al marketplace ("X vehículos activos")
  - Identifica bugs y fricciones que no se ven en tests
- **Acción:** Registrar Tank Ibérica como dealer, subir su stock (idealmente vía flujo WhatsApp para probarlo)

### 14. Contactar 50 dealers de vehículos industriales

- **Qué:** El paso más importante de todos. Grabar un vídeo de 60 segundos mostrando el flujo WhatsApp y enviarlo a 50 dealers
- **Fuente de dealers:** Mascus España, TruckScout24 España, páginas amarillas, ferias del sector (FIAA, SIL)
- **Mensaje tipo:**

> Hola [nombre], soy [nombre] de Tracciona. Estamos creando una nueva plataforma para dealers de vehículos industriales. La idea es que puedas publicar tu stock enviando fotos por WhatsApp — la IA se encarga del resto.
>
> [vídeo de 60s]
>
> Estamos buscando dealers fundadores que nos ayuden a moldear el producto. ¿Te interesaría probarlo gratis?

- **Objetivo:** 5 respuestas positivas = validación. Si 0 respuestas = pivotar el approach
- **Tiempo:** 2-3 horas para enviar 50 mensajes
- **Coste:** 0€

### 15. Sprint planning mínimo

- **Qué:** Empezar con un proceso simple de planificación semanal
- **Formato:**
  - **Lunes:** 15 min entre los dos. Elegir las 3 tareas más importantes de la semana. Escribirlas en un post-it o spreadsheet compartido
  - **Viernes:** 10 min. ¿Se hicieron las 3? Si no, ¿por qué?
- **Métricas semanales** (spreadsheet compartido):
  1. Dealers contactados (acumulado)
  2. Dealers registrados (acumulado)
  3. Dealers pagando (acumulado)
  4. Vehículos activos en catálogo
  5. Visitas únicas semanales (GA4)
- **Regla:** Si los 5 números no suben en 2 semanas consecutivas, algo tiene que cambiar

---

## 🔵 BAJA PRIORIDAD (próximos 3 meses)

### 16. Contratos tipo para Founding Dealers

- **Qué:** Documento legal simple que establece los términos de la relación con los primeros dealers
- **Debe cubrir:** Período founding (precio especial), compromiso mínimo, stock mínimo, datos de vehículos, cancelación, exclusividad (o no)
- **Coste:** 200-500€ con un abogado mercantilista, o 0€ usando plantilla
- **Cuándo:** Antes de que el primer dealer pague

### 17. Asesor fiscal para fiscalidad dual UK/ES

- **Qué:** Si Tank Ibérica SL (España) y TradeBase SL (¿UK?) operan juntas, hay implicaciones de transfer pricing, IVA intra-UE/UK, y reporting fiscal
- **Cuándo:** Antes de que haya ingresos reales cruzados entre jurisdicciones
- **Coste:** 100-300€/mes por un asesor que entienda ambas jurisdicciones

### 18. Seguro de responsabilidad civil profesional

- **Qué:** Si Tracciona intermedia en transacciones (transporte, pagos, verificaciones), hay riesgo de responsabilidad si algo sale mal
- **Cuándo:** Cuando haya transacciones reales con dinero real
- **Coste:** 300-600€/año para una startup de servicios digitales
- **Dónde:** Hiscox, AXA, o broker de seguros especializado en tech

### 19. Verificar comportamiento PWA en dispositivo real

- **Qué:** Instalar tracciona.com como PWA en un móvil Android y un iPhone
- **Verificar:**
  - ¿Se puede instalar?
  - ¿El offline funciona (muestra /offline en vez de error de red)?
  - ¿Las notificaciones push funcionan?
  - ¿El cache de imágenes funciona (Cloudinary)?
- **Tiempo:** 20 minutos

### 20. Rollback de Cloudflare Pages verificado

- **Qué:** Verificar que se puede hacer rollback a un deploy anterior en Cloudflare Pages
- **Cómo:** Cloudflare Dashboard → Pages → tracciona → Deployments → seleccionar deploy anterior → "Rollback to this deploy"
- **Por qué:** Si un deploy rompe algo, hay que poder volver atrás en <5 minutos
- **Tiempo:** 5 minutos (solo verificar que la opción existe y funciona)

---

## 📞 ESTRATEGIA WHATSAPP MULTI-PAÍS (referencia para escalar)

> **Esto NO es una tarea inmediata.** Es documentación de referencia para cuando Tracciona se expanda a otros países. Un solo número +34 es suficiente para año 1 (y probablemente año 2).

### Situación actual

- Un número +34 (España) conectado a WhatsApp Business API vía Twilio/Meta
- Funciona internacionalmente — cualquier dealer del mundo puede escribir
- El bot detecta idioma del mensaje y responde en español o inglés

### Fases de escalado

| Fase       | Cuándo                                                 | Estrategia                                                                                                      | Coste extra  |
| ---------- | ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------- | ------------ |
| **Año 1**  | Ahora                                                  | Un +34, detección automática de idioma                                                                          | 0€           |
| **Año 2**  | Cuando haya dealers fuera de España                    | Smart routing con links/QR por país (`wa.me/34XXX?text=FR`) — el bot detecta prefijo y responde en idioma local | 0€           |
| **Año 3+** | Cuando un dealer diga "no confío en número extranjero" | Números locales virtuales vía Telnyx/Vonage (~1€/mes/país) vinculados a la misma cuenta WhatsApp Business API   | ~1€/mes/país |

### Opciones para números locales sin N SIMs físicas

1. **Números virtuales en Twilio** — Comprar número por país (~1-2€/mes) directamente en dashboard Twilio. Sin SIM, sin contrato operador.
2. **Meta Cloud API directo (sin Twilio)** — Eliminar el margen de Twilio. Meta cobra solo por conversación (~0,03-0,08€ según país). Números se compran a proveedor de números virtuales y se verifican en Meta Business.
3. **Proveedores bulk** — MessageBird, Vonage o Telnyx venden números de 50+ países a ~1€/mes/número. 10 países = ~10€/mes.
4. **Smart routing sin número local** — Un único +34 con links personalizados por país. El dealer ve un +34 pero la experiencia es en su idioma. Coste: 0€ extra. En B2B industrial esto funciona bien porque los dealers están acostumbrados a tratar con proveedores internacionales.

### Decisión a tomar cuando llegue el momento

- **Si el coste importa más que la percepción local:** Smart routing (opción 4), 0€
- **Si queréis presencia local real:** Telnyx/Vonage (opción 3), ~1€/mes/país
- **Si queréis eliminar intermediario:** Meta Cloud API directo (opción 2), ahorro ~20-30% en mensajes

### Nota

No necesitáis decidir esto ahora. El bot ya funciona internacionalmente con el +34. Esta sección existe para que cuando surja la pregunta "¿necesitamos un número portugués/francés/alemán?" tengáis la respuesta documentada sin tener que investigar de nuevo.

---

## CHECKLIST RESUMEN

| #   | Tarea                        | Urgencia | Tiempo        | Coste        | ¿Hecho? |
| --- | ---------------------------- | -------- | ------------- | ------------ | ------- |
| 1   | Registrar marca OEPM         | 🔴       | 30 min        | 150-300€     | ☐       |
| 2   | Dominio tracciona.es         | 🔴       | 5 min         | 10€/año      | ☐       |
| 3   | WAF Cloudflare rate limiting | 🔴       | 30-45 min     | 0€           | ☐       |
| 4   | UptimeRobot                  | 🔴       | 10 min        | 0€           | ☐       |
| 5   | Borrar legacy files          | 🔴       | 2 min         | 0€           | ☐       |
| 6   | Verificar páginas legales    | 🟡       | 30 min        | 0€           | ☐       |
| 7   | Crear RAT                    | 🟡       | 1-2h          | 0€           | ☐       |
| 8   | Verificar banner cookies     | 🟡       | 15 min        | 0€           | ☐       |
| 9   | Documentar cron scheduling   | 🟡       | 30 min        | 0€           | ☐       |
| 10  | Probar restore backup        | 🟡       | 30-60 min     | 0€           | ☐       |
| 11  | Lighthouse manual            | 🟢       | 30 min        | 0€           | ☐       |
| 12  | Verificar Google Analytics   | 🟢       | 15-30 min     | 0€           | ☐       |
| 13  | Tank Ibérica como dealer     | 🟢       | 2-3h          | 0€           | ☐       |
| 14  | Contactar 50 dealers         | 🟢       | 2-3h          | 0€           | ☐       |
| 15  | Sprint planning semanal      | 🟢       | 15 min/semana | 0€           | ☐       |
| 16  | Contratos tipo dealer        | 🔵       | Variable      | 0-500€       | ☐       |
| 17  | Asesor fiscal UK/ES          | 🔵       | Variable      | 100-300€/mes | ☐       |
| 18  | Seguro RC profesional        | 🔵       | Variable      | 300-600€/año | ☐       |
| 19  | PWA en dispositivo real      | 🔵       | 20 min        | 0€           | ☐       |
| 20  | Rollback CF Pages            | 🔵       | 5 min         | 0€           | ☐       |

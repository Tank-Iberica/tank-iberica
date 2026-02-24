# Inventario de Endpoints — Tracciona

> Generado automaticamente analizando el codigo fuente. Actualizar cuando se anadan nuevos endpoints.
> Ultima actualizacion: Sesion 36 (Feb 2026).

---

## Resumen

| Metrica            | Valor |
| ------------------ | ----- |
| Total endpoints    | 45    |
| Admin-only         | 12    |
| User (autenticado) | 11    |
| CRON_SECRET        | 9     |
| Public             | 7     |
| Internal secret    | 3     |
| Firma externa      | 3     |

---

## Tabla completa

| Ruta                                       | Metodo | Auth               | Proposito                                                 |
| ------------------------------------------ | ------ | ------------------ | --------------------------------------------------------- |
| **Raiz**                                   |        |                    |                                                           |
| /api/\_\_sitemap                           | GET    | Public             | Generacion dinamica de sitemap para SEO                   |
| /api/geo                                   | GET    | Public             | Obtener pais del usuario via header Cloudflare            |
| /api/health                                | GET    | Public             | Health check de conectividad BD                           |
| /api/merchant-feed                         | GET    | Public             | Feed RSS Google Merchant Center para shopping             |
| /api/market-report                         | GET    | Admin/Public       | Informe trimestral de mercado (?public=true para resumen) |
| /api/error-report                          | POST   | Public             | Ingestion de errores client-side con rate limiting        |
| /api/advertisements                        | POST   | User               | Crear nuevo anuncio publicitario                          |
| /api/auction-deposit                       | POST   | User               | Crear PaymentIntent Stripe para deposito de subasta       |
| /api/dgt-report                            | POST   | Admin              | Solicitar informe DGT/InfoCar de vehiculo                 |
| /api/generate-description                  | POST   | User               | Generar descripcion SEO con Claude AI                     |
| /api/stripe-connect-onboard                | POST   | User               | Iniciar onboarding Stripe Connect para dealer             |
| /api/verify-document                       | POST   | User               | Verificacion automatica de documentos con Claude Vision   |
| /api/v1/valuation                          | GET    | Public             | Valoracion de vehiculo con tendencia y confianza          |
| **Stripe**                                 |        |                    |                                                           |
| /api/stripe/checkout                       | POST   | User               | Crear sesion de checkout Stripe para suscripcion          |
| /api/stripe/portal                         | POST   | User               | Crear sesion de portal de facturacion Stripe              |
| /api/stripe/webhook                        | POST   | Stripe signature   | Receptor webhook Stripe para eventos de suscripcion       |
| **WhatsApp**                               |        |                    |                                                           |
| /api/whatsapp/webhook                      | GET    | Public             | Verificacion webhook WhatsApp (challenge Meta)            |
| /api/whatsapp/webhook                      | POST   | WhatsApp signature | Recibir mensajes entrantes Meta Cloud API                 |
| /api/whatsapp/process                      | POST   | Internal           | Procesar submission WhatsApp con Claude Vision            |
| **Infraestructura**                        |        |                    |                                                           |
| /api/infra/metrics                         | GET    | Admin              | Consultar snapshots de metricas por componente/periodo    |
| /api/infra/alerts                          | GET    | Admin              | Consultar alertas de infraestructura                      |
| /api/infra/alerts/[id]                     | PATCH  | Admin              | Acknowledge de alerta de infraestructura                  |
| /api/infra/clusters                        | GET    | Admin              | Listar todos los clusters con verticales                  |
| /api/infra/clusters                        | POST   | Admin              | Crear nuevo cluster de infraestructura                    |
| /api/infra/clusters/[id]                   | PATCH  | Admin              | Actualizar metadata de cluster                            |
| /api/infra/clusters/[id]/prepare-migration | POST   | Admin              | Generar plan de migracion de vertical                     |
| /api/infra/clusters/[id]/execute-migration | POST   | Admin              | Ejecutar migracion de vertical entre clusters             |
| /api/infra/migrate-images                  | POST   | Admin              | Migracion batch de imagenes Cloudinary a CF Images        |
| /api/infra/setup-cf-variants               | POST   | Admin              | Crear 4 variantes de imagen en Cloudflare                 |
| **Cron (tareas programadas)**              |        |                    |                                                           |
| /api/cron/auto-auction                     | POST   | CRON_SECRET        | Cerrar subastas expiradas y procesar resultados           |
| /api/cron/dealer-weekly-stats              | POST   | CRON_SECRET        | Enviar email semanal de estadisticas a dealers            |
| /api/cron/favorite-price-drop              | POST   | CRON_SECRET        | Notificar bajadas de precio en favoritos                  |
| /api/cron/favorite-sold                    | POST   | CRON_SECRET        | Notificar vehiculos favoritos vendidos                    |
| /api/cron/freshness-check                  | POST   | CRON_SECRET        | Verificar ventanas de visibilidad y publicar contenido    |
| /api/cron/infra-metrics                    | POST   | CRON_SECRET        | Recopilar metricas de infraestructura y generar alertas   |
| /api/cron/publish-scheduled                | POST   | CRON_SECRET        | Publicar articulos programados                            |
| /api/cron/search-alerts                    | POST   | CRON_SECRET        | Evaluar alertas de busqueda y enviar emails               |
| /api/cron/whatsapp-retry                   | POST   | CRON_SECRET        | Reintentar envios WhatsApp fallidos                       |
| **Email**                                  |        |                    |                                                           |
| /api/email/send                            | POST   | Internal           | Envio de emails con templates y Resend (30 templates)     |
| /api/email/unsubscribe                     | GET    | Public             | Baja de emails con verificacion de token                  |
| **Account (GDPR)**                         |        |                    |                                                           |
| /api/account/delete                        | POST   | User + CSRF        | Derecho de supresion — borrado de cuenta                  |
| /api/account/export                        | GET    | User               | Derecho de portabilidad — exportar datos como JSON        |
| **Invoicing**                              |        |                    |                                                           |
| /api/invoicing/create-invoice              | POST   | User               | Crear factura para suscripcion/servicios                  |
| /api/invoicing/export-csv                  | GET    | User/Admin         | Exportar facturas como CSV                                |
| **Push**                                   |        |                    |                                                           |
| /api/push/send                             | POST   | Internal/Admin     | Enviar notificaciones push a dispositivos suscritos       |
| **Social**                                 |        |                    |                                                           |
| /api/social/generate-posts                 | POST   | User               | Generar posts de redes sociales para un vehiculo          |
| **Images**                                 |        |                    |                                                           |
| /api/images/process                        | POST   | User               | Procesar imagenes Cloudinary a variantes CF Images        |

---

## Patrones de Auth

### 1. Public (sin auth)

Endpoints que no requieren autenticacion. Protegidos por rate limiting (Cloudflare WAF) y cache SWR.

### 2. User (autenticado)

Usan `serverSupabaseUser(event)` para obtener el usuario. Operan sobre `user.id` — nunca aceptan userId del body.

### 3. Admin

Usan `serverSupabaseUser(event)` + verificacion `role === 'admin'` en tabla users.

### 4. CRON_SECRET

Verifican header `x-cron-secret` contra variable de entorno CRON_SECRET. Solo para tareas programadas desde Cloudflare Workers.

### 5. Internal

Verifican header `x-internal-secret` contra CRON_SECRET. Para llamadas entre server routes (ej: email/send desde account/delete).

### 6. Firma externa

- **Stripe**: Verifica firma HMAC del webhook con stripe-webhook-secret
- **WhatsApp**: Verifica firma HMAC SHA256 de Meta con whatsapp-app-secret

---

## Checklist de seguridad

- [x] Todos los endpoints de escritura requieren auth
- [x] Todos los crons verifican CRON_SECRET
- [x] Webhooks verifican firmas criptograficas
- [x] Endpoints internos verifican x-internal-secret O admin auth
- [x] Endpoints GDPR (account/\*) verifican usuario autenticado
- [x] RLS habilitado en todas las tablas
- [x] Rate limiting configurado en Cloudflare WAF
- [x] Cache SWR en endpoints publicos pesados (market-report, merchant-feed, sitemap)

---

_Este documento sirve como checklist para futuras auditorias y como referencia al anadir nuevos endpoints._

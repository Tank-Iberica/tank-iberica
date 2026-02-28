# Registro de Actividades de Tratamiento (RAT)

> **Artículo 30 del Reglamento General de Protección de Datos (RGPD)**
> Generado automáticamente el 2026-02-26 por `scripts/generate-rat.ts`
> **BORRADOR** — Requiere revisión legal antes de su uso oficial.

---

## 1. Responsable del tratamiento

| Campo                 | Valor                                                              |
| --------------------- | ------------------------------------------------------------------ |
| **Razón social**      | _[Completar]_                                                      |
| **CIF**               | _[Completar]_                                                      |
| **Domicilio**         | _[Completar]_                                                      |
| **Email de contacto** | tankiberica@gmail.com                                              |
| **Web**               | https://tracciona.com                                              |
| **DPO designado**     | _[Completar si aplica — obligatorio si tratamiento a gran escala]_ |

## 2. Actividades de tratamiento

### ACT-01: Registro y autenticación de usuarios

| Campo                              | Detalle                                                             |
| ---------------------------------- | ------------------------------------------------------------------- |
| **Finalidad**                      | Crear y gestionar cuentas de usuario (compradores y concesionarios) |
| **Base jurídica**                  | Art. 6.1.b RGPD — Ejecución de contrato                             |
| **Categoría de interesados**       | Usuarios registrados (compradores, concesionarios)                  |
| **Categorías de datos**            | Email, Nombre completo, Teléfono, Contraseña (hash), Avatar         |
| **Tablas BD relacionadas**         | `users`, `profiles`, `consents`                                     |
| **Plazo de conservación**          | Indefinido (hasta solicitud de supresión)                           |
| **Encargados del tratamiento**     | Supabase Inc., Google Ireland Ltd.                                  |
| **Transferencias internacionales** | Sí — con Cláusulas Contractuales Tipo (SCC)                         |

### ACT-02: Gestión de concesionarios

| Campo                              | Detalle                                                                            |
| ---------------------------------- | ---------------------------------------------------------------------------------- |
| **Finalidad**                      | Verificar y gestionar cuentas de concesionarios profesionales                      |
| **Base jurídica**                  | Art. 6.1.b RGPD — Ejecución de contrato                                            |
| **Categoría de interesados**       | Concesionarios profesionales                                                       |
| **Categorías de datos**            | Razón social, CIF/NIF, Email, Teléfono, Documentos de verificación                 |
| **Tablas BD relacionadas**         | `dealers`, `dealer_fiscal_data`, `verification_documents`, `auction_registrations` |
| **Plazo de conservación**          | Indefinido (hasta baja del concesionario)                                          |
| **Encargados del tratamiento**     | Supabase Inc.                                                                      |
| **Transferencias internacionales** | Sí — con Cláusulas Contractuales Tipo (SCC)                                        |

### ACT-03: Publicación de anuncios de vehículos

| Campo                              | Detalle                                                    |
| ---------------------------------- | ---------------------------------------------------------- | ---------------------------------------- |
| **Finalidad**                      | Permitir la publicación y gestión de anuncios de vehículos |
| **Base jurídica**                  | Art. 6.1.b RGPD — Ejecución de contrato                    |
| **Categoría de interesados**       | Anunciantes (particulares y concesionarios)                |
| **Categorías de datos**            | Nombre de contacto, Email, Teléfono                        |
| **Tablas BD relacionadas**         | `advertisements`, `ads`                                    |
| **Plazo de conservación**          | Activo: indefinido                                         | Archivado: 2 años tras venta/eliminación |
| **Encargados del tratamiento**     | Supabase Inc., Cloudinary Ltd., Cloudflare Inc.            |
| **Transferencias internacionales** | Sí — con Cláusulas Contractuales Tipo (SCC)                |

### ACT-04: Procesamiento de pagos

| Campo                              | Detalle                                                    |
| ---------------------------------- | ---------------------------------------------------------- |
| **Finalidad**                      | Gestionar suscripciones, destacados y depósitos de subasta |
| **Base jurídica**                  | Art. 6.1.b RGPD — Ejecución de contrato                    |
| **Categoría de interesados**       | Usuarios que realizan pagos                                |
| **Categorías de datos**            | Datos de pago (vía Stripe), NIF facturación, Email         |
| **Tablas BD relacionadas**         | `payments`, `dealer_invoices`, `reservations`              |
| **Plazo de conservación**          | Facturas: 10 años (obligación fiscal España)               |
| **Encargados del tratamiento**     | Stripe Inc., Recrea Systems SL (Quaderno)                  |
| **Transferencias internacionales** | Sí — con Cláusulas Contractuales Tipo (SCC)                |

### ACT-05: Subastas

| Campo                              | Detalle                                            |
| ---------------------------------- | -------------------------------------------------- |
| **Finalidad**                      | Gestionar subastas de vehículos y pujas            |
| **Base jurídica**                  | Art. 6.1.b RGPD — Ejecución de contrato            |
| **Categoría de interesados**       | Participantes en subastas                          |
| **Categorías de datos**            | user_id, DNI/NIE, Razón social, Datos del depósito |
| **Tablas BD relacionadas**         | `auction_bids`, `auction_registrations`            |
| **Plazo de conservación**          | Pujas: 5 años (requisito legal)                    |
| **Encargados del tratamiento**     | Supabase Inc., Stripe Inc.                         |
| **Transferencias internacionales** | Sí — con Cláusulas Contractuales Tipo (SCC)        |

### ACT-06: Leads y contactos comerciales

| Campo                              | Detalle                                                                 |
| ---------------------------------- | ----------------------------------------------------------------------- |
| **Finalidad**                      | Gestionar solicitudes de contacto, demandas e inspecciones              |
| **Base jurídica**                  | Art. 6.1.b RGPD — Ejecución de contrato / Art. 6.1.f — Interés legítimo |
| **Categoría de interesados**       | Usuarios interesados en vehículos                                       |
| **Categorías de datos**            | Nombre, Email, Teléfono, Empresa                                        |
| **Tablas BD relacionadas**         | `contacts`, `dealer_leads`, `demands`, `leads`, `pipeline_items`        |
| **Plazo de conservación**          | Indefinido (hasta eliminación del concesionario)                        |
| **Encargados del tratamiento**     | Supabase Inc., Resend Inc.                                              |
| **Transferencias internacionales** | Sí — con Cláusulas Contractuales Tipo (SCC)                             |

### ACT-07: Comunicaciones (email y WhatsApp)

| Campo                              | Detalle                                                                               |
| ---------------------------------- | ------------------------------------------------------------------------------------- | --------------- | ---------------------- |
| **Finalidad**                      | Envío de notificaciones, alertas y comunicaciones transaccionales                     |
| **Base jurídica**                  | Art. 6.1.b RGPD — Ejecución de contrato / Art. 6.1.a — Consentimiento                 |
| **Categoría de interesados**       | Usuarios registrados, suscriptores newsletter                                         |
| **Categorías de datos**            | Email, Teléfono (WhatsApp), Preferencias de email                                     |
| **Tablas BD relacionadas**         | `email_logs`, `email_preferences`, `newsletter_subscriptions`, `whatsapp_submissions` |
| **Plazo de conservación**          | Logs email: 6 meses                                                                   | WhatsApp: 1 año | Newsletter: hasta baja |
| **Encargados del tratamiento**     | Resend Inc., Meta Platforms Ireland Ltd.                                              |
| **Transferencias internacionales** | Sí — con Cláusulas Contractuales Tipo (SCC)                                           |

### ACT-08: Analítica y seguimiento de actividad

| Campo                              | Detalle                                                                                       |
| ---------------------------------- | --------------------------------------------------------------------------------------------- | -------------------- |
| **Finalidad**                      | Registrar actividad para seguridad, auditoría y mejora del servicio                           |
| **Base jurídica**                  | Art. 6.1.f RGPD — Interés legítimo                                                            |
| **Categoría de interesados**       | Todos los usuarios                                                                            |
| **Categorías de datos**            | user_id, Dirección IP, Eventos de actividad                                                   |
| **Tablas BD relacionadas**         | `activity_logs`, `ad_events`, `user_vehicle_views`, `user_ad_profiles`, `vehicle_comparisons` |
| **Plazo de conservación**          | Logs: 6 meses activo, 2 años archivo                                                          | Impresiones: 90 días |
| **Encargados del tratamiento**     | Supabase Inc., Functional Software Inc. (Sentry)                                              |
| **Transferencias internacionales** | Sí — con Cláusulas Contractuales Tipo (SCC)                                                   |

### ACT-09: Alertas de búsqueda y favoritos

| Campo                              | Detalle                                                 |
| ---------------------------------- | ------------------------------------------------------- |
| **Finalidad**                      | Guardar preferencias y notificar sobre nuevos vehículos |
| **Base jurídica**                  | Art. 6.1.a RGPD — Consentimiento                        |
| **Categoría de interesados**       | Usuarios registrados                                    |
| **Categorías de datos**            | user_id, Criterios de búsqueda, Vehículos favoritos     |
| **Tablas BD relacionadas**         | `search_alerts`, `favorites`                            |
| **Plazo de conservación**          | Indefinido (hasta eliminación de cuenta)                |
| **Encargados del tratamiento**     | Supabase Inc.                                           |
| **Transferencias internacionales** | Sí — con Cláusulas Contractuales Tipo (SCC)             |

### ACT-10: Suscripciones de datos de mercado

| Campo                              | Detalle                                      |
| ---------------------------------- | -------------------------------------------- |
| **Finalidad**                      | Ofrecer acceso a informes y datos de mercado |
| **Base jurídica**                  | Art. 6.1.b RGPD — Ejecución de contrato      |
| **Categoría de interesados**       | Suscriptores profesionales                   |
| **Categorías de datos**            | Email, Empresa, user_id                      |
| **Tablas BD relacionadas**         | `data_subscriptions`                         |
| **Plazo de conservación**          | Indefinido (hasta cancelación)               |
| **Encargados del tratamiento**     | Supabase Inc., Stripe Inc.                   |
| **Transferencias internacionales** | Sí — con Cláusulas Contractuales Tipo (SCC)  |

### ACT-11: Generación de contenido con IA

| Campo                              | Detalle                                                  |
| ---------------------------------- | -------------------------------------------------------- |
| **Finalidad**                      | Generar descripciones de vehículos y contenido editorial |
| **Base jurídica**                  | Art. 6.1.f RGPD — Interés legítimo                       |
| **Categoría de interesados**       | N/A (no se envían datos personales a la IA)              |
| **Categorías de datos**            | Datos técnicos de vehículos (no PII)                     |
| **Tablas BD relacionadas**         | N/A                                                      |
| **Plazo de conservación**          | No aplica                                                |
| **Encargados del tratamiento**     | Anthropic PBC, OpenAI Inc.                               |
| **Transferencias internacionales** | Sí — con Cláusulas Contractuales Tipo (SCC)              |

### ACT-12: Notificaciones push

| Campo                              | Detalle                                             |
| ---------------------------------- | --------------------------------------------------- |
| **Finalidad**                      | Enviar notificaciones push a dispositivos suscritos |
| **Base jurídica**                  | Art. 6.1.a RGPD — Consentimiento                    |
| **Categoría de interesados**       | Usuarios que aceptan push                           |
| **Categorías de datos**            | user_id, Endpoint push, Claves VAPID                |
| **Tablas BD relacionadas**         | `push_subscriptions`                                |
| **Plazo de conservación**          | Hasta revocación del consentimiento                 |
| **Encargados del tratamiento**     | Cloudflare Inc.                                     |
| **Transferencias internacionales** | Sí — con Cláusulas Contractuales Tipo (SCC)         |

### ACT-13: Reseñas de vendedores

| Campo                              | Detalle                                                 |
| ---------------------------------- | ------------------------------------------------------- |
| **Finalidad**                      | Permitir valoraciones de concesionarios por compradores |
| **Base jurídica**                  | Art. 6.1.f RGPD — Interés legítimo                      |
| **Categoría de interesados**       | Compradores que escriben reseñas                        |
| **Categorías de datos**            | user_id, Texto de reseña                                |
| **Tablas BD relacionadas**         | `seller_reviews`                                        |
| **Plazo de conservación**          | Indefinido (moderadas)                                  |
| **Encargados del tratamiento**     | Supabase Inc.                                           |
| **Transferencias internacionales** | Sí — con Cláusulas Contractuales Tipo (SCC)             |

## 3. Encargados del tratamiento (subprocesadores)

> Detectados automáticamente desde `.env.example`

| Proveedor                         | Servicio                                      | Ubicación                    | SCC/Adecuación   |
| --------------------------------- | --------------------------------------------- | ---------------------------- | ---------------- |
| Supabase Inc.                     | Base de datos, autenticación, almacenamiento  | AWS eu-central-1 (Frankfurt) | UE — no requiere |
| Cloudinary Ltd.                   | Procesamiento y transformación de imágenes    | EE.UU. (con SCC)             | SCC vigentes     |
| Stripe Inc.                       | Procesamiento de pagos, facturación           | EE.UU. (con SCC)             | SCC vigentes     |
| Resend Inc.                       | Envío de emails transaccionales               | EE.UU. (con SCC)             | SCC vigentes     |
| Cloudflare Inc.                   | Protección anti-bot (CAPTCHA)                 | Global (con SCC)             | SCC vigentes     |
| Anthropic PBC                     | Generación de contenido con IA                | EE.UU. (con SCC)             | SCC vigentes     |
| OpenAI Inc.                       | IA de respaldo (failover)                     | EE.UU. (con SCC)             | SCC vigentes     |
| Meta Platforms Ireland Ltd.       | Notificaciones WhatsApp Business              | Irlanda / EE.UU. (con SCC)   | SCC vigentes     |
| Quaderno (Recrea Systems SL)      | Facturación y cumplimiento fiscal             | España (UE)                  | UE — no requiere |
| Cloudflare Inc.                   | CDN, WAF, hosting, almacenamiento de imágenes | Global (con SCC)             | SCC vigentes     |
| Functional Software Inc. (Sentry) | Monitorización de errores                     | EE.UU. (con SCC)             | SCC vigentes     |
| Google Ireland Ltd.               | OAuth, Google Ads                             | Irlanda / EE.UU. (con SCC)   | SCC vigentes     |

## 4. Plazos de conservación

> Extraído de `DATA-RETENTION.md`

| Tipo de dato                    | Activo                                            | Archivo          | Eliminación         | Base legal            |
| ------------------------------- | ------------------------------------------------- | ---------------- | ------------------- | --------------------- |
| Vehicle listings (active)       | Indefinite                                        | —                | —                   | Legitimate interest   |
| Vehicle listings (sold/removed) | 6 months visible                                  | 2 years archived | After 2 years       | Historical price data |
| User accounts                   | Indefinite                                        | —                | On request          | Consent               |
| User activity logs              | 6 months                                          | 2 years          | After 2 years       | Legitimate interest   |
| Session data                    | 30 days                                           | —                | After 30 days       | Technical necessity   |
| Search alerts                   | Indefinite                                        | —                | On account deletion | Consent               |
| Favorites                       | Indefinite                                        | —                | On account deletion | Consent               |
| Auction bids                    | 1 year                                            | 5 years          | After 5 years       | Legal requirement     |
| Invoices                        | 5 years                                           | 10 years         | After 10 years      | Tax law (Spain)       |
| GDPR requests                   | Processing + 30 days                              | 3 years          | After 3 years       | Legal requirement     |
| WhatsApp submissions            | 6 months                                          | 1 year           | After 1 year        | Legitimate interest   |
| Ad impressions/clicks           | 90 days                                           | 1 year           | After 1 year        | Legitimate interest   |
| CRM contacts                    | Indefinite                                        | —                | On dealer deletion  | Legitimate interest   |
| Error logs                      | 30 days                                           | —                | After 30 days       | Technical necessity   |
| Backup files                    | Daily: 7 days, Weekly: 4 weeks, Monthly: 6 months | —                | Per schedule        | Disaster recovery     |

## 5. Inventario de datos personales en base de datos

> Detectado automáticamente desde `types/supabase.ts`

Se han identificado **44 tablas** con datos personales:

| Tabla                      | Columnas PII                                                | Vinculada a usuario |
| -------------------------- | ----------------------------------------------------------- | ------------------- |
| `activity_logs`            | `ip_address`                                                | Sí                  |
| `ad_events`                | —                                                           | Sí                  |
| `ads`                      | `email`, `phone`                                            | No                  |
| `advertisements`           | `contact_email`, `contact_name`, `contact_phone`            | Sí                  |
| `advertisers`              | `company_name`, `contact_email`, `contact_phone`, `tax_id`  | No                  |
| `analytics_events`         | —                                                           | Sí                  |
| `auction_bids`             | —                                                           | Sí                  |
| `auction_registrations`    | `company_name`, `id_number`                                 | Sí                  |
| `chat_messages`            | —                                                           | Sí                  |
| `comments`                 | `author_email`, `author_name`                               | Sí                  |
| `comparison_notes`         | —                                                           | Sí                  |
| `consents`                 | `ip_address`                                                | Sí                  |
| `contacts`                 | `contact_name`, `email`, `phone`                            | No                  |
| `data_subscriptions`       | `company_name`, `contact_email`                             | Sí                  |
| `dealer_contracts`         | `buyer_name`, `buyer_nif`                                   | No                  |
| `dealer_fiscal_data`       | `tax_id`                                                    | No                  |
| `dealer_invoices`          | `buyer_name`, `buyer_tax_id`                                | No                  |
| `dealer_leads`             | `company_name`, `contact_name`, `email`, `phone`            | No                  |
| `dealer_quotes`            | `client_email`, `client_name`, `client_phone`               | No                  |
| `dealers`                  | `cif_nif`, `company_name`, `email`, `legal_name`, `phone`   | Sí                  |
| `demands`                  | `contact_email`, `contact_name`, `contact_phone`            | Sí                  |
| `email_logs`               | `recipient_email`                                           | No                  |
| `email_preferences`        | —                                                           | Sí                  |
| `favorites`                | —                                                           | Sí                  |
| `invoices`                 | —                                                           | Sí                  |
| `leads`                    | `buyer_email`, `buyer_name`, `buyer_phone`                  | No                  |
| `newsletter_subscriptions` | `email`                                                     | No                  |
| `payments`                 | —                                                           | Sí                  |
| `pipeline_items`           | `contact_email`, `contact_name`, `contact_phone`            | No                  |
| `profiles`                 | `avatar_url`, `email`, `full_name`, `phone`                 | Sí                  |
| `push_subscriptions`       | —                                                           | Sí                  |
| `rental_records`           | `tenant_email`, `tenant_name`, `tenant_nif`, `tenant_phone` | No                  |
| `reports`                  | `reporter_email`                                            | No                  |
| `search_alerts`            | —                                                           | Sí                  |
| `search_logs`              | —                                                           | Sí                  |
| `service_requests`         | —                                                           | Sí                  |
| `subscriptions`            | —                                                           | Sí                  |
| `transport_requests`       | —                                                           | Sí                  |
| `user_ad_profiles`         | —                                                           | Sí                  |
| `user_vehicle_views`       | —                                                           | Sí                  |
| `users`                    | `avatar_url`, `company_name`, `email`, `phone`              | No                  |
| `vehicle_comparisons`      | —                                                           | Sí                  |
| `whatsapp_submissions`     | `phone_number`                                              | No                  |
| `founding_expiry_check`    | `company_name`, `dealer_email`, `user_email`                | Sí                  |

## 6. Medidas de seguridad (Art. 32 RGPD)

### Medidas técnicas

- **Cifrado en tránsito**: TLS 1.3 en todas las conexiones (Cloudflare)
- **Cifrado en reposo**: AES-256 en base de datos (Supabase/AWS)
- **Autenticación**: Supabase Auth con hash bcrypt, soporte OAuth 2.0
- **Autorización**: Row Level Security (RLS) en todas las tablas
- **WAF**: Cloudflare WAF con rate limiting por endpoint
- **Anti-bot**: Cloudflare Turnstile en formularios públicos
- **Sanitización**: DOMPurify para contenido HTML, parametrización SQL
- **Headers de seguridad**: CSP, X-Frame-Options, HSTS
- **Monitorización**: Sentry para errores, alertas de infraestructura

### Medidas organizativas

- **Acceso mínimo**: Solo admin tiene acceso al panel de administración
- **Backups**: Diarios (7 días), semanales (4 semanas), mensuales (6 meses)
- **Revisión de accesos**: Periódica en Supabase Dashboard
- **Formación**: _[Completar — plan de formación RGPD para el equipo]_

## 7. Derechos de los interesados

| Derecho                     | Implementación                           | Endpoint                     |
| --------------------------- | ---------------------------------------- | ---------------------------- |
| **Acceso** (Art. 15)        | Perfil de usuario visible en `/perfil`   | —                            |
| **Rectificación** (Art. 16) | Edición en `/perfil`                     | —                            |
| **Supresión** (Art. 17)     | Borrado de cuenta en `/perfil/seguridad` | `DELETE /api/account/delete` |
| **Portabilidad** (Art. 20)  | Exportación de datos                     | `GET /api/account/export`    |
| **Oposición** (Art. 21)     | Preferencias de email, desuscripción     | `/perfil/notificaciones`     |
| **Limitación** (Art. 18)    | Contacto vía email                       | tankiberica@gmail.com        |

## 8. Historial de cambios

| Fecha      | Cambio                        | Autor           |
| ---------- | ----------------------------- | --------------- |
| 2026-02-26 | Generación inicial automática | generate-rat.ts |

---

_Este documento se regenera ejecutando `npx tsx scripts/generate-rat.ts`.
Cada cambio en tablas, procesadores o retención se reflejará automáticamente._

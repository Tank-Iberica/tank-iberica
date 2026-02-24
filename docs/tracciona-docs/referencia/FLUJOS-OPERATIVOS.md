# Flujos Operativos — Tracciona

> Diagramas ASCII de los flujos principales del marketplace. Referencia para onboarding de equipo y contexto para Claude Code.

---

## Flujo 1: Comprador

```
SEO/Directo/SEM
      |
      v
  Catalogo (index.vue)
      |
      +--> Filtros (FilterBar.vue, useFilters.ts)
      |       |
      |       +--> Precio, Ano, Categoria, Subcategoria
      |       +--> Ubicacion, Marca, Estado
      |       +--> Busqueda texto libre
      |
      +--> Resultados (VehicleGrid.vue, useVehicles.ts)
              |
              v
      Ficha vehiculo (vehiculo/[slug].vue)
              |
              +--> [Contactar dealer]
              |       |
              |       +--> Telefono (click-to-call)
              |       +--> WhatsApp (deep link)
              |       +--> Formulario contacto --> INSERT lead --> Email a dealer
              |
              +--> [Favoritos / Alertas]
              |       |
              |       +--> Guardar favorito --> INSERT favorites
              |       |       (Cron: favorite-price-drop, favorite-sold)
              |       |
              |       +--> Crear alerta --> INSERT search_alerts
              |               (Cron: search-alerts diario)
              |
              +--> [Subastas] (si vehiculo en subasta)
              |       |
              |       +--> Ver subasta (subastas/[id].vue)
              |       +--> Registro --> Documentos + Deposito Stripe
              |       +--> Pujas en tiempo real (Supabase Realtime)
              |       +--> Resultado --> Ganador: capture / Perdedores: cancel
              |
              +--> [Verificacion]
                      |
                      +--> Ver nivel verificacion (badges en ficha)
                      +--> Solicitar informe DGT (dgt-report.post.ts)
```

### Zona privada comprador (perfil/\*)

```
perfil/index.vue ----------> Dashboard resumen
perfil/datos.vue ----------> Editar datos personales
perfil/favoritos.vue ------> Vehiculos guardados
perfil/alertas.vue --------> Alertas de busqueda activas
perfil/contactos.vue ------> Historial de contactos/leads enviados
perfil/notificaciones.vue -> Preferencias de notificaciones
perfil/suscripcion.vue ----> Plan actual (si aplica)
perfil/seguridad.vue ------> Cambiar password, 2FA
```

---

## Flujo 2: Dealer

```
Registro (auth/registro.vue)
      |
      v
Onboarding (5 pasos)
      |
      +--> 1. Datos empresa
      +--> 2. Documentacion fiscal
      +--> 3. Logo + portada
      +--> 4. Configuracion portal
      +--> 5. Plan suscripcion (Stripe Checkout)
      |
      v
Dashboard (dashboard/index.vue)
      |
      +--> [Publicar vehiculo]
      |       |
      |       +--> Manual (dashboard/vehiculos/nuevo.vue)
      |       |       Formulario --> INSERT vehicles (status: draft)
      |       |       Subida fotos --> Cloudinary
      |       |       Publicar --> UPDATE status: published
      |       |
      |       +--> WhatsApp (server/api/whatsapp/process.post.ts)
      |       |       Fotos + texto via WhatsApp
      |       |       --> IA extrae datos (Anthropic)
      |       |       --> Crea ficha borrador
      |       |       --> Dealer confirma en dashboard
      |       |
      |       +--> Excel (dashboard/vehiculos/importar.vue)
      |               Carga masiva CSV/Excel
      |               --> Validacion columnas
      |               --> INSERT batch
      |
      +--> [Gestionar vehiculos]
      |       |
      |       +--> Listado (dashboard/vehiculos/index.vue)
      |       +--> Editar (dashboard/vehiculos/[id].vue)
      |       +--> Marcar vendido --> UPDATE status: sold
      |               --> Redirigir a servicios-postventa
      |
      +--> [Leads / CRM]
      |       |
      |       +--> Pipeline visual (dashboard/leads/)
      |       |       Estados: new --> viewed --> contacted --> won/lost
      |       |
      |       +--> Responder lead (email, telefono, WhatsApp)
      |       +--> Historico de conversaciones
      |
      +--> [Estadisticas]
      |       |
      |       +--> Visitas por vehiculo
      |       +--> Leads recibidos
      |       +--> Tasa de conversion
      |       +--> Comparativa con mercado
      |
      +--> [Herramientas]
      |       |
      |       +--> Factura (herramientas/factura.vue)
      |       +--> Contrato (herramientas/contrato.vue)
      |       +--> Presupuesto (herramientas/presupuesto.vue)
      |       +--> Calculadora financiera (herramientas/calculadora.vue)
      |       +--> Exportar anuncio (herramientas/exportar-anuncio.vue)
      |       +--> Widget web (herramientas/widget.vue)
      |       +--> Export datos (herramientas/exportar.vue)
      |       +--> Merchandising (herramientas/merchandising.vue)
      |
      +--> [Portal publico]
      |       +--> Personalizar colores, bio, contacto
      |       +--> URL propia del dealer
      |
      +--> [Suscripcion]
              +--> Ver plan actual
              +--> Cambiar plan (Stripe Portal)
              +--> Historial facturas
```

---

## Flujo 3: Admin

```
Login admin --> admin/index.vue (Dashboard metricas)
      |
      +--> [Gestion de contenido]
      |       |
      |       +--> Vehiculos (admin/productos/ o admin/vehiculos/)
      |       |       Aprobar, editar, eliminar, cambiar estado
      |       |
      |       +--> Dealers (admin/dealers/)
      |       |       Verificar, activar, desactivar
      |       |       Ver suscripciones
      |       |
      |       +--> Noticias (admin/noticias/)
      |       |       CRUD articulos, programar publicacion
      |       |
      |       +--> Subastas (admin/subastas/)
      |       |       Crear, adjudicar, cancelar
      |       |       Gestion de pujas y depositos
      |       |
      |       +--> Verificaciones (admin/verificaciones.vue)
      |       |       Cola de documentos pendientes
      |       |       Aprobar/rechazar por nivel
      |       |
      |       +--> Comentarios (admin/comentarios.vue)
      |               Moderar comentarios en fichas
      |
      +--> [Marketing y captacion]
      |       |
      |       +--> Publicidad (admin/publicidad.vue)
      |       |       CRUD anunciantes + anuncios
      |       |       Matching por categoria/ubicacion
      |       |
      |       +--> Captacion (admin/captacion.vue)
      |       |       Leads de competidores
      |       |       Gestion de prospectos
      |       |
      |       +--> Social (admin/social.vue)
      |       |       Cola de posts generados por IA
      |       |       Aprobar, editar, publicar
      |       |
      |       +--> Banner (admin/banner.vue)
      |               Gestion de banners homepage
      |
      +--> [Operaciones]
      |       |
      |       +--> Usuarios (admin/usuarios.vue)
      |       |       Ver todos los usuarios, roles
      |       |
      |       +--> Suscripciones (admin/suscripciones.vue)
      |       |       Estado de pagos, planes activos
      |       |
      |       +--> Pagos (admin/pagos.vue)
      |       |       Historial de transacciones Stripe
      |       |
      |       +--> Facturacion (admin/facturacion.vue)
      |       |       Facturas emitidas por la plataforma
      |       |
      |       +--> Balance (admin/balance.vue)
      |       |       Revenue, comisiones, metricas financieras
      |       |
      |       +--> Reportes (admin/reportes.vue)
      |       |       Informes generales
      |       |
      |       +--> Historico (admin/historico.vue)
      |               Vehiculos vendidos/archivados
      |
      +--> [Infraestructura]
      |       |
      |       +--> Panel (admin/infraestructura.vue)
      |       |       Metricas BD, storage, API
      |       |       Alertas automaticas (cron: infra-metrics)
      |       |       Gestion de clusters
      |       |
      |       +--> Utilidades (admin/utilidades.vue)
      |               Herramientas de mantenimiento
      |
      +--> [Configuracion] (admin/config/*)
              |
              +--> branding.vue -------> Logo, colores, tipografia
              +--> navigation.vue ----> Menu principal
              +--> homepage.vue ------> Secciones de la home
              +--> catalog.vue -------> Config del catalogo
              +--> languages.vue -----> Idiomas activos
              +--> pricing.vue -------> Planes de precios
              +--> integrations.vue --> APIs externas
              +--> emails.vue --------> Templates de email (30)
              +--> editorial.vue -----> Config de contenido
              +--> system.vue --------> Mantenimiento, logs
              +--> tipos.vue ---------> Tipos de vehiculo
              +--> subcategorias.vue -> Subcategorias
              +--> caracteristicas.vue > Caracteristicas/filtros
```

---

## Flujo 4: Crons (procesos automaticos)

```
Cloudflare Workers (programados)
      |
      +--> cron/publish-scheduled.post.ts
      |       Publica vehiculos y articulos programados
      |       (Requiere CRON_SECRET)
      |
      +--> cron/freshness-check.post.ts
      |       Marca vehiculos obsoletos (>90 dias sin actualizar)
      |       (Requiere CRON_SECRET)
      |
      +--> cron/search-alerts.post.ts
      |       Evalua alertas de busqueda -> envia emails si hay matches
      |       (Requiere CRON_SECRET)
      |
      +--> cron/favorite-price-drop.post.ts
      |       Detecta bajadas de precio en favoritos -> notifica
      |       (Requiere CRON_SECRET)
      |
      +--> cron/favorite-sold.post.ts
      |       Detecta vehiculos favoritos vendidos -> notifica
      |       (Requiere CRON_SECRET)
      |
      +--> cron/dealer-weekly-stats.post.ts
      |       Envia resumen semanal a dealers
      |       (Requiere CRON_SECRET)
      |
      +--> cron/auto-auction.post.ts
      |       Cierra subastas expiradas, procesa resultados
      |       (Requiere CRON_SECRET)
      |
      +--> cron/whatsapp-retry.post.ts
      |       Reintenta envios WhatsApp fallidos
      |       (Requiere CRON_SECRET)
      |
      +--> cron/infra-metrics.post.ts
              Recopila metricas de infraestructura
              Genera alertas si hay umbrales criticos
              (Requiere CRON_SECRET)
```

---

## Flujo 5: Integraciones externas

```
[Stripe]
      |
      +--> checkout.post.ts -------> Crear sesion de pago
      +--> portal.post.ts --------> Portal de gestion de suscripcion
      +--> webhook.post.ts -------> Procesar eventos (verificacion de firma)
      +--> stripe-connect-onboard --> Onboarding de dealer como seller
      +--> auction-deposit.post.ts -> Deposito para participar en subasta

[WhatsApp (Meta Business API)]
      |
      +--> webhook.get.ts ---------> Verificacion del webhook
      +--> webhook.post.ts --------> Recibir mensajes (verificacion HMAC)
      +--> process.post.ts --------> Procesar fotos/texto con IA

[Cloudinary]
      |
      +--> Subida de imagenes (client-side via upload preset)
      +--> Transformaciones automaticas (resize, webp, quality)
      +--> CDN con cache (Workbox CacheFirst)

[Email (Resend)]
      |
      +--> email/send.post.ts -----> Envio de emails transaccionales
      |       30 templates predefinidos
      |       Auth: internal secret o admin
      |
      +--> email/unsubscribe.get.ts -> Baja de emails (link en footer)

[Push Notifications (Web Push)]
      |
      +--> push/send.post.ts ------> Enviar notificacion push
              Auth: internal secret o admin
              VAPID authentication
```

---

## Diagrama de autenticacion

```
Request entrante
      |
      v
  Es /api/* ?
      |
      +--> NO --> Nuxt SSR / SPA (middleware auth.ts, admin.ts)
      |
      +--> SI
            |
            v
      Tipo de endpoint?
            |
            +--> Publico (health, merchant-feed, sitemap, geo)
            |       --> Sin auth, con cache SWR
            |
            +--> Cron (cron/*.post.ts)
            |       --> Verifica CRON_SECRET via header
            |
            +--> Webhook (stripe/webhook, whatsapp/webhook)
            |       --> Verifica firma criptografica
            |
            +--> Internal (push/send, email/send)
            |       --> x-internal-secret O admin auth
            |
            +--> User (account/*, perfil/*)
            |       --> serverSupabaseUser(event) --> 401 si no auth
            |       --> Opera sobre user.id (no acepta userId del body)
            |
            +--> Admin (infra/*, admin endpoints)
            |       --> serverSupabaseUser + role check
            |       --> 403 si no es admin
            |
            +--> Dual (market-report)
                    --> ?public=true: sin auth (resumen)
                    --> default: admin auth (informe completo)
```

---

_Documento generado en Sesion 36. Actualizar cuando se anadan nuevos flujos o endpoints._

-- Migration: Seed email_templates in vertical_config for Tracciona
-- Creates all 30 email templates (15 dealer, 10 buyer, 5 system)
-- Each template has subject/body in ES + EN, variables list, category, always_on, and enabled flags

UPDATE vertical_config
SET email_templates = jsonb_build_object(
  -- ══════════════════════════════════════════════════════════════════════════════
  -- DEALER TEMPLATES (15)
  -- ══════════════════════════════════════════════════════════════════════════════

  'dealer_welcome', jsonb_build_object(
    'subject', jsonb_build_object(
      'es', 'Bienvenido a {{portalUrl}} - Tu cuenta está lista',
      'en', 'Welcome to {{portalUrl}} - Your account is ready'
    ),
    'body', jsonb_build_object(
      'es', 'Hola **{{name}}**,

¡Bienvenido a Tracciona! Tu cuenta de vendedor ha sido activada correctamente. Ya puedes publicar vehículos, gestionar leads y acceder a tus estadísticas.

[Accede a tu panel de control]({{portalUrl}})

Si tienes alguna pregunta, escríbenos a {{supportEmail}}.',
      'en', 'Hello **{{name}}**,

Welcome to Tracciona! Your dealer account has been successfully activated. You can now publish vehicles, manage leads, and access your statistics.

[Access your dashboard]({{portalUrl}})

If you have any questions, contact us at {{supportEmail}}.'
    ),
    'variables', jsonb_build_array('name', 'portalUrl', 'supportEmail'),
    'category', 'dealer',
    'always_on', false,
    'enabled', true
  ),

  'dealer_new_lead', jsonb_build_object(
    'subject', jsonb_build_object(
      'es', 'Nuevo contacto para {{vehicleTitle}}',
      'en', 'New lead for {{vehicleTitle}}'
    ),
    'body', jsonb_build_object(
      'es', 'Hola **{{name}}**,

Has recibido un nuevo contacto de **{{buyerName}}** para tu vehículo [{{vehicleTitle}}]({{vehicleUrl}}).

**Datos de contacto:**
- Email: {{buyerEmail}}
- Teléfono: {{buyerPhone}}

Responde lo antes posible para maximizar tus oportunidades de venta.',
      'en', 'Hello **{{name}}**,

You have received a new lead from **{{buyerName}}** for your vehicle [{{vehicleTitle}}]({{vehicleUrl}}).

**Contact details:**
- Email: {{buyerEmail}}
- Phone: {{buyerPhone}}

Reply as soon as possible to maximize your sales opportunities.'
    ),
    'variables', jsonb_build_array('name', 'buyerName', 'buyerEmail', 'buyerPhone', 'vehicleTitle', 'vehicleUrl'),
    'category', 'dealer',
    'always_on', false,
    'enabled', true
  ),

  'dealer_vehicle_published', jsonb_build_object(
    'subject', jsonb_build_object(
      'es', 'Tu vehículo {{vehicleTitle}} ya está en línea',
      'en', 'Your vehicle {{vehicleTitle}} is now live'
    ),
    'body', jsonb_build_object(
      'es', 'Hola **{{name}}**,

Tu vehículo [{{vehicleTitle}}]({{vehicleUrl}}) ha sido publicado correctamente y ya está visible para compradores.

**Puntuación SEO:** {{seoScore}}/100

[Ver anuncio]({{vehicleUrl}})',
      'en', 'Hello **{{name}}**,

Your vehicle [{{vehicleTitle}}]({{vehicleUrl}}) has been successfully published and is now visible to buyers.

**SEO Score:** {{seoScore}}/100

[View listing]({{vehicleUrl}})'
    ),
    'variables', jsonb_build_array('name', 'vehicleTitle', 'vehicleUrl', 'seoScore'),
    'category', 'dealer',
    'always_on', false,
    'enabled', true
  ),

  'dealer_vehicle_sold', jsonb_build_object(
    'subject', jsonb_build_object(
      'es', '¡Enhorabuena! {{vehicleTitle}} marcado como vendido',
      'en', 'Congratulations! {{vehicleTitle}} marked as sold'
    ),
    'body', jsonb_build_object(
      'es', 'Hola **{{name}}**,

¡Enhorabuena por la venta de **{{vehicleTitle}}**!

**Estadísticas finales:**
- Días publicado: {{daysPublished}}
- Total de vistas: {{totalViews}}
- Total de leads: {{totalLeads}}

Gracias por confiar en Tracciona.',
      'en', 'Hello **{{name}}**,

Congratulations on selling **{{vehicleTitle}}**!

**Final statistics:**
- Days published: {{daysPublished}}
- Total views: {{totalViews}}
- Total leads: {{totalLeads}}

Thank you for trusting Tracciona.'
    ),
    'variables', jsonb_build_array('name', 'vehicleTitle', 'daysPublished', 'totalViews', 'totalLeads'),
    'category', 'dealer',
    'always_on', false,
    'enabled', true
  ),

  'dealer_weekly_summary', jsonb_build_object(
    'subject', jsonb_build_object(
      'es', 'Resumen semanal de tus anuncios',
      'en', 'Weekly summary of your listings'
    ),
    'body', jsonb_build_object(
      'es', 'Hola **{{name}}**,

Aquí está tu resumen semanal:

- **Vistas totales:** {{totalViews}} ({{weekChange}})
- **Nuevos leads:** {{newLeads}}
- **Vehículo más visto:** {{topVehicle}}

Sigue optimizando tus anuncios para obtener mejores resultados.',
      'en', 'Hello **{{name}}**,

Here is your weekly summary:

- **Total views:** {{totalViews}} ({{weekChange}})
- **New leads:** {{newLeads}}
- **Top vehicle:** {{topVehicle}}

Keep optimizing your listings for better results.'
    ),
    'variables', jsonb_build_array('name', 'totalViews', 'newLeads', 'topVehicle', 'weekChange'),
    'category', 'dealer',
    'always_on', false,
    'enabled', true
  ),

  'dealer_monthly_summary', jsonb_build_object(
    'subject', jsonb_build_object(
      'es', 'Resumen mensual - {{monthName}}',
      'en', 'Monthly summary - {{monthName}}'
    ),
    'body', jsonb_build_object(
      'es', 'Hola **{{name}}**,

Resumen de **{{monthName}}**:

- **Vistas totales:** {{totalViews}}
- **Nuevos leads:** {{newLeads}}
- **Tu ranking:** {{ranking}}

¡Sigue así!',
      'en', 'Hello **{{name}}**,

Summary for **{{monthName}}**:

- **Total views:** {{totalViews}}
- **New leads:** {{newLeads}}
- **Your ranking:** {{ranking}}

Keep it up!'
    ),
    'variables', jsonb_build_array('name', 'monthName', 'totalViews', 'newLeads', 'ranking'),
    'category', 'dealer',
    'always_on', false,
    'enabled', true
  ),

  'dealer_subscription_activated', jsonb_build_object(
    'subject', jsonb_build_object(
      'es', 'Suscripción {{plan}} activada',
      'en', 'Subscription {{plan}} activated'
    ),
    'body', jsonb_build_object(
      'es', 'Hola **{{name}}**,

Tu suscripción **{{plan}}** ha sido activada correctamente.

- **Precio:** {{price}}
- **Próxima facturación:** {{nextBillingDate}}

Disfruta de todas las ventajas de tu plan.',
      'en', 'Hello **{{name}}**,

Your **{{plan}}** subscription has been successfully activated.

- **Price:** {{price}}
- **Next billing date:** {{nextBillingDate}}

Enjoy all the benefits of your plan.'
    ),
    'variables', jsonb_build_array('name', 'plan', 'price', 'nextBillingDate'),
    'category', 'dealer',
    'always_on', false,
    'enabled', true
  ),

  'dealer_subscription_expiring', jsonb_build_object(
    'subject', jsonb_build_object(
      'es', 'Tu suscripción {{plan}} expira en 7 días',
      'en', 'Your {{plan}} subscription expires in 7 days'
    ),
    'body', jsonb_build_object(
      'es', 'Hola **{{name}}**,

Tu suscripción **{{plan}}** expira el **{{expiresAt}}**.

[Renovar ahora]({{renewUrl}})

Si tienes algún problema, contáctanos.',
      'en', 'Hello **{{name}}**,

Your **{{plan}}** subscription expires on **{{expiresAt}}**.

[Renew now]({{renewUrl}})

If you have any issues, contact us.'
    ),
    'variables', jsonb_build_array('name', 'plan', 'expiresAt', 'renewUrl'),
    'category', 'dealer',
    'always_on', false,
    'enabled', true
  ),

  'dealer_payment_failed', jsonb_build_object(
    'subject', jsonb_build_object(
      'es', 'Error en el pago de tu suscripción {{plan}}',
      'en', 'Payment failed for your {{plan}} subscription'
    ),
    'body', jsonb_build_object(
      'es', 'Hola **{{name}}**,

No hemos podido procesar el pago de tu suscripción **{{plan}}**.

[Actualizar método de pago]({{updateCardUrl}})

Tienes **{{gracePeriodDays}} días** antes de que tu cuenta sea suspendida.',
      'en', 'Hello **{{name}}**,

We were unable to process payment for your **{{plan}}** subscription.

[Update payment method]({{updateCardUrl}})

You have **{{gracePeriodDays}} days** before your account is suspended.'
    ),
    'variables', jsonb_build_array('name', 'plan', 'updateCardUrl', 'gracePeriodDays'),
    'category', 'dealer',
    'always_on', false,
    'enabled', true
  ),

  'dealer_subscription_cancelled', jsonb_build_object(
    'subject', jsonb_build_object(
      'es', 'Tu suscripción {{plan}} ha sido cancelada',
      'en', 'Your {{plan}} subscription has been cancelled'
    ),
    'body', jsonb_build_object(
      'es', 'Hola **{{name}}**,

Tu suscripción **{{plan}}** ha sido cancelada. Perderás acceso a las siguientes funciones:

{{featuresLost}}

Esperamos verte de nuevo pronto.',
      'en', 'Hello **{{name}}**,

Your **{{plan}}** subscription has been cancelled. You will lose access to the following features:

{{featuresLost}}

We hope to see you again soon.'
    ),
    'variables', jsonb_build_array('name', 'plan', 'featuresLost'),
    'category', 'dealer',
    'always_on', false,
    'enabled', true
  ),

  'dealer_verification_completed', jsonb_build_object(
    'subject', jsonb_build_object(
      'es', 'Verificación completada para {{vehicleTitle}}',
      'en', 'Verification completed for {{vehicleTitle}}'
    ),
    'body', jsonb_build_object(
      'es', 'Hola **{{name}}**,

La verificación de **{{vehicleTitle}}** ha sido completada.

- **Nivel de verificación:** {{level}}

[Ver informe completo]({{reportUrl}})',
      'en', 'Hello **{{name}}**,

Verification for **{{vehicleTitle}}** has been completed.

- **Verification level:** {{level}}

[View full report]({{reportUrl}})'
    ),
    'variables', jsonb_build_array('name', 'vehicleTitle', 'level', 'reportUrl'),
    'category', 'dealer',
    'always_on', false,
    'enabled', true
  ),

  'dealer_auction_registered', jsonb_build_object(
    'subject', jsonb_build_object(
      'es', 'Registro confirmado para subasta {{auctionTitle}}',
      'en', 'Registration confirmed for auction {{auctionTitle}}'
    ),
    'body', jsonb_build_object(
      'es', 'Hola **{{name}}**,

Tu registro para la subasta **{{auctionTitle}}** ha sido confirmado.

- **Depósito:** {{depositAmount}}
- **Fecha de subasta:** {{auctionDate}}

Te enviaremos recordatorios antes del inicio.',
      'en', 'Hello **{{name}}**,

Your registration for auction **{{auctionTitle}}** has been confirmed.

- **Deposit:** {{depositAmount}}
- **Auction date:** {{auctionDate}}

We will send you reminders before it starts.'
    ),
    'variables', jsonb_build_array('name', 'auctionTitle', 'depositAmount', 'auctionDate'),
    'category', 'dealer',
    'always_on', false,
    'enabled', true
  ),

  'dealer_auction_starting', jsonb_build_object(
    'subject', jsonb_build_object(
      'es', 'La subasta {{auctionTitle}} empieza en 24 horas',
      'en', 'Auction {{auctionTitle}} starts in 24 hours'
    ),
    'body', jsonb_build_object(
      'es', 'Hola **{{name}}**,

La subasta **{{auctionTitle}}** comienza el **{{startsAt}}**.

[Acceder a la subasta]({{auctionUrl}})

¡Prepárate!',
      'en', 'Hello **{{name}}**,

Auction **{{auctionTitle}}** starts on **{{startsAt}}**.

[Access auction]({{auctionUrl}})

Get ready!'
    ),
    'variables', jsonb_build_array('name', 'auctionTitle', 'auctionUrl', 'startsAt'),
    'category', 'dealer',
    'always_on', false,
    'enabled', true
  ),

  'dealer_auction_ended', jsonb_build_object(
    'subject', jsonb_build_object(
      'es', 'Subasta {{auctionTitle}} finalizada',
      'en', 'Auction {{auctionTitle}} ended'
    ),
    'body', jsonb_build_object(
      'es', 'Hola **{{name}}**,

La subasta **{{auctionTitle}}** ha finalizado.

- **Resultado:** {{result}}
- **Precio final:** {{finalPrice}}

Gracias por participar.',
      'en', 'Hello **{{name}}**,

Auction **{{auctionTitle}}** has ended.

- **Result:** {{result}}
- **Final price:** {{finalPrice}}

Thank you for participating.'
    ),
    'variables', jsonb_build_array('name', 'auctionTitle', 'result', 'finalPrice'),
    'category', 'dealer',
    'always_on', false,
    'enabled', true
  ),

  'dealer_new_article', jsonb_build_object(
    'subject', jsonb_build_object(
      'es', 'Nuevo artículo: {{articleTitle}}',
      'en', 'New article: {{articleTitle}}'
    ),
    'body', jsonb_build_object(
      'es', 'Hola **{{name}}**,

Hemos publicado un nuevo artículo que puede interesarte:

**[{{articleTitle}}]({{articleUrl}})**

Mantente informado sobre las últimas tendencias del sector.',
      'en', 'Hello **{{name}}**,

We have published a new article that may interest you:

**[{{articleTitle}}]({{articleUrl}})**

Stay informed about the latest industry trends.'
    ),
    'variables', jsonb_build_array('name', 'articleTitle', 'articleUrl'),
    'category', 'dealer',
    'always_on', false,
    'enabled', true
  ),

  -- ══════════════════════════════════════════════════════════════════════════════
  -- BUYER TEMPLATES (10)
  -- ══════════════════════════════════════════════════════════════════════════════

  'buyer_welcome', jsonb_build_object(
    'subject', jsonb_build_object(
      'es', 'Bienvenido a Tracciona - Encuentra tu vehículo ideal',
      'en', 'Welcome to Tracciona - Find your ideal vehicle'
    ),
    'body', jsonb_build_object(
      'es', 'Hola **{{name}}**,

¡Bienvenido a Tracciona! Tu cuenta ha sido creada correctamente.

[Buscar vehículos]({{searchUrl}})
[Mis favoritos]({{favoritesUrl}})

Empieza a explorar nuestro catálogo de vehículos industriales.',
      'en', 'Hello **{{name}}**,

Welcome to Tracciona! Your account has been successfully created.

[Search vehicles]({{searchUrl}})
[My favorites]({{favoritesUrl}})

Start exploring our industrial vehicle catalog.'
    ),
    'variables', jsonb_build_array('name', 'searchUrl', 'favoritesUrl'),
    'category', 'buyer',
    'always_on', false,
    'enabled', true
  ),

  'buyer_search_alert', jsonb_build_object(
    'subject', jsonb_build_object(
      'es', '{{vehicleCount}} nuevos vehículos coinciden con tu búsqueda',
      'en', '{{vehicleCount}} new vehicles match your search'
    ),
    'body', jsonb_build_object(
      'es', 'Hola **{{name}}**,

Hay **{{vehicleCount}} nuevos vehículos** que coinciden con tu alerta **{{alertName}}**.

[Ver resultados]({{searchUrl}})

No dejes pasar esta oportunidad.',
      'en', 'Hello **{{name}}**,

There are **{{vehicleCount}} new vehicles** matching your alert **{{alertName}}**.

[View results]({{searchUrl}})

Don''t miss this opportunity.'
    ),
    'variables', jsonb_build_array('name', 'alertName', 'vehicleCount', 'searchUrl'),
    'category', 'buyer',
    'always_on', false,
    'enabled', true
  ),

  'buyer_favorite_price_drop', jsonb_build_object(
    'subject', jsonb_build_object(
      'es', '¡Bajada de precio! {{vehicleTitle}}',
      'en', 'Price drop! {{vehicleTitle}}'
    ),
    'body', jsonb_build_object(
      'es', 'Hola **{{name}}**,

El precio de uno de tus favoritos ha bajado:

**{{vehicleTitle}}**
- Precio anterior: {{oldPrice}}
- Precio nuevo: **{{newPrice}}**

[Ver vehículo]({{vehicleUrl}})',
      'en', 'Hello **{{name}}**,

The price of one of your favorites has dropped:

**{{vehicleTitle}}**
- Old price: {{oldPrice}}
- New price: **{{newPrice}}**

[View vehicle]({{vehicleUrl}})'
    ),
    'variables', jsonb_build_array('name', 'vehicleTitle', 'oldPrice', 'newPrice', 'vehicleUrl'),
    'category', 'buyer',
    'always_on', false,
    'enabled', true
  ),

  'buyer_favorite_sold', jsonb_build_object(
    'subject', jsonb_build_object(
      'es', '{{vehicleTitle}} ha sido vendido',
      'en', '{{vehicleTitle}} has been sold'
    ),
    'body', jsonb_build_object(
      'es', 'Hola **{{name}}**,

Lamentablemente, **{{vehicleTitle}}** ha sido vendido.

[Ver vehículos similares]({{similarUrl}})

No te preocupes, tenemos más opciones que pueden interesarte.',
      'en', 'Hello **{{name}}**,

Unfortunately, **{{vehicleTitle}}** has been sold.

[View similar vehicles]({{similarUrl}})

Don''t worry, we have more options that may interest you.'
    ),
    'variables', jsonb_build_array('name', 'vehicleTitle', 'similarUrl'),
    'category', 'buyer',
    'always_on', false,
    'enabled', true
  ),

  'buyer_demand_confirmed', jsonb_build_object(
    'subject', jsonb_build_object(
      'es', 'Búsqueda confirmada: {{demandTitle}}',
      'en', 'Search confirmed: {{demandTitle}}'
    ),
    'body', jsonb_build_object(
      'es', 'Hola **{{name}}**,

Tu solicitud de búsqueda **{{demandTitle}}** ha sido confirmada.

Te notificaremos cuando encontremos vehículos que coincidan con tus criterios.',
      'en', 'Hello **{{name}}**,

Your search request **{{demandTitle}}** has been confirmed.

We will notify you when we find vehicles matching your criteria.'
    ),
    'variables', jsonb_build_array('name', 'demandTitle'),
    'category', 'buyer',
    'always_on', false,
    'enabled', true
  ),

  'buyer_demand_match', jsonb_build_object(
    'subject', jsonb_build_object(
      'es', 'Hemos encontrado {{vehicleTitle}} para ti',
      'en', 'We found {{vehicleTitle}} for you'
    ),
    'body', jsonb_build_object(
      'es', 'Hola **{{name}}**,

Hemos encontrado un vehículo que coincide con tu búsqueda:

**[{{vehicleTitle}}]({{vehicleUrl}})**
- **Coincidencia:** {{matchScore}}%

¡No lo dejes escapar!',
      'en', 'Hello **{{name}}**,

We found a vehicle matching your search:

**[{{vehicleTitle}}]({{vehicleUrl}})**
- **Match:** {{matchScore}}%

Don''t let it slip away!'
    ),
    'variables', jsonb_build_array('name', 'vehicleTitle', 'vehicleUrl', 'matchScore'),
    'category', 'buyer',
    'always_on', false,
    'enabled', true
  ),

  'buyer_bid_outbid', jsonb_build_object(
    'subject', jsonb_build_object(
      'es', 'Te han superado en {{auctionTitle}}',
      'en', 'You have been outbid on {{auctionTitle}}'
    ),
    'body', jsonb_build_object(
      'es', 'Hola **{{name}}**,

Han superado tu puja en **{{auctionTitle}}**.

- **Puja actual:** {{currentBid}}

[Hacer nueva puja]({{auctionUrl}})',
      'en', 'Hello **{{name}}**,

You have been outbid on **{{auctionTitle}}**.

- **Current bid:** {{currentBid}}

[Place new bid]({{auctionUrl}})'
    ),
    'variables', jsonb_build_array('name', 'auctionTitle', 'currentBid', 'auctionUrl'),
    'category', 'buyer',
    'always_on', false,
    'enabled', true
  ),

  'buyer_auction_won', jsonb_build_object(
    'subject', jsonb_build_object(
      'es', '¡Has ganado la subasta de {{auctionTitle}}!',
      'en', 'You won the auction for {{auctionTitle}}!'
    ),
    'body', jsonb_build_object(
      'es', 'Hola **{{name}}**,

¡Enhorabuena! Has ganado la subasta de **{{auctionTitle}}**.

- **Precio final:** {{finalPrice}}
- **Contacto del vendedor:** {{sellerContact}}

[Proceder al pago]({{paymentUrl}})',
      'en', 'Hello **{{name}}**,

Congratulations! You won the auction for **{{auctionTitle}}**.

- **Final price:** {{finalPrice}}
- **Seller contact:** {{sellerContact}}

[Proceed to payment]({{paymentUrl}})'
    ),
    'variables', jsonb_build_array('name', 'auctionTitle', 'finalPrice', 'sellerContact', 'paymentUrl'),
    'category', 'buyer',
    'always_on', false,
    'enabled', true
  ),

  'buyer_auction_lost', jsonb_build_object(
    'subject', jsonb_build_object(
      'es', 'Subasta finalizada: {{auctionTitle}}',
      'en', 'Auction ended: {{auctionTitle}}'
    ),
    'body', jsonb_build_object(
      'es', 'Hola **{{name}}**,

La subasta de **{{auctionTitle}}** ha finalizado.

- **Precio final:** {{finalPrice}}

[Ver vehículos similares]({{similarUrl}})',
      'en', 'Hello **{{name}}**,

The auction for **{{auctionTitle}}** has ended.

- **Final price:** {{finalPrice}}

[View similar vehicles]({{similarUrl}})'
    ),
    'variables', jsonb_build_array('name', 'auctionTitle', 'finalPrice', 'similarUrl'),
    'category', 'buyer',
    'always_on', false,
    'enabled', true
  ),

  'buyer_verification_available', jsonb_build_object(
    'subject', jsonb_build_object(
      'es', 'Nueva verificación disponible para {{vehicleTitle}}',
      'en', 'New verification available for {{vehicleTitle}}'
    ),
    'body', jsonb_build_object(
      'es', 'Hola **{{name}}**,

Hay una nueva verificación disponible para un vehículo que sigues:

**[{{vehicleTitle}}]({{vehicleUrl}})**
- **Nivel de verificación:** {{level}}

Consulta los detalles antes de tomar tu decisión.',
      'en', 'Hello **{{name}}**,

A new verification is available for a vehicle you follow:

**[{{vehicleTitle}}]({{vehicleUrl}})**
- **Verification level:** {{level}}

Check the details before making your decision.'
    ),
    'variables', jsonb_build_array('name', 'vehicleTitle', 'level', 'vehicleUrl'),
    'category', 'buyer',
    'always_on', false,
    'enabled', true
  ),

  -- ══════════════════════════════════════════════════════════════════════════════
  -- SYSTEM TEMPLATES (5)
  -- ══════════════════════════════════════════════════════════════════════════════

  'system_confirm_email', jsonb_build_object(
    'subject', jsonb_build_object(
      'es', 'Confirma tu dirección de correo electrónico',
      'en', 'Confirm your email address'
    ),
    'body', jsonb_build_object(
      'es', 'Hola **{{name}}**,

Por favor confirma tu dirección de correo electrónico haciendo clic en el siguiente enlace:

[Confirmar email]({{confirmUrl}})

Este enlace expira en 24 horas.',
      'en', 'Hello **{{name}}**,

Please confirm your email address by clicking the following link:

[Confirm email]({{confirmUrl}})

This link expires in 24 hours.'
    ),
    'variables', jsonb_build_array('name', 'confirmUrl'),
    'category', 'system',
    'always_on', true,
    'enabled', true
  ),

  'system_reset_password', jsonb_build_object(
    'subject', jsonb_build_object(
      'es', 'Restablece tu contraseña',
      'en', 'Reset your password'
    ),
    'body', jsonb_build_object(
      'es', 'Hola **{{name}}**,

Hemos recibido una solicitud para restablecer tu contraseña.

[Restablecer contraseña]({{resetUrl}})

Si no solicitaste este cambio, ignora este email. Este enlace expira en 1 hora.',
      'en', 'Hello **{{name}}**,

We received a request to reset your password.

[Reset password]({{resetUrl}})

If you did not request this change, ignore this email. This link expires in 1 hour.'
    ),
    'variables', jsonb_build_array('name', 'resetUrl'),
    'category', 'system',
    'always_on', true,
    'enabled', true
  ),

  'system_email_changed', jsonb_build_object(
    'subject', jsonb_build_object(
      'es', 'Tu dirección de correo ha sido actualizada',
      'en', 'Your email address has been updated'
    ),
    'body', jsonb_build_object(
      'es', 'Hola **{{name}}**,

Tu dirección de correo electrónico ha sido cambiada a **{{newEmail}}**.

Si no realizaste este cambio, contacta inmediatamente con nuestro soporte.',
      'en', 'Hello **{{name}}**,

Your email address has been changed to **{{newEmail}}**.

If you did not make this change, contact our support immediately.'
    ),
    'variables', jsonb_build_array('name', 'newEmail'),
    'category', 'system',
    'always_on', true,
    'enabled', true
  ),

  'system_account_deleted', jsonb_build_object(
    'subject', jsonb_build_object(
      'es', 'Tu cuenta ha sido eliminada',
      'en', 'Your account has been deleted'
    ),
    'body', jsonb_build_object(
      'es', 'Hola **{{name}}**,

Tu cuenta ha sido eliminada según tu solicitud. Todos tus datos han sido borrados de forma permanente.

Lamentamos verte partir. Si cambias de opinión, siempre puedes crear una nueva cuenta.',
      'en', 'Hello **{{name}}**,

Your account has been deleted as per your request. All your data has been permanently removed.

We are sorry to see you go. If you change your mind, you can always create a new account.'
    ),
    'variables', jsonb_build_array('name'),
    'category', 'system',
    'always_on', true,
    'enabled', true
  ),

  'system_suspicious_activity', jsonb_build_object(
    'subject', jsonb_build_object(
      'es', 'Actividad sospechosa detectada en tu cuenta',
      'en', 'Suspicious activity detected on your account'
    ),
    'body', jsonb_build_object(
      'es', 'Hola **{{name}}**,

Hemos detectado un inicio de sesión inusual en tu cuenta:

- **Dirección IP:** {{ipAddress}}
- **Ubicación:** {{location}}
- **Fecha:** {{date}}

Si fuiste tú, puedes ignorar este mensaje. Si no reconoces esta actividad, cambia tu contraseña inmediatamente.',
      'en', 'Hello **{{name}}**,

We detected an unusual login to your account:

- **IP address:** {{ipAddress}}
- **Location:** {{location}}
- **Date:** {{date}}

If this was you, you can ignore this message. If you don''t recognize this activity, change your password immediately.'
    ),
    'variables', jsonb_build_array('name', 'ipAddress', 'location', 'date'),
    'category', 'system',
    'always_on', true,
    'enabled', true
  )
)
WHERE vertical = 'tracciona';

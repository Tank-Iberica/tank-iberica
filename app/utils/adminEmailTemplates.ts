/**
 * Admin Email Templates — Static data & types
 * Types, template definitions (30), categories, and preview helpers.
 * Extracted from useAdminEmails.ts (Auditoría #7 Iter. 15)
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CategoryKey = 'dealers' | 'buyers' | 'system'

export interface TemplateDefinition {
  key: string
  category: CategoryKey
  variables: string[]
  defaultSubject: { es: string; en: string }
  defaultBody: { es: string; en: string }
}

export interface TemplateData {
  subject: { es: string; en: string }
  body: { es: string; en: string }
  active: boolean
}

export interface TemplateStats {
  sent: number
  opened: number
  clicked: number
}

export interface EmailCategory {
  key: CategoryKey
  labelKey: string
  icon: string
}

// ---------------------------------------------------------------------------
// Category definitions
// ---------------------------------------------------------------------------

export const CATEGORIES: EmailCategory[] = [
  { key: 'dealers', labelKey: 'admin.emails.catDealers', icon: 'building' },
  { key: 'buyers', labelKey: 'admin.emails.catBuyers', icon: 'users' },
  { key: 'system', labelKey: 'admin.emails.catSystem', icon: 'shield' },
]

// ---------------------------------------------------------------------------
// Template definitions (30 templates)
// ---------------------------------------------------------------------------

export const TEMPLATE_DEFINITIONS: TemplateDefinition[] = [
  // -- Dealers (B2B) -- 15 templates --
  {
    key: 'dealer_welcome',
    category: 'dealers',
    variables: ['{{dealer_name}}', '{{dealer_email}}', '{{site_name}}', '{{login_url}}'],
    defaultSubject: {
      es: 'Bienvenido a {{site_name}}, {{dealer_name}}',
      en: 'Welcome to {{site_name}}, {{dealer_name}}',
    },
    defaultBody: {
      es: `Hola **{{dealer_name}}**,\n\nTu cuenta de dealer ha sido creada correctamente en {{site_name}}.\n\nAccede a tu panel desde: [{{login_url}}]({{login_url}})\n\nSi tienes preguntas, responde a este correo.\n\nUn saludo,\nEl equipo de {{site_name}}`,
      en: `Hello **{{dealer_name}}**,\n\nYour dealer account has been created on {{site_name}}.\n\nAccess your dashboard: [{{login_url}}]({{login_url}})\n\nIf you have questions, reply to this email.\n\nBest regards,\nThe {{site_name}} team`,
    },
  },
  {
    key: 'lead_notification',
    category: 'dealers',
    variables: [
      '{{dealer_name}}',
      '{{vehicle_title}}',
      '{{lead_name}}',
      '{{lead_email}}',
      '{{lead_phone}}',
      '{{lead_message}}',
    ],
    defaultSubject: {
      es: 'Nuevo lead para {{vehicle_title}}',
      en: 'New lead for {{vehicle_title}}',
    },
    defaultBody: {
      es: `Hola **{{dealer_name}}**,\n\nHas recibido una consulta sobre **{{vehicle_title}}**.\n\n- **Nombre:** {{lead_name}}\n- **Email:** {{lead_email}}\n- **Telefono:** {{lead_phone}}\n- **Mensaje:** {{lead_message}}\n\nResponde lo antes posible para maximizar la conversion.`,
      en: `Hello **{{dealer_name}}**,\n\nYou have received an enquiry about **{{vehicle_title}}**.\n\n- **Name:** {{lead_name}}\n- **Email:** {{lead_email}}\n- **Phone:** {{lead_phone}}\n- **Message:** {{lead_message}}\n\nReply promptly to maximize conversion.`,
    },
  },
  {
    key: 'vehicle_published',
    category: 'dealers',
    variables: ['{{dealer_name}}', '{{vehicle_title}}', '{{vehicle_url}}', '{{vehicle_price}}'],
    defaultSubject: {
      es: 'Tu vehiculo {{vehicle_title}} ha sido publicado',
      en: 'Your vehicle {{vehicle_title}} has been published',
    },
    defaultBody: {
      es: `Hola **{{dealer_name}}**,\n\nTu vehiculo **{{vehicle_title}}** ya esta visible en el catalogo.\n\n- **Precio:** {{vehicle_price}}\n- **URL:** [Ver vehiculo]({{vehicle_url}})\n\nComparte el enlace en tus redes para conseguir mas visibilidad.`,
      en: `Hello **{{dealer_name}}**,\n\nYour vehicle **{{vehicle_title}}** is now live in the catalogue.\n\n- **Price:** {{vehicle_price}}\n- **URL:** [View vehicle]({{vehicle_url}})\n\nShare the link on your social media for more visibility.`,
    },
  },
  {
    key: 'vehicle_sold',
    category: 'dealers',
    variables: [
      '{{dealer_name}}',
      '{{vehicle_title}}',
      '{{sale_price}}',
      '{{days_listed}}',
      '{{total_views}}',
      '{{total_leads}}',
    ],
    defaultSubject: {
      es: '{{vehicle_title}} marcado como vendido',
      en: '{{vehicle_title}} marked as sold',
    },
    defaultBody: {
      es: `Hola **{{dealer_name}}**,\n\n**{{vehicle_title}}** se ha marcado como vendido. Aqui van las estadisticas:\n\n- **Precio final:** {{sale_price}}\n- **Dias publicado:** {{days_listed}}\n- **Visitas totales:** {{total_views}}\n- **Leads recibidos:** {{total_leads}}\n\nGracias por confiar en nuestra plataforma.`,
      en: `Hello **{{dealer_name}}**,\n\n**{{vehicle_title}}** has been marked as sold. Here are the stats:\n\n- **Final price:** {{sale_price}}\n- **Days listed:** {{days_listed}}\n- **Total views:** {{total_views}}\n- **Leads received:** {{total_leads}}\n\nThank you for trusting our platform.`,
    },
  },
  {
    key: 'weekly_stats',
    category: 'dealers',
    variables: [
      '{{dealer_name}}',
      '{{total_views}}',
      '{{total_leads}}',
      '{{top_vehicle}}',
      '{{period}}',
    ],
    defaultSubject: {
      es: 'Resumen semanal — {{period}}',
      en: 'Weekly summary — {{period}}',
    },
    defaultBody: {
      es: `Hola **{{dealer_name}}**,\n\nResumen de la semana **{{period}}**:\n\n- **Visitas totales:** {{total_views}}\n- **Leads recibidos:** {{total_leads}}\n- **Vehiculo destacado:** {{top_vehicle}}\n\nSigue publicando para aumentar tu visibilidad.`,
      en: `Hello **{{dealer_name}}**,\n\nWeekly summary for **{{period}}**:\n\n- **Total views:** {{total_views}}\n- **Leads received:** {{total_leads}}\n- **Top vehicle:** {{top_vehicle}}\n\nKeep publishing to increase visibility.`,
    },
  },
  {
    key: 'monthly_stats',
    category: 'dealers',
    variables: [
      '{{dealer_name}}',
      '{{month}}',
      '{{total_views}}',
      '{{total_leads}}',
      '{{total_sales}}',
      '{{top_vehicle}}',
    ],
    defaultSubject: {
      es: 'Resumen mensual — {{month}}',
      en: 'Monthly summary — {{month}}',
    },
    defaultBody: {
      es: `Hola **{{dealer_name}}**,\n\nEstadisticas del mes **{{month}}**:\n\n- **Visitas totales:** {{total_views}}\n- **Leads recibidos:** {{total_leads}}\n- **Ventas:** {{total_sales}}\n- **Vehiculo estrella:** {{top_vehicle}}\n\nSigue asi.`,
      en: `Hello **{{dealer_name}}**,\n\nStats for **{{month}}**:\n\n- **Total views:** {{total_views}}\n- **Leads received:** {{total_leads}}\n- **Sales:** {{total_sales}}\n- **Top vehicle:** {{top_vehicle}}\n\nKeep it up!`,
    },
  },
  {
    key: 'subscription_activated',
    category: 'dealers',
    variables: ['{{dealer_name}}', '{{plan_name}}', '{{next_billing_date}}', '{{amount}}'],
    defaultSubject: {
      es: 'Suscripcion {{plan_name}} activada',
      en: '{{plan_name}} subscription activated',
    },
    defaultBody: {
      es: `Hola **{{dealer_name}}**,\n\nTu suscripcion **{{plan_name}}** ha sido activada correctamente.\n\n- **Proximo cobro:** {{next_billing_date}}\n- **Importe:** {{amount}}\n\nYa puedes disfrutar de todas las ventajas de tu plan.`,
      en: `Hello **{{dealer_name}}**,\n\nYour **{{plan_name}}** subscription has been activated.\n\n- **Next billing date:** {{next_billing_date}}\n- **Amount:** {{amount}}\n\nYou can now enjoy all the benefits of your plan.`,
    },
  },
  {
    key: 'subscription_expiring',
    category: 'dealers',
    variables: ['{{dealer_name}}', '{{plan_name}}', '{{expiry_date}}', '{{renewal_url}}'],
    defaultSubject: {
      es: 'Tu suscripcion {{plan_name}} vence en 7 dias',
      en: 'Your {{plan_name}} subscription expires in 7 days',
    },
    defaultBody: {
      es: `Hola **{{dealer_name}}**,\n\nTu suscripcion **{{plan_name}}** vence el **{{expiry_date}}**.\n\nPara no perder las ventajas, renueva aqui: [Renovar]({{renewal_url}})\n\nSi no renuevas, tus vehiculos perderan el boost de prioridad.`,
      en: `Hello **{{dealer_name}}**,\n\nYour **{{plan_name}}** subscription expires on **{{expiry_date}}**.\n\nTo keep your benefits, renew here: [Renew]({{renewal_url}})\n\nIf you don't renew, your vehicles will lose priority boost.`,
    },
  },
  {
    key: 'payment_failed',
    category: 'dealers',
    variables: [
      '{{dealer_name}}',
      '{{plan_name}}',
      '{{amount}}',
      '{{retry_date}}',
      '{{update_payment_url}}',
    ],
    defaultSubject: {
      es: 'Pago fallido — Suscripcion {{plan_name}}',
      en: 'Payment failed — {{plan_name}} subscription',
    },
    defaultBody: {
      es: `Hola **{{dealer_name}}**,\n\nNo hemos podido cobrar **{{amount}}** por tu suscripcion **{{plan_name}}**.\n\nReintentaremos el **{{retry_date}}**. Actualiza tu metodo de pago: [Actualizar]({{update_payment_url}})\n\nSi tienes dudas, contactanos.`,
      en: `Hello **{{dealer_name}}**,\n\nWe could not charge **{{amount}}** for your **{{plan_name}}** subscription.\n\nWe'll retry on **{{retry_date}}**. Update your payment method: [Update]({{update_payment_url}})\n\nIf you have questions, contact us.`,
    },
  },
  {
    key: 'subscription_cancelled',
    category: 'dealers',
    variables: ['{{dealer_name}}', '{{plan_name}}', '{{effective_date}}'],
    defaultSubject: {
      es: 'Suscripcion {{plan_name}} cancelada',
      en: '{{plan_name}} subscription cancelled',
    },
    defaultBody: {
      es: `Hola **{{dealer_name}}**,\n\nTu suscripcion **{{plan_name}}** ha sido cancelada.\n\nTu plan seguira activo hasta el **{{effective_date}}**.\n\nSi cambias de opinion, puedes reactivarla desde tu panel.`,
      en: `Hello **{{dealer_name}}**,\n\nYour **{{plan_name}}** subscription has been cancelled.\n\nYour plan remains active until **{{effective_date}}**.\n\nIf you change your mind, you can reactivate it from your dashboard.`,
    },
  },
  {
    key: 'verification_completed',
    category: 'dealers',
    variables: [
      '{{dealer_name}}',
      '{{vehicle_title}}',
      '{{verification_level}}',
      '{{vehicle_url}}',
    ],
    defaultSubject: {
      es: 'Verificacion completada — {{vehicle_title}}',
      en: 'Verification completed — {{vehicle_title}}',
    },
    defaultBody: {
      es: `Hola **{{dealer_name}}**,\n\nLa verificacion de **{{vehicle_title}}** ha sido completada.\n\n- **Nivel alcanzado:** {{verification_level}}\n- **Ver vehiculo:** [{{vehicle_url}}]({{vehicle_url}})\n\nLos vehiculos verificados reciben hasta un 40% mas de leads.`,
      en: `Hello **{{dealer_name}}**,\n\nVerification for **{{vehicle_title}}** is complete.\n\n- **Level achieved:** {{verification_level}}\n- **View vehicle:** [{{vehicle_url}}]({{vehicle_url}})\n\nVerified vehicles receive up to 40% more leads.`,
    },
  },
  {
    key: 'auction_registered',
    category: 'dealers',
    variables: ['{{dealer_name}}', '{{auction_title}}', '{{auction_url}}', '{{start_date}}'],
    defaultSubject: {
      es: 'Registro en subasta confirmado — {{auction_title}}',
      en: 'Auction registration confirmed — {{auction_title}}',
    },
    defaultBody: {
      es: `Hola **{{dealer_name}}**,\n\nTu registro en la subasta **{{auction_title}}** ha sido confirmado.\n\n- **Inicio:** {{start_date}}\n- **Ver subasta:** [{{auction_url}}]({{auction_url}})\n\nTe notificaremos cuando la subasta este a punto de comenzar.`,
      en: `Hello **{{dealer_name}}**,\n\nYour registration for the auction **{{auction_title}}** has been confirmed.\n\n- **Starts:** {{start_date}}\n- **View auction:** [{{auction_url}}]({{auction_url}})\n\nWe'll notify you when it's about to start.`,
    },
  },
  {
    key: 'auction_starting',
    category: 'dealers',
    variables: [
      '{{dealer_name}}',
      '{{auction_title}}',
      '{{auction_url}}',
      '{{start_date}}',
      '{{end_date}}',
    ],
    defaultSubject: {
      es: 'Subasta comienza en 24h — {{auction_title}}',
      en: 'Auction starts in 24h — {{auction_title}}',
    },
    defaultBody: {
      es: `Hola **{{dealer_name}}**,\n\nLa subasta **{{auction_title}}** comienza manana.\n\n- **Inicio:** {{start_date}}\n- **Fin:** {{end_date}}\n- **Participar:** [{{auction_url}}]({{auction_url}})\n\nPrepara tu estrategia de puja.`,
      en: `Hello **{{dealer_name}}**,\n\nThe auction **{{auction_title}}** starts tomorrow.\n\n- **Starts:** {{start_date}}\n- **Ends:** {{end_date}}\n- **Bid now:** [{{auction_url}}]({{auction_url}})\n\nPrepare your bidding strategy.`,
    },
  },
  {
    key: 'auction_ended',
    category: 'dealers',
    variables: [
      '{{dealer_name}}',
      '{{auction_title}}',
      '{{winning_bid}}',
      '{{total_bids}}',
      '{{total_bidders}}',
    ],
    defaultSubject: {
      es: 'Subasta finalizada — {{auction_title}}',
      en: 'Auction ended — {{auction_title}}',
    },
    defaultBody: {
      es: `Hola **{{dealer_name}}**,\n\nLa subasta **{{auction_title}}** ha finalizado.\n\n- **Puja ganadora:** {{winning_bid}}\n- **Pujas totales:** {{total_bids}}\n- **Participantes:** {{total_bidders}}\n\nConsulta los detalles en tu panel de administracion.`,
      en: `Hello **{{dealer_name}}**,\n\nThe auction **{{auction_title}}** has ended.\n\n- **Winning bid:** {{winning_bid}}\n- **Total bids:** {{total_bids}}\n- **Participants:** {{total_bidders}}\n\nCheck the details in your admin dashboard.`,
    },
  },
  {
    key: 'new_article_sector',
    category: 'dealers',
    variables: ['{{dealer_name}}', '{{article_title}}', '{{article_url}}', '{{article_summary}}'],
    defaultSubject: {
      es: 'Nuevo articulo: {{article_title}}',
      en: 'New article: {{article_title}}',
    },
    defaultBody: {
      es: `Hola **{{dealer_name}}**,\n\nHemos publicado un nuevo articulo relevante para tu sector:\n\n**{{article_title}}**\n\n{{article_summary}}\n\n[Leer articulo completo]({{article_url}})`,
      en: `Hello **{{dealer_name}}**,\n\nWe have published a new article relevant to your sector:\n\n**{{article_title}}**\n\n{{article_summary}}\n\n[Read full article]({{article_url}})`,
    },
  },

  // -- Compradores (B2B/B2C) -- 10 templates --
  {
    key: 'buyer_welcome',
    category: 'buyers',
    variables: ['{{buyer_name}}', '{{site_name}}', '{{search_url}}'],
    defaultSubject: {
      es: 'Bienvenido a {{site_name}}, {{buyer_name}}',
      en: 'Welcome to {{site_name}}, {{buyer_name}}',
    },
    defaultBody: {
      es: `Hola **{{buyer_name}}**,\n\nBienvenido a {{site_name}}. Ya puedes buscar entre cientos de vehiculos industriales.\n\n[Explorar catalogo]({{search_url}})\n\nActiva alertas de busqueda para no perderte ninguna oportunidad.`,
      en: `Hello **{{buyer_name}}**,\n\nWelcome to {{site_name}}. You can now browse hundreds of industrial vehicles.\n\n[Explore catalogue]({{search_url}})\n\nSet up search alerts so you never miss an opportunity.`,
    },
  },
  {
    key: 'search_alert_match',
    category: 'buyers',
    variables: ['{{buyer_name}}', '{{alert_name}}', '{{match_count}}', '{{results_url}}'],
    defaultSubject: {
      es: '{{match_count}} nuevos vehiculos para tu alerta "{{alert_name}}"',
      en: '{{match_count}} new vehicles for your alert "{{alert_name}}"',
    },
    defaultBody: {
      es: `Hola **{{buyer_name}}**,\n\nHay **{{match_count}}** vehiculos nuevos que coinciden con tu alerta **{{alert_name}}**.\n\n[Ver resultados]({{results_url}})\n\nLos mejores vehiculos se venden rapido, no esperes demasiado.`,
      en: `Hello **{{buyer_name}}**,\n\nThere are **{{match_count}}** new vehicles matching your alert **{{alert_name}}**.\n\n[View results]({{results_url}})\n\nThe best vehicles sell fast — don't wait too long.`,
    },
  },
  {
    key: 'favorite_price_change',
    category: 'buyers',
    variables: [
      '{{buyer_name}}',
      '{{vehicle_title}}',
      '{{old_price}}',
      '{{new_price}}',
      '{{vehicle_url}}',
    ],
    defaultSubject: {
      es: 'Cambio de precio en tu favorito: {{vehicle_title}}',
      en: 'Price change on your favourite: {{vehicle_title}}',
    },
    defaultBody: {
      es: `Hola **{{buyer_name}}**,\n\nEl vehiculo **{{vehicle_title}}** que tienes en favoritos ha cambiado de precio.\n\n- **Antes:** {{old_price}}\n- **Ahora:** {{new_price}}\n\n[Ver vehiculo]({{vehicle_url}})`,
      en: `Hello **{{buyer_name}}**,\n\nThe vehicle **{{vehicle_title}}** in your favourites has a new price.\n\n- **Was:** {{old_price}}\n- **Now:** {{new_price}}\n\n[View vehicle]({{vehicle_url}})`,
    },
  },
  {
    key: 'favorite_sold',
    category: 'buyers',
    variables: ['{{buyer_name}}', '{{vehicle_title}}', '{{similar_url}}'],
    defaultSubject: {
      es: 'Tu favorito {{vehicle_title}} se ha vendido',
      en: 'Your favourite {{vehicle_title}} has been sold',
    },
    defaultBody: {
      es: `Hola **{{buyer_name}}**,\n\nEl vehiculo **{{vehicle_title}}** que tenias en favoritos se ha vendido.\n\nPero tenemos vehiculos similares que te pueden interesar:\n\n[Ver similares]({{similar_url}})`,
      en: `Hello **{{buyer_name}}**,\n\nThe vehicle **{{vehicle_title}}** from your favourites has been sold.\n\nBut we have similar vehicles you may like:\n\n[View similar]({{similar_url}})`,
    },
  },
  {
    key: 'demand_confirmed',
    category: 'buyers',
    variables: ['{{buyer_name}}', '{{demand_summary}}', '{{demand_id}}'],
    defaultSubject: {
      es: 'Solicitud de busqueda confirmada (#{{demand_id}})',
      en: 'Search request confirmed (#{{demand_id}})',
    },
    defaultBody: {
      es: `Hola **{{buyer_name}}**,\n\nHemos registrado tu solicitud de busqueda:\n\n{{demand_summary}}\n\nReferencia: **#{{demand_id}}**\n\nNuestro equipo te avisara cuando encontremos vehiculos que coincidan.`,
      en: `Hello **{{buyer_name}}**,\n\nWe have registered your search request:\n\n{{demand_summary}}\n\nReference: **#{{demand_id}}**\n\nOur team will notify you when we find matching vehicles.`,
    },
  },
  {
    key: 'demand_match',
    category: 'buyers',
    variables: ['{{buyer_name}}', '{{demand_id}}', '{{match_count}}', '{{results_url}}'],
    defaultSubject: {
      es: '{{match_count}} vehiculos encontrados para tu solicitud #{{demand_id}}',
      en: '{{match_count}} vehicles found for your request #{{demand_id}}',
    },
    defaultBody: {
      es: `Hola **{{buyer_name}}**,\n\nHemos encontrado **{{match_count}}** vehiculos que coinciden con tu solicitud **#{{demand_id}}**.\n\n[Ver vehiculos]({{results_url}})\n\nContacta directamente con los vendedores desde la plataforma.`,
      en: `Hello **{{buyer_name}}**,\n\nWe found **{{match_count}}** vehicles matching your request **#{{demand_id}}**.\n\n[View vehicles]({{results_url}})\n\nContact sellers directly through the platform.`,
    },
  },
  {
    key: 'auction_outbid',
    category: 'buyers',
    variables: [
      '{{buyer_name}}',
      '{{auction_title}}',
      '{{current_bid}}',
      '{{your_bid}}',
      '{{auction_url}}',
    ],
    defaultSubject: {
      es: 'Puja superada en {{auction_title}}',
      en: 'You have been outbid on {{auction_title}}',
    },
    defaultBody: {
      es: `Hola **{{buyer_name}}**,\n\nTu puja de **{{your_bid}}** en **{{auction_title}}** ha sido superada.\n\n- **Puja actual:** {{current_bid}}\n\n[Pujar de nuevo]({{auction_url}})`,
      en: `Hello **{{buyer_name}}**,\n\nYour bid of **{{your_bid}}** on **{{auction_title}}** has been outbid.\n\n- **Current bid:** {{current_bid}}\n\n[Bid again]({{auction_url}})`,
    },
  },
  {
    key: 'auction_won',
    category: 'buyers',
    variables: ['{{buyer_name}}', '{{auction_title}}', '{{winning_bid}}', '{{next_steps_url}}'],
    defaultSubject: {
      es: 'Has ganado la subasta {{auction_title}}',
      en: 'You won the auction {{auction_title}}',
    },
    defaultBody: {
      es: `Hola **{{buyer_name}}**,\n\nEnhorabuena, has ganado la subasta **{{auction_title}}** con una puja de **{{winning_bid}}**.\n\n[Siguientes pasos]({{next_steps_url}})\n\nNos pondremos en contacto contigo para formalizar la compra.`,
      en: `Hello **{{buyer_name}}**,\n\nCongratulations! You won the auction **{{auction_title}}** with a bid of **{{winning_bid}}**.\n\n[Next steps]({{next_steps_url}})\n\nWe'll contact you to finalize the purchase.`,
    },
  },
  {
    key: 'auction_lost',
    category: 'buyers',
    variables: ['{{buyer_name}}', '{{auction_title}}', '{{winning_bid}}', '{{similar_url}}'],
    defaultSubject: {
      es: 'Subasta finalizada — {{auction_title}}',
      en: 'Auction ended — {{auction_title}}',
    },
    defaultBody: {
      es: `Hola **{{buyer_name}}**,\n\nLa subasta **{{auction_title}}** ha finalizado y tu puja no resulto ganadora.\n\n- **Puja ganadora:** {{winning_bid}}\n\nPero hay vehiculos similares disponibles: [Ver similares]({{similar_url}})`,
      en: `Hello **{{buyer_name}}**,\n\nThe auction **{{auction_title}}** has ended and your bid was not the winner.\n\n- **Winning bid:** {{winning_bid}}\n\nBut there are similar vehicles available: [View similar]({{similar_url}})`,
    },
  },
  {
    key: 'verification_available',
    category: 'buyers',
    variables: ['{{buyer_name}}', '{{vehicle_title}}', '{{verification_level}}', '{{vehicle_url}}'],
    defaultSubject: {
      es: 'Verificacion disponible para {{vehicle_title}}',
      en: 'Verification available for {{vehicle_title}}',
    },
    defaultBody: {
      es: `Hola **{{buyer_name}}**,\n\nEl vehiculo **{{vehicle_title}}** que sigues ahora tiene verificacion **{{verification_level}}**.\n\n[Ver vehiculo verificado]({{vehicle_url}})\n\nLos vehiculos verificados tienen garantia de datos fiables.`,
      en: `Hello **{{buyer_name}}**,\n\nThe vehicle **{{vehicle_title}}** you follow now has **{{verification_level}}** verification.\n\n[View verified vehicle]({{vehicle_url}})\n\nVerified vehicles guarantee reliable data.`,
    },
  },

  // -- Sistema -- 5 templates --
  {
    key: 'confirm_email',
    category: 'system',
    variables: ['{{user_name}}', '{{confirmation_url}}', '{{site_name}}'],
    defaultSubject: {
      es: 'Confirma tu email en {{site_name}}',
      en: 'Confirm your email on {{site_name}}',
    },
    defaultBody: {
      es: `Hola **{{user_name}}**,\n\nPara completar tu registro, confirma tu email:\n\n[Confirmar email]({{confirmation_url}})\n\nEste enlace expira en 24 horas.\n\nSi no solicitaste este registro, ignora este correo.`,
      en: `Hello **{{user_name}}**,\n\nTo complete your registration, confirm your email:\n\n[Confirm email]({{confirmation_url}})\n\nThis link expires in 24 hours.\n\nIf you did not request this, ignore this email.`,
    },
  },
  {
    key: 'reset_password',
    category: 'system',
    variables: ['{{user_name}}', '{{reset_url}}', '{{site_name}}'],
    defaultSubject: {
      es: 'Restablecer contrasena — {{site_name}}',
      en: 'Reset password — {{site_name}}',
    },
    defaultBody: {
      es: `Hola **{{user_name}}**,\n\nHemos recibido una solicitud para restablecer tu contrasena.\n\n[Restablecer contrasena]({{reset_url}})\n\nEste enlace expira en 1 hora. Si no fuiste tu, ignora este correo.`,
      en: `Hello **{{user_name}}**,\n\nWe received a request to reset your password.\n\n[Reset password]({{reset_url}})\n\nThis link expires in 1 hour. If it wasn't you, ignore this email.`,
    },
  },
  {
    key: 'email_changed',
    category: 'system',
    variables: ['{{user_name}}', '{{old_email}}', '{{new_email}}', '{{site_name}}'],
    defaultSubject: {
      es: 'Email actualizado en {{site_name}}',
      en: 'Email updated on {{site_name}}',
    },
    defaultBody: {
      es: `Hola **{{user_name}}**,\n\nTu email ha sido cambiado:\n\n- **Anterior:** {{old_email}}\n- **Nuevo:** {{new_email}}\n\nSi no realizaste este cambio, contactanos inmediatamente.`,
      en: `Hello **{{user_name}}**,\n\nYour email has been changed:\n\n- **Previous:** {{old_email}}\n- **New:** {{new_email}}\n\nIf you did not make this change, contact us immediately.`,
    },
  },
  {
    key: 'account_deleted',
    category: 'system',
    variables: ['{{user_name}}', '{{deletion_date}}', '{{site_name}}'],
    defaultSubject: {
      es: 'Cuenta eliminada — {{site_name}}',
      en: 'Account deleted — {{site_name}}',
    },
    defaultBody: {
      es: `Hola **{{user_name}}**,\n\nTu cuenta ha sido eliminada el **{{deletion_date}}** conforme a la normativa RGPD.\n\nTodos tus datos personales han sido borrados.\n\nSi deseas volver, siempre puedes crear una cuenta nueva.`,
      en: `Hello **{{user_name}}**,\n\nYour account was deleted on **{{deletion_date}}** in compliance with GDPR.\n\nAll your personal data has been erased.\n\nIf you wish to return, you can always create a new account.`,
    },
  },
  {
    key: 'suspicious_activity',
    category: 'system',
    variables: [
      '{{user_name}}',
      '{{activity_description}}',
      '{{ip_address}}',
      '{{timestamp}}',
      '{{site_name}}',
    ],
    defaultSubject: {
      es: 'Actividad sospechosa detectada — {{site_name}}',
      en: 'Suspicious activity detected — {{site_name}}',
    },
    defaultBody: {
      es: `Hola **{{user_name}}**,\n\nHemos detectado actividad sospechosa en tu cuenta:\n\n- **Actividad:** {{activity_description}}\n- **IP:** {{ip_address}}\n- **Fecha:** {{timestamp}}\n\nSi no fuiste tu, cambia tu contrasena inmediatamente y contactanos.`,
      en: `Hello **{{user_name}}**,\n\nWe detected suspicious activity on your account:\n\n- **Activity:** {{activity_description}}\n- **IP:** {{ip_address}}\n- **Date:** {{timestamp}}\n\nIf this wasn't you, change your password immediately and contact us.`,
    },
  },
]

// ---------------------------------------------------------------------------
// Helpers (used by previewHtml computed and sendTest)
// ---------------------------------------------------------------------------

export function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function getSampleValue(varName: string): string {
  const samples: Record<string, string> = {
    dealer_name: 'TransMotor S.L.',
    dealer_email: 'info@transmotor.es',
    site_name: 'Tracciona',
    login_url: 'https://tracciona.com/login',
    vehicle_title: 'Schmitz Cargobull SCB S3T 2022',
    vehicle_url: 'https://tracciona.com/vehiculo/schmitz-scb-s3t-2022',
    vehicle_price: '42.500 EUR',
    lead_name: 'Carlos Martinez',
    lead_email: 'carlos@example.com',
    lead_phone: '+34 612 345 678',
    lead_message: 'Me interesa este vehiculo, esta disponible?',
    sale_price: '41.000 EUR',
    days_listed: '23',
    total_views: '1.247',
    total_leads: '18',
    total_sales: '3',
    top_vehicle: 'Schmitz Cargobull SCB S3T 2022',
    period: '10-16 Feb 2026',
    month: 'Enero 2026',
    plan_name: 'Premium',
    next_billing_date: '15/03/2026',
    amount: '149 EUR',
    expiry_date: '22/02/2026',
    renewal_url: 'https://tracciona.com/mi-cuenta/suscripcion',
    retry_date: '18/02/2026',
    update_payment_url: 'https://tracciona.com/mi-cuenta/pago',
    effective_date: '28/02/2026',
    verification_level: 'Verificado',
    auction_title: 'Subasta Cisterna ADR Febrero 2026',
    auction_url: 'https://tracciona.com/subastas/cisterna-adr-feb-2026',
    start_date: '20/02/2026 10:00',
    end_date: '22/02/2026 18:00',
    winning_bid: '38.500 EUR',
    total_bids: '12',
    total_bidders: '5',
    article_title: 'Nuevas normativas ADR 2026',
    article_url: 'https://tracciona.com/noticias/normativas-adr-2026',
    article_summary: 'Las nuevas normativas ADR que entran en vigor...',
    buyer_name: 'Ana Lopez',
    search_url: 'https://tracciona.com/catalogo',
    alert_name: 'Cisternas > 30.000L',
    match_count: '4',
    results_url: 'https://tracciona.com/catalogo?alert=123',
    old_price: '45.000 EUR',
    new_price: '42.500 EUR',
    similar_url: 'https://tracciona.com/catalogo?similar=abc',
    demand_summary: 'Cisterna ADR 30.000L, max 5 anos, < 50.000 EUR',
    demand_id: 'DEM-2026-0042',
    current_bid: '35.000 EUR',
    your_bid: '33.000 EUR',
    next_steps_url: 'https://tracciona.com/subastas/ganador/abc',
    user_name: 'Usuario',
    confirmation_url: 'https://tracciona.com/confirmar?token=abc123',
    reset_url: 'https://tracciona.com/reset?token=abc123',
    old_email: 'antiguo@example.com',
    new_email: 'nuevo@example.com',
    deletion_date: '20/02/2026',
    activity_description: 'Intento de inicio de sesion desde ubicacion inusual',
    ip_address: '203.0.113.42',
    timestamp: '20/02/2026 14:32 UTC',
  }
  return samples[varName] || `[${varName}]`
}

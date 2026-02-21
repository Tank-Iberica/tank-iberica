<script setup lang="ts">
import { useAdminVerticalConfig } from '~/composables/admin/useAdminVerticalConfig'

definePageMeta({
  layout: 'admin',
  middleware: ['auth', 'admin'],
})

const { t } = useI18n()
const supabase = useSupabaseClient()
const user = useSupabaseUser()
const {
  config: _config,
  loading,
  saving,
  error,
  saved,
  loadConfig,
  saveFields,
} = useAdminVerticalConfig()

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CategoryKey = 'dealers' | 'buyers' | 'system'

interface TemplateDefinition {
  key: string
  category: CategoryKey
  variables: string[]
  defaultSubject: { es: string; en: string }
  defaultBody: { es: string; en: string }
}

interface TemplateData {
  subject: { es: string; en: string }
  body: { es: string; en: string }
  active: boolean
}

interface TemplateStats {
  sent: number
  opened: number
  clicked: number
}

// ---------------------------------------------------------------------------
// Template definitions (30 templates)
// ---------------------------------------------------------------------------

const TEMPLATE_DEFINITIONS: TemplateDefinition[] = [
  // ── Dealers (B2B) — 15 templates ──
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

  // ── Compradores (B2B/B2C) — 10 templates ──
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

  // ── Sistema — 5 templates ──
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
// Category definitions
// ---------------------------------------------------------------------------

const CATEGORIES: { key: CategoryKey; labelKey: string; icon: string }[] = [
  { key: 'dealers', labelKey: 'admin.emails.catDealers', icon: 'building' },
  { key: 'buyers', labelKey: 'admin.emails.catBuyers', icon: 'users' },
  { key: 'system', labelKey: 'admin.emails.catSystem', icon: 'shield' },
]

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

const activeCategory = ref<CategoryKey>('dealers')
const selectedTemplateKey = ref<string>('dealer_welcome')
const activeLang = ref<'es' | 'en'>('es')
const templates = ref<Record<string, TemplateData>>({})
const templateStats = ref<Record<string, TemplateStats>>({})
const showPreview = ref(false)
const sendingTest = ref(false)
const testSent = ref(false)
const loadingStats = ref(false)

// ---------------------------------------------------------------------------
// Computed
// ---------------------------------------------------------------------------

const filteredTemplates = computed(() =>
  TEMPLATE_DEFINITIONS.filter((td) => td.category === activeCategory.value),
)

const selectedDefinition = computed(() =>
  TEMPLATE_DEFINITIONS.find((td) => td.key === selectedTemplateKey.value),
)

const currentTemplate = computed(() => templates.value[selectedTemplateKey.value])

const currentStats = computed(
  () => templateStats.value[selectedTemplateKey.value] || { sent: 0, opened: 0, clicked: 0 },
)

const openRate = computed(() => {
  const s = currentStats.value
  if (s.sent === 0) return '0'
  return ((s.opened / s.sent) * 100).toFixed(1)
})

const clickRate = computed(() => {
  const s = currentStats.value
  if (s.sent === 0) return '0'
  return ((s.clicked / s.sent) * 100).toFixed(1)
})

const previewHtml = computed(() => {
  if (!currentTemplate.value || !selectedDefinition.value) return ''
  let body = currentTemplate.value.body[activeLang.value] || ''
  const subject = currentTemplate.value.subject[activeLang.value] || ''

  // Replace variables with sample data
  for (const v of selectedDefinition.value.variables) {
    const varName = v.replace(/\{\{|\}\}/g, '')
    const sampleValue = getSampleValue(varName)
    body = body.replace(new RegExp(escapeRegex(v), 'g'), sampleValue)
  }

  // Simple markdown-to-html conversion
  let html = body
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" style="color:#23424A;">$1</a>')
    .replace(/^- (.*)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, (m) => `<ul>${m}</ul>`)
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>')

  html = `<p>${html}</p>`

  const subjectRendered = selectedDefinition.value.variables.reduce(
    (s, v) =>
      s.replace(new RegExp(escapeRegex(v), 'g'), getSampleValue(v.replace(/\{\{|\}\}/g, ''))),
    subject,
  )

  return `
    <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#fff;border:1px solid #e5e7eb;border-radius:8px;">
      <div style="background:#23424A;color:#fff;padding:16px 24px;border-radius:8px 8px 0 0;margin:-24px -24px 24px;">
        <strong>Tracciona</strong>
      </div>
      <div style="margin-bottom:16px;padding-bottom:16px;border-bottom:1px solid #e5e7eb;">
        <span style="font-size:0.85rem;color:#6b7280;">${t('admin.emails.subject')}:</span><br>
        <strong>${subjectRendered}</strong>
      </div>
      <div style="line-height:1.6;color:#374151;font-size:0.95rem;">
        ${html}
      </div>
      <div style="margin-top:32px;padding-top:16px;border-top:1px solid #e5e7eb;font-size:0.8rem;color:#9ca3af;text-align:center;">
        Tracciona — Marketplace de vehiculos industriales
      </div>
    </div>
  `
})

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function getSampleValue(varName: string): string {
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

function initializeTemplates() {
  const result: Record<string, TemplateData> = {}
  for (const td of TEMPLATE_DEFINITIONS) {
    result[td.key] = {
      subject: { es: td.defaultSubject.es, en: td.defaultSubject.en },
      body: { es: td.defaultBody.es, en: td.defaultBody.en },
      active: true,
    }
  }
  return result
}

function categoryCount(cat: CategoryKey): number {
  return TEMPLATE_DEFINITIONS.filter((td) => td.category === cat).length
}

// ---------------------------------------------------------------------------
// Data loading
// ---------------------------------------------------------------------------

onMounted(async () => {
  // Initialize all templates with defaults
  templates.value = initializeTemplates()

  // Load saved config
  const cfg = await loadConfig()
  if (cfg?.email_templates) {
    for (const td of TEMPLATE_DEFINITIONS) {
      const stored = cfg.email_templates[td.key] as Partial<TemplateData> | undefined
      if (stored) {
        templates.value[td.key] = {
          subject: {
            es: (stored.subject as Record<string, string>)?.es || td.defaultSubject.es,
            en: (stored.subject as Record<string, string>)?.en || td.defaultSubject.en,
          },
          body: {
            es: (stored.body as Record<string, string>)?.es || td.defaultBody.es,
            en: (stored.body as Record<string, string>)?.en || td.defaultBody.en,
          },
          active: stored.active !== undefined ? Boolean(stored.active) : true,
        }
      }
    }
  }

  // Load stats
  await loadStats()
})

async function loadStats() {
  loadingStats.value = true
  try {
    const { data } = await supabase
      .from('email_logs')
      .select('template_key, status')
      .eq('vertical', getVerticalSlug())

    if (data) {
      const statsMap: Record<string, TemplateStats> = {}
      for (const row of data) {
        const key = row.template_key
        if (!statsMap[key]) {
          statsMap[key] = { sent: 0, opened: 0, clicked: 0 }
        }
        if (['sent', 'delivered', 'opened', 'clicked'].includes(row.status)) {
          statsMap[key].sent++
        }
        if (['opened', 'clicked'].includes(row.status)) {
          statsMap[key].opened++
        }
        if (row.status === 'clicked') {
          statsMap[key].clicked++
        }
      }
      templateStats.value = statsMap
    }
  } catch {
    // Stats are non-critical; silently fail
  } finally {
    loadingStats.value = false
  }
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

function selectCategory(cat: CategoryKey) {
  activeCategory.value = cat
  const firstTemplate = TEMPLATE_DEFINITIONS.find((td) => td.category === cat)
  if (firstTemplate) {
    selectedTemplateKey.value = firstTemplate.key
  }
}

function toggleTemplate(key: string) {
  if (templates.value[key]) {
    templates.value[key].active = !templates.value[key].active
  }
}

function insertVariable(variable: string) {
  // Simple insert at the end of the body textarea for the current language
  const tpl = templates.value[selectedTemplateKey.value]
  if (tpl) {
    tpl.body[activeLang.value] += variable
  }
}

function resetToDefault() {
  const def = selectedDefinition.value
  if (!def) return
  templates.value[def.key] = {
    subject: { es: def.defaultSubject.es, en: def.defaultSubject.en },
    body: { es: def.defaultBody.es, en: def.defaultBody.en },
    active: templates.value[def.key]?.active ?? true,
  }
}

async function handleSave() {
  const payload: Record<string, Record<string, unknown>> = {}
  for (const td of TEMPLATE_DEFINITIONS) {
    const tpl = templates.value[td.key]
    if (tpl) {
      payload[td.key] = {
        subject: { ...tpl.subject },
        body: { ...tpl.body },
        active: tpl.active,
      }
    }
  }
  await saveFields({ email_templates: payload })
}

async function sendTest() {
  if (!user.value?.email || !selectedDefinition.value) return
  sendingTest.value = true
  testSent.value = false

  try {
    const def = selectedDefinition.value
    const sampleVars: Record<string, string> = {}
    for (const v of def.variables) {
      const varName = v.replace(/\{\{|\}\}/g, '')
      sampleVars[varName] = getSampleValue(varName)
    }

    await $fetch('/api/email/send', {
      method: 'POST',
      body: {
        to: user.value.email,
        template_key: selectedTemplateKey.value,
        subject: currentTemplate.value?.subject[activeLang.value] || '',
        body: currentTemplate.value?.body[activeLang.value] || '',
        variables: sampleVars,
        locale: activeLang.value,
      },
    })
    testSent.value = true
    setTimeout(() => {
      testSent.value = false
    }, 4000)
  } catch {
    error.value = t('admin.emails.testError')
  } finally {
    sendingTest.value = false
  }
}
</script>

<template>
  <div class="admin-emails">
    <!-- Header -->
    <div class="section-header">
      <h2>{{ $t('admin.emails.title') }}</h2>
      <p class="section-subtitle">
        {{ $t('admin.emails.subtitle') }}
      </p>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      {{ $t('admin.emails.loading') }}
    </div>

    <template v-else>
      <!-- Feedback banners -->
      <Transition name="fade">
        <div v-if="saved" class="success-banner">
          {{ $t('admin.emails.saved') }}
        </div>
      </Transition>
      <Transition name="fade">
        <div v-if="testSent" class="success-banner success-banner--test">
          {{ $t('admin.emails.testSent') }}
        </div>
      </Transition>
      <div v-if="error" class="error-banner">
        {{ error }}
      </div>

      <!-- Category tabs -->
      <div class="category-tabs">
        <button
          v-for="cat in CATEGORIES"
          :key="cat.key"
          class="category-tab"
          :class="{ 'category-tab--active': activeCategory === cat.key }"
          @click="selectCategory(cat.key)"
        >
          <span class="category-tab__label">{{ $t(cat.labelKey) }}</span>
          <span class="category-tab__count">{{ categoryCount(cat.key) }}</span>
        </button>
      </div>

      <!-- Template list + Editor layout -->
      <div class="emails-layout">
        <!-- Template list sidebar -->
        <div class="template-list">
          <div class="template-list__header">
            {{ $t('admin.emails.templates') }}
          </div>
          <button
            v-for="td in filteredTemplates"
            :key="td.key"
            class="template-item"
            :class="{
              'template-item--active': selectedTemplateKey === td.key,
              'template-item--disabled': !templates[td.key]?.active,
            }"
            @click="selectedTemplateKey = td.key"
          >
            <div class="template-item__info">
              <span class="template-item__name">{{ $t(`admin.emails.tpl.${td.key}`) }}</span>
              <span class="template-item__key">{{ td.key }}</span>
            </div>
            <div class="template-item__status">
              <span
                class="status-dot"
                :class="templates[td.key]?.active ? 'status-dot--on' : 'status-dot--off'"
              />
            </div>
          </button>
        </div>

        <!-- Editor panel -->
        <div v-if="currentTemplate && selectedDefinition" class="editor-panel">
          <!-- Editor header -->
          <div class="editor-header">
            <div class="editor-header__title">
              <h3>{{ $t(`admin.emails.tpl.${selectedTemplateKey}`) }}</h3>
              <code class="editor-header__key">{{ selectedTemplateKey }}</code>
            </div>
            <div class="editor-header__actions">
              <button
                class="btn-icon"
                :class="{ 'btn-icon--off': !currentTemplate.active }"
                :title="
                  currentTemplate.active
                    ? $t('admin.emails.deactivate')
                    : $t('admin.emails.activate')
                "
                @click="toggleTemplate(selectedTemplateKey)"
              >
                <span class="toggle-icon">{{ currentTemplate.active ? 'ON' : 'OFF' }}</span>
              </button>
            </div>
          </div>

          <!-- Stats row -->
          <div class="stats-row">
            <div class="stat-card">
              <span class="stat-card__value">{{ currentStats.sent }}</span>
              <span class="stat-card__label">{{ $t('admin.emails.statsSent') }}</span>
            </div>
            <div class="stat-card">
              <span class="stat-card__value">{{ openRate }}%</span>
              <span class="stat-card__label">{{ $t('admin.emails.statsOpenRate') }}</span>
            </div>
            <div class="stat-card">
              <span class="stat-card__value">{{ clickRate }}%</span>
              <span class="stat-card__label">{{ $t('admin.emails.statsClickRate') }}</span>
            </div>
          </div>

          <!-- Variables -->
          <div class="variables-info">
            <p class="variables-label">{{ $t('admin.emails.availableVars') }}</p>
            <div class="variables-list">
              <button
                v-for="v in selectedDefinition.variables"
                :key="v"
                class="variable-tag"
                :title="$t('admin.emails.insertVar')"
                @click="insertVariable(v)"
              >
                {{ v }}
              </button>
            </div>
          </div>

          <!-- Locale switcher -->
          <div class="locale-switcher">
            <button
              class="locale-btn"
              :class="{ 'locale-btn--active': activeLang === 'es' }"
              @click="activeLang = 'es'"
            >
              ES
            </button>
            <button
              class="locale-btn"
              :class="{ 'locale-btn--active': activeLang === 'en' }"
              @click="activeLang = 'en'"
            >
              EN
            </button>
          </div>

          <!-- Subject -->
          <div class="form-group">
            <label :for="`subject-${activeLang}`">
              {{ $t('admin.emails.subject') }} ({{ activeLang.toUpperCase() }})
            </label>
            <input
              :id="`subject-${activeLang}`"
              v-model="currentTemplate.subject[activeLang]"
              type="text"
              :placeholder="$t('admin.emails.subjectPlaceholder')"
            >
          </div>

          <!-- Body -->
          <div class="form-group">
            <label :for="`body-${activeLang}`">
              {{ $t('admin.emails.body') }} ({{ activeLang.toUpperCase() }})
              <span class="label-hint">{{ $t('admin.emails.markdownHint') }}</span>
            </label>
            <textarea
              :id="`body-${activeLang}`"
              v-model="currentTemplate.body[activeLang]"
              rows="12"
              :placeholder="$t('admin.emails.bodyPlaceholder')"
            />
          </div>

          <!-- Action buttons -->
          <div class="editor-actions">
            <button class="btn-secondary" @click="resetToDefault">
              {{ $t('admin.emails.resetDefault') }}
            </button>
            <button class="btn-secondary" @click="showPreview = true">
              {{ $t('admin.emails.preview') }}
            </button>
            <button class="btn-secondary" :disabled="sendingTest" @click="sendTest">
              {{ sendingTest ? $t('admin.emails.sending') : $t('admin.emails.sendTest') }}
            </button>
          </div>
        </div>
      </div>

      <!-- Save button -->
      <div class="actions-bar">
        <button class="btn-primary" :disabled="saving" @click="handleSave">
          {{ saving ? $t('admin.emails.saving') : $t('admin.emails.save') }}
        </button>
      </div>
    </template>

    <!-- Preview Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showPreview" class="modal-overlay" @click.self="showPreview = false">
          <div class="modal-content">
            <div class="modal-header">
              <h3>{{ $t('admin.emails.previewTitle') }}</h3>
              <button class="modal-close" @click="showPreview = false">&times;</button>
            </div>
            <div class="modal-body">
              <!-- eslint-disable-next-line vue/no-v-html -->
              <div class="preview-container" v-html="previewHtml" />
            </div>
            <div class="modal-footer">
              <button class="btn-secondary" @click="showPreview = false">
                {{ $t('admin.emails.close') }}
              </button>
              <button class="btn-primary" :disabled="sendingTest" @click="sendTest">
                {{ sendingTest ? $t('admin.emails.sending') : $t('admin.emails.sendTest') }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.admin-emails {
  padding: 0;
}

/* ── Header ── */
.section-header {
  margin-bottom: 24px;
}

.section-header h2 {
  margin: 0 0 8px;
  font-size: 1.5rem;
  color: var(--color-text, #1f2937);
}

.section-subtitle {
  margin: 0;
  color: #6b7280;
  font-size: 0.95rem;
}

/* ── Loading ── */
.loading-state {
  text-align: center;
  padding: 40px;
  color: #6b7280;
}

/* ── Banners ── */
.success-banner {
  background: #f0fdf4;
  color: #16a34a;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 16px;
  font-weight: 500;
}

.success-banner--test {
  background: #eff6ff;
  color: #2563eb;
}

.error-banner {
  background: #fef2f2;
  color: #dc2626;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 16px;
}

/* ── Category tabs ── */
.category-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}

.category-tabs::-webkit-scrollbar {
  display: none;
}

.category-tab {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  color: #374151;
  transition: all 0.2s;
  white-space: nowrap;
  min-height: 44px;
}

.category-tab:hover {
  border-color: var(--color-primary, #23424a);
  color: var(--color-primary, #23424a);
}

.category-tab--active {
  background: var(--color-primary, #23424a);
  color: white;
  border-color: var(--color-primary, #23424a);
}

.category-tab--active:hover {
  color: white;
}

.category-tab__count {
  background: rgba(0, 0, 0, 0.1);
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 0.8rem;
}

.category-tab--active .category-tab__count {
  background: rgba(255, 255, 255, 0.2);
}

/* ── Layout: list + editor ── */
.emails-layout {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* ── Template list ── */
.template-list {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.template-list__header {
  padding: 12px 16px;
  font-weight: 600;
  font-size: 0.85rem;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid #f3f4f6;
}

.template-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 12px 16px;
  border: none;
  border-bottom: 1px solid #f3f4f6;
  background: white;
  cursor: pointer;
  text-align: left;
  transition: background 0.15s;
  min-height: 44px;
}

.template-item:last-child {
  border-bottom: none;
}

.template-item:hover {
  background: #f9fafb;
}

.template-item--active {
  background: #eff6ff;
  border-left: 3px solid var(--color-primary, #23424a);
}

.template-item--disabled {
  opacity: 0.5;
}

.template-item__info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.template-item__name {
  font-size: 0.9rem;
  font-weight: 500;
  color: #1f2937;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.template-item__key {
  font-size: 0.75rem;
  color: #9ca3af;
  font-family: monospace;
}

.template-item__status {
  flex-shrink: 0;
  margin-left: 8px;
}

.status-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-dot--on {
  background: #10b981;
}

.status-dot--off {
  background: #d1d5db;
}

/* ── Editor panel ── */
.editor-panel {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.editor-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 16px;
  gap: 12px;
}

.editor-header__title h3 {
  margin: 0 0 4px;
  font-size: 1.15rem;
  color: #1f2937;
}

.editor-header__key {
  font-size: 0.75rem;
  color: #9ca3af;
  background: #f3f4f6;
  padding: 2px 8px;
  border-radius: 4px;
}

.editor-header__actions {
  flex-shrink: 0;
}

.btn-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 6px 12px;
  border: 1px solid #10b981;
  border-radius: 6px;
  background: #f0fdf4;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 600;
  color: #10b981;
  transition: all 0.2s;
  min-height: 36px;
}

.btn-icon--off {
  border-color: #d1d5db;
  background: #f9fafb;
  color: #9ca3af;
}

.toggle-icon {
  font-family: monospace;
  letter-spacing: 0.05em;
}

/* ── Stats row ── */
.stats-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

.stat-card {
  background: #f9fafb;
  border: 1px solid #f3f4f6;
  border-radius: 8px;
  padding: 12px;
  text-align: center;
}

.stat-card__value {
  display: block;
  font-size: 1.25rem;
  font-weight: 700;
  color: #1f2937;
}

.stat-card__label {
  display: block;
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 2px;
}

/* ── Variables ── */
.variables-info {
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 16px;
}

.variables-label {
  margin: 0 0 8px;
  font-weight: 500;
  font-size: 0.85rem;
  color: #0369a1;
}

.variables-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.variable-tag {
  background: white;
  border: 1px solid #bae6fd;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 0.78rem;
  color: #0c4a6e;
  white-space: nowrap;
  cursor: pointer;
  font-family: monospace;
  transition: all 0.15s;
  min-height: 28px;
}

.variable-tag:hover {
  background: #e0f2fe;
  border-color: #7dd3fc;
}

/* ── Locale switcher ── */
.locale-switcher {
  display: flex;
  gap: 4px;
  margin-bottom: 16px;
  background: #f3f4f6;
  border-radius: 8px;
  padding: 4px;
  width: fit-content;
}

.locale-btn {
  padding: 6px 16px;
  border: none;
  border-radius: 6px;
  background: transparent;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;
  color: #6b7280;
  transition: all 0.2s;
  min-height: 36px;
}

.locale-btn--active {
  background: white;
  color: var(--color-primary, #23424a);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

/* ── Form groups ── */
.form-group {
  margin-bottom: 16px;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-group label {
  display: flex;
  align-items: baseline;
  gap: 8px;
  font-weight: 500;
  margin-bottom: 6px;
  color: #374151;
  font-size: 0.9rem;
}

.label-hint {
  font-size: 0.75rem;
  font-weight: 400;
  color: #9ca3af;
}

.form-group input[type='text'],
.form-group textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.95rem;
  font-family: inherit;
  box-sizing: border-box;
}

.form-group textarea {
  resize: vertical;
  min-height: 180px;
  line-height: 1.6;
  font-family: 'Courier New', monospace;
  font-size: 0.88rem;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--color-primary, #23424a);
  box-shadow: 0 0 0 3px rgba(35, 66, 74, 0.1);
}

/* ── Editor actions ── */
.editor-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 16px;
}

/* ── Buttons ── */
.btn-primary {
  background: var(--color-primary, #23424a);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.95rem;
  transition: background 0.2s;
  min-height: 44px;
}

.btn-primary:hover {
  background: var(--color-primary-dark, #1a3238);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: white;
  color: #374151;
  border: 1px solid #d1d5db;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.88rem;
  transition: all 0.2s;
  min-height: 40px;
}

.btn-secondary:hover {
  background: #f9fafb;
  border-color: #9ca3af;
}

.btn-secondary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ── Actions bar ── */
.actions-bar {
  margin-top: 24px;
  display: flex;
  justify-content: flex-end;
}

/* ── Modal ── */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 680px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.1rem;
  color: #1f2937;
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #6b7280;
  padding: 4px 8px;
  line-height: 1;
  min-height: 44px;
  min-width: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-close:hover {
  color: #1f2937;
}

.modal-body {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
}

.preview-container {
  background: #f9fafb;
  padding: 24px;
  border-radius: 8px;
}

.modal-footer {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  padding: 16px 20px;
  border-top: 1px solid #e5e7eb;
}

/* ── Transitions ── */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.modal-enter-active {
  transition: opacity 0.2s;
}

.modal-enter-active .modal-content {
  transition: transform 0.2s;
}

.modal-leave-active {
  transition: opacity 0.2s;
}

.modal-leave-active .modal-content {
  transition: transform 0.2s;
}

.modal-enter-from {
  opacity: 0;
}

.modal-enter-from .modal-content {
  transform: scale(0.95);
}

.modal-leave-to {
  opacity: 0;
}

.modal-leave-to .modal-content {
  transform: scale(0.95);
}

/* ── Responsive ── */
@media (min-width: 768px) {
  .section-header h2 {
    font-size: 1.75rem;
  }

  .editor-panel {
    padding: 24px;
  }

  .stats-row {
    gap: 16px;
  }

  .stat-card {
    padding: 16px;
  }

  .stat-card__value {
    font-size: 1.5rem;
  }
}

@media (min-width: 1024px) {
  .emails-layout {
    flex-direction: row;
    align-items: flex-start;
  }

  .template-list {
    width: 280px;
    flex-shrink: 0;
    position: sticky;
    top: 16px;
    max-height: calc(100vh - 200px);
    overflow-y: auto;
  }

  .editor-panel {
    flex: 1;
    min-width: 0;
    padding: 28px;
  }
}

@media (min-width: 1280px) {
  .template-list {
    width: 320px;
  }
}
</style>

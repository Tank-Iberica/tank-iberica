/**
 * POST /api/cron/k6-readiness-check
 *
 * Weekly cron that checks whether conditions for running k6 load tests are met:
 *   - ≥50 published vehicles (enough realistic catalog traffic)
 *   - ≥2 active dealers (real multi-tenant traffic patterns)
 *
 * When conditions are met, sends an email notification to the admin with
 * instructions to run: npm run test:load:smoke
 *
 * NOTE: This cron sends an email every week while conditions remain met.
 * Disable the GitHub Actions workflow (k6-readiness.yml) once you've
 * completed the initial k6 setup (replaced placeholder slugs + run smoke test).
 *
 * Protected by x-cron-secret header.
 */
import { defineEventHandler, readBody } from 'h3'
import { safeError } from '../../utils/safeError'
import { serverSupabaseServiceRole } from '#supabase/server'
import { verifyCronSecret } from '../../utils/verifyCronSecret'
import { Resend } from 'resend'
import { logger } from '../../utils/logger'

// -- Config -------------------------------------------------------------------

const MIN_PUBLISHED_VEHICLES = 50
const MIN_ACTIVE_DEALERS = 2

interface CronBody {
  secret?: string
}

// -- Handler ------------------------------------------------------------------

export default defineEventHandler(async (event) => {
  // 1. Verify cron secret
  const body = await readBody<CronBody>(event).catch(() => ({}) as CronBody)
  verifyCronSecret(event, body?.secret)

  const supabase = serverSupabaseServiceRole(event)
  const config = useRuntimeConfig()
  const now = new Date()

  // 2. Count published vehicles
  const { count: vehicleCount, error: vehicleError } = await supabase
    .from('vehicles')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'published')

  if (vehicleError) {
    throw safeError(500, `Failed to count vehicles: ${vehicleError.message}`)
  }

  // 3. Count active dealers (has_active_subscription or founding_member status)
  const { count: dealerCount, error: dealerError } = await supabase
    .from('dealers')
    .select('id', { count: 'exact', head: true })
    .or('has_active_subscription.eq.true,is_founding_member.eq.true')

  if (dealerError) {
    throw safeError(500, `Failed to count dealers: ${dealerError.message}`)
  }

  const vehicles = vehicleCount ?? 0
  const dealers = dealerCount ?? 0
  const vehiclesReady = vehicles >= MIN_PUBLISHED_VEHICLES
  const dealersReady = dealers >= MIN_ACTIVE_DEALERS
  const conditionsMet = vehiclesReady && dealersReady

  console.info(
    `[k6-readiness-check] vehicles=${vehicles}/${MIN_PUBLISHED_VEHICLES} dealers=${dealers}/${MIN_ACTIVE_DEALERS} ready=${conditionsMet}`,
  )

  // 4. If conditions not met, return early (no email)
  if (!conditionsMet) {
    return {
      conditionsMet: false,
      vehicleCount: vehicles,
      dealerCount: dealers,
      vehiclesReady,
      dealersReady,
      notified: false,
      timestamp: now.toISOString(),
    }
  }

  // 5. Conditions met — send admin notification
  const resendApiKey = config.resendApiKey || process.env.RESEND_API_KEY
  const adminEmail = process.env.ADMIN_EMAIL || 'tankiberica@gmail.com'

  if (!resendApiKey) {
    logger.warn('[k6-readiness-check] RESEND_API_KEY not configured — skipping email')
    return {
      conditionsMet: true,
      vehicleCount: vehicles,
      dealerCount: dealers,
      vehiclesReady,
      dealersReady,
      notified: false,
      reason: 'RESEND_API_KEY not configured',
      timestamp: now.toISOString(),
    }
  }

  const resend = new Resend(resendApiKey)

  const emailBody = `
<h2>✅ Tracciona — k6 Load Tests Ready</h2>

<p>Las condiciones para ejecutar los tests de carga <strong>están cumplidas</strong>:</p>

<ul>
  <li>📦 Vehículos publicados: <strong>${vehicles}</strong> (mínimo ${MIN_PUBLISHED_VEHICLES})</li>
  <li>🏪 Dealers activos: <strong>${dealers}</strong> (mínimo ${MIN_ACTIVE_DEALERS})</li>
</ul>

<h3>Pasos para ejecutar k6:</h3>

<ol>
  <li>
    <strong>Reemplaza los slugs de prueba</strong> en <code>tests/load/scenarios/vehicle-detail.js</code>
    y <code>tests/load/k6-full.js</code>:<br>
    <pre>SELECT slug FROM vehicles WHERE status = 'published' ORDER BY RANDOM() LIMIT 20;</pre>
  </li>
  <li>
    <strong>Instala k6</strong> (si no lo tienes):<br>
    <code>choco install k6</code>
  </li>
  <li>
    <strong>Ejecuta el smoke test</strong>:<br>
    <code>npm run test:load:smoke</code>
  </li>
  <li>
    Una vez completado, <strong>desactiva este workflow</strong> en GitHub Actions
    (<code>.github/workflows/k6-readiness.yml</code>) para no recibir más notificaciones.
  </li>
</ol>

<p><small>Generado automáticamente el ${now.toISOString().split('T')[0]} por el cron <code>/api/cron/k6-readiness-check</code></small></p>
  `.trim()

  const { error: emailError } = await resend.emails.send({
    from: 'Tracciona Cron <noreply@tracciona.com>',
    to: adminEmail,
    subject: `✅ k6 listo para ejecutar — ${vehicles} vehículos, ${dealers} dealers activos`,
    html: emailBody,
  })

  if (emailError) {
    logger.error(`[k6-readiness-check] Failed to send email: ${emailError.message}`)
    return {
      conditionsMet: true,
      vehicleCount: vehicles,
      dealerCount: dealers,
      vehiclesReady,
      dealersReady,
      notified: false,
      reason: `Email failed: ${emailError.message}`,
      timestamp: now.toISOString(),
    }
  }

  console.info(`[k6-readiness-check] Notification sent to ${adminEmail}`)

  return {
    conditionsMet: true,
    vehicleCount: vehicles,
    dealerCount: dealers,
    vehiclesReady,
    dealersReady,
    notified: true,
    notifiedTo: adminEmail,
    timestamp: now.toISOString(),
  }
})

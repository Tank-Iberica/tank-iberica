/**
 * Infrastructure alert email template.
 *
 * Generates branded HTML email for infrastructure monitoring alerts.
 * Uses Tracciona branding with #23424A primary color.
 */

// ── Types ──────────────────────────────────────────────────────────────────────

interface InfraAlertEmailOptions {
  component: string
  metric: string
  usagePercent: number
  value: number
  limit: number
  level: 'warning' | 'critical' | 'emergency'
}

// ── Color mapping by alert level ───────────────────────────────────────────────

const LEVEL_COLORS: Record<string, { bg: string; text: string; badge: string; label: string }> = {
  warning: {
    bg: '#FFF3CD',
    text: '#856404',
    badge: '#FFC107',
    label: 'WARNING',
  },
  critical: {
    bg: '#F8D7DA',
    text: '#721C24',
    badge: '#DC3545',
    label: 'CRITICAL',
  },
  emergency: {
    bg: '#721C24',
    text: '#FFFFFF',
    badge: '#FF0000',
    label: 'EMERGENCY',
  },
}

// ── Metric display names ───────────────────────────────────────────────────────

const METRIC_LABELS: Record<string, string> = {
  db_size_bytes: 'Database Size',
  connections_used: 'Active Connections',
  cloudinary_credits: 'Cloudinary Credits',
  cloudinary_storage: 'Cloudinary Storage',
  resend_emails_today: 'Emails Sent Today',
}

const COMPONENT_LABELS: Record<string, string> = {
  supabase: 'Supabase',
  cloudinary: 'Cloudinary',
  resend: 'Resend',
  sentry: 'Sentry',
  cloudflare: 'Cloudflare',
}

// ── Format helpers ─────────────────────────────────────────────────────────────

function formatValue(metric: string, value: number): string {
  if (metric === 'db_size_bytes') {
    if (value >= 1024 * 1024 * 1024) return `${(value / (1024 * 1024 * 1024)).toFixed(2)} GB`
    if (value >= 1024 * 1024) return `${(value / (1024 * 1024)).toFixed(1)} MB`
    if (value >= 1024) return `${(value / 1024).toFixed(0)} KB`
    return `${value} B`
  }
  if (metric === 'cloudinary_storage') {
    if (value >= 1024 * 1024 * 1024) return `${(value / (1024 * 1024 * 1024)).toFixed(2)} GB`
    if (value >= 1024 * 1024) return `${(value / (1024 * 1024)).toFixed(1)} MB`
    return `${value.toLocaleString('es-ES')}`
  }
  return value.toLocaleString('es-ES')
}

// ── Email HTML generator ───────────────────────────────────────────────────────

export function infraAlertEmailHtml(opts: InfraAlertEmailOptions): string {
  const levelStyle = LEVEL_COLORS[opts.level] ?? LEVEL_COLORS.warning
  const metricLabel = METRIC_LABELS[opts.metric] ?? opts.metric
  const componentLabel = COMPONENT_LABELS[opts.component] ?? opts.component
  const formattedValue = formatValue(opts.metric, opts.value)
  const formattedLimit = formatValue(opts.metric, opts.limit)

  // Progress bar width (capped at 100%)
  const barWidth = Math.min(opts.usagePercent, 100)

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Alerta de Infraestructura - Tracciona</title>
</head>
<body style="margin:0;padding:0;background-color:#F4F4F5;font-family:'Segoe UI',Arial,Helvetica,sans-serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:#F4F4F5;">
    <tr>
      <td align="center" style="padding:24px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width:600px;width:100%;background-color:#FFFFFF;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background-color:#23424A;padding:24px 32px;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td>
                    <h1 style="margin:0;font-size:20px;font-weight:700;color:#FFFFFF;letter-spacing:-0.5px;">Tracciona</h1>
                    <p style="margin:4px 0 0;font-size:12px;color:#A0B4B8;">Infrastructure Monitoring</p>
                  </td>
                  <td align="right">
                    <span style="display:inline-block;background-color:${levelStyle.badge};color:#FFFFFF;font-size:11px;font-weight:700;padding:4px 12px;border-radius:12px;letter-spacing:0.5px;">${levelStyle.label}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Alert banner -->
          <tr>
            <td style="background-color:${levelStyle.bg};padding:16px 32px;">
              <p style="margin:0;font-size:14px;font-weight:600;color:${levelStyle.text};">
                ${componentLabel} &mdash; ${metricLabel} al ${opts.usagePercent}%
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <h2 style="margin:0 0 16px;font-size:18px;font-weight:600;color:#23424A;">Detalles de la alerta</h2>

              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:24px;">
                <tr>
                  <td style="padding:8px 0;font-size:13px;color:#6B7280;width:140px;">Componente</td>
                  <td style="padding:8px 0;font-size:13px;font-weight:600;color:#1F2937;">${componentLabel}</td>
                </tr>
                <tr>
                  <td style="padding:8px 0;font-size:13px;color:#6B7280;border-top:1px solid #F3F4F6;">Metrica</td>
                  <td style="padding:8px 0;font-size:13px;font-weight:600;color:#1F2937;border-top:1px solid #F3F4F6;">${metricLabel}</td>
                </tr>
                <tr>
                  <td style="padding:8px 0;font-size:13px;color:#6B7280;border-top:1px solid #F3F4F6;">Valor actual</td>
                  <td style="padding:8px 0;font-size:13px;font-weight:600;color:#1F2937;border-top:1px solid #F3F4F6;">${formattedValue}</td>
                </tr>
                <tr>
                  <td style="padding:8px 0;font-size:13px;color:#6B7280;border-top:1px solid #F3F4F6;">Limite</td>
                  <td style="padding:8px 0;font-size:13px;font-weight:600;color:#1F2937;border-top:1px solid #F3F4F6;">${formattedLimit}</td>
                </tr>
                <tr>
                  <td style="padding:8px 0;font-size:13px;color:#6B7280;border-top:1px solid #F3F4F6;">Uso</td>
                  <td style="padding:8px 0;font-size:13px;font-weight:700;color:${levelStyle.text};border-top:1px solid #F3F4F6;">${opts.usagePercent}%</td>
                </tr>
                <tr>
                  <td style="padding:8px 0;font-size:13px;color:#6B7280;border-top:1px solid #F3F4F6;">Nivel</td>
                  <td style="padding:8px 0;font-size:13px;font-weight:600;color:${levelStyle.text};border-top:1px solid #F3F4F6;">${levelStyle.label}</td>
                </tr>
              </table>

              <!-- Progress bar -->
              <div style="margin-bottom:24px;">
                <p style="margin:0 0 6px;font-size:12px;color:#6B7280;">Uso del recurso</p>
                <div style="background-color:#E5E7EB;border-radius:4px;height:12px;overflow:hidden;">
                  <div style="background-color:${levelStyle.badge};height:12px;width:${barWidth}%;border-radius:4px;"></div>
                </div>
              </div>

              <!-- Timestamp -->
              <p style="margin:0;font-size:12px;color:#9CA3AF;">
                Alerta generada: ${new Date().toLocaleString('es-ES', { timeZone: 'Europe/Madrid' })}
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#F9FAFB;padding:16px 32px;border-top:1px solid #E5E7EB;">
              <p style="margin:0;font-size:11px;color:#9CA3AF;text-align:center;">
                Este email fue enviado automaticamente por el sistema de monitorizacion de Tracciona.<br>
                Para gestionar alertas, accede al <a href="https://tracciona.com/admin/infraestructura" style="color:#23424A;text-decoration:underline;">panel de administracion</a>.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

// ── Subject line helper ────────────────────────────────────────────────────────

export function infraAlertSubject(component: string, usagePercent: number): string {
  const componentLabel = COMPONENT_LABELS[component] ?? component
  return `[Tracciona] Alerta infraestructura: ${componentLabel} al ${usagePercent}%`
}

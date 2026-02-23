export interface InfraRecommendation {
  component: string
  metric: string
  level: 'warning' | 'critical' | 'emergency'
  message: string
  action: string
  url?: string
}

interface RecommendationRule {
  component: string
  metric: string
  threshold: number
  level: 'warning' | 'critical' | 'emergency'
  message: string
  action: string
  url?: string
}

const rules: RecommendationRule[] = [
  {
    component: 'supabase',
    metric: 'db_size_bytes',
    threshold: 90,
    level: 'emergency',
    message: 'Base de datos al 90% del límite',
    action: 'Crear nuevo cluster URGENTE y migrar verticales ligeras inmediatamente',
    url: '/admin/infraestructura?tab=migration',
  },
  {
    component: 'supabase',
    metric: 'db_size_bytes',
    threshold: 80,
    level: 'critical',
    message: 'Base de datos acercándose al límite',
    action: 'Crear nuevo cluster y migrar verticales ligeras',
    url: '/admin/infraestructura?tab=migration',
  },
  {
    component: 'supabase',
    metric: 'storage_size_bytes',
    threshold: 80,
    level: 'critical',
    message: 'Almacenamiento Supabase al 80%',
    action: 'Migrar archivos grandes a Cloudflare R2 o limpiar uploads obsoletos',
  },
  {
    component: 'supabase',
    metric: 'monthly_active_users',
    threshold: 80,
    level: 'warning',
    message: 'MAUs acercándose al límite del plan',
    action: 'Considerar upgrade a Supabase Pro ($25/mes) o revisar sesiones duplicadas',
  },
  {
    component: 'cloudinary',
    metric: 'transformations_used',
    threshold: 90,
    level: 'critical',
    message: 'Transformaciones al 90% del límite',
    action: 'Upgrade a Plus ($89/mes) o activar pipeline híbrido',
  },
  {
    component: 'cloudinary',
    metric: 'transformations_used',
    threshold: 70,
    level: 'warning',
    message: 'Transformaciones de imagen al 70%',
    action: 'Verificar pipeline híbrido (CF Images) activo',
  },
  {
    component: 'cloudinary',
    metric: 'storage_used_bytes',
    threshold: 80,
    level: 'warning',
    message: 'Almacenamiento Cloudinary al 80%',
    action: 'Limpiar imágenes huérfanas o migrar a CF Images',
  },
  {
    component: 'cloudflare',
    metric: 'workers_requests_day',
    threshold: 90,
    level: 'critical',
    message: 'Workers requests al 90% del límite diario',
    action: 'Upgrade a Workers Paid ($5/mes) o revisar caché agresivo',
  },
  {
    component: 'cloudflare',
    metric: 'workers_requests_day',
    threshold: 70,
    level: 'warning',
    message: 'Workers requests al 70%',
    action: 'Revisar SWR de routeRules en nuxt.config.ts',
  },
  {
    component: 'cloudflare',
    metric: 'kv_reads_day',
    threshold: 80,
    level: 'warning',
    message: 'KV reads al 80% del límite diario',
    action: 'Revisar TTL de las claves KV o reducir lecturas innecesarias',
  },
  {
    component: 'resend',
    metric: 'emails_sent_today',
    threshold: 90,
    level: 'critical',
    message: 'Emails diarios al 90% del límite',
    action: 'Upgrade a Resend Pro ($20/mes) urgente para no perder emails',
  },
  {
    component: 'resend',
    metric: 'emails_sent_today',
    threshold: 80,
    level: 'warning',
    message: 'Emails diarios al 80%',
    action: 'Upgrade a Resend Pro ($20/mes)',
  },
  {
    component: 'sentry',
    metric: 'events_month',
    threshold: 90,
    level: 'critical',
    message: 'Eventos Sentry al 90% del límite mensual',
    action: 'Upgrade a Sentry Team ($26/mes) o reducir sample rate inmediatamente',
  },
  {
    component: 'sentry',
    metric: 'events_month',
    threshold: 80,
    level: 'warning',
    message: 'Eventos Sentry al 80%',
    action: 'Upgrade a Sentry Team ($26/mes) o ajustar sample rate',
  },
]

export function useInfraRecommendations() {
  function getRecommendation(
    component: string,
    metricName: string,
    usagePercent: number,
  ): InfraRecommendation | null {
    // Filter rules matching this component and metric, where usage exceeds threshold
    const matchingRules = rules.filter(
      (r) => r.component === component && r.metric === metricName && usagePercent >= r.threshold,
    )

    if (matchingRules.length === 0) return null

    // Return the rule with the highest threshold (most severe match)
    const bestMatch = matchingRules.reduce((best, current) =>
      current.threshold > best.threshold ? current : best,
    )

    return {
      component: bestMatch.component,
      metric: bestMatch.metric,
      level: bestMatch.level,
      message: bestMatch.message,
      action: bestMatch.action,
      url: bestMatch.url,
    }
  }

  function getAllRecommendations(
    metricsData: Array<{ component: string; metric_name: string; usage_percent: number | null }>,
  ): InfraRecommendation[] {
    const recommendations: InfraRecommendation[] = []

    for (const metric of metricsData) {
      if (metric.usage_percent === null) continue

      const rec = getRecommendation(metric.component, metric.metric_name, metric.usage_percent)
      if (rec) {
        recommendations.push(rec)
      }
    }

    // Sort by severity: emergency > critical > warning
    const levelOrder: Record<string, number> = { emergency: 0, critical: 1, warning: 2 }
    recommendations.sort((a, b) => (levelOrder[a.level] ?? 3) - (levelOrder[b.level] ?? 3))

    return recommendations
  }

  return { getRecommendation, getAllRecommendations }
}

import { onCLS, onINP, onLCP } from 'web-vitals'
import type { Metric } from 'web-vitals'

export default defineNuxtPlugin(() => {
  if (!import.meta.client) return

  const sendMetric = (metric: Metric): void => {
    if (import.meta.dev) {
       
      console.debug(`[Web Vitals] ${metric.name}: ${metric.value}`)
    }
  }

  onCLS(sendMetric)
  onINP(sendMetric)
  onLCP(sendMetric)
})

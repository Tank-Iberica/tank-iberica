import { onCLS, onINP, onLCP, onFCP, onTTFB } from 'web-vitals'
import type { Metric } from 'web-vitals'

export default defineNuxtPlugin(() => {
  if (!import.meta.client) return

  const sendMetric = (metric: Metric): void => {
    if (import.meta.dev) {
      console.debug(`[Web Vitals] ${metric.name}: ${metric.value}`)
      return
    }

    // Send to Google Analytics 4 if available
    if (typeof window !== 'undefined' && 'gtag' in window) {
      const gtag = (window as Record<string, unknown>).gtag as (
        command: string,
        name: string,
        params: Record<string, unknown>,
      ) => void
      gtag('event', metric.name, {
        value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
        event_label: metric.id,
        non_interaction: true,
      })
    }
  }

  onCLS(sendMetric)
  onINP(sendMetric)
  onLCP(sendMetric)
  onFCP(sendMetric)
  onTTFB(sendMetric)
})

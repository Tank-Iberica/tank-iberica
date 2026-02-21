/**
 * Global error boundary plugin with Sentry integration.
 * Catches unhandled errors at app and component level
 * without crashing the whole page.
 *
 * In development: logs to console.
 * In production: sends error reports to Sentry (if DSN configured).
 */

import * as Sentry from '@sentry/vue'

export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig()
  const dsn = config.public.sentryDsn

  // Initialize Sentry if DSN is configured
  if (dsn) {
    Sentry.init({
      app: nuxtApp.vueApp,
      dsn,
      environment: import.meta.dev ? 'development' : 'production',
      tracesSampleRate: 0.1,
    })
  }

  // Catch Vue component errors without crashing the page
  nuxtApp.vueApp.config.errorHandler = (error, instance, info) => {
    if (dsn) {
      Sentry.captureException(error, { extra: { info } })
    }
    console.error('Component error:', error, info)
  }

  // Catch top-level app errors (SSR + client)
  nuxtApp.hook('app:error', (error) => {
    if (dsn) {
      Sentry.captureException(error)
    }
    console.error('Global error:', error)
  })
})

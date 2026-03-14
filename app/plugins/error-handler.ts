/**
 * Global error boundary plugin with Sentry integration.
 * Catches unhandled errors at app and component level
 * without crashing the whole page.
 *
 * In development: logs to console.
 * In production: sends error reports to Sentry (if DSN configured).
 */

import { init as sentryInit, captureException, setUser, replayIntegration } from '@sentry/vue'

export default defineNuxtPlugin(async (nuxtApp) => {
  const config = useRuntimeConfig()
  const dsn = config.public.sentryDsn

  // Initialize Sentry if DSN is configured
  if (dsn) {
    sentryInit({
      app: nuxtApp.vueApp,
      dsn,
      environment: import.meta.dev ? 'development' : 'production',
      // P1 § Monitoring: increased from 0.1 to 0.5 for better coverage
      tracesSampleRate: import.meta.dev ? 0.1 : 0.5,
      integrations: [
        replayIntegration({
          maskAllText: true,
          blockAllMedia: true,
        }),
      ],
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
    })

    // Automatically set user context when authenticated
    const { profile, userEmail } = useAuth()
    if (profile.value?.id) {
      setUser({
        id: profile.value.id,
        email: userEmail.value,
        username: profile.value.pseudonimo || undefined,
      })
    }
  }

  // Catch Vue component errors without crashing the page
  nuxtApp.vueApp.config.errorHandler = (error, instance, info) => {
    if (dsn) {
      captureException(error, {
        extra: {
          info,
          component: instance?.$options?.name || 'unknown',
        }
      })
    }
    console.error('Component error:', error, info)
  }

  // Catch top-level app errors (SSR + client)
  nuxtApp.hook('app:error', (error) => {
    if (dsn) {
      captureException(error)
    }
    console.error('Global error:', error)
  })
})

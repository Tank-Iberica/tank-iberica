// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: process.env.NODE_ENV !== 'production' },

  devServer: {
    port: 3000,
    host: '0.0.0.0',
  },

  modules: [
    '@nuxtjs/supabase',
    '@nuxtjs/i18n',
    '@nuxt/image',
    '@nuxtjs/sitemap',
    '@nuxtjs/google-fonts',
    '@vite-pwa/nuxt',
  ],

  googleFonts: {
    families: {
      Inter: [400, 500, 600, 700],
    },
    display: 'swap',
    preload: true,
    download: true,
  },

  site: {
    url: 'https://tracciona.com',
  },

  sitemap: {
    exclude: ['/admin/**', '/confirm'],
    sources: ['/api/__sitemap'],
    urls: [
      { loc: '/', changefreq: 'daily', priority: 1.0 },
      { loc: '/guia', changefreq: 'weekly', priority: 0.7 },
      { loc: '/noticias', changefreq: 'daily', priority: 0.7 },
      { loc: '/subastas', changefreq: 'daily', priority: 0.7 },
      { loc: '/sobre-nosotros', changefreq: 'monthly', priority: 0.5 },
      { loc: '/legal', changefreq: 'yearly', priority: 0.3 },
    ],
  },

  supabase: {
    redirectOptions: {
      login: '/',
      callback: '/confirm',
      exclude: ['/**'],
    },
    cookieOptions: {
      secure: process.env.NODE_ENV === 'production',
    },
    clientOptions: {
      auth: {
        flowType: 'pkce',
        detectSessionInUrl: true,
        persistSession: true,
        autoRefreshToken: true,
      },
    },
  },

  i18n: {
    locales: [
      { code: 'es', file: 'es.json', name: 'Español' },
      { code: 'en', file: 'en.json', name: 'English' },
    ],
    defaultLocale: 'es',
    // @ts-expect-error lazy is valid at runtime for @nuxtjs/i18n
    lazy: true,
    langDir: '../i18n',
    strategy: 'prefix_except_default',
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'tracciona_lang',
      fallbackLocale: 'es',
    },
  },

  image: {
    cloudinary: {
      baseURL: `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME || ''}/image/upload/`,
    },
    quality: 80,
    format: 'webp',
  },

  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: 'Tracciona — Marketplace de Vehículos Industriales',
      short_name: 'Tracciona',
      description:
        'Compra, venta y alquiler de vehículos industriales: semirremolques, cisternas, cabezas tractoras y camiones.',
      theme_color: '#23424A',
      background_color: '#F3F4F6',
      display: 'standalone',
      start_url: '/',
      icons: [
        { src: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
        { src: '/icon-512x512.png', sizes: '512x512', type: 'image/png' },
        { src: '/icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    },
    workbox: {
      navigateFallback: undefined,
      globPatterns: ['**/*.{js,css,html,png,svg,ico,woff2}'],
      runtimeCaching: [
        {
          urlPattern: /^https:\/\/res\.cloudinary\.com\/.*/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'cloudinary-images',
            expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
            cacheableResponse: { statuses: [0, 200] },
          },
        },
        {
          urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'google-fonts',
            expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
            cacheableResponse: { statuses: [0, 200] },
          },
        },
        {
          urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/.*/i,
          handler: 'NetworkFirst',
          options: {
            cacheName: 'supabase-api',
            expiration: { maxEntries: 50, maxAgeSeconds: 60 * 5 },
            networkTimeoutSeconds: 10,
          },
        },
      ],
    },
    client: {
      installPrompt: true,
    },
    devOptions: {
      enabled: false,
    },
  },

  routeRules: {
    '/': { swr: 60 * 10 },
    '/vehiculo/**': { swr: 60 * 5 },
    '/noticias': { swr: 60 * 10 },
    '/noticias/**': { swr: 60 * 30 },
    '/guia': { swr: 60 * 60 },
    '/guia/**': { swr: 60 * 60 },
    '/sobre-nosotros': { swr: 60 * 60 * 24 },
    '/legal': { swr: 60 * 60 * 24 },
    '/subastas': { swr: 60 },
    '/subastas/**': { swr: 60 },
    '/admin/**': { ssr: false },
    '/dashboard/**': { ssr: false },
    '/perfil/**': { ssr: false },
    '/api/__sitemap**': { cors: true, swr: 60 * 60 * 6 },
    '/api/merchant-feed**': { cors: true, swr: 60 * 60 * 12 },
    '/api/health**': { cors: true },
    '/api/market-report': { swr: 60 * 60 * 6 },
  },

  runtimeConfig: {
    cronSecret: process.env.CRON_SECRET || '',
    resendApiKey: process.env.RESEND_API_KEY || '',
    turnstileSecretKey: process.env.TURNSTILE_SECRET_KEY || '',
    anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
    whatsappApiToken: process.env.WHATSAPP_API_TOKEN || '',
    whatsappPhoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
    whatsappVerifyToken: process.env.WHATSAPP_VERIFY_TOKEN || '',
    whatsappAppSecret: process.env.WHATSAPP_APP_SECRET || '',
    stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
    stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
    quadernoApiKey: process.env.QUADERNO_API_KEY || '',
    quadernoApiUrl: process.env.QUADERNO_API_URL || 'https://quadernoapp.com/api',
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    vapidPrivateKey: process.env.VAPID_PRIVATE_KEY || '',
    vapidEmail: process.env.VAPID_EMAIL || '',
    cloudflareApiToken: process.env.CLOUDFLARE_API_TOKEN || '',
    cloudflareAccountId: process.env.CLOUDFLARE_ACCOUNT_ID || '',
    cloudflareImagesApiToken: process.env.CLOUDFLARE_IMAGES_API_TOKEN || '',
    cloudflareImagesAccountHash: process.env.CLOUDFLARE_IMAGES_ACCOUNT_HASH || '',
    cloudflareImagesDeliveryUrl: process.env.CLOUDFLARE_IMAGES_DELIVERY_URL || '',
    supabaseProjectRef: process.env.SUPABASE_PROJECT_REF || 'gmnrfuzekbwyzkgsaftv',
    supabaseManagementApiKey: process.env.SUPABASE_MANAGEMENT_API_KEY || '',
    sentryOrgSlug: process.env.SENTRY_ORG_SLUG || '',
    sentryAuthToken: process.env.SENTRY_AUTH_TOKEN || '',
    imagePipelineMode: process.env.IMAGE_PIPELINE_MODE || 'cloudinary',
    infraAlertEmail: process.env.INFRA_ALERT_EMAIL || 'tankiberica@gmail.com',
    infraThresholdWarning: Number.parseInt(process.env.INFRA_ALERT_THRESHOLD_WARNING || '70'),
    infraThresholdCritical: Number.parseInt(process.env.INFRA_ALERT_THRESHOLD_CRITICAL || '85'),
    infraThresholdEmergency: Number.parseInt(process.env.INFRA_ALERT_THRESHOLD_EMERGENCY || '95'),
    cloudinaryApiKey: process.env.CLOUDINARY_API_KEY || '',
    cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET || '',
    public: {
      vertical: process.env.NUXT_PUBLIC_VERTICAL || 'tracciona',
      cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
      cloudinaryUploadPreset: process.env.CLOUDINARY_UPLOAD_PRESET || '',
      googleClientId: process.env.GOOGLE_CLIENT_ID || '',
      googleAdsId: process.env.NUXT_PUBLIC_GOOGLE_ADS_ID || '',
      turnstileSiteKey: process.env.TURNSTILE_SITE_KEY || '',
      sentryDsn: process.env.NUXT_PUBLIC_SENTRY_DSN || '',
      vapidPublicKey: process.env.NUXT_PUBLIC_VAPID_PUBLIC_KEY || '',
    },
  },

  experimental: {
    payloadExtraction: true,
  },

  css: ['@/assets/css/tokens.css'],

  app: {
    head: {
      htmlAttrs: { lang: 'es' },
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1',
      title: 'Tracciona',
      meta: [
        {
          name: 'description',
          content:
            'Compra, venta y alquiler de vehículos industriales: semirremolques, cisternas, cabezas tractoras, camiones y más.',
        },
        { property: 'og:site_name', content: 'Tracciona' },
        { property: 'og:locale', content: 'es_ES' },
        { property: 'og:locale:alternate', content: 'en_GB' },
        { name: 'theme-color', content: '#23424A' },
      ],
      link: [
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png' },
        { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16x16.png' },
        { rel: 'icon', href: '/favicon.ico' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
        { rel: 'dns-prefetch', href: 'https://res.cloudinary.com' },
        { rel: 'dns-prefetch', href: 'https://gmnrfuzekbwyzkgsaftv.supabase.co' },
        { rel: 'dns-prefetch', href: 'https://flagcdn.com' },
        { rel: 'dns-prefetch', href: 'https://www.googletagmanager.com' },
        { rel: 'preconnect', href: 'https://res.cloudinary.com', crossorigin: '' },
      ],
    },
  },
})

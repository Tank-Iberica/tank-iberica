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
    '@nuxtjs/color-mode',
  ],

  colorMode: {
    preference: 'system',
    fallback: 'light',
    classSuffix: '-mode',
    storageKey: 'tracciona_color_mode',
  },

  googleFonts: {
    families: {
      Inter: [400, 500, 600, 700],
    },
    subsets: ['latin', 'latin-ext'],
    display: 'swap',
    preload: true,
    download: true,
  },

  site: {
    url: process.env.SITE_URL || 'https://tracciona.com',
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
      sameSite: 'lax' as const,
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
      cookieCrossOrigin: false,
      cookieSecure: process.env.NODE_ENV === 'production',
    },
  },

  image: {
    cloudinary: {
      baseURL: `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME || ''}/image/upload/`,
    },
    quality: 80,
    format: ['webp'],
    domains: ['flagcdn.com'],
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
      scope: '/',
      start_url: '/',
      id: '/',
      icons: [
        { src: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
        { src: '/icon-512x512.png', sizes: '512x512', type: 'image/png' },
        { src: '/icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    },
    workbox: {
      navigateFallback: '/offline',
      globPatterns: ['**/*.{js,css,html,png,svg,ico,woff2}'],
      runtimeCaching: [
        {
          urlPattern: ({ request }: { request: Request }) => request.mode === 'navigate',
          handler: 'NetworkFirst',
          options: {
            cacheName: 'page-navigations',
            expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 7 },
            networkTimeoutSeconds: 5,
            cacheableResponse: { statuses: [0, 200] },
          },
        },
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
    '/**': {
      headers: {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'SAMEORIGIN',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy':
          'camera=(), microphone=(), geolocation=(self), accelerometer=(), gyroscope=(), magnetometer=(), midi=(), usb=(), payment=(), display-capture=()',
        // Report-Only first — switch to Content-Security-Policy once violations confirmed zero
        'Content-Security-Policy-Report-Only': [
          "default-src 'self'",
          // Scripts: GTM, AdSense, Prebid, Turnstile
          "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://pagead2.googlesyndication.com https://cdn.jsdelivr.net https://challenges.cloudflare.com",
          // Styles: Nuxt scoped + Google Fonts
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
          // Fonts: Google Fonts CDN
          "font-src 'self' https://fonts.gstatic.com",
          // Images: Cloudinary, CF Images, GA pixel, flags, Google OAuth avatars, data URIs
          "img-src 'self' data: https://res.cloudinary.com https://imagedelivery.net https://flagcdn.com https://*.googleusercontent.com https://*.usercontent.google.com https://accounts.google.com https://picsum.photos https://www.google.com https://www.google-analytics.com https://www.googletagmanager.com",
          // Fetch/XHR: Supabase, GA, GTM
          "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://www.google-analytics.com https://www.googletagmanager.com https://pagead2.googlesyndication.com",
          // Frames: Turnstile widget
          'frame-src https://challenges.cloudflare.com',
          // Workers: Vite dev + workbox service workers
          "worker-src 'self' blob:",
          // Block plugins/objects
          "object-src 'none'",
          // Block base tag hijacking
          "base-uri 'self'",
          // Block form submissions to external origins
          "form-action 'self'",
        ].join('; '),
      },
    },
    '/': { swr: 60 * 10 },
    '/vehiculo/**': { swr: 60 * 5 },
    '/noticias': { swr: 60 * 10 },
    '/noticias/**': { swr: 60 * 30 },
    '/guia': { swr: 60 * 60 },
    '/guia/**': { swr: 60 * 60 },
    '/sobre-nosotros': { prerender: true },
    '/transparencia': { prerender: true },
    '/preguntas-frecuentes': { prerender: true },
    '/top-dealers': { swr: 60 * 60 },
    '/servicios-postventa': { prerender: true },
    '/legal': { prerender: true },
    '/legal/**': { prerender: true },
    '/subastas': { swr: 60 },
    '/subastas/**': { swr: 60 },
    '/admin/**': { ssr: false },
    '/dashboard/**': { ssr: false },
    '/perfil/**': { ssr: false },
    '/:slug': { swr: 60 * 10 },
    '/perfil/comparador': { ssr: false },
    '/perfil/mensajes': { ssr: false },
    '/perfil/reservas': { ssr: false },
    '/api/__sitemap**': { cors: true, swr: 60 * 60 * 6 },
    '/api/merchant-feed**': { cors: true, swr: 60 * 60 * 12 },
    '/api/health**': { cors: true },
    '/api/market-report': { swr: 60 * 60 * 6 },
    '/api/v1/valuation**': { swr: 60 * 60 },
    '/api/market/valuation**': { swr: 60 * 60 },
    '/api/widget/**': { swr: 60 * 5 },
    '/api/search**': { swr: 60 },
    '/embed/**': { swr: 60 * 5 },
    '/images/**': { headers: { 'Cache-Control': 'public, max-age=2592000, immutable' } },
    '/_nuxt/**': { headers: { 'Cache-Control': 'public, max-age=31536000, immutable' } },
  },

  nitro: {
    prerender: {
      // Crawl links from prerendered pages to discover more routes
      crawlLinks: true,
      // Static pages to always prerender (SEO landings)
      routes: [
        '/',
        '/sobre-nosotros',
        '/transparencia',
        '/precios',
        '/servicios-postventa',
        '/valoracion',
        '/top-dealers',
        '/guia',
        '/noticias',
        '/subastas',
        '/datos',
      ],
    },
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
    supabaseProjectRef: process.env.SUPABASE_PROJECT_REF || '',
    supabaseManagementApiKey: process.env.SUPABASE_MANAGEMENT_API_KEY || '',
    sentryOrgSlug: process.env.SENTRY_ORG_SLUG || '',
    sentryAuthToken: process.env.SENTRY_AUTH_TOKEN || '',
    imagePipelineMode: process.env.IMAGE_PIPELINE_MODE || 'cloudinary',
    infraAlertEmail: process.env.INFRA_ALERT_EMAIL || 'admin@tracciona.com',
    infraThresholdWarning: Number.parseInt(process.env.INFRA_ALERT_THRESHOLD_WARNING || '70'),
    infraThresholdCritical: Number.parseInt(process.env.INFRA_ALERT_THRESHOLD_CRITICAL || '85'),
    infraThresholdEmergency: Number.parseInt(process.env.INFRA_ALERT_THRESHOLD_EMERGENCY || '95'),
    geoBlockingEnabled: process.env.NUXT_GEO_BLOCKING_ENABLED || '',
    geoBlockingCountries: process.env.NUXT_GEO_BLOCKING_COUNTRIES || '',
    geoBlockingMode: process.env.NUXT_GEO_BLOCKING_MODE || 'allow',
    cloudinaryApiKey: process.env.CLOUDINARY_API_KEY || '',
    cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET || '',
    public: {
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'https://tracciona.com',
      siteName: process.env.NUXT_PUBLIC_SITE_NAME || 'Tracciona',
      vertical: process.env.NUXT_PUBLIC_VERTICAL || 'tracciona',
      cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
      cloudinaryUploadPreset: process.env.CLOUDINARY_UPLOAD_PRESET || '',
      googleClientId: process.env.GOOGLE_CLIENT_ID || '',
      googleAdsId: process.env.NUXT_PUBLIC_GOOGLE_ADS_ID || '',
      gtmId: process.env.NUXT_PUBLIC_GTM_ID || '',
      turnstileSiteKey: process.env.TURNSTILE_SITE_KEY || '',
      sentryDsn: process.env.NUXT_PUBLIC_SENTRY_DSN || '',
      vapidPublicKey: process.env.NUXT_PUBLIC_VAPID_PUBLIC_KEY || '',
      adsenseId: process.env.NUXT_PUBLIC_ADSENSE_ID || '',
      adsenseSlotId: process.env.NUXT_PUBLIC_ADSENSE_SLOT_ID || '',
      prebidEnabled: process.env.NUXT_PUBLIC_PREBID_ENABLED === 'true',
      prebidTimeout: Number.parseInt(process.env.NUXT_PUBLIC_PREBID_TIMEOUT || '1500'),
    },
  },

  vite: {
    optimizeDeps: {
      include: ['cookie'],
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id: string) {
            if (id.includes('chart.js') || id.includes('vue-chartjs')) return 'vendor-charts'
            if (id.includes('jspdf')) return 'vendor-pdf'
            if (id.includes('dompurify') || id.includes('isomorphic-dompurify'))
              return 'vendor-sanitize'
            if (id.includes('@stripe')) return 'vendor-stripe'
            if (id.includes('exceljs')) return 'vendor-excel'
          },
        },
      },
    },
  },

  features: {
    inlineStyles: true,
  },

  experimental: {
    payloadExtraction: true,
  },

  css: [
    '@/assets/css/tokens.css',
    '@/assets/css/interactions.css',
    '@/assets/css/themes.css',
    '@/assets/css/print.css',
  ],

  app: {
    pageTransition: { name: 'page', mode: 'out-in' },
    layoutTransition: { name: 'layout', mode: 'out-in' },
    head: {
      htmlAttrs: { lang: 'es' },
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1, viewport-fit=cover',
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
        { rel: 'dns-prefetch', href: 'https://imagedelivery.net' },
        ...(process.env.SUPABASE_URL
          ? [{ rel: 'dns-prefetch', href: process.env.SUPABASE_URL }]
          : []),
        { rel: 'dns-prefetch', href: 'https://flagcdn.com' },
        { rel: 'dns-prefetch', href: 'https://www.googletagmanager.com' },
        { rel: 'preconnect', href: 'https://res.cloudinary.com', crossorigin: '' },
        { rel: 'preconnect', href: 'https://imagedelivery.net', crossorigin: '' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        ...(process.env.SUPABASE_URL
          ? [{ rel: 'preconnect', href: process.env.SUPABASE_URL }]
          : []),
      ],
    },
  },
})

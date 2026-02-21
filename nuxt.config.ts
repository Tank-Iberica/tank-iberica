// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  devServer: {
    port: 3000,
    host: '0.0.0.0',
  },

  modules: [
    '@nuxtjs/supabase',
    '@nuxtjs/i18n',
    '@vueuse/nuxt',
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
    '/perfil/**': { ssr: false },
    '/api/**': { cors: true },
  },

  runtimeConfig: {
    cronSecret: process.env.CRON_SECRET || '',
    resendApiKey: process.env.RESEND_API_KEY || '',
    turnstileSecretKey: process.env.TURNSTILE_SECRET_KEY || '',
    anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
    whatsappApiToken: process.env.WHATSAPP_API_TOKEN || '',
    whatsappPhoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
    whatsappVerifyToken: process.env.WHATSAPP_VERIFY_TOKEN || '',
    public: {
      vertical: process.env.NUXT_PUBLIC_VERTICAL || 'tracciona',
      cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
      cloudinaryUploadPreset: process.env.CLOUDINARY_UPLOAD_PRESET || '',
      googleClientId: process.env.GOOGLE_CLIENT_ID || '',
      turnstileSiteKey: process.env.TURNSTILE_SITE_KEY || '',
    },
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
        { rel: 'preconnect', href: 'https://res.cloudinary.com', crossorigin: '' },
      ],
      script: [
        ...(process.env.GOOGLE_ADS_ID
          ? [
              {
                src: `https://www.googletagmanager.com/gtag/js?id=${process.env.GOOGLE_ADS_ID}`,
                async: true,
              },
              {
                children: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${process.env.GOOGLE_ADS_ID}');`,
              },
            ]
          : []),
      ],
    },
  },
})

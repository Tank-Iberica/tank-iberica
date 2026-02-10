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
  ],

  site: {
    url: 'https://tankiberica.com',
  },

  sitemap: {
    exclude: ['/admin/**', '/confirm'],
    urls: [
      { loc: '/', changefreq: 'daily', priority: 1.0 },
      { loc: '/noticias', changefreq: 'daily', priority: 0.7 },
      { loc: '/sobre-nosotros', changefreq: 'monthly', priority: 0.5 },
      { loc: '/legal', changefreq: 'yearly', priority: 0.3 },
    ],
  },

  supabase: {
    redirectOptions: {
      login: '/',
      callback: '/confirm',
      exclude: ['/', '/vehiculo/*', '/noticias', '/noticias/*', '/sobre-nosotros', '/legal', '/agenda', '/admin', '/admin/*'],
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
    strategy: 'no_prefix',
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'tank_lang',
      fallbackLocale: 'es',
    },
  },

  image: {
    cloudinary: {
      baseURL: `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME || 'djhcqgyjr'}/image/upload/`,
    },
  },

  runtimeConfig: {
    public: {
      cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME || 'djhcqgyjr',
      cloudinaryUploadPreset: process.env.CLOUDINARY_UPLOAD_PRESET || '',
    },
  },

  css: ['@/assets/css/tokens.css'],

  app: {
    head: {
      htmlAttrs: { lang: 'es' },
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1',
      title: 'Tank Iberica',
      meta: [
        { name: 'description', content: 'Compra, venta y alquiler de vehículos industriales: semirremolques, cisternas, cabezas tractoras, camiones y más.' },
        { property: 'og:site_name', content: 'Tank Iberica' },
        { property: 'og:locale', content: 'es_ES' },
        { property: 'og:locale:alternate', content: 'en_GB' },
      ],
      link: [
        { rel: 'icon', href: '/favicon.ico' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap' },
      ],
    },
  },
})

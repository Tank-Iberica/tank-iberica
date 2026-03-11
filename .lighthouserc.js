module.exports = {
  ci: {
    collect: {
      url: [
        '/',
        '/vehiculo/test',
        '/noticias',
        '/guia',
        '/sobre-nosotros',
      ],
      numberOfRuns: 3,
      settings: {
        chromeFlags: ['--no-sandbox'],
        // Throttle to simulate realistic mobile conditions
        throttlingMethod: 'simulate',
        formFactor: 'mobile',
        screenEmulation: {
          mobile: true,
          width: 390,
          height: 844,
          deviceScaleFactor: 3,
        },
      },
    },
    assert: {
      assertions: {
        // Category scores
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.9 }],
        // Core Web Vitals (https://web.dev/vitals/)
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],   // LCP < 2.5s
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],     // CLS < 0.1
        'interaction-to-next-paint': ['warn', { maxNumericValue: 200 }],    // INP < 200ms
        'total-blocking-time': ['warn', { maxNumericValue: 300 }],          // TBT < 300ms (FID proxy)
        // Performance budget
        'interactive': ['warn', { maxNumericValue: 3500 }],                 // TTI < 3.5s
        'first-contentful-paint': ['warn', { maxNumericValue: 1800 }],      // FCP < 1.8s
        // Accessibility specifics
        'color-contrast': ['error', { minScore: 1 }],
        'image-alt': ['error', { minScore: 1 }],
        'button-name': ['error', { minScore: 1 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};

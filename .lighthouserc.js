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
      },
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.8 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.9 }],
        'largest-contentful-paint': ['warn', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['warn', { maxNumericValue: 0.1 }],
        'interactive': ['warn', { maxNumericValue: 3500 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};

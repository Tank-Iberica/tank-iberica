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
        'categories:performance': ['warn', { minScore: 0.7 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['error', { minScore: 0.85 }],
        'categories:seo': ['error', { minScore: 0.9 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};

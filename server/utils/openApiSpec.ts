/**
 * OpenAPI 3.0 specification for Tracciona public API.
 * Served at /api/docs
 */

import { getSiteUrl, getSiteName } from './siteConfig'

export function generateOpenApiSpec(): Record<string, unknown> {
  const siteUrl = getSiteUrl()
  const siteName = getSiteName()

  return {
    openapi: '3.0.3',
    info: {
      title: `${siteName} API`,
      description: `REST API for ${siteName} — marketplace de vehículos industriales. Authentication via Supabase JWT Bearer tokens.`,
      version: '1.0.0',
      contact: { email: 'tankiberica@gmail.com' },
    },
    servers: [
      { url: `${siteUrl}/api`, description: 'Production' },
    ],
    tags: [
      { name: 'Search', description: 'Vehicle search and discovery' },
      { name: 'Vehicles', description: 'Vehicle operations' },
      { name: 'Market', description: 'Market data and valuations' },
      { name: 'Dealer', description: 'Dealer portal endpoints' },
      { name: 'Credits', description: 'Credit-based premium features' },
      { name: 'Reviews', description: 'Seller reviews and ratings' },
      { name: 'Account', description: 'User account management' },
      { name: 'Auth', description: 'Authentication helpers' },
      { name: 'Alerts', description: 'Price and search alerts' },
      { name: 'Reservations', description: 'Vehicle reservations' },
      { name: 'Health', description: 'System health and monitoring' },
    ],
    paths: {
      '/search': {
        get: {
          tags: ['Search'],
          summary: 'Search vehicles',
          description: 'Full-text search with filters for brand, subcategory, price range, location, etc.',
          parameters: [
            { name: 'q', in: 'query', schema: { type: 'string' }, description: 'Search query' },
            { name: 'brand', in: 'query', schema: { type: 'string' }, description: 'Filter by brand' },
            { name: 'subcategory', in: 'query', schema: { type: 'string' }, description: 'Filter by subcategory slug' },
            { name: 'min_price', in: 'query', schema: { type: 'number' }, description: 'Minimum price (EUR)' },
            { name: 'max_price', in: 'query', schema: { type: 'number' }, description: 'Maximum price (EUR)' },
            { name: 'location_province', in: 'query', schema: { type: 'string' }, description: 'Province filter' },
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 }, description: 'Page number' },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 24 }, description: 'Results per page' },
            { name: 'sort', in: 'query', schema: { type: 'string', enum: ['newest', 'price_asc', 'price_desc', 'relevance'] }, description: 'Sort order' },
          ],
          responses: {
            200: {
              description: 'Search results',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/SearchResult' } } },
            },
          },
        },
      },
      '/vehicles/{id}/protect': {
        post: {
          tags: ['Vehicles'],
          summary: 'Report a vehicle for review',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
          ],
          requestBody: {
            content: { 'application/json': { schema: { type: 'object', properties: { reason: { type: 'string' } }, required: ['reason'] } } },
          },
          responses: { 200: { description: 'Report submitted' }, 401: { description: 'Unauthorized' } },
        },
      },
      '/market/valuation': {
        get: {
          tags: ['Market'],
          summary: 'Get market valuation for a vehicle configuration',
          parameters: [
            { name: 'brand', in: 'query', required: true, schema: { type: 'string' } },
            { name: 'subcategory', in: 'query', required: true, schema: { type: 'string' } },
            { name: 'year', in: 'query', schema: { type: 'integer' } },
            { name: 'location_province', in: 'query', schema: { type: 'string' } },
          ],
          responses: {
            200: { description: 'Valuation data', content: { 'application/json': { schema: { $ref: '#/components/schemas/Valuation' } } } },
          },
        },
      },
      '/market/price-recommendation': {
        get: {
          tags: ['Market'],
          summary: 'Get pricing recommendation',
          parameters: [
            { name: 'brand', in: 'query', required: true, schema: { type: 'string' } },
            { name: 'subcategory', in: 'query', required: true, schema: { type: 'string' } },
          ],
          responses: { 200: { description: 'Price recommendation' } },
        },
      },
      '/market-report/latest': {
        get: {
          tags: ['Market'],
          summary: 'Get latest market report',
          responses: {
            200: { description: 'Market report data' },
            404: { description: 'No report available' },
          },
        },
      },
      '/v1/valuation': {
        get: {
          tags: ['Market'],
          summary: 'External valuation API (API key required)',
          security: [{ apiKeyAuth: [] }],
          parameters: [
            { name: 'brand', in: 'query', required: true, schema: { type: 'string' } },
            { name: 'subcategory', in: 'query', required: true, schema: { type: 'string' } },
          ],
          responses: {
            200: { description: 'Valuation result' },
            401: { description: 'Invalid API key' },
            429: { description: 'Rate limit exceeded' },
          },
        },
      },
      '/dealer/api-key': {
        get: {
          tags: ['Dealer'],
          summary: 'Get current dealer API key',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'API key details' }, 401: { description: 'Unauthorized' } },
        },
        post: {
          tags: ['Dealer'],
          summary: 'Regenerate dealer API key',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'New API key' }, 401: { description: 'Unauthorized' } },
        },
      },
      '/dealer/market-intelligence': {
        get: {
          tags: ['Dealer'],
          summary: 'Market intelligence for dealer stock',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Intelligence data (avg price, position, days on market)' } },
        },
      },
      '/dealer/clone-vehicle': {
        post: {
          tags: ['Dealer'],
          summary: 'Clone an existing vehicle listing',
          security: [{ bearerAuth: [] }],
          requestBody: {
            content: { 'application/json': { schema: { type: 'object', properties: { vehicleId: { type: 'string', format: 'uuid' } }, required: ['vehicleId'] } } },
          },
          responses: { 200: { description: 'Cloned vehicle' }, 401: { description: 'Unauthorized' } },
        },
      },
      '/dealer/import-stock': {
        post: {
          tags: ['Dealer'],
          summary: 'Bulk import vehicles from CSV/Excel',
          security: [{ bearerAuth: [] }],
          requestBody: {
            content: { 'multipart/form-data': { schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } } },
          },
          responses: { 200: { description: 'Import result' }, 401: { description: 'Unauthorized' } },
        },
      },
      '/credits/unlock-vehicle': {
        post: {
          tags: ['Credits'],
          summary: 'Unlock vehicle details with credits',
          security: [{ bearerAuth: [] }],
          requestBody: {
            content: { 'application/json': { schema: { type: 'object', properties: { vehicleId: { type: 'string', format: 'uuid' } }, required: ['vehicleId'] } } },
          },
          responses: { 200: { description: 'Vehicle unlocked' }, 402: { description: 'Insufficient credits' } },
        },
      },
      '/credits/highlight-vehicle': {
        post: {
          tags: ['Credits'],
          summary: 'Highlight a vehicle listing with credits',
          security: [{ bearerAuth: [] }],
          requestBody: {
            content: { 'application/json': { schema: { type: 'object', properties: { vehicleId: { type: 'string', format: 'uuid' }, style: { type: 'string' } }, required: ['vehicleId'] } } },
          },
          responses: { 200: { description: 'Vehicle highlighted' }, 402: { description: 'Insufficient credits' } },
        },
      },
      '/credits/priority-reserve': {
        post: {
          tags: ['Credits'],
          summary: 'Priority reserve a vehicle',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Reserved' }, 402: { description: 'Insufficient credits' } },
        },
      },
      '/credits/export-catalog': {
        post: {
          tags: ['Credits'],
          summary: 'Export catalog as PDF',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'PDF URL' }, 402: { description: 'Insufficient credits' } },
        },
      },
      '/credits/listing-certificate': {
        post: {
          tags: ['Credits'],
          summary: 'Generate listing certificate',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Certificate URL' }, 402: { description: 'Insufficient credits' } },
        },
      },
      '/credits/unlock-advanced-comparison': {
        post: {
          tags: ['Credits'],
          summary: 'Unlock advanced comparison feature',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Comparison unlocked' }, 402: { description: 'Insufficient credits' } },
        },
      },
      '/seller-reviews/{sellerId}': {
        get: {
          tags: ['Reviews'],
          summary: 'Get reviews for a seller',
          parameters: [
            { name: 'sellerId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
          ],
          responses: { 200: { description: 'Reviews list' } },
        },
      },
      '/seller-reviews/create': {
        post: {
          tags: ['Reviews'],
          summary: 'Create a seller review',
          security: [{ bearerAuth: [] }],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    sellerId: { type: 'string', format: 'uuid' },
                    rating: { type: 'integer', minimum: 1, maximum: 5 },
                    title: { type: 'string', maxLength: 120 },
                    content: { type: 'string', maxLength: 2000 },
                    dimensions: { type: 'object' },
                    npsScore: { type: 'integer', minimum: 0, maximum: 10 },
                  },
                  required: ['sellerId', 'rating'],
                },
              },
            },
          },
          responses: { 201: { description: 'Review created' }, 401: { description: 'Unauthorized' } },
        },
      },
      '/account/export': {
        get: {
          tags: ['Account'],
          summary: 'Export personal data (GDPR)',
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: 'JSON data export', content: { 'application/json': { schema: { type: 'object' } } } },
            401: { description: 'Unauthorized' },
          },
        },
      },
      '/account/delete': {
        post: {
          tags: ['Account'],
          summary: 'Delete account and all personal data (GDPR)',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Account deleted' }, 401: { description: 'Unauthorized' } },
        },
      },
      '/auth/check-lockout': {
        post: {
          tags: ['Auth'],
          summary: 'Check if email is locked out from login',
          requestBody: {
            content: { 'application/json': { schema: { type: 'object', properties: { email: { type: 'string', format: 'email' } }, required: ['email'] } } },
          },
          responses: { 200: { description: 'Lockout status' } },
        },
      },
      '/alerts/instant': {
        post: {
          tags: ['Alerts'],
          summary: 'Create an instant price/search alert',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Alert created' }, 401: { description: 'Unauthorized' } },
        },
      },
      '/reservations/create': {
        post: {
          tags: ['Reservations'],
          summary: 'Create a vehicle reservation',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Reservation created' }, 401: { description: 'Unauthorized' } },
        },
      },
      '/reservations/respond': {
        post: {
          tags: ['Reservations'],
          summary: 'Respond to a reservation request',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Response recorded' }, 401: { description: 'Unauthorized' } },
        },
      },
      '/health': {
        get: {
          tags: ['Health'],
          summary: 'System health check',
          responses: { 200: { description: 'System healthy' }, 503: { description: 'System unhealthy' } },
        },
      },
      '/geo': {
        get: {
          tags: ['Search'],
          summary: 'Get geolocation data (provinces, regions)',
          responses: { 200: { description: 'Geo data' } },
        },
      },
      '/widget/{dealerId}': {
        get: {
          tags: ['Dealer'],
          summary: 'Embeddable dealer widget data',
          parameters: [
            { name: 'dealerId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
          ],
          responses: { 200: { description: 'Widget configuration and vehicles' } },
        },
      },
      '/feed/products.xml': {
        get: {
          tags: ['Search'],
          summary: 'Product feed (Google Merchant / Facebook)',
          responses: { 200: { description: 'XML product feed', content: { 'application/xml': {} } } },
        },
      },
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Supabase JWT access token',
        },
        apiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'x-api-key',
          description: 'Dealer API key for external integrations',
        },
      },
      schemas: {
        SearchResult: {
          type: 'object',
          properties: {
            data: { type: 'array', items: { $ref: '#/components/schemas/VehicleSummary' } },
            total: { type: 'integer' },
            page: { type: 'integer' },
            limit: { type: 'integer' },
          },
        },
        VehicleSummary: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            slug: { type: 'string' },
            brand: { type: 'string' },
            model: { type: 'string' },
            year: { type: 'integer' },
            price: { type: 'number' },
            currency: { type: 'string', default: 'EUR' },
            location_province: { type: 'string' },
            status: { type: 'string', enum: ['published', 'sold', 'reserved', 'draft'] },
            cover_url: { type: 'string', format: 'uri' },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        Valuation: {
          type: 'object',
          properties: {
            avg_price: { type: 'number' },
            median_price: { type: 'number' },
            min_price: { type: 'number' },
            max_price: { type: 'number' },
            listings: { type: 'integer' },
            avg_days_to_sell: { type: 'number' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            statusCode: { type: 'integer' },
            message: { type: 'string' },
          },
        },
      },
    },
  }
}

/**
 * Shared API type contracts for Tracciona.
 *
 * These interfaces define the exact shape of data exchanged between
 * client composables and server API endpoints. Both sides MUST conform
 * to these contracts.
 *
 * Conventions:
 *   - Request types: suffix *Request (POST body, PUT body)
 *   - Response types: suffix *Response (GET response, POST response)
 *   - Pagination: PaginatedResponse<T> wrapper
 *   - Errors: ApiError shape
 */

// ────────────────────────────────────────────────────────────
// Common
// ────────────────────────────────────────────────────────────

export interface ApiError {
  statusCode: number
  message: string
  details?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

// ────────────────────────────────────────────────────────────
// Vehicle
// ────────────────────────────────────────────────────────────

export interface VehicleImage {
  url: string
  position: number
  alt_text?: string | null
  cloudinary_public_id?: string | null
}

export interface VehicleSummary {
  id: string
  slug: string
  brand: string
  model: string
  year: number | null
  km: number | null
  price: number | null
  rental_price: number | null
  status: 'published' | 'draft' | 'sold' | 'rented' | 'archived'
  category: string | null
  category_id: string | null
  location: string | null
  vehicle_images: VehicleImage[]
  featured: boolean
  views: number
  vertical: string
}

export interface GenerateDescriptionRequest {
  brand: string
  model: string
  year?: number
  km?: number
  category?: string
  subcategory?: string
}

export interface GenerateDescriptionResponse {
  description: string
}

// ────────────────────────────────────────────────────────────
// Dealer
// ────────────────────────────────────────────────────────────

export interface DealerPublicProfile {
  id: string
  slug: string
  name: string
  description?: string | null
  logo_url?: string | null
  location?: string | null
  phone?: string | null
  website?: string | null
  verified: boolean
  rating?: number | null
}

// ────────────────────────────────────────────────────────────
// Valuation (public API)
// ────────────────────────────────────────────────────────────

export interface ValuationRequest {
  brand: string
  subcategory?: string
  year?: string
  location_province?: string
}

export interface ValuationResponse {
  estimated_price: { min: number; median: number; max: number }
  market_trend: 'rising' | 'falling' | 'stable'
  trend_pct: number
  avg_days_to_sell: number | null
  sample_size: number
  confidence: 'high' | 'medium' | 'low'
  data_date: string
}

// ────────────────────────────────────────────────────────────
// Email
// ────────────────────────────────────────────────────────────

export interface SendEmailRequest {
  to: string
  subject: string
  html: string
  replyTo?: string
  templateId?: string
  templateData?: Record<string, unknown>
}

export interface SendEmailResponse {
  success: boolean
  messageId?: string
}

// ────────────────────────────────────────────────────────────
// Contact / Lead
// ────────────────────────────────────────────────────────────

export interface CreateLeadRequest {
  vehicle_id: string
  dealer_id: string
  name: string
  email: string
  phone?: string
  message: string
}

export interface CreateLeadResponse {
  id: string
  created_at: string
}

// ────────────────────────────────────────────────────────────
// Auth
// ────────────────────────────────────────────────────────────

export interface UserProfile {
  id: string
  name: string | null
  email: string
  phone: string | null
  role: 'user' | 'dealer' | 'admin'
  avatar_url: string | null
  lang: string | null
  preferred_country: string | null
  email_verified: boolean
}

// ────────────────────────────────────────────────────────────
// Geo
// ────────────────────────────────────────────────────────────

export interface GeoResponse {
  country: string | null
}

// ────────────────────────────────────────────────────────────
// Health
// ────────────────────────────────────────────────────────────

export interface HealthResponse {
  status: 'ok' | 'degraded' | 'down'
  version?: string
  timestamp: string
}

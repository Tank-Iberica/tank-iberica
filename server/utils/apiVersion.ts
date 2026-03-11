/**
 * API versioning utilities — version negotiation, deprecation headers.
 *
 * Implements RFC 9110 / draft-ietf-httpapi-deprecation-header conventions:
 *   - `API-Version` response header signals the current version served.
 *   - `Deprecation` header signals when deprecation was announced (ISO 8601).
 *   - `Sunset` header (RFC 8594) signals when the endpoint will stop working (HTTP-date).
 *   - `Link` header with `rel="successor-version"` points to the next version.
 *
 * Versioning strategy:
 *   - /api/v1/*  — current public API (launch baseline)
 *   - /api/v2/*  — planned (when valuation API goes GA with breaking changes)
 *   - Deprecation notice period: ≥ 6 months before Sunset.
 *   - Internal /api/* endpoints are NOT versioned (internal use only).
 *
 * Deprecation timeline:
 *   - v1 sunset: NOT scheduled. No deprecation at this time.
 *   - This file is the single source of truth for all deprecation dates.
 */
import type { H3Event } from 'h3'
import { setHeader } from 'h3'

export type ApiVersion = 'v1' | 'v2'

/**
 * Sunset dates (ISO 8601) for deprecated API versions.
 * Update this map when deprecating a version.
 * If a version is NOT in this map it is NOT deprecated.
 */
export const API_SUNSET_DATES: Partial<Record<ApiVersion, string>> = {
  // v1: '2027-01-01', // example — uncomment when ready to deprecate
}

/**
 * Deprecation announcement dates for deprecated versions.
 * Must be ≥ 6 months before the corresponding sunset date.
 */
export const API_DEPRECATION_ANNOUNCED: Partial<Record<ApiVersion, string>> = {
  // v1: '2026-06-01', // example
}

/**
 * Successor version paths (used in Link rel="successor-version" header).
 */
export const API_SUCCESSOR_PATHS: Partial<Record<ApiVersion, string>> = {
  // v1: '/api/v2/valuation',
}

/**
 * Extract API version segment from a URL path.
 * e.g. "/api/v1/valuation" → "v1"
 */
export function extractVersionFromPath(path: string): ApiVersion | null {
  const match = /\/api\/(v\d+)\//.exec(path)
  const version = match?.[1]
  if (version === 'v1' || version === 'v2') return version
  return null
}

/**
 * Convert ISO 8601 date string to RFC 7231 HTTP-date format.
 * e.g. "2027-01-01" → "Fri, 01 Jan 2027 00:00:00 GMT"
 */
export function toHttpDate(isoDate: string): string {
  return new Date(isoDate).toUTCString()
}

/**
 * Add `API-Version` response header to signal which version is being served.
 * Also adds deprecation headers if the version has been deprecated.
 *
 * @param event  H3 event
 * @param version  The API version being served (e.g. 'v1')
 */
export function setApiVersionHeaders(event: H3Event, version: ApiVersion): void {
  setHeader(event, 'API-Version', version)

  const sunsetDate = API_SUNSET_DATES[version]
  const deprecationDate = API_DEPRECATION_ANNOUNCED[version]
  const successorPath = API_SUCCESSOR_PATHS[version]

  if (!sunsetDate || !deprecationDate) return

  // Deprecation header: ISO 8601 date of announcement
  setHeader(event, 'Deprecation', deprecationDate)

  // Sunset header: RFC 8594 — when it will stop responding (HTTP-date)
  setHeader(event, 'Sunset', toHttpDate(sunsetDate))

  // Link header: successor endpoint
  if (successorPath) {
    setHeader(event, 'Link', `<${successorPath}>; rel="successor-version"`)
  }
}

/**
 * Returns true if the given version is currently deprecated (has a sunset date).
 */
export function isDeprecated(version: ApiVersion): boolean {
  return version in API_SUNSET_DATES
}

/**
 * Returns the number of days remaining until sunset for a deprecated version.
 * Returns null if the version is not deprecated.
 */
export function daysUntilSunset(version: ApiVersion, now = new Date()): number | null {
  const sunsetDate = API_SUNSET_DATES[version]
  if (!sunsetDate) return null
  const sunset = new Date(sunsetDate)
  const diffMs = sunset.getTime() - now.getTime()
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24))
}

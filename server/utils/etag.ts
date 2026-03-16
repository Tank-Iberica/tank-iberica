/**
 * ETag utility for HTTP conditional caching.
 *
 * Generates weak ETags from data and handles If-None-Match checks.
 * Reduces bandwidth by returning 304 Not Modified when content hasn't changed.
 *
 * Usage in a server route:
 *   import { makeEtag, checkEtag } from '~/server/utils/etag'
 *
 *   const data = await fetchData()
 *   const etag = makeEtag(data)
 *   if (checkEtag(event, etag)) return null // 304 already sent
 *
 *   setHeader(event, 'ETag', etag)
 *   return data
 */

import { getHeader, setResponseStatus, setHeader } from 'h3'
import type { H3Event } from 'h3'

/**
 * Generate a weak ETag from any serializable value.
 * Uses a fast hash of the JSON representation.
 */
export function makeEtag(data: unknown): string {
  const str = JSON.stringify(data)
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.codePointAt(i)!
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32-bit integer
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0')
  return `W/"${hex}"`
}

/**
 * Check If-None-Match header and send 304 if ETag matches.
 * Returns true if 304 was sent (caller should return null/undefined).
 * Returns false if content should be sent normally.
 */
export function checkEtag(event: H3Event, etag: string): boolean {
  const ifNoneMatch = getHeader(event, 'if-none-match')
  if (ifNoneMatch && (ifNoneMatch === etag || ifNoneMatch === '*')) {
    setResponseStatus(event, 304)
    setHeader(event, 'ETag', etag)
    return true
  }
  setHeader(event, 'ETag', etag)
  return false
}

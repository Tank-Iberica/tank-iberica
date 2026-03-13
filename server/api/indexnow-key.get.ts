/**
 * Serves the IndexNow verification key at /api/indexnow-key
 * Ref: https://www.indexnow.org/documentation
 */
import { defineEventHandler, setResponseHeader, createError } from 'h3'

export default defineEventHandler((event) => {
  const key = process.env.INDEXNOW_KEY
  if (!key) {
    throw createError({ statusCode: 404, statusMessage: 'IndexNow key not configured' })
  }
  setResponseHeader(event, 'Content-Type', 'text/plain; charset=utf-8')
  setResponseHeader(event, 'Cache-Control', 'public, max-age=86400')
  return key
})

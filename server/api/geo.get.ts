import { defineEventHandler, getRequestHeader, setResponseHeader } from 'h3'

export default defineEventHandler((event) => {
  // Cloudflare Pages adds cf-ipcountry header automatically (free)
  // In local dev there is no cf-ipcountry — default to ES
  const country = getRequestHeader(event, 'cf-ipcountry') || 'ES'
  setResponseHeader(event, 'Cache-Control', 'public, max-age=3600, s-maxage=3600')
  return { country }
})

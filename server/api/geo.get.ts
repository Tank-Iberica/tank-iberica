export default defineEventHandler((event) => {
  // Cloudflare Pages adds cf-ipcountry header automatically (free)
  const country = getRequestHeader(event, 'cf-ipcountry') || null
  return { country }
})

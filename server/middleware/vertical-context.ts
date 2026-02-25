/**
 * Server middleware: injects the current vertical into every request context.
 * Used by server routes to scope queries by vertical.
 */
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const vertical = (config.public.vertical as string) || 'tracciona'
  event.context.vertical = vertical
})

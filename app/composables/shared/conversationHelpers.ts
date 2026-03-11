/**
 * Pure helper functions for useConversation composable.
 * No reactive state — all functions are deterministic and testable in isolation.
 */

/** Mask phone numbers and emails in message text when contact data is not yet shared. */
export function maskContactData(text: string, isDataShared: boolean): string {
  if (isDataShared) return text
  return text
    .replaceAll(/(\+?\d[\d\s\-().]{6,})/g, '[datos ocultos]')
    .replaceAll(/[\w.+-]+@[\w-]+\.[\w.]+/g, '[datos ocultos]')
}

/** Resolve a display name from a user profile row. */
export function resolveUserName(
  u: {
    name: string | null
    apellidos: string | null
    pseudonimo: string | null
    company_name: string | null
  } | null,
): string | undefined {
  if (!u) return undefined
  if (u.pseudonimo) return u.pseudonimo
  if (u.company_name) return u.company_name
  const parts = [u.name, u.apellidos].filter(Boolean)
  return parts.length > 0 ? parts.join(' ') : undefined
}

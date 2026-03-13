/**
 * Centralized contact information for the platform.
 * All components should use these values instead of hardcoding phone numbers.
 */
export function getContact() {
  const domain = useSiteUrl().replace('https://', '').replace('http://', '')
  return {
    phone: '+34645779594',
    whatsappNumber: '34645779594',
    email: `info@${domain}`,
  } as const
}

/** @deprecated Use getContact() instead */
export const CONTACT = {
  phone: '+34645779594',
  whatsappNumber: '34645779594',
  email: 'info@tracciona.com',
} as const

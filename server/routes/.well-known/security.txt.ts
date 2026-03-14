/**
 * RFC 9116 security.txt
 *
 * Provides a standardized way for security researchers to report
 * vulnerabilities. Served at /.well-known/security.txt.
 *
 * Spec: https://securitytxt.org / RFC 9116
 */
import { defineEventHandler } from 'h3'
import { getSiteUrl, getSiteName } from '~~/server/utils/siteConfig'

export default defineEventHandler((event) => {
  const config = useRuntimeConfig()

  // Expiry: 1 year from a fixed reference date (update annually)
  // RFC 9116 requires an Expires field in ISO 8601 format
  const expiresDate = new Date('2027-01-01T00:00:00.000Z').toISOString()

  const contactEmail = config.public.contactEmail || 'tankiberica@gmail.com'
  const siteUrl = config.public.siteUrl || getSiteUrl()

  const content = [
    `Contact: mailto:${contactEmail}`,
    `Contact: ${siteUrl}/seguridad`,
    `Expires: ${expiresDate}`,
    `Preferred-Languages: es, en`,
    `Canonical: ${siteUrl}/.well-known/security.txt`,
    `Policy: ${siteUrl}/politica-divulgacion-seguridad`,
    `Encryption: ${siteUrl}/pgp-key.txt`,
    `Acknowledgments: ${siteUrl}/hall-of-fame-seguridad`,
    '',
    `# ${getSiteName()} — Responsible Disclosure`,
    '# We appreciate security researchers who help keep our platform safe.',
    '# Please allow up to 72 hours for an initial response.',
  ].join('\n')

  event.node.res.setHeader('Content-Type', 'text/plain; charset=utf-8')
  event.node.res.setHeader('Cache-Control', 'public, max-age=86400') // 24h cache
  return content
})

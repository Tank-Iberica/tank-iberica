/**
 * Redact sensitive fields from objects before logging.
 * Replaces phone numbers, emails, and long text content.
 */
const SENSITIVE_KEYS = [
  'phone',
  'phone_number',
  'email',
  'contact_email',
  'contact_phone',
  'text_content',
  'stack',
  'ip',
  'password',
  'token',
  'secret',
]

export function sanitizeForLog(obj: Record<string, unknown>): Record<string, unknown> {
  const result = { ...obj }
  for (const key of SENSITIVE_KEYS) {
    if (key in result && result[key]) {
      result[key] = '[REDACTED]'
    }
  }
  return result
}

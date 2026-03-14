/**
 * Speculation Rules API — prefetch vehicle detail pages on hover/touch.
 *
 * Injects a <script type="speculationrules"> tag that tells the browser
 * to prefetch URLs matching vehicle detail patterns when they enter the
 * viewport or receive a pointer hover.
 *
 * Progressive enhancement: only activates when the browser supports
 * Speculation Rules (Chromium 109+). Other browsers ignore the tag.
 *
 * #413 — Speculation Rules prefetch by intent (audit #4)
 */
export default defineNuxtPlugin(() => {
  if (!HTMLScriptElement.supports?.('speculationrules')) return

  const rules = {
    prefetch: [
      {
        source: 'document',
        where: {
          and: [
            { href_matches: '/*/*/*' }, // /<dealer>/<vehicle> pattern
            { not: { href_matches: '/admin/*' } },
            { not: { href_matches: '/dashboard/*' } },
            { not: { href_matches: '/auth/*' } },
            { not: { href_matches: '/api/*' } },
          ],
        },
        eagerness: 'moderate', // hover or viewport proximity
      },
    ],
  }

  const script = document.createElement('script')
  script.type = 'speculationrules'
  script.textContent = JSON.stringify(rules)
  document.head.appendChild(script)
})

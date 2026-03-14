/**
 * v-ripple directive — Material-style ripple effect on click.
 * Usage: <button v-ripple>...</button>
 * Respects prefers-reduced-motion.
 */
export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.directive('ripple', {
    mounted(el: HTMLElement) {
      el.style.position = el.style.position || 'relative'
      el.style.overflow = 'hidden'

      const handler = (e: MouseEvent | TouchEvent) => {
        if (globalThis.matchMedia('(prefers-reduced-motion: reduce)').matches) return

        const rect = el.getBoundingClientRect()
        const clientX = e instanceof TouchEvent ? e.touches[0]?.clientX ?? rect.left + rect.width / 2 : e.clientX
        const clientY = e instanceof TouchEvent ? e.touches[0]?.clientY ?? rect.top + rect.height / 2 : e.clientY

        const x = clientX - rect.left
        const y = clientY - rect.top
        const size = Math.max(rect.width, rect.height) * 2

        const ripple = document.createElement('span')
        ripple.style.cssText = `
          position: absolute;
          border-radius: 50%;
          background: rgba(255,255,255,0.25);
          width: ${size}px;
          height: ${size}px;
          left: ${x - size / 2}px;
          top: ${y - size / 2}px;
          transform: scale(0);
          animation: ripple-expand 500ms ease-out forwards;
          pointer-events: none;
        `

        el.appendChild(ripple)
        ripple.addEventListener('animationend', () => ripple.remove(), { once: true })
      }

      el.addEventListener('mousedown', handler)
      el.addEventListener('touchstart', handler, { passive: true })
      ;(el as HTMLElement & { _rippleHandler: typeof handler })._rippleHandler = handler
    },
    unmounted(el: HTMLElement & { _rippleHandler?: (e: MouseEvent | TouchEvent) => void }) {
      if (el._rippleHandler) {
        el.removeEventListener('mousedown', el._rippleHandler)
        el.removeEventListener('touchstart', el._rippleHandler)
      }
    },
  })
})

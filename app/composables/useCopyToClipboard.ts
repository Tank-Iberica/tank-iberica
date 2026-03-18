/**
 * Composable for copy-to-clipboard with visual feedback.
 *
 * Usage:
 *   const { copy, copied } = useCopyToClipboard()
 *   await copy('text to copy')
 *   // `copied` is true for 2s, then auto-resets
 */

export function useCopyToClipboard(resetMs = 2000) {
  const copied = ref(false)
  let timer: ReturnType<typeof setTimeout> | null = null

  async function copy(text: string): Promise<boolean> {
    if (!text) return false

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text)
      } else {
        // Fallback for older browsers / insecure contexts
        const textarea = document.createElement('textarea')
        textarea.value = text
        textarea.style.position = 'fixed'
        textarea.style.left = '-9999px'
        textarea.style.opacity = '0'
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
      }

      if (timer) clearTimeout(timer)
      copied.value = true
      timer = setTimeout(() => {
        copied.value = false
      }, resetMs)

      return true
    } catch {
      copied.value = false
      return false
    }
  }

  return { copy, copied: readonly(copied) }
}

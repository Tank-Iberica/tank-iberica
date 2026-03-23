/**
 * Dealer QR Code Composable
 * Generates a QR code for the dealer's portal URL with share functionality.
 */
import QRCode from 'qrcode'

export function useDealerQR(portalSlug: Ref<string>) {
  const config = useRuntimeConfig()
  const qrDataUrl = ref('')
  const generating = ref(false)

  const portalFullUrl = computed(() => {
    if (!portalSlug.value) return ''
    const base = config.public.siteUrl || 'https://tracciona.com'
    return `${base}/${portalSlug.value}`
  })

  /** Trackable URL through /api/go/ redirect */
  function trackedUrl(source: string, medium?: string) {
    if (!portalSlug.value) return ''
    const base = config.public.siteUrl || 'https://tracciona.com'
    const params = new URLSearchParams({ utm_source: source })
    if (medium) params.set('utm_medium', medium)
    return `${base}/api/go/${portalSlug.value}?${params}`
  }

  const qrTrackedUrl = computed(() => trackedUrl('qr', 'qr_code'))

  async function generateQR() {
    if (!qrTrackedUrl.value) return
    generating.value = true
    try {
      qrDataUrl.value = await QRCode.toDataURL(qrTrackedUrl.value, {
        width: 512,
        margin: 2,
        color: { dark: '#23424A', light: '#FFFFFF' },
        errorCorrectionLevel: 'M',
      })
    } catch {
      qrDataUrl.value = ''
    } finally {
      generating.value = false
    }
  }

  function downloadQR() {
    if (!qrDataUrl.value) return
    const link = document.createElement('a')
    link.download = `qr-${portalSlug.value}.png`
    link.href = qrDataUrl.value
    link.click()
  }

  async function shareNative() {
    const url = trackedUrl('share', 'native')
    if (!navigator.share || !url) return false
    try {
      await navigator.share({ title: `Portal ${portalSlug.value}`, url })
      return true
    } catch {
      return false
    }
  }

  function shareWhatsApp() {
    const url = trackedUrl('share', 'whatsapp')
    if (!url) return
    window.open(`https://wa.me/?text=${encodeURIComponent(url)}`, '_blank')
  }

  function shareFacebook() {
    const url = trackedUrl('share', 'facebook')
    if (!url) return
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank')
  }

  function shareTwitter() {
    const url = trackedUrl('share', 'twitter')
    if (!url) return
    window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}`, '_blank')
  }

  function shareTelegram() {
    const url = trackedUrl('share', 'telegram')
    if (!url) return
    window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}`, '_blank')
  }

  function shareEmail() {
    const url = trackedUrl('share', 'email')
    if (!url) return
    const subject = encodeURIComponent(`Portal ${portalSlug.value}`)
    const body = encodeURIComponent(url)
    window.open(`mailto:?subject=${subject}&body=${body}`)
  }

  function copyLink() {
    if (!portalFullUrl.value) return Promise.resolve(false)
    return navigator.clipboard
      .writeText(portalFullUrl.value)
      .then(() => true)
      .catch(() => false)
  }

  // Auto-generate when slug is available
  watch(
    portalFullUrl,
    (url) => {
      if (url) generateQR()
    },
    { immediate: true },
  )

  return {
    qrDataUrl,
    generating,
    portalFullUrl,
    generateQR,
    downloadQR,
    shareNative,
    shareWhatsApp,
    shareFacebook,
    shareTwitter,
    shareTelegram,
    shareEmail,
    copyLink,
  }
}

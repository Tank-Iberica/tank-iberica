/**
 * Composable que gestiona preferencias de accesibilidad:
 * - Tema (color-mode: system/light/dark/high-contrast)
 * - Tamaño de fuente (cookie + data-font-size en <html>)
 */
export const useAccessibility = () => {
  const colorMode = useColorMode()
  const fontSizeCookie = useCookie<string>('tracciona_font_size', {
    default: () => 'normal',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  })

  // Aplica data-font-size al <html> para que el CSS lo capture
  useHead({
    htmlAttrs: computed(() => ({
      'data-font-size': fontSizeCookie.value !== 'normal' ? fontSizeCookie.value : undefined,
    })),
  })

  function setFontSize(size: string) {
    fontSizeCookie.value = size
  }

  return {
    colorMode,
    fontSize: fontSizeCookie,
    setFontSize,
  }
}

/**
 * Composable for merging dealer theme over vertical theme.
 * Dealer overrides only what they set; rest inherits from vertical.
 */

export function useDealerTheme() {
  const { config: verticalConfig } = useVerticalConfig()

  /**
   * Merge dealer theme over vertical theme.
   * Dealer overrides only what they set; rest inherits from vertical.
   */
  function mergedTheme(
    dealerTheme: Record<string, string> | null | undefined,
  ): Record<string, string> {
    const base = (verticalConfig.value?.theme as Record<string, string>) || {}
    if (!dealerTheme || Object.keys(dealerTheme).length === 0) return base
    return { ...base, ...dealerTheme }
  }

  /**
   * Apply dealer theme CSS custom properties to document root.
   * Falls back to vertical theme for unset properties.
   */
  function applyDealerTheme(dealerTheme: Record<string, string> | null | undefined) {
    if (!import.meta.client) return
    const theme = mergedTheme(dealerTheme)
    const root = document.documentElement
    Object.entries(theme).forEach(([key, value]) => {
      root.style.setProperty(`--${key.replace(/_/g, '-')}`, value)
    })
  }

  /**
   * Remove dealer theme overrides and restore vertical theme.
   */
  function restoreVerticalTheme() {
    if (!import.meta.client) return
    const base = (verticalConfig.value?.theme as Record<string, string>) || {}
    const root = document.documentElement
    Object.entries(base).forEach(([key, value]) => {
      root.style.setProperty(`--${key.replace(/_/g, '-')}`, value)
    })
  }

  return { mergedTheme, applyDealerTheme, restoreVerticalTheme }
}

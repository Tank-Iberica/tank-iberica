import { test, expect } from '@playwright/test'

/**
 * Internationalization (i18n) E2E tests.
 *
 * Tracciona uses @nuxtjs/i18n with prefix_except_default strategy:
 * - Spanish (es): no prefix (default) -- e.g. /
 * - English (en): /en/ prefix -- e.g. /en/
 *
 * The language switcher is in the AppHeader component:
 * - Desktop (>=768px): two flag buttons (.lang-flag-btn) for ES and EN
 * - Mobile (<768px): a flag dropdown (.mobile-menu-group with .lang-trigger)
 *
 * These tests run in desktop viewport to use the simpler flag button switcher.
 */
test.describe('Internationalization flow', () => {
  test.use({ viewport: { width: 1280, height: 720 } })

  test('homepage loads in Spanish by default', async ({ page }) => {
    // Navigate to the homepage (no prefix = Spanish)
    await page.goto('/')

    // Wait for the page to be ready
    await page.waitForSelector('.app-header', { state: 'visible' })

    // Verify the page is in Spanish by checking known i18n text
    // The header has "Mi cuenta" button text in Spanish (nav.myAccount = "Mi cuenta")
    // The logo always says TRACCIONA regardless of language
    await expect(page.locator('.logo')).toContainText('TRACCIONA')

    // The URL should NOT have /en/ prefix
    expect(page.url()).not.toContain('/en/')

    // Check the page title contains Spanish SEO title
    await expect(page).toHaveTitle(/Tracciona/)
  })

  test('switching to English updates URL and content', async ({ page }) => {
    await page.goto('/')

    // Wait for header to be ready
    await page.waitForSelector('.app-header', { state: 'visible' })

    // On desktop, the language switcher shows two flag buttons
    // The English flag button has title="English" and contains a GB flag image
    const englishFlagBtn = page.locator('.lang-flag-btn').filter({
      has: page.locator('img[alt="EN"]'),
    })

    await expect(englishFlagBtn).toBeVisible()

    // Click the English flag to switch language
    await englishFlagBtn.click()

    // Wait for URL to update to include /en/ prefix
    await page.waitForURL(/\/en\//)

    // Verify URL now contains /en/
    expect(page.url()).toContain('/en/')

    // Verify the English flag button is now active
    await expect(englishFlagBtn).toHaveClass(/active/)

    // Verify the page title updated
    await expect(page).toHaveTitle(/Tracciona/)
  })

  test('switching back to Spanish removes /en/ prefix', async ({ page }) => {
    // Start on the English version
    await page.goto('/en/')

    // Wait for header
    await page.waitForSelector('.app-header', { state: 'visible' })

    // The Spanish flag button has alt="ES"
    const spanishFlagBtn = page.locator('.lang-flag-btn').filter({
      has: page.locator('img[alt="ES"]'),
    })

    await expect(spanishFlagBtn).toBeVisible()

    // Click the Spanish flag
    await spanishFlagBtn.click()

    // Wait for URL to update (no /en/ prefix)
    await page.waitForURL((url) => !url.pathname.includes('/en/'))

    // Verify URL no longer contains /en/
    expect(page.url()).not.toContain('/en/')

    // Verify the Spanish flag is now active
    await expect(spanishFlagBtn).toHaveClass(/active/)
  })

  test('/en/ route loads the catalog in English', async ({ page }) => {
    // Navigate directly to the English version
    await page.goto('/en/')

    // Wait for the page to load
    await page.waitForSelector('.catalog-section', { state: 'visible' })

    // The URL should contain /en/
    expect(page.url()).toContain('/en/')

    // Verify the English flag is active on desktop
    const englishFlagBtn = page.locator('.lang-flag-btn').filter({
      has: page.locator('img[alt="EN"]'),
    })
    await expect(englishFlagBtn).toHaveClass(/active/)
  })

  test('navigating to English vehicle detail preserves locale', async ({ page }) => {
    // Start on English homepage
    await page.goto('/en/')

    // Wait for vehicle links to appear
    const vehicleLink = page.locator('a[href*="/vehiculo/"]').first()
    await vehicleLink.waitFor({ state: 'visible', timeout: 15000 })

    // Click on a vehicle
    await vehicleLink.click()

    // Wait for vehicle detail page
    await page.waitForURL(/\/vehiculo\//)

    // The URL should still contain /en/ prefix
    expect(page.url()).toContain('/en/')

    // Wait for the vehicle page to render
    await page.waitForSelector('.vehicle-page', { state: 'visible' })
  })
})

test.describe('i18n on mobile viewport', () => {
  test.use({ viewport: { width: 375, height: 812 } })

  test('mobile language switcher works via flag dropdown', async ({ page }) => {
    await page.goto('/')

    // Wait for header to be ready
    await page.waitForSelector('.app-header', { state: 'visible' })

    // On mobile, the language switcher is a .mobile-menu-group with .lang-trigger
    // It shows the current locale flag; clicking opens a dropdown with the other locale
    const langTrigger = page.locator('.lang-trigger')
    await expect(langTrigger).toBeVisible()

    // Click to open the language dropdown
    await langTrigger.click()

    // The dropdown should appear with the alternative locale flag
    const langOption = page.locator('.lang-option')
    await expect(langOption).toBeVisible()

    // Click the alternative language option to switch
    await langOption.click()

    // Wait for the URL to update to /en/ (switching from default Spanish)
    await page.waitForURL(/\/en\//)

    // Verify we're now on the English version
    expect(page.url()).toContain('/en/')
  })
})

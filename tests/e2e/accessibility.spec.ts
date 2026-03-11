import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

/**
 * Accessibility tests using Playwright + axe-core.
 *
 * These tests run against the live dev server and detect
 * WCAG 2.1 accessibility violations automatically.
 *
 * Rules applied: wcag2a, wcag2aa (WCAG 2.1 level AA).
 *
 * Run: npm run test:e2e -- --grep accessibility
 */

test.describe('Accessibility — structural checks', () => {
  test('Home page has correct lang attribute', async ({ page }) => {
    await page.goto('/')
    const lang = await page.getAttribute('html', 'lang')
    expect(lang).toBeTruthy()
    expect(['es', 'en', 'fr', 'de']).toContain(lang)
  })

  test('Home page has a main landmark', async ({ page }) => {
    await page.goto('/')
    const main = page.locator('main')
    await expect(main).toBeVisible()
  })

  test('Images have alt attributes', async ({ page }) => {
    await page.goto('/')
    const images = page.locator('img')
    const count = await images.count()
    for (let i = 0; i < Math.min(count, 10); i++) {
      const alt = await images.nth(i).getAttribute('alt')
      expect(alt).not.toBeNull()
    }
  })

  test('Page has a valid title', async ({ page }) => {
    await page.goto('/')
    const title = await page.title()
    expect(title.length).toBeGreaterThan(0)
  })
})

test.describe('Accessibility — axe-core WCAG 2.1 AA', () => {
  /**
   * Helper: run axe on a page and assert zero violations.
   * Disables rules that conflict with dynamic content or third-party ads.
   */
  async function assertNoViolations(page: Parameters<typeof AxeBuilder>[0]['page']) {
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      // Disable color-contrast: depends on loaded CSS & theme; tested visually
      // Disable region: some Nuxt layouts use divs for regions
      .disableRules(['color-contrast', 'region'])
      .analyze()

    if (results.violations.length > 0) {
      const details = results.violations
        .map(v => `[${v.impact}] ${v.id}: ${v.description} (${v.nodes.length} node(s))`)
        .join('\n')
      // Report as soft assertion to show all violations at once
      expect(results.violations, `Accessibility violations:\n${details}`).toHaveLength(0)
    }
  }

  test('Home page / catalog has no axe violations', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await assertNoViolations(page)
  })

  test('Pricing page has no axe violations', async ({ page }) => {
    await page.goto('/precios')
    await page.waitForLoadState('networkidle')
    await assertNoViolations(page)
  })

  test('Login page has no axe violations', async ({ page }) => {
    await page.goto('/auth/login')
    await page.waitForLoadState('networkidle')
    await assertNoViolations(page)
  })

  test('Register page has no axe violations', async ({ page }) => {
    await page.goto('/auth/registro')
    await page.waitForLoadState('networkidle')
    await assertNoViolations(page)
  })

  test('Auctions index has no axe violations', async ({ page }) => {
    await page.goto('/subastas')
    await page.waitForLoadState('networkidle')
    await assertNoViolations(page)
  })

  test('News index has no axe violations', async ({ page }) => {
    await page.goto('/noticias')
    await page.waitForLoadState('networkidle')
    await assertNoViolations(page)
  })

  test('Legal page has no axe violations', async ({ page }) => {
    await page.goto('/legal')
    await page.waitForLoadState('networkidle')
    await assertNoViolations(page)
  })

  test('Valuation page has no axe violations', async ({ page }) => {
    await page.goto('/valoracion')
    await page.waitForLoadState('networkidle')
    await assertNoViolations(page)
  })
})

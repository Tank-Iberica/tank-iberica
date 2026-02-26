import { test, expect } from '@playwright/test'

/**
 * Basic accessibility tests using Playwright.
 *
 * For comprehensive a11y testing, install @axe-core/playwright:
 *   npm install -D @axe-core/playwright
 *
 * Then uncomment the AxeBuilder tests below.
 */

test.describe('Accessibility', () => {
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

  // Uncomment when @axe-core/playwright is installed:
  // test('Home page has no accessibility violations', async ({ page }) => {
  //   const AxeBuilder = (await import('@axe-core/playwright')).default
  //   await page.goto('/')
  //   const results = await new AxeBuilder({ page }).analyze()
  //   expect(results.violations).toEqual([])
  // })
})

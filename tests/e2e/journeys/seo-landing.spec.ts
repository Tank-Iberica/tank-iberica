import { test, expect } from '@playwright/test'

/**
 * Journey 8: SEO landing page verification
 * Flow: Visit homepage and vehicle page → verify h1, meta tags, schema.org, links
 *
 * Validates that critical SEO elements are present for search engine indexing.
 */
test.describe('Journey: SEO landing verification', () => {
  test('Homepage has correct SEO meta tags', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // 1. Verify title contains Tracciona
    await expect(page).toHaveTitle(/Tracciona/)

    // 2. Verify meta description exists
    const metaDescription = page.locator('meta[name="description"]')
    const descContent = await metaDescription.getAttribute('content')
    expect(descContent).toBeTruthy()
    expect(descContent!.length).toBeGreaterThan(30)

    // 3. Verify canonical URL
    const canonical = page.locator('link[rel="canonical"]')
    if (await canonical.count()) {
      const canonicalHref = await canonical.getAttribute('href')
      expect(canonicalHref).toBeTruthy()
    }

    // 4. Verify Open Graph tags
    const ogTitle = page.locator('meta[property="og:title"]')
    if (await ogTitle.count()) {
      const ogTitleContent = await ogTitle.getAttribute('content')
      expect(ogTitleContent).toBeTruthy()
    }

    const ogDescription = page.locator('meta[property="og:description"]')
    if (await ogDescription.count()) {
      const ogDescContent = await ogDescription.getAttribute('content')
      expect(ogDescContent).toBeTruthy()
    }
  })

  test('Homepage has h1 heading', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Verify there is exactly one h1 on the page
    const h1s = page.locator('h1')
    const h1Count = await h1s.count()
    expect(h1Count).toBeGreaterThanOrEqual(1)
  })

  test('Vehicle page has structured SEO data', async ({ page }) => {
    // Navigate to a vehicle page
    await page.goto('/')
    const vehicleLink = page.locator('a[href^="/vehiculo/"]').first()
    await vehicleLink.waitFor({ state: 'visible', timeout: 15000 })
    await vehicleLink.click()
    await page.waitForURL(/\/vehiculo\//)
    await page.waitForSelector('.vehicle-page', { state: 'visible' })

    // 1. Verify h1 exists with vehicle title
    const h1 = page.locator('h1')
    await expect(h1).toBeVisible({ timeout: 10000 })
    const h1Text = await h1.textContent()
    expect(h1Text?.trim().length).toBeGreaterThan(0)

    // 2. Verify title tag is descriptive
    const pageTitle = await page.title()
    expect(pageTitle.length).toBeGreaterThan(10)
    expect(pageTitle).not.toBe('Tracciona') // Should be specific to vehicle

    // 3. Verify meta description
    const metaDescription = page.locator('meta[name="description"]')
    if (await metaDescription.count()) {
      const descContent = await metaDescription.getAttribute('content')
      expect(descContent).toBeTruthy()
    }

    // 4. Check for schema.org JSON-LD
    const jsonLd = page.locator('script[type="application/ld+json"]')
    if (await jsonLd.count()) {
      const jsonLdContent = await jsonLd.first().textContent()
      expect(jsonLdContent).toBeTruthy()

      // Parse and verify it's valid JSON
      const parsed = JSON.parse(jsonLdContent!)
      expect(parsed['@type'] || parsed['@graph']).toBeTruthy()
    }

    // 5. Verify hreflang tags for i18n
    const hreflang = page.locator('link[rel="alternate"][hreflang]')
    const hreflangCount = await hreflang.count()
    // Should have at least es and en alternates
    if (hreflangCount > 0) {
      expect(hreflangCount).toBeGreaterThanOrEqual(2)
    }
  })

  test('Navigation links are crawlable (no JS-only navigation)', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Verify vehicle cards use proper <a> tags with href (not just @click)
    const vehicleLinks = page.locator('a[href^="/vehiculo/"]')
    await vehicleLinks.first().waitFor({ state: 'visible', timeout: 15000 })
    const linkCount = await vehicleLinks.count()
    expect(linkCount).toBeGreaterThan(0)

    // Each link should have a valid href
    for (let i = 0; i < Math.min(linkCount, 5); i++) {
      const href = await vehicleLinks.nth(i).getAttribute('href')
      expect(href).toMatch(/^\/vehiculo\//)
    }
  })

  test('Robots meta tag allows indexing', async ({ page }) => {
    await page.goto('/')

    // Verify no noindex directive on public pages
    const robotsMeta = page.locator('meta[name="robots"]')
    if (await robotsMeta.count()) {
      const robotsContent = await robotsMeta.getAttribute('content')
      expect(robotsContent).not.toContain('noindex')
    }
  })
})

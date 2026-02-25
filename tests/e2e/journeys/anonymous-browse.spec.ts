import { test, expect } from '@playwright/test'

/**
 * Journey 1: Anonymous buyer browses catalog
 * Flow: Home → catalog → filter → view vehicle → gallery → back
 */
test.describe('Journey: Anonymous buyer browses catalog', () => {
  test('Home → catalog → filter → ficha → gallery → back', async ({ page }) => {
    // 1. Load homepage (which IS the catalog)
    await page.goto('/')
    await expect(page).toHaveTitle(/Tracciona/)
    await page.waitForSelector('.catalog-section', { state: 'visible' })

    // 2. Verify catalog has loaded with vehicle cards
    const vehicleLinks = page.locator('a[href^="/vehiculo/"]')
    await vehicleLinks.first().waitFor({ state: 'visible', timeout: 15000 })
    const cardCount = await vehicleLinks.count()
    expect(cardCount).toBeGreaterThan(0)

    // 3. Try search filter if available
    const searchInput = page.locator(
      'input[type="text"][placeholder*="Buscar"], input[type="search"]',
    )
    if (
      await searchInput
        .first()
        .isVisible()
        .catch(() => false)
    ) {
      await searchInput.first().fill('test')
      await page.waitForTimeout(500)
      await searchInput.first().clear()
      await page.waitForTimeout(500)
    }

    // 4. Click first vehicle card to navigate to detail
    const firstVehicle = vehicleLinks.first()
    const vehicleHref = await firstVehicle.getAttribute('href')
    expect(vehicleHref).toBeTruthy()
    await firstVehicle.click()

    // 5. Verify we're on the vehicle detail page
    await page.waitForURL(/\/vehiculo\//)
    await page.waitForSelector('.vehicle-page', { state: 'visible' })

    // 6. Verify vehicle title (h1) is visible
    const title = page.locator('.vehicle-title')
    await expect(title).toBeVisible({ timeout: 10000 })

    // 7. Verify price is shown
    const price = page.locator('.vehicle-price')
    await expect(price).toBeVisible()

    // 8. Check gallery images
    const gallery = page.locator('.vehicle-gallery-wrapper')
    await expect(gallery).toBeVisible({ timeout: 10000 })
    const images = gallery.locator('img')
    expect(await images.count()).toBeGreaterThan(0)

    // 9. Verify contact buttons are present
    await expect(page.locator('.vehicle-contact-btns')).toBeVisible()

    // 10. Navigate back
    await page.goBack()
    await page.waitForSelector('.catalog-section', { state: 'visible' })
  })
})

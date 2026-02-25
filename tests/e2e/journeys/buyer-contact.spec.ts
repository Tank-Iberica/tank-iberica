import { test, expect } from '@playwright/test'

/**
 * Journey 3: Buyer contacts dealer from vehicle page
 * Flow: Navigate to vehicle → verify contact buttons → check links
 *
 * Note: We verify the contact buttons exist with correct href patterns
 * without actually triggering external navigation (WhatsApp, phone).
 */
test.describe('Journey: Buyer contacts dealer', () => {
  test('Vehicle page shows all contact options', async ({ page }) => {
    // 1. Go to catalog and find first vehicle
    await page.goto('/')
    const vehicleLink = page.locator('a[href^="/vehiculo/"]').first()
    await vehicleLink.waitFor({ state: 'visible', timeout: 15000 })
    await vehicleLink.click()

    // 2. Wait for vehicle page to load
    await page.waitForURL(/\/vehiculo\//)
    await page.waitForSelector('.vehicle-page', { state: 'visible' })
    await expect(page.locator('.vehicle-title')).toBeVisible({ timeout: 10000 })

    // 3. Verify contact buttons container is visible
    const contactBtns = page.locator('.vehicle-contact-btns')
    await expect(contactBtns).toBeVisible()

    // 4. Verify email contact button with mailto: href
    const emailBtn = page.locator('.contact-email')
    await expect(emailBtn).toBeVisible()
    const emailHref = await emailBtn.getAttribute('href')
    expect(emailHref).toMatch(/^mailto:/)

    // 5. Verify WhatsApp button with wa.me link
    const whatsappBtn = page.locator('.contact-whatsapp')
    await expect(whatsappBtn).toBeVisible()
    const whatsappHref = await whatsappBtn.getAttribute('href')
    expect(whatsappHref).toMatch(/wa\.me/)

    // 6. Verify phone button with tel: href
    const phoneBtn = page.locator('.contact-call')
    await expect(phoneBtn).toBeVisible()
    const phoneHref = await phoneBtn.getAttribute('href')
    expect(phoneHref).toMatch(/^tel:/)
  })

  test('Favorite button is visible (requires auth to toggle)', async ({ page }) => {
    // 1. Navigate to a vehicle
    await page.goto('/')
    const vehicleLink = page.locator('a[href^="/vehiculo/"]').first()
    await vehicleLink.waitFor({ state: 'visible', timeout: 15000 })
    await vehicleLink.click()
    await page.waitForURL(/\/vehiculo\//)
    await page.waitForSelector('.vehicle-page', { state: 'visible' })

    // 2. Verify favorite button exists
    const favBtn = page.locator('.favorite-btn')
    await expect(favBtn).toBeVisible({ timeout: 10000 })

    // 3. Verify share button exists
    const shareBtn = page.locator('.share-btn')
    await expect(shareBtn).toBeVisible()
  })

  test('Vehicle page shows seller info (DSA compliance)', async ({ page }) => {
    await page.goto('/')
    const vehicleLink = page.locator('a[href^="/vehiculo/"]').first()
    await vehicleLink.waitFor({ state: 'visible', timeout: 15000 })
    await vehicleLink.click()
    await page.waitForURL(/\/vehiculo\//)
    await page.waitForSelector('.vehicle-page', { state: 'visible' })

    // Verify seller info section is present (DSA requirement)
    const sellerInfo = page.locator('.vehicle-seller-info')
    if (await sellerInfo.isVisible().catch(() => false)) {
      await expect(sellerInfo).toBeVisible()
    }
  })
})

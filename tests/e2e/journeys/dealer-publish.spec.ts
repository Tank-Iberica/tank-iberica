import { test, expect } from '@playwright/test'

/**
 * Journey 4: Dealer publishes a new vehicle
 * Flow: Login as dealer → dashboard → new vehicle form → fill fields → verify
 *
 * Note: Requires E2E_DEALER_EMAIL and E2E_DEALER_PASSWORD env vars.
 * If not set, tests are skipped gracefully.
 */
const dealerEmail = process.env.E2E_DEALER_EMAIL
const dealerPassword = process.env.E2E_DEALER_PASSWORD

test.describe('Journey: Dealer publishes vehicle', () => {
  test.skip(!dealerEmail || !dealerPassword, 'Dealer credentials not configured')

  test('Login as dealer and access dashboard', async ({ page }) => {
    // 1. Login
    await page.goto('/auth/login')
    await page.fill('#login-email', dealerEmail!)
    await page.fill('#login-password', dealerPassword!)
    await page.locator('button[type="submit"].btn-primary').click()

    // 2. Wait for redirect to dashboard
    await page.waitForURL(/\/dashboard/, { timeout: 15000 })

    // 3. Verify dashboard loaded
    const heading = page.locator('.page-header h1, h1')
    await expect(heading).toBeVisible({ timeout: 10000 })
  })

  test('Navigate to new vehicle form', async ({ page }) => {
    // 1. Login
    await page.goto('/auth/login')
    await page.fill('#login-email', dealerEmail!)
    await page.fill('#login-password', dealerPassword!)
    await page.locator('button[type="submit"].btn-primary').click()
    await page.waitForURL(/\/dashboard/, { timeout: 15000 })

    // 2. Click "Publish New" button
    const newVehicleLink = page.locator('a[href="/dashboard/vehiculos/nuevo"]').first()
    if (await newVehicleLink.isVisible().catch(() => false)) {
      await newVehicleLink.click()
      await page.waitForURL(/\/dashboard\/vehiculos\/nuevo/)
    } else {
      // Navigate directly
      await page.goto('/dashboard/vehiculos/nuevo')
    }

    // 3. Verify form loaded
    await expect(page.locator('#brand')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('#model')).toBeVisible()
    await expect(page.locator('#price')).toBeVisible()
  })

  test('New vehicle form has all required fields', async ({ page }) => {
    await page.goto('/auth/login')
    await page.fill('#login-email', dealerEmail!)
    await page.fill('#login-password', dealerPassword!)
    await page.locator('button[type="submit"].btn-primary').click()
    await page.waitForURL(/\/dashboard/, { timeout: 15000 })
    await page.goto('/dashboard/vehiculos/nuevo')

    // Verify all required form fields
    await expect(page.locator('#brand')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('#model')).toBeVisible()
    await expect(page.locator('#year')).toBeVisible()
    await expect(page.locator('#price')).toBeVisible()
    await expect(page.locator('#category')).toBeVisible()
    await expect(page.locator('#description_es')).toBeVisible()

    // Verify submit button
    const submitBtn = page.locator('button[type="submit"].btn-primary')
    await expect(submitBtn).toBeVisible()

    // Verify back link
    const backLink = page.locator('a[href="/dashboard/vehiculos"]')
    await expect(backLink.first()).toBeVisible()
  })
})

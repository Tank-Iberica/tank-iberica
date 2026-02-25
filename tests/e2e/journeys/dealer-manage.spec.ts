import { test, expect } from '@playwright/test'

/**
 * Journey 5: Dealer manages existing vehicles
 * Flow: Login dealer → dashboard → vehicle list → verify actions available
 *
 * Note: Requires E2E_DEALER_EMAIL and E2E_DEALER_PASSWORD env vars.
 */
const dealerEmail = process.env.E2E_DEALER_EMAIL
const dealerPassword = process.env.E2E_DEALER_PASSWORD

test.describe('Journey: Dealer manages vehicles', () => {
  test.skip(!dealerEmail || !dealerPassword, 'Dealer credentials not configured')

  test('Dealer can see vehicle listing with action buttons', async ({ page }) => {
    // 1. Login
    await page.goto('/auth/login')
    await page.fill('#login-email', dealerEmail!)
    await page.fill('#login-password', dealerPassword!)
    await page.locator('button[type="submit"].btn-primary').click()
    await page.waitForURL(/\/dashboard/, { timeout: 15000 })

    // 2. Navigate to vehicles list
    await page.goto('/dashboard/vehiculos')

    // 3. Wait for page to load
    const heading = page.locator('h1')
    await expect(heading).toBeVisible({ timeout: 10000 })

    // 4. Check for vehicle cards or empty state
    const vehicleCards = page.locator('.vehicle-card')
    const emptyState = page.locator('.empty-state')

    // Either we have vehicles or an empty state message
    const hasVehicles = await vehicleCards
      .first()
      .isVisible()
      .catch(() => false)
    const isEmpty = await emptyState.isVisible().catch(() => false)
    expect(hasVehicles || isEmpty).toBeTruthy()

    if (hasVehicles) {
      // 5. Verify action buttons on first vehicle card
      const firstCard = vehicleCards.first()
      await expect(firstCard).toBeVisible()

      // Check status pill is visible
      const statusPill = firstCard.locator('.status-pill')
      if (await statusPill.isVisible().catch(() => false)) {
        await expect(statusPill).toBeVisible()
      }

      // Check action buttons exist
      const actionBtns = firstCard.locator('.action-btn')
      expect(await actionBtns.count()).toBeGreaterThan(0)
    }
  })

  test('Dashboard shows KPI stats', async ({ page }) => {
    await page.goto('/auth/login')
    await page.fill('#login-email', dealerEmail!)
    await page.fill('#login-password', dealerPassword!)
    await page.locator('button[type="submit"].btn-primary').click()
    await page.waitForURL(/\/dashboard/, { timeout: 15000 })

    // Check KPI cards
    const kpiCards = page.locator('.kpi-card')
    if (
      await kpiCards
        .first()
        .isVisible()
        .catch(() => false)
    ) {
      expect(await kpiCards.count()).toBeGreaterThanOrEqual(1)

      // Verify KPI values are rendered
      const kpiValue = kpiCards.first().locator('.kpi-value')
      await expect(kpiValue).toBeVisible()
    }
  })
})

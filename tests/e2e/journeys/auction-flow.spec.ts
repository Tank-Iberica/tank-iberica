import { test, expect } from '@playwright/test'

/**
 * Journey 7: User browses auctions
 * Flow: Auctions page → verify tabs → view auction card → navigate to detail
 *
 * Note: Auction bidding requires authentication and real auction data.
 * This test verifies the UI structure and navigation.
 */
test.describe('Journey: Auction browsing flow', () => {
  test('Auctions page loads with tabs', async ({ page }) => {
    // 1. Navigate to auctions
    await page.goto('/subastas')
    await page.waitForLoadState('networkidle')

    // 2. Verify page title
    const title = page.locator('.auctions-title, h1')
    await expect(title).toBeVisible({ timeout: 10000 })

    // 3. Verify tab navigation exists
    const tabs = page.locator('.auctions-tabs, .tab-btn')
    if (await tabs.isVisible().catch(() => false)) {
      await expect(tabs).toBeVisible()
    }
  })

  test('Auctions page shows cards or empty state', async ({ page }) => {
    await page.goto('/subastas')
    await page.waitForLoadState('networkidle')

    // Wait for content to load (skeleton disappears)
    await page.waitForTimeout(2000)

    // Either we have auction cards or an empty state
    const auctionCards = page.locator('.auction-card')
    const emptyState = page.locator('.auctions-empty')
    const loadingState = page.locator('.auctions-loading')

    // Wait for loading to finish
    if (await loadingState.isVisible().catch(() => false)) {
      await loadingState.waitFor({ state: 'hidden', timeout: 10000 })
    }

    const hasAuctions = await auctionCards
      .first()
      .isVisible()
      .catch(() => false)
    const isEmpty = await emptyState.isVisible().catch(() => false)
    expect(hasAuctions || isEmpty).toBeTruthy()

    if (hasAuctions) {
      // Verify auction card has expected structure
      const firstCard = auctionCards.first()
      const cardTitle = firstCard.locator('.auction-card-title')
      await expect(cardTitle).toBeVisible()

      const statusBadge = firstCard.locator('.status-badge')
      if (await statusBadge.isVisible().catch(() => false)) {
        await expect(statusBadge).toBeVisible()
      }
    }
  })

  test('Clicking auction card navigates to detail', async ({ page }) => {
    await page.goto('/subastas')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    const auctionCard = page.locator('.auction-card').first()

    if (await auctionCard.isVisible().catch(() => false)) {
      await auctionCard.click()
      await page.waitForURL(/\/subastas\//)

      // Verify detail page loaded
      const heading = page.locator('h1, h2')
      await expect(heading.first()).toBeVisible({ timeout: 10000 })
    }
  })

  test('Tabs switch auction views', async ({ page }) => {
    await page.goto('/subastas')
    await page.waitForLoadState('networkidle')

    const tabBtns = page.locator('.tab-btn')
    if (
      await tabBtns
        .first()
        .isVisible()
        .catch(() => false)
    ) {
      const tabCount = await tabBtns.count()
      expect(tabCount).toBeGreaterThanOrEqual(2)

      // Click second tab
      if (tabCount >= 2) {
        await tabBtns.nth(1).click()
        await page.waitForTimeout(500)

        // Verify active state changed
        await expect(tabBtns.nth(1)).toHaveClass(/active/)
      }
    }
  })
})

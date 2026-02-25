import { test, expect } from '@playwright/test'

/**
 * Journey 2: Buyer registers an account
 * Flow: Registration page → select buyer type → fill form → verify success state
 *
 * Note: This test verifies the registration UI flow without actually creating
 * a real account (we test form validation and UI states, not the Supabase call).
 */
test.describe('Journey: Buyer registration flow', () => {
  test('Registration page loads with user type selection', async ({ page }) => {
    await page.goto('/auth/registro')

    // 1. Verify registration page loaded
    const title = page.locator('.auth-title')
    await expect(title).toBeVisible()

    // 2. Verify user type cards are visible (buyer / dealer)
    const typeCards = page.locator('.type-card')
    await expect(typeCards.first()).toBeVisible()
    const typeCount = await typeCards.count()
    expect(typeCount).toBe(2)
  })

  test('Selecting buyer type shows registration form', async ({ page }) => {
    await page.goto('/auth/registro')

    // 1. Click buyer type card (first one)
    const typeCards = page.locator('.type-card')
    await typeCards.first().click()

    // 2. Verify form fields appear
    await expect(page.locator('#reg-name')).toBeVisible()
    await expect(page.locator('#reg-email')).toBeVisible()
    await expect(page.locator('#reg-password')).toBeVisible()
    await expect(page.locator('#reg-confirm')).toBeVisible()

    // 3. Verify submit button is present
    const submitBtn = page.locator('button[type="submit"].btn-primary')
    await expect(submitBtn).toBeVisible()
  })

  test('Form validation prevents empty submission', async ({ page }) => {
    await page.goto('/auth/registro')

    // 1. Select buyer type
    await page.locator('.type-card').first().click()

    // 2. Try to submit empty form
    await page.locator('button[type="submit"].btn-primary').click()

    // 3. Verify form still visible (didn't navigate away)
    await expect(page.locator('#reg-email')).toBeVisible()

    // 4. Fill with mismatched passwords
    await page.fill('#reg-name', 'Test User')
    await page.fill('#reg-email', 'test@example.com')
    await page.fill('#reg-password', 'password123')
    await page.fill('#reg-confirm', 'differentpass')
    await page.locator('button[type="submit"].btn-primary').click()

    // 5. Should still be on registration page (validation failure)
    await expect(page.locator('#reg-confirm')).toBeVisible()
  })

  test('Login link navigates to login page', async ({ page }) => {
    await page.goto('/auth/registro')

    // Click the "already have account" login link
    const loginLink = page.locator('.link-action')
    await expect(loginLink).toBeVisible()
    await loginLink.click()
    await page.waitForURL(/\/auth\/login/)
  })
})

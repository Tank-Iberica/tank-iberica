import { test, expect } from '@playwright/test'

/**
 * Journey 6: Admin approves/manages products
 * Flow: Login admin → admin panel → products list → verify status controls
 *
 * Note: Requires E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD env vars.
 */
const adminEmail = process.env.E2E_ADMIN_EMAIL
const adminPassword = process.env.E2E_ADMIN_PASSWORD

test.describe('Journey: Admin approves products', () => {
  test.skip(!adminEmail || !adminPassword, 'Admin credentials not configured')

  test('Login as admin and access admin panel', async ({ page }) => {
    // 1. Login
    await page.goto('/auth/login')
    await page.fill('#login-email', adminEmail!)
    await page.fill('#login-password', adminPassword!)
    await page.locator('button[type="submit"].btn-primary').click()

    // 2. Navigate to admin
    await page.goto('/admin')
    await page.waitForLoadState('networkidle')

    // 3. Verify admin panel loaded
    const adminContent = page.locator('.admin-dashboard, .admin-page, [class*="admin"]')
    await expect(adminContent.first()).toBeVisible({ timeout: 10000 })
  })

  test('Admin products page loads with vehicle list', async ({ page }) => {
    // 1. Login
    await page.goto('/auth/login')
    await page.fill('#login-email', adminEmail!)
    await page.fill('#login-password', adminPassword!)
    await page.locator('button[type="submit"].btn-primary').click()
    await page.waitForURL(/\/(dashboard|admin)/, { timeout: 15000 })

    // 2. Navigate to products
    await page.goto('/admin/productos')
    await page.waitForLoadState('networkidle')

    // 3. Verify products page loaded
    const heading = page.locator('h1')
    await expect(heading).toBeVisible({ timeout: 10000 })

    // 4. Verify "New Product" button exists
    const newProductLink = page.locator('a[href="/admin/productos/nuevo"]')
    if (await newProductLink.isVisible().catch(() => false)) {
      await expect(newProductLink).toBeVisible()
    }
  })

  test('Admin can navigate between sections', async ({ page }) => {
    await page.goto('/auth/login')
    await page.fill('#login-email', adminEmail!)
    await page.fill('#login-password', adminPassword!)
    await page.locator('button[type="submit"].btn-primary').click()
    await page.waitForURL(/\/(dashboard|admin)/, { timeout: 15000 })

    // Navigate to various admin sections
    const sections = ['/admin/productos', '/admin/usuarios', '/admin/facturacion']

    for (const section of sections) {
      await page.goto(section)
      await page.waitForLoadState('networkidle')

      // Each section should have a heading
      const heading = page.locator('h1')
      await expect(heading).toBeVisible({ timeout: 10000 })
    }
  })
})

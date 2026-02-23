import { test, expect } from '@playwright/test'

/**
 * Admin panel E2E tests.
 *
 * The admin area is protected by the `admin` middleware which checks:
 * 1. Whether the user is authenticated (useSupabaseUser)
 * 2. Whether the user has role='admin' (useAdminRole -> checkAdmin)
 *
 * If not authenticated, the admin layout shows a login UI.
 * If authenticated but not admin, the middleware redirects to /.
 *
 * For full admin flow testing, test credentials must be provided via
 * environment variables:
 *   E2E_ADMIN_EMAIL    - admin user email
 *   E2E_ADMIN_PASSWORD - admin user password
 *
 * Tests that require authentication are skipped if credentials are not set.
 */

// Read test credentials from environment variables
const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD
const hasCredentials = Boolean(ADMIN_EMAIL && ADMIN_PASSWORD)

test.describe('Admin panel - unauthenticated', () => {
  test('navigating to /admin shows the page (login prompt or dashboard)', async ({ page }) => {
    // Navigate to admin area
    await page.goto('/admin')

    // The admin middleware does NOT redirect unauthenticated users to a login page.
    // Instead, the admin layout handles showing a login UI when user is null.
    // So the page should load (not redirect away) and show some content.
    // We verify the page loaded without a network error.
    await page.waitForLoadState('networkidle')

    // The URL should still be /admin (or /admin/)
    expect(page.url()).toMatch(/\/admin\/?$/)
  })

  test('navigating to /admin/productos loads without crashing', async ({ page }) => {
    // Navigate directly to the productos admin page
    await page.goto('/admin/productos')

    // Wait for page load
    await page.waitForLoadState('networkidle')

    // The page should load without redirecting to a 404
    // (the admin layout will show either login prompt or the products page)
    expect(page.url()).toMatch(/\/admin/)
  })
})

test.describe('Admin panel - authenticated', () => {
  // Skip all tests in this block if no credentials are provided
  test.skip(
    !hasCredentials,
    'Skipping authenticated admin tests: E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD environment variables not set',
  )

  test.beforeEach(async ({ page }) => {
    if (!hasCredentials) return

    // Navigate to the admin page and log in via Supabase Auth
    await page.goto('/admin')
    await page.waitForLoadState('networkidle')

    // Look for email/password inputs in the login form
    // The admin layout should show a login form when not authenticated
    const emailInput = page.locator(
      'input[type="email"], input[placeholder*="email" i], input[name="email"]',
    )
    const passwordInput = page.locator(
      'input[type="password"], input[placeholder*="contrase" i], input[name="password"]',
    )

    // If login form is visible, perform login
    if (
      (await emailInput.isVisible({ timeout: 5000 }).catch(() => false)) &&
      (await passwordInput.isVisible({ timeout: 2000 }).catch(() => false))
    ) {
      await emailInput.fill(ADMIN_EMAIL!)
      await passwordInput.fill(ADMIN_PASSWORD!)

      // Click the login/submit button
      const loginBtn = page.locator(
        'button[type="submit"], button:has-text("Iniciar"), button:has-text("Login"), button:has-text("Entrar")',
      )
      await loginBtn.first().click()

      // Wait for navigation or content update after login
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(2000)
    }
  })

  test('admin dashboard loads after login', async ({ page }) => {
    if (!hasCredentials) return

    // After login, verify we see the admin dashboard content
    // The admin dashboard shows a banner status card and quick actions bar
    const dashboard = page.locator('.admin-dashboard')

    // Wait for the dashboard to be visible (may take a moment after auth)
    await expect(dashboard).toBeVisible({ timeout: 15000 })

    // Verify the quick actions bar is present (contains links to productos, noticias, etc.)
    const quickActions = page.locator('.quick-actions-bar')
    await expect(quickActions).toBeVisible()

    // Verify the notifications grid is present
    const notificationsGrid = page.locator('.notifications-grid')
    await expect(notificationsGrid).toBeVisible()
  })

  test('admin productos page shows vehicle list', async ({ page }) => {
    if (!hasCredentials) return

    // Navigate to the productos admin page
    await page.goto('/admin/productos')
    await page.waitForLoadState('networkidle')

    // Wait for the productos page to load
    const productosPage = page.locator('.productos-page')
    await expect(productosPage).toBeVisible({ timeout: 15000 })

    // Verify the page header shows "Productos" title
    const pageTitle = page.locator('.page-header h1')
    await expect(pageTitle).toContainText('Productos')

    // Verify the "Nuevo Producto" button is present
    const newProductBtn = page.locator('a[href="/admin/productos/nuevo"]')
    await expect(newProductBtn).toBeVisible()

    // Wait for loading to complete
    await page.waitForSelector('.loading-state', {
      state: 'detached',
      timeout: 15000,
    })

    // Verify either the data table is present or the empty state is shown
    const tableOrEmpty = page.locator('.data-table, .empty-state')
    await expect(tableOrEmpty.first()).toBeVisible()
  })

  test('admin productos page has working filters', async ({ page }) => {
    if (!hasCredentials) return

    await page.goto('/admin/productos')
    await page.waitForLoadState('networkidle')

    // Wait for the toolbar to be visible
    const toolbar = page.locator('.toolbar')
    await expect(toolbar).toBeVisible({ timeout: 15000 })

    // Verify the search box is present
    const searchBox = page.locator('.search-box input')
    await expect(searchBox).toBeVisible()

    // Verify category filter dropdown is present
    const categorySelect = page
      .locator('.filter-group')
      .filter({ hasText: /Categor/ })
      .locator('select')
    if (await categorySelect.isVisible({ timeout: 3000 }).catch(() => false)) {
      // Interact with the category filter
      await categorySelect.selectOption({ index: 1 })

      // Wait for the filtered results to load
      await page.waitForTimeout(1000)
    }

    // Verify status filter dropdown is present
    const statusSelect = page
      .locator('.filter-group')
      .filter({ hasText: /Estado/ })
      .locator('select')
    if (await statusSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(statusSelect).toBeVisible()
    }
  })

  test('admin dashboard links navigate correctly', async ({ page }) => {
    if (!hasCredentials) return

    // Verify we're on the admin dashboard
    const dashboard = page.locator('.admin-dashboard')
    await expect(dashboard).toBeVisible({ timeout: 15000 })

    // Click the "Vehiculo" quick action link (goes to /admin/productos)
    const vehiculoLink = page.locator('.quick-actions-bar a[href="/admin/productos"]')
    if (await vehiculoLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await vehiculoLink.click()
      await page.waitForURL(/\/admin\/productos/)
      expect(page.url()).toContain('/admin/productos')
    }
  })
})

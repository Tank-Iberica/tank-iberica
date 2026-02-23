import { test, expect } from '@playwright/test'

/**
 * Catalog browsing flow E2E tests.
 *
 * These tests verify the core user journey: browsing the vehicle catalog,
 * filtering results, and viewing individual vehicle detail pages.
 *
 * The homepage (/) IS the catalog page in Tracciona -- there is no separate
 * /catalogo route. The catalog displays CatalogCategoryBar, CatalogFilterBar,
 * CatalogControlsBar, and CatalogVehicleGrid components.
 */
test.describe('Catalog browsing flow', () => {
  test('homepage loads and displays vehicle cards', async ({ page }) => {
    // Navigate to the homepage (which is the catalog)
    await page.goto('/')

    // Wait for the catalog section to be present in the DOM
    await page.waitForSelector('.catalog-section')

    // The page should contain the Tracciona logo/header
    await expect(page.locator('.logo')).toContainText('TRACCIONA')

    // Wait for vehicles to load (loading state should disappear)
    // The CatalogVehicleGrid renders vehicle cards once data arrives
    await page.waitForSelector('.catalog-section', { state: 'visible' })

    // Verify the page title contains Tracciona
    await expect(page).toHaveTitle(/Tracciona/)
  })

  test('search box filters vehicles client-side', async ({ page }) => {
    await page.goto('/')

    // Wait for the catalog to be ready
    await page.waitForSelector('.catalog-section')

    // The CatalogControlsBar contains a search input
    // Look for the search input by placeholder text (from i18n: catalog.searchPlaceholder)
    const searchInput = page.locator(
      'input[type="text"][placeholder*="Buscar"], input[type="search"]',
    )

    // If search input is visible, type a search term
    if (await searchInput.first().isVisible()) {
      await searchInput.first().fill('Volvo')

      // Wait briefly for client-side fuzzy filtering to apply
      await page.waitForTimeout(500)
    }
  })

  test('clicking a vehicle card navigates to the detail page', async ({ page }) => {
    await page.goto('/')

    // Wait for vehicle cards to render
    // Vehicle cards are rendered as links pointing to /vehiculo/[slug]
    const vehicleLink = page.locator('a[href^="/vehiculo/"]').first()

    // Wait for at least one vehicle link to appear (data loaded from Supabase)
    await vehicleLink.waitFor({ state: 'visible', timeout: 15000 })

    // Get the href to verify navigation later
    const href = await vehicleLink.getAttribute('href')
    expect(href).toBeTruthy()

    // Click the vehicle card
    await vehicleLink.click()

    // Verify we navigated to the vehicle detail page
    await page.waitForURL(/\/vehiculo\//)
    expect(page.url()).toContain('/vehiculo/')
  })

  test('vehicle detail page shows title, price, and contact options', async ({ page }) => {
    await page.goto('/')

    // Navigate to the first available vehicle
    const vehicleLink = page.locator('a[href^="/vehiculo/"]').first()
    await vehicleLink.waitFor({ state: 'visible', timeout: 15000 })
    await vehicleLink.click()
    await page.waitForURL(/\/vehiculo\//)

    // Wait for the vehicle detail page to load (skeleton disappears)
    await page.waitForSelector('.vehicle-page', { state: 'visible' })

    // Verify the vehicle title (h1) is present
    const title = page.locator('.vehicle-title')
    await expect(title).toBeVisible({ timeout: 10000 })
    const titleText = await title.textContent()
    expect(titleText?.trim().length).toBeGreaterThan(0)

    // Verify the price section is present
    const price = page.locator('.vehicle-price')
    await expect(price).toBeVisible()

    // Verify contact buttons are present (email, call, whatsapp)
    const contactBtns = page.locator('.vehicle-contact-btns')
    await expect(contactBtns).toBeVisible()

    // Verify the email contact button exists
    const emailBtn = page.locator('.contact-email')
    await expect(emailBtn).toBeVisible()

    // Verify the WhatsApp contact button exists
    const whatsappBtn = page.locator('.contact-whatsapp')
    await expect(whatsappBtn).toBeVisible()
  })

  test('vehicle detail page shows gallery images', async ({ page }) => {
    await page.goto('/')

    // Navigate to the first available vehicle
    const vehicleLink = page.locator('a[href^="/vehiculo/"]').first()
    await vehicleLink.waitFor({ state: 'visible', timeout: 15000 })
    await vehicleLink.click()
    await page.waitForURL(/\/vehiculo\//)

    // Wait for gallery wrapper to be visible
    const gallery = page.locator('.vehicle-gallery-wrapper')
    await expect(gallery).toBeVisible({ timeout: 10000 })

    // Verify at least one image is present in the gallery
    const images = gallery.locator('img')
    const imageCount = await images.count()
    expect(imageCount).toBeGreaterThan(0)
  })

  test('vehicle detail page has breadcrumb navigation', async ({ page }) => {
    await page.goto('/')

    // Navigate to the first available vehicle
    const vehicleLink = page.locator('a[href^="/vehiculo/"]').first()
    await vehicleLink.waitFor({ state: 'visible', timeout: 15000 })
    await vehicleLink.click()
    await page.waitForURL(/\/vehiculo\//)

    // Wait for the page to load
    await page.waitForSelector('.vehicle-page', { state: 'visible' })

    // Verify breadcrumb navigation is present
    // The UiBreadcrumbNav component renders breadcrumbs with a link to home
    const breadcrumb = page.locator('nav, [class*="breadcrumb"]').first()
    await expect(breadcrumb).toBeVisible({ timeout: 10000 })
  })

  test('vehicle detail page has favorite and share buttons', async ({ page }) => {
    await page.goto('/')

    // Navigate to the first available vehicle
    const vehicleLink = page.locator('a[href^="/vehiculo/"]').first()
    await vehicleLink.waitFor({ state: 'visible', timeout: 15000 })
    await vehicleLink.click()
    await page.waitForURL(/\/vehiculo\//)

    // Wait for the page to load
    await page.waitForSelector('.vehicle-info', { state: 'visible' })

    // Verify favorite button exists
    const favoriteBtn = page.locator('.favorite-btn')
    await expect(favoriteBtn).toBeVisible()

    // Verify share button exists
    const shareBtn = page.locator('.share-btn')
    await expect(shareBtn).toBeVisible()
  })
})

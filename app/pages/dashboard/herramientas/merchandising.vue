<script setup lang="ts">
/**
 * Merchandising Orders Tool
 * Browse merch catalog, preview with dealer branding, place orders.
 * Plan: Free (hook to attract engagement)
 */
definePageMeta({
  layout: 'default',
  middleware: ['auth', 'dealer'],
})

const { t, locale } = useI18n()
const supabase = useSupabaseClient()
const { dealerProfile, loadDealer } = useDealerDashboard()

// ---------- Types ----------

interface MerchProduct {
  id: string
  name_es: string
  name_en: string
  description_es: string
  description_en: string
  price: number
  unit_es: string
  unit_en: string
  image_placeholder: string
}

interface CartItem {
  product: MerchProduct
  quantity: number
}

type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'

interface MerchOrder {
  id: string
  dealer_id: string
  items: Array<{ product_id: string; product_name: string; quantity: number; unit_price: number }>
  total: number
  status: OrderStatus
  notes: string | null
  created_at: string
}

// ---------- Product catalog (hardcoded) ----------

const products: MerchProduct[] = [
  {
    id: 'tarjetas-visita',
    name_es: 'Tarjetas de visita',
    name_en: 'Business cards',
    description_es:
      '500 unidades, papel premium 350g, barniz UV selectivo. Incluye logo, datos de contacto y QR a tu perfil.',
    description_en:
      '500 units, premium 350g paper, selective UV varnish. Includes logo, contact info and QR to your profile.',
    price: 49,
    unit_es: '500 uds',
    unit_en: '500 pcs',
    image_placeholder: 'business-cards',
  },
  {
    id: 'imanes-furgoneta',
    name_es: 'Imanes para furgoneta',
    name_en: 'Van magnets',
    description_es:
      '2 unidades, 60x30cm cada uno. Resistentes a lluvia y sol. Incluyen logo, nombre y telefono.',
    description_en:
      '2 units, 60x30cm each. Weather resistant. Include logo, company name and phone.',
    price: 79,
    unit_es: '2 uds',
    unit_en: '2 pcs',
    image_placeholder: 'van-magnets',
  },
  {
    id: 'lona-feria',
    name_es: 'Lona para feria',
    name_en: 'Fair banner',
    description_es:
      '1 unidad, 200x100cm. PVC resistente con ojales. Incluye logo, nombre, telefono y URL del perfil.',
    description_en:
      '1 unit, 200x100cm. Durable PVC with eyelets. Includes logo, name, phone and profile URL.',
    price: 149,
    unit_es: '1 ud (200x100cm)',
    unit_en: '1 pc (200x100cm)',
    image_placeholder: 'fair-banner',
  },
  {
    id: 'pegatinas-qr',
    name_es: 'Pegatinas QR',
    name_en: 'QR stickers',
    description_es:
      '50 unidades, 5x5cm. Vinilo resistente. QR personalizado que enlaza a tu perfil en Tracciona.',
    description_en: '50 units, 5x5cm. Durable vinyl. Custom QR linking to your Tracciona profile.',
    price: 29,
    unit_es: '50 uds',
    unit_en: '50 pcs',
    image_placeholder: 'qr-stickers',
  },
  {
    id: 'roll-up',
    name_es: 'Roll-up expositor',
    name_en: 'Roll-up display',
    description_es:
      '1 unidad, 200x85cm. Estructura de aluminio con bolsa de transporte. Incluye logo, nombre y catalogo destacado.',
    description_en:
      '1 unit, 200x85cm. Aluminum structure with carrying bag. Includes logo, name and featured catalog.',
    price: 89,
    unit_es: '1 ud (200x85cm)',
    unit_en: '1 pc (200x85cm)',
    image_placeholder: 'roll-up',
  },
]

// ---------- State ----------

const loading = ref(false)
const saving = ref(false)
const error = ref<string | null>(null)
const successMsg = ref<string | null>(null)

// Cart
const cart = ref<CartItem[]>([])

// Preview
const previewProduct = ref<MerchProduct | null>(null)

// Orders
const orders = ref<MerchOrder[]>([])
const showOrderHistory = ref(false)

// ---------- Computed ----------

const cartTotal = computed(() =>
  cart.value.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
)

const cartItemCount = computed(() => cart.value.reduce((sum, item) => sum + item.quantity, 0))

const dealerCompanyName = computed(() => dealerProfile.value?.company_name || 'Mi Empresa')
const dealerPhone = computed(() => dealerProfile.value?.phone || '+34 600 000 000')
const dealerProfileUrl = computed(() => {
  const slug = dealerProfile.value?.slug
  return slug ? `https://tracciona.com/dealer/${slug}` : 'https://tracciona.com'
})

// ---------- Helpers ----------

function getProductName(product: MerchProduct): string {
  return locale.value === 'en' ? product.name_en : product.name_es
}

function getProductDescription(product: MerchProduct): string {
  return locale.value === 'en' ? product.description_en : product.description_es
}

function getProductUnit(product: MerchProduct): string {
  return locale.value === 'en' ? product.unit_en : product.unit_es
}

function fmt(val: number): string {
  return new Intl.NumberFormat(locale.value === 'en' ? 'en-GB' : 'es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(val)
}

function fmtDate(date: string): string {
  return new Date(date).toLocaleDateString(locale.value === 'en' ? 'en-GB' : 'es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function getStatusClass(status: OrderStatus): string {
  switch (status) {
    case 'pending':
      return 'order-pending'
    case 'confirmed':
      return 'order-confirmed'
    case 'shipped':
      return 'order-shipped'
    case 'delivered':
      return 'order-delivered'
    case 'cancelled':
      return 'order-cancelled'
    default:
      return ''
  }
}

function getPlaceholderIcon(type: string): string {
  switch (type) {
    case 'business-cards':
      return '&#127183;'
    case 'van-magnets':
      return '&#128666;'
    case 'fair-banner':
      return '&#127988;'
    case 'qr-stickers':
      return '&#128242;'
    case 'roll-up':
      return '&#128220;'
    default:
      return '&#128230;'
  }
}

// ---------- Cart operations ----------

function addToCart(product: MerchProduct) {
  const existing = cart.value.find((item) => item.product.id === product.id)
  if (existing) {
    existing.quantity++
  } else {
    cart.value.push({ product, quantity: 1 })
  }
  successMsg.value = null
}

function updateQuantity(productId: string, delta: number) {
  const item = cart.value.find((i) => i.product.id === productId)
  if (!item) return

  item.quantity += delta
  if (item.quantity <= 0) {
    cart.value = cart.value.filter((i) => i.product.id !== productId)
  }
}

function removeFromCart(productId: string) {
  cart.value = cart.value.filter((i) => i.product.id !== productId)
}

function clearCart() {
  cart.value = []
}

function getCartQuantity(productId: string): number {
  const item = cart.value.find((i) => i.product.id === productId)
  return item?.quantity || 0
}

// ---------- Preview ----------

function openPreview(product: MerchProduct) {
  previewProduct.value = product
}

function closePreview() {
  previewProduct.value = null
}
function addToCartAndClose(product: MerchProduct) {
  addToCart(product)
  closePreview()
}

// ---------- Orders ----------

async function loadOrders() {
  const dealer = dealerProfile.value
  if (!dealer) return

  try {
    const { data, error: err } = await supabase
      .from('merch_orders')
      .select('*')
      .eq('dealer_id', dealer.id)
      .order('created_at', { ascending: false })

    if (err) throw err

    orders.value = (data || []) as MerchOrder[]
  } catch (err: unknown) {
    const supabaseError = err as { message?: string }
    error.value = supabaseError?.message || t('dashboard.tools.merch.errorLoadingOrders')
  }
}

async function placeOrder() {
  if (cart.value.length === 0) return
  saving.value = true
  error.value = null
  successMsg.value = null

  try {
    const dealer = dealerProfile.value
    if (!dealer) throw new Error('Dealer not found')

    const orderItems = cart.value.map((item) => ({
      product_id: item.product.id,
      product_name: getProductName(item.product),
      quantity: item.quantity,
      unit_price: item.product.price,
    }))

    const orderData = {
      dealer_id: dealer.id,
      items: orderItems,
      total: cartTotal.value,
      status: 'pending',
      dealer_name: dealer.company_name,
      dealer_email: dealer.email,
      dealer_phone: dealer.phone,
    }

    const { error: err } = await supabase.from('merch_orders').insert(orderData as never)

    if (err) throw err

    successMsg.value = t('dashboard.tools.merch.orderPlaced')
    clearCart()
    await loadOrders()
  } catch (err: unknown) {
    const supabaseError = err as { message?: string }
    error.value = supabaseError?.message || t('dashboard.tools.merch.errorPlacingOrder')
  } finally {
    saving.value = false
  }
}

// ---------- Lifecycle ----------

onMounted(async () => {
  loading.value = true
  try {
    await loadDealer()
    await loadOrders()
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="merch-page">
    <!-- Header -->
    <header class="page-header">
      <div>
        <h1>{{ t('dashboard.tools.merch.title') }}</h1>
        <p class="subtitle">{{ t('dashboard.tools.merch.subtitle') }}</p>
      </div>
      <button class="btn-secondary" @click="showOrderHistory = !showOrderHistory">
        {{
          showOrderHistory
            ? t('dashboard.tools.merch.viewCatalog')
            : t('dashboard.tools.merch.viewOrders')
        }}
        <span v-if="orders.length > 0" class="order-count-badge">{{ orders.length }}</span>
      </button>
    </header>

    <!-- Success -->
    <div v-if="successMsg" class="alert-success">{{ successMsg }}</div>

    <!-- Error -->
    <div v-if="error" class="alert-error">{{ error }}</div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <div class="spinner" />
      <span>{{ t('common.loading') }}...</span>
    </div>

    <!-- Order History View -->
    <template v-else-if="showOrderHistory">
      <div class="order-history">
        <h2>{{ t('dashboard.tools.merch.orderHistory') }}</h2>

        <div v-if="orders.length === 0" class="empty-state">
          <p>{{ t('dashboard.tools.merch.noOrders') }}</p>
        </div>

        <div v-else class="orders-list">
          <div v-for="order in orders" :key="order.id" class="order-card">
            <div class="order-header">
              <div class="order-meta">
                <span class="order-date">{{ fmtDate(order.created_at) }}</span>
                <span class="order-id">#{{ order.id.slice(0, 8) }}</span>
              </div>
              <span class="order-status-badge" :class="getStatusClass(order.status)">
                {{ t(`dashboard.tools.merch.orderStatuses.${order.status}`) }}
              </span>
            </div>
            <div class="order-items">
              <div v-for="(item, idx) in order.items" :key="idx" class="order-item">
                <span>{{ item.product_name }} x{{ item.quantity }}</span>
                <span>{{ fmt(item.unit_price * item.quantity) }}</span>
              </div>
            </div>
            <div class="order-total">
              <strong>{{ t('dashboard.tools.merch.total') }}:</strong>
              <strong>{{ fmt(order.total) }}</strong>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Catalog View -->
    <template v-else>
      <!-- Product Grid -->
      <div class="product-grid">
        <div v-for="product in products" :key="product.id" class="product-card">
          <!-- Image placeholder -->
          <div class="product-image" @click="openPreview(product)">
            <span class="placeholder-icon" v-html="getPlaceholderIcon(product.image_placeholder)" />
            <span class="preview-hint">{{ t('dashboard.tools.merch.preview') }}</span>
          </div>

          <!-- Info -->
          <div class="product-info">
            <h3>{{ getProductName(product) }}</h3>
            <p class="product-desc">{{ getProductDescription(product) }}</p>
            <div class="product-unit">{{ getProductUnit(product) }}</div>
          </div>

          <!-- Price & cart -->
          <div class="product-footer">
            <span class="product-price">{{ fmt(product.price) }}</span>

            <div v-if="getCartQuantity(product.id) > 0" class="quantity-controls">
              <button class="qty-btn" @click="updateQuantity(product.id, -1)">-</button>
              <span class="qty-value">{{ getCartQuantity(product.id) }}</span>
              <button class="qty-btn" @click="updateQuantity(product.id, 1)">+</button>
            </div>
            <button v-else class="btn-add-cart" @click="addToCart(product)">
              {{ t('dashboard.tools.merch.addToCart') }}
            </button>
          </div>
        </div>
      </div>

      <!-- Cart Summary -->
      <div v-if="cart.length > 0" class="cart-summary">
        <h2>{{ t('dashboard.tools.merch.cart') }} ({{ cartItemCount }})</h2>

        <div class="cart-items">
          <div v-for="item in cart" :key="item.product.id" class="cart-item">
            <div class="cart-item-info">
              <span class="cart-item-name">{{ getProductName(item.product) }}</span>
              <span class="cart-item-qty">x{{ item.quantity }}</span>
            </div>
            <div class="cart-item-right">
              <span class="cart-item-price">{{ fmt(item.product.price * item.quantity) }}</span>
              <button class="btn-remove" @click="removeFromCart(item.product.id)">&times;</button>
            </div>
          </div>
        </div>

        <div class="cart-total">
          <span>{{ t('dashboard.tools.merch.total') }}</span>
          <strong>{{ fmt(cartTotal) }}</strong>
        </div>

        <div class="cart-actions">
          <button class="btn-secondary" @click="clearCart">
            {{ t('dashboard.tools.merch.clearCart') }}
          </button>
          <button class="btn-primary" :disabled="saving || cart.length === 0" @click="placeOrder">
            <span v-if="saving" class="spinner-sm" />
            {{ t('dashboard.tools.merch.placeOrder') }}
          </button>
        </div>

        <p class="cart-note">{{ t('dashboard.tools.merch.orderNote') }}</p>
      </div>
    </template>

    <!-- Preview Modal -->
    <Teleport to="body">
      <div v-if="previewProduct" class="modal-bg" @click.self="closePreview">
        <div class="modal modal-lg">
          <div class="modal-head">
            <span
              >{{ t('dashboard.tools.merch.previewTitle') }}:
              {{ getProductName(previewProduct) }}</span
            >
            <button @click="closePreview">&times;</button>
          </div>
          <div class="modal-body">
            <p class="preview-subtitle">{{ t('dashboard.tools.merch.previewDesc') }}</p>

            <!-- Preview mockup -->
            <div class="preview-mockup">
              <div class="mockup-header">
                <div class="mockup-logo">
                  <span v-if="dealerProfile?.logo_url" class="logo-indicator">[Logo]</span>
                  <span v-else class="logo-placeholder">{{ dealerCompanyName.charAt(0) }}</span>
                </div>
                <div class="mockup-company">
                  <strong>{{ dealerCompanyName }}</strong>
                </div>
              </div>

              <div class="mockup-body">
                <div class="mockup-detail">
                  <span class="mockup-label">{{ t('dashboard.tools.merch.previewCompany') }}:</span>
                  <span>{{ dealerCompanyName }}</span>
                </div>
                <div class="mockup-detail">
                  <span class="mockup-label">{{ t('dashboard.tools.merch.previewPhone') }}:</span>
                  <span>{{ dealerPhone }}</span>
                </div>
                <div class="mockup-detail">
                  <span class="mockup-label">{{ t('dashboard.tools.merch.previewQR') }}:</span>
                  <span class="qr-url">{{ dealerProfileUrl }}</span>
                </div>
              </div>

              <div class="mockup-qr">
                <div class="qr-placeholder">
                  <span>QR</span>
                </div>
                <span class="qr-label">{{ dealerProfileUrl }}</span>
              </div>
            </div>

            <div class="preview-product-info">
              <h3>{{ getProductName(previewProduct) }}</h3>
              <p>{{ getProductDescription(previewProduct) }}</p>
              <div class="preview-price">{{ fmt(previewProduct.price) }}</div>
            </div>
          </div>
          <div class="modal-foot">
            <button class="btn" @click="closePreview">
              {{ t('dashboard.tools.merch.close') }}
            </button>
            <button class="btn btn-primary" @click="addToCartAndClose(previewProduct)">
              {{ t('dashboard.tools.merch.addToCart') }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.merch-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.page-header {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.page-header h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-primary, #23424a);
}

.subtitle {
  margin: 0;
  color: #64748b;
  font-size: 0.9rem;
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 10px 16px;
  border: 1px solid #d1d5db;
  background: #fff;
  border-radius: 8px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background 0.15s;
}

.btn:hover {
  background: #f8fafc;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 10px 20px;
  background: var(--color-primary, #23424a);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.9rem;
  text-decoration: none;
  cursor: pointer;
  transition: background 0.2s;
  gap: 6px;
}

.btn-primary:hover {
  background: #1a3238;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 10px 16px;
  background: white;
  color: var(--color-primary, #23424a);
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-weight: 500;
  font-size: 0.9rem;
  cursor: pointer;
  gap: 8px;
  align-self: flex-start;
}

.btn-secondary:hover {
  background: #f8fafc;
}

.order-count-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  background: var(--color-primary, #23424a);
  color: white;
  border-radius: 50%;
  font-size: 0.7rem;
  font-weight: 700;
}

/* Alerts */
.alert-error {
  padding: 12px 16px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #dc2626;
  font-size: 0.9rem;
}

.alert-success {
  padding: 12px 16px;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 8px;
  color: #16a34a;
  font-size: 0.9rem;
}

/* Loading */
.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 60px 20px;
  color: #64748b;
}

.spinner {
  width: 24px;
  height: 24px;
  border: 3px solid #e2e8f0;
  border-top-color: var(--color-primary, #23424a);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.spinner-sm {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  display: inline-block;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Product Grid */
.product-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

.product-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.product-image {
  height: 140px;
  background: linear-gradient(135deg, #f0f9ff, #e0e7ff);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  transition: background 0.2s;
  position: relative;
}

.product-image:hover {
  background: linear-gradient(135deg, #dbeafe, #c7d2fe);
}

.placeholder-icon {
  font-size: 3rem;
}

.preview-hint {
  font-size: 0.75rem;
  color: #6366f1;
  font-weight: 500;
  opacity: 0;
  transition: opacity 0.2s;
}

.product-image:hover .preview-hint {
  opacity: 1;
}

.product-info {
  padding: 16px;
  flex: 1;
}

.product-info h3 {
  margin: 0 0 8px;
  font-size: 1rem;
  font-weight: 600;
  color: #1e293b;
}

.product-desc {
  margin: 0 0 8px;
  font-size: 0.85rem;
  color: #64748b;
  line-height: 1.4;
}

.product-unit {
  font-size: 0.75rem;
  color: #9ca3af;
  font-weight: 500;
}

.product-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-top: 1px solid #f1f5f9;
}

.product-price {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-primary, #23424a);
}

.btn-add-cart {
  min-height: 44px;
  padding: 10px 16px;
  background: var(--color-primary, #23424a);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-add-cart:hover {
  background: #1a3238;
}

/* Quantity controls */
.quantity-controls {
  display: flex;
  align-items: center;
  gap: 0;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
}

.qty-btn {
  width: 44px;
  height: 44px;
  border: none;
  background: white;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  color: var(--color-primary, #23424a);
  display: flex;
  align-items: center;
  justify-content: center;
}

.qty-btn:hover {
  background: #f1f5f9;
}

.qty-value {
  min-width: 36px;
  text-align: center;
  font-weight: 600;
  font-size: 0.95rem;
  color: #1e293b;
}

/* Cart Summary */
.cart-summary {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  border: 2px solid var(--color-primary, #23424a);
}

.cart-summary h2 {
  margin: 0 0 16px;
  font-size: 1.1rem;
  font-weight: 600;
  color: #1e293b;
}

.cart-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.cart-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #f1f5f9;
}

.cart-item:last-child {
  border-bottom: none;
}

.cart-item-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.cart-item-name {
  font-size: 0.9rem;
  color: #374151;
}

.cart-item-qty {
  font-size: 0.8rem;
  color: #9ca3af;
}

.cart-item-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.cart-item-price {
  font-weight: 600;
  font-size: 0.9rem;
  color: #1e293b;
}

.btn-remove {
  width: 44px;
  height: 44px;
  border: none;
  background: transparent;
  font-size: 1.2rem;
  color: #9ca3af;
  cursor: pointer;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-remove:hover {
  background: #fee2e2;
  color: #dc2626;
}

.cart-total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0 12px;
  border-top: 2px solid #e5e7eb;
  font-size: 1.1rem;
}

.cart-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  flex-wrap: wrap;
}

.cart-note {
  margin: 12px 0 0;
  font-size: 0.8rem;
  color: #9ca3af;
  font-style: italic;
}

/* Order History */
.order-history h2 {
  margin: 0 0 16px;
  font-size: 1.1rem;
  font-weight: 600;
  color: #1e293b;
}

.orders-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.order-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.order-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.order-date {
  font-size: 0.9rem;
  font-weight: 500;
  color: #374151;
}

.order-id {
  font-size: 0.75rem;
  color: #9ca3af;
  font-family: monospace;
}

.order-status-badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}

.order-pending {
  background: #fef3c7;
  color: #92400e;
}

.order-confirmed {
  background: #dbeafe;
  color: #1e40af;
}

.order-shipped {
  background: #e0e7ff;
  color: #4338ca;
}

.order-delivered {
  background: #dcfce7;
  color: #166534;
}

.order-cancelled {
  background: #f1f5f9;
  color: #64748b;
}

.order-items {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 12px;
}

.order-item {
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
  color: #64748b;
  padding: 4px 0;
}

.order-total {
  display: flex;
  justify-content: space-between;
  padding-top: 8px;
  border-top: 1px solid #f1f5f9;
  font-size: 0.95rem;
}

/* Empty state */
.empty-state {
  padding: 48px 20px;
  text-align: center;
  color: #64748b;
  font-size: 0.95rem;
}

.empty-state p {
  margin: 0;
}

/* Modal */
.modal-bg {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
}

.modal {
  background: #fff;
  border-radius: 12px;
  width: 100%;
  max-width: 520px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  max-height: 90vh;
  overflow-y: auto;
}

.modal-lg {
  max-width: 600px;
}

.modal-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  border-bottom: 1px solid #e5e7eb;
  font-weight: 600;
  position: sticky;
  top: 0;
  background: #fff;
  border-radius: 12px 12px 0 0;
}

.modal-head button {
  background: none;
  border: none;
  font-size: 1.4rem;
  cursor: pointer;
  color: #9ca3af;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
}

.modal-head button:hover {
  background: #f3f4f6;
}

.modal-body {
  padding: 16px;
}

.modal-foot {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 16px;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
  border-radius: 0 0 12px 12px;
  position: sticky;
  bottom: 0;
}

/* Preview mockup */
.preview-subtitle {
  margin: 0 0 16px;
  font-size: 0.85rem;
  color: #64748b;
}

.preview-mockup {
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
}

.mockup-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f1f5f9;
}

.mockup-logo {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  background: var(--color-primary, #23424a);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.25rem;
  font-weight: 700;
}

.logo-indicator {
  font-size: 0.65rem;
  font-weight: 500;
}

.mockup-company {
  font-size: 1.1rem;
  color: #1e293b;
}

.mockup-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.mockup-detail {
  display: flex;
  gap: 8px;
  font-size: 0.85rem;
}

.mockup-label {
  color: #9ca3af;
  min-width: 80px;
}

.qr-url {
  color: var(--color-primary, #23424a);
  font-weight: 500;
  word-break: break-all;
}

.mockup-qr {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f8fafc;
  border-radius: 8px;
}

.qr-placeholder {
  width: 60px;
  height: 60px;
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  color: #9ca3af;
  font-weight: 700;
}

.qr-label {
  font-size: 0.8rem;
  color: #6b7280;
  word-break: break-all;
}

.preview-product-info {
  border-top: 1px solid #e5e7eb;
  padding-top: 16px;
}

.preview-product-info h3 {
  margin: 0 0 8px;
  font-size: 1rem;
  color: #1e293b;
}

.preview-product-info p {
  margin: 0 0 8px;
  font-size: 0.85rem;
  color: #64748b;
}

.preview-price {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-primary, #23424a);
}

/* Responsive */
@media (min-width: 480px) {
  .product-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 768px) {
  .merch-page {
    padding: 24px;
  }

  .page-header {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
}

@media (min-width: 1024px) {
  .product-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 479px) {
  .product-image {
    height: 100px;
  }

  .placeholder-icon {
    font-size: 2rem;
  }
}
</style>

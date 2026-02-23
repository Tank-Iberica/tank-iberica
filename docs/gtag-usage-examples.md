# Google Ads Tracking - Usage Examples

## Setup

1. Add your Google Ads ID to `.env`:

```bash
NUXT_PUBLIC_GOOGLE_ADS_ID=AW-XXXXXXXXXX
```

2. The gtag plugin will automatically load when:
   - A Google Ads ID is configured
   - The user has consented to marketing cookies

## Usage in Components

### Track vehicle view

```vue
<script setup lang="ts">
const { trackViewItem } = useGtag()

// In vehicle detail page
onMounted(() => {
  trackViewItem(vehicle.id, vehicle.title, vehicle.price)
})
</script>
```

### Track search

```vue
<script setup lang="ts">
const { trackSearch } = useGtag()

function handleSearch(query: string) {
  trackSearch(query, {
    category: selectedCategory.value,
    price_range: priceRange.value,
  })
}
</script>
```

### Track lead generation (contact dealer)

```vue
<script setup lang="ts">
const { trackGenerateLead } = useGtag()

async function contactDealer() {
  // ... send contact form ...

  trackGenerateLead(vehicle.id, dealer.id)
}
</script>
```

### Track subscription checkout

```vue
<script setup lang="ts">
const { trackBeginCheckout, trackSubscribe } = useGtag()

// When user clicks "Subscribe" button
function startCheckout(plan: string, price: number) {
  trackBeginCheckout(plan, price)
  // Navigate to payment page...
}

// After successful payment
function onPaymentSuccess(plan: string, price: number) {
  trackSubscribe(plan, price)
}
</script>
```

### Track user registration

```vue
<script setup lang="ts">
const { trackRegister } = useGtag()

async function registerUser() {
  // ... create user account ...

  trackRegister()
}
</script>
```

### Track transport request

```vue
<script setup lang="ts">
const { trackRequestTransport } = useGtag()

async function requestTransport(vehicleId: string) {
  // ... submit transport request ...

  trackRequestTransport(vehicleId)
}
</script>
```

## Custom Events

For custom tracking events not covered by the helper methods:

```vue
<script setup lang="ts">
const { trackEvent } = useGtag()

function trackCustomEvent() {
  trackEvent('custom_event_name', {
    param1: 'value1',
    param2: 123,
  })
}
</script>
```

## Checking Consent Status

The composable automatically checks consent before firing events. You can also check manually:

```vue
<script setup lang="ts">
const { canTrack } = useGtag()

// Returns true if gtag is loaded and user has consented to marketing
if (canTrack()) {
  // Track something...
}
</script>
```

## How It Works

1. **Plugin (`gtag.client.ts`)**:
   - Loads gtag.js script dynamically (client-side only)
   - Only loads if Google Ads ID is configured
   - Only loads if user has consented to marketing cookies
   - Watches consent changes and loads/unloads accordingly

2. **Composable (`useGtag.ts`)**:
   - Provides type-safe methods for common tracking events
   - Checks consent before firing any event
   - Silently fails if gtag is not loaded (won't break the app)

3. **Consent Integration**:
   - Uses `useConsent()` composable to check marketing consent
   - Respects GDPR requirements
   - Automatically removes cookies when consent is revoked

## Google Ads Conversion Actions

Create these conversion actions in your Google Ads account:

| Conversion Name   | Event Name          | Trigger                                        |
| ----------------- | ------------------- | ---------------------------------------------- |
| Contact Dealer    | `contact_dealer`    | User submits contact form for a vehicle        |
| Subscribe Pro     | `subscribe_pro`     | User completes Pro subscription payment        |
| Register          | `register`          | User creates a new account                     |
| Request Transport | `request_transport` | User requests transport/shipping for a vehicle |

## Development vs Production

- In development mode, the composable will log warnings to the console if tracking fails
- In production, failures are silently ignored (won't break the user experience)
- Leave `NUXT_PUBLIC_GOOGLE_ADS_ID` empty to disable tracking entirely (useful for testing)

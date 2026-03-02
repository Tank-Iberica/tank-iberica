<script setup lang="ts">
const { t } = useI18n()
const route = useRoute()
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const supabase = useSupabaseClient<any>()
const user = useSupabaseUser()

const vehicleSlug = computed(() => (route.query.v as string) || '')

interface VehicleInfo {
  id: string
  title: string
  slug: string
  images: string[]
}

const vehicle = ref<VehicleInfo | null>(null)
const loadingVehicle = ref(false)
const requestedServices = ref(new Set<string>())
const requestingService = ref('')
const errorMsg = ref('')

async function fetchVehicle() {
  if (!vehicleSlug.value) return
  loadingVehicle.value = true

  try {
    const { data, error } = await supabase
      .from('vehicles')
      .select('id, title, slug, images')
      .eq('slug', vehicleSlug.value)
      .single()

    if (error) throw error
    vehicle.value = data as VehicleInfo
  } catch {
    vehicle.value = null
  } finally {
    loadingVehicle.value = false
  }
}

onMounted(() => {
  fetchVehicle()
})

async function requestService(serviceType: string) {
  if (requestedServices.value.has(serviceType)) return
  if (!user.value) return

  requestingService.value = serviceType
  errorMsg.value = ''

  try {
    const insertData: Record<string, string> = {
      type: serviceType,
    }
    if (vehicle.value) {
      insertData.vehicle_id = vehicle.value.id
    }

    const { error } = await supabase.from('service_requests').insert(insertData)

    if (error) throw error
    requestedServices.value.add(serviceType)
  } catch (err) {
    errorMsg.value = err instanceof Error ? err.message : 'Error'
  } finally {
    requestingService.value = ''
  }
}

const services = computed(() => [
  {
    type: 'transport',
    icon: '\uD83D\uDE9B',
    title: t('postSale.transport'),
    desc: t('postSale.transportDesc'),
    price: null,
    badge: null,
  },
  {
    type: 'transfer',
    icon: '\uD83D\uDCC4',
    title: t('postSale.transfer'),
    desc: t('postSale.transferDesc'),
    price: t('postSale.transferPrice'),
    badge: null,
  },
  {
    type: 'insurance',
    icon: '\uD83D\uDEE1\uFE0F',
    title: t('postSale.insurance'),
    desc: t('postSale.insuranceDesc'),
    price: null,
    badge: t('postSale.insuranceBadge'),
  },
  {
    type: 'contract',
    icon: '\uD83D\uDCCB',
    title: t('postSale.contract'),
    desc: t('postSale.contractDesc'),
    price: t('postSale.contractPrice'),
    badge: null,
  },
])

useHead({
  title: t('postSale.pageTitle') + ' — Tracciona',
  meta: [{ name: 'description', content: t('postSale.pageSubtitle') }],
})
</script>

<template>
  <div class="postsale-page">
    <div class="postsale-container">
      <!-- Hero -->
      <section class="postsale-hero">
        <h1 class="postsale-title">{{ $t('postSale.pageTitle') }}</h1>
        <p class="postsale-subtitle">{{ $t('postSale.pageSubtitle') }}</p>
      </section>

      <!-- Vehicle info card -->
      <section v-if="loadingVehicle" class="vehicle-info-card">
        <p class="loading-text">{{ $t('common.loading') }}</p>
      </section>
      <section v-else-if="vehicle" class="vehicle-info-card">
        <img
          v-if="vehicle.images && vehicle.images.length"
          :src="vehicle.images[0]"
          :alt="vehicle.title"
          class="vehicle-thumb"
        />
        <div class="vehicle-info-text">
          <h2 class="vehicle-info-title">{{ vehicle.title }}</h2>
        </div>
      </section>

      <!-- Error message -->
      <p v-if="errorMsg" class="postsale-error">{{ errorMsg }}</p>

      <!-- Services grid -->
      <section class="services-section">
        <div class="services-grid">
          <div v-for="svc in services" :key="svc.type" class="service-card">
            <span class="service-icon" aria-hidden="true">{{ svc.icon }}</span>
            <h3 class="service-title">{{ svc.title }}</h3>
            <p class="service-desc">{{ svc.desc }}</p>
            <span v-if="svc.price" class="service-price">{{ svc.price }}</span>
            <span v-if="svc.badge" class="service-badge">{{ svc.badge }}</span>

            <!-- CTA -->
            <template v-if="!user">
              <p class="login-required">{{ $t('postSale.loginRequired') }}</p>
            </template>
            <template v-else>
              <button
                class="btn-cta"
                :class="{ 'btn-cta--done': requestedServices.has(svc.type) }"
                :disabled="requestedServices.has(svc.type) || requestingService === svc.type"
                @click="requestService(svc.type)"
              >
                <template v-if="requestedServices.has(svc.type)">
                  {{ $t('postSale.requested') }}
                </template>
                <template v-else-if="requestingService === svc.type">
                  {{ $t('common.loading') }}
                </template>
                <template v-else>
                  {{ $t('postSale.requestService') }}
                </template>
              </button>
            </template>
          </div>
        </div>
      </section>

      <!-- Footer help -->
      <section class="postsale-help">
        <p>{{ $t('postSale.needHelp') }}</p>
      </section>
    </div>
  </div>
</template>

<style scoped>
.postsale-page {
  min-height: 60vh;
  padding: var(--spacing-6, 1.5rem) 0 var(--spacing-12, 3rem);
}

.postsale-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 var(--spacing-4, 1rem);
}

/* ---- Hero ---- */
.postsale-hero {
  margin-bottom: var(--spacing-8, 2rem);
}

.postsale-title {
  font-size: var(--font-size-2xl, 1.5rem);
  font-weight: var(--font-weight-bold, 700);
  color: var(--color-primary);
  margin-bottom: var(--spacing-3, 0.75rem);
}

.postsale-subtitle {
  font-size: var(--font-size-base, 1rem);
  color: var(--text-secondary, #4a5a5a);
  line-height: var(--line-height-relaxed, 1.625);
}

/* ---- Vehicle info card ---- */
.vehicle-info-card {
  display: flex;
  align-items: center;
  gap: var(--spacing-4, 1rem);
  background: var(--bg-primary, #fff);
  border: 1px solid var(--border-color, #d1d5db);
  border-radius: var(--border-radius-md, 12px);
  padding: var(--spacing-4, 1rem);
  margin-bottom: var(--spacing-8, 2rem);
}

.vehicle-thumb {
  width: 80px;
  height: 60px;
  object-fit: cover;
  border-radius: var(--border-radius, 8px);
  flex-shrink: 0;
}

.vehicle-info-title {
  font-size: var(--font-size-base, 1rem);
  font-weight: var(--font-weight-semibold, 600);
  color: var(--text-primary, #1f2a2a);
}

.loading-text {
  color: var(--text-auxiliary, #7a8a8a);
  font-size: var(--font-size-sm, 0.875rem);
}

/* ---- Error ---- */
.postsale-error {
  color: var(--color-error);
  font-size: var(--font-size-sm, 0.875rem);
  margin-bottom: var(--spacing-4, 1rem);
  text-align: center;
}

/* ---- Services grid ---- */
.services-section {
  margin-bottom: var(--spacing-8, 2rem);
}

.services-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-4, 1rem);
}

.service-card {
  background: var(--bg-primary, #fff);
  border: 1px solid var(--border-color, #d1d5db);
  border-radius: var(--border-radius-md, 12px);
  padding: var(--spacing-5, 1.25rem);
  box-shadow: var(--shadow-sm, 0 1px 2px rgba(0, 0, 0, 0.05));
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2, 0.5rem);
}

.service-icon {
  font-size: 2rem;
}

.service-title {
  font-size: var(--font-size-lg, 1.125rem);
  font-weight: var(--font-weight-semibold, 600);
  color: var(--text-primary, #1f2a2a);
}

.service-desc {
  font-size: var(--font-size-sm, 0.875rem);
  color: var(--text-secondary, #4a5a5a);
  line-height: var(--line-height-normal, 1.5);
}

.service-price {
  display: inline-block;
  font-size: var(--font-size-sm, 0.875rem);
  font-weight: var(--font-weight-bold, 700);
  color: var(--color-primary);
  background: var(--bg-secondary, #f3f4f6);
  padding: var(--spacing-1, 0.25rem) var(--spacing-3, 0.75rem);
  border-radius: var(--border-radius-full, 9999px);
  align-self: flex-start;
}

.service-badge {
  display: inline-block;
  font-size: var(--font-size-xs, 0.75rem);
  font-weight: var(--font-weight-medium, 500);
  color: var(--color-success);
  align-self: flex-start;
}

.login-required {
  font-size: var(--font-size-sm, 0.875rem);
  color: var(--text-auxiliary, #7a8a8a);
  font-style: italic;
}

.btn-cta {
  align-self: flex-start;
  padding: var(--spacing-2, 0.5rem) var(--spacing-5, 1.25rem);
  background: var(--color-primary);
  color: var(--color-white, #fff);
  border: none;
  border-radius: var(--border-radius, 8px);
  font-size: var(--font-size-sm, 0.875rem);
  font-weight: var(--font-weight-medium, 500);
  cursor: pointer;
  min-height: 44px;
  transition: background var(--transition-fast, 150ms ease);
}

.btn-cta:hover {
  background: var(--color-primary-dark);
}

.btn-cta:disabled {
  cursor: not-allowed;
}

.btn-cta--done {
  background: var(--color-success);
}

.btn-cta--done:hover {
  background: var(--color-success);
}

/* ---- Help footer ---- */
.postsale-help {
  text-align: center;
  padding: var(--spacing-6, 1.5rem) 0;
  border-top: 1px solid var(--border-color-light, #e5e7eb);
}

.postsale-help p {
  font-size: var(--font-size-sm, 0.875rem);
  color: var(--text-auxiliary, #7a8a8a);
}

/* ---- Responsive ---- */
@media (min-width: 480px) {
  .postsale-container {
    padding: 0 var(--spacing-6, 1.5rem);
  }
}

@media (min-width: 768px) {
  .postsale-title {
    font-size: var(--font-size-3xl, 1.875rem);
  }

  .services-grid {
    grid-template-columns: 1fr 1fr;
  }

  .vehicle-thumb {
    width: 120px;
    height: 80px;
  }
}
</style>

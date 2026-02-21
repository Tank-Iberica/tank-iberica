<script setup lang="ts">
definePageMeta({
  layout: 'default',
  middleware: ['auth'],
})

const { t } = useI18n()
const supabase = useSupabaseClient()
const { userId } = useAuth()
const { toggle: toggleFavorite } = useFavorites()

interface FavoriteVehicle {
  id: string
  vehicle_id: string
  brand: string
  model: string
  price: number | null
  year: number | null
  main_image_url: string | null
  slug: string
}

const vehicles = ref<FavoriteVehicle[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

async function loadFavorites() {
  if (!userId.value) return

  loading.value = true
  error.value = null

  try {
    const { data, error: err } = await supabase
      .from('favorites')
      .select('id, vehicle_id, vehicles(brand, model, price, year, main_image_url, slug)')
      .eq('user_id', userId.value)
      .order('created_at', { ascending: false })

    if (err) throw err

    vehicles.value = (data ?? []).map((row: Record<string, unknown>) => {
      const v = row.vehicles as Record<string, unknown> | null
      return {
        id: row.id as string,
        vehicle_id: row.vehicle_id as string,
        brand: (v?.brand as string) ?? '',
        model: (v?.model as string) ?? '',
        price: (v?.price as number | null) ?? null,
        year: (v?.year as number | null) ?? null,
        main_image_url: (v?.main_image_url as string | null) ?? null,
        slug: (v?.slug as string) ?? '',
      }
    })
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'Error loading favorites'
  } finally {
    loading.value = false
  }
}

function removeFavorite(vehicleId: string) {
  toggleFavorite(vehicleId)
  vehicles.value = vehicles.value.filter((v) => v.vehicle_id !== vehicleId)
}

useHead({
  title: t('profile.favorites.title'),
})

onMounted(() => {
  loadFavorites()
})
</script>

<template>
  <div class="favorites-page">
    <div class="favorites-container">
      <h1 class="page-title">
        {{ $t('profile.favorites.title') }}
      </h1>
      <p class="page-subtitle">
        {{ $t('profile.favorites.subtitle') }}
      </p>

      <!-- Loading -->
      <div v-if="loading" class="loading-state">
        {{ $t('common.loading') }}
      </div>

      <!-- Error -->
      <div v-else-if="error" class="error-state">
        {{ error }}
      </div>

      <!-- Empty state -->
      <div v-else-if="vehicles.length === 0" class="empty-state">
        <p class="empty-title">{{ $t('profile.favorites.emptyTitle') }}</p>
        <p class="empty-desc">{{ $t('profile.favorites.emptyDesc') }}</p>
        <NuxtLink to="/catalogo" class="btn-primary">
          {{ $t('profile.favorites.browseCatalog') }}
        </NuxtLink>
      </div>

      <!-- Grid -->
      <div v-else class="vehicles-grid">
        <div v-for="vehicle in vehicles" :key="vehicle.id" class="vehicle-card">
          <NuxtLink :to="`/vehiculo/${vehicle.slug}`" class="card-link">
            <div class="card-image">
              <img
                v-if="vehicle.main_image_url"
                :src="vehicle.main_image_url"
                :alt="`${vehicle.brand} ${vehicle.model}`"
                loading="lazy"
              >
              <div v-else class="card-image-placeholder">
                {{ vehicle.brand.charAt(0) }}
              </div>
            </div>
            <div class="card-body">
              <h3 class="card-title">{{ vehicle.brand }} {{ vehicle.model }}</h3>
              <div class="card-meta">
                <span v-if="vehicle.year" class="card-year">{{ vehicle.year }}</span>
                <span v-if="vehicle.price" class="card-price"
                  >{{ vehicle.price.toLocaleString() }} &euro;</span
                >
              </div>
            </div>
          </NuxtLink>
          <button
            class="btn-remove"
            :aria-label="$t('profile.favorites.remove')"
            @click="removeFavorite(vehicle.vehicle_id)"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18" aria-hidden="true">
              <path
                fill-rule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clip-rule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.favorites-page {
  min-height: 60vh;
  padding: 1.5rem 0 3rem;
}

.favorites-container {
  max-width: 960px;
  margin: 0 auto;
  padding: 0 1rem;
}

.page-title {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
  margin-bottom: 0.25rem;
}

.page-subtitle {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin-bottom: 1.5rem;
}

/* Loading & error */
.loading-state,
.error-state {
  text-align: center;
  padding: 3rem 1rem;
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.error-state {
  color: var(--color-error);
}

/* Empty state */
.empty-state {
  text-align: center;
  padding: 3rem 1.5rem;
  background: var(--bg-secondary);
  border-radius: var(--border-radius-md);
}

.empty-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.empty-desc {
  font-size: var(--font-size-sm);
  color: var(--text-auxiliary);
  margin-bottom: 1.5rem;
}

.btn-primary {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-white);
  background: var(--color-primary);
  border: none;
  border-radius: var(--border-radius);
  cursor: pointer;
  text-decoration: none;
  transition: background var(--transition-fast);
  min-height: 44px;
}

.btn-primary:hover {
  background: var(--color-primary-dark);
}

/* Vehicle grid — 1 col mobile */
.vehicles-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

.vehicle-card {
  position: relative;
  background: var(--bg-primary);
  border: 1px solid var(--border-color-light);
  border-radius: var(--border-radius-md);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  transition: box-shadow var(--transition-fast);
}

.vehicle-card:hover {
  box-shadow: var(--shadow-md);
}

.card-link {
  display: block;
  text-decoration: none;
}

.card-image {
  width: 100%;
  height: 160px;
  background: var(--bg-secondary);
  overflow: hidden;
}

.card-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.card-image-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-auxiliary);
  background: var(--bg-tertiary);
}

.card-body {
  padding: 0.75rem 1rem;
}

.card-title {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin-bottom: 0.25rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
}

.card-price {
  font-weight: var(--font-weight-semibold);
  color: var(--color-primary);
}

/* Remove button */
.btn-remove {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.9);
  border: none;
  border-radius: var(--border-radius-full);
  cursor: pointer;
  color: var(--color-error);
  transition: background var(--transition-fast);
  box-shadow: var(--shadow-sm);
}

.btn-remove:hover {
  background: rgba(255, 255, 255, 1);
}

/* ---- Tablet: 2 cols ---- */
@media (min-width: 768px) {
  .favorites-container {
    padding: 0 2rem;
  }

  .page-title {
    font-size: var(--font-size-3xl);
  }

  .vehicles-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* ---- Desktop: 3 cols ---- */
@media (min-width: 1024px) {
  .vehicles-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>

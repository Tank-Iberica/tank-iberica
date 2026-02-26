<template>
  <section v-if="related.length > 0" class="related-vehicles">
    <h2>{{ $t('vehicle.relatedVehicles') }}</h2>
    <div class="related-grid">
      <NuxtLink v-for="v in related" :key="v.id" :to="`/vehiculo/${v.slug}`" class="related-card">
        <div class="related-img-wrapper">
          <NuxtImg
            v-if="v.vehicle_images?.[0]?.url?.includes('cloudinary.com')"
            provider="cloudinary"
            :src="cloudinaryPath(v.vehicle_images[0])"
            :alt="buildProductName(v, locale, true)"
            width="280"
            height="200"
            fit="cover"
            loading="lazy"
            format="webp"
            sizes="(max-width: 479px) 50vw, 25vw"
            class="related-img"
          />
          <img
            v-else-if="v.vehicle_images?.[0]?.url"
            :src="v.vehicle_images[0].url"
            :alt="buildProductName(v, locale, true)"
            class="related-img"
          >
          <div v-else class="related-img-placeholder">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="m21 15-5-5L5 21" />
            </svg>
          </div>
        </div>
        <div class="related-info">
          <span class="related-name">{{ buildProductName(v, locale, true) }}</span>
          <span v-if="v.price" class="related-price">{{ formatPrice(v.price) }}</span>
          <span v-else class="related-price muted">{{ $t('vehicle.consultar') }}</span>
        </div>
      </NuxtLink>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { Vehicle, VehicleImage } from '~/composables/useVehicles'
import { formatPrice } from '~/composables/shared/useListingUtils'

const props = defineProps<{
  vehicle: Vehicle
}>()

const { locale } = useI18n()
const supabase = useSupabaseClient()

const related = ref<Vehicle[]>([])

function cloudinaryPath(img: VehicleImage): string {
  const url = img.url
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+)$/)
  return match ? match[1] : url
}

async function fetchRelated() {
  const v = props.vehicle
  if (!v.brand) return

  const { data } = await supabase
    .from('vehicles')
    .select(
      'id, slug, brand, model, year, price, vehicle_images(url, position), subcategories(*, subcategory_categories(categories(id, name_es, name_en, name, name_singular, name_singular_es, name_singular_en)))',
    )
    .eq('status', 'published')
    .neq('id', v.id)
    .eq('brand', v.brand)
    .order('created_at', { ascending: false })
    .limit(4)

  if (data && data.length > 0) {
    related.value = data as unknown as Vehicle[]
    return
  }

  // Fallback: same category_id if brand has no other vehicles
  if (v.category_id) {
    const { data: catData } = await supabase
      .from('vehicles')
      .select(
        'id, slug, brand, model, year, price, vehicle_images(url, position), subcategories(*, subcategory_categories(categories(id, name_es, name_en, name, name_singular, name_singular_es, name_singular_en)))',
      )
      .eq('status', 'published')
      .neq('id', v.id)
      .eq('category_id', v.category_id)
      .order('created_at', { ascending: false })
      .limit(4)

    if (catData) {
      related.value = catData as unknown as Vehicle[]
    }
  }
}

onMounted(() => {
  fetchRelated()
})
</script>

<style scoped>
.related-vehicles {
  margin-top: var(--spacing-6);
  padding-top: var(--spacing-6);
  border-top: 1px solid var(--border-color, #e5e7eb);
}

.related-vehicles h2 {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--color-primary);
  margin-bottom: var(--spacing-4);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.related-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-3);
}

.related-card {
  text-decoration: none;
  color: inherit;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--border-color, #e5e7eb);
  transition:
    box-shadow 0.2s,
    transform 0.2s;
}

.related-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.related-img-wrapper {
  aspect-ratio: 4 / 3;
  overflow: hidden;
  background: var(--bg-secondary, #f3f4f6);
}

.related-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.related-img-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-auxiliary, #9ca3af);
}

.related-info {
  padding: var(--spacing-2) var(--spacing-3);
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.related-name {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.related-price {
  font-size: var(--font-size-sm);
  font-weight: 700;
  color: #059669;
}

.related-price.muted {
  color: var(--text-auxiliary, #9ca3af);
  font-weight: 500;
}

@media (min-width: 480px) {
  .related-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (min-width: 1024px) {
  .related-grid {
    grid-template-columns: repeat(4, 1fr);
    gap: var(--spacing-4);
  }
}
</style>

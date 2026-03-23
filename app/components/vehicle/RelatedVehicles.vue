<template>
  <section v-if="related.length" class="related-vehicles">
    <h2>{{ $t('vehicle.relatedVehicles') }}</h2>
    <div class="related-carousel" role="list">
      <NuxtLink
        v-for="v in related"
        :key="v.id"
        :to="`/vehiculo/${v.slug}`"
        class="related-card"
        role="listitem"
      >
        <div class="related-img-wrapper">
          <NuxtImg
            v-if="firstImageUrl(v)?.includes('cloudinary.com')"
            provider="cloudinary"
            :src="cloudinaryPath(firstImageUrl(v)!)"
            :alt="buildProductName(v, locale, true)"
            width="240"
            height="180"
            fit="cover"
            loading="lazy"
            decoding="async"
            format="webp"
            sizes="(max-width: 29.94em) 45vw, (max-width: 48em) 30vw, 20vw"
            class="related-img"
          />
          <img
            v-else-if="firstImageUrl(v)"
            :src="firstImageUrl(v)!"
            :alt="buildProductName(v, locale, true)"
            loading="lazy"
            decoding="async"
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
          <span v-else-if="v.rental_price" class="related-price"
            >{{ formatPrice(v.rental_price) }}/{{ $t('catalog.month') }}</span
          >
          <span v-else class="related-price muted">{{ $t('vehicle.consultar') }}</span>
        </div>
      </NuxtLink>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { Vehicle } from '~/composables/useVehicles'
import { formatPrice } from '~/composables/shared/useListingUtils'

const props = defineProps<{
  vehicle: Vehicle
}>()

const { locale } = useI18n()
const supabase = useSupabaseClient()

const related = ref<Vehicle[]>([])

function firstImageUrl(v: Vehicle): string | null {
  if (!v.vehicle_images?.length) return null
  const sorted = [...v.vehicle_images].sort((a, b) => a.position - b.position)
  return sorted[0]?.url ?? null
}

function cloudinaryPath(url: string): string {
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+)$/)
  return match ? (match[1] ?? url) : url
}

async function fetchRelated() {
  const v = props.vehicle
  const results: Vehicle[] = []

  // 1. Same subcategory (most relevant)
  const subcatId = v.subcategories?.id
  if (subcatId) {
    const { data } = await supabase
      .from('vehicles')
      .select(
        'id, slug, brand, model, year, price, rental_price, vehicle_images(url, position), subcategories(*, subcategory_categories(categories(id, name_es, name_en, name, name_singular, name_singular_es, name_singular_en)))',
      )
      .eq('status', 'published')
      .neq('id', v.id)
      .eq('subcategory_id', subcatId)
      .order('created_at', { ascending: false })
      .limit(8)

    if (data?.length) {
      results.push(...(data as unknown as Vehicle[]))
    }
  }

  // 2. Same brand (if not enough from subcategory)
  if (results.length < 8 && v.brand) {
    const existingIds = new Set(results.map((r) => r.id))
    const { data } = await supabase
      .from('vehicles')
      .select(
        'id, slug, brand, model, year, price, rental_price, vehicle_images(url, position), subcategories(*, subcategory_categories(categories(id, name_es, name_en, name, name_singular, name_singular_es, name_singular_en)))',
      )
      .eq('status', 'published')
      .neq('id', v.id)
      .eq('brand', v.brand)
      .order('created_at', { ascending: false })
      .limit(8 - results.length)

    if (data?.length) {
      for (const item of data as unknown as Vehicle[]) {
        if (!existingIds.has(item.id)) {
          results.push(item)
        }
      }
    }
  }

  // 3. Same category (broader fallback)
  if (results.length < 4 && v.category_id) {
    const existingIds = new Set(results.map((r) => r.id))
    const { data } = await supabase
      .from('vehicles')
      .select(
        'id, slug, brand, model, year, price, rental_price, vehicle_images(url, position), subcategories(*, subcategory_categories(categories(id, name_es, name_en, name, name_singular, name_singular_es, name_singular_en)))',
      )
      .eq('status', 'published')
      .neq('id', v.id)
      .eq('category_id', v.category_id)
      .order('created_at', { ascending: false })
      .limit(8 - results.length)

    if (data?.length) {
      for (const item of data as unknown as Vehicle[]) {
        if (!existingIds.has(item.id)) {
          results.push(item)
        }
      }
    }
  }

  related.value = results.slice(0, 8)
}

onMounted(() => {
  fetchRelated()
})
</script>

<style scoped>
.related-vehicles {
  margin-top: var(--spacing-6);
  padding: var(--spacing-6) 0.5rem 0;
  border-top: 1px solid var(--border-color);
}

.related-vehicles h2 {
  font-size: var(--font-size-base);
  font-weight: 700;
  color: var(--color-primary);
  margin-bottom: var(--spacing-4);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Horizontal scroll carousel */
.related-carousel {
  display: flex;
  gap: var(--spacing-3);
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
  padding-bottom: var(--spacing-3);
  scrollbar-width: thin;
  scrollbar-color: var(--border-color) transparent;
}

.related-carousel::-webkit-scrollbar {
  height: 4px;
}

.related-carousel::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: 2px;
}

.related-card {
  flex: 0 0 45%;
  max-width: 45%;
  scroll-snap-align: start;
  text-decoration: none;
  color: inherit;
  border-radius: var(--border-radius);
  overflow: hidden;
  border: 1px solid var(--border-color);
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
  background: var(--bg-secondary);
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
  color: var(--text-auxiliary);
}

.related-info {
  padding: var(--spacing-2) var(--spacing-3);
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
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
  color: var(--color-success);
}

.related-price.muted {
  color: var(--text-auxiliary);
  font-weight: 500;
}

/* Tablet: 4 visible */
@media (min-width: 30em) {
  .related-card {
    flex: 0 0 30%;
    max-width: 30%;
  }
}

/* Desktop: 5 visible */
@media (min-width: 48em) {
  .related-vehicles {
    padding: var(--spacing-6) 1.5rem 0;
  }

  .related-card {
    flex: 0 0 22%;
    max-width: 22%;
  }
}

@media (min-width: 64em) {
  .related-vehicles {
    padding: var(--spacing-6) 3rem 0;
  }

  .related-card {
    flex: 0 0 18%;
    max-width: 18%;
  }

  .related-carousel {
    gap: var(--spacing-4);
  }
}
</style>

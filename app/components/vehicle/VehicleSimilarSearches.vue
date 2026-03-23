<template>
  <section v-if="searches.length" class="similar-searches">
    <h2>{{ $t('vehicle.similarSearches') }}</h2>
    <div class="searches-grid">
      <NuxtLink v-for="s in searches" :key="s.key" :to="s.to" class="search-link">
        <svg
          class="search-link-icon"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <span>{{ s.label }}</span>
      </NuxtLink>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { Vehicle } from '~/composables/useVehicles'
import { localizedName } from '~/composables/useLocalized'

const props = defineProps<{
  vehicle: Vehicle
}>()

const { locale, t } = useI18n()

interface SimilarSearch {
  key: string
  label: string
  to: string
}

const searches = computed<SimilarSearch[]>(() => {
  const v = props.vehicle
  const result: SimilarSearch[] = []

  // Get subcategory and category names
  const subcatName = localizedName(v.subcategories, locale.value)
  const cat = v.subcategories?.subcategory_categories?.[0]?.categories
  const catName = localizedName(cat, locale.value)

  // 1. Same subcategory, any brand: "Más [subcategory]"
  if (v.subcategory_id && subcatName) {
    result.push({
      key: 'subcat',
      label: t('vehicle.searchMoreSubcategory', { name: subcatName }),
      to: buildCatalogUrl({ subcategory_id: v.subcategory_id }),
    })
  }

  // 2. Same brand, any category: "Más vehículos [brand]"
  if (v.brand) {
    result.push({
      key: 'brand',
      label: t('vehicle.searchMoreBrand', { brand: v.brand }),
      to: buildCatalogUrl({ brand: v.brand }),
    })
  }

  // 3. Same location: "Vehículos en [province]"
  if (v.location_province) {
    result.push({
      key: 'location',
      label: t('vehicle.searchInLocation', { location: v.location_province }),
      to: buildCatalogUrl({ location_province_eq: v.location_province }),
    })
  }

  // 4. Same category (broader): "Todas las [category]"
  if (v.category_id && catName && v.subcategory_id) {
    result.push({
      key: 'cat',
      label: t('vehicle.searchAllCategory', { name: catName }),
      to: buildCatalogUrl({ category_id: v.category_id }),
    })
  }

  // 5. Same brand + subcategory: "[brand] [subcategory]"
  if (v.brand && v.subcategory_id && subcatName) {
    result.push({
      key: 'brand-subcat',
      label: `${v.brand} ${subcatName}`,
      to: buildCatalogUrl({ brand: v.brand, subcategory_id: v.subcategory_id }),
    })
  }

  // 6. Price range ±30%: "Vehículos de [min]-[max] €"
  if (v.price && v.price > 0) {
    const min = Math.floor(v.price * 0.7)
    const max = Math.ceil(v.price * 1.3)
    result.push({
      key: 'price',
      label: t('vehicle.searchPriceRange', {
        min: new Intl.NumberFormat(locale.value).format(min),
        max: new Intl.NumberFormat(locale.value).format(max),
      }),
      to: buildCatalogUrl({ price_min: String(min), price_max: String(max) }),
    })
  }

  return result
})

function buildCatalogUrl(params: Record<string, string>): string {
  const query = new URLSearchParams(params).toString()
  return `/?${query}`
}
</script>

<style scoped>
.similar-searches {
  margin-top: var(--spacing-4);
  padding: var(--spacing-4) 0.5rem var(--spacing-6);
  border-top: 1px solid var(--border-color);
}

.similar-searches h2 {
  font-size: var(--font-size-sm);
  font-weight: 700;
  color: var(--color-primary);
  margin-bottom: var(--spacing-3);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.searches-grid {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.search-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--border-color-light);
  border-radius: var(--border-radius);
  text-decoration: none;
  color: var(--text-primary);
  font-size: var(--font-size-sm);
  transition:
    border-color 0.2s,
    background 0.2s;
}

.search-link:hover,
.search-link:focus-visible {
  border-color: var(--color-primary);
  background: rgba(35, 66, 74, 0.04);
  color: var(--color-primary);
}

.search-link-icon {
  flex-shrink: 0;
  color: var(--text-auxiliary);
}

.search-link:hover .search-link-icon {
  color: var(--color-primary);
}

/* Tablet: 2 columns */
@media (min-width: 30em) {
  .searches-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.5rem;
  }
}

/* Desktop: 3 columns */
@media (min-width: 48em) {
  .similar-searches {
    padding: var(--spacing-4) 1.5rem var(--spacing-6);
  }

  .searches-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (min-width: 64em) {
  .similar-searches {
    padding: var(--spacing-4) 3rem var(--spacing-6);
  }
}
</style>

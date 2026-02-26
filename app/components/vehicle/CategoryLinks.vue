<template>
  <nav v-if="links.length > 0" class="category-links" :aria-label="$t('vehicle.browseCategories')">
    <h3>{{ $t('vehicle.browseCategories') }}</h3>
    <div class="category-links-list">
      <NuxtLink v-for="link in links" :key="link.to" :to="link.to" class="category-link-chip">
        {{ link.label }}
      </NuxtLink>
    </div>
  </nav>
</template>

<script setup lang="ts">
const props = defineProps<{
  currentBrand?: string
  currentCategoryId?: string | null
}>()

const { locale, t } = useI18n()
const supabase = useSupabaseClient()

interface CategoryLink {
  label: string
  to: string
}

const links = ref<CategoryLink[]>([])

async function fetchCategoryLinks() {
  const result: CategoryLink[] = []

  // 1. Fetch top categories
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, name_es, name_en, slug')
    .order('sort_order', { ascending: true })
    .limit(6)

  if (categories) {
    for (const cat of categories) {
      const name =
        localizedField(cat.name, locale.value) ||
        (locale.value === 'en' ? cat.name_en : cat.name_es) ||
        ''
      if (name) {
        result.push({
          label: name,
          to: `/?category_id=${cat.id}`,
        })
      }
    }
  }

  // 2. If current brand, add "More [Brand]" link
  if (props.currentBrand) {
    result.push({
      label: `${t('vehicle.moreBrand')} ${props.currentBrand}`,
      to: `/?brand=${encodeURIComponent(props.currentBrand)}`,
    })
  }

  links.value = result
}

onMounted(() => {
  fetchCategoryLinks()
})
</script>

<style scoped>
.category-links {
  margin-top: var(--spacing-4);
  padding-top: var(--spacing-4);
  border-top: 1px solid var(--border-color, #e5e7eb);
}

.category-links h3 {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-secondary, #475569);
  margin-bottom: var(--spacing-3);
}

.category-links-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-2);
}

.category-link-chip {
  display: inline-flex;
  align-items: center;
  padding: 0.4rem 0.8rem;
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--color-primary, #23424a);
  background: var(--bg-secondary, #f3f4f6);
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 20px;
  text-decoration: none;
  transition: all 0.2s;
  min-height: 36px;
}

.category-link-chip:hover {
  background: var(--color-primary, #23424a);
  color: var(--color-white, #fff);
  border-color: var(--color-primary, #23424a);
}
</style>

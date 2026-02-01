<template>
  <nav v-if="filteredSubcategories.length" class="subcategory-bar">
    <div class="subcategory-scroll">
      <button
        v-for="sub in filteredSubcategories"
        :key="sub.id"
        class="subcategory-chip"
        :class="{ active: activeSubcategoryId === sub.id }"
        @click="selectSubcategory(sub)"
      >
        {{ locale === 'en' && sub.name_en ? sub.name_en : sub.name_es }}
      </button>
    </div>
  </nav>
</template>

<script setup lang="ts">
interface SubcategoryRow {
  id: string
  name_es: string
  name_en: string | null
  slug: string
  applicable_categories: string[]
  sort_order: number
}

const emit = defineEmits<{
  change: [subcategoryId: string | null]
}>()

const supabase = useSupabaseClient()
const { locale } = useI18n()
const { activeCategory, activeSubcategoryId, setSubcategory } = useCatalogState()

const subcategories = ref<SubcategoryRow[]>([])

const filteredSubcategories = computed(() => {
  if (!activeCategory.value) return subcategories.value
  return subcategories.value.filter(
    sub => sub.applicable_categories.includes(activeCategory.value!),
  )
})

async function fetchSubcategories() {
  const { data } = await supabase
    .from('subcategories')
    .select('*')
    .eq('status', 'published')
    .order('sort_order', { ascending: true })

  subcategories.value = (data as SubcategoryRow[]) || []
}

function selectSubcategory(sub: SubcategoryRow) {
  if (activeSubcategoryId.value === sub.id) {
    setSubcategory(null, null)
    emit('change', null)
  }
  else {
    setSubcategory(sub.id, sub.slug)
    emit('change', sub.id)
  }
}

watch(activeCategory, () => {
  setSubcategory(null, null)
  emit('change', null)
})

onMounted(fetchSubcategories)
</script>

<style scoped>
.subcategory-bar {
  width: 100%;
  overflow: hidden;
}

.subcategory-scroll {
  display: flex;
  gap: var(--spacing-2);
  overflow-x: auto;
  padding: 0 var(--spacing-4) var(--spacing-3);
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}

.subcategory-scroll::-webkit-scrollbar {
  display: none;
}

.subcategory-chip {
  flex-shrink: 0;
  padding: var(--spacing-1) var(--spacing-3);
  border: 1px solid var(--border-color-light);
  border-radius: var(--border-radius-full);
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  background: var(--bg-secondary);
  white-space: nowrap;
  min-height: 44px;
  display: flex;
  align-items: center;
  transition: all var(--transition-fast);
}

.subcategory-chip.active {
  background: var(--color-primary-light);
  border-color: var(--color-primary);
  color: var(--color-primary);
  font-weight: var(--font-weight-semibold);
}

.subcategory-chip:not(.active):hover {
  border-color: var(--color-primary);
}

@media (min-width: 768px) {
  .subcategory-scroll {
    flex-wrap: wrap;
    overflow-x: visible;
    justify-content: center;
  }
}
</style>

<template>
  <!-- MOBILE: Teleported location dropdown -->
  <Teleport to="body">
    <div v-if="open" class="location-dropdown-mobile" @click="$emit('update:open', false)">
      <div class="location-dropdown-mobile-content" @click.stop>
        <div class="location-dropdown-mobile-header">
          <span>{{ $t('catalog.location') }}</span>
          <button
            type="button"
            class="location-dropdown-close"
            @click="$emit('update:open', false)"
          >
            &#10005;
          </button>
        </div>
        <CatalogFilterBarLocationSelects
          :edit-country="editCountry"
          :edit-province="editProvince"
          :european-countries="europeanCountries"
          :provinces="provinces"
          variant="mobile"
          @country-select="$emit('country-select', $event)"
          @province-select="$emit('province-select', $event)"
        />
      </div>
    </div>
  </Teleport>

  <!-- DESKTOP: Inline dropdown (positioned absolute below trigger) -->
  <div v-if="open && !isMobile" class="location-dropdown">
    <span class="filter-sublabel">{{ $t('catalog.locationYours') }}</span>
    <CatalogFilterBarLocationSelects
      :edit-country="editCountry"
      :edit-province="editProvince"
      :european-countries="europeanCountries"
      :provinces="provinces"
      variant="desktop"
      @country-select="$emit('country-select', $event)"
      @province-select="$emit('province-select', $event)"
    />
  </div>
</template>

<script setup lang="ts">
interface CountryItem {
  code: string
  flag: string
  name: string
}

defineProps<{
  open: boolean
  editCountry: string
  editProvince: string
  europeanCountries: { priority: CountryItem[]; rest: CountryItem[] }
  provinces: string[]
}>()

defineEmits<{
  'update:open': [value: boolean]
  'country-select': [event: Event]
  'province-select': [event: Event]
}>()

const isMobile = ref(true)

function checkMobile() {
  isMobile.value = window.innerWidth < 768
}

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})
</script>

<style scoped>
.location-dropdown {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  background: var(--bg-primary);
  border: 2px solid var(--color-primary);
  border-radius: 8px;
  padding: 0.5rem;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  z-index: 1100;
  min-width: 220px;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.filter-sublabel {
  font-size: 10px;
  font-weight: 600;
  color: var(--text-auxiliary);
  text-transform: uppercase;
  letter-spacing: 0.3px;
  padding: 0.3rem 0 0.1rem;
}
</style>

<!-- Non-scoped: teleported to body -->
<style>
.location-dropdown-mobile {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 9999;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 120px;
}

.location-dropdown-mobile-content {
  background: #fff;
  border: 2px solid #23424a;
  border-radius: 12px;
  padding: 1rem;
  width: calc(100% - 2rem);
  max-width: 280px;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.location-dropdown-mobile-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  color: #23424a;
  margin-bottom: 0.25rem;
  font-size: 14px;
}

.location-dropdown-close {
  width: 28px;
  height: 28px;
  min-width: 28px;
  min-height: 28px;
  border-radius: 50%;
  background: #f3f4f6;
  border: none;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.location-dropdown-mobile .filter-sublabel {
  font-size: 11px;
  color: #6b7280;
  font-weight: 500;
  margin-top: 0.25rem;
}

.location-dropdown-mobile .location-manual-input {
  width: 100%;
  padding: 0.5rem;
  border: 2px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  min-height: 44px;
}

.location-dropdown-mobile .location-range-select {
  width: 100%;
  padding: 0.5rem;
  border: 2px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  min-height: 44px;
  background: #fff;
  cursor: pointer;
}

@media (min-width: 768px) {
  .location-dropdown-mobile {
    display: none !important;
  }
}
</style>

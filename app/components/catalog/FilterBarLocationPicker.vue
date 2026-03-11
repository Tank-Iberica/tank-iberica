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
        <!-- Location level pills inside mobile modal -->
        <CatalogLocationLevelPills
          v-if="locationLevel || userLocation?.country"
          :current-level="locationLevel"
          :user-country="userLocation?.country"
          @change="onPillChange"
        />
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
    <!-- Location level pills inside desktop dropdown -->
    <CatalogLocationLevelPills
      v-if="locationLevel || userLocation?.country"
      :current-level="locationLevel"
      :user-country="userLocation?.country"
      @change="onPillChange"
    />
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
import type { LocationLevel } from '~/utils/geoData'

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

const { locationLevel } = useCatalogState()
const { location: userLocation } = useUserLocation()
const onLevelChangeFn = inject<(level: LocationLevel) => void>('onLevelChange', () => {})

function onPillChange(level: LocationLevel) {
  onLevelChangeFn(level)
}

const isMobile = ref(true)

function checkMobile() {
  isMobile.value = globalThis.innerWidth < 768
}

onMounted(() => {
  checkMobile()
  globalThis.addEventListener('resize', checkMobile, { passive: true })
})

onUnmounted(() => {
  globalThis.removeEventListener('resize', checkMobile)
})
</script>

<style scoped>
.location-dropdown {
  position: absolute;
  top: calc(100% + 0.375rem);
  left: 0;
  background: var(--bg-primary);
  border: 2px solid var(--color-primary);
  border-radius: var(--border-radius);
  padding: 0.5rem;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  z-index: 1100;
  min-width: 13.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.filter-sublabel {
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: var(--text-auxiliary);
  text-transform: uppercase;
  letter-spacing: 0.019rem;
  padding: 0.3rem 0 0.1rem;
}

/* Pills nav inside dropdown: neutralize outer padding/border */
.location-dropdown :deep(.level-pills-nav) {
  padding: 0;
  margin: 0 -0.25rem;
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
  padding-top: 7.5rem;
}

.location-dropdown-mobile-content {
  background: var(--bg-primary);
  border: 2px solid var(--color-primary);
  border-radius: var(--border-radius-md);
  padding: 1rem;
  width: calc(100% - 2rem);
  max-width: 17.5rem;
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
  color: var(--color-primary);
  margin-bottom: 0.25rem;
  font-size: var(--font-size-base);
}

.location-dropdown-close {
  width: 1.75rem;
  height: 1.75rem;
  min-width: 1.75rem;
  min-height: 1.75rem;
  border-radius: 50%;
  background: var(--bg-secondary);
  border: none;
  cursor: pointer;
  font-size: var(--font-size-base);
  display: flex;
  align-items: center;
  justify-content: center;
}

.location-dropdown-mobile .filter-sublabel {
  font-size: var(--font-size-xs);
  color: var(--color-gray-500);
  font-weight: 500;
  margin-top: 0.25rem;
}

.location-dropdown-mobile .location-manual-input {
  width: 100%;
  padding: 0.5rem;
  border: 2px solid var(--border-color);
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-base);
  min-height: 2.75rem;
}

.location-dropdown-mobile .location-range-select {
  width: 100%;
  padding: 0.5rem;
  border: 2px solid var(--border-color);
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-base);
  min-height: 2.75rem;
  background: var(--bg-primary);
  cursor: pointer;
}

@media (min-width: 48em) {
  .location-dropdown-mobile {
    display: none !important;
  }
}

/* Pills inside mobile modal: neutralize outer padding/border */
.location-dropdown-mobile-content .level-pills-nav {
  padding: 0;
  margin: 0;
  border-radius: var(--border-radius-sm);
  overflow: hidden;
}
</style>

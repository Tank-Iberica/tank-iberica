<script setup lang="ts">
import type { LocationLevel } from '~/utils/geoData'
import { getAvailableLevels, getSortedEuropeanCountries } from '~/utils/geoData'

interface CountryItem {
  code: string
  flag: string
  name: string
}

const props = defineProps<{
  open: boolean
  editCountry: string
  editProvince: string
  europeanCountries: { priority: CountryItem[]; rest: CountryItem[] }
  provinces: string[]
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'country-select': [event: Event]
  'province-select': [event: Event]
}>()

const { t, locale } = useI18n()
const { locationLevel, setLocationLevel } = useCatalogState()
const { location: userLocation } = useUserLocation()
const onLevelChangeFn = inject<(level: LocationLevel) => void>('onLevelChange', () => {})

// "Otro país" mode
const otherCountryMode = ref(false)

// Available range levels based on selected country
const availableLevels = computed(() =>
  getAvailableLevels(props.editCountry || userLocation.value?.country || 'ES'),
)

function onRangeChange(e: Event) {
  const val = (e.target as HTMLSelectElement).value
  if (val === '__other__') {
    otherCountryMode.value = true
    return
  }
  if (val) {
    onLevelChangeFn(val as LocationLevel)
  }
}

function onOtherCountrySelect(e: Event) {
  const code = (e.target as HTMLSelectElement).value
  if (code) {
    // Filter by that country without changing the user's own location
    setLocationLevel('nacional', code, null, null)
    otherCountryMode.value = false
    closeDropdown()
  }
}

function closeDropdown() {
  otherCountryMode.value = false
  emit('update:open', false)
}

// European countries for "Otro país" picker
const otherCountries = computed(() => getSortedEuropeanCountries(locale.value))

function levelLabel(level: LocationLevel): string {
  return t(`catalog.locationLevel.${level}`)
}
</script>

<template>
  <!-- MOBILE: Teleported location panel -->
  <Teleport to="body">
    <div v-if="open" class="loc-overlay" @click="closeDropdown">
      <div class="loc-panel" @click.stop>
        <div class="loc-header">
          <span>{{ $t('catalog.location') }}</span>
          <button type="button" class="loc-close" @click="closeDropdown">&#10005;</button>
        </div>

        <!-- Country -->
        <label class="loc-label">{{ $t('catalog.locationSelectCountry') }}</label>
        <select
          class="loc-select"
          :value="editCountry"
          :aria-label="$t('catalog.locationSelectCountry')"
          @change="emit('country-select', $event)"
        >
          <option value="">{{ $t('catalog.locationSelectCountry') }}</option>
          <option v-for="c in europeanCountries.priority" :key="c.code" :value="c.code">
            {{ c.flag }} {{ c.name }}
          </option>
          <option disabled>{{ $t('catalog.locationRestAlpha') }}</option>
          <option v-for="c in europeanCountries.rest" :key="c.code" :value="c.code">
            {{ c.flag }} {{ c.name }}
          </option>
        </select>

        <!-- Province (only if Spain) -->
        <template v-if="editCountry === 'ES'">
          <label class="loc-label">{{ $t('catalog.locationSelectProvince') }}</label>
          <select
            class="loc-select"
            :value="editProvince"
            :aria-label="$t('catalog.locationSelectProvince')"
            @change="emit('province-select', $event)"
          >
            <option value="">{{ $t('catalog.locationSelectProvince') }}</option>
            <option v-for="p in provinces" :key="p" :value="p">{{ p }}</option>
          </select>
        </template>

        <!-- Range (dropdown instead of pills) -->
        <label class="loc-label">{{ $t('catalog.locationRange') }}</label>
        <select
          class="loc-select"
          :value="locationLevel || ''"
          :aria-label="$t('catalog.locationRange')"
          @change="onRangeChange"
        >
          <option value="">{{ $t('catalog.locationAll') }}</option>
          <option v-for="level in availableLevels" :key="level" :value="level">
            {{ levelLabel(level) }}
          </option>
          <option value="__other__">{{ $t('catalog.otherCountry') }}</option>
        </select>

        <!-- "Otro país" country picker (shown on demand) -->
        <template v-if="otherCountryMode">
          <label class="loc-label">{{ $t('catalog.otherCountry') }}</label>
          <select
            class="loc-select"
            :aria-label="$t('catalog.otherCountry')"
            @change="onOtherCountrySelect"
          >
            <option value="">{{ $t('catalog.locationSelectCountry') }}</option>
            <option v-for="c in otherCountries.priority" :key="c.code" :value="c.code">
              {{ c.flag }} {{ c.name }}
            </option>
            <option disabled>{{ $t('catalog.locationRestAlpha') }}</option>
            <option v-for="c in otherCountries.rest" :key="c.code" :value="c.code">
              {{ c.flag }} {{ c.name }}
            </option>
          </select>
        </template>
      </div>
    </div>
  </Teleport>

  <!-- DESKTOP: Inline dropdown -->
  <div v-if="open" class="loc-dropdown">
    <!-- Country -->
    <label class="loc-label">{{ $t('catalog.locationSelectCountry') }}</label>
    <select
      class="loc-select"
      :value="editCountry"
      :aria-label="$t('catalog.locationSelectCountry')"
      @change="emit('country-select', $event)"
    >
      <option value="">{{ $t('catalog.locationSelectCountry') }}</option>
      <option v-for="c in europeanCountries.priority" :key="c.code" :value="c.code">
        {{ c.flag }} {{ c.name }}
      </option>
      <option disabled>{{ $t('catalog.locationRestAlpha') }}</option>
      <option v-for="c in europeanCountries.rest" :key="c.code" :value="c.code">
        {{ c.flag }} {{ c.name }}
      </option>
    </select>

    <!-- Province (only if Spain) -->
    <template v-if="editCountry === 'ES'">
      <label class="loc-label">{{ $t('catalog.locationSelectProvince') }}</label>
      <select
        class="loc-select"
        :value="editProvince"
        :aria-label="$t('catalog.locationSelectProvince')"
        @change="emit('province-select', $event)"
      >
        <option value="">{{ $t('catalog.locationSelectProvince') }}</option>
        <option v-for="p in provinces" :key="p" :value="p">{{ p }}</option>
      </select>
    </template>

    <!-- Range (dropdown) -->
    <label class="loc-label">{{ $t('catalog.locationRange') }}</label>
    <select
      class="loc-select"
      :value="locationLevel || ''"
      :aria-label="$t('catalog.locationRange')"
      @change="onRangeChange"
    >
      <option value="">{{ $t('catalog.locationAll') }}</option>
      <option v-for="level in availableLevels" :key="level" :value="level">
        {{ levelLabel(level) }}
      </option>
      <option value="__other__">{{ $t('catalog.otherCountry') }}</option>
    </select>

    <!-- "Otro país" country picker (shown on demand) -->
    <template v-if="otherCountryMode">
      <label class="loc-label">{{ $t('catalog.otherCountry') }}</label>
      <select
        class="loc-select"
        :aria-label="$t('catalog.otherCountry')"
        @change="onOtherCountrySelect"
      >
        <option value="">{{ $t('catalog.locationSelectCountry') }}</option>
        <option v-for="c in otherCountries.priority" :key="c.code" :value="c.code">
          {{ c.flag }} {{ c.name }}
        </option>
        <option disabled>{{ $t('catalog.locationRestAlpha') }}</option>
        <option v-for="c in otherCountries.rest" :key="c.code" :value="c.code">
          {{ c.flag }} {{ c.name }}
        </option>
      </select>
    </template>
  </div>
</template>

<style scoped>
/* Desktop dropdown */
.loc-dropdown {
  position: absolute;
  top: calc(100% + 0.375rem);
  left: 0;
  background: var(--bg-primary);
  border: 2px solid var(--color-primary);
  border-radius: var(--border-radius);
  padding: 0.75rem;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  z-index: 1100;
  min-width: 14rem;
  max-width: 18rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.loc-label {
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: var(--text-auxiliary);
  text-transform: uppercase;
  letter-spacing: 0.02rem;
}

.loc-select {
  width: 100%;
  padding: 0.4rem 0.5rem;
  border: 2px solid var(--border-color);
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  background: var(--bg-primary);
  min-height: 2.5rem;
  cursor: pointer;
}

.loc-select:focus {
  border-color: var(--color-primary);
  outline: none;
}

/* Hide desktop dropdown on mobile */
.loc-dropdown {
  display: none;
}

@media (min-width: 48em) {
  .loc-dropdown {
    display: flex;
  }
}
</style>

<!-- Non-scoped: teleported to body -->
<style>
.loc-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 9999;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 6rem;
}

.loc-panel {
  background: var(--bg-primary);
  border: 2px solid var(--color-primary);
  border-radius: var(--border-radius-md);
  padding: 1rem;
  width: calc(100% - 2rem);
  max-width: 18rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  max-height: calc(100vh - 8rem);
  overflow-y: auto;
}

.loc-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  color: var(--color-primary);
  font-size: var(--font-size-base);
}

.loc-close {
  width: 2rem;
  height: 2rem;
  min-width: 2rem;
  min-height: 2rem;
  border-radius: 50%;
  background: var(--bg-secondary);
  border: none;
  cursor: pointer;
  font-size: var(--font-size-base);
  display: flex;
  align-items: center;
  justify-content: center;
}

@media (min-width: 48em) {
  .loc-overlay {
    display: none !important;
  }
}
</style>

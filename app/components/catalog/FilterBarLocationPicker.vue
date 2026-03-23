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
const { locationLevel } = useCatalogState()
const { location: userLocation } = useUserLocation()
const onLevelChangeFn = inject<(level: LocationLevel) => void>('onLevelChange', () => {})

// "Otro país" mode: when user wants to pick a different country
const otherCountryMode = ref(false)
const otherCountryCode = ref('')

// Available range levels based on selected country
const availableLevels = computed(() =>
  getAvailableLevels(props.editCountry || userLocation.value?.country || 'ES'),
)

function selectLevel(level: LocationLevel) {
  onLevelChangeFn(level)
}

function onOtherCountry() {
  otherCountryMode.value = true
}

function onOtherCountrySelect(e: Event) {
  const code = (e.target as HTMLSelectElement).value
  otherCountryCode.value = code
  if (code) {
    // Emit as a synthetic event-like so useFilterBar.onCountrySelect picks it up
    emit('country-select', e)
    otherCountryMode.value = false
  }
}

function closeDropdown() {
  otherCountryMode.value = false
  emit('update:open', false)
}

// European countries for "Otro país" picker
const otherCountries = computed(() => getSortedEuropeanCountries(locale.value))

// Level label using i18n
function levelLabel(level: LocationLevel): string {
  return t(`catalog.locationLevel.${level}`)
}
</script>

<template>
  <!-- MOBILE: Teleported location dropdown -->
  <Teleport to="body">
    <div v-if="open" class="loc-overlay" @click="closeDropdown">
      <div class="loc-panel" @click.stop>
        <div class="loc-header">
          <span>{{ $t('catalog.location') }}</span>
          <button type="button" class="loc-close" @click="closeDropdown">&#10005;</button>
        </div>

        <!-- Step 1: Country -->
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

        <!-- Step 2: Province (only if Spain) -->
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

        <!-- Step 3: Range (level) -->
        <label class="loc-label">{{ $t('catalog.locationRange') }}</label>
        <div class="loc-levels" role="listbox" :aria-label="$t('catalog.locationRange')">
          <button
            v-for="level in availableLevels"
            :key="level"
            :class="['loc-level-btn', { active: locationLevel === level }]"
            role="option"
            :aria-selected="locationLevel === level"
            @click="selectLevel(level)"
          >
            {{ levelLabel(level) }}
          </button>

          <!-- "Otro país" option -->
          <button
            v-if="!otherCountryMode"
            :class="['loc-level-btn loc-level-btn--other']"
            @click="onOtherCountry"
          >
            {{ $t('catalog.otherCountry') }}
          </button>
        </div>

        <!-- "Otro país" country picker -->
        <template v-if="otherCountryMode">
          <label class="loc-label">{{ $t('catalog.otherCountry') }}</label>
          <select
            class="loc-select"
            :value="otherCountryCode"
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

  <!-- DESKTOP: Inline dropdown (positioned absolute below trigger) -->
  <div v-if="open" class="loc-dropdown">
    <!-- Step 1: Country -->
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

    <!-- Step 2: Province (only if Spain) -->
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

    <!-- Step 3: Range (level) -->
    <label class="loc-label">{{ $t('catalog.locationRange') }}</label>
    <div class="loc-levels" role="listbox" :aria-label="$t('catalog.locationRange')">
      <button
        v-for="level in availableLevels"
        :key="level"
        :class="['loc-level-btn', { active: locationLevel === level }]"
        role="option"
        :aria-selected="locationLevel === level"
        @click="selectLevel(level)"
      >
        {{ levelLabel(level) }}
      </button>

      <!-- "Otro país" option -->
      <button
        v-if="!otherCountryMode"
        :class="['loc-level-btn loc-level-btn--other']"
        @click="onOtherCountry"
      >
        {{ $t('catalog.otherCountry') }}
      </button>
    </div>

    <!-- "Otro país" country picker -->
    <template v-if="otherCountryMode">
      <label class="loc-label">{{ $t('catalog.otherCountry') }}</label>
      <select
        class="loc-select"
        :value="otherCountryCode"
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

/* Range level buttons */
.loc-levels {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
}

.loc-level-btn {
  padding: 0.3rem 0.6rem;
  border: 1px solid var(--border-color-light);
  border-radius: var(--border-radius-full);
  font-size: var(--font-size-xs);
  font-weight: 500;
  color: var(--text-secondary);
  background: transparent;
  white-space: nowrap;
  cursor: pointer;
  transition: all 0.15s ease;
  min-height: 2rem;
}

.loc-level-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.loc-level-btn.active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: var(--color-white);
}

.loc-level-btn--other {
  border-style: dashed;
  color: var(--text-auxiliary);
}

.loc-level-btn--other:hover {
  border-style: solid;
  color: var(--color-primary);
  border-color: var(--color-primary);
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

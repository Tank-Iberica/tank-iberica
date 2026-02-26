<template>
  <span v-if="variant === 'mobile'" class="filter-sublabel">{{ $t('catalog.locationYours') }}</span>
  <select
    class="filter-select-inline location-manual-input"
    :value="editCountry"
    :aria-label="$t('catalog.locationSelectCountry')"
    @change="$emit('country-select', $event)"
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
  <select
    v-if="editCountry === 'ES'"
    class="filter-select-inline location-manual-input"
    :value="editProvince"
    :aria-label="$t('catalog.locationSelectProvince')"
    @change="$emit('province-select', $event)"
  >
    <option value="">{{ $t('catalog.locationSelectProvince') }}</option>
    <option v-for="p in provinces" :key="p" :value="p">{{ p }}</option>
  </select>
</template>

<script setup lang="ts">
interface CountryItem {
  code: string
  flag: string
  name: string
}

defineProps<{
  editCountry: string
  editProvince: string
  europeanCountries: { priority: CountryItem[]; rest: CountryItem[] }
  provinces: string[]
  variant: 'mobile' | 'desktop'
}>()

defineEmits<{
  'country-select': [event: Event]
  'province-select': [event: Event]
}>()
</script>

<style scoped>
.filter-sublabel {
  font-size: 10px;
  font-weight: 600;
  color: var(--text-auxiliary);
  text-transform: uppercase;
  letter-spacing: 0.3px;
  padding: 0.3rem 0 0.1rem;
}

.filter-select-inline {
  padding: 0.2rem 0.3rem;
  border: 2px solid var(--border-color);
  border-radius: 4px;
  font-size: 10px;
  line-height: 1.4;
  color: var(--text-primary);
  background: var(--bg-primary);
  min-width: 60px;
  min-height: auto;
  cursor: pointer;
}

.location-manual-input {
  width: 100%;
  max-width: none;
  min-width: 0;
  box-sizing: border-box;
}
</style>

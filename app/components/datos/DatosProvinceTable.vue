<script setup lang="ts">
import { formatPrice } from '~/composables/useDatos'
import type { ProvinceStat, ProvinceSortKey } from '~/composables/useDatos'

const props = defineProps<{
  provinces: ProvinceStat[]
  sortKey: ProvinceSortKey
  sortAsc: boolean
}>()

const emit = defineEmits<{
  (e: 'sort', key: ProvinceSortKey): void
}>()

function sortArrow(key: ProvinceSortKey): string {
  if (props.sortKey !== key) return ''
  return props.sortAsc ? ' \u2191' : ' \u2193'
}
</script>

<template>
  <section v-if="provinces.length" class="datos-section">
    <h2 class="datos-section__title">{{ $t('data.byProvince') }}</h2>
    <div class="province-table-wrapper">
      <table class="province-table">
        <thead>
          <tr>
            <th
              class="province-table__th--sortable province-table__th--left"
              @click="emit('sort', 'province')"
            >
              {{ $t('data.province') }}{{ sortArrow('province') }}
            </th>
            <th class="province-table__th--sortable" @click="emit('sort', 'avgPrice')">
              {{ $t('data.avgPrice') }}{{ sortArrow('avgPrice') }}
            </th>
            <th class="province-table__th--sortable" @click="emit('sort', 'listingCount')">
              {{ $t('data.volume') }}{{ sortArrow('listingCount') }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(prov, idx) in provinces"
            :key="prov.province"
            :class="{ 'province-table__row--striped': idx % 2 === 1 }"
          >
            <td class="province-table__td--left">{{ prov.province }}</td>
            <td>{{ formatPrice(prov.avgPrice) }}</td>
            <td>{{ prov.listingCount }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<style scoped>
.datos-section {
  margin-bottom: var(--spacing-10);
}

.datos-section__title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
  margin-bottom: var(--spacing-5);
}

.province-table-wrapper {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-md);
  background: var(--bg-primary);
}

.province-table {
  width: 100%;
  min-width: 360px;
  border-collapse: collapse;
}

.province-table thead {
  background: var(--color-primary);
}

.province-table th {
  padding: var(--spacing-3) var(--spacing-4);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-white);
  text-align: center;
  white-space: nowrap;
}

.province-table__th--left {
  text-align: left;
}

.province-table__th--sortable {
  cursor: pointer;
  user-select: none;
  min-height: 44px;
  transition: background var(--transition-fast);
}

.province-table__th--sortable:hover {
  background: var(--color-primary-dark);
}

.province-table td {
  padding: var(--spacing-3) var(--spacing-4);
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  border-bottom: 1px solid var(--border-color-light);
  text-align: center;
}

.province-table__td--left {
  text-align: left;
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
}

.province-table__row--striped {
  background: var(--color-gray-50);
}

.province-table tbody tr:last-child td {
  border-bottom: none;
}

.province-table tbody tr:hover {
  background: var(--bg-tertiary);
}

@media (min-width: 768px) {
  .datos-section__title {
    font-size: var(--font-size-2xl);
  }
}
</style>

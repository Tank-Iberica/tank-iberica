<template>
  <div class="table-outer">
    <div
      ref="wrapperRef"
      :class="['table-wrapper', { dragging: isDragging }]"
      @mousedown="onMouseDown"
      @mousemove="onMouseMove"
      @mouseup="onMouseUp"
      @mouseleave="onMouseUp"
      @touchstart.passive="onTouchStart"
      @touchmove.passive="onTouchMove"
      @touchend.passive="onTouchEnd"
    >
      <table class="catalog-table">
        <thead>
          <tr>
            <th class="col-select" @click.stop>
              <button
                class="pdf-header-btn"
                :title="$t('catalog.exportPdf')"
                @click="onPdfHeaderClick"
              >
                <svg
                  viewBox="0 0 24 24"
                  width="16"
                  height="16"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              </button>
            </th>
            <th class="col-image">{{ $t('catalog.image') }}</th>
            <th
              class="col-category sortable"
              :class="sortClass('category')"
              @click="toggleSort('category')"
            >
              {{ $t('vehicle.category') }}
            </th>
            <th class="col-price sortable" :class="sortClass('price')" @click="toggleSort('price')">
              {{ $t('catalog.price') }}
            </th>
            <th
              class="col-product sortable"
              :class="sortClass('product')"
              @click="toggleSort('product')"
            >
              {{ $t('catalog.product') }}
            </th>
            <th class="col-year sortable" :class="sortClass('year')" @click="toggleSort('year')">
              {{ $t('catalog.year') }}
            </th>
            <th
              v-if="showVolumeCol"
              class="col-volume sortable"
              :class="sortClass('volume')"
              @click="toggleSort('volume')"
            >
              {{ $t('catalog.volumeCap') }}
            </th>
            <th
              v-if="showCompartmentsCol"
              class="col-compartments sortable"
              :class="sortClass('compartments')"
              @click="toggleSort('compartments')"
            >
              {{ $t('catalog.compartments') }}
            </th>
            <th
              v-if="showPowerCol"
              class="col-power sortable"
              :class="sortClass('power')"
              @click="toggleSort('power')"
            >
              {{ $t('catalog.power') }}
            </th>
            <th
              class="col-location sortable"
              :class="sortClass('location')"
              @click="toggleSort('location')"
            >
              {{ $t('catalog.location') }}
            </th>
            <th class="col-actions">{{ $t('catalog.actions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="vehicle in sortedVehicles"
            :key="vehicle.id"
            class="table-row"
            @click="navigateTo(vehicle.slug)"
          >
            <td class="col-select" @click.stop>
              <input
                type="checkbox"
                class="select-checkbox"
                :checked="selectedIds.has(vehicle.id)"
                @change="toggleSelect(vehicle.id)"
              >
            </td>
            <td class="col-image">
              <img
                v-if="firstImage(vehicle)"
                :src="firstImage(vehicle)"
                :alt="buildProductName(vehicle, locale)"
                width="80"
                height="60"
                loading="lazy"
                decoding="async"
                class="table-image"
              >
              <div v-else class="table-image-placeholder">
                <svg
                  width="24"
                  height="24"
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
            </td>
            <td class="col-category">
              <span class="table-category">
                {{ $t(`catalog.${vehicle.category}`) }}
              </span>
            </td>
            <td class="col-price table-price">{{ priceText(vehicle) }}</td>
            <td class="col-product">{{ buildProductName(vehicle, locale) }}</td>
            <td class="col-year">{{ vehicle.year ?? '—' }}</td>
            <td v-if="showVolumeCol" class="col-volume">{{ volumeText(vehicle) }}</td>
            <td v-if="showCompartmentsCol" class="col-compartments">
              {{ compartmentsText(vehicle) }}
            </td>
            <td v-if="showPowerCol" class="col-power">{{ powerText(vehicle) }}</td>
            <td class="col-location">
              <span class="location-cell">
                <svg
                  class="pin-icon"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="var(--color-danger)"
                  stroke="none"
                >
                  <path
                    d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z"
                  />
                </svg>
                {{ locationLabel(vehicle) }}
                <img
                  v-if="locationFlagCode(vehicle)"
                  :src="`https://flagcdn.com/w20/${locationFlagCode(vehicle)}.png`"
                  :alt="vehicle.location_country || ''"
                  class="location-flag"
                >
              </span>
            </td>
            <td class="col-actions" @click.stop>
              <div class="action-buttons">
                <NuxtLink
                  :to="`/vehiculo/${vehicle.slug}`"
                  class="action-icon-btn view-btn"
                  :title="$t('catalog.viewDetails')"
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="16"
                    height="16"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </NuxtLink>
                <button
                  :class="['action-icon-btn', 'fav-btn', { active: isFavorite(vehicle.id) }]"
                  :title="$t('catalog.favorites')"
                  @click="toggleFav(vehicle.id)"
                >
                  <svg viewBox="0 0 24 24" width="16" height="16">
                    <polygon
                      points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
                    />
                  </svg>
                </button>
                <button
                  class="action-icon-btn share-btn"
                  :title="$t('vehicle.share')"
                  @click="shareVehicle(vehicle)"
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="16"
                    height="16"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <circle cx="18" cy="5" r="3" />
                    <circle cx="6" cy="12" r="3" />
                    <circle cx="18" cy="19" r="3" />
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                  </svg>
                </button>
                <button
                  class="action-icon-btn download-btn"
                  :title="$t('catalog.downloadBrochure')"
                  @click="downloadBrochure(vehicle)"
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="16"
                    height="16"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <p v-if="vehicles.length" class="scroll-hint">&larr; {{ $t('catalog.scrollHint') }} &rarr;</p>

    <CatalogVehicleTablePdfModal
      :open="showPdfModal"
      :selected-count="selectedIds.size"
      :total-count="sortedVehicles.length"
      @close="showPdfModal = false"
      @select-all="selectAll"
      @confirm="confirmExportPdf"
    />
  </div>
</template>

<script setup lang="ts">
import type { Vehicle } from '~/composables/useVehicles'
import { useVehicleTable } from '~/composables/catalog/useVehicleTable'

const props = defineProps<{
  vehicles: readonly Vehicle[]
}>()

const {
  locale,
  selectedIds,
  showPdfModal,
  toggleSelect,
  onPdfHeaderClick,
  selectAll,
  confirmExportPdf,
  sortClass,
  toggleSort,
  showVolumeCol,
  showCompartmentsCol,
  showPowerCol,
  sortedVehicles,
  navigateTo,
  firstImage,
  priceText,
  locationLabel,
  locationFlagCode,
  volumeText,
  powerText,
  compartmentsText,
  downloadBrochure,
  shareVehicle,
  toggleFav,
  isFavorite,
} = useVehicleTable(() => props.vehicles)

// --- Drag to scroll ---
const wrapperRef = ref<HTMLElement | null>(null)
const isDragging = ref(false)
let startX = 0
let scrollLeft = 0

function onMouseDown(e: MouseEvent) {
  if ((e.target as HTMLElement).closest('.col-actions, .col-select')) return
  if (!wrapperRef.value) return
  isDragging.value = true
  startX = e.pageX - wrapperRef.value.offsetLeft
  scrollLeft = wrapperRef.value.scrollLeft
}

function onMouseMove(e: MouseEvent) {
  if (!isDragging.value || !wrapperRef.value) return
  e.preventDefault()
  const x = e.pageX - wrapperRef.value.offsetLeft
  const walk = (x - startX) * 2
  wrapperRef.value.scrollLeft = scrollLeft - walk
}

function onMouseUp() {
  isDragging.value = false
}

let touchStartX = 0
let touchScrollLeft = 0

function onTouchStart(e: TouchEvent) {
  if ((e.target as HTMLElement).closest('.col-actions, .col-select')) return
  if (!wrapperRef.value || !e.touches.length) return
  isDragging.value = true
  touchStartX = e.touches[0]!.pageX
  touchScrollLeft = wrapperRef.value.scrollLeft
}

function onTouchMove(e: TouchEvent) {
  if (!isDragging.value || !wrapperRef.value || !e.touches.length) return
  const x = e.touches[0]!.pageX
  const walk = touchStartX - x
  wrapperRef.value.scrollLeft = touchScrollLeft + walk
}

function onTouchEnd() {
  isDragging.value = false
}
</script>

<style scoped>
.table-outer {
  position: relative;
}

.table-wrapper {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  padding: 0.5rem;
  cursor: grab;
}

.table-wrapper.dragging {
  cursor: grabbing;
  user-select: none;
}

/* Custom scrollbar */
.table-wrapper::-webkit-scrollbar {
  height: 0.625rem;
}

.table-wrapper::-webkit-scrollbar-track {
  background: var(--color-gray-100);
  border-radius: var(--border-radius-sm);
}

.table-wrapper::-webkit-scrollbar-thumb {
  background: var(--color-gray-400);
  border-radius: var(--border-radius-sm);
}

.table-wrapper::-webkit-scrollbar-thumb:hover {
  background: var(--color-gray-500);
}

/* Table */
.catalog-table {
  width: 100%;
  min-width: 65.625rem;
  border-collapse: collapse;
  font-size: var(--font-size-xs);
  background: var(--bg-primary, white);
  border-radius: var(--border-radius);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

/* Header */
.catalog-table thead {
  background: linear-gradient(
    135deg,
    var(--color-primary, var(--color-primary-darker)) 0%,
    var(--color-primary-dark, #1a4248) 100%
  );
  color: white;
}

.catalog-table th {
  padding: 0.75rem 0.5rem;
  text-align: left;
  font-weight: 700;
  font-size: var(--font-size-xs);
  text-transform: uppercase;
  letter-spacing: 0.031rem;
  white-space: nowrap;
  border-bottom: 2px solid rgba(255, 255, 255, 0.2);
  position: sticky;
  top: 0;
  z-index: 2;
}

.catalog-table th.col-actions {
  text-align: center;
}

/* Select / PDF column */
.col-select {
  width: 2.75rem;
  min-width: 2.75rem;
  text-align: center;
}

.pdf-header-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border: 1.5px solid rgba(255, 255, 255, 0.5);
  border-radius: var(--border-radius-sm);
  background: transparent;
  color: white;
  cursor: pointer;
  transition: all 0.2s;
  margin: 0 auto;
}

.pdf-header-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: white;
}

.select-checkbox {
  width: 1.125rem;
  height: 1.125rem;
  cursor: pointer;
  accent-color: var(--color-primary);
}

/* Sortable headers */
.sortable {
  cursor: pointer;
  transition: background 0.2s;
}

.sortable:hover {
  background: rgba(255, 255, 255, 0.1);
}

.sortable::after {
  content: ' \21C5';
  opacity: 0.3;
  font-size: var(--font-size-xs);
}

.sortable.sorted-asc::after {
  content: ' \25B2';
  opacity: 1;
}

.sortable.sorted-desc::after {
  content: ' \25BC';
  opacity: 1;
}

/* Cells */
.catalog-table td {
  padding: 0.5rem;
  border-bottom: 1px solid var(--border-color-light, var(--color-gray-200));
  vertical-align: middle;
}

/* Row — CSS virtual rendering for large lists (#91) */
.table-row {
  cursor: pointer;
  transition: background-color 0.2s;
  content-visibility: auto;
  contain-intrinsic-size: 0 56px; /* approximate row height */
}

.table-row:hover {
  background: var(--light-gray, rgba(35, 66, 74, 0.04));
}

/* Image */
.table-image {
  width: 5rem;
  height: 3.75rem;
  object-fit: cover;
  border-radius: var(--border-radius-sm);
  display: block;
}

.table-image-placeholder {
  width: 5rem;
  height: 3.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-secondary, var(--color-gray-100));
  border-radius: var(--border-radius-sm);
  color: var(--text-auxiliary);
}

/* Category badge */
.table-category {
  display: inline-block;
  padding: 0.5rem 0.9rem;
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-xs);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.019rem;
  color: white;
  background: linear-gradient(135deg, var(--color-primary-darker) 0%, #1a4248 100%);
  white-space: nowrap;
}

/* Price — green gradient */
.table-price {
  font-weight: 700;
  white-space: nowrap;
  background: linear-gradient(135deg, var(--color-success), var(--color-success-dark));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Location with pin */
.location-cell {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  white-space: nowrap;
}

.pin-icon {
  flex-shrink: 0;
}

.location-flag {
  width: 1.125rem;
  height: 0.875rem;
  border-radius: var(--border-radius-full);
  object-fit: cover;
  flex-shrink: 0;
}

/* Actions */
.col-actions {
  text-align: center;
}

.action-buttons {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
}

.action-icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  min-width: 2rem;
  min-height: 2rem;
  border: 1.5px solid var(--border-color, var(--color-gray-300));
  border-radius: var(--border-radius-sm);
  background: transparent;
  cursor: pointer;
  color: var(--text-secondary, var(--color-gray-500));
  transition: all 0.2s;
  text-decoration: none;
  padding: 0;
}

.action-icon-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
  background: rgba(35, 66, 74, 0.05);
}

/* Favorite button — star */
.fav-btn svg {
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
}

.fav-btn.active {
  border-color: var(--color-warning);
  color: var(--color-warning);
}

.fav-btn.active svg {
  fill: var(--color-warning);
  stroke: var(--color-warning);
}

/* Share button */
.share-btn:hover {
  border-color: var(--color-primary);
}

/* View button */
.view-btn:hover {
  border-color: var(--color-primary);
  background: var(--color-primary);
  color: white;
}

/* Download button */
.download-btn:hover {
  border-color: var(--color-danger);
  color: var(--color-danger);
}

/* Scroll hint */
.scroll-hint {
  text-align: center;
  font-size: var(--font-size-xs);
  color: var(--text-auxiliary, var(--color-gray-400));
  padding: 0.25rem 0;
  margin: 0;
}

/* ============================================
   Responsive: 30em (small mobile)
   ============================================ */

@media (max-width: 29.9375em) {
  .catalog-table {
    min-width: 62.5rem;
  }

  .table-image {
    width: 3.125rem;
    height: 2.375rem;
  }

  .table-image-placeholder {
    width: 3.125rem;
    height: 2.375rem;
  }

  .catalog-table th {
    padding: 0.4rem 0.6rem;
    font-size: var(--font-size-xs);
  }

  .catalog-table td {
    padding: 0.4rem 0.6rem;
  }

  .catalog-table {
    font-size: var(--font-size-xs);
  }

  .action-icon-btn {
    width: 1.75rem;
    height: 1.75rem;
    min-width: 1.75rem;
    min-height: 1.75rem;
  }

  .action-icon-btn svg {
    width: 0.875rem;
    height: 0.875rem;
  }
}

/* ============================================
   Responsive: >=48em (tablet)
   ============================================ */
@media (min-width: 48em) {
  .table-wrapper {
    padding: 0.5rem 1.5rem;
  }

  .catalog-table {
    min-width: 75rem;
    font-size: var(--font-size-sm);
  }

  .catalog-table th {
    font-size: var(--font-size-xs);
    padding: 0.75rem 0.6rem;
  }

  .catalog-table td {
    padding: 0.6rem;
  }

  .table-image {
    width: 3.75rem;
    height: 2.8125rem;
  }

  .table-image-placeholder {
    width: 3.75rem;
    height: 2.8125rem;
  }
}

/* ============================================
   Responsive: >=64em (desktop)
   ============================================ */
@media (min-width: 64em) {
  .table-wrapper {
    padding: 0.5rem 3rem;
  }

  .table-image {
    width: 5rem;
    height: 3.75rem;
  }

  .table-image-placeholder {
    width: 5rem;
    height: 3.75rem;
  }
}

/* Hide scroll hint on wide screens where table fits */

@media (min-width: 87.5em) {
  .scroll-hint {
    display: none;
  }
}
</style>

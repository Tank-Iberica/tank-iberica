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
            <td class="col-price table-price">
              {{ priceText(vehicle) }}
            </td>
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
                  fill="#C41E3A"
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
    <p v-if="vehicles.length > 0" class="scroll-hint">
      &larr; {{ $t('catalog.scrollHint') }} &rarr;
    </p>

    <!-- PDF Export confirmation modal -->
    <Teleport to="body">
      <div v-if="showPdfModal" class="pdf-modal-overlay" @click.self="showPdfModal = false">
        <div class="pdf-modal">
          <div class="pdf-modal-icon">
            <svg
              viewBox="0 0 24 24"
              width="40"
              height="40"
              fill="none"
              stroke="#C41E3A"
              stroke-width="1.5"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </div>
          <h3 class="pdf-modal-title">{{ $t('catalog.exportPdf') }}</h3>
          <p class="pdf-modal-message">
            {{ $t('catalog.exportPdfMessage') }}
          </p>
          <p class="pdf-modal-count">{{ selectedIds.size }} / {{ sortedVehicles.length }}</p>
          <div class="pdf-modal-actions">
            <button class="pdf-btn pdf-btn-back" @click="showPdfModal = false">
              {{ $t('catalog.back') }}
            </button>
            <button class="pdf-btn pdf-btn-select-all" @click="selectAll">
              {{ $t('catalog.selectAll') }}
            </button>
            <button
              class="pdf-btn pdf-btn-confirm"
              :disabled="selectedIds.size === 0"
              @click="confirmExportPdf"
            >
              {{ $t('catalog.confirm') }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import type { Vehicle } from '~/composables/useVehicles'
import { generateVehiclePdf } from '~/utils/generatePdf'

const props = defineProps<{
  vehicles: readonly Vehicle[]
}>()

const { t, locale } = useI18n()
const { location: userLocation } = useUserLocation()
const router = useRouter()
const { toggle: toggleFav, isFavorite } = useFavorites()

// --- Selection for PDF export ---
const selectedIds = ref<Set<string>>(new Set())
const showPdfModal = ref(false)

function toggleSelect(id: string) {
  const next = new Set(selectedIds.value)
  if (next.has(id)) {
    next.delete(id)
  } else {
    next.add(id)
  }
  selectedIds.value = next
}

function onPdfHeaderClick() {
  showPdfModal.value = true
}

function selectAll() {
  const all = new Set<string>()
  for (const v of sortedVehicles.value) {
    all.add(v.id)
  }
  selectedIds.value = all
}

async function confirmExportPdf() {
  showPdfModal.value = false
  const selected = sortedVehicles.value.filter((v) => selectedIds.value.has(v.id))
  for (const vehicle of selected) {
    await generateVehiclePdf({
      vehicle,
      locale: locale.value,
      productName: buildProductName(vehicle, locale.value, true),
      priceText: priceText(vehicle),
    })
  }
}

// --- Sorting ---
type SortCol =
  | 'category'
  | 'price'
  | 'product'
  | 'brand'
  | 'model'
  | 'year'
  | 'volume'
  | 'compartments'
  | 'power'
  | 'location'
const sortColumn = ref<SortCol | null>(null)
const sortDir = ref<'asc' | 'desc'>('asc')

function toggleSort(col: SortCol) {
  if (sortColumn.value === col) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortColumn.value = col
    sortDir.value = 'asc'
  }
}

function sortClass(col: SortCol): string {
  if (sortColumn.value !== col) return ''
  return sortDir.value === 'asc' ? 'sorted-asc' : 'sorted-desc'
}

// --- Dynamic columns detection ---
const showVolumeCol = computed(() =>
  props.vehicles.some((v) => {
    const fj = v.attributes_json
    return fj && (fj.volume || fj.capacity || fj.volumen || fj.capacidad)
  }),
)
const showCompartmentsCol = computed(() =>
  props.vehicles.some((v) => {
    const fj = v.attributes_json
    return fj && (fj.compartments || fj.compartimentos)
  }),
)
const showPowerCol = computed(() =>
  props.vehicles.some((v) => {
    const fj = v.attributes_json
    return fj && (fj.power || fj.potencia || fj.cv)
  }),
)

// --- Sorted vehicles ---
const sortedVehicles = computed(() => {
  const list = [...props.vehicles]
  if (!sortColumn.value) return list

  const col = sortColumn.value
  const dir = sortDir.value === 'asc' ? 1 : -1

  list.sort((a, b) => {
    let va: string | number = ''
    let vb: string | number = ''

    switch (col) {
      case 'category':
        va = a.category
        vb = b.category
        break
      case 'price':
        va = getPrice(a)
        vb = getPrice(b)
        break
      case 'product':
        va = buildProductName(a, locale.value)
        vb = buildProductName(b, locale.value)
        break
      case 'brand':
        va = a.brand
        vb = b.brand
        break
      case 'model':
        va = a.model
        vb = b.model
        break
      case 'year':
        va = a.year ?? 0
        vb = b.year ?? 0
        break
      case 'volume':
        va = getVolume(a)
        vb = getVolume(b)
        break
      case 'compartments':
        va = getCompartments(a)
        vb = getCompartments(b)
        break
      case 'power':
        va = getPower(a)
        vb = getPower(b)
        break
      case 'location':
        va = a.location ?? ''
        vb = b.location ?? ''
        break
    }

    if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * dir
    return String(va).localeCompare(String(vb)) * dir
  })

  return list
})

// --- Helpers ---
function navigateTo(slug: string) {
  router.push(`/vehiculo/${slug}`)
}

function firstImage(vehicle: Vehicle): string | undefined {
  if (!vehicle.vehicle_images?.length) return undefined
  const sorted = [...vehicle.vehicle_images].sort((a, b) => a.position - b.position)
  return sorted[0]?.thumbnail_url || sorted[0]?.url || undefined
}

function getPrice(v: Vehicle): number {
  if (v.category === 'alquiler' && v.rental_price) return v.rental_price
  return v.price ?? 0
}

function priceText(vehicle: Vehicle): string {
  if (vehicle.category === 'terceros') return t('catalog.solicitar')
  if (vehicle.category === 'alquiler' && vehicle.rental_price) {
    const formatted = new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(vehicle.rental_price)
    return `${formatted}/${t('catalog.month')}`
  }
  if (vehicle.price) {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(vehicle.price)
  }
  return t('catalog.solicitar')
}

function locationLabel(vehicle: Vehicle): string {
  const loc = locale.value === 'en' && vehicle.location_en ? vehicle.location_en : vehicle.location
  if (!loc) return '—'

  const vehicleCountry = vehicle.location_country
  const bothInSpain = userLocation.value.country === 'ES' && vehicleCountry === 'ES'

  if (bothInSpain) {
    return loc.replace(/,?\s*(España|Spain)\s*$/i, '').trim()
  }
  return loc
}

function locationFlagCode(vehicle: Vehicle): string | null {
  const vehicleCountry = vehicle.location_country
  if (!vehicleCountry) return null
  if (userLocation.value.country === 'ES' && vehicleCountry === 'ES') return null
  return vehicleCountry.toLowerCase()
}

function getVolume(v: Vehicle): number {
  const fj = v.attributes_json
  if (!fj) return 0
  return Number(fj.volume || fj.volumen || fj.capacity || fj.capacidad || 0)
}

function volumeText(v: Vehicle): string {
  const fj = v.attributes_json
  if (!fj) return '—'
  if (fj.volume || fj.volumen) return `${fj.volume || fj.volumen} L`
  if (fj.capacity || fj.capacidad) return `${fj.capacity || fj.capacidad} kg`
  return '—'
}

function getPower(v: Vehicle): number {
  const fj = v.attributes_json
  if (!fj) return 0
  return Number(fj.power || fj.potencia || fj.cv || 0)
}

function powerText(v: Vehicle): string {
  const fj = v.attributes_json
  if (!fj) return '—'
  const val = fj.power || fj.potencia || fj.cv
  return val ? `${val} CV` : '—'
}

function getCompartments(v: Vehicle): number {
  const fj = v.attributes_json
  if (!fj) return 0
  return Number(fj.compartments || fj.compartimentos || 0)
}

function compartmentsText(v: Vehicle): string {
  const fj = v.attributes_json
  if (!fj) return '—'
  const val = fj.compartments || fj.compartimentos
  return val ? String(val) : '—'
}

async function downloadBrochure(vehicle: Vehicle) {
  await generateVehiclePdf({
    vehicle,
    locale: locale.value,
    productName: buildProductName(vehicle, locale.value, true),
    priceText: priceText(vehicle),
  })
}

async function shareVehicle(vehicle: Vehicle) {
  const url = `${window.location.origin}/vehiculo/${vehicle.slug}`
  const title = buildProductName(vehicle, locale.value)
  if (navigator.share) {
    try {
      await navigator.share({ title, url })
    } catch {
      // User cancelled
    }
  } else {
    await navigator.clipboard.writeText(url)
  }
}

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

// --- Touch drag ---
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
  height: 10px;
}

.table-wrapper::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 5px;
}

.table-wrapper::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 5px;
}

.table-wrapper::-webkit-scrollbar-thumb:hover {
  background: #555;
}

/* Table */
.catalog-table {
  width: 100%;
  min-width: 1050px;
  border-collapse: collapse;
  font-size: 12px;
  background: var(--bg-primary, white);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

/* Header */
.catalog-table thead {
  background: linear-gradient(
    135deg,
    var(--color-primary, #0f2a2e) 0%,
    var(--color-primary-dark, #1a4248) 100%
  );
  color: white;
}

.catalog-table th {
  padding: 0.75rem 0.5rem;
  text-align: left;
  font-weight: 700;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
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
  width: 44px;
  min-width: 44px;
  text-align: center;
}

.pdf-header-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1.5px solid rgba(255, 255, 255, 0.5);
  border-radius: 6px;
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
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: var(--color-primary, #23424a);
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
  font-size: 10px;
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
  border-bottom: 1px solid var(--border-color-light, #e5e7eb);
  vertical-align: middle;
}

/* Row */
.table-row {
  cursor: pointer;
  transition: background-color 0.2s;
}

.table-row:hover {
  background: var(--light-gray, rgba(35, 66, 74, 0.04));
}

/* Image */
.table-image {
  width: 80px;
  height: 60px;
  object-fit: cover;
  border-radius: 6px;
  display: block;
}

.table-image-placeholder {
  width: 80px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-secondary, #f3f4f6);
  border-radius: 6px;
  color: var(--text-auxiliary);
}

/* Category badge */
.table-category {
  display: inline-block;
  padding: 0.5rem 0.9rem;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  color: white;
  background: linear-gradient(135deg, #0f2a2e 0%, #1a4248 100%);
  white-space: nowrap;
}

/* Price — green gradient */
.table-price {
  font-weight: 700;
  white-space: nowrap;
  background: linear-gradient(135deg, #10b981, #059669);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Location with pin */
.location-cell {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
}

.pin-icon {
  flex-shrink: 0;
}

.location-flag {
  width: 18px;
  height: 14px;
  border-radius: 9999px;
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
  gap: 4px;
}

.action-icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  min-width: 32px;
  min-height: 32px;
  border: 1.5px solid var(--border-color, #d1d5db);
  border-radius: 6px;
  background: transparent;
  cursor: pointer;
  color: var(--text-secondary, #6b7280);
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
  border-color: #f59e0b;
  color: #f59e0b;
}

.fav-btn.active svg {
  fill: #f59e0b;
  stroke: #f59e0b;
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
  border-color: #c41e3a;
  color: #c41e3a;
}

/* ============================================
   PDF Export Modal
   ============================================ */
.pdf-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.pdf-modal {
  background: var(--bg-primary, white);
  border-radius: 16px;
  padding: 2rem;
  max-width: 400px;
  width: 100%;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
}

.pdf-modal-icon {
  margin-bottom: 1rem;
}

.pdf-modal-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--color-primary, #23424a);
  margin: 0 0 0.5rem;
}

.pdf-modal-message {
  font-size: 14px;
  color: var(--text-secondary, #6b7280);
  margin: 0 0 0.5rem;
  line-height: 1.5;
}

.pdf-modal-count {
  font-size: 20px;
  font-weight: 700;
  color: var(--color-primary, #23424a);
  margin: 0 0 1.5rem;
}

.pdf-modal-actions {
  display: flex;
  gap: 0.5rem;
}

.pdf-btn {
  flex: 1;
  padding: 0.75rem 0.5rem;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  border: 1.5px solid transparent;
  transition: all 0.2s;
  min-height: 44px;
}

.pdf-btn-back {
  background: transparent;
  border-color: var(--border-color, #d1d5db);
  color: var(--text-secondary, #6b7280);
}

.pdf-btn-back:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.pdf-btn-select-all {
  background: transparent;
  border-color: var(--color-primary, #23424a);
  color: var(--color-primary, #23424a);
}

.pdf-btn-select-all:hover {
  background: rgba(35, 66, 74, 0.05);
}

.pdf-btn-confirm {
  background: linear-gradient(135deg, #c41e3a 0%, #a01830 100%);
  color: white;
  border-color: transparent;
}

.pdf-btn-confirm:hover:not(:disabled) {
  opacity: 0.9;
  transform: translateY(-1px);
}

.pdf-btn-confirm:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* Scroll hint */
.scroll-hint {
  text-align: center;
  font-size: 11px;
  color: var(--text-auxiliary, #9ca3af);
  padding: 4px 0;
  margin: 0;
}

/* ============================================
   Responsive: 480px (small mobile)
   ============================================ */
@media (max-width: 479px) {
  .catalog-table {
    min-width: 1000px;
  }

  .table-image {
    width: 50px;
    height: 38px;
  }

  .table-image-placeholder {
    width: 50px;
    height: 38px;
  }

  .catalog-table th {
    padding: 0.4rem 0.6rem;
    font-size: 10px;
  }

  .catalog-table td {
    padding: 0.4rem 0.6rem;
  }

  .catalog-table {
    font-size: 12px;
  }

  .action-icon-btn {
    width: 28px;
    height: 28px;
    min-width: 28px;
    min-height: 28px;
  }

  .action-icon-btn svg {
    width: 14px;
    height: 14px;
  }

  .pdf-modal {
    padding: 1.5rem;
  }

  .pdf-modal-actions {
    flex-direction: column;
  }
}

/* ============================================
   Responsive: >=768px (tablet)
   ============================================ */
@media (min-width: 768px) {
  .table-wrapper {
    padding: 0.5rem 1.5rem;
  }

  .catalog-table {
    min-width: 1200px;
    font-size: 13px;
  }

  .catalog-table th {
    font-size: 11px;
    padding: 0.75rem 0.6rem;
  }

  .catalog-table td {
    padding: 0.6rem;
  }

  .table-image {
    width: 60px;
    height: 45px;
  }

  .table-image-placeholder {
    width: 60px;
    height: 45px;
  }
}

/* ============================================
   Responsive: >=1024px (desktop)
   ============================================ */
@media (min-width: 1024px) {
  .table-wrapper {
    padding: 0.5rem 3rem;
  }

  .table-image {
    width: 80px;
    height: 60px;
  }

  .table-image-placeholder {
    width: 80px;
    height: 60px;
  }
}

/* Hide scroll hint on wide screens where table fits */
@media (min-width: 1400px) {
  .scroll-hint {
    display: none;
  }
}
</style>

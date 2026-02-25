<script setup lang="ts">
definePageMeta({ layout: 'default', middleware: ['auth'] })

const { t } = useI18n()
const supabase = useSupabaseClient()
const {
  comparisons,
  activeComparison,
  notes,
  removeFromComparison,
  createComparison,
  deleteComparison,
  addNote,
  updateNote,
  fetchComparisons,
} = useVehicleComparator()

interface ComparisonVehicle {
  id: string
  slug: string
  brand: string
  model: string
  year: number | null
  price: number | null
  category: string | null
  location: string | null
  main_image_url: string | null
}

const vehicles = ref<ComparisonVehicle[]>([])
const loading = ref(true)
const draftNotes = ref<Record<string, string>>({})
const draftRatings = ref<Record<string, number>>({})
const newCompName = ref('')
const showNewForm = ref(false)
const specKeys = ['year', 'brand', 'model', 'price', 'location', 'category'] as const

async function loadVehicles() {
  const ids = activeComparison.value?.vehicle_ids ?? []
  if (ids.length === 0) {
    vehicles.value = []
    loading.value = false
    return
  }
  loading.value = true
  const { data, error } = await supabase
    .from('vehicles')
    .select('id, slug, brand, model, year, price, category, location, main_image_url')
    .in('id', ids)
  if (!error && data) {
    vehicles.value = (data as Array<Record<string, unknown>>).map((row) => ({
      id: row.id as string,
      slug: (row.slug as string) ?? '',
      brand: (row.brand as string) ?? '',
      model: (row.model as string) ?? '',
      year: (row.year as number | null) ?? null,
      price: (row.price as number | null) ?? null,
      category: (row.category as string | null) ?? null,
      location: (row.location as string | null) ?? null,
      main_image_url: (row.main_image_url as string | null) ?? null,
    }))
  }
  for (const v of vehicles.value) {
    const n = notes.value.get(v.id)
    draftNotes.value[v.id] = n?.note ?? ''
    draftRatings.value[v.id] = n?.rating ?? 0
  }
  loading.value = false
}

function getSpec(vehicle: ComparisonVehicle, key: string): string {
  const val = vehicle[key as keyof ComparisonVehicle]
  if (val == null) return '-'
  if (key === 'price') return `${Number(val).toLocaleString()} \u20AC`
  return String(val)
}

function setRating(vehicleId: string, star: number) {
  draftRatings.value[vehicleId] = star
  saveNote(vehicleId)
}

function saveNote(vehicleId: string) {
  const note = draftNotes.value[vehicleId] ?? ''
  const rating = draftRatings.value[vehicleId] ?? 0
  if (notes.value.get(vehicleId)) updateNote(vehicleId, note, rating)
  else addNote(vehicleId, note, rating)
}

function handleRemove(vehicleId: string) {
  removeFromComparison(vehicleId)
  vehicles.value = vehicles.value.filter((v) => v.id !== vehicleId)
}

function handleCreate() {
  const name = newCompName.value.trim()
  if (!name) return
  createComparison(name)
  newCompName.value = ''
  showNewForm.value = false
}

function handleDelete(id: string) {
  deleteComparison(id)
  vehicles.value = []
  nextTick(() => loadVehicles())
}

function selectComparison(id: string) {
  const comp = comparisons.value.find((c) => c.id === id)
  if (comp) {
    activeComparison.value = comp
    loadVehicles()
  }
}

function printPage() {
  window.print()
}

useHead({ title: computed(() => t('comparator.title')) })
watch(activeComparison, () => {
  loadVehicles()
})
onMounted(async () => {
  await fetchComparisons()
  loadVehicles()
})
</script>

<template>
  <div class="cmp-page">
    <div class="cmp-wrap">
      <!-- Header -->
      <div class="cmp-header">
        <div class="header-top">
          <h1 class="page-title">{{ $t('comparator.title') }}</h1>
          <button class="btn-icon" :aria-label="$t('common.print')" @click="printPage">
            <svg viewBox="0 0 20 20" fill="currentColor" width="20" height="20" aria-hidden="true">
              <path
                fill-rule="evenodd"
                d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z"
                clip-rule="evenodd"
              />
            </svg>
          </button>
        </div>
        <div v-if="comparisons.length > 0" class="selector-row">
          <select
            class="cmp-select"
            :value="activeComparison?.id ?? ''"
            @change="selectComparison(($event.target as HTMLSelectElement).value)"
          >
            <option value="" disabled>{{ $t('comparator.selectComparison') }}</option>
            <option v-for="comp in comparisons" :key="comp.id" :value="comp.id">
              {{ comp.name }} ({{ comp.vehicle_ids.length }})
            </option>
          </select>
          <button class="btn-outline" @click="showNewForm = !showNewForm">
            {{ $t('comparator.newComparison') }}
          </button>
          <button
            v-if="activeComparison"
            class="btn-outline btn-err"
            @click="handleDelete(activeComparison.id)"
          >
            {{ $t('comparator.deleteComparison') }}
          </button>
        </div>
        <div v-if="showNewForm || comparisons.length === 0" class="new-form">
          <input
            v-model="newCompName"
            type="text"
            class="input-name"
            :placeholder="$t('comparator.newComparison')"
            @keyup.enter="handleCreate"
          >
          <button class="btn-fill" @click="handleCreate">{{ $t('common.create') }}</button>
        </div>
      </div>

      <div v-if="loading" class="state-msg">{{ $t('common.loading') }}</div>

      <div v-else-if="!activeComparison || vehicles.length === 0" class="empty-state">
        <p class="empty-title">{{ $t('comparator.noVehicles') }}</p>
        <p class="empty-desc">{{ $t('comparator.empty') }}</p>
        <NuxtLink to="/catalogo" class="btn-fill">{{
          $t('profile.favorites.browseCatalog')
        }}</NuxtLink>
      </div>

      <div v-else class="cmp-content">
        <!-- Vehicle cards -->
        <div class="cards-scroll">
          <div class="cards-grid" :style="{ '--cols': vehicles.length }">
            <div v-for="vehicle in vehicles" :key="vehicle.id" class="v-card">
              <button
                class="btn-rm"
                :aria-label="$t('comparator.remove')"
                @click="handleRemove(vehicle.id)"
              >
                <svg
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  width="16"
                  height="16"
                  aria-hidden="true"
                >
                  <path
                    fill-rule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clip-rule="evenodd"
                  />
                </svg>
              </button>
              <NuxtLink :to="`/vehiculo/${vehicle.slug}`" class="card-link">
                <div class="card-img">
                  <img
                    v-if="vehicle.main_image_url"
                    :src="vehicle.main_image_url"
                    :alt="`${vehicle.brand} ${vehicle.model}`"
                    loading="lazy"
                  >
                  <div v-else class="card-ph">{{ vehicle.brand.charAt(0) }}</div>
                </div>
                <div class="card-body">
                  <h3 class="card-name">{{ vehicle.brand }} {{ vehicle.model }}</h3>
                  <span v-if="vehicle.price" class="card-price"
                    >{{ vehicle.price.toLocaleString() }} &euro;</span
                  >
                  <span v-if="vehicle.category" class="card-badge">{{ vehicle.category }}</span>
                </div>
              </NuxtLink>
            </div>
          </div>
        </div>

        <!-- Specs -->
        <div class="section">
          <h2 class="sec-title">{{ $t('comparator.specs') }}</h2>
          <div class="table-scroll">
            <table class="spec-tbl">
              <tbody>
                <tr v-for="key in specKeys" :key="key">
                  <th>{{ $t(`comparator.spec.${key}`) }}</th>
                  <td v-for="vehicle in vehicles" :key="vehicle.id">{{ getSpec(vehicle, key) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Ratings -->
        <div class="section">
          <h2 class="sec-title">{{ $t('comparator.rating') }}</h2>
          <div class="flex-grid" :style="{ '--cols': vehicles.length }">
            <div v-for="vehicle in vehicles" :key="vehicle.id" class="rate-cell">
              <span class="rate-label">{{ vehicle.brand }} {{ vehicle.model }}</span>
              <div class="stars">
                <button
                  v-for="star in 5"
                  :key="star"
                  class="star-btn"
                  :class="{ on: (draftRatings[vehicle.id] ?? 0) >= star }"
                  :aria-label="`${star}/5`"
                  @click="setRating(vehicle.id, star)"
                >
                  <svg
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    width="24"
                    height="24"
                    aria-hidden="true"
                  >
                    <path
                      d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Notes -->
        <div class="section no-print">
          <h2 class="sec-title">{{ $t('comparator.notes') }}</h2>
          <div class="notes-grid" :style="{ '--cols': vehicles.length }">
            <div v-for="vehicle in vehicles" :key="vehicle.id" class="note-cell">
              <label :for="`note-${vehicle.id}`" class="note-label"
                >{{ vehicle.brand }} {{ vehicle.model }}</label
              >
              <textarea
                :id="`note-${vehicle.id}`"
                v-model="draftNotes[vehicle.id]"
                rows="3"
                :placeholder="$t('comparator.addNote')"
              />
              <button class="btn-fill btn-sm" @click="saveNote(vehicle.id)">
                {{ $t('common.save') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cmp-page {
  min-height: 60vh;
  padding: var(--spacing-6) 0 var(--spacing-12);
}
.cmp-wrap {
  max-width: var(--container-max-width);
  margin: 0 auto;
  padding: 0 var(--spacing-4);
}
.cmp-header {
  margin-bottom: var(--spacing-6);
}
.header-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-4);
}
.page-title {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
}
.btn-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: var(--border-radius);
  color: var(--text-secondary);
  transition: background var(--transition-fast);
}
.btn-icon:hover {
  background: var(--bg-secondary);
}

.selector-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-2);
  align-items: center;
  margin-bottom: var(--spacing-3);
}
.cmp-select {
  flex: 1 1 180px;
  min-height: 44px;
  padding: var(--spacing-2) var(--spacing-3);
  border: 2px solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: var(--font-size-sm);
  background: var(--bg-primary);
  color: var(--text-primary);
}
.cmp-select:focus {
  border-color: var(--color-primary);
  outline: none;
}

.btn-fill,
.btn-outline {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: var(--spacing-2) var(--spacing-4);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  border-radius: var(--border-radius);
  transition: background var(--transition-fast);
  text-decoration: none;
}
.btn-fill {
  color: var(--color-white);
  background: var(--color-primary);
  border: none;
}
.btn-fill:hover {
  background: var(--color-primary-dark);
}
.btn-outline {
  color: var(--color-primary);
  background: var(--bg-primary);
  border: 2px solid var(--color-primary);
}
.btn-outline:hover {
  background: var(--bg-secondary);
}
.btn-outline.btn-err {
  color: var(--color-error);
  border-color: var(--color-error);
}
.btn-outline.btn-err:hover {
  background: #fef2f2;
}
.btn-sm {
  padding: var(--spacing-2) var(--spacing-3);
  font-size: var(--font-size-xs);
}

.new-form {
  display: flex;
  gap: var(--spacing-2);
  margin-bottom: var(--spacing-4);
}
.input-name {
  flex: 1;
  min-height: 44px;
  padding: var(--spacing-2) var(--spacing-3);
  border: 2px solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: var(--font-size-sm);
}
.input-name:focus {
  border-color: var(--color-primary);
  outline: none;
}

.state-msg {
  text-align: center;
  padding: var(--spacing-12) var(--spacing-4);
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}
.empty-state {
  text-align: center;
  padding: var(--spacing-12) var(--spacing-6);
  background: var(--bg-secondary);
  border-radius: var(--border-radius-md);
}
.empty-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin-bottom: var(--spacing-2);
}
.empty-desc {
  font-size: var(--font-size-sm);
  color: var(--text-auxiliary);
  margin-bottom: var(--spacing-6);
}

/* Cards */
.cards-scroll {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  margin-bottom: var(--spacing-6);
  padding-bottom: var(--spacing-2);
}
.cards-grid {
  display: grid;
  grid-template-columns: repeat(var(--cols, 2), minmax(200px, 1fr));
  gap: var(--spacing-3);
  min-width: max-content;
}
.v-card {
  position: relative;
  background: var(--bg-primary);
  border: 1px solid var(--border-color-light);
  border-radius: var(--border-radius-md);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  min-width: 200px;
  max-width: 300px;
}
.card-link {
  display: block;
  text-decoration: none;
}
.card-img {
  width: 100%;
  height: 140px;
  background: var(--bg-secondary);
  overflow: hidden;
}
.card-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.card-ph {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-auxiliary);
  background: var(--bg-tertiary);
}
.card-body {
  padding: var(--spacing-3);
}
.card-name {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin-bottom: var(--spacing-1);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.card-price {
  display: block;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-primary);
  margin-bottom: var(--spacing-1);
}
.card-badge {
  display: inline-block;
  padding: 2px var(--spacing-2);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  color: var(--color-white);
  background: var(--color-primary-light);
  border-radius: var(--border-radius-sm);
}
.btn-rm {
  position: absolute;
  top: var(--spacing-2);
  right: var(--spacing-2);
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.9);
  border: none;
  border-radius: var(--border-radius-full);
  color: var(--color-error);
  box-shadow: var(--shadow-sm);
  transition: background var(--transition-fast);
  z-index: 1;
}
.btn-rm:hover {
  background: var(--color-white);
}

/* Specs */
.section {
  margin-bottom: var(--spacing-6);
}
.sec-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-primary);
  margin-bottom: var(--spacing-3);
}
.table-scroll {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}
.spec-tbl {
  width: 100%;
  border-collapse: collapse;
  min-width: 400px;
}
.spec-tbl tr:nth-child(even) {
  background: var(--bg-secondary);
}
.spec-tbl th {
  text-align: left;
  padding: var(--spacing-3) var(--spacing-4);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--text-secondary);
  white-space: nowrap;
  min-width: 100px;
}
.spec-tbl td {
  padding: var(--spacing-3) var(--spacing-4);
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  text-align: center;
}

/* Ratings */
.flex-grid {
  display: grid;
  grid-template-columns: repeat(var(--cols, 2), 1fr);
  gap: var(--spacing-4);
}
.rate-cell {
  text-align: center;
}
.rate-label {
  display: block;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  color: var(--text-secondary);
  margin-bottom: var(--spacing-2);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.stars {
  display: flex;
  justify-content: center;
  gap: 2px;
}
.star-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  color: var(--color-gray-300);
  transition: color var(--transition-fast);
}
.star-btn.on {
  color: var(--color-gold);
}
.star-btn:hover {
  color: var(--color-gold-dark);
}

/* Notes */
.notes-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-4);
}
.note-cell {
  background: var(--bg-secondary);
  border-radius: var(--border-radius);
  padding: var(--spacing-4);
}
.note-label {
  display: block;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin-bottom: var(--spacing-2);
}
.note-cell textarea {
  width: 100%;
  min-height: 80px;
  padding: var(--spacing-3);
  border: 2px solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: var(--font-size-sm);
  font-family: inherit;
  resize: vertical;
}
.note-cell textarea:focus {
  border-color: var(--color-primary);
  outline: none;
}
.note-cell .btn-fill {
  margin-top: var(--spacing-2);
}

/* Print */
@media print {
  .btn-icon,
  .btn-rm,
  .btn-fill,
  .btn-outline,
  .selector-row,
  .new-form,
  .no-print {
    display: none !important;
  }
}

/* Tablet */
@media (min-width: 768px) {
  .cmp-wrap {
    padding: 0 var(--spacing-8);
  }
  .page-title {
    font-size: var(--font-size-3xl);
  }
  .cards-grid {
    min-width: auto;
  }
  .v-card {
    max-width: none;
  }
  .notes-grid {
    grid-template-columns: repeat(var(--cols, 2), 1fr);
  }
}

/* Desktop */
@media (min-width: 1024px) {
  .cards-scroll {
    overflow-x: visible;
  }
  .spec-tbl {
    min-width: auto;
  }
}
</style>

<script setup lang="ts">
import type { ComparisonVehicle } from '~/composables/usePerfilComparador'

defineProps<{
  vehicles: ComparisonVehicle[]
  draftNotes: Record<string, string>
  draftRatings: Record<string, number>
  specKeys: readonly string[]
}>()

const emit = defineEmits<{
  (e: 'remove' | 'save-note', vehicleId: string): void
  (e: 'set-rating', vehicleId: string, star: number): void
  (e: 'update-note', vehicleId: string, value: string): void
}>()

function getSpec(vehicle: ComparisonVehicle, key: string): string {
  const val = vehicle[key as keyof ComparisonVehicle]
  if (val == null) return '-'
  if (key === 'price') return `${Number(val).toLocaleString()} €`
  return String(val)
}
</script>

<template>
  <div class="cmp-content">
    <!-- Vehicle cards -->
    <div class="cards-scroll">
      <div class="cards-grid" :style="{ '--cols': vehicles.length }">
        <div v-for="vehicle in vehicles" :key="vehicle.id" class="v-card">
          <button
            class="btn-rm"
            :aria-label="$t('comparator.remove')"
            @click="emit('remove', vehicle.id)"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16" aria-hidden="true">
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
              @click="emit('set-rating', vehicle.id, star)"
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
          <label :for="`note-${vehicle.id}`" class="note-label">
            {{ vehicle.brand }} {{ vehicle.model }}
          </label>
          <textarea
            :id="`note-${vehicle.id}`"
            rows="3"
            :placeholder="$t('comparator.addNote')"
            :value="draftNotes[vehicle.id]"
            @input="emit('update-note', vehicle.id, ($event.target as HTMLTextAreaElement).value)"
          />
          <button class="btn-fill btn-sm" @click="emit('save-note', vehicle.id)">
            {{ $t('common.save') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cmp-content {
  display: flex;
  flex-direction: column;
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
  cursor: pointer;
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
  background: none;
  border: none;
  cursor: pointer;
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
  box-sizing: border-box;
}

.note-cell textarea:focus {
  border-color: var(--color-primary);
  outline: none;
}

.btn-fill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: var(--spacing-2) var(--spacing-4);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  border-radius: var(--border-radius);
  transition: background var(--transition-fast);
  color: var(--color-white);
  background: var(--color-primary);
  border: none;
  cursor: pointer;
  margin-top: var(--spacing-2);
}

.btn-fill:hover {
  background: var(--color-primary-dark);
}

.btn-sm {
  padding: var(--spacing-2) var(--spacing-3);
  font-size: var(--font-size-xs);
}

/* Print */
@media print {
  .btn-rm,
  .btn-fill,
  .no-print {
    display: none !important;
  }
}

@media (min-width: 768px) {
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

@media (min-width: 1024px) {
  .cards-scroll {
    overflow-x: visible;
  }

  .spec-tbl {
    min-width: auto;
  }
}
</style>

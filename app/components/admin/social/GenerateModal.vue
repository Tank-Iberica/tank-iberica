<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="show" class="modal-overlay" @click.self="$emit('close')">
        <div class="modal-panel modal-generate">
          <div class="modal-header">
            <h2>{{ t('admin.social.generatePosts') }}</h2>
            <button class="modal-close" @click="$emit('close')">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <div class="modal-body">
            <label class="form-label">{{ t('admin.social.selectVehicle') }}</label>
            <div class="search-row">
              <input
                :value="vehicleSearch"
                type="text"
                :placeholder="t('admin.social.vehicleSearchPlaceholder')"
                class="search-input"
                @input="handleSearchInput"
              >
            </div>

            <!-- Vehicle results -->
            <div v-if="vehicleResults.length > 0" class="vehicle-list">
              <button
                v-for="v in vehicleResults"
                :key="v.id"
                class="vehicle-option"
                :class="{ selected: selectedVehicleId === v.id }"
                @click="$emit('selectVehicle', v)"
              >
                <img
                  v-if="v.vehicle_images?.[0]?.url"
                  :src="v.vehicle_images[0].url"
                  :alt="`${v.brand} ${v.model}`"
                  class="vehicle-thumb"
                >
                <div v-else class="vehicle-thumb-placeholder" />
                <div class="vehicle-info">
                  <strong>{{ v.brand }} {{ v.model }}</strong>
                  <span v-if="v.location" class="vehicle-loc">{{ v.location }}</span>
                </div>
                <svg
                  v-if="selectedVehicleId === v.id"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  class="check-icon"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </button>
            </div>

            <div v-if="vehicleSearchLoading" class="search-loading">
              <div class="spinner small" />
            </div>
          </div>

          <div class="modal-footer">
            <button
              class="btn-generate-confirm"
              :disabled="!hasSelectedVehicle || actionLoading"
              @click="$emit('generate')"
            >
              {{
                actionLoading
                  ? t('admin.social.generating')
                  : t('admin.social.generateForAllPlatforms')
              }}
            </button>
            <button class="btn-cancel" @click="$emit('close')">
              {{ t('common.cancel') }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import type { VehicleSearchResult } from '~/composables/admin/useSocialAdminUI'

const { t } = useI18n()

const emit = defineEmits<{
  close: []
  'update:vehicleSearch': [value: string]
  search: []
  selectVehicle: [vehicle: VehicleSearchResult]
  generate: []
}>()

function handleSearchInput(e: Event) {
  emit('update:vehicleSearch', (e.target as HTMLInputElement).value)
  emit('search')
}

defineProps<{
  show: boolean
  vehicleSearch: string
  vehicleResults: VehicleSearchResult[]
  selectedVehicleId: string | null
  hasSelectedVehicle: boolean
  vehicleSearchLoading: boolean
  actionLoading: boolean
}>()
</script>

<style scoped>
@import './social-shared.css';

.modal-generate {
  max-height: 80vh;
}

.form-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #475569;
}

.search-row {
  position: relative;
}

.search-input {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.9rem;
  min-height: 44px;
}

.search-input:focus {
  outline: none;
  border-color: var(--color-primary, #23424a);
  box-shadow: 0 0 0 3px rgba(35, 66, 74, 0.1);
}

.vehicle-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 300px;
  overflow-y: auto;
}

.vehicle-option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  text-align: left;
  width: 100%;
  min-height: 56px;
  transition: all 0.15s;
}

.vehicle-option:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
}

.vehicle-option.selected {
  border-color: var(--color-primary, #23424a);
  background: rgba(35, 66, 74, 0.04);
}

.vehicle-thumb {
  width: 44px;
  height: 44px;
  border-radius: 6px;
  object-fit: cover;
  flex-shrink: 0;
}

.vehicle-thumb-placeholder {
  width: 44px;
  height: 44px;
  border-radius: 6px;
  background: #f1f5f9;
  flex-shrink: 0;
}

.vehicle-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.vehicle-info strong {
  font-size: 0.9rem;
  color: #1e293b;
}

.vehicle-loc {
  font-size: 0.8rem;
  color: #64748b;
}

.check-icon {
  color: var(--color-primary, #23424a);
  flex-shrink: 0;
}

.search-loading {
  display: flex;
  justify-content: center;
  padding: 12px;
}
</style>

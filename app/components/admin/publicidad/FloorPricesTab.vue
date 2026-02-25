<template>
  <div>
    <div class="tab-header">
      <span class="total-badge"
        >{{ floorPrices.length }} {{ t('admin.publicidad.positions') }}</span
      >
      <button class="btn-primary" :disabled="savingFloors" @click="$emit('save')">
        {{ savingFloors ? t('admin.publicidad.saving') : t('admin.publicidad.saveFloorPrices') }}
      </button>
    </div>

    <div class="table-container">
      <table class="admin-table">
        <thead>
          <tr>
            <th>{{ t('admin.publicidad.floorPricePosition') }}</th>
            <th style="width: 150px">{{ t('admin.publicidad.floorPriceCpm') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="fp in floorPrices" :key="fp.position">
            <td>
              <code>{{ fp.position }}</code>
            </td>
            <td>
              <input
                v-model.number="fp.floor_cpm_cents"
                type="number"
                min="0"
                step="1"
                class="floor-input"
              >
            </td>
          </tr>
          <tr v-if="!floorPrices.length">
            <td colspan="2" class="empty-state">{{ t('admin.publicidad.noFloorPrices') }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()

defineProps<{
  floorPrices: Array<{ position: string; floor_cpm_cents: number }>
  savingFloors: boolean
}>()

defineEmits<{
  save: []
}>()
</script>

<style scoped>
@import './publicidad-shared.css';
</style>

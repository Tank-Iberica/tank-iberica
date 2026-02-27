<script setup lang="ts">
interface SellData {
  sale_price: number
  buyer: string
  sale_date: string
  commission: number
  notes: string
}

defineProps<{
  showDeleteModal: boolean
  deleteConfirm: string
  vehicleBrand: string
  vehicleModel: string
  canDelete: boolean
  showSellModal: boolean
  sellData: SellData
  totalCost: number
  finalProfit: number
}>()

const emit = defineEmits<{
  (e: 'update:showDeleteModal' | 'update:showSellModal', val: boolean): void
  (e: 'update:deleteConfirm', val: string): void
  (e: 'update:sellData', val: SellData): void
  (e: 'delete' | 'sell'): void
}>()
</script>

<template>
  <AdminProductoDeleteModal
    :show="showDeleteModal"
    :delete-confirm="deleteConfirm"
    :vehicle-brand="vehicleBrand"
    :vehicle-model="vehicleModel"
    :can-delete="canDelete"
    @update:show="emit('update:showDeleteModal', $event)"
    @update:delete-confirm="emit('update:deleteConfirm', $event)"
    @delete="emit('delete')"
  />

  <AdminProductoSellModal
    :show="showSellModal"
    :sell-data="sellData"
    :vehicle-brand="vehicleBrand"
    :vehicle-model="vehicleModel"
    :total-cost="totalCost"
    :final-profit="finalProfit"
    @update:show="emit('update:showSellModal', $event)"
    @update:sell-data="emit('update:sellData', $event)"
    @sell="emit('sell')"
  />
</template>

<style scoped></style>

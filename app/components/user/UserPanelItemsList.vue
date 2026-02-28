<script setup lang="ts">
defineProps<{
  items: Array<{ id: string; title: string; date: string; status: string }>
  loading: boolean
  emptyKey: string
}>()

const { t } = useI18n()
</script>

<template>
  <div>
    <div v-if="loading" class="empty-state">{{ t('common.loading') }}</div>
    <div v-else-if="items.length === 0" class="empty-state">{{ t(emptyKey) }}</div>
    <div v-else class="items-list">
      <div v-for="item in items" :key="item.id" class="item-card">
        <div class="item-info">
          <span class="item-title">{{ item.title }}</span>
          <span class="item-date">{{ new Date(item.date).toLocaleDateString() }}</span>
        </div>
        <span :class="['status-badge', item.status]">{{ item.status }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.empty-state {
  text-align: center;
  color: #999;
  padding: 20px;
  font-size: 0.9rem;
}

.items-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.item-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  background: white;
  border-radius: 6px;
  border: 1px solid #eee;
}

.item-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.item-title {
  font-size: 0.9rem;
  font-weight: 500;
  color: #333;
}

.item-date {
  font-size: 0.75rem;
  color: #999;
}

.status-badge {
  font-size: 0.7rem;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 12px;
  text-transform: capitalize;
}

.status-badge.pending {
  background: #fef3c7;
  color: #92400e;
}

.status-badge.approved {
  background: #dcfce7;
  color: #166534;
}

.status-badge.rejected {
  background: #fee2e2;
  color: #991b1b;
}
</style>

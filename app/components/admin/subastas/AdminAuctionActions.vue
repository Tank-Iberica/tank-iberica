<script setup lang="ts">
import type { Auction } from '~/composables/useAuction'

defineProps<{
  auction: Auction
  bidsExist: boolean
  actionLoading: boolean
}>()

const emit = defineEmits<{
  start: []
  end: []
  adjudicate: []
  cancel: []
  refresh: []
}>()

const { t } = useI18n()
</script>

<template>
  <section class="section actions-section">
    <h2 class="section-title">{{ t('admin.subastas.detail.actions') }}</h2>
    <div class="actions-row">
      <button
        v-if="auction.status === 'scheduled' && new Date(auction.starts_at) <= new Date()"
        class="btn-action btn-start"
        :disabled="actionLoading"
        @click="emit('start')"
      >
        &#9654; {{ t('admin.subastas.detail.startAuction') }}
      </button>

      <button
        v-if="auction.status === 'active'"
        class="btn-action btn-end"
        :disabled="actionLoading"
        @click="emit('end')"
      >
        &#9632; {{ t('admin.subastas.detail.endAuction') }}
      </button>

      <button
        v-if="auction.status === 'ended' && bidsExist"
        class="btn-action btn-adjudicate"
        :disabled="actionLoading"
        @click="emit('adjudicate')"
      >
        &#9989; {{ t('admin.subastas.detail.adjudicate') }}
      </button>

      <button
        v-if="
          auction.status !== 'cancelled' &&
          auction.status !== 'adjudicated' &&
          auction.status !== 'no_sale'
        "
        class="btn-action btn-cancel"
        :disabled="actionLoading"
        @click="emit('cancel')"
      >
        &#10060; {{ t('admin.subastas.detail.cancelAuction') }}
      </button>

      <button class="btn-action btn-refresh" :disabled="actionLoading" @click="emit('refresh')">
        &#8634; {{ t('admin.subastas.detail.refresh') }}
      </button>
    </div>
  </section>
</template>

<style scoped>
.section {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  padding: 20px 24px;
}

.actions-section {
  border: 2px solid #e2e8f0;
}

.section-title {
  margin: 0 0 16px;
  font-size: 1rem;
  font-weight: 600;
  color: #1e293b;
}

.actions-row {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  flex-direction: column;
}

.btn-action {
  padding: 12px 20px;
  border-radius: 10px;
  border: 2px solid #e2e8f0;
  background: white;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  min-height: 48px;
  transition: all 0.15s;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  justify-content: center;
}

.btn-action:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-start {
  border-color: #22c55e;
  color: #16a34a;
}
.btn-start:hover:not(:disabled) {
  background: #f0fdf4;
}

.btn-end {
  border-color: #f59e0b;
  color: #92400e;
}
.btn-end:hover:not(:disabled) {
  background: #fffbeb;
}

.btn-adjudicate {
  border-color: #7c3aed;
  color: #7c3aed;
}
.btn-adjudicate:hover:not(:disabled) {
  background: #faf5ff;
}

.btn-cancel {
  border-color: #dc2626;
  color: #dc2626;
}
.btn-cancel:hover:not(:disabled) {
  background: #fef2f2;
}

.btn-refresh {
  border-color: #64748b;
  color: #475569;
}
.btn-refresh:hover:not(:disabled) {
  background: #f8fafc;
}

@media (min-width: 480px) {
  .actions-row {
    flex-direction: row;
  }

  .btn-action {
    width: auto;
  }
}
</style>

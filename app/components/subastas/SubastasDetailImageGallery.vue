<template>
  <div class="vehicle-image-section">
    <div class="vehicle-image-wrapper">
      <img v-if="currentImage" :src="currentImage" :alt="vehicleTitle" class="vehicle-image" >
      <div v-else class="vehicle-image-placeholder">
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="m21 15-5-5L5 21" />
        </svg>
      </div>
      <span :class="['detail-status-badge', `status-${status}`]">
        {{ statusLabel }}
      </span>
    </div>

    <!-- Image thumbnails -->
    <div v-if="images.length > 1" class="image-thumbnails">
      <button
        v-for="(img, idx) in images"
        :key="img.url"
        :class="['thumb-btn', { active: selectedIndex === idx }]"
        @click="$emit('select-image', idx)"
      >
        <img :src="img.url" :alt="`${vehicleTitle} - ${idx + 1}`" loading="lazy" >
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { VehicleImage } from '~/composables/useAuctionDetail'

defineProps<{
  images: VehicleImage[]
  currentImage: string | null
  selectedIndex: number
  vehicleTitle: string
  status: string
  statusLabel: string
}>()

defineEmits<{
  (e: 'select-image', idx: number): void
}>()
</script>

<style scoped>
.vehicle-image-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

.vehicle-image-wrapper {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 10;
  background: var(--bg-secondary);
  border-radius: var(--border-radius-md);
  overflow: hidden;
}

.vehicle-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.vehicle-image-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-disabled);
}

.detail-status-badge {
  position: absolute;
  top: var(--spacing-3);
  left: var(--spacing-3);
  padding: var(--spacing-1) var(--spacing-3);
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.detail-status-badge.status-active {
  background: var(--color-success);
  color: var(--color-white);
}

.detail-status-badge.status-scheduled {
  background: var(--color-info);
  color: var(--color-white);
}

.detail-status-badge.status-ended {
  background: var(--color-gray-500);
  color: var(--color-white);
}

.detail-status-badge.status-adjudicated {
  background: var(--color-gold);
  color: var(--color-white);
}

.detail-status-badge.status-no_sale {
  background: var(--color-error);
  color: var(--color-white);
}

.detail-status-badge.status-cancelled {
  background: var(--color-gray-400);
  color: var(--color-white);
}

/* Thumbnails */
.image-thumbnails {
  display: flex;
  gap: var(--spacing-2);
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  padding-bottom: var(--spacing-1);
}

.thumb-btn {
  flex-shrink: 0;
  width: 64px;
  height: 48px;
  min-width: 64px;
  min-height: 48px;
  border-radius: var(--border-radius-sm);
  overflow: hidden;
  border: 2px solid transparent;
  padding: 0;
  cursor: pointer;
  transition:
    border-color var(--transition-fast),
    opacity var(--transition-fast);
  opacity: 0.7;
}

.thumb-btn img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.thumb-btn.active,
.thumb-btn:hover {
  border-color: var(--color-primary);
  opacity: 1;
}

@media (min-width: 480px) {
  .thumb-btn {
    width: 80px;
    height: 56px;
    min-width: 80px;
    min-height: 56px;
  }
}
</style>

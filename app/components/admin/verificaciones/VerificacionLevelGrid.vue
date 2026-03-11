<script setup lang="ts">
import type {
  VerificationLevelInfo,
  VehicleVerificationEntry,
} from '~/composables/admin/useAdminVerificaciones'

defineProps<{
  vehicleVerificationMap: Map<string, VehicleVerificationEntry>
  getVerificationLevelInfo: (level: string | null) => VerificationLevelInfo
}>()

const { t } = useI18n()
</script>

<template>
  <div class="vehicle-levels">
    <div
      v-for="[vehicleId, vData] in vehicleVerificationMap"
      :key="vehicleId"
      class="vehicle-level-card"
    >
      <div class="vlc-info">
        <span class="vlc-name">{{ vData.vehicle.brand }} {{ vData.vehicle.model }}</span>
        <span class="vlc-docs"
          >{{ vData.docs.filter((d) => d.status === 'verified').length }}/{{ vData.docs.length }}
          {{ t('admin.verificaciones.docsApproved') }}</span
        >
      </div>
      <div class="vlc-progress">
        <div class="progress-bar-container">
          <div
            class="progress-bar-fill"
            :class="getVerificationLevelInfo(vData.verificationLevel).cssClass"
            :style="{ width: getVerificationLevelInfo(vData.verificationLevel).progress + '%' }"
          />
        </div>
        <span class="vlc-level" :class="getVerificationLevelInfo(vData.verificationLevel).cssClass">
          {{ getVerificationLevelInfo(vData.verificationLevel).icon }}
          {{ getVerificationLevelInfo(vData.verificationLevel).label }}
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.vehicle-levels {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-2);
  margin-bottom: var(--spacing-2);
}

.vehicle-level-card {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
  padding: var(--spacing-3) var(--spacing-4);
  background: var(--bg-primary);
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-card);
}

.vlc-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.vlc-name {
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--text-primary);
}

.vlc-docs {
  font-size: 0.8rem;
  color: var(--text-auxiliary);
}

.vlc-progress {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
}

.progress-bar-container {
  flex: 1;
  height: 0.375rem;
  background: var(--bg-tertiary);
  border-radius: var(--border-radius-sm);
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  border-radius: inherit;
  transition: width 0.4s ease;
}

.progress-bar-fill.level-none {
  background: var(--color-gray-400);
  width: 0;
}

.progress-bar-fill.level-verified {
  background: var(--color-success);
}

.progress-bar-fill.level-extended {
  background: var(--color-info);
}

.progress-bar-fill.level-detailed {
  background: var(--color-violet-500);
}

.progress-bar-fill.level-audited {
  background: var(--color-warning);
}

.progress-bar-fill.level-certified {
  background: var(--color-teal-500);
}

.vlc-level {
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
}

.vlc-level.level-none {
  color: var(--text-disabled);
}
.vlc-level.level-verified {
  color: var(--color-success);
}
.vlc-level.level-extended {
  color: var(--color-focus);
}
.vlc-level.level-detailed {
  color: var(--color-purple-600);
}
.vlc-level.level-audited {
  color: var(--color-warning);
}
.vlc-level.level-certified {
  color: var(--color-teal-600);
}

/* 48em+ : Tablet layout */
@media (min-width: 48em) {
  .vehicle-levels {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* 64em+ : Desktop layout */
@media (min-width: 64em) {
  .vehicle-levels {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* 80em+ : Wide desktop */
@media (min-width: 80em) {
  .vehicle-levels {
    grid-template-columns: repeat(4, 1fr);
  }
}
</style>

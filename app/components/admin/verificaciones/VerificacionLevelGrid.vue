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
  gap: 8px;
  margin-bottom: 8px;
}

.vehicle-level-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 16px;
  background: white;
  border-radius: 10px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.vlc-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.vlc-name {
  font-weight: 600;
  font-size: 0.9rem;
  color: #1e293b;
}

.vlc-docs {
  font-size: 0.8rem;
  color: #64748b;
}

.vlc-progress {
  display: flex;
  align-items: center;
  gap: 12px;
}

.progress-bar-container {
  flex: 1;
  height: 6px;
  background: #e2e8f0;
  border-radius: 3px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  border-radius: inherit;
  transition: width 0.4s ease;
}

.progress-bar-fill.level-none {
  background: #94a3b8;
  width: 0;
}

.progress-bar-fill.level-verified {
  background: #22c55e;
}

.progress-bar-fill.level-extended {
  background: #3b82f6;
}

.progress-bar-fill.level-detailed {
  background: #8b5cf6;
}

.progress-bar-fill.level-audited {
  background: #f59e0b;
}

.progress-bar-fill.level-certified {
  background: #14b8a6;
}

.vlc-level {
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
}

.vlc-level.level-none {
  color: #94a3b8;
}
.vlc-level.level-verified {
  color: #16a34a;
}
.vlc-level.level-extended {
  color: #2563eb;
}
.vlc-level.level-detailed {
  color: #7c3aed;
}
.vlc-level.level-audited {
  color: #d97706;
}
.vlc-level.level-certified {
  color: #0d9488;
}

/* 768px+ : Tablet layout */
@media (min-width: 768px) {
  .vehicle-levels {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* 1024px+ : Desktop layout */
@media (min-width: 1024px) {
  .vehicle-levels {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* 1280px+ : Wide desktop */
@media (min-width: 1280px) {
  .vehicle-levels {
    grid-template-columns: repeat(4, 1fr);
  }
}
</style>

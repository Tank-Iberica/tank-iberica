<script setup lang="ts">
import type {
  PlatformKey,
  PlatformConfig,
} from '~/composables/dashboard/useDashboardExportarAnuncio'

defineProps<{
  platforms: PlatformConfig[]
  selectedPlatform: PlatformKey
  canGenerate: boolean
}>()

const emit = defineEmits<{
  (e: 'select', key: PlatformKey): void
  (e: 'generate'): void
}>()

const { t } = useI18n()
</script>

<template>
  <section class="card">
    <h2 class="card-title">{{ t('dashboard.adExport.selectPlatform') }}</h2>
    <div class="platform-grid">
      <button
        v-for="p in platforms"
        :key="p.key"
        class="platform-btn"
        :class="{ active: selectedPlatform === p.key }"
        @click="emit('select', p.key)"
      >
        <span class="platform-name">{{ p.label }}</span>
        <span class="platform-limit">{{
          t('dashboard.adExport.maxChars', { max: p.maxChars })
        }}</span>
      </button>
    </div>

    <button class="btn-generate" :disabled="!canGenerate" @click="emit('generate')">
      {{ t('dashboard.adExport.generate') }}
    </button>
  </section>
</template>

<style scoped>
.card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  padding: 20px;
}

.card-title {
  margin: 0 0 16px 0;
  font-size: 1.05rem;
  font-weight: 600;
  color: #1e293b;
}

.platform-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
  margin-bottom: 16px;
}

.platform-btn {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  min-height: 44px;
  padding: 12px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  transition:
    border-color 0.2s,
    background 0.2s;
}

.platform-btn:hover {
  border-color: #cbd5e1;
  background: #f8fafc;
}

.platform-btn.active {
  border-color: var(--color-primary, #23424a);
  background: #f0f9ff;
}

.platform-name {
  font-weight: 600;
  font-size: 0.95rem;
  color: #1e293b;
}

.platform-limit {
  font-size: 0.8rem;
  color: #94a3b8;
}

.btn-generate {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 44px;
  padding: 12px 24px;
  background: var(--color-primary, #23424a);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-generate:hover:not(:disabled) {
  background: #1a3238;
}

.btn-generate:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (min-width: 480px) {
  .platform-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 768px) {
  .platform-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>

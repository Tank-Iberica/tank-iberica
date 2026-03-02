<script setup lang="ts">
/**
 * ObservatorioPlatformModal — Platform settings modal.
 * Dealers toggle which platforms they track.
 */
import type { Platform } from '~/composables/dashboard/useDashboardObservatorio'

defineProps<{
  visible: boolean
  platforms: readonly Platform[]
  activePlatformIds: ReadonlySet<string>
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'toggle', platformId: string): void
}>()

const { t } = useI18n()
</script>

<template>
  <Teleport to="body">
    <div v-if="visible" class="modal-overlay" @click.self="emit('close')">
      <div
        class="modal-content modal-platforms"
        role="dialog"
        :aria-label="t('dashboard.observatory.platformSettings')"
      >
        <div class="modal-header">
          <h2>{{ t('dashboard.observatory.platformSettings') }}</h2>
          <button type="button" class="btn-close" @click="emit('close')">
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M15 5L5 15M5 5l10 10"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
              />
            </svg>
          </button>
        </div>

        <p class="platform-desc">{{ t('dashboard.observatory.platformDesc') }}</p>

        <div class="platform-list">
          <label v-for="p in platforms" :key="p.id" class="platform-item">
            <input
              type="checkbox"
              :checked="activePlatformIds.has(p.id)"
              @change="emit('toggle', p.id)"
            >
            <span class="platform-name">{{ p.name }}</span>
            <span v-if="p.is_default" class="platform-default">{{
              t('dashboard.observatory.defaultPlatform')
            }}</span>
          </label>
        </div>

        <div class="modal-actions">
          <button type="button" class="btn-primary" @click="emit('close')">
            {{ t('common.close') }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
}

.modal-content {
  background: var(--bg-primary);
  border-radius: 16px;
  width: 100%;
  max-width: 560px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
}

.modal-platforms {
  max-width: 480px;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 20px 0 20px;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--text-primary);
}

.btn-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: none;
  border: none;
  color: var(--text-disabled);
  cursor: pointer;
  border-radius: 8px;
}

.btn-close:hover {
  background: var(--bg-secondary);
  color: var(--text-secondary);
}

.platform-desc {
  margin: 0;
  padding: 16px 20px 0 20px;
  font-size: 0.9rem;
  color: var(--text-auxiliary);
}

.platform-list {
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.platform-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: var(--bg-secondary);
  border-radius: 8px;
  cursor: pointer;
  min-height: 44px;
}

.platform-item:hover {
  background: var(--bg-secondary);
}

.platform-item input[type='checkbox'] {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  accent-color: var(--color-primary);
}

.platform-name {
  flex: 1;
  font-weight: 500;
  color: var(--text-primary);
}

.platform-default {
  font-size: 0.75rem;
  color: var(--text-disabled);
  font-weight: 400;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 0 20px 20px 20px;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 10px 24px;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
  font-size: 0.95rem;
}

.btn-primary:hover {
  background: var(--color-primary-dark);
}
</style>

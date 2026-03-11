<script setup lang="ts">
import type { EmojiCategory } from '~/composables/admin/useAdminBanner'

defineProps<{
  show: boolean
  categories: EmojiCategory[]
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'select', emoji: string): void
}>()
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="show" class="emoji-picker-overlay" @click.self="emit('close')">
        <div class="emoji-picker-modal">
          <div class="emoji-picker-header">
            <span>Seleccionar emoji</span>
            <button class="btn-close-picker" type="button" @click="emit('close')">&#xD7;</button>
          </div>
          <div class="emoji-picker-body">
            <div v-for="category in categories" :key="category.name" class="emoji-category">
              <div class="emoji-category-name">{{ category.name }}</div>
              <div class="emoji-grid">
                <button
                  v-for="emoji in category.emojis"
                  :key="emoji"
                  class="emoji-btn"
                  type="button"
                  @click="emit('select', emoji)"
                >
                  {{ emoji }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.emoji-picker-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10001;
  padding: var(--spacing-5);
}

.emoji-picker-modal {
  background: var(--bg-primary);
  border-radius: var(--border-radius-md);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);
  width: 100%;
  max-width: 23.75rem;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.emoji-picker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-3) var(--spacing-4);
  background: var(--color-skeleton-bg);
  border-bottom: 1px solid #eee;
  font-weight: 500;
  flex-shrink: 0;
}

.btn-close-picker {
  background: none;
  border: none;
  font-size: var(--font-size-2xl);
  cursor: pointer;
  color: var(--text-secondary);
  padding: 0;
  line-height: 1;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--border-radius-sm);
  transition: background 0.15s;
}

.btn-close-picker:hover {
  background: var(--bg-tertiary);
}

.emoji-picker-body {
  overflow-y: auto;
  padding: var(--spacing-3);
  flex: 1;
}

.emoji-category {
  margin-bottom: var(--spacing-4);
}

.emoji-category:last-child {
  margin-bottom: 0;
}

.emoji-category-name {
  font-size: 0.6875rem;
  font-weight: 600;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: var(--spacing-2);
  padding-left: var(--spacing-1);
}

.emoji-grid {
  display: grid;
  grid-template-columns: repeat(10, 1fr);
  gap: 0.125rem;
}

.emoji-btn {
  font-size: 1.375rem;
  padding: 0.375rem;
  cursor: pointer;
  border-radius: var(--border-radius);
  text-align: center;
  transition: all 0.15s;
  background: transparent;
  border: none;
}

.emoji-btn:hover {
  background: var(--color-sky-100);
  transform: scale(1.15);
}

/* Fade transition for modal */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 48em) {
  .emoji-picker-overlay {
    padding: 0.625rem;
    align-items: flex-end;
  }

  .emoji-picker-modal {
    max-width: 100%;
    max-height: 70vh;
  }

  .emoji-grid {
    grid-template-columns: repeat(8, 1fr);
  }

  .emoji-btn {
    font-size: var(--font-size-xl);
    padding: 0.3125rem;
  }
}
</style>

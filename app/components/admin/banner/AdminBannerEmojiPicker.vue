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
  padding: 20px;
}

.emoji-picker-modal {
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);
  width: 100%;
  max-width: 380px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.emoji-picker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f5f5f5;
  border-bottom: 1px solid #eee;
  font-weight: 500;
  flex-shrink: 0;
}

.btn-close-picker {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
  padding: 0;
  line-height: 1;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: background 0.15s;
}

.btn-close-picker:hover {
  background: #e5e7eb;
}

.emoji-picker-body {
  overflow-y: auto;
  padding: 12px;
  flex: 1;
}

.emoji-category {
  margin-bottom: 16px;
}

.emoji-category:last-child {
  margin-bottom: 0;
}

.emoji-category-name {
  font-size: 11px;
  font-weight: 600;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
  padding-left: 4px;
}

.emoji-grid {
  display: grid;
  grid-template-columns: repeat(10, 1fr);
  gap: 2px;
}

.emoji-btn {
  font-size: 22px;
  padding: 6px;
  cursor: pointer;
  border-radius: 6px;
  text-align: center;
  transition: all 0.15s;
  background: transparent;
  border: none;
}

.emoji-btn:hover {
  background: #e0f2fe;
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

@media (max-width: 768px) {
  .emoji-picker-overlay {
    padding: 10px;
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
    font-size: 20px;
    padding: 5px;
  }
}
</style>

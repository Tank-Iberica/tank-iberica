<script setup lang="ts">
import type { Conversation } from '~/composables/useConversation'
import { formatTimestamp } from '~/composables/usePerfilMensajes'

const props = defineProps<{
  conversations: Conversation[]
  loading: boolean
  activeConversationId: string | null
  mobileShowConversation: boolean
}>()

const emit = defineEmits<{
  (e: 'select', conversationId: string): void
}>()

const { t } = useI18n()
const { getImageUrl } = useImageUrl()

function getLastMessagePreview(_conv: { id: string }): string {
  return t('messages.tapToOpen')
}
</script>

<template>
  <aside
    class="conv-list-panel"
    :class="{ 'conv-list-panel--hidden-mobile': props.mobileShowConversation }"
  >
    <!-- Loading -->
    <div v-if="props.loading && props.conversations.length === 0" class="panel-loading">
      {{ $t('common.loading') }}
    </div>

    <!-- Empty -->
    <div v-else-if="props.conversations.length === 0" class="panel-empty">
      <p class="panel-empty__title">{{ $t('messages.noConversations') }}</p>
      <p class="panel-empty__desc">{{ $t('messages.noConversationsDesc') }}</p>
    </div>

    <!-- Conversation items -->
    <button
      v-for="conv in props.conversations"
      :key="conv.id"
      class="conv-item"
      :class="{ 'conv-item--active': props.activeConversationId === conv.id }"
      @click="emit('select', conv.id)"
    >
      <div class="conv-item__thumb">
        <img
          v-if="conv.vehicle_image"
          :src="getImageUrl(conv.vehicle_image, 'thumb')"
          :alt="conv.vehicle_title || ''"
          loading="lazy"
        >
        <div v-else class="conv-item__thumb-placeholder">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            width="20"
            height="20"
            stroke-width="1.5"
            aria-hidden="true"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
            />
          </svg>
        </div>
      </div>

      <div class="conv-item__content">
        <span class="conv-item__vehicle-title">
          {{ conv.vehicle_title || $t('messages.unknownVehicle') }}
        </span>
        <span class="conv-item__other-party">
          {{ conv.other_party_name || $t('messages.unknownUser') }}
        </span>
        <span class="conv-item__preview">
          {{ getLastMessagePreview(conv) }}
        </span>
      </div>

      <div class="conv-item__meta">
        <span class="conv-item__time">{{ formatTimestamp(conv.last_message_at, t) }}</span>
      </div>
    </button>
  </aside>
</template>

<style scoped>
.conv-list-panel {
  width: 100%;
  flex-shrink: 0;
  overflow-y: auto;
  border-right: 1px solid var(--border-color-light);
  display: flex;
  flex-direction: column;
}

.conv-list-panel--hidden-mobile {
  display: none;
}

.panel-loading,
.panel-empty {
  padding: var(--spacing-8) var(--spacing-4);
  text-align: center;
}

.panel-loading {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.panel-empty__title {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin-bottom: var(--spacing-2);
}

.panel-empty__desc {
  font-size: var(--font-size-sm);
  color: var(--text-auxiliary);
}

.conv-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  padding: var(--spacing-3) var(--spacing-4);
  width: 100%;
  text-align: left;
  background: none;
  border: none;
  border-bottom: 1px solid var(--border-color-light);
  cursor: pointer;
  transition: background var(--transition-fast);
  min-height: 72px;
}

.conv-item:hover {
  background: var(--bg-secondary);
}

.conv-item--active {
  background: var(--bg-secondary);
  border-left: 3px solid var(--color-primary);
}

.conv-item__thumb {
  width: 44px;
  height: 44px;
  border-radius: var(--border-radius-sm);
  overflow: hidden;
  flex-shrink: 0;
  background: var(--bg-tertiary);
}

.conv-item__thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.conv-item__thumb-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-auxiliary);
}

.conv-item__content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.conv-item__vehicle-title {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.conv-item__other-party {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
}

.conv-item__preview {
  font-size: var(--font-size-xs);
  color: var(--text-auxiliary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.conv-item__meta {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--spacing-1);
}

.conv-item__time {
  font-size: var(--font-size-xs);
  color: var(--text-auxiliary);
  white-space: nowrap;
}

@media (min-width: 768px) {
  .conv-list-panel {
    width: 320px;
    display: flex !important;
  }

  .conv-list-panel--hidden-mobile {
    display: flex;
  }
}

@media (min-width: 1024px) {
  .conv-list-panel {
    width: 360px;
  }
}
</style>

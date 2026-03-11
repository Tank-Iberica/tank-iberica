<script setup lang="ts">
import type { Conversation, ChatUser } from '~/composables/admin/useAdminChats'

defineProps<{
  conversations: Conversation[]
  activeUserId: string | null
  searchQuery: string
  getUserDisplayName: (user: ChatUser) => string
  getUserInitials: (user: ChatUser) => string
  formatMessageTime: (dateStr: string) => string
  showConversationList: boolean
}>()

const emit = defineEmits<{
  'select-conversation': [value: string]
  'update:searchQuery': [value: string]
}>()

function onSearchInput(event: Event) {
  const target = event.target as HTMLInputElement
  emit('update:searchQuery', target.value)
}
</script>

<template>
  <div
    class="conversation-list"
    :class="{ 'mobile-hidden': !showConversationList && activeUserId }"
  >
    <!-- Search -->
    <div class="search-box">
      <input
        type="text"
        :value="searchQuery"
        placeholder="Buscar conversaciones..."
        @input="onSearchInput"
      >
    </div>

    <!-- Empty state -->
    <div v-if="conversations.length === 0" class="empty-list">
      <div class="empty-icon">\uD83D\uDCAC</div>
      <p v-if="searchQuery">No hay resultados para "{{ searchQuery }}"</p>
      <p v-else>No hay conversaciones a\u00FAn</p>
    </div>

    <!-- Conversations -->
    <div class="conversations">
      <button
        v-for="conv in conversations"
        :key="conv.user.id"
        class="conversation-item"
        :class="{ active: activeUserId === conv.user.id }"
        @click="emit('select-conversation', conv.user.id)"
      >
        <!-- Avatar -->
        <div class="avatar">
          <img
            v-if="conv.user.avatar_url"
            :src="conv.user.avatar_url"
            :alt="getUserDisplayName(conv.user)"
          >
          <span v-else class="avatar-initials">
            {{ getUserInitials(conv.user) }}
          </span>
          <span v-if="conv.unreadCount > 0" class="unread-dot" />
        </div>

        <!-- Info -->
        <div class="conversation-info">
          <div class="conversation-header">
            <span class="conversation-name">
              {{ getUserDisplayName(conv.user) }}
            </span>
            <span v-if="conv.lastMessage" class="conversation-time">
              {{ formatMessageTime(conv.lastMessage.created_at) }}
            </span>
          </div>
          <div class="conversation-preview">
            <span v-if="conv.lastMessage" class="preview-text">
              <span v-if="conv.lastMessage.direction === 'admin_to_user'" class="preview-you"
                >T\u00FA:
              </span>
              {{ conv.lastMessage.content }}
            </span>
            <span v-else class="preview-empty">Sin mensajes</span>
            <span v-if="conv.unreadCount > 0" class="unread-badge">
              {{ conv.unreadCount }}
            </span>
          </div>
        </div>
      </button>
    </div>
  </div>
</template>

<style scoped>
.conversation-list {
  width: 21.25rem;
  border-right: 1px solid var(--color-gray-200);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.search-box {
  padding: var(--spacing-3);
  border-bottom: 1px solid var(--color-gray-200);
}

.search-box input {
  width: 100%;
  padding: 0.625rem 0.875rem;
  border: 1px solid var(--border-color-light);
  border-radius: var(--border-radius-full);
  font-size: 0.9rem;
  background: var(--color-gray-50);
}

.search-box input:focus {
  outline: none;
  border-color: var(--color-primary);
  background: var(--bg-primary);
}

.conversations {
  flex: 1;
  overflow-y: auto;
}

.conversation-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  width: 100%;
  padding: var(--spacing-3) var(--spacing-4);
  border: none;
  background: none;
  text-align: left;
  cursor: pointer;
  transition: background 0.15s;
  border-bottom: 1px solid var(--color-gray-100);
}

.conversation-item:hover {
  background: var(--color-gray-50);
}

.conversation-item.active {
  background: var(--color-blue-50);
}

.avatar {
  position: relative;
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  background: var(--bg-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-initials {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--color-gray-500);
}

.unread-dot {
  position: absolute;
  top: 0.125rem;
  right: 0.125rem;
  width: 0.75rem;
  height: 0.75rem;
  background: var(--color-success);
  border-radius: 50%;
  border: 2px solid white;
}

.conversation-info {
  flex: 1;
  min-width: 0;
}

.conversation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-1);
}

.conversation-name {
  font-weight: 600;
  color: var(--color-gray-800);
  font-size: 0.95rem;
}

.conversation-time {
  font-size: 0.75rem;
  color: var(--text-disabled);
}

.conversation-preview {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}

.preview-text {
  flex: 1;
  font-size: 0.85rem;
  color: var(--color-gray-500);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.preview-you {
  color: var(--text-disabled);
}

.preview-empty {
  font-size: 0.85rem;
  color: var(--text-disabled);
  font-style: italic;
}

.unread-badge {
  background: var(--color-success);
  color: white;
  font-size: 0.7rem;
  font-weight: 600;
  padding: 0.125rem 0.375rem;
  border-radius: var(--border-radius-md);
  min-width: 1.25rem;
  text-align: center;
}

.empty-list {
  padding: var(--spacing-10) var(--spacing-5);
  text-align: center;
  color: var(--text-disabled);
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: var(--spacing-3);
}

.empty-list p {
  margin: 0;
}

/* Scrollbar styling */
.conversations::-webkit-scrollbar {
  width: 0.375rem;
}

.conversations::-webkit-scrollbar-track {
  background: transparent;
}

.conversations::-webkit-scrollbar-thumb {
  background: var(--color-gray-300);
  border-radius: var(--border-radius-sm);
}

.conversations::-webkit-scrollbar-thumb:hover {
  background: var(--color-gray-400);
}

/* Mobile responsive */
@media (max-width: 48em) {
  .conversation-list {
    width: 100%;
    border-right: none;
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: var(--bg-primary);
    z-index: 10;
  }

  .conversation-list.mobile-hidden {
    display: none;
  }

  .avatar {
    width: 2.75rem;
    height: 2.75rem;
  }
}
</style>

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
  (e: 'select-conversation' | 'update:searchQuery', value: string): void
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
  width: 340px;
  border-right: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.search-box {
  padding: 12px;
  border-bottom: 1px solid #e5e7eb;
}

.search-box input {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid var(--border-color-light);
  border-radius: 20px;
  font-size: 0.9rem;
  background: #f9fafb;
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
  gap: 12px;
  width: 100%;
  padding: 12px 16px;
  border: none;
  background: none;
  text-align: left;
  cursor: pointer;
  transition: background 0.15s;
  border-bottom: 1px solid #f3f4f6;
}

.conversation-item:hover {
  background: #f9fafb;
}

.conversation-item.active {
  background: #eff6ff;
}

.avatar {
  position: relative;
  width: 48px;
  height: 48px;
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
  color: #6b7280;
}

.unread-dot {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 12px;
  height: 12px;
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
  margin-bottom: 4px;
}

.conversation-name {
  font-weight: 600;
  color: #1f2937;
  font-size: 0.95rem;
}

.conversation-time {
  font-size: 0.75rem;
  color: var(--text-disabled);
}

.conversation-preview {
  display: flex;
  align-items: center;
  gap: 8px;
}

.preview-text {
  flex: 1;
  font-size: 0.85rem;
  color: #6b7280;
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
  padding: 2px 6px;
  border-radius: 10px;
  min-width: 20px;
  text-align: center;
}

.empty-list {
  padding: 40px 20px;
  text-align: center;
  color: var(--text-disabled);
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.empty-list p {
  margin: 0;
}

/* Scrollbar styling */
.conversations::-webkit-scrollbar {
  width: 6px;
}

.conversations::-webkit-scrollbar-track {
  background: transparent;
}

.conversations::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 3px;
}

.conversations::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}

/* Mobile responsive */
@media (max-width: 768px) {
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
    width: 44px;
    height: 44px;
  }
}
</style>

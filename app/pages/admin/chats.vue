<script setup lang="ts">
import { useAdminChats } from '~/composables/admin/useAdminChats'
import ChatConversationList from '~/components/admin/chats/ChatConversationList.vue'
import ChatPanel from '~/components/admin/chats/ChatPanel.vue'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const {
  loading,
  sending,
  error,
  activeConversation,
  activeUserId,
  totalUnreadCount,
  searchQuery,
  messageInput,
  messagesContainer,
  showConversationList,
  filteredConversations,
  init,
  handleSendMessage,
  selectConversation,
  goBackToList,
  handleKeyDown,
  groupMessagesByDate,
  formatMessageTime,
  formatFullDate,
  getUserDisplayName,
  getUserInitials,
} = useAdminChats()

onMounted(async () => {
  await init()
})

function onUpdateMessagesContainerRef(el: HTMLElement | null) {
  messagesContainer.value = el
}
</script>

<template>
  <div class="admin-chat">
    <!-- Header -->
    <div class="section-header">
      <h2>{{ $t('admin.chats.title') }}</h2>
      <div v-if="totalUnreadCount > 0" class="unread-badge-header">
        {{ totalUnreadCount }} {{ $t('admin.chats.unread', 'sin leer') }}
      </div>
    </div>

    <!-- Error message -->
    <div v-if="error" class="error-banner">
      {{ error }}
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner" />
      {{ $t('common.loadingItems') }}
    </div>

    <!-- Chat container -->
    <div v-else class="chat-container">
      <ChatConversationList
        :conversations="filteredConversations"
        :active-user-id="activeUserId"
        :search-query="searchQuery"
        :show-conversation-list="showConversationList"
        :get-user-display-name="getUserDisplayName"
        :get-user-initials="getUserInitials"
        :format-message-time="formatMessageTime"
        @select-conversation="selectConversation"
        @update:search-query="searchQuery = $event"
      />

      <ChatPanel
        :active-conversation="activeConversation"
        :active-user-id="activeUserId"
        :sending="sending"
        :message-input="messageInput"
        :show-conversation-list="showConversationList"
        :messages-container-ref="messagesContainer"
        :get-user-display-name="getUserDisplayName"
        :get-user-initials="getUserInitials"
        :format-message-time="formatMessageTime"
        :format-full-date="formatFullDate"
        :group-messages-by-date="groupMessagesByDate"
        @go-back="goBackToList"
        @send-message="handleSendMessage"
        @update:message-input="messageInput = $event"
        @keydown="handleKeyDown"
        @update:messages-container-ref="onUpdateMessagesContainerRef"
      />
    </div>
  </div>
</template>

<style scoped>
.admin-chat {
  padding: 0;
  height: calc(100vh - 120px);
  display: flex;
  flex-direction: column;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--spacing-3);
  margin-bottom: var(--spacing-4);
  flex-shrink: 0;
}

.section-header h2 {
  margin: 0;
  font-size: 1.5rem;
}

.unread-badge-header {
  background: var(--color-error);
  color: white;
  padding: var(--spacing-1) var(--spacing-3);
  border-radius: var(--border-radius-md);
  font-size: 0.85rem;
  font-weight: 500;
}

.error-banner {
  background: var(--color-error-bg, var(--color-error-bg));
  color: var(--color-error);
  padding: var(--spacing-3) var(--spacing-4);
  border-radius: var(--border-radius);
  margin-bottom: var(--spacing-4);
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-3);
  padding: 3.75rem;
  color: var(--color-gray-500);
}

.loading-spinner {
  width: 1.5rem;
  height: 1.5rem;
  border: 3px solid var(--border-color-light);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.chat-container {
  flex: 1;
  display: flex;
  background: var(--bg-primary);
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-card);
  overflow: hidden;
  min-height: 0;
}

@media (max-width: 48em) {
  .admin-chat {
    height: calc(100vh - 80px);
  }

  .chat-container {
    flex-direction: column;
    position: relative;
  }
}
</style>

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
      <h2>Chats</h2>
      <div v-if="totalUnreadCount > 0" class="unread-badge-header">
        {{ totalUnreadCount }} sin leer
      </div>
    </div>

    <!-- Error message -->
    <div v-if="error" class="error-banner">
      {{ error }}
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner" />
      Cargando conversaciones...
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
  gap: 12px;
  margin-bottom: 16px;
  flex-shrink: 0;
}

.section-header h2 {
  margin: 0;
  font-size: 1.5rem;
}

.unread-badge-header {
  background: #ef4444;
  color: white;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 500;
}

.error-banner {
  background: #fef2f2;
  color: #dc2626;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 60px;
  color: #6b7280;
}

.loading-spinner {
  width: 24px;
  height: 24px;
  border: 3px solid #e5e7eb;
  border-top-color: var(--color-primary, #23424a);
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
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  min-height: 0;
}

@media (max-width: 768px) {
  .admin-chat {
    height: calc(100vh - 80px);
  }

  .chat-container {
    flex-direction: column;
    position: relative;
  }
}
</style>

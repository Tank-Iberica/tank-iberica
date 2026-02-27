<script setup lang="ts">
import { usePerfilMensajes } from '~/composables/usePerfilMensajes'

definePageMeta({
  layout: 'default',
  middleware: ['auth'],
})

const { t } = useI18n()

const {
  // State
  messageInput,
  mobileShowConversation,
  messagesListRef,
  // From useConversation
  activeConversation,
  messages,
  loading,
  sending,
  unreadCount,
  isDataShared,
  hasAcceptedShare,
  // Computed
  sortedConversations,
  currentUserId,
  otherPartyName,
  conversationStatusLabel,
  conversationStatusClass,
  isConversationClosed,
  // Helpers
  maskContactData,
  // Actions
  handleSelectConversation,
  handleBackToList,
  handleSendMessage,
  handleAcceptDataShare,
  handleCloseConversation,
  // Lifecycle
  init,
} = usePerfilMensajes()

useHead({ title: t('messages.pageTitle') })

onMounted(async () => {
  await init()
})
</script>

<template>
  <div class="messages-page">
    <div class="messages-container">
      <PerfilMensajesMensajesPageHeader
        :unread-count="unreadCount"
        :mobile-show-conversation="mobileShowConversation"
      />

      <div class="messages-layout">
        <!-- Left panel: conversation list -->
        <PerfilMensajesConversationListPanel
          :conversations="sortedConversations"
          :loading="loading"
          :active-conversation-id="activeConversation?.id ?? null"
          :mobile-show-conversation="mobileShowConversation"
          @select="handleSelectConversation"
        />

        <!-- Right panel: active conversation -->
        <main
          class="conv-detail-panel"
          :class="{ 'conv-detail-panel--visible-mobile': mobileShowConversation }"
        >
          <!-- No conversation selected -->
          <PerfilMensajesConversationEmptyState v-if="!activeConversation" />

          <!-- Conversation active -->
          <template v-else>
            <PerfilMensajesConversationHeader
              :vehicle-title="activeConversation.vehicle_title || ''"
              :other-party-name="otherPartyName"
              :status-label="conversationStatusLabel"
              :status-class="conversationStatusClass"
              :is-closed="isConversationClosed"
              @back="handleBackToList"
              @close="handleCloseConversation"
            />

            <PerfilMensajesDataShareBanner
              v-if="!isDataShared && !isConversationClosed"
              :has-accepted-share="hasAcceptedShare"
              @accept-share="handleAcceptDataShare"
            />

            <PerfilMensajesMessagesList
              ref="messagesListRef"
              :messages="messages"
              :current-user-id="currentUserId"
              :is-data-shared="isDataShared"
              :mask-contact-data="maskContactData"
            />

            <PerfilMensajesMessageInputArea
              v-if="!isConversationClosed"
              :value="messageInput"
              :sending="sending"
              @input="messageInput = $event"
              @send="handleSendMessage"
            />

            <!-- Closed notice -->
            <div v-else class="conv-closed-notice">
              {{ $t('messages.conversationClosed') }}
            </div>
          </template>
        </main>
      </div>
    </div>
  </div>
</template>

<style scoped>
.messages-page {
  min-height: 60vh;
  padding: var(--spacing-4) 0 0;
}

.messages-container {
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 var(--spacing-4);
}

/* Layout */
.messages-layout {
  display: flex;
  gap: 0;
  background: var(--bg-primary);
  border: 1px solid var(--border-color-light);
  border-radius: var(--border-radius-md);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  height: calc(100vh - 180px);
  min-height: 400px;
}

/* Right panel: conversation detail */
.conv-detail-panel {
  display: none;
  flex: 1;
  flex-direction: column;
  min-width: 0;
}

.conv-detail-panel--visible-mobile {
  display: flex;
  width: 100%;
}

/* Closed notice */
.conv-closed-notice {
  padding: var(--spacing-4);
  text-align: center;
  font-size: var(--font-size-sm);
  color: var(--text-auxiliary);
  background: var(--bg-secondary);
  border-top: 1px solid var(--border-color-light);
}

/* ---- Tablet (768px): side-by-side layout ---- */
@media (min-width: 768px) {
  .messages-layout {
    height: calc(100vh - 200px);
  }

  .conv-detail-panel {
    display: flex;
  }

  .conv-detail-panel--visible-mobile {
    width: auto;
  }
}

/* ---- Desktop (1024px) ---- */
@media (min-width: 1024px) {
  .messages-container {
    padding: 0 var(--spacing-8);
  }

  .messages-layout {
    height: calc(100vh - 220px);
    min-height: 500px;
  }
}
</style>

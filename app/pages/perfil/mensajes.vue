<script setup lang="ts">
definePageMeta({
  layout: 'default',
  middleware: ['auth'],
})

const { t } = useI18n()
const user = useSupabaseUser()
const { getImageUrl } = useImageUrl()

const {
  conversations,
  activeConversation,
  messages,
  loading,
  sending,
  unreadCount,
  isDataShared,
  hasAcceptedShare,
  fetchConversations,
  openConversation,
  sendMessage,
  acceptDataShare,
  closeConversation,
  maskContactData,
} = useConversation()

// --------------- Local state ---------------

const messageInput = ref('')
const messagesEndRef = ref<HTMLDivElement | null>(null)
const mobileShowConversation = ref(false)

// --------------- Computed ---------------

const sortedConversations = computed(() => {
  return [...conversations.value].sort(
    (a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime(),
  )
})

const currentUserId = computed(() => user.value?.id ?? '')

const otherPartyName = computed<string>(() => {
  if (!activeConversation.value) return ''
  return activeConversation.value.other_party_name || t('messages.unknownUser')
})

const conversationStatusLabel = computed<string>(() => {
  if (!activeConversation.value) return ''
  const status = activeConversation.value.status
  if (status === 'data_shared') return t('messages.statusDataShared')
  if (status === 'closed') return t('messages.statusClosed')
  if (status === 'reported') return t('messages.statusReported')
  return t('messages.statusActive')
})

const conversationStatusClass = computed<string>(() => {
  if (!activeConversation.value) return ''
  const status = activeConversation.value.status
  if (status === 'data_shared') return 'conv-status--shared'
  if (status === 'closed') return 'conv-status--closed'
  if (status === 'reported') return 'conv-status--reported'
  return 'conv-status--active'
})

const isConversationClosed = computed<boolean>(() => {
  if (!activeConversation.value) return true
  return (
    activeConversation.value.status === 'closed' || activeConversation.value.status === 'reported'
  )
})

// --------------- Helpers ---------------

function getLastMessagePreview(_conv: { id: string }): string {
  // We don't have per-conversation last message stored in list,
  // so just show timestamp-based preview
  return t('messages.tapToOpen')
}

function formatTimestamp(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
  }
  if (diffDays === 1) {
    return t('messages.yesterday')
  }
  if (diffDays < 7) {
    return date.toLocaleDateString(undefined, { weekday: 'short' })
  }
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
}

function formatMessageTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
}

function isOwnMessage(senderId: string): boolean {
  return senderId === currentUserId.value
}

function _getConversationUnreadCount(_convId: string): number {
  // Check messages in the active conversation context;
  // for sidebar, we rely on unread status from a future enhancement.
  // For now return 0 (the composable tracks global unread).
  return 0
}

function getDisplayContent(content: string, isSystem: boolean): string {
  if (isSystem) {
    if (content === 'both_parties_shared_data') {
      return t('messages.systemDataShared')
    }
    return content
  }

  if (!activeConversation.value) return content
  return maskContactData(content, isDataShared.value)
}

// --------------- Actions ---------------

async function handleSelectConversation(convId: string): Promise<void> {
  await openConversation(convId)
  mobileShowConversation.value = true
  await nextTick()
  scrollToBottom()
}

function handleBackToList(): void {
  mobileShowConversation.value = false
}

async function handleSendMessage(): Promise<void> {
  if (!activeConversation.value || !messageInput.value.trim()) return

  const content = messageInput.value.trim()
  messageInput.value = ''

  await sendMessage(activeConversation.value.id, content)
  await nextTick()
  scrollToBottom()
}

async function handleAcceptDataShare(): Promise<void> {
  if (!activeConversation.value) return
  await acceptDataShare(activeConversation.value.id)
}

async function handleCloseConversation(): Promise<void> {
  if (!activeConversation.value) return
  await closeConversation(activeConversation.value.id)
  mobileShowConversation.value = false
}

function scrollToBottom(): void {
  if (messagesEndRef.value) {
    messagesEndRef.value.scrollIntoView({ behavior: 'smooth' })
  }
}

// --------------- Watch for new messages ---------------

watch(
  () => messages.value.length,
  () => {
    nextTick(() => scrollToBottom())
  },
)

// --------------- SEO ---------------

useHead({
  title: t('messages.pageTitle'),
})

// --------------- Lifecycle ---------------

onMounted(async () => {
  await fetchConversations()
})
</script>

<template>
  <div class="messages-page">
    <div class="messages-container">
      <!-- Page header (mobile only when list visible) -->
      <div v-if="!mobileShowConversation" class="messages-header messages-header--mobile">
        <h1 class="page-title">{{ $t('messages.pageTitle') }}</h1>
        <span v-if="unreadCount > 0" class="unread-global-badge">{{ unreadCount }}</span>
      </div>
      <div class="messages-header messages-header--desktop">
        <h1 class="page-title">{{ $t('messages.pageTitle') }}</h1>
        <span v-if="unreadCount > 0" class="unread-global-badge">{{ unreadCount }}</span>
      </div>

      <div class="messages-layout">
        <!-- Left panel: conversation list -->
        <aside
          class="conv-list-panel"
          :class="{ 'conv-list-panel--hidden-mobile': mobileShowConversation }"
        >
          <!-- Loading -->
          <div v-if="loading && conversations.length === 0" class="panel-loading">
            {{ $t('common.loading') }}
          </div>

          <!-- Empty -->
          <div v-else-if="conversations.length === 0" class="panel-empty">
            <p class="panel-empty__title">{{ $t('messages.noConversations') }}</p>
            <p class="panel-empty__desc">{{ $t('messages.noConversationsDesc') }}</p>
          </div>

          <!-- Conversation items -->
          <button
            v-for="conv in sortedConversations"
            :key="conv.id"
            class="conv-item"
            :class="{ 'conv-item--active': activeConversation?.id === conv.id }"
            @click="handleSelectConversation(conv.id)"
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
              <span class="conv-item__time">{{ formatTimestamp(conv.last_message_at) }}</span>
            </div>
          </button>
        </aside>

        <!-- Right panel: active conversation -->
        <main
          class="conv-detail-panel"
          :class="{ 'conv-detail-panel--visible-mobile': mobileShowConversation }"
        >
          <!-- No conversation selected (desktop) -->
          <div v-if="!activeConversation" class="conv-detail-empty">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              width="48"
              height="48"
              stroke-width="1"
              aria-hidden="true"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155"
              />
            </svg>
            <p class="conv-detail-empty__text">{{ $t('messages.selectConversation') }}</p>
          </div>

          <!-- Conversation active -->
          <template v-else>
            <!-- Conversation header -->
            <header class="conv-header">
              <button class="conv-header__back" @click="handleBackToList">
                <svg
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  width="20"
                  height="20"
                  aria-hidden="true"
                >
                  <path
                    fill-rule="evenodd"
                    d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                    clip-rule="evenodd"
                  />
                </svg>
                <span class="sr-only">{{ $t('common.back') }}</span>
              </button>

              <div class="conv-header__info">
                <span class="conv-header__vehicle">
                  {{ activeConversation.vehicle_title || $t('messages.unknownVehicle') }}
                </span>
                <span class="conv-header__party">{{ otherPartyName }}</span>
              </div>

              <span class="conv-header__status" :class="conversationStatusClass">
                {{ conversationStatusLabel }}
              </span>

              <button
                v-if="!isConversationClosed"
                class="conv-header__close-btn"
                :title="$t('messages.closeConversation')"
                @click="handleCloseConversation"
              >
                <svg
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  width="18"
                  height="18"
                  aria-hidden="true"
                >
                  <path
                    fill-rule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clip-rule="evenodd"
                  />
                </svg>
              </button>
            </header>

            <!-- Data sharing banner -->
            <div v-if="!isDataShared && !isConversationClosed" class="data-share-banner">
              <div class="data-share-banner__content">
                <svg
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  width="20"
                  height="20"
                  class="data-share-banner__icon"
                  aria-hidden="true"
                >
                  <path
                    fill-rule="evenodd"
                    d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                    clip-rule="evenodd"
                  />
                </svg>
                <span class="data-share-banner__text">
                  {{
                    hasAcceptedShare
                      ? $t('messages.waitingOtherPartyShare')
                      : $t('messages.dataShareNotice')
                  }}
                </span>
              </div>
              <button
                v-if="!hasAcceptedShare"
                class="data-share-banner__btn"
                @click="handleAcceptDataShare"
              >
                {{ $t('messages.shareData') }}
              </button>
            </div>

            <!-- Messages list -->
            <div class="messages-list">
              <div
                v-for="msg in messages"
                :key="msg.id"
                class="message-bubble-wrap"
                :class="{
                  'message-bubble-wrap--own': isOwnMessage(msg.sender_id),
                  'message-bubble-wrap--other': !isOwnMessage(msg.sender_id),
                  'message-bubble-wrap--system': msg.is_system,
                }"
              >
                <!-- System message -->
                <div v-if="msg.is_system" class="message-system">
                  {{ getDisplayContent(msg.content, true) }}
                </div>

                <!-- Regular message -->
                <div v-else class="message-bubble">
                  <p class="message-text">{{ getDisplayContent(msg.content, false) }}</p>
                  <span class="message-time">{{ formatMessageTime(msg.created_at) }}</span>
                </div>
              </div>

              <div ref="messagesEndRef" />
            </div>

            <!-- Input area -->
            <div v-if="!isConversationClosed" class="message-input-area">
              <textarea
                v-model="messageInput"
                class="message-input"
                :placeholder="$t('messages.inputPlaceholder')"
                rows="1"
                maxlength="5000"
                @keydown.enter.exact.prevent="handleSendMessage"
              />
              <button
                class="message-send-btn"
                :disabled="sending || !messageInput.trim()"
                @click="handleSendMessage"
              >
                <svg
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  width="20"
                  height="20"
                  aria-hidden="true"
                >
                  <path
                    d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"
                  />
                </svg>
                <span class="sr-only">{{ $t('messages.send') }}</span>
              </button>
            </div>

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

/* Header */
.messages-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  margin-bottom: var(--spacing-4);
}

.messages-header--desktop {
  display: none;
}

.page-title {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
}

.unread-global-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 24px;
  padding: 0 var(--spacing-2);
  background: var(--color-error);
  color: var(--color-white);
  border-radius: var(--border-radius-full);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
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

/* ---- Left panel: conversation list ---- */
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

/* Conversation item */
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

/* ---- Right panel: conversation detail ---- */
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

/* Empty detail */
.conv-detail-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-4);
  color: var(--text-auxiliary);
}

.conv-detail-empty__text {
  font-size: var(--font-size-sm);
  color: var(--text-auxiliary);
}

/* Conversation header */
.conv-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  padding: var(--spacing-3) var(--spacing-4);
  border-bottom: 1px solid var(--border-color-light);
  background: var(--bg-primary);
  min-height: 56px;
}

.conv-header__back {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-primary);
  flex-shrink: 0;
}

.conv-header__info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.conv-header__vehicle {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.conv-header__party {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
}

.conv-header__status {
  flex-shrink: 0;
  padding: 2px var(--spacing-2);
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
}

.conv-status--active {
  background: #d1fae5;
  color: #065f46;
}

.conv-status--shared {
  background: #dbeafe;
  color: #1e40af;
}

.conv-status--closed {
  background: var(--bg-tertiary);
  color: var(--text-auxiliary);
}

.conv-status--reported {
  background: #fee2e2;
  color: #991b1b;
}

.conv-header__close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-auxiliary);
  flex-shrink: 0;
  transition: color var(--transition-fast);
}

.conv-header__close-btn:hover {
  color: var(--color-error);
}

/* Data share banner */
.data-share-banner {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
  padding: var(--spacing-3) var(--spacing-4);
  background: #eff6ff;
  border-bottom: 1px solid #bfdbfe;
}

.data-share-banner__content {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-2);
}

.data-share-banner__icon {
  flex-shrink: 0;
  color: #3b82f6;
  margin-top: 1px;
}

.data-share-banner__text {
  font-size: var(--font-size-sm);
  color: #1e40af;
  line-height: var(--line-height-normal);
}

.data-share-banner__btn {
  align-self: flex-start;
  padding: var(--spacing-2) var(--spacing-4);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-white);
  background: var(--color-info);
  border: none;
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: background var(--transition-fast);
  min-height: 44px;
}

.data-share-banner__btn:hover {
  background: #2563eb;
}

/* Messages list */
.messages-list {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-4);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

.message-bubble-wrap {
  display: flex;
  max-width: 85%;
}

.message-bubble-wrap--own {
  align-self: flex-end;
}

.message-bubble-wrap--other {
  align-self: flex-start;
}

.message-bubble-wrap--system {
  align-self: center;
  max-width: 100%;
}

/* System message */
.message-system {
  padding: var(--spacing-2) var(--spacing-4);
  background: var(--bg-secondary);
  border-radius: var(--border-radius-full);
  font-size: var(--font-size-xs);
  color: var(--text-auxiliary);
  text-align: center;
  font-style: italic;
}

/* Message bubble */
.message-bubble {
  padding: var(--spacing-3) var(--spacing-4);
  border-radius: var(--border-radius-md);
  max-width: 100%;
  word-break: break-word;
}

.message-bubble-wrap--own .message-bubble {
  background: var(--color-primary);
  color: var(--text-on-dark-primary);
  border-bottom-right-radius: var(--border-radius-sm);
}

.message-bubble-wrap--other .message-bubble {
  background: var(--bg-secondary);
  color: var(--text-primary);
  border-bottom-left-radius: var(--border-radius-sm);
}

.message-text {
  font-size: var(--font-size-sm);
  line-height: var(--line-height-normal);
  margin-bottom: var(--spacing-1);
}

.message-time {
  display: block;
  font-size: 10px;
  text-align: right;
}

.message-bubble-wrap--own .message-time {
  color: var(--text-on-dark-auxiliary);
}

.message-bubble-wrap--other .message-time {
  color: var(--text-auxiliary);
}

/* Input area */
.message-input-area {
  display: flex;
  align-items: flex-end;
  gap: var(--spacing-2);
  padding: var(--spacing-3) var(--spacing-4);
  border-top: 1px solid var(--border-color-light);
  background: var(--bg-primary);
}

.message-input {
  flex: 1;
  resize: none;
  padding: var(--spacing-3) var(--spacing-4);
  font-size: var(--font-size-sm);
  border: 2px solid var(--border-color);
  border-radius: var(--border-radius-lg);
  background: var(--bg-primary);
  min-height: 44px;
  max-height: 120px;
  font-family: inherit;
  line-height: var(--line-height-normal);
}

.message-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(35, 66, 74, 0.1);
}

.message-send-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  background: var(--color-primary);
  color: var(--color-white);
  border: none;
  border-radius: var(--border-radius-full);
  cursor: pointer;
  flex-shrink: 0;
  transition: background var(--transition-fast);
}

.message-send-btn:hover {
  background: var(--color-primary-dark);
}

.message-send-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
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
  .messages-header--mobile {
    display: none;
  }

  .messages-header--desktop {
    display: flex;
  }

  .messages-layout {
    height: calc(100vh - 200px);
  }

  .conv-list-panel {
    width: 320px;
    display: flex !important;
  }

  .conv-list-panel--hidden-mobile {
    display: flex;
  }

  .conv-detail-panel {
    display: flex;
  }

  .conv-detail-panel--visible-mobile {
    width: auto;
  }

  .conv-header__back {
    display: none;
  }

  .page-title {
    font-size: var(--font-size-3xl);
  }

  .data-share-banner {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
}

/* ---- Desktop (1024px) ---- */
@media (min-width: 1024px) {
  .messages-container {
    padding: 0 var(--spacing-8);
  }

  .conv-list-panel {
    width: 360px;
  }

  .messages-layout {
    height: calc(100vh - 220px);
    min-height: 500px;
  }

  .message-bubble-wrap {
    max-width: 65%;
  }
}
</style>

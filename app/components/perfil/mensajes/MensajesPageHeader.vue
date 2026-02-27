<script setup lang="ts">
defineProps<{
  unreadCount: number
  mobileShowConversation: boolean
}>()
</script>

<template>
  <div v-if="!mobileShowConversation" class="messages-header messages-header--mobile">
    <h1 class="page-title">{{ $t('messages.pageTitle') }}</h1>
    <span v-if="unreadCount > 0" class="unread-global-badge">{{ unreadCount }}</span>
  </div>
  <div class="messages-header messages-header--desktop">
    <h1 class="page-title">{{ $t('messages.pageTitle') }}</h1>
    <span v-if="unreadCount > 0" class="unread-global-badge">{{ unreadCount }}</span>
  </div>
</template>

<style scoped>
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

@media (min-width: 768px) {
  .messages-header--mobile {
    display: none;
  }

  .messages-header--desktop {
    display: flex;
  }

  .page-title {
    font-size: var(--font-size-3xl);
  }
}
</style>

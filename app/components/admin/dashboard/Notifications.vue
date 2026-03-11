<template>
  <div>
    <!-- Notifications Grid -->
    <div class="notifications-grid">
      <NuxtLink
        to="/admin/anunciantes"
        class="notification-card"
        :class="{ 'has-pending': stats.anunciantesPending > 0 }"
      >
        <div class="notification-icon">&#x1F4E3;</div>
        <div class="notification-content">
          <span class="notification-label">{{ t('admin.notifications.anunciantesLabel') }}</span>
          <span class="notification-value">{{ stats.anunciantes }}</span>
        </div>
        <span v-if="stats.anunciantesPending > 0" class="notification-badge">{{
          stats.anunciantesPending
        }}</span>
      </NuxtLink>

      <NuxtLink
        to="/admin/solicitantes"
        class="notification-card"
        :class="{ 'has-pending': stats.solicitantesPending > 0 }"
      >
        <div class="notification-icon">&#x1F50D;</div>
        <div class="notification-content">
          <span class="notification-label">{{ t('admin.notifications.solicitantesLabel') }}</span>
          <span class="notification-value">{{ stats.solicitantes }}</span>
        </div>
        <span v-if="stats.solicitantesPending > 0" class="notification-badge">{{
          stats.solicitantesPending
        }}</span>
      </NuxtLink>

      <NuxtLink
        to="/admin/comentarios"
        class="notification-card"
        :class="{ 'has-pending': stats.comentariosPending > 0 }"
      >
        <div class="notification-icon">&#x1F4AC;</div>
        <div class="notification-content">
          <span class="notification-label">{{ t('admin.notifications.comentariosLabel') }}</span>
          <span class="notification-value">{{ stats.comentarios }}</span>
        </div>
        <span v-if="stats.comentariosPending > 0" class="notification-badge">{{
          stats.comentariosPending
        }}</span>
      </NuxtLink>

      <NuxtLink
        to="/admin/chats"
        class="notification-card"
        :class="{ 'has-pending': stats.chatsUnread > 0 }"
      >
        <div class="notification-icon">&#x1F4F1;</div>
        <div class="notification-content">
          <span class="notification-label">{{ t('admin.notifications.chatsLabel') }}</span>
          <span class="notification-value">{{ stats.chats }}</span>
        </div>
        <span v-if="stats.chatsUnread > 0" class="notification-badge">{{ stats.chatsUnread }}</span>
      </NuxtLink>

      <NuxtLink
        to="/admin/suscripciones"
        class="notification-card"
        :class="{ 'has-pending': stats.suscripcionesPending > 0 }"
      >
        <div class="notification-icon">&#x1F4E7;</div>
        <div class="notification-content">
          <span class="notification-label">{{ t('admin.notifications.suscripcionesLabel') }}</span>
          <span class="notification-value">{{ stats.suscripciones }}</span>
        </div>
        <span v-if="stats.suscripcionesPending > 0" class="notification-badge">{{
          stats.suscripcionesPending
        }}</span>
      </NuxtLink>
    </div>

    <!-- Pendientes y Coincidencias -->
    <div class="two-columns">
      <!-- Pendientes -->
      <div class="dashboard-section">
        <h2 class="section-title">
          <span class="title-icon">&#x23F3;</span>
          {{ t('admin.notifications.pendingTitle') }}
        </h2>
        <div class="pending-list">
          <NuxtLink
            v-if="stats.anunciantesPending > 0"
            to="/admin/anunciantes"
            class="pending-item"
          >
            <span class="pending-icon">&#x1F4E3;</span>
            <span class="pending-text"
              >{{ stats.anunciantesPending }} anunciante{{
                stats.anunciantesPending !== 1 ? 's' : ''
              }}
              por revisar</span
            >
            <span class="pending-arrow">&rarr;</span>
          </NuxtLink>
          <NuxtLink
            v-if="stats.solicitantesPending > 0"
            to="/admin/solicitantes"
            class="pending-item"
          >
            <span class="pending-icon">&#x1F50D;</span>
            <span class="pending-text"
              >{{ stats.solicitantesPending }} solicitante{{
                stats.solicitantesPending !== 1 ? 's' : ''
              }}
              por revisar</span
            >
            <span class="pending-arrow">&rarr;</span>
          </NuxtLink>
          <NuxtLink
            v-if="stats.comentariosPending > 0"
            to="/admin/comentarios"
            class="pending-item"
          >
            <span class="pending-icon">&#x1F4AC;</span>
            <span class="pending-text"
              >{{ stats.comentariosPending }} comentario{{
                stats.comentariosPending !== 1 ? 's' : ''
              }}
              por moderar</span
            >
            <span class="pending-arrow">&rarr;</span>
          </NuxtLink>
          <NuxtLink v-if="stats.chatsUnread > 0" to="/admin/chats" class="pending-item">
            <span class="pending-icon">&#x1F4F1;</span>
            <span class="pending-text"
              >{{ stats.chatsUnread }} mensaje{{ stats.chatsUnread !== 1 ? 's' : '' }} sin
              leer</span
            >
            <span class="pending-arrow">&rarr;</span>
          </NuxtLink>
          <div v-if="totalPending === 0" class="pending-empty">
            <span class="empty-icon">&#x2713;</span>
            <span>{{ t('admin.notifications.allUpToDate') }}</span>
          </div>
        </div>
      </div>

      <!-- Coincidencias -->
      <div class="dashboard-section">
        <h2 class="section-title">
          <span class="title-icon">&#x1F517;</span>
          {{ t('admin.notifications.matchesTitle') }}
        </h2>
        <div class="matches-list">
          <div v-for="match in matches" :key="match.id" class="match-item">
            <div class="match-info">
              <span class="match-type" :class="match.type">{{ match.typeLabel }}</span>
              <span class="match-text">{{ match.description }}</span>
            </div>
            <NuxtLink :to="match.link" class="match-action">Ver &rarr;</NuxtLink>
          </div>
          <div v-if="matches.length === 0" class="matches-empty">
            <span class="empty-icon">&#x1F4ED;</span>
            <span>{{ t('admin.notifications.noMatches') }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { NotificationStats, MatchItem } from '~/composables/admin/useAdminDashboard'
const { t } = useI18n()

defineProps<{
  stats: NotificationStats
  totalPending: number
  matches: readonly MatchItem[]
}>()
</script>

<style scoped>
/* Notifications Grid */
.notifications-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-3);
  margin-bottom: var(--spacing-8);
}

(@media ()min-width: 37.5em())) {
  .notifications-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

(@media ()min-width: 56.25em())) {
  .notifications-grid {
    grid-template-columns: repeat(5, 1fr);
  }
}

.notification-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  padding: var(--spacing-4);
  background: var(--bg-primary);
  border-radius: var(--border-radius-md);
  border: 1px solid var(--border-color);
  text-decoration: none;
  transition: all var(--transition-fast);
}

.notification-card:hover {
  box-shadow: var(--shadow-md);
  border-color: var(--color-primary);
}

.notification-card.has-pending {
  background: linear-gradient(135deg, var(--color-error-bg) 0%, var(--color-red-50) 100%);
  border-color: var(--color-error-border);
}

.notification-card.has-pending:hover {
  border-color: var(--color-error-soft);
}

.notification-icon {
  font-size: var(--font-size-2xl);
  flex-shrink: 0;
}

.notification-content {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.notification-label {
  font-size: var(--font-size-sm);
  color: var(--text-auxiliary);
}

.notification-value {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
}

.notification-badge {
  position: absolute;
  top: -0.375rem;
  right: -0.375rem;
  min-width: 1.375rem;
  height: 1.375rem;
  padding: 0 0.375rem;
  background: var(--color-error);
  color: white;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  border-radius: var(--border-radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Two columns layout */
.two-columns {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-4);
  margin-bottom: var(--spacing-6);
}

@media (min-width: 48em) {
  .two-columns {
    grid-template-columns: repeat(2, 1fr);
  }
}

.two-columns .dashboard-section {
  margin-bottom: 0;
}

/* Dashboard sections */
.dashboard-section {
  margin-bottom: var(--spacing-6);
}

.section-title {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin-bottom: var(--spacing-4);
}

.title-icon {
  font-size: var(--font-size-xl);
}

/* Pending list */
.pending-list {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-lg);
  overflow: hidden;
}

.pending-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  padding: var(--spacing-3) var(--spacing-4);
  text-decoration: none;
  color: var(--text-primary);
  border-bottom: 1px solid var(--border-color);
  transition: background var(--transition-fast);
}

.pending-item:last-child {
  border-bottom: none;
}

.pending-item:hover {
  background: var(--bg-secondary);
}

.pending-icon {
  font-size: var(--font-size-lg);
  flex-shrink: 0;
}

.pending-text {
  flex: 1;
  font-size: var(--font-size-sm);
}

.pending-arrow {
  color: var(--text-auxiliary);
  font-size: var(--font-size-sm);
}

.pending-empty,
.matches-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-2);
  padding: var(--spacing-6);
  color: var(--text-auxiliary);
  font-size: var(--font-size-sm);
}

.empty-icon {
  font-size: var(--font-size-xl);
}

/* Matches list */
.matches-list {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-lg);
  overflow: hidden;
}

.match-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-3);
  padding: var(--spacing-3) var(--spacing-4);
  border-bottom: 1px solid var(--border-color);
}

.match-item:last-child {
  border-bottom: none;
}

.match-info {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
  min-width: 0;
}

.match-type {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  text-transform: uppercase;
  letter-spacing: 0.03125rem;
}

.match-type.demand {
  color: var(--color-violet-500);
}

.match-type.vehicle {
  color: var(--color-success);
}

.match-text {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.match-action {
  color: var(--color-primary);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  text-decoration: none;
  white-space: nowrap;
}

.match-action:hover {
  text-decoration: underline;
}
</style>

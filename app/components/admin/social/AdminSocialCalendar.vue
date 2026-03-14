<script setup lang="ts">
import { useAdminSocialCalendar } from '~/composables/admin/useAdminSocialCalendar'

const { t } = useI18n()

const {
  view,
  loading,
  error,
  selectedPost,
  draggedPostId,
  dragOverDate,
  visibleDays,
  periodLabel,
  WEEK_DAYS_SHORT,
  fetchCalendar,
  goToToday,
  goBack,
  goForward,
  switchView,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
  openPost,
  closePost,
  getPostsForDay,
  isToday,
  isCurrentMonth,
  getPlatformColor,
  getStatusColor,
  getPlatformIcon,
  formatPostTime,
  toLocalDateStr,
  reschedulingId,
} = useAdminSocialCalendar()

onMounted(fetchCalendar)

function handleDragOver(dateStr: string, e: DragEvent) {
  onDragOver(dateStr, e)
}
</script>

<template>
  <div class="cal-root">
    <!-- Toolbar -->
    <div class="cal-toolbar">
      <div class="cal-nav">
        <button class="cal-btn cal-btn-today" @click="goToToday">
          {{ t('admin.social.calendar.today') }}
        </button>
        <button
          class="cal-btn cal-btn-icon"
          :aria-label="t('admin.social.calendar.prev')"
          @click="goBack"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <button
          class="cal-btn cal-btn-icon"
          :aria-label="t('admin.social.calendar.next')"
          @click="goForward"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
        <span class="cal-period-label">{{ periodLabel }}</span>
      </div>

      <div class="cal-view-switcher">
        <button
          class="cal-btn"
          :class="{ 'cal-btn-active': view === 'week' }"
          @click="switchView('week')"
        >
          {{ t('admin.social.calendar.weekView') }}
        </button>
        <button
          class="cal-btn"
          :class="{ 'cal-btn-active': view === 'month' }"
          @click="switchView('month')"
        >
          {{ t('admin.social.calendar.monthView') }}
        </button>
      </div>
    </div>

    <!-- Error -->
    <div v-if="error" class="cal-error" role="alert">{{ error }}</div>

    <!-- Loading -->
    <div v-if="loading" class="cal-loading" role="status">
      <span class="cal-spinner" aria-hidden="true" />
      {{ t('admin.social.calendar.loading') }}
    </div>

    <!-- Calendar grid -->
    <div v-else class="cal-grid-wrapper" :class="`cal-grid-${view}`">
      <!-- Day headers -->
      <div class="cal-day-headers">
        <div
          v-for="(day, i) in view === 'week' ? WEEK_DAYS_SHORT : WEEK_DAYS_SHORT"
          :key="i"
          class="cal-day-header"
        >
          {{ WEEK_DAYS_SHORT[i] }}
        </div>
      </div>

      <!-- Grid cells -->
      <div class="cal-grid-body">
        <div
          v-for="day in visibleDays"
          :key="toLocalDateStr(day)"
          class="cal-day-cell"
          :class="{
            'cal-day-today': isToday(day),
            'cal-day-other-month': view === 'month' && !isCurrentMonth(day),
            'cal-day-drag-over': dragOverDate === toLocalDateStr(day),
          }"
          @dragover="handleDragOver(toLocalDateStr(day), $event)"
          @dragleave="onDragLeave"
          @drop.prevent="onDrop(toLocalDateStr(day))"
        >
          <div class="cal-day-number">{{ day.getDate() }}</div>

          <!-- Posts chips -->
          <div class="cal-day-posts">
            <button
              v-for="post in getPostsForDay(toLocalDateStr(day))"
              :key="post.id"
              class="cal-post-chip"
              :class="{
                'cal-post-chip-dragging': draggedPostId === post.id,
                'cal-post-chip-rescheduling': reschedulingId === post.id,
                'cal-post-chip-undraggable': post.status === 'posted' || post.status === 'failed',
              }"
              :draggable="post.status !== 'posted' && post.status !== 'failed'"
              :style="`border-left: 3px solid ${getPlatformColor(post.platform)}`"
              :title="`${post.platform} · ${post.status} · ${formatPostTime(post)}`"
              @click="openPost(post)"
              @dragstart="onDragStart(post)"
              @dragend="onDragEnd"
            >
              <span
                class="cal-platform-badge"
                :style="`background:${getPlatformColor(post.platform)}`"
              >
                {{ getPlatformIcon(post.platform) }}
              </span>
              <span class="cal-chip-time">{{ formatPostTime(post) }}</span>
              <span
                class="cal-status-dot"
                :style="`background:${getStatusColor(post.status)}`"
                :title="post.status"
              />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Post detail drawer -->
    <Transition name="cal-drawer">
      <div v-if="selectedPost" class="cal-drawer-overlay" @click.self="closePost">
        <div class="cal-drawer" role="dialog" :aria-label="t('admin.social.calendar.postDetail')">
          <button class="cal-drawer-close" :aria-label="t('common.close')" @click="closePost">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          <h3 class="cal-drawer-title">
            <span
              class="cal-platform-badge cal-platform-badge-lg"
              :style="`background:${getPlatformColor(selectedPost.platform)}`"
            >
              {{ getPlatformIcon(selectedPost.platform) }}
            </span>
            {{ selectedPost.platform.charAt(0).toUpperCase() + selectedPost.platform.slice(1) }}
          </h3>

          <div class="cal-drawer-meta">
            <span
              class="cal-status-pill"
              :style="`background:${getStatusColor(selectedPost.status)}22; color:${getStatusColor(selectedPost.status)}`"
            >
              {{ selectedPost.status }}
            </span>
            <span v-if="selectedPost.scheduled_at" class="cal-drawer-date">
              {{ new Date(selectedPost.scheduled_at).toLocaleString() }}
            </span>
          </div>

          <div v-if="selectedPost.vehicle" class="cal-drawer-vehicle">
            <strong>{{ selectedPost.vehicle.brand }} {{ selectedPost.vehicle.model }}</strong>
            <span v-if="selectedPost.vehicle.year"> ({{ selectedPost.vehicle.year }})</span>
          </div>

          <div v-if="selectedPost.image_url" class="cal-drawer-image">
            <img :src="selectedPost.image_url" alt="" loading="lazy" >
          </div>

          <div class="cal-drawer-content">
            <p>
              {{
                selectedPost.content?.es ||
                selectedPost.content?.en ||
                t('admin.social.calendar.noContent')
              }}
            </p>
          </div>

          <div v-if="selectedPost.status === 'posted'" class="cal-drawer-stats">
            <div class="cal-stat">
              <span class="cal-stat-label">{{ t('admin.social.calendar.impressions') }}</span>
              <span class="cal-stat-value">{{ selectedPost.impressions.toLocaleString() }}</span>
            </div>
            <div class="cal-stat">
              <span class="cal-stat-label">{{ t('admin.social.calendar.clicks') }}</span>
              <span class="cal-stat-value">{{ selectedPost.clicks.toLocaleString() }}</span>
            </div>
          </div>

          <div v-if="selectedPost.external_post_id" class="cal-drawer-ext">
            <small
              >{{ t('admin.social.calendar.externalId') }}:
              {{ selectedPost.external_post_id }}</small
            >
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
/* ── Root ────────────────────────────────────────────────────────────────── */
.cal-root {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 400px;
}

/* ── Toolbar ─────────────────────────────────────────────────────────────── */
.cal-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  justify-content: space-between;
}

.cal-nav {
  display: flex;
  align-items: center;
  gap: 4px;
}

.cal-period-label {
  font-size: 0.95rem;
  font-weight: 600;
  margin-left: 8px;
  white-space: nowrap;
}

.cal-view-switcher {
  display: flex;
  gap: 4px;
}

.cal-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 6px 12px;
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 6px;
  background: var(--bg-surface, #fff);
  color: var(--text-primary, #111827);
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  min-height: 34px;
  transition: background 0.15s;
}

.cal-btn:hover {
  background: var(--bg-hover, #f3f4f6);
}
.cal-btn:focus-visible {
  outline: 2px solid var(--color-primary, #23424a);
  outline-offset: 2px;
}

.cal-btn-active {
  background: var(--color-primary, #23424a);
  border-color: var(--color-primary, #23424a);
  color: #fff;
}

.cal-btn-icon {
  padding: 6px;
  min-width: 34px;
}
.cal-btn-today {
  font-weight: 600;
}

/* ── Grid ────────────────────────────────────────────────────────────────── */
.cal-grid-wrapper {
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 8px;
  overflow: hidden;
}

.cal-day-headers {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  background: var(--bg-section, #f9fafb);
  border-bottom: 1px solid var(--border-color, #e5e7eb);
}

.cal-day-header {
  padding: 8px 4px;
  font-size: 0.75rem;
  font-weight: 600;
  text-align: center;
  color: var(--text-secondary, #6b7280);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.cal-grid-body {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
}

/* Week view: fixed row height */
.cal-grid-week .cal-grid-body {
  min-height: 340px;
}

.cal-grid-week .cal-day-cell {
  min-height: 340px;
  border-right: 1px solid var(--border-color, #e5e7eb);
}

/* Month view: smaller rows */
.cal-grid-month .cal-day-cell {
  min-height: 100px;
  border-right: 1px solid var(--border-color, #e5e7eb);
  border-bottom: 1px solid var(--border-color, #e5e7eb);
}

.cal-day-cell:last-child {
  border-right: none;
}

.cal-day-cell {
  padding: 6px 4px;
  background: var(--bg-surface, #fff);
  position: relative;
  transition: background 0.1s;
}

.cal-day-cell:nth-child(7n) {
  border-right: none;
}

.cal-day-today {
  background: var(--color-primary-ultralight, #e8f0f2);
}

.cal-day-other-month {
  background: var(--bg-muted, #fafafa);
}

.cal-day-other-month .cal-day-number {
  opacity: 0.35;
}

.cal-day-drag-over {
  background: var(--color-primary-light, #d4e4e8) !important;
  outline: 2px dashed var(--color-primary, #23424a);
  outline-offset: -2px;
}

.cal-day-number {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--text-secondary, #6b7280);
  margin-bottom: 4px;
  min-height: 20px;
}

.cal-day-today .cal-day-number {
  color: var(--color-primary, #23424a);
  background: var(--color-primary, #23424a);
  color: #fff;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* ── Post chips ──────────────────────────────────────────────────────────── */
.cal-day-posts {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.cal-post-chip {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 3px 6px;
  border-radius: 4px;
  background: var(--bg-surface, #fff);
  border: 1px solid var(--border-color, #e5e7eb);
  font-size: 0.7rem;
  cursor: grab;
  text-align: left;
  width: 100%;
  transition:
    opacity 0.15s,
    box-shadow 0.15s;
  min-height: 28px;
}

.cal-post-chip:hover {
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
}

.cal-post-chip:focus-visible {
  outline: 2px solid var(--color-primary, #23424a);
}

.cal-post-chip-dragging {
  opacity: 0.4;
  cursor: grabbing;
}

.cal-post-chip-rescheduling {
  opacity: 0.6;
  pointer-events: none;
}

.cal-post-chip-undraggable {
  cursor: pointer;
}

.cal-platform-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 3px;
  color: #fff;
  font-size: 0.6rem;
  font-weight: 700;
  flex-shrink: 0;
}

.cal-platform-badge-lg {
  width: 24px;
  height: 24px;
  border-radius: 5px;
  font-size: 0.85rem;
}

.cal-chip-time {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--text-secondary, #6b7280);
}

.cal-status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

/* ── Status pill ─────────────────────────────────────────────────────────── */
.cal-status-pill {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: capitalize;
}

/* ── Loading / Error ─────────────────────────────────────────────────────── */
.cal-loading {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 24px;
  color: var(--text-secondary, #6b7280);
  font-size: 0.875rem;
}

.cal-spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid var(--border-color, #e5e7eb);
  border-top-color: var(--color-primary, #23424a);
  border-radius: 50%;
  animation: cal-spin 0.6s linear infinite;
}

@keyframes cal-spin {
  to {
    transform: rotate(360deg);
  }
}

.cal-error {
  padding: 12px 16px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 6px;
  color: #dc2626;
  font-size: 0.875rem;
}

/* ── Drawer ──────────────────────────────────────────────────────────────── */
.cal-drawer-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 1000;
  display: flex;
  align-items: stretch;
  justify-content: flex-end;
}

.cal-drawer {
  width: min(400px, 100vw);
  background: var(--bg-surface, #fff);
  padding: 24px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: relative;
}

.cal-drawer-close {
  position: absolute;
  top: 16px;
  right: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 50%;
  background: transparent;
  cursor: pointer;
  color: var(--text-secondary, #6b7280);
}

.cal-drawer-close:hover {
  background: var(--bg-hover, #f3f4f6);
}

.cal-drawer-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 1.1rem;
  font-weight: 700;
  margin-right: 40px;
}

.cal-drawer-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.cal-drawer-date {
  font-size: 0.8125rem;
  color: var(--text-secondary, #6b7280);
}

.cal-drawer-vehicle {
  padding: 8px 12px;
  background: var(--bg-section, #f9fafb);
  border-radius: 6px;
  font-size: 0.875rem;
}

.cal-drawer-image img {
  width: 100%;
  max-height: 200px;
  object-fit: cover;
  border-radius: 6px;
}

.cal-drawer-content p {
  font-size: 0.875rem;
  line-height: 1.6;
  color: var(--text-primary, #111827);
  white-space: pre-wrap;
}

.cal-drawer-stats {
  display: flex;
  gap: 24px;
}

.cal-stat {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.cal-stat-label {
  font-size: 0.75rem;
  color: var(--text-secondary, #6b7280);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.cal-stat-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary, #111827);
}

.cal-drawer-ext {
  color: var(--text-muted, #9ca3af);
  font-size: 0.75rem;
}

/* ── Drawer animation ────────────────────────────────────────────────────── */
.cal-drawer-enter-active,
.cal-drawer-leave-active {
  transition: opacity 0.2s;
}

.cal-drawer-enter-active .cal-drawer,
.cal-drawer-leave-active .cal-drawer {
  transition: transform 0.25s ease;
}

.cal-drawer-enter-from,
.cal-drawer-leave-to {
  opacity: 0;
}

.cal-drawer-enter-from .cal-drawer {
  transform: translateX(100%);
}

.cal-drawer-leave-to .cal-drawer {
  transform: translateX(100%);
}

/* ── Responsive ──────────────────────────────────────────────────────────── */
@media (max-width: 640px) {
  .cal-grid-week .cal-day-cell,
  .cal-grid-month .cal-day-cell {
    min-height: 70px;
  }

  .cal-chip-time {
    display: none;
  }
  .cal-period-label {
    font-size: 0.8125rem;
  }

  .cal-drawer {
    width: 100vw;
  }
}
</style>

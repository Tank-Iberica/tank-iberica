<script setup lang="ts">
import { useAdminEditorialCalendar } from '~/composables/admin/useAdminEditorialCalendar'
import type { CalendarEvent } from '~/composables/admin/useAdminEditorialCalendar'

const { view, referenceDate, calendarDays, loading, prev, next, goToday, eventsForDay } =
  useAdminEditorialCalendar()

const { t } = useI18n()

// ── Labels ───────────────────────────────────────────────────────────────────

const WEEKDAY_LABELS_ES = ['L', 'M', 'X', 'J', 'V', 'S', 'D']
const WEEKDAY_LABELS_FULL_ES = [
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
  'Domingo',
]

const rangeLabel = computed(() => {
  const { from, to } = (() => {
    const d = calendarDays.value
    return { from: d[0], to: d[d.length - 1] }
  })()
  if (!from || !to) return ''
  if (view.value === 'week') {
    return `${from.getDate()} ${monthName(from)} – ${to.getDate()} ${monthName(to)} ${to.getFullYear()}`
  }
  return `${monthName(referenceDate.value)} ${referenceDate.value.getFullYear()}`
})

function monthName(d: Date): string {
  return d.toLocaleDateString('es-ES', { month: 'long' })
}

function isToday(d: Date): boolean {
  const now = new Date()
  return (
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear()
  )
}

function isPast(d: Date): boolean {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return d < now
}

// ── Type styling ─────────────────────────────────────────────────────────────

function eventClass(ev: CalendarEvent): string {
  return `ev ev--${ev.type}`
}

function typeLabel(ev: CalendarEvent): string {
  if (ev.type === 'article') return 'Art.'
  if (ev.type === 'vehicle') return 'Veh.'
  return 'Soc.'
}
</script>

<template>
  <div class="editorial-calendar">
    <!-- Toolbar -->
    <div class="cal-toolbar">
      <div class="cal-nav">
        <button class="btn-nav" :aria-label="t('admin.editorial.prevPeriod')" @click="prev">
          ‹
        </button>
        <button class="btn-today" @click="goToday">Hoy</button>
        <button class="btn-nav" :aria-label="t('admin.editorial.nextPeriod')" @click="next">
          ›
        </button>
      </div>
      <span class="cal-range-label">{{ rangeLabel }}</span>
      <div class="view-toggle">
        <button
          :class="['btn-view', { 'btn-view--active': view === 'week' }]"
          @click="view = 'week'"
        >
          Semana
        </button>
        <button
          :class="['btn-view', { 'btn-view--active': view === 'month' }]"
          @click="view = 'month'"
        >
          Mes
        </button>
      </div>
    </div>

    <!-- Legend -->
    <div class="cal-legend">
      <span class="legend-item"><span class="legend-dot legend-dot--article" />Artículos</span>
      <span class="legend-item"><span class="legend-dot legend-dot--vehicle" />Vehículos</span>
      <span class="legend-item"><span class="legend-dot legend-dot--social" />Social</span>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="cal-loading">Cargando calendario…</div>

    <!-- Week header + grid -->
    <template v-else>
      <div class="cal-weekheader">
        <span v-for="(label, i) in WEEKDAY_LABELS_FULL_ES" :key="i" class="cal-weekday-label">
          <span class="weekday-full">{{ label }}</span>
          <span class="weekday-short">{{ WEEKDAY_LABELS_ES[i] }}</span>
        </span>
      </div>

      <div class="cal-grid" :class="`cal-grid--${view}`">
        <div
          v-for="day in calendarDays"
          :key="day.toISOString()"
          class="cal-day"
          :class="{
            'cal-day--today': isToday(day),
            'cal-day--past': isPast(day),
            'cal-day--weekend': day.getDay() === 0 || day.getDay() === 6,
          }"
        >
          <div class="day-number">{{ day.getDate() }}</div>
          <div class="day-events">
            <NuxtLink
              v-for="ev in eventsForDay(day)"
              :key="ev.id"
              :to="ev.url ?? '#'"
              :class="eventClass(ev)"
              :title="ev.title"
            >
              <span class="ev-type">{{ typeLabel(ev) }}</span>
              <span class="ev-title">{{ ev.title }}</span>
            </NuxtLink>
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <p v-if="calendarDays.every((d) => eventsForDay(d).length === 0)" class="cal-empty">
        No hay publicaciones programadas en este período.
        <NuxtLink to="/admin/noticias/nuevo">Crear artículo →</NuxtLink>
      </p>
    </template>
  </div>
</template>

<style scoped>
.editorial-calendar {
  margin-top: var(--spacing-2);
}

/* ── Toolbar ── */
.cal-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--spacing-3);
  margin-bottom: var(--spacing-4);
}

.cal-nav {
  display: flex;
  align-items: center;
  gap: var(--spacing-1);
}

.btn-nav {
  width: 2rem;
  height: 2rem;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  background: var(--bg-primary);
  cursor: pointer;
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-gray-700);
  transition: all 0.15s;
}

.btn-nav:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.btn-today {
  padding: 0 var(--spacing-3);
  height: 2rem;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  background: var(--bg-primary);
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--color-gray-700);
  transition: all 0.15s;
}

.btn-today:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.cal-range-label {
  flex: 1;
  font-weight: 600;
  font-size: 0.95rem;
  color: var(--color-gray-800);
  text-align: center;
}

.view-toggle {
  display: flex;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  overflow: hidden;
}

.btn-view {
  padding: 0 var(--spacing-3);
  height: 2rem;
  border: none;
  background: var(--bg-primary);
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--color-gray-600);
  transition: all 0.15s;
}

.btn-view--active {
  background: var(--color-primary);
  color: white;
}

/* ── Legend ── */
.cal-legend {
  display: flex;
  gap: var(--spacing-4);
  margin-bottom: var(--spacing-3);
  flex-wrap: wrap;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-1);
  font-size: 0.8rem;
  color: var(--color-gray-600);
}

.legend-dot {
  width: 0.6rem;
  height: 0.6rem;
  border-radius: 50%;
  flex-shrink: 0;
}

.legend-dot--article {
  background: #3b82f6;
}

.legend-dot--vehicle {
  background: #22c55e;
}

.legend-dot--social {
  background: #f97316;
}

/* ── Loading ── */
.cal-loading {
  text-align: center;
  padding: var(--spacing-8);
  color: var(--color-gray-500);
  font-size: 0.9rem;
}

/* ── Week header ── */
.cal-weekheader {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  border-bottom: 1px solid var(--border-color-light);
  margin-bottom: var(--spacing-1);
}

.cal-weekday-label {
  padding: var(--spacing-2) var(--spacing-1);
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-gray-500);
  text-transform: uppercase;
  text-align: center;
}

.weekday-full {
  display: none;
}

/* ── Grid ── */
.cal-grid {
  display: grid;
  gap: 1px;
  background: var(--border-color-light);
  border: 1px solid var(--border-color-light);
  border-radius: var(--border-radius);
  overflow: hidden;
}

.cal-grid--week {
  grid-template-columns: repeat(7, 1fr);
  min-height: 10rem;
}

.cal-grid--month {
  grid-template-columns: repeat(7, 1fr);
}

.cal-day {
  background: var(--bg-primary);
  padding: var(--spacing-2) var(--spacing-1);
  min-height: 5rem;
}

.cal-day--past {
  background: var(--bg-secondary);
}

.cal-day--weekend {
  background: color-mix(in srgb, var(--bg-secondary) 80%, transparent);
}

.cal-day--today .day-number {
  background: var(--color-primary);
  color: white;
  border-radius: 50%;
  width: 1.5rem;
  height: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.day-number {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-gray-700);
  margin-bottom: var(--spacing-1);
  width: 1.5rem;
  height: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cal-day--past .day-number {
  color: var(--color-gray-400);
}

.day-events {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

/* ── Events ── */
.ev {
  display: flex;
  align-items: center;
  gap: 3px;
  padding: 2px 4px;
  border-radius: 3px;
  text-decoration: none;
  font-size: 0.7rem;
  font-weight: 500;
  overflow: hidden;
  cursor: pointer;
  transition: opacity 0.15s;
}

.ev:hover {
  opacity: 0.8;
}

.ev--article {
  background: #dbeafe;
  color: #1d4ed8;
}

.ev--vehicle {
  background: #dcfce7;
  color: #15803d;
}

.ev--social {
  background: #ffedd5;
  color: #c2410c;
}

.ev-type {
  font-size: 0.65rem;
  font-weight: 700;
  flex-shrink: 0;
}

.ev-title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ── Empty state ── */
.cal-empty {
  text-align: center;
  padding: var(--spacing-6);
  color: var(--color-gray-500);
  font-size: 0.85rem;
}

.cal-empty a {
  color: var(--color-primary);
  text-decoration: none;
  font-weight: 500;
}

.cal-empty a:hover {
  text-decoration: underline;
}

/* ── Responsive ── */
@media (min-width: 48em) {
  .weekday-full {
    display: inline;
  }

  .weekday-short {
    display: none;
  }

  .cal-weekday-label {
    font-size: 0.8rem;
  }

  .cal-grid--week {
    min-height: 14rem;
  }

  .cal-day {
    min-height: 7rem;
    padding: var(--spacing-2);
  }

  .ev {
    font-size: 0.75rem;
    padding: 3px 6px;
  }
}
</style>

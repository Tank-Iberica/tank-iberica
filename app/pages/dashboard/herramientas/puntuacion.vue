<script setup lang="ts">
import { useDealerTrustScore } from '~/composables/useDealerTrustScore'
import type { TrustScoreBreakdown } from '~~/server/utils/trustScore'

definePageMeta({
  layout: 'default',
  middleware: ['auth', 'dealer'],
})

const { t } = useI18n()
const user = useSupabaseUser()
const supabase = useSupabaseClient()

// Fetch dealerId for the logged-in user
const dealerId = ref<string | null>(null)

onMounted(async () => {
  if (!user.value?.id) return
  const { data } = await supabase.from('dealers').select('id').eq('user_id', user.value.id).single()
  if (data) dealerId.value = (data as { id: string }).id
})

const {
  score,
  breakdown,
  badge,
  progressPct,
  pointsToNextTier,
  nextTier,
  loading,
  error,
  fetchTrustScore,
} = useDealerTrustScore(dealerId)

// Criteria config: max points + action link
interface CriterionConfig {
  key: keyof TrustScoreBreakdown
  maxPts: number
  actionPath: string
}

const CRITERIA: CriterionConfig[] = [
  { key: 'has_logo', maxPts: 5, actionPath: '/dashboard/herramientas#logo' },
  { key: 'has_bio', maxPts: 5, actionPath: '/dashboard/herramientas#bio' },
  { key: 'has_contact', maxPts: 5, actionPath: '/dashboard/herramientas#contacto' },
  { key: 'has_legal', maxPts: 5, actionPath: '/dashboard/herramientas#legal' },
  { key: 'account_age', maxPts: 15, actionPath: '' },
  { key: 'listing_activity', maxPts: 15, actionPath: '/dashboard/vehiculos/nuevo' },
  { key: 'responsiveness', maxPts: 15, actionPath: '/dashboard/leads' },
  { key: 'reviews', maxPts: 20, actionPath: '' },
  { key: 'verified_docs', maxPts: 15, actionPath: '/admin/verificaciones' },
]

const criteriaRows = computed(() => {
  const bd = breakdown.value
  return CRITERIA.map((c) => ({
    ...c,
    pts: bd ? (bd[c.key] ?? 0) : 0,
    done: bd ? (bd[c.key] ?? 0) >= c.maxPts : false,
  }))
})

const pending = computed(() => criteriaRows.value.filter((r) => !r.done))
const done = computed(() => criteriaRows.value.filter((r) => r.done))
</script>

<template>
  <div class="puntuacion-page">
    <header class="page-header">
      <div>
        <h1>{{ t('dashboard.trustScore.title', 'Puntuación de confianza') }}</h1>
        <p class="subtitle">
          {{
            t(
              'dashboard.trustScore.subtitle',
              'Mejora tu perfil para conseguir el badge Top y generar más confianza',
            )
          }}
        </p>
      </div>
      <NuxtLink to="/dashboard/herramientas" class="btn-back">
        ← {{ t('common.back', 'Volver') }}
      </NuxtLink>
    </header>

    <!-- Loading -->
    <div v-if="loading" class="loading-placeholder">
      {{ t('common.loading', 'Cargando...') }}
    </div>

    <!-- Error -->
    <div v-else-if="error" class="error-msg">
      {{ error }}
    </div>

    <!-- Score overview -->
    <template v-else>
      <!-- Score card -->
      <div class="score-card">
        <div class="score-display">
          <span class="score-number">{{ score }}</span>
          <span class="score-max">/ 100</span>
        </div>

        <div class="score-badge-row">
          <SharedDealerTrustBadge :tier="badge" />
          <span v-if="!badge" class="no-badge-label">
            {{ t('trust.noBadgeYet', 'Sin badge — consigue 60+ puntos para Verificado') }}
          </span>
        </div>

        <!-- Progress bar to next tier -->
        <div v-if="nextTier" class="progress-section">
          <div class="progress-label">
            <span
              >{{ t('trust.progressTo', 'Progreso hacia') }}
              {{
                nextTier === 'top'
                  ? t('trust.badgeTop', 'Top')
                  : t('trust.badgeVerified', 'Verificado')
              }}</span
            >
            <span>{{ progressPct }}%</span>
          </div>
          <div class="progress-bar-bg">
            <div class="progress-bar-fill" :style="{ width: `${progressPct}%` }" />
          </div>
          <p class="points-needed">
            {{ t('trust.pointsNeeded', { pts: pointsToNextTier }) }}
          </p>
        </div>

        <div v-else class="top-reached">
          🏆 {{ t('trust.topReached', '¡Máxima puntuación alcanzada!') }}
        </div>
      </div>

      <!-- Pending criteria -->
      <section v-if="pending.length" class="criteria-section">
        <h2>{{ t('trust.pendingCriteria', 'Criterios pendientes') }}</h2>
        <div class="criteria-list">
          <div v-for="c in pending" :key="c.key" class="criterion-row criterion-row--pending">
            <div class="criterion-status criterion-status--pending">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="16" />
              </svg>
            </div>
            <div class="criterion-info">
              <span class="criterion-name">{{ t(`trust.criterion.${c.key}`, c.key) }}</span>
              <span class="criterion-pts">{{ c.pts }} / {{ c.maxPts }} pts</span>
            </div>
            <NuxtLink v-if="c.actionPath" :to="c.actionPath" class="criterion-action">
              {{ t('trust.improve', 'Mejorar') }} →
            </NuxtLink>
            <span v-else class="criterion-auto">
              {{ t('trust.automatic', 'Automático') }}
            </span>
          </div>
        </div>
      </section>

      <!-- Done criteria -->
      <section v-if="done.length" class="criteria-section">
        <h2>{{ t('trust.doneCriteria', 'Criterios conseguidos') }}</h2>
        <div class="criteria-list">
          <div v-for="c in done" :key="c.key" class="criterion-row criterion-row--done">
            <div class="criterion-status criterion-status--done">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                aria-hidden="true"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div class="criterion-info">
              <span class="criterion-name">{{ t(`trust.criterion.${c.key}`, c.key) }}</span>
              <span class="criterion-pts">{{ c.pts }} / {{ c.maxPts }} pts</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Refresh button -->
      <button class="btn-refresh" @click="fetchTrustScore()">
        {{ t('trust.refresh', 'Actualizar puntuación') }}
      </button>
    </template>
  </div>
</template>

<style scoped>
/* ============================================
   PUNTUACION PAGE — Base = mobile (360px)
   ============================================ */
.puntuacion-page {
  max-width: 40rem;
  margin: 0 auto;
  padding: 1.5rem 1rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.page-header h1 {
  font-size: var(--font-size-xl);
  font-weight: 700;
  color: var(--color-primary);
  margin: 0 0 0.25rem 0;
}

.subtitle {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin: 0;
}

.btn-back {
  color: var(--color-primary);
  text-decoration: none;
  font-size: var(--font-size-sm);
  font-weight: 600;
  white-space: nowrap;
  min-height: 2.75rem;
  display: flex;
  align-items: center;
}

/* Score card */
.score-card {
  background: var(--bg-secondary);
  border-radius: var(--border-radius-lg);
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  border: 1px solid var(--border-color, #e5e7eb);
}

.score-display {
  display: flex;
  align-items: baseline;
  gap: 0.25rem;
  margin-bottom: 0.75rem;
}

.score-number {
  font-size: 3.5rem;
  font-weight: 800;
  color: var(--color-primary);
  line-height: 1;
}

.score-max {
  font-size: var(--font-size-lg);
  color: var(--text-auxiliary);
  font-weight: 600;
}

.score-badge-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.no-badge-label {
  font-size: var(--font-size-xs);
  color: var(--text-auxiliary);
}

/* Progress bar */
.progress-section {
  margin-top: 0.75rem;
}

.progress-label {
  display: flex;
  justify-content: space-between;
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  margin-bottom: 0.4rem;
}

.progress-bar-bg {
  height: 0.5rem;
  background: var(--border-color, #e5e7eb);
  border-radius: var(--border-radius-full);
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background: linear-gradient(
    90deg,
    var(--color-primary) 0%,
    var(--color-primary-dark, #1a4248) 100%
  );
  border-radius: var(--border-radius-full);
  transition: width 0.4s ease;
}

.points-needed {
  font-size: var(--font-size-xs);
  color: var(--text-auxiliary);
  margin: 0.4rem 0 0;
}

.top-reached {
  font-size: var(--font-size-sm);
  color: var(--color-success);
  font-weight: 600;
}

/* Criteria sections */
.criteria-section {
  margin-bottom: 1.5rem;
}

.criteria-section h2 {
  font-size: var(--font-size-sm);
  font-weight: 700;
  color: var(--text-auxiliary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin: 0 0 0.75rem 0;
}

.criteria-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.criterion-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: var(--bg-primary);
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: var(--border-radius-md);
  padding: 0.75rem 1rem;
}

.criterion-row--done {
  opacity: 0.7;
}

.criterion-status {
  flex-shrink: 0;
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.criterion-status--done {
  background: var(--color-success, #10b981);
  color: #fff;
}

.criterion-status--pending {
  background: var(--bg-secondary);
  color: var(--text-auxiliary);
  border: 1.5px solid var(--border-color);
}

.criterion-info {
  flex: 1;
  min-width: 0;
}

.criterion-name {
  display: block;
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--text-primary);
}

.criterion-pts {
  font-size: var(--font-size-xs);
  color: var(--text-auxiliary);
}

.criterion-action {
  color: var(--color-primary);
  font-size: var(--font-size-xs);
  font-weight: 700;
  text-decoration: none;
  white-space: nowrap;
  min-height: 2.75rem;
  display: flex;
  align-items: center;
}

.criterion-auto {
  font-size: var(--font-size-xs);
  color: var(--text-auxiliary);
  white-space: nowrap;
}

/* Misc */
.loading-placeholder,
.error-msg {
  padding: 2rem;
  text-align: center;
  color: var(--text-secondary);
}

.error-msg {
  color: var(--color-error-text, #dc2626);
}

.btn-refresh {
  background: var(--color-primary);
  color: #fff;
  border: none;
  border-radius: var(--border-radius-md);
  padding: 0.75rem 1.5rem;
  font-size: var(--font-size-sm);
  font-weight: 600;
  cursor: pointer;
  min-height: 2.75rem;
  transition: background 0.2s ease;
}

@media (hover: hover) {
  .btn-refresh:hover {
    background: var(--color-primary-dark, #1a4248);
  }
}

/* ============================================
   RESPONSIVE: ≥480px
   ============================================ */
@media (min-width: 30em) {
  .puntuacion-page {
    padding: 2rem 1.5rem;
  }
}
</style>

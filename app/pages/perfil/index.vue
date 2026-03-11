<script setup lang="ts">
import { useOnboardingTour, BUYER_TOUR_KEY } from '~/composables/useOnboardingTour'

definePageMeta({
  layout: 'default',
  middleware: ['auth'],
})

const { t } = useI18n()
const supabase = useSupabaseClient()
const { userId, displayName, fetchProfile, profile } = useAuth()

const profileCompleteness = computed(() => {
  if (!profile.value) return 0
  const p = profile.value as Record<string, unknown>
  const checks = [!!p.name, !!p.phone, !!p.preferred_country, !!p.preferred_location_level]
  return Math.round((checks.filter(Boolean).length / checks.length) * 100)
})
const { count: favCount } = useFavorites()

const alertsCount = ref(0)
const leadsCount = ref(0)
const recentViews = ref<
  Array<{
    vehicle_id: string
    viewed_at: string
    brand: string
    model: string
    price: number | null
    main_image_url: string | null
    slug: string
  }>
>([])
const loading = ref(true)

async function loadDashboardData() {
  if (!userId.value) {
    loading.value = false
    return
  }

  loading.value = true

  try {
    const [alertsRes, leadsRes, viewsRes] = await Promise.all([
      supabase
        .from('search_alerts')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId.value)
        .eq('is_active', true),
      supabase
        .from('leads')
        .select('id', { count: 'exact', head: true })
        .eq('buyer_user_id', userId.value),
      supabase
        .from('user_vehicle_views')
        .select('vehicle_id, viewed_at, vehicles(brand, model, price, main_image_url, slug)')
        .eq('user_id', userId.value)
        .order('viewed_at', { ascending: false })
        .limit(5),
    ])

    alertsCount.value = alertsRes.count ?? 0
    leadsCount.value = leadsRes.count ?? 0

    recentViews.value = (viewsRes.data ?? []).map((row: Record<string, unknown>) => {
      const v = row.vehicles as Record<string, unknown> | null
      return {
        vehicle_id: row.vehicle_id as string,
        viewed_at: row.viewed_at as string,
        brand: (v?.brand as string) ?? '',
        model: (v?.model as string) ?? '',
        price: (v?.price as number | null) ?? null,
        main_image_url: (v?.main_image_url as string | null) ?? null,
        slug: (v?.slug as string) ?? '',
      }
    })
  } catch {
    // Silent fail — dashboard is non-critical
  } finally {
    loading.value = false
  }
}

useHead({
  title: t('profile.dashboard.title'),
})

// ---------------------------------------------------------------------------
// Guided tour — shown once to new buyers
// ---------------------------------------------------------------------------

const tourSteps = computed(() => [
  {
    key: 'welcome',
    title: t('tour.buyer.step1.title'),
    description: t('tour.buyer.step1.desc'),
  },
  {
    key: 'favorites',
    title: t('tour.buyer.step2.title'),
    description: t('tour.buyer.step2.desc'),
    actionLabel: t('tour.buyer.step2.action'),
    actionRoute: '/perfil/favoritos',
  },
  {
    key: 'alerts',
    title: t('tour.buyer.step3.title'),
    description: t('tour.buyer.step3.desc'),
    actionLabel: t('tour.buyer.step3.action'),
    actionRoute: '/perfil/alertas',
  },
  {
    key: 'messages',
    title: t('tour.buyer.step4.title'),
    description: t('tour.buyer.step4.desc'),
  },
])

const buyerTour = useOnboardingTour(tourSteps.value, BUYER_TOUR_KEY)

watch(
  profile,
  (p) => {
    if (p) buyerTour.startTour()
  },
  { once: true },
)

onMounted(async () => {
  await Promise.all([fetchProfile(), loadDashboardData()])
})

interface QuickLink {
  to: string
  labelKey: string
  icon: string
}

const quickLinks: QuickLink[] = [
  { to: '/perfil/datos', labelKey: 'profile.dashboard.linkData', icon: 'person' },
  { to: '/perfil/favoritos', labelKey: 'profile.dashboard.linkFavorites', icon: 'heart' },
  { to: '/perfil/alertas', labelKey: 'profile.dashboard.linkAlerts', icon: 'bell' },
  { to: '/perfil/contactos', labelKey: 'profile.dashboard.linkContacts', icon: 'mail' },
  { to: '/perfil/suscripcion', labelKey: 'profile.dashboard.linkSubscription', icon: 'star' },
  {
    to: '/perfil/notificaciones',
    labelKey: 'profile.dashboard.linkNotifications',
    icon: 'settings',
  },
  { to: '/perfil/seguridad', labelKey: 'profile.dashboard.linkSecurity', icon: 'lock' },
]
</script>

<template>
  <div class="profile-page">
    <div class="profile-container">
      <UiBreadcrumbNav :items="[{ label: $t('nav.home'), to: '/' }, { label: $t('profile.dashboard.title') }]" />
      <PerfilProfileNavPills />
      <!-- Header -->
      <div class="profile-header">
        <h1 class="page-title">
          {{ $t('profile.dashboard.title') }}
        </h1>
        <p class="page-welcome">
          {{ $t('profile.dashboard.welcome', { name: displayName }) }}
        </p>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="loading-skeleton" aria-busy="true">
        <div class="summary-grid">
          <UiSkeletonCard v-for="n in 3" :key="n" :lines="1" />
        </div>
        <UiSkeletonCard :lines="4" />
      </div>

      <template v-else>
        <!-- Summary cards -->
        <div class="summary-grid">
          <NuxtLink to="/perfil/favoritos" class="summary-card">
            <span class="summary-value">{{ favCount() }}</span>
            <span class="summary-label">{{ $t('profile.dashboard.favorites') }}</span>
          </NuxtLink>

          <NuxtLink to="/perfil/alertas" class="summary-card">
            <span class="summary-value">{{ alertsCount }}</span>
            <span class="summary-label">{{ $t('profile.dashboard.alertsActive') }}</span>
          </NuxtLink>

          <NuxtLink to="/perfil/contactos" class="summary-card">
            <span class="summary-value">{{ leadsCount }}</span>
            <span class="summary-label">{{ $t('profile.dashboard.contactsSent') }}</span>
          </NuxtLink>
        </div>

        <!-- Profile completeness nudge (hidden when 100%) -->
        <NuxtLink
          v-if="profileCompleteness < 100"
          to="/perfil/datos"
          class="completeness-nudge"
        >
          <div class="nudge-text">
            <span class="nudge-title">{{ $t('profile.dashboard.completeProfile') }}</span>
            <span class="nudge-hint">{{ profileCompleteness }}% {{ $t('profile.dashboard.completed') }}</span>
          </div>
          <div class="nudge-bar-wrap">
            <div class="nudge-bar">
              <div class="nudge-bar-fill" :style="{ width: `${profileCompleteness}%` }" />
            </div>
          </div>
          <svg class="nudge-arrow" viewBox="0 0 20 20" fill="currentColor" width="16" height="16" aria-hidden="true">
            <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
          </svg>
        </NuxtLink>

        <!-- Recent views -->
        <section class="section">
          <h2 class="section-title">
            {{ $t('profile.dashboard.recentViews') }}
          </h2>

          <div v-if="recentViews.length === 0" class="empty-state">
            {{ $t('profile.dashboard.noRecentViews') }}
          </div>

          <div v-else class="recent-list">
            <NuxtLink
              v-for="item in recentViews"
              :key="item.vehicle_id"
              :to="`/vehiculo/${item.slug}`"
              class="recent-item"
            >
              <div class="recent-image">
                <img
                  v-if="item.main_image_url"
                  :src="item.main_image_url"
                  :alt="`${item.brand} ${item.model}`"
                  loading="lazy"
                >
                <div v-else class="recent-image-placeholder">
                  <span>{{ item.brand.charAt(0) }}</span>
                </div>
              </div>
              <div class="recent-info">
                <span class="recent-title">{{ item.brand }} {{ item.model }}</span>
                <span v-if="item.price" class="recent-price"
                  >{{ item.price.toLocaleString() }} &euro;</span
                >
              </div>
            </NuxtLink>
          </div>
        </section>

        <!-- Quick links -->
        <section class="section">
          <h2 class="section-title">
            {{ $t('profile.dashboard.quickLinks') }}
          </h2>

          <div class="quick-links-grid">
            <NuxtLink v-for="link in quickLinks" :key="link.to" :to="link.to" class="quick-link">
              <span class="quick-link-label">{{ $t(link.labelKey) }}</span>
              <svg
                class="quick-link-arrow"
                viewBox="0 0 20 20"
                fill="currentColor"
                width="16"
                height="16"
                aria-hidden="true"
              >
                <path
                  fill-rule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clip-rule="evenodd"
                />
              </svg>
            </NuxtLink>
          </div>
        </section>
      </template>
    </div>
  </div>

  <!-- Guided onboarding tour (fixed bottom card, shown once to new buyers) -->
  <UiOnboardingTour
    :visible="buyerTour.visible.value"
    :current-step="buyerTour.currentStep.value"
    :step-number="buyerTour.stepNumber.value"
    :total-steps="buyerTour.totalSteps"
    :is-first="buyerTour.isFirst.value"
    :is-last="buyerTour.isLast.value"
    @next="buyerTour.nextStep()"
    @prev="buyerTour.prevStep()"
    @skip="buyerTour.skipTour()"
  />
</template>

<style scoped>
.profile-page {
  min-height: 60vh;
  padding: 1.5rem 0 3rem;
}

.profile-container {
  max-width: 50rem;
  margin: 0 auto;
  padding: 0 1rem;
}

.profile-header {
  margin-bottom: 1.5rem;
}

.page-title {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
  margin-bottom: 0.25rem;
}

.page-welcome {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

/* Loading */
.loading-state {
  text-align: center;
  padding: 3rem 1rem;
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

/* Summary grid */
.summary-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
  margin-bottom: 2rem;
}

.summary-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem 0.5rem;
  background: var(--bg-primary);
  border: 1px solid var(--border-color-light);
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-sm);
  text-decoration: none;
  transition: box-shadow var(--transition-fast);
  min-height: 2.75rem;
}

.summary-card:hover {
  box-shadow: var(--shadow-md);
}

.summary-value {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
  line-height: var(--line-height-tight);
}

.summary-label {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  text-align: center;
  margin-top: 0.25rem;
}

/* Sections */
.section {
  margin-bottom: 2rem;
}

.section-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-primary);
  margin-bottom: 1rem;
}

/* Empty state */
.empty-state {
  text-align: center;
  padding: 2rem 1rem;
  background: var(--bg-secondary);
  border-radius: var(--border-radius);
  font-size: var(--font-size-sm);
  color: var(--text-auxiliary);
}

/* Recent views */
.recent-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.recent-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: var(--bg-primary);
  border: 1px solid var(--border-color-light);
  border-radius: var(--border-radius);
  text-decoration: none;
  transition: box-shadow var(--transition-fast);
  min-height: 2.75rem;
}

.recent-item:hover {
  box-shadow: var(--shadow);
}

.recent-image {
  width: 3.5rem;
  height: 2.625rem;
  border-radius: var(--border-radius-sm);
  overflow: hidden;
  flex-shrink: 0;
  background: var(--bg-secondary);
}

.recent-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.recent-image-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--text-auxiliary);
  background: var(--bg-tertiary);
}

.recent-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.recent-title {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.recent-price {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
}

/* Quick links */
.quick-links-grid {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.quick-link {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.875rem 1rem;
  background: var(--bg-primary);
  border: 1px solid var(--border-color-light);
  border-radius: var(--border-radius);
  text-decoration: none;
  transition: box-shadow var(--transition-fast);
  min-height: 2.75rem;
}

.quick-link:hover {
  box-shadow: var(--shadow);
}

.quick-link-label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
}

.quick-link-arrow {
  color: var(--text-auxiliary);
  flex-shrink: 0;
}

/* Completeness nudge */
.completeness-nudge {
  display: grid;
  grid-template-columns: 1fr auto;
  grid-template-rows: auto auto;
  align-items: center;
  gap: 0.25rem 0.75rem;
  padding: 0.875rem 1rem;
  background: var(--bg-primary);
  border: 1px solid var(--color-primary);
  border-radius: var(--border-radius-md);
  text-decoration: none;
  margin-bottom: 2rem;
  transition: box-shadow var(--transition-fast);
}

.completeness-nudge:hover {
  box-shadow: var(--shadow);
}

.nudge-text {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.nudge-title {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-primary);
}

.nudge-hint {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
}

.nudge-bar-wrap {
  grid-column: 1;
  grid-row: 2;
}

.nudge-bar {
  width: 100%;
  height: 0.375rem;
  background: var(--border-color-light);
  border-radius: var(--border-radius-full);
  overflow: hidden;
}

.nudge-bar-fill {
  height: 100%;
  background: var(--color-primary);
  border-radius: var(--border-radius-full);
}

.nudge-arrow {
  grid-column: 2;
  grid-row: 1 / 3;
  color: var(--text-auxiliary);
}

/* ---- Tablet ---- */
@media (min-width: 48em) {
  .profile-container {
    padding: 0 2rem;
  }

  .page-title {
    font-size: var(--font-size-3xl);
  }

  .page-welcome {
    font-size: var(--font-size-base);
  }

  .summary-card {
    padding: 1.25rem 1rem;
  }

  .summary-value {
    font-size: var(--font-size-3xl);
  }

  .summary-label {
    font-size: var(--font-size-sm);
  }

  .quick-links-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
  }
}

/* ---- Desktop ---- */
@media (min-width: 64em) {
  .summary-grid {
    gap: 1rem;
  }

  .quick-links-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>

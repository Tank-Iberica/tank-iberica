<script setup lang="ts">
/**
 * Dealer Tools Hub
 * Shows all available tools as cards with icons, grouped by category.
 */
import type { PlanType } from '~/composables/useSubscriptionPlan'

definePageMeta({
  layout: 'default',
  middleware: ['auth', 'dealer'],
})

const { t } = useI18n()
const { userId } = useAuth()
const { currentPlan, fetchSubscription, loading } = useSubscriptionPlan(userId.value || undefined)

onMounted(async () => {
  await fetchSubscription()
})

/** Plan hierarchy for comparison */
const PLAN_HIERARCHY: Record<PlanType, number> = {
  free: 0,
  basic: 1,
  premium: 2,
  founding: 3,
}

interface ToolItem {
  key: string
  titleKey: string
  descriptionKey: string
  icon: string
  to: string
  requiredPlan: PlanType
}

interface ToolCategory {
  key: string
  labelKey: string
  items: ToolItem[]
}

const toolCategories: ToolCategory[] = [
  {
    key: 'documents',
    labelKey: 'dashboard.tools.documents',
    items: [
      {
        key: 'invoice',
        titleKey: 'dashboard.tools.invoice.title',
        descriptionKey: 'dashboard.tools.invoice.description',
        icon: 'receipt',
        to: '/dashboard/herramientas/factura',
        requiredPlan: 'basic',
      },
      {
        key: 'contract',
        titleKey: 'dashboard.tools.contract.title',
        descriptionKey: 'dashboard.tools.contract.description',
        icon: 'file-text',
        to: '/dashboard/herramientas/contrato',
        requiredPlan: 'basic',
      },
      {
        key: 'quote',
        titleKey: 'dashboard.tools.quote.title',
        descriptionKey: 'dashboard.tools.quote.description',
        icon: 'clipboard',
        to: '/dashboard/herramientas/presupuesto',
        requiredPlan: 'free',
      },
    ],
  },
  {
    key: 'management',
    labelKey: 'dashboard.tools.management',
    items: [
      {
        key: 'maintenance',
        titleKey: 'dashboard.tools.maintenance.title',
        descriptionKey: 'dashboard.tools.maintenance.description',
        icon: 'wrench',
        to: '/dashboard/herramientas/mantenimientos',
        requiredPlan: 'basic',
      },
      {
        key: 'rental',
        titleKey: 'dashboard.tools.rental.title',
        descriptionKey: 'dashboard.tools.rental.description',
        icon: 'calendar',
        to: '/dashboard/herramientas/alquileres',
        requiredPlan: 'basic',
      },
      {
        key: 'export',
        titleKey: 'dashboard.tools.export.title',
        descriptionKey: 'dashboard.tools.export.description',
        icon: 'download',
        to: '/dashboard/herramientas/exportar',
        requiredPlan: 'basic',
      },
    ],
  },
  {
    key: 'marketing',
    labelKey: 'dashboard.tools.marketing',
    items: [
      {
        key: 'adExporter',
        titleKey: 'dashboard.tools.adExporter.title',
        descriptionKey: 'dashboard.tools.adExporter.description',
        icon: 'megaphone',
        to: '/dashboard/herramientas/exportar-anuncio',
        requiredPlan: 'basic',
      },
      {
        key: 'widget',
        titleKey: 'dashboard.tools.widget.title',
        descriptionKey: 'dashboard.tools.widget.description',
        icon: 'code',
        to: '/dashboard/herramientas/widget',
        requiredPlan: 'premium',
      },
      {
        key: 'merchandising',
        titleKey: 'dashboard.tools.merchandising.title',
        descriptionKey: 'dashboard.tools.merchandising.description',
        icon: 'gift',
        to: '/dashboard/herramientas/merchandising',
        requiredPlan: 'free',
      },
    ],
  },
  {
    key: 'analysis',
    labelKey: 'dashboard.tools.analysis',
    items: [
      {
        key: 'calculator',
        titleKey: 'dashboard.tools.calculator.title',
        descriptionKey: 'dashboard.tools.calculator.description',
        icon: 'calculator',
        to: '/dashboard/herramientas/calculadora',
        requiredPlan: 'free',
      },
    ],
  },
]

function isLocked(requiredPlan: PlanType): boolean {
  return PLAN_HIERARCHY[requiredPlan] > PLAN_HIERARCHY[currentPlan.value]
}

function getPlanBadgeLabel(requiredPlan: PlanType): string {
  if (requiredPlan === 'free') return t('dashboard.tools.free')
  if (requiredPlan === 'basic') return t('dashboard.tools.basic')
  if (requiredPlan === 'premium') return t('dashboard.tools.premium')
  return requiredPlan
}
</script>

<template>
  <div class="tools-page">
    <header class="page-header">
      <h1>{{ t('dashboard.tools.title') }}</h1>
      <p class="subtitle">{{ t('dashboard.tools.subtitle') }}</p>
    </header>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <div class="spinner" />
    </div>

    <template v-else>
      <section v-for="category in toolCategories" :key="category.key" class="tool-category">
        <h2 class="category-title">{{ t(category.labelKey) }}</h2>
        <div class="tools-grid">
          <NuxtLink
            v-for="tool in category.items"
            :key="tool.key"
            :to="tool.to"
            class="tool-card"
            :class="{ locked: isLocked(tool.requiredPlan) }"
          >
            <!-- Icon -->
            <div class="tool-icon">
              <!-- Receipt -->
              <svg
                v-if="tool.icon === 'receipt'"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" />
                <path d="M8 7h8" />
                <path d="M8 11h8" />
                <path d="M8 15h4" />
              </svg>
              <!-- File-text -->
              <svg
                v-else-if="tool.icon === 'file-text'"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
                <path d="M14 2v4a2 2 0 0 0 2 2h4" />
                <path d="M10 9H8" />
                <path d="M16 13H8" />
                <path d="M16 17H8" />
              </svg>
              <!-- Clipboard -->
              <svg
                v-else-if="tool.icon === 'clipboard'"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
                <path
                  d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"
                />
                <path d="M12 11h4" />
                <path d="M12 16h4" />
                <path d="M8 11h.01" />
                <path d="M8 16h.01" />
              </svg>
              <!-- Wrench -->
              <svg
                v-else-if="tool.icon === 'wrench'"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <path
                  d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76Z"
                />
              </svg>
              <!-- Calendar -->
              <svg
                v-else-if="tool.icon === 'calendar'"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <path d="M8 2v4" />
                <path d="M16 2v4" />
                <rect width="18" height="18" x="3" y="4" rx="2" />
                <path d="M3 10h18" />
              </svg>
              <!-- Download -->
              <svg
                v-else-if="tool.icon === 'download'"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" x2="12" y1="15" y2="3" />
              </svg>
              <!-- Megaphone -->
              <svg
                v-else-if="tool.icon === 'megaphone'"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <path d="m3 11 18-5v12L3 13v-2Z" />
                <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
              </svg>
              <!-- Code -->
              <svg
                v-else-if="tool.icon === 'code'"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <polyline points="16 18 22 12 16 6" />
                <polyline points="8 6 2 12 8 18" />
              </svg>
              <!-- Gift -->
              <svg
                v-else-if="tool.icon === 'gift'"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <rect x="3" y="8" width="18" height="4" rx="1" />
                <path d="M12 8v13" />
                <path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" />
                <path
                  d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5"
                />
              </svg>
              <!-- Calculator -->
              <svg
                v-else-if="tool.icon === 'calculator'"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <rect width="16" height="20" x="4" y="2" rx="2" />
                <line x1="8" x2="16" y1="6" y2="6" />
                <line x1="16" x2="16" y1="14" y2="18" />
                <path d="M16 10h.01" />
                <path d="M12 10h.01" />
                <path d="M8 10h.01" />
                <path d="M12 14h.01" />
                <path d="M8 14h.01" />
                <path d="M12 18h.01" />
                <path d="M8 18h.01" />
              </svg>
            </div>

            <!-- Content -->
            <div class="tool-content">
              <span class="tool-title">{{ t(tool.titleKey) }}</span>
              <span class="tool-description">{{ t(tool.descriptionKey) }}</span>
            </div>

            <!-- Plan badge -->
            <div class="tool-badge-row">
              <span v-if="isLocked(tool.requiredPlan)" class="badge badge-locked">
                <svg
                  class="lock-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                >
                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                {{ t('dashboard.tools.upgrade', { plan: getPlanBadgeLabel(tool.requiredPlan) }) }}
              </span>
              <span
                v-else
                class="badge"
                :class="{
                  'badge-free': tool.requiredPlan === 'free',
                  'badge-basic': tool.requiredPlan === 'basic',
                  'badge-premium': tool.requiredPlan === 'premium',
                }"
              >
                {{ getPlanBadgeLabel(tool.requiredPlan) }}
              </span>
            </div>
          </NuxtLink>
        </div>
      </section>
    </template>
  </div>
</template>

<style scoped>
.tools-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.page-header h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-primary, #23424a);
}

.subtitle {
  margin: 4px 0 0;
  color: #64748b;
  font-size: 0.95rem;
}

/* Loading */
.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
}

.spinner {
  width: 24px;
  height: 24px;
  border: 3px solid #e2e8f0;
  border-top-color: var(--color-primary, #23424a);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Category */
.tool-category {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.category-title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #1e293b;
  padding-bottom: 8px;
  border-bottom: 1px solid #e2e8f0;
}

/* Grid */
.tools-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

/* Card */
.tool-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  text-decoration: none;
  color: inherit;
  transition:
    box-shadow 0.2s,
    transform 0.15s;
  min-height: 44px;
}

.tool-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  transform: translateY(-1px);
}

.tool-card:active {
  transform: translateY(0);
}

.tool-card.locked {
  opacity: 0.7;
}

.tool-card.locked:hover {
  opacity: 0.85;
}

/* Icon */
.tool-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f0f9ff;
  border-radius: 10px;
  color: var(--color-primary, #23424a);
  flex-shrink: 0;
}

.tool-icon svg {
  width: 22px;
  height: 22px;
}

.tool-card.locked .tool-icon {
  background: #f1f5f9;
  color: #94a3b8;
}

/* Content */
.tool-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.tool-title {
  font-weight: 600;
  font-size: 0.95rem;
  color: #1e293b;
}

.tool-description {
  font-size: 0.85rem;
  color: #64748b;
  line-height: 1.4;
}

.tool-card.locked .tool-title {
  color: #94a3b8;
}

.tool-card.locked .tool-description {
  color: #cbd5e1;
}

/* Badge row */
.tool-badge-row {
  display: flex;
  align-items: center;
}

.badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
  min-height: 28px;
}

.badge-free {
  background: #f0fdf4;
  color: #16a34a;
}

.badge-basic {
  background: #eff6ff;
  color: #2563eb;
}

.badge-premium {
  background: #fef3c7;
  color: #d97706;
}

.badge-locked {
  background: #f1f5f9;
  color: #64748b;
}

.lock-icon {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

/* Responsive — tablet */
@media (min-width: 640px) {
  .tools-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Responsive — desktop */
@media (min-width: 1024px) {
  .tools-page {
    padding: 24px;
  }

  .tools-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>

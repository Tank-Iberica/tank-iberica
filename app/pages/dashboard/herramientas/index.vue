<script setup lang="ts">
import type { PlanType } from '~/composables/useSubscriptionPlan'
import type { ToolItem } from '~/components/dashboard/herramientas/ToolCard.vue'

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

const PLAN_HIERARCHY: Record<PlanType, number> = {
  free: 0,
  basic: 1,
  premium: 2,
  founding: 3,
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
</script>

<template>
  <div class="tools-page">
    <header class="page-header">
      <h1>{{ t('dashboard.tools.title') }}</h1>
      <p class="subtitle">{{ t('dashboard.tools.subtitle') }}</p>
    </header>

    <div v-if="loading" class="loading-state">
      <div class="spinner" />
    </div>

    <template v-else>
      <section v-for="category in toolCategories" :key="category.key" class="tool-category">
        <h2 class="category-title">{{ t(category.labelKey) }}</h2>
        <div class="tools-grid">
          <ToolCard
            v-for="tool in category.items"
            :key="tool.key"
            :tool="tool"
            :locked="isLocked(tool.requiredPlan)"
          />
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
  color: var(--color-primary);
}

.subtitle {
  margin: 4px 0 0;
  color: var(--text-auxiliary);
  font-size: 0.95rem;
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
}

.spinner {
  width: 24px;
  height: 24px;
  border: 3px solid var(--color-gray-200);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.tool-category {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.category-title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary);
  padding-bottom: 8px;
  border-bottom: 1px solid var(--color-gray-200);
}

.tools-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

@media (min-width: 640px) {
  .tools-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .tools-page {
    padding: 24px;
  }

  .tools-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>

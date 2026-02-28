<script setup lang="ts">
import type { PlanType } from '~/composables/useSubscriptionPlan'

export interface ToolItem {
  key: string
  titleKey: string
  descriptionKey: string
  icon: string
  to: string
  requiredPlan: PlanType
}

defineProps<{
  tool: ToolItem
  locked: boolean
}>()

const { t } = useI18n()

function getPlanBadgeLabel(requiredPlan: PlanType): string {
  if (requiredPlan === 'free') return t('dashboard.tools.free')
  if (requiredPlan === 'basic') return t('dashboard.tools.basic')
  if (requiredPlan === 'premium') return t('dashboard.tools.premium')
  return requiredPlan
}
</script>

<template>
  <NuxtLink :to="tool.to" class="tool-card" :class="{ locked }">
    <!-- Icon -->
    <div class="tool-icon">
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
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
        <path d="M12 11h4" />
        <path d="M12 16h4" />
        <path d="M8 11h.01" />
        <path d="M8 16h.01" />
      </svg>
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
        <path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5" />
      </svg>
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
      <span v-if="locked" class="badge badge-locked">
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
</template>

<style scoped>
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
</style>

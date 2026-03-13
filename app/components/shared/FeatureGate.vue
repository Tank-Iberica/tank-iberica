<script setup lang="ts">
/**
 * FeatureGate — Declarative feature gating component.
 *
 * Gates content behind feature flags and/or subscription plans.
 * Shows default slot when user has access, #locked slot otherwise.
 *
 * Usage:
 *   <FeatureGate feature="auctions" min-plan="basic">
 *     <AuctionPanel />
 *     <template #locked="{ reason, requiredPlan }">
 *       <UpgradePrompt :plan="requiredPlan" />
 *     </template>
 *   </FeatureGate>
 *
 *   <!-- Minimal — just hides content if flag is off -->
 *   <FeatureGate feature="beta_dashboard">
 *     <BetaDashboard />
 *   </FeatureGate>
 */
import type { PlanType } from '~/composables/useSubscriptionPlan'
import type { GateReason } from '~/composables/useFeatureGate'

const props = withDefaults(
  defineProps<{
    /** Feature flag key from feature_flags table */
    feature?: string
    /** Minimum subscription plan required */
    minPlan?: PlanType
    /** Vertical override for feature flag check */
    vertical?: string
    /** How to render locked state: 'placeholder' shows locked slot, 'hidden' renders nothing */
    lockedMode?: 'placeholder' | 'hidden'
  }>(),
  {
    feature: undefined,
    minPlan: undefined,
    vertical: undefined,
    lockedMode: 'placeholder',
  },
)

const { hasAccess, reason, currentPlan, requiredPlan } = useFeatureGate({
  feature: props.feature,
  minPlan: props.minPlan,
  vertical: props.vertical,
})

defineExpose({ hasAccess, reason, currentPlan, requiredPlan })
</script>

<template>
  <slot v-if="hasAccess" />
  <template v-else-if="lockedMode === 'placeholder'">
    <slot
      name="locked"
      :reason="(reason as GateReason)"
      :required-plan="requiredPlan"
      :current-plan="currentPlan"
    >
      <!-- Default locked UI -->
      <div class="feature-gate-locked" role="alert">
        <div class="feature-gate-locked__icon">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
        <p class="feature-gate-locked__text">
          <template v-if="reason === 'plan_required'">
            {{ $t('platform.feature_requires_plan', { plan: requiredPlan }) }}
          </template>
          <template v-else>
            {{ $t('platform.feature_not_available') }}
          </template>
        </p>
        <NuxtLink
          v-if="reason === 'plan_required'"
          to="/precios"
          class="feature-gate-locked__cta"
        >
          {{ $t('platform.upgrade_plan') }}
        </NuxtLink>
      </div>
    </slot>
  </template>
  <!-- lockedMode === 'hidden' → render nothing -->
</template>

<style scoped>
.feature-gate-locked {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 1.5rem;
  border: 1px dashed var(--color-border, #d1d5db);
  border-radius: 0.5rem;
  background: var(--bg-muted, #f9fafb);
  text-align: center;
}

.feature-gate-locked__icon {
  color: var(--color-text-muted, #6b7280);
}

.feature-gate-locked__text {
  margin: 0;
  font-size: 0.875rem;
  color: var(--color-text-secondary, #374151);
}

.feature-gate-locked__cta {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #fff;
  background-color: var(--color-primary, #23424a);
  border-radius: 0.375rem;
  text-decoration: none;
  min-height: 2.75rem;
  transition: background-color 0.15s;
}

.feature-gate-locked__cta:hover,
.feature-gate-locked__cta:focus-visible {
  background-color: var(--color-primary-dark, #1a3238);
  outline: 2px solid var(--color-primary, #23424a);
  outline-offset: 2px;
}
</style>

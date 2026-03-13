<!--
  DealerTrustBadge — #31

  Shows a visual trust badge for a dealer based on their trust score tier.
  - tier === 'top'      → gold star badge (score ≥ 80)
  - tier === 'verified' → blue checkmark badge (score 60-79)
  - tier === null       → renders nothing

  Props:
    tier (TrustBadgeTier): 'top' | 'verified' | null
-->
<template>
  <span
    v-if="tier"
    :class="['dealer-trust-badge', `dealer-trust-badge--${tier}`]"
    role="status"
    :aria-label="ariaLabel"
  >
    <span class="badge-tooltip" :aria-hidden="true">{{ tooltipText }}</span>

    <!-- Top tier: gold star -->
    <svg
      v-if="tier === 'top'"
      class="badge-icon"
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>

    <!-- Verified tier: checkmark -->
    <svg
      v-else
      class="badge-icon"
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2.5"
      aria-hidden="true"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>

    <span class="badge-label">{{ label }}</span>
  </span>
</template>

<script setup lang="ts">
import type { TrustBadgeTier } from '~/composables/useDealerTrustScore'

const props = defineProps<{
  tier: TrustBadgeTier
}>()

const { t } = useI18n()

const label = computed(() =>
  props.tier === 'top'
    ? t('trust.badgeTop', 'Top')
    : t('trust.badgeVerified', 'Verificado'),
)

const tooltipText = computed(() =>
  props.tier === 'top'
    ? t('trust.tooltipTop', 'Dealer con máxima puntuación: perfil completo, activo y con buenas valoraciones')
    : t('trust.tooltipVerified', 'Dealer verificado: perfil con información completa y actividad comprobada'),
)

const ariaLabel = computed(() =>
  props.tier === 'top'
    ? t('trust.ariaTop', 'Dealer Top: máxima confianza')
    : t('trust.ariaVerified', 'Dealer Verificado'),
)
</script>

<style scoped>
/* ============================================
   DEALER TRUST BADGE — Base = mobile (360px)
   ============================================ */
.dealer-trust-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.2rem 0.5rem;
  border-radius: var(--border-radius-full, 9999px);
  font-size: var(--font-size-xs);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  cursor: default;
  position: relative;
  white-space: nowrap;
  user-select: none;
}

/* Top tier — gold */
.dealer-trust-badge--top {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: #fff;
  box-shadow: 0 1px 3px rgba(217, 119, 6, 0.35);
}

/* Verified tier — teal/primary */
.dealer-trust-badge--verified {
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark, #1a4248) 100%);
  color: #fff;
  box-shadow: 0 1px 3px rgba(35, 66, 74, 0.25);
}

.badge-icon {
  flex-shrink: 0;
}

.badge-label {
  line-height: 1;
}

/* Tooltip — hidden by default, shown on focus/hover */
.badge-tooltip {
  position: absolute;
  bottom: calc(100% + 0.4rem);
  left: 50%;
  transform: translateX(-50%);
  background: var(--bg-primary, #fff);
  color: var(--text-primary, #1a1a1a);
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: var(--border-radius-md, 0.5rem);
  padding: 0.4rem 0.7rem;
  font-size: var(--font-size-xs);
  font-weight: 400;
  text-transform: none;
  letter-spacing: 0;
  white-space: normal;
  width: 12rem;
  text-align: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.15s ease;
  z-index: 10;
}

/* Show tooltip on hover (pointer) and focus (keyboard) */
@media (hover: hover) {
  .dealer-trust-badge:hover .badge-tooltip {
    opacity: 1;
  }
}

.dealer-trust-badge:focus-within .badge-tooltip,
.dealer-trust-badge:focus .badge-tooltip {
  opacity: 1;
}
</style>

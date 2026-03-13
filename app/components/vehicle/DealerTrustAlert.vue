<!--
  DealerTrustAlert — #33

  Soft buyer-facing alerts when a vehicle listing shows risk signals:
  - Dealer account < 7 days old
  - Unverified dealer (trust_score < 60) — shown only if trust_score is known
  - Too few photos (< 3)

  All alerts are informational, not alarmist. They guide, not frighten.

  Props:
    dealerVerified   (boolean | null): null = unknown, false = not verified
    dealerTrustScore (number | null): 0-100 or null if not computed yet
    dealerCreatedAt  (string | null): ISO date string
    imageCount       (number): vehicle photo count
    price            (number | null): listed price (reserved for future %delta check)
-->
<template>
  <div v-if="alerts.length > 0" class="dealer-trust-alerts" role="note" aria-label="Información sobre el vendedor">
    <div
      v-for="alert in alerts"
      :key="alert.key"
      class="trust-alert"
    >
      <svg
        class="alert-icon"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      <span>{{ alert.text }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  dealerVerified: boolean | null
  dealerTrustScore: number | null
  dealerCreatedAt: string | null
  imageCount: number
  price: number | null
}>()

const { t } = useI18n()

const alerts = computed(() => {
  const result: Array<{ key: string; text: string }> = []

  // New account alert (< 7 days)
  if (props.dealerCreatedAt) {
    const ageMs = Date.now() - new Date(props.dealerCreatedAt).getTime()
    const ageDays = ageMs / (1000 * 60 * 60 * 24)
    if (ageDays < 7) {
      result.push({
        key: 'new-account',
        text: t('trust.alertNewAccount', 'Vendedor con cuenta reciente (menos de 7 días de actividad)'),
      })
    }
  }

  // Low trust / unverified dealer
  if (props.dealerTrustScore !== null && props.dealerTrustScore < 60) {
    result.push({
      key: 'low-trust',
      text: t('trust.alertLowTrust', 'Este vendedor aún no ha completado su perfil de confianza'),
    })
  } else if (props.dealerVerified === false) {
    result.push({
      key: 'unverified',
      text: t('trust.alertUnverified', 'Perfil de vendedor no verificado'),
    })
  }

  // Few photos
  if (props.imageCount < 3) {
    result.push({
      key: 'few-photos',
      text: t('trust.alertFewPhotos', 'El anuncio tiene pocas fotos — solicita más al vendedor'),
    })
  }

  return result
})
</script>

<style scoped>
/* ============================================
   DEALER TRUST ALERTS — Base = mobile (360px)
   Soft, informational style — NOT alarming
   ============================================ */
.dealer-trust-alerts {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  margin-bottom: var(--spacing-4, 1rem);
}

.trust-alert {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-left: 3px solid #f59e0b;
  border-radius: var(--border-radius-sm, 0.25rem);
  padding: 0.5rem 0.75rem;
  font-size: var(--font-size-xs);
  color: #92400e;
  line-height: 1.4;
}

.alert-icon {
  flex-shrink: 0;
  margin-top: 0.05rem;
  color: #d97706;
}
</style>

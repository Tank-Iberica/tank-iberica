<script lang="ts">
/** Variant type for a single promo slot */
export interface PromoSlot {
  /** Icon SVG path or emoji */
  icon: string
  /** i18n key for the title */
  titleKey: string
  /** i18n params for the title */
  titleParams?: Record<string, unknown>
  /** i18n key for the description (optional) */
  descKey?: string
  /** i18n params for the description */
  descParams?: Record<string, unknown>
  /** Primary CTA label i18n key */
  ctaKey: string
  /** Secondary CTA label i18n key (optional, only single mode) */
  ctaSecondaryKey?: string
  /** Highlight color variant */
  variant?: 'default' | 'primary' | 'accent' | 'gold'
  /** Small count badge text (e.g. "12 vehículos") */
  badge?: string
}
</script>

<script setup lang="ts">
const props = defineProps<{
  /** Single slot (full card) or two slots (split card) */
  slots: [PromoSlot] | [PromoSlot, PromoSlot]
}>()

const emit = defineEmits<{
  /** Emits slot index (0 or 1) for primary CTA */
  action: [index: number]
  /** Emits slot index for secondary CTA */
  actionSecondary: [index: number]
}>()

const isSplit = computed(() => props.slots.length === 2)
</script>

<template>
  <div
    :class="[
      'promo-card',
      { 'promo-card--split': isSplit },
      'promo-card--primary-' + (slots[0].variant || 'default'),
    ]"
  >
    <div
      v-for="(slot, i) in slots"
      :key="i"
      :class="[
        'promo-slot',
        `promo-slot--${slot.variant || 'default'}`,
        { 'promo-slot--single': !isSplit },
      ]"
    >
      <!-- Icon area (replaces image) -->
      <div class="promo-slot__icon-area">
        <span v-if="slot.icon.length <= 2" class="promo-slot__emoji">{{ slot.icon }}</span>
        <svg
          v-else
          width="40"
          height="40"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          aria-hidden="true"
          class="promo-slot__svg"
          v-html="slot.icon"
        />
        <span v-if="slot.badge" class="promo-slot__badge">
          {{ slot.badge }}
        </span>
      </div>

      <!-- Content area (replaces product-info) -->
      <div class="promo-slot__content">
        <p class="promo-slot__title">
          {{ $t(slot.titleKey, slot.titleParams || {}) }}
        </p>
        <p v-if="slot.descKey" class="promo-slot__desc">
          {{ $t(slot.descKey, slot.descParams || {}) }}
        </p>
        <div class="promo-slot__actions">
          <button class="promo-btn promo-btn--primary" @click.stop="emit('action', i)">
            {{ $t(slot.ctaKey) }}
          </button>
          <button
            v-if="slot.ctaSecondaryKey && !isSplit"
            class="promo-btn promo-btn--outline"
            @click.stop="emit('actionSecondary', i)"
          >
            {{ $t(slot.ctaSecondaryKey) }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ── Card shell — matches VehicleCard outer ── */
.promo-card {
  display: flex;
  flex-direction: column;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
  border: 2px dashed var(--border-color);
  background: var(--bg-primary);
}

/* ── Single slot: full card height ── */
.promo-slot--single {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.promo-slot--single .promo-slot__icon-area {
  aspect-ratio: 4 / 3;
}

/* ── Split mode: two equal halves ── */
.promo-card--split {
  display: flex;
  flex-direction: column;
}

.promo-card--split .promo-slot {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.promo-card--split .promo-slot + .promo-slot {
  border-top: 1px dashed var(--border-color);
}

.promo-card--split .promo-slot__icon-area {
  aspect-ratio: auto;
  padding: 0.75rem 1rem 0.25rem;
  justify-content: flex-start;
  flex-direction: row;
  gap: 0.5rem;
}

/* ── Icon area ── */
.promo-slot__icon-area {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 0.5rem;
  background: var(--bg-secondary);
  color: var(--text-auxiliary);
  position: relative;
  padding: 1.5rem 1rem;
}

.promo-slot__emoji {
  font-size: 2.25rem;
  line-height: 1;
}

.promo-slot__svg {
  flex-shrink: 0;
}

.promo-card--split .promo-slot__emoji {
  font-size: 1.5rem;
}

.promo-card--split .promo-slot__svg {
  width: 28px;
  height: 28px;
}

.promo-slot__badge {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--color-primary);
  background: var(--bg-primary);
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  white-space: nowrap;
}

/* ── Content area ── */
.promo-slot__content {
  padding: 1rem 1.2rem 1.2rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
}

.promo-card--split .promo-slot__content {
  padding: 0.4rem 1rem 0.75rem;
}

.promo-slot__title {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  line-height: 1.35;
}

.promo-slot--single .promo-slot__title {
  font-size: var(--font-size-base);
}

.promo-slot__desc {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  line-height: 1.4;
}

/* ── Actions ── */
.promo-slot__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: auto;
  padding-top: 0.25rem;
}

.promo-btn {
  padding: 0.5rem 0.9rem;
  border-radius: var(--border-radius);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  min-height: 44px;
  cursor: pointer;
  transition: opacity var(--transition-fast);
  flex: 1;
  text-align: center;
}

.promo-btn--primary {
  background: var(--color-primary);
  color: var(--color-white);
}

@media (hover: hover) {
  .promo-btn--primary:hover {
    opacity: 0.88;
  }
}

.promo-btn--outline {
  border: 1px solid var(--color-primary);
  color: var(--color-primary);
  background: transparent;
}

@media (hover: hover) {
  .promo-btn--outline:hover {
    background: var(--color-primary);
    color: var(--color-white);
  }
}

/* ── Variant: primary — for expand area ── */
.promo-slot--primary .promo-slot__icon-area {
  background: var(--color-primary);
  color: var(--color-white);
}

.promo-slot--primary .promo-slot__badge {
  background: rgba(255, 255, 255, 0.2);
  color: var(--color-white);
}

/* ── Variant: gold — for hidden vehicles ── */
.promo-slot--gold .promo-slot__icon-area {
  background: linear-gradient(135deg, #fffbeb 0%, #fde68a 50%, #fcd34d 100%);
  color: #78350f;
}

.promo-slot--gold .promo-slot__badge {
  background: #f59e0b;
  color: #fff;
  font-weight: var(--font-weight-bold);
}

/* Gold card: amber-tinted border, slightly more prominent icon */
.promo-card--primary-gold {
  border: 2px solid rgba(245, 158, 11, 0.4);
}

.promo-card--primary-gold .promo-slot--gold .promo-slot__icon-area {
  min-height: 64px;
  padding: 0.9rem 1rem;
}

.promo-card--primary-gold .promo-slot--gold .promo-slot__svg {
  width: 32px;
  height: 32px;
}

/* ── Variant: accent — for similar searches ── */
.promo-slot--accent .promo-slot__icon-area {
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
  color: #166534;
}

.promo-slot--accent .promo-slot__badge {
  background: #dcfce7;
  color: #166534;
}

/* ── Responsive ── */
@media (min-width: 480px) {
  .promo-btn {
    flex: 0 auto;
  }
}

@media (min-width: 768px) {
  .promo-slot--single .promo-slot__icon-area {
    padding: 2rem 1.5rem;
  }

  .promo-slot--single .promo-slot__content {
    padding: 1.2rem 1.3rem;
  }
}
</style>

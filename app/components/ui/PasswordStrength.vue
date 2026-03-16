<script setup lang="ts">
const props = defineProps<{
  password: string
}>()

const { t } = useI18n()

type Strength = 'empty' | 'weak' | 'medium' | 'strong'

interface StrengthInfo {
  level: Strength
  score: number
  label: string
}

const strength = computed<StrengthInfo>(() => {
  const pw = props.password
  if (!pw) return { level: 'empty', score: 0, label: '' }

  let score = 0
  if (pw.length >= 8) score++
  if (pw.length >= 12) score++
  if (/[A-Z]/.test(pw)) score++
  if (/\d/.test(pw)) score++
  if (/[^A-Z0-9]/i.test(pw)) score++

  if (score <= 2) return { level: 'weak', score, label: t('auth.passwordWeak') }
  if (score <= 3) return { level: 'medium', score, label: t('auth.passwordMedium') }
  return { level: 'strong', score, label: t('auth.passwordStrong') }
})
</script>

<template>
  <div
    v-if="password.length"
    class="password-strength"
    role="status"
    aria-live="polite"
    :aria-label="`${$t('auth.passwordStrength')}: ${strength.label}`"
  >
    <div class="strength-bars" aria-hidden="true">
      <span
        class="strength-bar"
        :class="{ active: strength.score >= 1, [`bar--${strength.level}`]: strength.score >= 1 }"
      />
      <span
        class="strength-bar"
        :class="{ active: strength.score >= 3, [`bar--${strength.level}`]: strength.score >= 3 }"
      />
      <span
        class="strength-bar"
        :class="{ active: strength.score >= 5, [`bar--${strength.level}`]: strength.score >= 5 }"
      />
    </div>
    <span class="strength-label" :class="`label--${strength.level}`">{{ strength.label }}</span>
  </div>
</template>

<style scoped>
.password-strength {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  margin-top: var(--spacing-2);
}

.strength-bars {
  display: flex;
  gap: var(--spacing-1);
  flex: 1;
}

.strength-bar {
  flex: 1;
  height: 0.25rem;
  border-radius: var(--border-radius-full);
  background: var(--bg-tertiary);
  transition: background var(--transition-fast);
}

.strength-bar.active.bar--weak {
  background: var(--color-error);
}

.strength-bar.active.bar--medium {
  background: var(--color-warning, #f59e0b);
}

.strength-bar.active.bar--strong {
  background: var(--color-success);
}

.strength-label {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  white-space: nowrap;
}

.label--weak {
  color: var(--color-error);
}

.label--medium {
  color: var(--color-warning, #f59e0b);
}

.label--strong {
  color: var(--color-success);
}
</style>

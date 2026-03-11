<template>
  <div class="verification-disclaimer">
    <p class="disclaimer-text">
      {{ t('verification.kmScore.disclaimer') }}
    </p>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()
</script>

<style scoped>
.verification-disclaimer {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color-light);
  border-radius: var(--border-radius);
  padding: var(--spacing-3) var(--spacing-4);
  margin-top: var(--spacing-3);
}

.disclaimer-text {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  line-height: var(--line-height-relaxed);
  margin: 0;
}
</style>

<template>
  <div class="disclaimers-section">
    <h2 class="section-heading">{{ $t('auction.disclaimersTitle') }}</h2>
    <ul class="disclaimers-list">
      <li>{{ $t('auction.disclaimerAsIs') }}</li>
      <li>{{ $t('auction.disclaimerPremium') }}</li>
      <li>{{ $t('auction.disclaimerBinding') }}</li>
      <li>{{ $t('auction.disclaimerDeposit') }}</li>
      <li>{{ $t('auction.disclaimerInspection') }}</li>
    </ul>
  </div>
</template>

<script setup lang="ts">
// No props or emits — uses $t() directly
</script>

<style scoped>
.disclaimers-section {
  background: var(--color-gray-50);
  border: 1px solid var(--border-color-light);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-4);
}

.section-heading {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin-bottom: var(--spacing-4);
}

.disclaimers-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

.disclaimers-list li {
  position: relative;
  padding-left: var(--spacing-5);
  font-size: var(--font-size-xs);
  color: var(--text-auxiliary);
  line-height: var(--line-height-relaxed);
}

.disclaimers-list li::before {
  content: '';
  position: absolute;
  left: 0;
  top: 6px;
  width: 6px;
  height: 6px;
  border-radius: var(--border-radius-full);
  background: var(--color-warning);
}

@media (min-width: 768px) {
  .disclaimers-section {
    padding: var(--spacing-6);
  }
}

@media (min-width: 1024px) {
  .disclaimers-list li {
    font-size: var(--font-size-sm);
  }
}
</style>

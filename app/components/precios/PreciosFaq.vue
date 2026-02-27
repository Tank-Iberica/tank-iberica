<script setup lang="ts">
import type { FaqItem } from '~/composables/usePrecios'

defineProps<{
  faqs: FaqItem[]
  openIndex: number | null
}>()

const emit = defineEmits<{
  (e: 'toggle', index: number): void
}>()
</script>

<template>
  <section class="faq-section">
    <h2 class="faq-title">{{ $t('pricing.faqTitle') }}</h2>
    <div class="faq-list">
      <div
        v-for="(faq, idx) in faqs"
        :key="idx"
        class="faq-item"
        :class="{ 'faq-item--open': openIndex === idx }"
      >
        <button class="faq-question" @click="emit('toggle', idx)">
          <span>{{ faq.question }}</span>
          <span class="faq-icon" aria-hidden="true">{{ openIndex === idx ? '\u2212' : '+' }}</span>
        </button>
        <div v-if="openIndex === idx" class="faq-answer">
          <p>{{ faq.answer }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.faq-section {
  max-width: 800px;
  margin: 0 auto;
}

.faq-title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
  text-align: center;
  margin-bottom: var(--spacing-6);
}

.faq-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

.faq-item {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-md);
  overflow: hidden;
  transition: border-color var(--transition-fast);
}

.faq-item--open {
  border-color: var(--color-primary);
}

.faq-question {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-4) var(--spacing-5);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
  text-align: left;
  background: transparent;
  cursor: pointer;
  min-height: 44px;
  min-width: auto;
  gap: var(--spacing-3);
  transition: background var(--transition-fast);
}

.faq-question:hover {
  background: var(--color-gray-50);
}

.faq-icon {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
  flex-shrink: 0;
  line-height: 1;
}

.faq-answer {
  padding: 0 var(--spacing-5) var(--spacing-5);
}

.faq-answer p {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  line-height: var(--line-height-relaxed);
}

@media (min-width: 768px) {
  .faq-title {
    font-size: var(--font-size-2xl);
  }
}
</style>

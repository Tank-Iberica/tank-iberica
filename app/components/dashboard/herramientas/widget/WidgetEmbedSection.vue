<script setup lang="ts">
defineProps<{
  embedCode: string
  copySuccess: boolean
}>()

const emit = defineEmits<{
  (e: 'copy'): void
}>()

const { t } = useI18n()
</script>

<template>
  <section class="card">
    <h2 class="card-title">{{ t('dashboard.widget.embedCode') }}</h2>

    <textarea :value="embedCode" readonly class="code-textarea" rows="4" />

    <div class="code-footer">
      <button class="btn-copy" :class="{ success: copySuccess }" @click="emit('copy')">
        {{ copySuccess ? t('dashboard.widget.copied') : t('dashboard.widget.copyCode') }}
      </button>
    </div>

    <div class="instructions">
      <h3>{{ t('dashboard.widget.instructionsTitle') }}</h3>
      <ol>
        <li>{{ t('dashboard.widget.step1') }}</li>
        <li>{{ t('dashboard.widget.step2') }}</li>
        <li>{{ t('dashboard.widget.step3') }}</li>
      </ol>
    </div>
  </section>
</template>

<style scoped>
.card {
  background: var(--bg-primary);
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  padding: 20px;
}

.card-title {
  margin: 0 0 16px 0;
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--text-primary);
}

.code-textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid var(--color-gray-200);
  border-radius: 8px;
  font-family: 'Courier New', Courier, monospace;
  font-size: 0.85rem;
  color: var(--text-primary);
  background: var(--bg-secondary);
  resize: vertical;
  box-sizing: border-box;
  line-height: 1.5;
}

.code-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}

.btn-copy {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 10px 24px;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-copy:hover {
  background: var(--color-primary-dark);
}

.btn-copy.success {
  background: var(--color-success);
}

.instructions {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid var(--color-gray-100);
}

.instructions h3 {
  margin: 0 0 12px 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-primary);
}

.instructions ol {
  margin: 0;
  padding-left: 20px;
  color: var(--text-secondary);
  font-size: 0.9rem;
  line-height: 1.8;
}
</style>

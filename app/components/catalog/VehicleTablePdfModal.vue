<script setup lang="ts">
defineProps<{
  open: boolean
  selectedCount: number
  totalCount: number
}>()

const emit = defineEmits<{
  close: []
  selectAll: []
  confirm: []
}>()
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="pdf-modal-overlay" @click.self="emit('close')">
      <div class="pdf-modal">
        <div class="pdf-modal-icon">
          <svg
            viewBox="0 0 24 24"
            width="40"
            height="40"
            fill="none"
            stroke="var(--color-danger)"
            stroke-width="1.5"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        </div>
        <h3 class="pdf-modal-title">{{ $t('catalog.exportPdf') }}</h3>
        <p class="pdf-modal-message">{{ $t('catalog.exportPdfMessage') }}</p>
        <p class="pdf-modal-count">{{ selectedCount }} / {{ totalCount }}</p>
        <div class="pdf-modal-actions">
          <button class="pdf-btn pdf-btn-back" @click="emit('close')">
            {{ $t('catalog.back') }}
          </button>
          <button class="pdf-btn pdf-btn-select-all" @click="emit('selectAll')">
            {{ $t('catalog.selectAll') }}
          </button>
          <button
            class="pdf-btn pdf-btn-confirm"
            :disabled="selectedCount === 0"
            @click="emit('confirm')"
          >
            {{ $t('catalog.confirm') }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.pdf-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.pdf-modal {
  background: var(--bg-primary, white);
  border-radius: var(--border-radius-lg);
  padding: 2rem;
  max-width: 25rem;
  width: 100%;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
}

.pdf-modal-icon {
  margin-bottom: 1rem;
}

.pdf-modal-title {
  font-size: var(--font-size-lg);
  font-weight: 700;
  color: var(--color-primary);
  margin: 0 0 0.5rem;
}

.pdf-modal-message {
  font-size: var(--font-size-base);
  color: var(--text-secondary, var(--color-gray-500));
  margin: 0 0 0.5rem;
  line-height: 1.5;
}

.pdf-modal-count {
  font-size: var(--font-size-xl);
  font-weight: 700;
  color: var(--color-primary);
  margin: 0 0 1.5rem;
}

.pdf-modal-actions {
  display: flex;
  gap: 0.5rem;
}

.pdf-btn {
  flex: 1;
  padding: 0.75rem 0.5rem;
  border-radius: var(--border-radius);
  font-size: var(--font-size-sm);
  font-weight: 600;
  cursor: pointer;
  border: 1.5px solid transparent;
  transition: all 0.2s;
  min-height: 2.75rem;
}

.pdf-btn-back {
  background: transparent;
  border-color: var(--border-color, var(--color-gray-300));
  color: var(--text-secondary, var(--color-gray-500));
}

.pdf-btn-back:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.pdf-btn-select-all {
  background: transparent;
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.pdf-btn-select-all:hover {
  background: rgba(35, 66, 74, 0.05);
}

.pdf-btn-confirm {
  background: linear-gradient(135deg, var(--color-danger) 0%, #a01830 100%);
  color: white;
  border-color: transparent;
}

.pdf-btn-confirm:hover:not(:disabled) {
  opacity: 0.9;
  transform: translateY(-1px);
}

.pdf-btn-confirm:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

(@media ()max-width: 29.9375em())) {
  .pdf-modal {
    padding: 1.5rem;
  }

  .pdf-modal-actions {
    flex-direction: column;
  }
}
</style>

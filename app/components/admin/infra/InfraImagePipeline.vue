<template>
  <div class="section-block">
    <h2 class="section-heading">
      {{ $t('admin.infra.imagePipeline', 'Pipeline de imagenes') }}
    </h2>
    <div class="pipeline-grid">
      <div class="pipeline-card">
        <span class="pipeline-label">{{ $t('admin.infra.pipelineMode', 'Modo actual') }}</span>
        <span class="pipeline-value">{{ pipelineMode }}</span>
      </div>
      <div class="pipeline-card">
        <span class="pipeline-label">{{
          $t('admin.infra.cloudinaryOnly', 'Solo Cloudinary')
        }}</span>
        <span class="pipeline-value">{{ cloudinaryOnlyCount }}</span>
      </div>
      <div class="pipeline-card">
        <span class="pipeline-label">{{ $t('admin.infra.cfImagesCount', 'CF Images') }}</span>
        <span class="pipeline-value">{{ cfImagesCount }}</span>
      </div>
    </div>
    <div class="pipeline-actions">
      <button class="btn-primary" :disabled="migratingImages" @click="$emit('migrate-images')">
        {{
          migratingImages
            ? $t('admin.infra.migrating', 'Migrando...')
            : $t('admin.infra.migrateImages', 'Migrar imagenes pendientes')
        }}
      </button>
      <button
        class="btn-secondary"
        :disabled="configuringVariants"
        @click="$emit('setup-cf-variants')"
      >
        {{
          configuringVariants
            ? $t('admin.infra.configuring', 'Configurando...')
            : $t('admin.infra.setupVariants', 'Configurar variantes CF')
        }}
      </button>
    </div>
    <div v-if="pipelineMessage" class="pipeline-message" :class="pipelineMessageType">
      {{ pipelineMessage }}
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  pipelineMode: string
  cloudinaryOnlyCount: number
  cfImagesCount: number
  migratingImages: boolean
  configuringVariants: boolean
  pipelineMessage: string
  pipelineMessageType: 'success' | 'error'
}

defineProps<Props>()

defineEmits<{
  'migrate-images': []
  'setup-cf-variants': []
}>()

const { t: $t } = useI18n()
</script>

<style scoped>
.section-block {
  padding: var(--spacing-4);
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-md);
}

.section-heading {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: 0 0 var(--spacing-4) 0;
}

.pipeline-grid {
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  gap: var(--spacing-3);
  margin-bottom: var(--spacing-4);
}

@media (min-width: 480px) {
  .pipeline-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

.pipeline-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--spacing-3);
  background: var(--bg-secondary);
  border-radius: var(--border-radius);
  text-align: center;
}

.pipeline-label {
  font-size: var(--font-size-xs);
  color: var(--text-auxiliary);
  font-weight: var(--font-weight-medium);
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.pipeline-value {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  margin-top: var(--spacing-1);
}

.pipeline-actions {
  display: flex;
  gap: var(--spacing-3);
  flex-wrap: wrap;
}

.pipeline-message {
  margin-top: var(--spacing-3);
  padding: var(--spacing-3);
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-sm);
}

.pipeline-message.success {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  color: #166534;
}

.pipeline-message.error {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #991b1b;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-3) var(--spacing-5);
  background: var(--color-primary);
  color: var(--color-white);
  border: none;
  border-radius: var(--border-radius);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: background var(--transition-fast);
  min-height: 44px;
  min-width: 44px;
}

.btn-primary:hover {
  background: var(--color-primary-dark);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-3) var(--spacing-5);
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all var(--transition-fast);
  min-height: 44px;
  min-width: 44px;
}

.btn-secondary:hover {
  background: var(--bg-tertiary);
}

.btn-secondary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>

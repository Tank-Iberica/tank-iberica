<template>
  <Teleport to="body">
    <div class="wizard-overlay" @click.self="$emit('close')">
      <div class="wizard-modal">
        <div class="wizard-header">
          <h3 class="wizard-title">
            {{ $t('admin.infra.migrationWizard', 'Asistente de migracion') }}
          </h3>
          <button class="wizard-close" @click="$emit('close')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <!-- Step indicator -->
        <div class="wizard-steps-indicator">
          <div
            v-for="(step, idx) in wizardStepLabels"
            :key="idx"
            class="wizard-step-dot"
            :class="{ active: wizardStep === idx, completed: wizardStep > idx }"
          >
            <span class="step-number">{{ idx + 1 }}</span>
            <span class="step-label">{{ step }}</span>
          </div>
        </div>

        <!-- Step 0: Select vertical -->
        <div v-if="wizardStep === 0" class="wizard-body">
          <label class="wizard-label">
            {{ $t('admin.infra.selectVertical', 'Seleccionar vertical a migrar') }}
          </label>
          <select :value="wizardVertical" class="wizard-select" @change="updateVertical">
            <option value="">
              {{ $t('admin.infra.chooseVertical', '-- Seleccionar --') }}
            </option>
            <option v-for="v in allVerticalsInClusters" :key="v" :value="v">
              {{ v }}
            </option>
          </select>
          <div v-if="wizardVertical" class="wizard-info">
            {{ $t('admin.infra.sourceCluster', 'Cluster origen') }}:
            <strong>{{ sourceClusterForVertical }}</strong>
          </div>
        </div>

        <!-- Step 1: Select target cluster -->
        <div v-if="wizardStep === 1" class="wizard-body">
          <label class="wizard-label">
            {{ $t('admin.infra.selectTarget', 'Seleccionar cluster destino') }}
          </label>
          <select :value="wizardTargetCluster" class="wizard-select" @change="updateTargetCluster">
            <option value="">{{ $t('admin.infra.chooseTarget', '-- Seleccionar --') }}</option>
            <option v-for="c in targetClusterOptions" :key="c.id" :value="c.id">
              {{ c.name }} ({{ c.weight_used }}/{{ c.weight_limit }})
            </option>
            <option value="__new__">
              {{ $t('admin.infra.createNew', '+ Crear nuevo cluster') }}
            </option>
          </select>
          <div v-if="wizardTargetCluster === '__new__'" class="wizard-info wizard-new-cluster-info">
            <p>
              {{ $t('admin.infra.newClusterInstructions', 'Para crear un nuevo cluster:') }}
            </p>
            <ol>
              <li>
                {{ $t('admin.infra.newCluster1', 'Crear nuevo proyecto en Supabase Dashboard') }}
              </li>
              <li>{{ $t('admin.infra.newCluster2', 'Ejecutar migraciones SQL base') }}</li>
              <li>
                {{ $t('admin.infra.newCluster3', 'Registrar el cluster en infra_clusters') }}
              </li>
              <li>
                {{ $t('admin.infra.newCluster4', 'Volver aqui para continuar la migracion') }}
              </li>
            </ol>
          </div>
        </div>

        <!-- Step 2: Review migration plan -->
        <div v-if="wizardStep === 2" class="wizard-body">
          <h4 class="wizard-subtitle">
            {{ $t('admin.infra.reviewPlan', 'Plan de migracion') }}
          </h4>
          <div class="review-grid">
            <div class="review-item">
              <span class="review-label">{{ $t('admin.infra.vertical', 'Vertical') }}</span>
              <span class="review-value">{{ wizardVertical }}</span>
            </div>
            <div class="review-item">
              <span class="review-label">{{ $t('admin.infra.source', 'Origen') }}</span>
              <span class="review-value">{{ sourceClusterForVertical }}</span>
            </div>
            <div class="review-item">
              <span class="review-label">{{ $t('admin.infra.target', 'Destino') }}</span>
              <span class="review-value">{{ targetClusterName }}</span>
            </div>
          </div>
          <div class="review-tables">
            <h5>{{ $t('admin.infra.tablesToMigrate', 'Tablas a migrar') }}</h5>
            <ul class="tables-list">
              <li>vehicles</li>
              <li>vehicle_images</li>
              <li>categories</li>
              <li>subcategories</li>
              <li>filters / filter_options</li>
              <li>content_translations</li>
              <li>users (vertical-scoped)</li>
              <li>vertical_config</li>
            </ul>
          </div>
          <div class="review-warnings">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              class="warning-icon"
            >
              <path
                d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
              />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <span>{{
              $t(
                'admin.infra.migrationWarning',
                'La migracion puede tardar varios minutos. No cerrar esta ventana durante el proceso.',
              )
            }}</span>
          </div>
        </div>

        <!-- Step 3: Execute -->
        <div v-if="wizardStep === 3" class="wizard-body">
          <div v-if="!wizardExecuting && !wizardComplete" class="execute-confirmation">
            <label class="confirm-check">
              <input :checked="wizardConfirmed" type="checkbox" @change="updateConfirmed" >
              <span>{{
                $t('admin.infra.confirmMigration', 'Confirmo que quiero ejecutar esta migracion')
              }}</span>
            </label>
            <button
              class="btn-primary btn-execute"
              :disabled="!wizardConfirmed || wizardExecuting"
              @click="$emit('execute-migration')"
            >
              {{ $t('admin.infra.execute', 'Ejecutar migracion') }}
            </button>
          </div>
          <div v-if="wizardExecuting" class="executing-state">
            <div class="infra-spinner" />
            <span>{{ $t('admin.infra.executing', 'Ejecutando migracion...') }}</span>
            <div class="progress-bar-container wizard-progress">
              <div
                class="progress-bar-fill progress-green"
                :style="{ width: wizardProgress + '%' }"
              />
            </div>
            <span class="progress-text">{{ wizardProgress }}%</span>
          </div>
        </div>

        <!-- Step 4: Result -->
        <div v-if="wizardStep === 4" class="wizard-body">
          <div v-if="wizardResult === 'success'" class="result-success">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              class="result-icon"
            >
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <h4>{{ $t('admin.infra.migrationSuccess', 'Migracion completada') }}</h4>
            <p>
              {{
                $t(
                  'admin.infra.migrationSuccessMsg',
                  'La vertical se ha migrado correctamente al cluster destino.',
                )
              }}
            </p>
            <div class="result-next-steps">
              <h5>{{ $t('admin.infra.nextSteps', 'Proximos pasos') }}:</h5>
              <ol>
                <li>
                  {{ $t('admin.infra.step1Done', 'Verificar datos en el nuevo cluster') }}
                </li>
                <li>
                  {{ $t('admin.infra.step2Done', 'Actualizar DNS / env vars si necesario') }}
                </li>
                <li>
                  {{ $t('admin.infra.step3Done', 'Monitorizar rendimiento durante 24h') }}
                </li>
              </ol>
            </div>
          </div>
          <div v-else class="result-error">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              class="result-icon result-icon-error"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            <h4>{{ $t('admin.infra.migrationFailed', 'Error en la migracion') }}</h4>
            <p>{{ wizardErrorMessage }}</p>
          </div>
        </div>

        <!-- Wizard footer -->
        <div class="wizard-footer">
          <button
            v-if="wizardStep > 0 && wizardStep < 4 && !wizardExecuting"
            class="btn-secondary"
            @click="$emit('update:wizard-step', wizardStep - 1)"
          >
            {{ $t('admin.infra.back', 'Atras') }}
          </button>
          <div class="wizard-footer-spacer" />
          <button
            v-if="wizardStep < 3 && canAdvanceWizard"
            class="btn-primary"
            @click="$emit('update:wizard-step', wizardStep + 1)"
          >
            {{ $t('admin.infra.next', 'Siguiente') }}
          </button>
          <button v-if="wizardStep === 4" class="btn-primary" @click="$emit('close')">
            {{ $t('admin.infra.close', 'Cerrar') }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import type { InfraCluster } from '~/composables/useInfraMetrics'

interface Props {
  clusters: InfraCluster[]
  wizardStep: number
  wizardVertical: string
  wizardTargetCluster: string
  wizardConfirmed: boolean
  wizardExecuting: boolean
  wizardComplete: boolean
  wizardProgress: number
  wizardResult: 'success' | 'error'
  wizardErrorMessage: string
  getStatusColor: (percent: number | null) => 'green' | 'yellow' | 'red' | 'gray'
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  'update:wizard-step': [step: number]
  'update:wizard-vertical': [vertical: string]
  'update:wizard-target-cluster': [cluster: string]
  'update:wizard-confirmed': [confirmed: boolean]
  'execute-migration': []
}>()

const { t: $t } = useI18n()

const wizardStepLabels = computed(() => [
  $t('admin.infra.wizStep1', 'Vertical'),
  $t('admin.infra.wizStep2', 'Destino'),
  $t('admin.infra.wizStep3', 'Revisar'),
  $t('admin.infra.wizStep4', 'Ejecutar'),
  $t('admin.infra.wizStep5', 'Resultado'),
])

const allVerticalsInClusters = computed(() => {
  const verticals: string[] = []
  for (const c of props.clusters) {
    for (const v of c.verticals) {
      if (!verticals.includes(v)) verticals.push(v)
    }
  }
  return verticals
})

const sourceClusterForVertical = computed(() => {
  if (!props.wizardVertical) return ''
  const c = props.clusters.find((cl) => cl.verticals.includes(props.wizardVertical))
  return c?.name || ''
})

const targetClusterOptions = computed(() => {
  const sourceCluster = props.clusters.find((cl) => cl.verticals.includes(props.wizardVertical))
  return props.clusters.filter((c) => c.id !== sourceCluster?.id && c.status !== 'full')
})

const targetClusterName = computed(() => {
  if (props.wizardTargetCluster === '__new__') {
    return $t('admin.infra.newCluster', 'Nuevo cluster')
  }
  const c = props.clusters.find((cl) => cl.id === props.wizardTargetCluster)
  return c?.name || ''
})

const canAdvanceWizard = computed(() => {
  switch (props.wizardStep) {
    case 0:
      return !!props.wizardVertical
    case 1:
      return !!props.wizardTargetCluster && props.wizardTargetCluster !== '__new__'
    case 2:
      return true
    default:
      return false
  }
})

function updateVertical(e: Event) {
  const target = e.target as HTMLSelectElement
  emit('update:wizard-vertical', target.value)
}

function updateTargetCluster(e: Event) {
  const target = e.target as HTMLSelectElement
  emit('update:wizard-target-cluster', target.value)
}

function updateConfirmed(e: Event) {
  const target = e.target as HTMLInputElement
  emit('update:wizard-confirmed', target.checked)
}
</script>

<style scoped>
.wizard-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--z-modal);
  padding: var(--spacing-4);
}

.wizard-modal {
  background: var(--bg-primary);
  border-radius: var(--border-radius-lg);
  width: 100%;
  max-width: 640px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: var(--shadow-xl);
  display: flex;
  flex-direction: column;
}

.wizard-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-4) var(--spacing-5);
  border-bottom: 1px solid var(--border-color);
}

.wizard-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: 0;
}

.wizard-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  background: none;
  border: none;
  color: var(--text-auxiliary);
  cursor: pointer;
  border-radius: var(--border-radius);
  transition: background var(--transition-fast);
}

.wizard-close:hover {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.wizard-close svg {
  width: 20px;
  height: 20px;
}

.wizard-steps-indicator {
  display: flex;
  justify-content: space-between;
  padding: var(--spacing-4) var(--spacing-5);
  border-bottom: 1px solid var(--border-color-light);
  gap: var(--spacing-2);
  overflow-x: auto;
}

.wizard-step-dot {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-1);
  flex: 1;
  min-width: 0;
}

.step-number {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  background: var(--bg-tertiary);
  color: var(--text-auxiliary);
  flex-shrink: 0;
}

.wizard-step-dot.active .step-number {
  background: var(--color-primary);
  color: var(--color-white);
}

.wizard-step-dot.completed .step-number {
  background: var(--color-success);
  color: var(--color-white);
}

.step-label {
  font-size: 10px;
  color: var(--text-auxiliary);
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 80px;
}

.wizard-step-dot.active .step-label {
  color: var(--color-primary);
  font-weight: var(--font-weight-medium);
}

.wizard-body {
  padding: var(--spacing-5);
  flex: 1;
}

.wizard-label {
  display: block;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
  margin-bottom: var(--spacing-3);
}

.wizard-select {
  width: 100%;
  padding: var(--spacing-3);
  border: 2px solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: var(--font-size-base);
  color: var(--text-primary);
  background: var(--bg-primary);
  min-height: 44px;
}

.wizard-select:focus {
  border-color: var(--color-primary);
  outline: none;
  box-shadow: 0 0 0 3px rgba(35, 66, 74, 0.1);
}

.wizard-info {
  margin-top: var(--spacing-3);
  padding: var(--spacing-3);
  background: var(--bg-secondary);
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.wizard-new-cluster-info {
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  color: #1e40af;
}

.wizard-new-cluster-info ol {
  margin: var(--spacing-2) 0 0 var(--spacing-4);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
}

.wizard-new-cluster-info li {
  font-size: var(--font-size-sm);
}

.wizard-subtitle {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: 0 0 var(--spacing-4) 0;
}

.review-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-3);
  margin-bottom: var(--spacing-4);
}

@media (min-width: 480px) {
  .review-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

.review-item {
  padding: var(--spacing-3);
  background: var(--bg-secondary);
  border-radius: var(--border-radius-sm);
  text-align: center;
}

.review-label {
  display: block;
  font-size: var(--font-size-xs);
  color: var(--text-auxiliary);
  text-transform: uppercase;
  letter-spacing: 0.3px;
  margin-bottom: var(--spacing-1);
}

.review-value {
  display: block;
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
}

.review-tables {
  margin-bottom: var(--spacing-4);
}

.review-tables h5 {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-secondary);
  margin: 0 0 var(--spacing-2) 0;
}

.tables-list {
  margin: 0;
  padding: 0 0 0 var(--spacing-4);
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
}

.tables-list li {
  font-family: monospace;
  font-size: var(--font-size-xs);
}

.review-warnings {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-3);
  padding: var(--spacing-3);
  background: #fefce8;
  border: 1px solid #fde68a;
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-sm);
  color: #92400e;
}

.warning-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  margin-top: 1px;
}

.execute-confirmation {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
  align-items: flex-start;
}

.confirm-check {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  cursor: pointer;
}

.confirm-check input[type='checkbox'] {
  width: 20px;
  height: 20px;
  min-height: auto;
  accent-color: var(--color-primary);
  cursor: pointer;
}

.btn-execute {
  width: 100%;
}

.executing-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-3);
  padding: var(--spacing-6) 0;
  text-align: center;
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
}

.infra-spinner {
  width: 24px;
  height: 24px;
  border: 3px solid var(--border-color);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.wizard-progress {
  width: 100%;
  max-width: 300px;
  height: 10px;
}

.progress-bar-container {
  height: 8px;
  background: var(--bg-tertiary);
  border-radius: 4px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.6s ease;
}

.progress-green {
  background: var(--color-success);
}

.progress-text {
  font-weight: var(--font-weight-semibold);
  color: var(--color-primary);
}

.result-success,
.result-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: var(--spacing-3);
  padding: var(--spacing-4) 0;
}

.result-icon {
  width: 48px;
  height: 48px;
  color: var(--color-success);
}

.result-icon-error {
  color: var(--color-error);
}

.result-success h4,
.result-error h4 {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  margin: 0;
}

.result-success p,
.result-error p {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin: 0;
}

.result-next-steps {
  text-align: left;
  width: 100%;
  padding: var(--spacing-4);
  background: var(--bg-secondary);
  border-radius: var(--border-radius);
  margin-top: var(--spacing-2);
}

.result-next-steps h5 {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: 0 0 var(--spacing-2) 0;
}

.result-next-steps ol {
  margin: 0;
  padding: 0 0 0 var(--spacing-4);
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
}

.wizard-footer {
  display: flex;
  align-items: center;
  padding: var(--spacing-4) var(--spacing-5);
  border-top: 1px solid var(--border-color);
  gap: var(--spacing-3);
}

.wizard-footer-spacer {
  flex: 1;
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

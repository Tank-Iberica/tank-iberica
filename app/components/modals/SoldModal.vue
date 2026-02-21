<script setup lang="ts">
/**
 * SoldModal - Post-sale flow with service cross-sell
 * Step 1: Congratulations + sold via Tracciona?
 * Step 2: Cross-sell services (transport, transfer, insurance, contract)
 * Step 3: Confirmation + publish another vehicle
 */

interface Props {
  vehicleId: string
  vehicleTitle: string
  modelValue: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  sold: []
}>()

const { t } = useI18n()
const supabase = useSupabaseClient()
const { userId } = useAuth()

const step = ref(1)
const soldViaTracciona = ref<boolean | null>(null)
const selectedServices = ref<string[]>([])
const submitting = ref(false)
const error = ref<string | null>(null)

const services = [
  {
    key: 'transport',
    icon: '🚛',
    priceLabel: t('dashboard.sold.crossSell.transportPrice'),
  },
  {
    key: 'transfer',
    icon: '📄',
    priceLabel: '250€',
  },
  {
    key: 'insurance',
    icon: '🛡',
    priceLabel: t('dashboard.sold.crossSell.insurancePrice'),
  },
  {
    key: 'contract',
    icon: '📋',
    priceLabel: t('dashboard.sold.crossSell.contractPrice'),
  },
]

function close() {
  emit('update:modelValue', false)
}

function goToStep2() {
  if (soldViaTracciona.value === null) return
  step.value = 2
}

function goToStep3() {
  step.value = 3
}

function toggleService(serviceKey: string) {
  const index = selectedServices.value.indexOf(serviceKey)
  if (index > -1) {
    selectedServices.value.splice(index, 1)
  } else {
    selectedServices.value.push(serviceKey)
  }
}

async function confirm() {
  if (!userId.value) return

  submitting.value = true
  error.value = null

  try {
    // 1. Update vehicle status to sold and set sold_via_tracciona
    const { error: updateError } = await supabase
      .from('vehicles')
      .update({
        status: 'sold',
        sold_via_tracciona: soldViaTracciona.value,
      })
      .eq('id', props.vehicleId)

    if (updateError) throw updateError

    // 2. Insert service requests for selected services
    if (selectedServices.value.length > 0) {
      const serviceRequests = selectedServices.value.map((serviceKey) => ({
        type: serviceKey,
        vehicle_id: props.vehicleId,
        user_id: userId.value,
        status: 'pending',
        details: {},
      }))

      const { error: insertError } = await supabase.from('service_requests').insert(serviceRequests)

      if (insertError) throw insertError
    }

    // 3. Go to final step
    goToStep3()
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'Error marking vehicle as sold'
  } finally {
    submitting.value = false
  }
}

function done() {
  emit('sold')
  close()
  resetState()
}

function resetState() {
  step.value = 1
  soldViaTracciona.value = null
  selectedServices.value = []
  error.value = null
}

watch(
  () => props.modelValue,
  (isOpen) => {
    if (!isOpen) {
      resetState()
    }
  },
)
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="modelValue" class="modal-overlay" @click.self="close">
        <div class="modal-container">
          <button class="modal-close" :aria-label="t('common.close')" @click="close">✕</button>

          <!-- Step 1: Congratulations -->
          <div v-if="step === 1" class="modal-content">
            <div class="celebration-header">
              <span class="celebration-icon">🎉</span>
              <h2>{{ t('dashboard.sold.congratulations') }}</h2>
              <p class="vehicle-title">{{ vehicleTitle }}</p>
            </div>

            <div class="question-section">
              <p class="question-label">{{ t('dashboard.sold.soldViaTracciona') }}</p>
              <div class="radio-group">
                <label class="radio-option">
                  <input
                    v-model="soldViaTracciona"
                    type="radio"
                    name="soldViaTracciona"
                    :value="true"
                  >
                  <span>{{ t('dashboard.sold.yes') }}</span>
                </label>
                <label class="radio-option">
                  <input
                    v-model="soldViaTracciona"
                    type="radio"
                    name="soldViaTracciona"
                    :value="false"
                  >
                  <span>{{ t('dashboard.sold.no') }}</span>
                </label>
              </div>
            </div>

            <button class="btn-primary" :disabled="soldViaTracciona === null" @click="goToStep2">
              {{ t('common.continue') }}
            </button>
          </div>

          <!-- Step 2: Cross-sell services -->
          <div v-else-if="step === 2" class="modal-content">
            <h2>{{ t('dashboard.sold.crossSell.title') }}</h2>
            <p class="subtitle">{{ t('dashboard.sold.crossSell.subtitle') }}</p>

            <div v-if="error" class="alert-error">{{ error }}</div>

            <div class="services-grid">
              <label
                v-for="service in services"
                :key="service.key"
                class="service-card"
                :class="{ selected: selectedServices.includes(service.key) }"
              >
                <input
                  type="checkbox"
                  :value="service.key"
                  :checked="selectedServices.includes(service.key)"
                  @change="toggleService(service.key)"
                >
                <div class="service-icon">{{ service.icon }}</div>
                <h3>{{ t(`dashboard.sold.crossSell.${service.key}`) }}</h3>
                <p class="service-desc">
                  {{ t(`dashboard.sold.crossSell.${service.key}Desc`) }}
                </p>
                <span class="service-price">{{ service.priceLabel }}</span>
              </label>
            </div>

            <div class="modal-actions">
              <button class="btn-secondary" @click="step = 1">
                {{ t('common.back') }}
              </button>
              <button class="btn-primary" :disabled="submitting" @click="confirm">
                {{ submitting ? t('common.loading') : t('dashboard.sold.confirm') }}
              </button>
            </div>
          </div>

          <!-- Step 3: Confirmation -->
          <div v-else-if="step === 3" class="modal-content">
            <div class="celebration-header">
              <span class="celebration-icon">✅</span>
              <h2>{{ t('dashboard.sold.done') }}</h2>
            </div>

            <p class="confirmation-text">
              {{ t('dashboard.sold.confirmationMessage') }}
            </p>

            <div class="final-actions">
              <NuxtLink to="/dashboard/vehiculos/nuevo" class="btn-primary" @click="done">
                {{ t('dashboard.sold.publishAnother') }}
              </NuxtLink>
              <button class="btn-secondary" @click="done">
                {{ t('common.close') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 9999;
  padding: 0;
}

.modal-container {
  position: relative;
  background: white;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  border-radius: 16px 16px 0 0;
  box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.15);
}

.modal-close {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 44px;
  height: 44px;
  border: none;
  background: #f1f5f9;
  border-radius: 50%;
  font-size: 1.2rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
  z-index: 10;
}

.modal-close:hover {
  background: #e2e8f0;
}

.modal-content {
  padding: 48px 20px 24px 20px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.celebration-header {
  text-align: center;
}

.celebration-icon {
  font-size: 4rem;
  display: block;
  margin-bottom: 12px;
}

.celebration-header h2 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-primary, #23424a);
}

.vehicle-title {
  margin: 8px 0 0 0;
  font-size: 1rem;
  color: #64748b;
}

.question-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.question-label {
  font-size: 1rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

.radio-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.radio-option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  min-height: 44px;
}

.radio-option:has(input:checked) {
  border-color: var(--color-primary, #23424a);
  background: #f8fafc;
}

.radio-option input[type='radio'] {
  width: 20px;
  height: 20px;
  cursor: pointer;
}

.radio-option span {
  font-size: 1rem;
  font-weight: 500;
  color: #1e293b;
}

.subtitle {
  margin: -12px 0 0 0;
  color: #64748b;
  font-size: 0.95rem;
}

.services-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

.service-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.service-card input[type='checkbox'] {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 20px;
  height: 20px;
  cursor: pointer;
}

.service-card.selected {
  border-color: var(--color-primary, #23424a);
  background: #f8fafc;
}

.service-icon {
  font-size: 2rem;
}

.service-card h3 {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 600;
  color: #1e293b;
}

.service-desc {
  margin: 0;
  font-size: 0.85rem;
  color: #64748b;
  line-height: 1.4;
}

.service-price {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--color-primary, #23424a);
}

.alert-error {
  padding: 12px 16px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #dc2626;
  font-size: 0.9rem;
}

.modal-actions {
  display: flex;
  gap: 12px;
  flex-direction: column-reverse;
}

.btn-primary,
.btn-secondary {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 48px;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  border: none;
  text-decoration: none;
}

.btn-primary {
  background: var(--color-primary, #23424a);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #1a3238;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background: white;
  border: 1px solid #e2e8f0;
  color: #475569;
}

.btn-secondary:hover {
  background: #f8fafc;
}

.confirmation-text {
  text-align: center;
  color: #64748b;
  font-size: 1rem;
  margin: 0;
}

.final-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* Transition */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s;
}

.modal-enter-active .modal-container,
.modal-leave-active .modal-container {
  transition: transform 0.3s;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-container,
.modal-leave-to .modal-container {
  transform: translateY(100%);
}

/* Desktop styles */
@media (min-width: 768px) {
  .modal-overlay {
    align-items: center;
    padding: 24px;
  }

  .modal-container {
    width: 100%;
    max-width: 600px;
    max-height: 85vh;
    border-radius: 16px;
  }

  .modal-content {
    padding: 48px 40px 32px 40px;
  }

  .services-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .modal-actions {
    flex-direction: row;
    justify-content: flex-end;
  }

  .final-actions {
    flex-direction: row;
    justify-content: center;
  }

  .modal-enter-from .modal-container,
  .modal-leave-to .modal-container {
    transform: scale(0.9);
  }
}
</style>

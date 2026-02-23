<script setup lang="ts">
const props = defineProps<{
  modelValue: boolean
  vehicle: { id: string; title?: string; slug?: string }
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  completed: []
}>()

const { t: _t } = useI18n()
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const supabase = useSupabaseClient<any>()

const step = ref(1)
const isUpdating = ref(false)
const requestedServices = ref(new Set<string>())
const requestingService = ref('')
const linkCopied = ref(false)
const errorMsg = ref('')

function close() {
  emit('update:modelValue', false)
}

function handleBackdrop(e: MouseEvent) {
  if (e.target === e.currentTarget) close()
}

function handleKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape') close()
}

watch(
  () => props.modelValue,
  (val) => {
    if (val) {
      step.value = 1
      requestedServices.value = new Set()
      linkCopied.value = false
      errorMsg.value = ''
      document.body.style.overflow = 'hidden'
      document.addEventListener('keydown', handleKeyDown)
    } else {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', handleKeyDown)
    }
  },
)

async function markAsSold(viaPlatform: boolean) {
  isUpdating.value = true
  errorMsg.value = ''

  try {
    const { error } = await supabase
      .from('vehicles')
      .update({
        sold_via_tracciona: viaPlatform,
        sold_at: new Date().toISOString(),
        status: 'sold',
      })
      .eq('id', props.vehicle.id)

    if (error) throw error
    step.value = 2
  } catch (err) {
    errorMsg.value = err instanceof Error ? err.message : 'Error'
  } finally {
    isUpdating.value = false
  }
}

async function requestService(serviceType: string) {
  if (requestedServices.value.has(serviceType)) return
  requestingService.value = serviceType

  try {
    const { error } = await supabase.from('service_requests').insert({
      vehicle_id: props.vehicle.id,
      type: serviceType,
    })

    if (error) throw error
    requestedServices.value.add(serviceType)
  } catch (err) {
    errorMsg.value = err instanceof Error ? err.message : 'Error'
  } finally {
    requestingService.value = ''
  }
}

function goToStep3() {
  step.value = 3
}

function goToNewListing() {
  close()
  navigateTo('/admin/productos/nuevo')
}

function goToStep4() {
  step.value = 4
}

const shareUrl = computed(() => {
  if (typeof window === 'undefined') return ''
  return `${window.location.origin}/servicios-postventa?v=${props.vehicle.slug || ''}`
})

async function copyLink() {
  try {
    await navigator.clipboard.writeText(shareUrl.value)
    linkCopied.value = true
    setTimeout(() => {
      linkCopied.value = false
    }, 2500)
  } catch {
    /* Fallback: do nothing */
  }
}

function finish() {
  emit('completed')
  emit('update:modelValue', false)
}

const services = computed(() => [
  {
    type: 'transport',
    icon: '\uD83D\uDE9B',
    title: _t('postSale.transport'),
    desc: _t('postSale.transportDesc'),
    price: null,
  },
  {
    type: 'transfer',
    icon: '\uD83D\uDCC4',
    title: _t('postSale.transfer'),
    desc: _t('postSale.transferDesc'),
    price: _t('postSale.transferPrice'),
  },
  {
    type: 'insurance',
    icon: '\uD83D\uDEE1\uFE0F',
    title: _t('postSale.insurance'),
    desc: _t('postSale.insuranceDesc'),
    price: null,
  },
  {
    type: 'contract',
    icon: '\uD83D\uDCCB',
    title: _t('postSale.contract'),
    desc: _t('postSale.contractDesc'),
    price: _t('postSale.contractPrice'),
  },
])
</script>

<template>
  <Teleport to="body">
    <Transition name="sold-modal">
      <div v-if="modelValue" class="sold-backdrop" @click="handleBackdrop">
        <div class="sold-container">
          <!-- Close button -->
          <button type="button" class="sold-close" :aria-label="$t('common.close')" @click="close">
            <span aria-hidden="true">&times;</span>
          </button>

          <!-- Step 1: Congratulations -->
          <div v-if="step === 1" class="sold-step sold-step-congrats">
            <div class="congrats-icon" aria-hidden="true">&#127881;</div>
            <h2 class="sold-heading">{{ $t('postSale.congrats') }}</h2>
            <p class="sold-question">{{ $t('postSale.soldViaPlatform') }}</p>

            <p v-if="errorMsg" class="sold-error">{{ errorMsg }}</p>

            <div class="sold-actions">
              <button class="btn-primary" :disabled="isUpdating" @click="markAsSold(true)">
                {{ $t('postSale.yesPlatform') }}
              </button>
              <button class="btn-secondary" :disabled="isUpdating" @click="markAsSold(false)">
                {{ $t('postSale.noOtherChannel') }}
              </button>
            </div>
          </div>

          <!-- Step 2: Cross-sell services -->
          <div v-else-if="step === 2" class="sold-step sold-step-services">
            <h2 class="sold-heading">{{ $t('postSale.servicesTitle') }}</h2>

            <p v-if="errorMsg" class="sold-error">{{ errorMsg }}</p>

            <div class="services-grid">
              <div v-for="svc in services" :key="svc.type" class="service-card">
                <span class="service-icon" aria-hidden="true">{{ svc.icon }}</span>
                <h3 class="service-title">{{ svc.title }}</h3>
                <p class="service-desc">{{ svc.desc }}</p>
                <span v-if="svc.price" class="service-price">{{ svc.price }}</span>
                <button
                  class="btn-service"
                  :class="{ 'btn-service--done': requestedServices.has(svc.type) }"
                  :disabled="requestedServices.has(svc.type) || requestingService === svc.type"
                  @click="requestService(svc.type)"
                >
                  <template v-if="requestedServices.has(svc.type)">
                    {{ $t('postSale.requested') }}
                  </template>
                  <template v-else-if="requestingService === svc.type">
                    {{ $t('common.loading') }}
                  </template>
                  <template v-else>
                    {{ $t('postSale.requestService') }}
                  </template>
                </button>
              </div>
            </div>

            <button class="btn-link" @click="goToStep3">
              {{ $t('postSale.continueWithout') }}
            </button>
          </div>

          <!-- Step 3: New listing suggestion -->
          <div v-else-if="step === 3" class="sold-step sold-step-new">
            <div class="new-icon" aria-hidden="true">&#128666;</div>
            <h2 class="sold-heading">{{ $t('postSale.newVehicle') }}</h2>

            <div class="sold-actions">
              <button class="btn-primary" @click="goToNewListing">
                {{ $t('postSale.publishNew') }}
              </button>
              <button class="btn-secondary" @click="goToStep4">
                {{ $t('postSale.finish') }}
              </button>
            </div>
          </div>

          <!-- Step 4: Share link -->
          <div v-else-if="step === 4" class="sold-step sold-step-share">
            <h2 class="sold-heading">{{ $t('postSale.shareTitle') }}</h2>
            <p class="sold-subtitle">{{ $t('postSale.shareSubtitle') }}</p>

            <div class="share-url-box">
              <input
                type="text"
                class="share-url-input"
                :value="shareUrl"
                readonly
                @focus="($event.target as HTMLInputElement)?.select()"
              >
              <button class="btn-copy" @click="copyLink">
                {{ linkCopied ? $t('postSale.linkCopied') : $t('postSale.copyLink') }}
              </button>
            </div>

            <button class="btn-primary btn-finish" @click="finish">
              {{ $t('common.close') }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* ---- Backdrop ---- */
.sold-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 1000;
}

/* ---- Container: mobile bottom sheet ---- */
.sold-container {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  max-height: 85vh;
  background: var(--bg-primary, #fff);
  border-radius: var(--border-radius-lg, 16px) var(--border-radius-lg, 16px) 0 0;
  overflow-y: auto;
  padding: var(--spacing-6, 1.5rem);
  padding-top: var(--spacing-8, 2rem);
}

/* ---- Close button ---- */
.sold-close {
  position: absolute;
  top: var(--spacing-2, 0.5rem);
  right: var(--spacing-3, 0.75rem);
  background: none;
  border: none;
  font-size: 28px;
  color: var(--text-auxiliary, #999);
  cursor: pointer;
  min-width: 44px;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* ---- Steps common ---- */
.sold-step {
  text-align: center;
}

.sold-heading {
  font-size: var(--font-size-xl, 1.25rem);
  font-weight: var(--font-weight-bold, 700);
  color: var(--text-primary, #1f2a2a);
  margin-bottom: var(--spacing-4, 1rem);
}

.sold-question {
  font-size: var(--font-size-base, 1rem);
  color: var(--text-secondary, #4a5a5a);
  margin-bottom: var(--spacing-6, 1.5rem);
}

.sold-subtitle {
  font-size: var(--font-size-sm, 0.875rem);
  color: var(--text-secondary, #4a5a5a);
  margin-bottom: var(--spacing-6, 1.5rem);
}

.sold-error {
  color: var(--color-error, #ef4444);
  font-size: var(--font-size-sm, 0.875rem);
  margin-bottom: var(--spacing-4, 1rem);
}

/* ---- Congrats step ---- */
.congrats-icon {
  font-size: 3rem;
  margin-bottom: var(--spacing-4, 1rem);
}

.sold-step-congrats .sold-heading {
  font-size: var(--font-size-2xl, 1.5rem);
}

/* ---- Actions ---- */
.sold-actions {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3, 0.75rem);
}

.btn-primary {
  width: 100%;
  padding: var(--spacing-3, 0.75rem) var(--spacing-4, 1rem);
  background: var(--color-primary, #23424a);
  color: var(--color-white, #fff);
  border: none;
  border-radius: var(--border-radius, 8px);
  font-size: var(--font-size-base, 1rem);
  font-weight: var(--font-weight-medium, 500);
  cursor: pointer;
  min-height: 44px;
  transition: background var(--transition-fast, 150ms ease);
}

.btn-primary:hover {
  background: var(--color-primary-dark, #1a3238);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  width: 100%;
  padding: var(--spacing-3, 0.75rem) var(--spacing-4, 1rem);
  background: var(--bg-secondary, #f3f4f6);
  color: var(--text-primary, #1f2a2a);
  border: 1px solid var(--border-color, #d1d5db);
  border-radius: var(--border-radius, 8px);
  font-size: var(--font-size-base, 1rem);
  font-weight: var(--font-weight-medium, 500);
  cursor: pointer;
  min-height: 44px;
  transition: background var(--transition-fast, 150ms ease);
}

.btn-secondary:hover {
  background: var(--bg-tertiary, #e5e7eb);
}

.btn-secondary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ---- Services grid ---- */
.services-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-4, 1rem);
  margin-bottom: var(--spacing-6, 1.5rem);
  text-align: left;
}

.service-card {
  border: 1px solid var(--border-color, #d1d5db);
  border-radius: var(--border-radius-md, 12px);
  padding: var(--spacing-4, 1rem);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2, 0.5rem);
}

.service-icon {
  font-size: 1.75rem;
}

.service-title {
  font-size: var(--font-size-base, 1rem);
  font-weight: var(--font-weight-semibold, 600);
  color: var(--text-primary, #1f2a2a);
}

.service-desc {
  font-size: var(--font-size-sm, 0.875rem);
  color: var(--text-secondary, #4a5a5a);
  line-height: var(--line-height-normal, 1.5);
}

.service-price {
  font-size: var(--font-size-sm, 0.875rem);
  font-weight: var(--font-weight-semibold, 600);
  color: var(--color-primary, #23424a);
}

.btn-service {
  align-self: flex-start;
  padding: var(--spacing-2, 0.5rem) var(--spacing-4, 1rem);
  background: var(--color-primary, #23424a);
  color: var(--color-white, #fff);
  border: none;
  border-radius: var(--border-radius, 8px);
  font-size: var(--font-size-sm, 0.875rem);
  font-weight: var(--font-weight-medium, 500);
  cursor: pointer;
  min-height: 44px;
  transition: background var(--transition-fast, 150ms ease);
}

.btn-service:hover {
  background: var(--color-primary-dark, #1a3238);
}

.btn-service:disabled {
  cursor: not-allowed;
}

.btn-service--done {
  background: var(--color-success, #10b981);
}

.btn-service--done:hover {
  background: var(--color-success, #10b981);
}

/* ---- Skip link ---- */
.btn-link {
  background: none;
  border: none;
  color: var(--text-auxiliary, #7a8a8a);
  font-size: var(--font-size-sm, 0.875rem);
  cursor: pointer;
  text-decoration: underline;
  min-height: 44px;
  padding: var(--spacing-2, 0.5rem);
}

.btn-link:hover {
  color: var(--text-secondary, #4a5a5a);
}

/* ---- New listing step ---- */
.new-icon {
  font-size: 3rem;
  margin-bottom: var(--spacing-4, 1rem);
}

/* ---- Share step ---- */
.share-url-box {
  display: flex;
  gap: var(--spacing-2, 0.5rem);
  margin-bottom: var(--spacing-6, 1.5rem);
}

.share-url-input {
  flex: 1;
  padding: var(--spacing-3, 0.75rem);
  border: 2px solid var(--border-color, #d1d5db);
  border-radius: var(--border-radius, 8px);
  font-size: var(--font-size-sm, 0.875rem);
  color: var(--text-primary, #1f2a2a);
  background: var(--bg-secondary, #f3f4f6);
  min-height: 44px;
}

.btn-copy {
  padding: var(--spacing-2, 0.5rem) var(--spacing-4, 1rem);
  background: var(--color-primary, #23424a);
  color: var(--color-white, #fff);
  border: none;
  border-radius: var(--border-radius, 8px);
  font-size: var(--font-size-sm, 0.875rem);
  font-weight: var(--font-weight-medium, 500);
  cursor: pointer;
  min-height: 44px;
  white-space: nowrap;
  transition: background var(--transition-fast, 150ms ease);
}

.btn-copy:hover {
  background: var(--color-primary-dark, #1a3238);
}

.btn-finish {
  margin-top: var(--spacing-2, 0.5rem);
}

/* ---- Transitions: slide up on mobile ---- */
.sold-modal-enter-active,
.sold-modal-leave-active {
  transition: opacity var(--transition-normal, 300ms ease);
}

.sold-modal-enter-active .sold-container,
.sold-modal-leave-active .sold-container {
  transition: transform var(--transition-normal, 300ms ease);
}

.sold-modal-enter-from,
.sold-modal-leave-to {
  opacity: 0;
}

.sold-modal-enter-from .sold-container,
.sold-modal-leave-to .sold-container {
  transform: translateY(100%);
}

/* ---- Desktop: centered modal ---- */
@media (min-width: 768px) {
  .sold-backdrop {
    align-items: center;
  }

  .sold-container {
    position: relative;
    bottom: auto;
    left: auto;
    right: auto;
    top: auto;
    max-width: 500px;
    border-radius: var(--border-radius-md, 12px);
    margin: 0 auto;
  }

  .services-grid {
    grid-template-columns: 1fr 1fr;
  }

  .sold-modal-enter-from .sold-container,
  .sold-modal-leave-to .sold-container {
    transform: scale(0.9);
  }
}
</style>

<script setup lang="ts">
import { useConversation } from '~/composables/useConversation'
import { useToast } from '~/composables/useToast'

const props = defineProps<{
  visible: boolean
  vehicleId: string
  vehicleTitle: string
  sellerUserId: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const { t } = useI18n()
const user = useSupabaseUser()
const router = useRouter()
const toast = useToast()

const { startConversation } = useConversation()

const messageText = ref('')
const sending = ref(false)
const error = ref('')

const isOwnVehicle = computed(() => user.value?.id === props.sellerUserId)
const isLoggedIn = computed(() => !!user.value)

function handleClose() {
  messageText.value = ''
  error.value = ''
  emit('close')
}

async function handleSend() {
  if (!isLoggedIn.value) {
    error.value = t('messages.mustBeLoggedIn')
    return
  }
  if (isOwnVehicle.value) {
    error.value = t('messages.cannotMessageYourself')
    return
  }
  if (!messageText.value.trim()) return

  sending.value = true
  error.value = ''
  try {
    await startConversation(props.vehicleId, props.sellerUserId, messageText.value)
    toast.success(t('messages.contactSellerSuccess'))
    handleClose()
    await router.push('/perfil/mensajes')
  } catch {
    error.value = t('common.errorGeneric')
  } finally {
    sending.value = false
  }
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') handleClose()
}

onMounted(() => {
  if (import.meta.client) {
    document.addEventListener('keydown', handleKeydown)
  }
})

onUnmounted(() => {
  if (import.meta.client) {
    document.removeEventListener('keydown', handleKeydown)
  }
})
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="visible"
        class="modal-overlay"
        role="dialog"
        aria-modal="true"
        @click.self="handleClose"
      >
        <div class="modal-box">
          <button class="modal-close" :aria-label="$t('common.close')" @click="handleClose">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          <h2 class="modal-title">{{ $t('messages.contactSellerTitle') }}</h2>
          <p class="modal-subtitle">{{ vehicleTitle }}</p>

          <!-- Not logged in -->
          <div v-if="!isLoggedIn" class="modal-auth-notice">
            <p>{{ $t('messages.mustBeLoggedIn') }}</p>
            <NuxtLink to="/auth/login" class="btn-primary" @click="handleClose">
              {{ $t('auth.login') }}
            </NuxtLink>
          </div>

          <!-- Own vehicle -->
          <div v-else-if="isOwnVehicle" class="modal-error">
            {{ $t('messages.cannotMessageYourself') }}
          </div>

          <!-- Message form -->
          <template v-else>
            <textarea
              v-model="messageText"
              class="modal-textarea"
              :placeholder="$t('messages.contactSellerPlaceholder')"
              :disabled="sending"
              rows="4"
              autocomplete="off"
              maxlength="1000"
            />
            <div v-if="error" class="modal-error" role="alert">{{ error }}</div>
            <div class="modal-actions">
              <button class="btn-secondary" :disabled="sending" @click="handleClose">
                {{ $t('common.cancel') }}
              </button>
              <button
                class="btn-primary"
                :disabled="sending || !messageText.trim()"
                @click="handleSend"
              >
                <span v-if="sending">{{ $t('common.loading') }}</span>
                <span v-else>{{ $t('messages.contactSellerSend') }}</span>
              </button>
            </div>
          </template>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 1000;
  padding: var(--spacing-4);
}

.modal-box {
  background: var(--bg-primary);
  border-radius: var(--border-radius-lg) var(--border-radius-lg) 0 0;
  padding: var(--spacing-6) var(--spacing-4) var(--spacing-8);
  width: 100%;
  max-width: 520px;
  position: relative;
}

.modal-close {
  position: absolute;
  top: var(--spacing-4);
  right: var(--spacing-4);
  width: 36px;
  height: 36px;
  min-width: 36px;
  min-height: 36px;
  border-radius: 50%;
  border: none;
  background: var(--bg-secondary);
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.modal-close:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.modal-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin-bottom: var(--spacing-1);
  padding-right: var(--spacing-8);
}

.modal-subtitle {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin-bottom: var(--spacing-4);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.modal-textarea {
  width: 100%;
  padding: var(--spacing-3);
  border: 1px solid var(--border-color-medium);
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-sm);
  font-family: inherit;
  color: var(--text-primary);
  background: var(--bg-primary);
  resize: vertical;
  min-height: 100px;
  margin-bottom: var(--spacing-3);
  box-sizing: border-box;
}

.modal-textarea:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(35, 66, 74, 0.15);
}

.modal-textarea:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.modal-error {
  font-size: var(--font-size-sm);
  color: var(--color-error);
  margin-bottom: var(--spacing-3);
}

.modal-auth-notice {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
  align-items: flex-start;
}

.modal-auth-notice p {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.modal-actions {
  display: flex;
  gap: var(--spacing-3);
  justify-content: flex-end;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.6rem 1.25rem;
  background: var(--color-primary);
  color: var(--color-white);
  border: none;
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  min-height: 44px;
  text-decoration: none;
  transition: opacity 0.2s;
}

.btn-primary:hover:not(:disabled) {
  opacity: 0.9;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.6rem 1.25rem;
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border-color-medium);
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  min-height: 44px;
  transition: background 0.2s;
}

.btn-secondary:hover:not(:disabled) {
  background: var(--bg-tertiary);
}

.btn-secondary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Modal transitions */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-active .modal-box,
.modal-leave-active .modal-box {
  transition: transform 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-box,
.modal-leave-to .modal-box {
  transform: translateY(20px);
}

/* ---- Tablet+ : centrado ---- */
@media (min-width: 480px) {
  .modal-overlay {
    align-items: center;
  }

  .modal-box {
    border-radius: var(--border-radius-lg);
  }
}
</style>

<script setup lang="ts">
/**
 * WhatsApp Publishing Widget for Dealer Dashboard
 * Shows instructions for publishing vehicles via WhatsApp and pending submission status.
 */

const { t } = useI18n()
const supabase = useSupabaseClient()
const config = useRuntimeConfig()
const { hasWhatsappPublishing } = useSubscriptionPlan()
const { userId } = useAuth()

const pendingCount = ref(0)
const loading = ref(true)
const showUpgrade = ref(false)

// WhatsApp phone number from i18n or config
const whatsappNumber = computed(() => {
  return t('nav.whatsappNumber')
})

const whatsappDisplayNumber = computed(() => {
  const num = whatsappNumber.value
  // Format as international: +34 645 77 95 94
  if (num.startsWith('34')) {
    return `+${num.slice(0, 2)} ${num.slice(2, 5)} ${num.slice(5, 7)} ${num.slice(7, 9)} ${num.slice(9)}`
  }
  return `+${num}`
})

const whatsappLink = computed(() => {
  return `https://wa.me/${whatsappNumber.value}`
})

async function fetchPendingSubmissions() {
  if (!userId.value) return

  loading.value = true

  try {
    // Get dealer's phone number first
    const { data: dealerData } = await supabase
      .from('dealers')
      .select('phone, whatsapp')
      .eq('user_id', userId.value)
      .single()

    if (!dealerData) {
      loading.value = false
      return
    }

    // Cast to expected type since dealers table might not be in generated types
    const dealer = dealerData as { phone: string | null; whatsapp: string | null }
    const dealerPhone = dealer.whatsapp || dealer.phone

    if (!dealerPhone) {
      loading.value = false
      return
    }

    // Query whatsapp_submissions table (using REST API as it may not be in generated types yet)
    const supabaseUrl = config.public.supabase?.url || ''

    // Get session token
    const session = await supabase.auth.getSession()
    const token = session.data.session?.access_token

    if (!supabaseUrl || !token) {
      loading.value = false
      return
    }

    // Direct fetch to whatsapp_submissions
    const response = await fetch(
      `${supabaseUrl}/rest/v1/whatsapp_submissions?phone_number=eq.${dealerPhone}&status=in.(pending,processing)&select=count`,
      {
        headers: {
          apikey: token,
          Authorization: `Bearer ${token}`,
          Prefer: 'count=exact',
        },
      },
    )

    if (response.ok) {
      const countHeader = response.headers.get('Content-Range')
      if (countHeader) {
        const match = countHeader.match(/\/(\d+)$/)
        if (match && match[1]) {
          pendingCount.value = Number.parseInt(match[1], 10)
        }
      }
    }
  } catch (err) {
    if (import.meta.dev)
      console.error('[WhatsAppPublishWidget] Failed to fetch pending submissions:', err)
  } finally {
    loading.value = false
  }
}

function toggleUpgrade() {
  showUpgrade.value = !showUpgrade.value
}

onMounted(() => {
  if (hasWhatsappPublishing.value) {
    fetchPendingSubmissions()
  }
})
</script>

<template>
  <div class="whatsapp-widget" :class="{ locked: !hasWhatsappPublishing }">
    <div class="widget-inner">
      <!-- Header -->
      <div class="widget-header">
        <div class="header-icon">
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
          >
            <path
              d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"
            />
          </svg>
        </div>
        <div>
          <h3>{{ t('dashboard.whatsapp.title') }}</h3>
          <p class="subtitle">{{ t('dashboard.whatsapp.subtitle') }}</p>
        </div>
      </div>

      <!-- Instructions -->
      <div class="instructions">
        <div class="step">
          <span class="step-number">1</span>
          <div class="step-content">
            <strong>{{ t('dashboard.whatsapp.step1') }}</strong>
            <a :href="whatsappLink" target="_blank" rel="noopener noreferrer" class="phone-link">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"
                />
              </svg>
              {{ whatsappDisplayNumber }}
            </a>
          </div>
        </div>
        <div class="step">
          <span class="step-number">2</span>
          <div class="step-content">
            <strong>{{ t('dashboard.whatsapp.step2') }}</strong>
          </div>
        </div>
        <div class="step">
          <span class="step-number">3</span>
          <div class="step-content">
            <strong>{{ t('dashboard.whatsapp.step3') }}</strong>
          </div>
        </div>
      </div>

      <!-- Status Section -->
      <div v-if="hasWhatsappPublishing && !loading && pendingCount > 0" class="status-section">
        <div class="status-info">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <span>{{ t('dashboard.whatsapp.pendingCount', { count: pendingCount }) }}</span>
        </div>
        <NuxtLink to="/dashboard/vehiculos?status=draft" class="view-drafts-link">
          {{ t('dashboard.whatsapp.viewDrafts') }}
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </NuxtLink>
      </div>
    </div>

    <!-- Upgrade Overlay (only shown if feature not available) -->
    <div v-if="!hasWhatsappPublishing" class="upgrade-overlay" @click="toggleUpgrade">
      <div class="upgrade-content">
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0110 0v4" />
        </svg>
        <strong>{{ t('dashboard.whatsapp.upgradeRequired') }}</strong>
        <p>{{ t('dashboard.whatsapp.upgradeDesc') }}</p>
        <NuxtLink to="/dashboard/suscripcion" class="btn-upgrade" @click.stop>
          {{ t('dashboard.whatsapp.upgradeCTA') }}
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ============================================
   WIDGET BASE
   ============================================ */
.whatsapp-widget {
  position: relative;
  background: var(--bg-primary);
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  border: 2px solid #dcfce7;
}

.whatsapp-widget.locked .widget-inner {
  filter: blur(4px);
  pointer-events: none;
  user-select: none;
}

.widget-inner {
  display: flex;
  flex-direction: column;
  gap: 16px;
  transition: filter 0.2s;
}

/* ============================================
   HEADER
   ============================================ */
.widget-header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.header-icon {
  width: 44px;
  height: 44px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--color-success), var(--color-success));
  border-radius: 10px;
  color: white;
}

.widget-header h3 {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--text-primary);
  line-height: 1.3;
}

.subtitle {
  margin: 4px 0 0 0;
  font-size: 0.85rem;
  color: var(--text-auxiliary);
  line-height: 1.4;
}

/* ============================================
   INSTRUCTIONS
   ============================================ */
.instructions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.step {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.step-number {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  flex-shrink: 0;
  background: linear-gradient(135deg, #dcfce7, var(--color-success-border));
  color: #15803d;
  border-radius: 50%;
  font-weight: 700;
  font-size: 0.85rem;
}

.step-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.step-content strong {
  font-size: 0.9rem;
  color: #334155;
  line-height: 1.4;
}

.phone-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: var(--color-success);
  color: white;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.9rem;
  text-decoration: none;
  transition: background 0.2s;
  width: fit-content;
  min-height: 44px;
}

.phone-link:hover {
  background: var(--color-success);
}

.phone-link svg {
  flex-shrink: 0;
}

/* ============================================
   STATUS SECTION
   ============================================ */
.status-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: var(--color-warning-bg, #fef3c7);
  border: 1px solid #fde047;
  border-radius: 8px;
  gap: 12px;
}

.status-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-warning-text);
}

.status-info svg {
  flex-shrink: 0;
  color: var(--color-warning);
}

.view-drafts-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  background: var(--bg-primary);
  color: var(--color-warning-text);
  border: 1px solid #fbbf24;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.15s;
  white-space: nowrap;
  min-height: 44px;
}

.view-drafts-link:hover {
  background: #fffbeb;
  border-color: var(--color-warning);
}

.view-drafts-link svg {
  flex-shrink: 0;
}

/* ============================================
   UPGRADE OVERLAY
   ============================================ */
.upgrade-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(2px);
  cursor: pointer;
  z-index: 10;
}

.upgrade-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 24px 20px;
  text-align: center;
  max-width: 280px;
}

.upgrade-content svg {
  color: var(--text-disabled);
  margin-bottom: 4px;
}

.upgrade-content strong {
  font-size: 1rem;
  color: var(--text-primary);
}

.upgrade-content p {
  margin: 0;
  font-size: 0.85rem;
  color: var(--text-auxiliary);
  line-height: 1.5;
}

.btn-upgrade {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 10px 20px;
  background: var(--color-success);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.9rem;
  text-decoration: none;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-upgrade:hover {
  background: var(--color-success);
}

/* ============================================
   RESPONSIVE
   ============================================ */
@media (min-width: 480px) {
  .status-section {
    flex-wrap: nowrap;
  }
}

@media (min-width: 768px) {
  .whatsapp-widget {
    padding: 24px;
  }

  .widget-header h3 {
    font-size: 1.1rem;
  }

  .instructions {
    gap: 14px;
  }
}
</style>

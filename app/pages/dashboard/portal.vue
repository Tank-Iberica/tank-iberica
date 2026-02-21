<script setup lang="ts">
/**
 * Configure Public Portal
 * Edit dealer profile: company name, bio, logo, contact, social, theme colors.
 */
definePageMeta({
  layout: 'default',
  middleware: ['auth', 'dealer'],
})

const { t } = useI18n()
const supabase = useSupabaseClient()
const { dealerProfile, loadDealer } = useDealerDashboard()

const saving = ref(false)
const error = ref<string | null>(null)
const success = ref(false)
const loading = ref(true)

const form = ref({
  company_name: '',
  bio: '',
  logo_url: '',
  phone: '',
  email: '',
  website: '',
  theme_primary: '#23424A',
  theme_accent: '#f59e0b',
  linkedin: '',
  instagram: '',
  facebook: '',
})

async function loadPortalData(): Promise<void> {
  loading.value = true
  const dealer = dealerProfile.value || (await loadDealer())
  if (!dealer) {
    loading.value = false
    return
  }

  form.value = {
    company_name: dealer.company_name || '',
    bio: dealer.bio || '',
    logo_url: dealer.logo_url || '',
    phone: dealer.phone || '',
    email: dealer.email || '',
    website: dealer.website || '',
    theme_primary: dealer.theme_primary || '#23424A',
    theme_accent: dealer.theme_accent || '#f59e0b',
    linkedin: dealer.social_links?.linkedin || '',
    instagram: dealer.social_links?.instagram || '',
    facebook: dealer.social_links?.facebook || '',
  }
  loading.value = false
}

onMounted(loadPortalData)

const portalUrl = computed(() => {
  const dealer = dealerProfile.value
  if (!dealer?.slug) return null
  return `/dealer/${dealer.slug}`
})

async function savePortal(): Promise<void> {
  const dealer = dealerProfile.value
  if (!dealer) return

  saving.value = true
  error.value = null

  try {
    const { error: err } = await supabase
      .from('dealers')
      .update({
        company_name: form.value.company_name || null,
        bio: form.value.bio || null,
        logo_url: form.value.logo_url || null,
        phone: form.value.phone || null,
        email: form.value.email || null,
        website: form.value.website || null,
        theme_primary: form.value.theme_primary || null,
        theme_accent: form.value.theme_accent || null,
        social_links: {
          linkedin: form.value.linkedin || null,
          instagram: form.value.instagram || null,
          facebook: form.value.facebook || null,
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', dealer.id)

    if (err) throw err

    success.value = true
    setTimeout(() => {
      success.value = false
    }, 3000)
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'Error saving portal'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="portal-page">
    <header class="page-header">
      <div>
        <h1>{{ t('dashboard.portal.title') }}</h1>
        <p class="subtitle">{{ t('dashboard.portal.subtitle') }}</p>
      </div>
      <a v-if="portalUrl" :href="portalUrl" target="_blank" class="btn-secondary">
        {{ t('dashboard.portal.preview') }}
      </a>
    </header>

    <div v-if="loading" class="loading-state">
      <div class="spinner" />
    </div>

    <form v-else @submit.prevent="savePortal">
      <div v-if="error" class="alert-error">{{ error }}</div>
      <div v-if="success" class="alert-success">{{ t('dashboard.portal.saved') }}</div>

      <!-- Identity -->
      <section class="form-section">
        <h2>{{ t('dashboard.portal.sectionIdentity') }}</h2>
        <div class="form-group">
          <label for="company_name">{{ t('dashboard.portal.companyName') }}</label>
          <input id="company_name" v-model="form.company_name" type="text" >
        </div>
        <div class="form-group">
          <label for="bio">{{ t('dashboard.portal.bio') }}</label>
          <textarea
            id="bio"
            v-model="form.bio"
            rows="4"
            :placeholder="t('dashboard.portal.bioPlaceholder')"
          />
        </div>
        <div class="form-group">
          <label for="logo_url">{{ t('dashboard.portal.logoUrl') }}</label>
          <input id="logo_url" v-model="form.logo_url" type="url" placeholder="https://..." >
        </div>
      </section>

      <!-- Theme Colors -->
      <section class="form-section">
        <h2>{{ t('dashboard.portal.sectionColors') }}</h2>
        <div class="form-grid">
          <div class="form-group">
            <label for="theme_primary">{{ t('dashboard.portal.primaryColor') }}</label>
            <div class="color-input">
              <input
                id="theme_primary"
                v-model="form.theme_primary"
                type="text"
                placeholder="#23424A"
              >
              <div class="color-swatch" :style="{ backgroundColor: form.theme_primary }" />
            </div>
          </div>
          <div class="form-group">
            <label for="theme_accent">{{ t('dashboard.portal.accentColor') }}</label>
            <div class="color-input">
              <input
                id="theme_accent"
                v-model="form.theme_accent"
                type="text"
                placeholder="#f59e0b"
              >
              <div class="color-swatch" :style="{ backgroundColor: form.theme_accent }" />
            </div>
          </div>
        </div>
      </section>

      <!-- Contact -->
      <section class="form-section">
        <h2>{{ t('dashboard.portal.sectionContact') }}</h2>
        <div class="form-grid">
          <div class="form-group">
            <label for="phone">{{ t('dashboard.portal.phone') }}</label>
            <input id="phone" v-model="form.phone" type="tel" >
          </div>
          <div class="form-group">
            <label for="email">{{ t('dashboard.portal.email') }}</label>
            <input id="email" v-model="form.email" type="email" >
          </div>
          <div class="form-group full-width">
            <label for="website">{{ t('dashboard.portal.website') }}</label>
            <input id="website" v-model="form.website" type="url" placeholder="https://..." >
          </div>
        </div>
      </section>

      <!-- Social Links -->
      <section class="form-section">
        <h2>{{ t('dashboard.portal.sectionSocial') }}</h2>
        <div class="form-group">
          <label for="linkedin">LinkedIn</label>
          <input
            id="linkedin"
            v-model="form.linkedin"
            type="url"
            placeholder="https://linkedin.com/company/..."
          >
        </div>
        <div class="form-group">
          <label for="instagram">Instagram</label>
          <input
            id="instagram"
            v-model="form.instagram"
            type="url"
            placeholder="https://instagram.com/..."
          >
        </div>
        <div class="form-group">
          <label for="facebook">Facebook</label>
          <input
            id="facebook"
            v-model="form.facebook"
            type="url"
            placeholder="https://facebook.com/..."
          >
        </div>
      </section>

      <!-- Submit -->
      <div class="form-actions">
        <button type="submit" class="btn-primary" :disabled="saving">
          {{ saving ? t('common.loading') : t('common.save') }}
        </button>
      </div>
    </form>
  </div>
</template>

<style scoped>
.portal-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.page-header {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.page-header h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-primary, #23424a);
}

.subtitle {
  margin: 0;
  color: #64748b;
  font-size: 0.9rem;
}

.btn-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 10px 20px;
  background: white;
  color: var(--color-primary, #23424a);
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-weight: 500;
  text-decoration: none;
}

.loading-state {
  display: flex;
  justify-content: center;
  padding: 40px;
}

.spinner {
  width: 24px;
  height: 24px;
  border: 3px solid #e2e8f0;
  border-top-color: var(--color-primary, #23424a);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.alert-error {
  padding: 12px 16px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #dc2626;
}

.alert-success {
  padding: 12px 16px;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 8px;
  color: #16a34a;
}

.form-section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.form-section h2 {
  margin: 0 0 16px 0;
  font-size: 1.05rem;
  font-weight: 600;
  color: #1e293b;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 12px;
}

.form-group label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #475569;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.95rem;
  font-family: inherit;
  min-height: 44px;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--color-primary, #23424a);
  box-shadow: 0 0 0 3px rgba(35, 66, 74, 0.1);
}

.form-group textarea {
  resize: vertical;
  min-height: 100px;
}

.color-input {
  display: flex;
  align-items: center;
  gap: 8px;
}

.color-input input {
  flex: 1;
}

.color-swatch {
  width: 44px;
  height: 44px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  flex-shrink: 0;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 10px 24px;
  background: var(--color-primary, #23424a);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
}

.btn-primary:hover {
  background: #1a3238;
}
.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (min-width: 480px) {
  .form-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .full-width {
    grid-column: span 2;
  }
}

@media (min-width: 768px) {
  .portal-page {
    padding: 24px;
  }

  .page-header {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
}
</style>

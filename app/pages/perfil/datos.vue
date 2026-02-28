<script setup lang="ts">
definePageMeta({
  layout: 'default',
  middleware: ['auth'],
})

const { t, locale, locales } = useI18n()
const { profile, fetchProfile } = useAuth()
const { updateProfile, loading, error } = useUserProfile()

const form = reactive({
  full_name: '',
  phone: '',
  preferred_locale: '',
})

const email = ref('')
const saved = ref(false)
let savedTimer: ReturnType<typeof setTimeout> | null = null

/** Populate form from profile */
function syncForm() {
  if (profile.value) {
    form.full_name = profile.value.full_name ?? ''
    form.phone = profile.value.phone ?? ''
    form.preferred_locale = profile.value.preferred_locale ?? locale.value
    email.value = profile.value.email ?? ''
  }
}

async function onSave() {
  saved.value = false
  if (savedTimer) clearTimeout(savedTimer)

  const success = await updateProfile({
    full_name: form.full_name.trim() || undefined,
    phone: form.phone.trim() || undefined,
    preferred_locale: form.preferred_locale || undefined,
  })

  if (success) {
    saved.value = true
    // Refresh the cached auth profile
    await fetchProfile()
    savedTimer = setTimeout(() => {
      saved.value = false
    }, 3000)
  }
}

/** Compute avatar initials from name or email */
const initials = computed(() => {
  const name = form.full_name || email.value
  if (!name) return '?'
  const parts = name.split(/[\s@]+/)
  if (parts.length >= 2) {
    return ((parts[0] ?? '').charAt(0) + (parts[1] ?? '').charAt(0)).toUpperCase()
  }
  return name.charAt(0).toUpperCase()
})

/** Available locales for dropdown */
const availableLocales = computed(() => {
  return (locales.value as Array<{ code: string; name?: string }>).map((l) => ({
    code: l.code,
    name: l.name ?? l.code.toUpperCase(),
  }))
})

useHead({
  title: t('profile.data.title'),
})

onMounted(async () => {
  await fetchProfile()
  syncForm()
})
</script>

<template>
  <div class="data-page">
    <div class="data-container">
      <h1 class="page-title">
        {{ $t('profile.data.title') }}
      </h1>
      <p class="page-subtitle">
        {{ $t('profile.data.subtitle') }}
      </p>

      <!-- Avatar section -->
      <div class="avatar-section">
        <div v-if="profile?.avatar_url" class="avatar">
          <img :src="profile.avatar_url" :alt="$t('profile.data.avatarAlt')" >
        </div>
        <div v-else class="avatar avatar--initials">
          {{ initials }}
        </div>
      </div>

      <!-- Form -->
      <form class="profile-form" @submit.prevent="onSave">
        <!-- Full name -->
        <div class="form-group">
          <label for="full_name" class="form-label">{{ $t('profile.data.fullName') }}</label>
          <input
            id="full_name"
            v-model="form.full_name"
            type="text"
            class="form-input"
            :placeholder="$t('profile.data.fullNamePlaceholder')"
            autocomplete="name"
          >
        </div>

        <!-- Email (readonly) -->
        <div class="form-group">
          <label for="email" class="form-label">{{ $t('profile.data.email') }}</label>
          <input
            id="email"
            :value="email"
            type="email"
            class="form-input form-input--readonly"
            readonly
            disabled
          >
          <span class="form-hint">{{ $t('profile.data.emailHint') }}</span>
        </div>

        <!-- Phone -->
        <div class="form-group">
          <label for="phone" class="form-label">{{ $t('profile.data.phone') }}</label>
          <input
            id="phone"
            v-model="form.phone"
            type="tel"
            class="form-input"
            :placeholder="$t('profile.data.phonePlaceholder')"
            autocomplete="tel"
          >
        </div>

        <!-- Preferred locale -->
        <div class="form-group">
          <label for="preferred_locale" class="form-label">{{
            $t('profile.data.preferredLocale')
          }}</label>
          <select
            id="preferred_locale"
            v-model="form.preferred_locale"
            class="form-input form-select"
          >
            <option v-for="loc in availableLocales" :key="loc.code" :value="loc.code">
              {{ loc.name }}
            </option>
          </select>
        </div>

        <!-- Error -->
        <div v-if="error" class="form-error" role="alert">
          {{ error }}
        </div>

        <!-- Success -->
        <div v-if="saved" class="form-success" role="status">
          {{ $t('profile.data.saved') }}
        </div>

        <!-- Submit -->
        <button type="submit" class="btn-primary" :disabled="loading">
          {{ loading ? $t('common.loading') : $t('common.save') }}
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.data-page {
  min-height: 60vh;
  padding: 1.5rem 0 3rem;
}

.data-container {
  max-width: 560px;
  margin: 0 auto;
  padding: 0 1rem;
}

.page-title {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
  margin-bottom: 0.25rem;
}

.page-subtitle {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin-bottom: 1.5rem;
}

/* Avatar */
.avatar-section {
  display: flex;
  justify-content: center;
  margin-bottom: 1.5rem;
}

.avatar {
  width: 80px;
  height: 80px;
  border-radius: var(--border-radius-full);
  overflow: hidden;
  border: 3px solid var(--border-color-light);
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar--initials {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-primary);
  color: var(--color-white);
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
}

/* Form */
.profile-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.form-label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
}

.form-input {
  width: 100%;
  padding: 0.75rem 1rem;
  font-size: var(--font-size-base);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  background: var(--bg-primary);
  color: var(--text-primary);
  transition: border-color var(--transition-fast);
  min-height: 44px;
}

.form-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(35, 66, 74, 0.15);
}

.form-input--readonly {
  background: var(--bg-secondary);
  color: var(--text-auxiliary);
  cursor: not-allowed;
}

.form-select {
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%234A5A5A' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10l-5 5z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.75rem center;
  padding-right: 2.5rem;
}

.form-hint {
  font-size: var(--font-size-xs);
  color: var(--text-auxiliary);
}

.form-error {
  padding: 0.75rem 1rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: var(--border-radius);
  font-size: var(--font-size-sm);
  color: var(--color-error);
}

.form-success {
  padding: 0.75rem 1rem;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: var(--border-radius);
  font-size: var(--font-size-sm);
  color: var(--color-success);
}

.btn-primary {
  width: 100%;
  padding: 0.75rem 1.5rem;
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--color-white);
  background: var(--color-primary);
  border: none;
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: background var(--transition-fast);
  min-height: 44px;
}

.btn-primary:hover:not(:disabled) {
  background: var(--color-primary-dark);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* ---- Tablet ---- */
@media (min-width: 768px) {
  .data-container {
    padding: 0 2rem;
  }

  .page-title {
    font-size: var(--font-size-3xl);
  }

  .page-subtitle {
    font-size: var(--font-size-base);
    margin-bottom: 2rem;
  }

  .avatar {
    width: 96px;
    height: 96px;
  }

  .btn-primary {
    width: auto;
    align-self: flex-start;
  }
}
</style>

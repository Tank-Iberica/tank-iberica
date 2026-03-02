<script setup lang="ts">
import { getProfileCountries, type LocationLevel } from '~/utils/geoData'

definePageMeta({
  layout: 'default',
  middleware: ['auth'],
})

const { t, locale, locales } = useI18n()
const { profile, fetchProfile } = useAuth()
const { updateProfile, loading, error } = useUserProfile()

const form = reactive({
  name: '',
  phone: '',
  lang: '',
  preferred_country: '' as string | null,
  preferred_location_level: null as string | null,
})

const email = ref('')
const saved = ref(false)
const fieldErrors = reactive({ phone: '' })
let savedTimer: ReturnType<typeof setTimeout> | null = null

/** Populate form from profile */
function syncForm() {
  if (profile.value) {
    form.name = profile.value.name ?? ''
    form.phone = profile.value.phone ?? ''
    form.lang = profile.value.lang ?? locale.value
    form.preferred_country = profile.value.preferred_country ?? null
    form.preferred_location_level =
      ((profile.value as Record<string, unknown>).preferred_location_level as string | null) ?? null
    email.value = profile.value.email ?? ''
  }
}

async function onSave() {
  saved.value = false
  fieldErrors.phone = ''
  if (savedTimer) clearTimeout(savedTimer)

  if (form.phone.trim() && !/^[+\d\s\-().]{6,20}$/.test(form.phone.trim())) {
    fieldErrors.phone = t('validation.phoneInvalid')
    return
  }

  const success = await updateProfile({
    name: form.name.trim() || undefined,
    phone: form.phone.trim() || undefined,
    lang: form.lang || undefined,
    preferred_country: form.preferred_country || null,
    preferred_location_level: form.preferred_location_level || null,
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
  const name = form.name || email.value
  if (!name) return '?'
  const parts = name.split(/[\s@]+/)
  if (parts.length >= 2) {
    return ((parts[0] ?? '').charAt(0) + (parts[1] ?? '').charAt(0)).toUpperCase()
  }
  return name.charAt(0).toUpperCase()
})

/** Location level options for the preferred-area selector */
const ALL_LOCATION_LEVELS: LocationLevel[] = [
  'provincia',
  'comunidad',
  'limitrofes',
  'nacional',
  'suroeste_europeo',
  'union_europea',
  'europa',
  'mundo',
]
const locationLevels = computed(() =>
  ALL_LOCATION_LEVELS.map((v) => ({ value: v, label: t(`catalog.levelLabels.${v}`) })),
)

/** Available locales for dropdown — dynamic, ready for N languages */
const availableLocales = computed(() => {
  return (locales.value as Array<{ code: string; name?: string }>).map((l) => ({
    code: l.code,
    name: l.name ?? l.code.toUpperCase(),
  }))
})

/** Countries grouped for profile selector */
const profileCountries = computed(() => getProfileCountries(locale.value))

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
          <img :src="profile.avatar_url" :alt="$t('profile.data.avatarAlt')" />
        </div>
        <div v-else class="avatar avatar--initials">
          {{ initials }}
        </div>
      </div>

      <!-- Form -->
      <form class="profile-form" @submit.prevent="onSave">
        <!-- Full name -->
        <div class="form-group">
          <label for="name" class="form-label">{{ $t('profile.data.fullName') }}</label>
          <input
            id="name"
            v-model="form.name"
            type="text"
            class="form-input"
            :placeholder="$t('profile.data.fullNamePlaceholder')"
            autocomplete="name"
          />
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
          />
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
            :class="{ 'form-input--error': fieldErrors.phone }"
            :aria-invalid="!!fieldErrors.phone || undefined"
            :aria-describedby="fieldErrors.phone ? 'err-profile-phone' : undefined"
            :placeholder="$t('profile.data.phonePlaceholder')"
            autocomplete="tel"
          />
          <p v-if="fieldErrors.phone" id="err-profile-phone" class="field-error" role="alert">
            {{ fieldErrors.phone }}
          </p>
        </div>

        <!-- Preferred locale -->
        <div class="form-group">
          <label for="lang" class="form-label">{{ $t('profile.data.preferredLocale') }}</label>
          <select
            id="lang"
            v-model="form.lang"
            class="form-input form-select"
            autocomplete="language"
          >
            <option v-for="loc in availableLocales" :key="loc.code" :value="loc.code">
              {{ loc.name }}
            </option>
          </select>
          <span class="form-hint">{{ $t('profile.data.preferredLocaleHint') }}</span>
        </div>

        <!-- Preferred country -->
        <div class="form-group">
          <label for="preferred_country" class="form-label">{{
            $t('profile.data.preferredCountry')
          }}</label>
          <select
            id="preferred_country"
            v-model="form.preferred_country"
            class="form-input form-select"
            autocomplete="country"
          >
            <option value="">{{ $t('profile.data.preferredCountryAuto') }}</option>
            <optgroup :label="$t('profile.data.countryGroupPriority')">
              <option v-for="c in profileCountries.priority" :key="c.code" :value="c.code">
                {{ c.flag }} {{ c.name }}
              </option>
            </optgroup>
            <optgroup :label="$t('profile.data.countryGroupEurope')">
              <option v-for="c in profileCountries.europe" :key="c.code" :value="c.code">
                {{ c.flag }} {{ c.name }}
              </option>
            </optgroup>
            <optgroup :label="$t('profile.data.countryGroupLatam')">
              <option v-for="c in profileCountries.latam" :key="c.code" :value="c.code">
                {{ c.flag }} {{ c.name }}
              </option>
            </optgroup>
          </select>
          <span class="form-hint">{{ $t('profile.data.preferredCountryHint') }}</span>
        </div>

        <!-- Preferred location level -->
        <div class="form-group">
          <label for="preferred_location_level" class="form-label">{{
            $t('profile.data.preferredLocationLevel')
          }}</label>
          <select
            id="preferred_location_level"
            v-model="form.preferred_location_level"
            class="form-input form-select"
          >
            <option :value="null">{{ $t('profile.data.preferredLocationLevelAuto') }}</option>
            <option v-for="level in locationLevels" :key="level.value" :value="level.value">
              {{ level.label }}
            </option>
          </select>
          <span class="form-hint">{{ $t('profile.data.preferredLocationLevelHint') }}</span>
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

.form-input--error {
  border-color: var(--color-error, var(--color-error));
}

.field-error {
  font-size: var(--font-size-xs);
  color: var(--color-error, var(--color-error));
  margin-top: var(--spacing-1, 4px);
}

.form-error {
  padding: 0.75rem 1rem;
  background: var(--color-error-bg, #fef2f2);
  border: 1px solid var(--color-error-border);
  border-radius: var(--border-radius);
  font-size: var(--font-size-sm);
  color: var(--color-error);
}

.form-success {
  padding: 0.75rem 1rem;
  background: var(--color-success-bg, #dcfce7);
  border: 1px solid var(--color-success-border);
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

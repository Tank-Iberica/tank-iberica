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

/** Profile completeness checklist (reactive to form state) */
const completenessItems = computed(() => [
  { key: 'name', done: !!form.name.trim(), label: t('profile.data.fullName') },
  { key: 'phone', done: !!form.phone.trim(), label: t('profile.data.phone') },
  { key: 'country', done: !!form.preferred_country, label: t('profile.data.preferredCountry') },
  {
    key: 'level',
    done: !!form.preferred_location_level,
    label: t('profile.data.preferredLocationLevel'),
  },
])

const completeness = computed(() => {
  const done = completenessItems.value.filter((i) => i.done).length
  return Math.round((done / completenessItems.value.length) * 100)
})

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
      <UiBreadcrumbNav
        :items="[
          { label: $t('nav.home'), to: '/' },
          { label: $t('profile.dashboard.title'), to: '/perfil' },
          { label: $t('profile.data.title') },
        ]"
      />
      <PerfilProfileNavPills />
      <h1 class="page-title">
        {{ $t('profile.data.title') }}
      </h1>
      <p class="page-subtitle">
        {{ $t('profile.data.subtitle') }}
      </p>

      <!-- Profile completeness -->
      <div class="profile-completeness">
        <div class="completeness-header">
          <span class="completeness-label">{{ $t('profile.data.completeness') }}</span>
          <span
            class="completeness-percent"
            :class="{ 'completeness-percent--done': completeness === 100 }"
            >{{ completeness }}%</span
          >
        </div>
        <div
          class="completeness-bar"
          :aria-label="`${completeness}%`"
          role="progressbar"
          :aria-valuenow="completeness"
          aria-valuemin="0"
          aria-valuemax="100"
        >
          <div class="completeness-bar-fill" :style="{ width: `${completeness}%` }" />
        </div>
        <div v-if="completeness === 100" class="completeness-reward">
          {{ $t('profile.data.completenessReward') }}
        </div>
        <ul v-else class="completeness-checklist">
          <li
            v-for="item in completenessItems"
            :key="item.key"
            class="checklist-item"
            :class="{ 'checklist-item--done': item.done }"
          >
            <svg
              v-if="item.done"
              class="checklist-icon checklist-icon--done"
              viewBox="0 0 20 20"
              fill="currentColor"
              width="14"
              height="14"
              aria-hidden="true"
            >
              <path
                fill-rule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clip-rule="evenodd"
              />
            </svg>
            <svg
              v-else
              class="checklist-icon checklist-icon--pending"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              width="14"
              height="14"
              aria-hidden="true"
            >
              <circle cx="10" cy="10" r="8" stroke-width="1.5" />
            </svg>
            {{ item.label }}
          </li>
        </ul>
      </div>

      <!-- Avatar section -->
      <div class="avatar-section">
        <div v-if="profile?.avatar_url" class="avatar">
          <NuxtImg
            v-if="profile.avatar_url.includes('cloudinary.com')"
            provider="cloudinary"
            :src="profile.avatar_url.match(/\/upload\/(.+)$/)?.[1] || profile.avatar_url"
            :alt="$t('profile.data.avatarAlt')"
            width="96"
            height="96"
            sizes="96px"
            fit="cover"
            format="webp"
            loading="lazy"
          />
          <img
            v-else
            :src="profile.avatar_url"
            :alt="$t('profile.data.avatarAlt')"
            loading="lazy"
            decoding="async"
          >
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
            :class="{ 'form-input--error': fieldErrors.phone }"
            :aria-invalid="!!fieldErrors.phone || undefined"
            :aria-describedby="fieldErrors.phone ? 'err-profile-phone' : undefined"
            :placeholder="$t('profile.data.phonePlaceholder')"
            autocomplete="tel"
          >
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
  max-width: 35rem;
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

/* Completeness widget */
.profile-completeness {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color-light);
  border-radius: var(--border-radius-md);
  padding: 1rem;
  margin-bottom: 1.5rem;
}

.completeness-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.completeness-label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
}

.completeness-percent {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-primary);
}

.completeness-percent--done {
  color: var(--color-success, #16a34a);
}

.completeness-bar {
  width: 100%;
  height: 0.5rem;
  background: var(--border-color-light);
  border-radius: var(--border-radius-full);
  overflow: hidden;
  margin-bottom: 0.75rem;
}

.completeness-bar-fill {
  height: 100%;
  background: var(--color-primary);
  border-radius: var(--border-radius-full);
  transition: width 0.4s ease;
}

.completeness-reward {
  font-size: var(--font-size-sm);
  color: var(--color-success, #16a34a);
  font-weight: var(--font-weight-medium);
  text-align: center;
  padding: 0.25rem 0;
}

.completeness-checklist {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.checklist-item {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: var(--font-size-xs);
  color: var(--text-auxiliary);
}

.checklist-item--done {
  color: var(--text-secondary);
  text-decoration: line-through;
}

.checklist-icon--done {
  color: var(--color-success, #16a34a);
  flex-shrink: 0;
}

.checklist-icon--pending {
  color: var(--border-color);
  flex-shrink: 0;
}

/* Avatar */
.avatar-section {
  display: flex;
  justify-content: center;
  margin-bottom: 1.5rem;
}

.avatar {
  width: 5rem;
  height: 5rem;
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
  min-height: 2.75rem;
}

.form-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: var(--shadow-ring-strong);
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
  margin-top: var(--spacing-1);
}

.form-error {
  padding: 0.75rem 1rem;
  background: var(--color-error-bg, var(--color-error-bg));
  border: 1px solid var(--color-error-border);
  border-radius: var(--border-radius);
  font-size: var(--font-size-sm);
  color: var(--color-error);
}

.form-success {
  padding: 0.75rem 1rem;
  background: var(--color-success-bg, var(--color-success-bg));
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
  min-height: 2.75rem;
}

.btn-primary:hover:not(:disabled) {
  background: var(--color-primary-dark);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* ---- Tablet ---- */
@media (min-width: 48em) {
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
    width: 6rem;
    height: 6rem;
  }

  .btn-primary {
    width: auto;
    align-self: flex-start;
  }
}
</style>

<template>
  <div class="dealer-portal">
    <!-- 1. Cover image -->
    <div class="dealer-cover">
      <img
        v-if="dealer.cover_image_url"
        :src="dealer.cover_image_url"
        :alt="companyName"
        class="cover-img"
      >
      <div v-else class="cover-gradient" />
    </div>

    <!-- 2. Header section -->
    <div class="dealer-header">
      <div class="header-inner">
        <div class="logo-wrapper">
          <img
            v-if="dealer.logo_url"
            :src="dealer.logo_url"
            :alt="companyName"
            class="dealer-logo"
          >
          <div v-else class="dealer-logo dealer-logo-placeholder">
            <svg
              width="36"
              height="36"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
            >
              <path
                d="M3 21h18M3 7v1a3 3 0 006 0V7m0 0v1a3 3 0 006 0V7m0 0v1a3 3 0 006 0V7H3M5 21V10.85M19 21V10.85"
              />
            </svg>
          </div>
        </div>

        <div class="header-info">
          <div class="name-badge-row">
            <h1 class="dealer-name">{{ companyName }}</h1>
            <span v-if="badgeLabel" :class="['dealer-badge', `badge-${badgeKey}`]">
              {{ badgeLabel }}
            </span>
          </div>

          <p v-if="dealer.address" class="dealer-location">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <span>{{ dealer.address }}</span>
          </p>

          <div class="dealer-stats">
            <div class="stat-item">
              <span class="stat-value">{{ dealer.active_listings }}</span>
              <span class="stat-label">{{ t('dealer.activeListings') }}</span>
            </div>
            <div class="stat-separator" />
            <div class="stat-item">
              <span class="stat-value">{{ sinceYear }}</span>
              <span class="stat-label">{{ t('dealer.since') }}</span>
            </div>
            <template v-if="dealer.rating !== null && dealer.rating !== undefined">
              <div class="stat-separator" />
              <div class="stat-item">
                <span class="stat-value">{{ dealer.rating.toFixed(1) }}</span>
                <span class="stat-label">{{ t('dealer.rating') }}</span>
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>

    <!-- 3. Contact bar -->
    <div class="dealer-contact-bar">
      <a
        v-if="showPhone && dealer.phone"
        :href="`tel:${dealer.phone}`"
        class="contact-btn contact-call"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path
            d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"
          />
        </svg>
        <span>{{ t('dealer.call') }}</span>
      </a>

      <a
        v-if="dealer.whatsapp"
        :href="`https://wa.me/${dealer.whatsapp}`"
        target="_blank"
        rel="noopener"
        class="contact-btn contact-whatsapp"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path
            d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"
          />
          <path
            d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.5.5 0 00.611.611l4.458-1.495A11.943 11.943 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22a9.94 9.94 0 01-5.39-1.586l-.386-.232-2.646.887.887-2.646-.232-.386A9.94 9.94 0 012 12C2 6.486 6.486 2 12 2s10 4.486 10 10-4.486 10-10 10z"
          />
        </svg>
        <span>{{ t('dealer.whatsapp') }}</span>
      </a>

      <a
        v-if="showEmail && dealer.email"
        :href="`mailto:${dealer.email}`"
        class="contact-btn contact-email"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
          <polyline points="22,6 12,13 2,6" />
        </svg>
        <span>{{ t('dealer.contact') }}</span>
      </a>
    </div>

    <!-- 3b. Working hours -->
    <div v-if="workingHours" class="dealer-working-hours">
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
      <span>{{ workingHours }}</span>
    </div>

    <!-- 4. About section -->
    <section v-if="bioText" class="dealer-section">
      <h2 class="section-title">{{ t('dealer.about') }}</h2>
      <p class="dealer-bio">{{ bioText }}</p>
    </section>

    <!-- 5. Certifications -->
    <section v-if="dealer.certifications && dealer.certifications.length" class="dealer-section">
      <h2 class="section-title">{{ t('dealer.certifications') }}</h2>
      <div class="certifications-list">
        <span
          v-for="(cert, idx) in dealer.certifications"
          :key="idx"
          :class="['certification-pill', { verified: cert.verified }]"
        >
          <img
            v-if="cert.icon"
            :src="cert.icon"
            :alt="localizedField(cert.label, locale)"
            class="cert-icon"
          >
          <span>{{ localizedField(cert.label, locale) }}</span>
          <svg
            v-if="cert.verified"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="var(--color-success)"
            class="cert-check"
          >
            <path
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              stroke="white"
              stroke-width="2"
              fill="var(--color-success)"
            />
          </svg>
        </span>
      </div>
    </section>

    <!-- 6. Contact form -->
    <section class="dealer-section">
      <h2 class="section-title">{{ t('dealer.contactFormTitle') }}</h2>
      <form class="contact-form" @submit.prevent="submitContactForm">
        <div v-if="formSent" class="form-success">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <span>{{ t('dealer.contactFormSent') }}</span>
        </div>
        <template v-else>
          <div class="form-row">
            <input
              v-model="form.name"
              type="text"
              :placeholder="t('dealer.contactFormName')"
              class="form-input"
              required
              maxlength="100"
            >
            <input
              v-model="form.phone"
              type="tel"
              :placeholder="t('dealer.contactFormPhone')"
              class="form-input"
              maxlength="30"
            >
          </div>
          <textarea
            v-model="form.message"
            :placeholder="t('dealer.contactFormMessage')"
            class="form-textarea"
            rows="3"
            required
            maxlength="1000"
          />
          <p v-if="formError" class="form-error">{{ t('dealer.contactFormError') }}</p>
          <button type="submit" class="form-submit" :disabled="formLoading">
            <span v-if="formLoading">...</span>
            <span v-else>{{ t('dealer.contactFormSend') }}</span>
          </button>
        </template>
      </form>
    </section>

    <!-- 7. Vehicle catalog section -->
    <section class="dealer-catalog">
      <h2 class="dealer-catalog-title">
        {{ t('dealer.ourCatalog', { count: dealer.active_listings }) }}
      </h2>
      <CatalogControlsBar
        :vehicle-count="vehicles.length"
        :menu-visible="menuVisible"
        @search="onSearchChange"
        @sort="onSortChange"
        @toggle-menu="menuVisible = !menuVisible"
        @action-change="onActionChange"
        @open-favorites="() => {}"
        @view-change="() => {}"
      />
      <CatalogActiveFilters @change="onFilterChange" />
      <CatalogVehicleGrid
        :vehicles="vehicles"
        :loading="loading"
        :loading-more="loadingMore"
        :has-more="hasMore"
        :view-mode="viewMode"
        @load-more="onLoadMore"
        @clear-filters="onClearFilters"
      />
    </section>

    <!-- 7b. Discover more on Tracciona — subtle cross-sell at end of dealer catalog -->
    <div class="dealer-discover">
      <div class="discover-inner">
        <div class="discover-text">
          <p class="discover-title">{{ t('dealer.discoverMoreTitle') }}</p>
          <p class="discover-desc">{{ t('dealer.discoverMoreDesc') }}</p>
        </div>
        <NuxtLink to="/" class="discover-cta">
          {{ t('dealer.discoverMoreCta') }}
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            aria-hidden="true"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </NuxtLink>
      </div>
    </div>

    <!-- 7. Social links -->
    <section v-if="hasSocialLinks" class="dealer-section">
      <h2 class="section-title">{{ t('dealer.followUs') }}</h2>
      <div class="social-links">
        <a
          v-for="(url, platform) in dealer.social_links"
          :key="platform"
          :href="url"
          target="_blank"
          rel="noopener noreferrer"
          class="social-link"
          :title="String(platform)"
        >
          <!-- Facebook -->
          <svg
            v-if="platform === 'facebook'"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path
              d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
            />
          </svg>
          <!-- Instagram -->
          <svg
            v-else-if="platform === 'instagram'"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path
              d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"
            />
          </svg>
          <!-- LinkedIn -->
          <svg
            v-else-if="platform === 'linkedin'"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path
              d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"
            />
          </svg>
          <!-- Twitter / X -->
          <svg
            v-else-if="platform === 'twitter' || platform === 'x'"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path
              d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
            />
          </svg>
          <!-- YouTube -->
          <svg
            v-else-if="platform === 'youtube'"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path
              d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"
            />
          </svg>
          <!-- Fallback: generic link icon -->
          <svg
            v-else
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
          </svg>
        </a>
      </div>
    </section>

    <!-- Website link -->
    <div v-if="showWebsite && dealer.website" class="dealer-website">
      <a :href="dealer.website" target="_blank" rel="noopener noreferrer" class="website-link">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path
            d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"
          />
        </svg>
        <span>{{ t('dealer.visitWebsite') }}</span>
      </a>
    </div>
  </div>
</template>

<script setup lang="ts">
import { localizedField } from '~/composables/useLocalized'
import { useDealerTheme } from '~/composables/useDealerTheme'
import type { SortOption } from '~/composables/useCatalogState'

interface DealerProfile {
  id: string
  slug: string
  company_name: Record<string, string>
  logo_url: string | null
  cover_image_url: string | null
  theme: Record<string, string> | null
  bio: Record<string, string> | null
  phone: string | null
  whatsapp: string | null
  email: string | null
  website: string | null
  address: string | null
  badge: string | null
  subscription_type: string | null
  social_links: Record<string, string> | null
  certifications: Array<{ label: Record<string, string>; icon: string; verified: boolean }> | null
  pinned_vehicles: string[] | null
  catalog_sort: string | null
  contact_config: Record<string, unknown> | null
  active_listings: number
  total_leads: number
  rating: number | null
  created_at: string
}

const props = defineProps<{
  dealer: DealerProfile
}>()

const { t, locale } = useI18n()
const { applyDealerTheme, restoreVerticalTheme } = useDealerTheme()

// Aislamos el estado del catálogo del dealer del catálogo global
provide('catalogScope', `dealer-${props.dealer.id}`)

// Catalog state + vehicles — instancia propia, no comparte estado con catálogo principal
const { vehicles, loading, loadingMore, hasMore, fetchVehicles, fetchMore, reset } = useVehicles()
const { filters, sortBy, viewMode, resetCatalog } = useCatalogState()
const { reset: resetFilters } = useFilters()
const menuVisible = ref(false)

// Filtros base del dealer (siempre fijos, no se pueden eliminar)
const dealerFilters = computed(() => ({ ...filters.value, dealer_id: props.dealer.id }))

async function loadVehicles() {
  await fetchVehicles({ ...dealerFilters.value, sortBy: sortBy.value })
}

async function onActionChange() {
  resetFilters()
  await loadVehicles()
}

async function onFilterChange() {
  await loadVehicles()
}

function onSearchChange() {
  // búsqueda fuzzy client-side, no requiere refetch
}

async function onSortChange() {
  await loadVehicles()
}

async function onLoadMore() {
  await fetchMore({ ...dealerFilters.value, sortBy: sortBy.value })
}

async function onClearFilters() {
  resetCatalog()
  resetFilters()
  await fetchVehicles({ dealer_id: props.dealer.id })
}

// Localized fields
const companyName = computed(() => localizedField(props.dealer.company_name, locale.value))
const bioText = computed(() => localizedField(props.dealer.bio, locale.value))

// Badge: explicit badge field takes priority, fallback to subscription_type
const badgeKey = computed(() => {
  if (props.dealer.badge && props.dealer.badge !== 'none') return props.dealer.badge
  const sub = props.dealer.subscription_type
  if (sub === 'founding') return 'founding'
  if (sub === 'premium') return 'premium'
  return null
})
const badgeLabel = computed(() => {
  const key = badgeKey.value
  if (!key) return ''
  const i18nKeys: Record<string, string> = {
    founding: 'dealer.badgeFounding',
    premium: 'dealer.badgePremium',
    verified: 'dealer.badgeVerified',
  }
  const i18nKey = i18nKeys[key]
  return i18nKey ? t(i18nKey) : ''
})

// "Since" year from created_at
const sinceYear = computed(() => {
  if (!props.dealer.created_at) return ''
  return new Date(props.dealer.created_at).getFullYear().toString()
})

// contact_config flags
const contactConfig = computed(() => props.dealer.contact_config ?? {})
const showPhone = computed(() => {
  const mode = contactConfig.value.phone_mode as string | undefined
  return mode !== 'hidden'
})
const showEmail = computed(() => contactConfig.value.show_email !== false)
const showWebsite = computed(() => contactConfig.value.show_website !== false)

// Working hours (localized)
const workingHours = computed(() => {
  const wh = contactConfig.value.working_hours as Record<string, string> | undefined
  if (!wh) return ''
  return wh[locale.value] || wh['es'] || ''
})

// Social links presence check
const hasSocialLinks = computed(() => {
  const links = props.dealer.social_links
  return links && Object.keys(links).length > 0
})

// Contact form state
const supabase = useSupabaseClient()
const form = reactive({ name: '', phone: '', message: '' })
const formLoading = ref(false)
const formSent = ref(false)
const formError = ref(false)

async function submitContactForm() {
  formLoading.value = true
  formError.value = false
  const { error } = await supabase.from('leads').insert({
    dealer_id: props.dealer.id,
    buyer_name: form.name,
    buyer_phone: form.phone || null,
    message: form.message,
    source: 'dealer_portal',
    source_url: typeof window !== 'undefined' ? window.location.href : null,
  })
  formLoading.value = false
  if (error) {
    formError.value = true
  } else {
    formSent.value = true
  }
}

// SEO — OG + JSON-LD
const seoDescription = props.dealer.address
  ? t('dealer.seoDescription', { name: companyName.value, location: props.dealer.address })
  : t('dealer.seoDescriptionNoLocation', { name: companyName.value })

const canonicalUrl = `https://tracciona.com/${props.dealer.slug}`
const ogImage = props.dealer.cover_image_url || props.dealer.logo_url || null

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  name: companyName.value,
  description: seoDescription,
  url: canonicalUrl,
  ...(ogImage ? { image: ogImage } : {}),
  ...(props.dealer.phone ? { telephone: props.dealer.phone } : {}),
  ...(props.dealer.email ? { email: props.dealer.email } : {}),
  ...(props.dealer.address
    ? { address: { '@type': 'PostalAddress', streetAddress: props.dealer.address } }
    : {}),
  ...(props.dealer.website ? { sameAs: [props.dealer.website] } : {}),
}

useHead({
  title: `${companyName.value} — ${t('dealer.seoSuffix')}`,
  meta: [
    { name: 'description', content: seoDescription },
    { property: 'og:title', content: `${companyName.value} — ${t('dealer.seoSuffix')}` },
    { property: 'og:description', content: seoDescription },
    { property: 'og:url', content: canonicalUrl },
    { property: 'og:type', content: 'website' },
    ...(ogImage ? [{ property: 'og:image', content: ogImage }] : []),
  ],
  link: [{ rel: 'canonical', href: canonicalUrl }],
  script: [{ type: 'application/ld+json', innerHTML: JSON.stringify(jsonLd) }],
})

// Apply dealer theme on mount, restore on unmount
onMounted(async () => {
  applyDealerTheme(props.dealer.theme)
  // Inicializar sort por defecto según configuración del dealer
  const { setSort } = useCatalogState()
  if (props.dealer.catalog_sort) {
    setSort(props.dealer.catalog_sort as SortOption)
  }
  await loadVehicles()
})

onUnmounted(() => {
  restoreVerticalTheme()
  reset()
  resetCatalog()
})
</script>

<style scoped>
/* ============================================
   DEALER PORTAL — Base = mobile (360px)
   ============================================ */
.dealer-portal {
  width: 100%;
  max-width: var(--container-max-width);
  margin: 0 auto;
  background: var(--bg-secondary);
}

/* 1. Cover image */
.dealer-cover {
  width: 100%;
  aspect-ratio: 2 / 1;
  overflow: hidden;
  position: relative;
}

.cover-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cover-gradient {
  width: 100%;
  height: 100%;
  background: linear-gradient(
    135deg,
    var(--color-primary) 0%,
    var(--color-primary-light) 50%,
    var(--color-accent) 100%
  );
}

/* 2. Header section */
.dealer-header {
  background: var(--bg-primary);
  padding: var(--spacing-4) var(--spacing-4) var(--spacing-6);
  border-bottom: 1px solid var(--border-color-light);
}

.header-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-4);
  text-align: center;
}

.logo-wrapper {
  margin-top: -56px;
  position: relative;
  z-index: 2;
}

.dealer-logo {
  width: 80px;
  height: 80px;
  border-radius: var(--border-radius-full);
  object-fit: cover;
  border: 4px solid var(--bg-primary);
  box-shadow: var(--shadow-md);
  background: var(--bg-primary);
}

.dealer-logo-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-secondary);
  color: var(--text-auxiliary);
}

.header-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-3);
}

.name-badge-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-2);
}

.dealer-name {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
  line-height: var(--line-height-tight);
}

.dealer-badge {
  display: inline-flex;
  align-items: center;
  padding: var(--spacing-1) var(--spacing-3);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  border-radius: var(--border-radius-full);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  white-space: nowrap;
}

.badge-founding {
  background: linear-gradient(135deg, #f5d547 0%, var(--color-gold) 100%);
  color: #5a4500;
}

.badge-premium {
  background: linear-gradient(135deg, var(--color-primary-light) 0%, var(--color-primary) 100%);
  color: var(--color-white);
}

.badge-verified {
  background: var(--color-success);
  color: var(--color-white);
}

.dealer-location {
  display: flex;
  align-items: center;
  gap: var(--spacing-1);
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.dealer-location svg {
  flex-shrink: 0;
  stroke: var(--text-auxiliary);
}

.dealer-stats {
  display: flex;
  align-items: center;
  gap: var(--spacing-4);
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.stat-value {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
}

.stat-label {
  font-size: var(--font-size-xs);
  color: var(--text-auxiliary);
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.stat-separator {
  width: 1px;
  height: 32px;
  background: var(--border-color-light);
}

/* 3. Contact bar */
.dealer-contact-bar {
  display: flex;
  gap: var(--spacing-2);
  padding: var(--spacing-4);
  background: var(--bg-primary);
  border-bottom: 1px solid var(--border-color-light);
}

.contact-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-2);
  min-height: 44px;
  padding: var(--spacing-3) var(--spacing-4);
  border-radius: var(--border-radius);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  text-decoration: none;
  transition: all var(--transition-fast);
  cursor: pointer;
}

.contact-call {
  background: var(--color-primary);
  color: var(--color-white);
}

.contact-call:hover {
  background: var(--color-primary-dark);
  color: var(--color-white);
}

.contact-whatsapp {
  background: #25d366;
  color: var(--color-white);
}

.contact-whatsapp:hover {
  background: #1da851;
  color: var(--color-white);
}

.contact-email {
  background: var(--bg-secondary);
  color: var(--color-primary);
  border: 1px solid var(--border-color);
}

.contact-email:hover {
  background: var(--bg-tertiary);
  color: var(--color-primary);
}

/* 4-7. Section cards */
.dealer-section {
  background: var(--bg-primary);
  margin: var(--spacing-3) var(--spacing-4);
  padding: var(--spacing-5);
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-sm);
}

.section-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-primary);
  margin-bottom: var(--spacing-4);
}

/* About */
.dealer-bio {
  font-size: var(--font-size-base);
  line-height: var(--line-height-relaxed);
  color: var(--text-secondary);
  white-space: pre-line;
}

/* Certifications */
.certifications-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-2);
}

.certification-pill {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-2);
  padding: var(--spacing-2) var(--spacing-3);
  background: var(--bg-secondary);
  border: 1px solid var(--border-color-light);
  border-radius: var(--border-radius-full);
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.certification-pill.verified {
  border-color: var(--color-success);
  background: rgba(16, 185, 129, 0.06);
}

.cert-icon {
  width: 18px;
  height: 18px;
  object-fit: contain;
  flex-shrink: 0;
}

.cert-check {
  flex-shrink: 0;
}

/* Vehicle catalog placeholder */
.catalog-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-12) var(--spacing-4);
  border: 2px dashed var(--border-color);
  border-radius: var(--border-radius);
  color: var(--text-auxiliary);
  text-align: center;
  gap: var(--spacing-3);
}

.placeholder-text {
  font-size: var(--font-size-sm);
  color: var(--text-auxiliary);
}

/* Social links */
.social-links {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-3);
}

.social-link {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: var(--border-radius-full);
  background: var(--bg-secondary);
  color: var(--color-primary);
  transition: all var(--transition-fast);
  text-decoration: none;
}

.social-link:hover {
  background: var(--color-primary);
  color: var(--color-white);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

/* Working hours */
.dealer-working-hours {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  padding: var(--spacing-3) var(--spacing-4);
  background: var(--bg-primary);
  border-bottom: 1px solid var(--border-color-light);
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.dealer-working-hours svg {
  flex-shrink: 0;
  stroke: var(--color-success);
}

/* Contact form */
.contact-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

.form-row {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

.form-input,
.form-textarea {
  width: 100%;
  padding: var(--spacing-3) var(--spacing-4);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  background: var(--bg-secondary);
  transition: border-color var(--transition-fast);
  font-family: inherit;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: var(--color-primary);
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
}

.form-submit {
  min-height: 44px;
  padding: var(--spacing-3) var(--spacing-6);
  background: var(--color-primary);
  color: var(--color-white);
  border: none;
  border-radius: var(--border-radius);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: background var(--transition-fast);
  align-self: flex-start;
}

.form-submit:hover:not(:disabled) {
  background: var(--color-primary-dark);
}

.form-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.form-success {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  padding: var(--spacing-4);
  background: rgba(16, 185, 129, 0.08);
  border: 1px solid var(--color-success);
  border-radius: var(--border-radius);
  color: var(--color-success);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
}

.form-error {
  font-size: var(--font-size-sm);
  color: var(--color-error);
}

@media (min-width: 480px) {
  .form-row {
    flex-direction: row;
  }

  .dealer-working-hours {
    padding: var(--spacing-3) var(--spacing-6);
  }
}

@media (min-width: 768px) {
  .dealer-working-hours {
    padding: var(--spacing-3) var(--spacing-8);
  }
}

/* Dealer catalog */
.dealer-catalog {
  margin-top: var(--spacing-3);
}

.dealer-catalog-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-primary);
  padding: var(--spacing-5) var(--spacing-4) var(--spacing-2);
}

@media (min-width: 480px) {
  .dealer-catalog-title {
    padding: var(--spacing-5) var(--spacing-6) var(--spacing-2);
  }
}

@media (min-width: 768px) {
  .dealer-catalog-title {
    padding: var(--spacing-5) var(--spacing-8) var(--spacing-2);
    font-size: var(--font-size-xl);
  }
}

/* Website link */
.dealer-website {
  padding: var(--spacing-4);
  text-align: center;
}

.website-link {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-2);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-primary);
  text-decoration: none;
  padding: var(--spacing-2) var(--spacing-4);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  transition: all var(--transition-fast);
}

.website-link:hover {
  background: var(--color-primary);
  color: var(--color-white);
  border-color: var(--color-primary);
}

/* ============================================
   RESPONSIVE: >= 480px
   ============================================ */
@media (min-width: 480px) {
  .dealer-name {
    font-size: var(--font-size-2xl);
  }

  .dealer-section {
    margin: var(--spacing-4) var(--spacing-6);
    padding: var(--spacing-6);
  }

  .dealer-contact-bar {
    padding: var(--spacing-4) var(--spacing-6);
  }

  .contact-btn {
    font-size: var(--font-size-base);
  }
}

/* ============================================
   RESPONSIVE: >= 768px (tablet)
   ============================================ */
@media (min-width: 768px) {
  .dealer-header {
    padding: var(--spacing-4) var(--spacing-8) var(--spacing-6);
  }

  .header-inner {
    flex-direction: row;
    align-items: flex-end;
    text-align: left;
  }

  .logo-wrapper {
    margin-top: -64px;
  }

  .dealer-logo {
    width: 100px;
    height: 100px;
  }

  .header-info {
    align-items: flex-start;
    flex: 1;
  }

  .name-badge-row {
    justify-content: flex-start;
  }

  .dealer-stats {
    gap: var(--spacing-6);
  }

  .dealer-contact-bar {
    padding: var(--spacing-4) var(--spacing-8);
    gap: var(--spacing-3);
  }

  .dealer-section {
    margin: var(--spacing-4) var(--spacing-8);
  }

  .dealer-website {
    padding: var(--spacing-4) var(--spacing-8);
  }
}

/* ============================================
   RESPONSIVE: >= 1024px (desktop)
   ============================================ */
@media (min-width: 1024px) {
  .dealer-cover {
    aspect-ratio: 3 / 1;
  }

  .dealer-name {
    font-size: var(--font-size-3xl);
  }

  .section-title {
    font-size: var(--font-size-xl);
  }

  .dealer-contact-bar {
    max-width: 600px;
    margin: 0 auto;
    padding: var(--spacing-5) var(--spacing-8);
    gap: var(--spacing-4);
  }

  .contact-btn {
    padding: var(--spacing-3) var(--spacing-6);
    border-radius: var(--border-radius-md);
  }

  .dealer-section {
    margin: var(--spacing-5) var(--spacing-8);
    padding: var(--spacing-8);
  }
}

/* ── Discover more card ── */
.dealer-discover {
  margin: 0 var(--spacing-3) var(--spacing-2);
}

.discover-inner {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
  padding: var(--spacing-4);
  background: var(--bg-secondary);
  border: 1px solid var(--border-color-light);
  border-radius: var(--border-radius-md);
}

.discover-title {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
}

.discover-desc {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  margin-top: var(--spacing-1);
}

.discover-cta {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-1);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-primary);
  text-decoration: none;
  align-self: flex-start;
  min-height: 44px;
  padding: var(--spacing-2) 0;
}

@media (hover: hover) {
  .discover-cta:hover {
    opacity: 0.75;
  }
}

@media (min-width: 480px) {
  .discover-inner {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }

  .discover-text {
    flex: 1;
  }

  .discover-cta {
    flex-shrink: 0;
    padding: var(--spacing-2) var(--spacing-3);
  }
}

@media (min-width: 768px) {
  .dealer-discover {
    margin: 0 var(--spacing-6) var(--spacing-4);
  }
}
</style>

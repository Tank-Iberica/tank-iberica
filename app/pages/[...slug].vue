<template>
  <div class="landing-page">
    <!-- Loading -->
    <div v-if="loading" class="landing-loading">
      <div class="skeleton-line wide" />
      <div class="skeleton-line medium" />
      <div class="landing-skeleton-grid">
        <div v-for="i in 6" :key="i" class="skeleton-card">
          <div class="skeleton-img" />
          <div class="skeleton-text">
            <div class="skeleton-line wide" />
            <div class="skeleton-line medium" />
          </div>
        </div>
      </div>
    </div>

    <!-- Not found -->
    <div v-else-if="!resolvedType" class="landing-not-found">
      <h1>404</h1>
      <p>{{ $t('seo.errorDescription') }}</p>
      <NuxtLink to="/" class="back-link">
        {{ $t('nav.home') }}
      </NuxtLink>
    </div>

    <!-- Dealer portal -->
    <DealerPortal v-else-if="resolvedType === 'dealer'" :dealer="dealer!" />

    <!-- Landing page content -->
    <template v-else-if="resolvedType === 'landing'">
      <div class="landing-container">
        <!-- Breadcrumbs -->
        <UiBreadcrumbNav v-if="breadcrumbItems.length" :items="breadcrumbItems" />

        <!-- Header -->
        <div class="landing-header">
          <h1 class="landing-title">{{ landingTitle }}</h1>
          <p v-if="landingDescription" class="landing-description">{{ landingDescription }}</p>
          <p v-if="landing!.vehicle_count" class="landing-count">
            {{ $t('catalog.resultsCount', { count: landing!.vehicle_count, itemsName: $t('vertical.itemsName') }) }}
          </p>
        </div>

        <!-- Intro text -->
        <div v-if="introText" class="landing-intro">
          {{ introText }}
        </div>

        <!-- Vehicles will be rendered here by the catalog system -->
        <div class="landing-catalog-placeholder">
          <p>{{ $t('catalog.comingSoon') }}</p>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { RESERVED_SLUGS } from '~/utils/reserved-slugs'
import { buildFaqPageSchema } from '~/utils/faqSchema'
import { buildItemListSchema } from '~/utils/itemListSchema'

const route = useRoute()
const { locale, t } = useI18n()
const supabase = useSupabaseClient()

const slugParts = computed(() => {
  const params = route.params.slug
  if (Array.isArray(params)) return params
  return params ? [params] : []
})

const fullSlug = computed(() => slugParts.value.join('/'))

// Block reserved slugs — they should never reach the catch-all
const isReserved = computed(() => {
  const first = slugParts.value[0]
  return first ? RESERVED_SLUGS.includes(first) : false
})

interface Landing {
  id: string
  slug: string
  vertical: string
  vehicle_count: number
  meta_title_es: string | null
  meta_title_en: string | null
  meta_description_es: string | null
  meta_description_en: string | null
  intro_text_es: string | null
  intro_text_en: string | null
  breadcrumb: Array<{ label: string; to?: string }> | null
  schema_data: Record<string, unknown> | null
}

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
  location_data: Record<string, unknown> | null
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

// Resolution order per K.9:
// 1. active_landings WHERE slug = input AND is_active = true → landing
// 2. dealers WHERE slug = input AND status = 'active' → dealer portal
// 3. Nothing → 404
async function resolveSlug(): Promise<
  { type: 'landing'; data: Landing } | { type: 'dealer'; data: DealerProfile } | null
> {
  if (isReserved.value || !fullSlug.value) return null

  // 1. Try active_landings
  const { data: landingData } = await supabase
    .from('active_landings')
    .select('id, slug, vertical, vehicle_count, meta_title_es, meta_title_en, meta_description_es, meta_description_en, intro_text_es, intro_text_en, breadcrumb, schema_data')
    .eq('slug', fullSlug.value)
    .eq('is_active', true)
    .single()

  if (landingData) return { type: 'landing', data: landingData as Landing }

  // 2. Try dealers (only for single-segment slugs)
  if (slugParts.value.length === 1) {
    const { data: dealerData } = await supabase
      .from('dealers')
      .select(
        'id, slug, company_name, logo_url, cover_image_url, theme, bio, phone, whatsapp, email, website, location_data, address, badge, subscription_type, social_links, certifications, pinned_vehicles, catalog_sort, contact_config, active_listings, total_leads, rating, created_at',
      )
      .eq('slug', fullSlug.value)
      .eq('status', 'active')
      .single()

    if (dealerData) return { type: 'dealer', data: dealerData as unknown as DealerProfile }
  }

  // 3. Nothing found
  return null
}

const { data: resolved, status } = await useAsyncData(`slug-${fullSlug.value}`, () => resolveSlug())

const loading = computed(() => status.value === 'pending')
const resolvedType = computed(() => resolved.value?.type || null)
const landing = computed(() =>
  resolved.value?.type === 'landing' ? (resolved.value.data as Landing) : null,
)
const dealer = computed(() =>
  resolved.value?.type === 'dealer' ? (resolved.value.data as DealerProfile) : null,
)

// If reserved or not found after loading, show 404
if (!loading.value && !resolved.value && !isReserved.value) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found' })
}

const landingTitle = computed(() => {
  if (!landing.value) return ''
  if (locale.value === 'en' && landing.value.meta_title_en) return landing.value.meta_title_en
  return landing.value.meta_title_es || landing.value.slug.replaceAll('-', ' ')
})

const landingDescription = computed(() => {
  if (!landing.value) return ''
  if (locale.value === 'en' && landing.value.meta_description_en)
    return landing.value.meta_description_en
  return landing.value.meta_description_es || ''
})

const introText = computed(() => {
  if (!landing.value) return ''
  if (locale.value === 'en' && landing.value.intro_text_en) return landing.value.intro_text_en
  return landing.value.intro_text_es || ''
})

const breadcrumbItems = computed(() => {
  if (!landing.value) return []
  if (landing.value.breadcrumb && Array.isArray(landing.value.breadcrumb)) {
    return [{ label: t('nav.home'), to: '/' }, ...landing.value.breadcrumb]
  }
  return [{ label: t('nav.home'), to: '/' }, { label: landingTitle.value }]
})

// SEO for landing pages (dealer SEO is handled by DealerPortal component)
if (landing.value) {
  usePageSeo({
    title: `${landingTitle.value} — Tracciona`,
    description: landingDescription.value,
    path: `/${landing.value.slug}`,
    jsonLd: landing.value.schema_data || undefined,
  })

  // #166 — FAQPage schema for featured snippets
  const faqSchema = buildFaqPageSchema({
    title: landingTitle.value,
    count: landing.value.vehicle_count,
    locale: locale.value,
  })
  if (faqSchema) {
    useJsonLd(faqSchema)
  }

  // #167 — ItemList schema: fetch top 10 vehicles for this landing's vertical
  const { data: landingVehicles } = await useAsyncData(
    `landing-items-${fullSlug.value}`,
    async () => {
      const { data } = await supabase
        .from('vehicles')
        .select('slug, brand, model, year, vehicle_images(url, position)')
        .eq('status', 'published')
        .order('featured', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(10)
      return data ?? []
    },
  )

  if (landingVehicles.value?.length) {
    const siteUrl = useSiteUrl()
    const itemListSchema = buildItemListSchema(
      landingVehicles.value.map((v) => ({
        slug: v.slug as string,
        name: [v.brand, v.model, v.year ? `(${v.year})` : ''].filter(Boolean).join(' '),
        imageUrl: (v.vehicle_images as Array<{ url: string; position: number }>)
          ?.sort((a, b) => a.position - b.position)[0]?.url,
      })),
      siteUrl,
      landingTitle.value,
    )
    if (itemListSchema) {
      useJsonLd(itemListSchema)
    }
  }
}
</script>

<style scoped>
.landing-page {
  min-height: 60vh;
  padding: 1.5rem 0 3rem;
}

.landing-container {
  max-width: 75rem;
  margin: 0 auto;
  padding: 0 1rem;
}

.landing-header {
  margin-bottom: 1.5rem;
}

.landing-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-primary);
  margin-bottom: 0.5rem;
  text-transform: capitalize;
}

.landing-description {
  font-size: 0.95rem;
  color: var(--text-secondary);
  line-height: 1.5;
  margin-bottom: 0.5rem;
}

.landing-count {
  font-size: 0.85rem;
  color: var(--text-auxiliary);
}

.landing-intro {
  font-size: var(--font-size-sm);
  line-height: 1.7;
  color: var(--text-secondary);
  margin-bottom: var(--spacing-8);
  padding: var(--spacing-4);
  background: var(--bg-secondary);
  border-radius: var(--border-radius);
}

.landing-catalog-placeholder {
  text-align: center;
  padding: 3rem 0;
  color: var(--text-auxiliary);
}

/* Loading */
.landing-loading {
  max-width: 75rem;
  margin: 0 auto;
  padding: 0 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.landing-skeleton-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
  margin-top: 1rem;
}

.skeleton-card {
  border-radius: var(--border-radius-md);
  overflow: hidden;
  background: var(--bg-primary);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.skeleton-img {
  aspect-ratio: 16 / 9;
  background: var(--bg-secondary);
  animation: pulse 1.5s ease-in-out infinite;
}

.skeleton-text {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.skeleton-line {
  height: 1rem;
  background: var(--bg-secondary);
  border-radius: var(--border-radius-sm);
  animation: pulse 1.5s ease-in-out infinite;
}

.skeleton-line.wide {
  width: 80%;
}
.skeleton-line.medium {
  width: 50%;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

/* Not found */
.landing-not-found {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
  gap: 1rem;
  text-align: center;
  padding: 2rem;
}

.landing-not-found h1 {
  font-size: 4rem;
  font-weight: 700;
  color: var(--color-primary);
}

.landing-not-found p {
  font-size: 1rem;
  color: var(--text-secondary);
}

.back-link {
  color: var(--color-primary);
  text-decoration: none;
  font-weight: 500;
  padding: 0.625rem var(--spacing-6);
  border: 1px solid var(--color-primary);
  border-radius: var(--border-radius);
  min-height: 2.75rem;
  display: inline-flex;
  align-items: center;
  transition: all 0.2s;
}

.back-link:hover {
  background: var(--color-primary);
  color: white;
}

/* Tablet */
@media (min-width: 30em) {
  .landing-skeleton-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Desktop */
@media (min-width: 48em) {
  .landing-title {
    font-size: 2rem;
  }

  .landing-skeleton-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (min-width: 64em) {
  .landing-container,
  .landing-loading {
    padding: 0 2rem;
  }
}
</style>

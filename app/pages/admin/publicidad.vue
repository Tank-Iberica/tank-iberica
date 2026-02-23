<script setup lang="ts">
import type { Database } from '~/types/supabase'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const { t } = useI18n()
const supabase = useSupabaseClient<Database>()

// ─── Types ───────────────────────────────────────────────────
type Advertiser = {
  id: string
  company_name: string
  logo_url: string | null
  contact_email: string | null
  contact_phone: string | null
  website: string | null
  tax_id: string | null
  status: string
  created_at: string
  updated_at: string
}

type Ad = {
  id: string
  advertiser_id: string
  vertical: string | null
  title: string
  description: string | null
  image_url: string | null
  logo_url: string | null
  link_url: string | null
  phone: string | null
  email: string | null
  cta_text: Record<string, string> | null
  countries: string[] | null
  regions: string[] | null
  provinces: string[] | null
  category_slugs: string[] | null
  action_slugs: string[] | null
  positions: string[] | null
  format: string
  include_in_pdf: boolean
  include_in_email: boolean
  price_monthly_cents: number | null
  starts_at: string | null
  ends_at: string | null
  status: string
  impressions: number
  clicks: number
  created_at: string
  updated_at: string
  advertiser?: Advertiser
}

type AdEventAgg = {
  ad_id: string
  ad_title: string
  advertiser_name: string
  impressions: number
  clicks: number
  phone_clicks: number
  email_clicks: number
}

// ─── Constants ───────────────────────────────────────────────
const AD_POSITIONS = [
  'pro_teaser',
  'catalog_inline',
  'sidebar',
  'search_top',
  'vehicle_services',
  'dealer_portal',
  'landing_sidebar',
  'article_inline',
  'email_footer',
  'pdf_footer',
] as const

const AD_FORMATS = ['card', 'banner', 'text', 'logo_strip'] as const
const AD_STATUSES = ['draft', 'active', 'paused', 'ended'] as const
const ADVERTISER_STATUSES = ['active', 'inactive'] as const

const STATUS_COLORS: Record<string, string> = {
  active: '#16a34a',
  inactive: '#9ca3af',
  draft: '#6b7280',
  paused: '#d97706',
  ended: '#dc2626',
}

// ─── State ───────────────────────────────────────────────────
const activeTab = ref<'advertisers' | 'ads' | 'dashboard'>('advertisers')
const loading = ref(false)
const saving = ref(false)
const error = ref('')

// Advertisers
const advertisers = ref<Advertiser[]>([])
const advertiserModal = ref({
  show: false,
  editing: null as Advertiser | null,
  form: getEmptyAdvertiserForm(),
})

// Ads
const ads = ref<Ad[]>([])
const adModal = ref({
  show: false,
  editing: null as Ad | null,
  form: getEmptyAdForm(),
})

// Delete
const deleteModal = ref({
  show: false,
  type: '' as 'advertiser' | 'ad',
  id: '',
  name: '',
  confirmText: '',
})

// Dashboard
const dateRange = ref<'7d' | '30d' | '90d' | 'custom'>('30d')
const customFrom = ref('')
const customTo = ref('')
const dashboardData = ref<AdEventAgg[]>([])
const dashboardSummary = ref({
  totalImpressions: 0,
  totalClicks: 0,
  avgCTR: '0.0',
  activeAds: 0,
})

// ─── Computed ────────────────────────────────────────────────
const canDelete = computed(() => deleteModal.value.confirmText.toLowerCase() === 'borrar')

const advertiserMap = computed(() => {
  const map: Record<string, Advertiser> = {}
  for (const a of advertisers.value) {
    map[a.id] = a
  }
  return map
})

// ─── Empty forms ─────────────────────────────────────────────
function getEmptyAdvertiserForm() {
  return {
    company_name: '',
    contact_email: '',
    contact_phone: '',
    website: '',
    tax_id: '',
    logo_url: '',
    status: 'active' as string,
  }
}

function getEmptyAdForm() {
  return {
    advertiser_id: '',
    title: '',
    description: '',
    link_url: '',
    image_url: '',
    logo_url: '',
    phone: '',
    email: '',
    format: 'card' as string,
    positions: [] as string[],
    countries: '',
    regions: '',
    provinces: '',
    category_slugs: '',
    action_slugs: '',
    price_monthly_cents: 0,
    starts_at: '',
    ends_at: '',
    include_in_pdf: false,
    include_in_email: false,
    status: 'draft' as string,
  }
}

// ─── Format helpers ──────────────────────────────────────────
function formatPrice(cents: number | null): string {
  if (!cents) return '-'
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(cents / 100)
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function formatNumber(n: number): string {
  return new Intl.NumberFormat('es-ES').format(n)
}

function calcCTR(impressions: number, clicks: number): string {
  if (!impressions) return '0.0%'
  return ((clicks / impressions) * 100).toFixed(1) + '%'
}

function getStatusColor(status: string): string {
  return STATUS_COLORS[status] || '#6b7280'
}

// ─── Fetch Advertisers ───────────────────────────────────────
async function fetchAdvertisers() {
  loading.value = true
  error.value = ''
  try {
    const { data, error: err } = await supabase
      .from('advertisers')
      .select('*')
      .order('created_at', { ascending: false })
    if (err) throw err
    advertisers.value = (data || []) as Advertiser[]
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : String(e)
  } finally {
    loading.value = false
  }
}

// ─── Fetch Ads ───────────────────────────────────────────────
async function fetchAds() {
  loading.value = true
  error.value = ''
  try {
    const { data, error: err } = await supabase
      .from('ads')
      .select('*, advertiser:advertisers(id, company_name)')
      .order('created_at', { ascending: false })
    if (err) throw err
    ads.value = (data || []) as Ad[]
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : String(e)
  } finally {
    loading.value = false
  }
}

// ─── Fetch Dashboard ─────────────────────────────────────────
async function fetchDashboard() {
  loading.value = true
  error.value = ''
  try {
    const now = new Date()
    let fromDate: string

    if (dateRange.value === 'custom' && customFrom.value) {
      fromDate = customFrom.value
    } else {
      const days = dateRange.value === '7d' ? 7 : dateRange.value === '90d' ? 90 : 30
      const d = new Date(now)
      d.setDate(d.getDate() - days)
      fromDate = d.toISOString()
    }

    const toDate =
      dateRange.value === 'custom' && customTo.value
        ? new Date(customTo.value).toISOString()
        : now.toISOString()

    // Fetch ad_events in range
    const { data: events, error: err } = await supabase
      .from('ad_events')
      .select('ad_id, event_type')
      .gte('created_at', fromDate)
      .lte('created_at', toDate)

    if (err) throw err

    // Aggregate by ad_id
    const aggMap: Record<
      string,
      { impressions: number; clicks: number; phone_clicks: number; email_clicks: number }
    > = {}

    for (const ev of events || []) {
      if (!aggMap[ev.ad_id]) {
        aggMap[ev.ad_id] = { impressions: 0, clicks: 0, phone_clicks: 0, email_clicks: 0 }
      }
      if (ev.event_type === 'impression') aggMap[ev.ad_id].impressions++
      else if (ev.event_type === 'click') aggMap[ev.ad_id].clicks++
      else if (ev.event_type === 'phone_click') aggMap[ev.ad_id].phone_clicks++
      else if (ev.event_type === 'email_click') aggMap[ev.ad_id].email_clicks++
    }

    // Enrich with ad + advertiser names
    const adIds = Object.keys(aggMap)
    let adsInfo: Array<{ id: string; title: string; advertiser: { company_name: string } | null }> =
      []
    if (adIds.length) {
      const { data: adsData } = await supabase
        .from('ads')
        .select('id, title, advertiser:advertisers(company_name)')
        .in('id', adIds)
      adsInfo = (adsData || []) as typeof adsInfo
    }

    const adInfoMap: Record<string, { title: string; advertiser_name: string }> = {}
    for (const a of adsInfo) {
      adInfoMap[a.id] = {
        title: a.title,
        advertiser_name: (a.advertiser as { company_name: string } | null)?.company_name || '-',
      }
    }

    const result: AdEventAgg[] = Object.entries(aggMap)
      .map(([adId, agg]) => ({
        ad_id: adId,
        ad_title: adInfoMap[adId]?.title || adId,
        advertiser_name: adInfoMap[adId]?.advertiser_name || '-',
        ...agg,
      }))
      .sort((a, b) => b.impressions - a.impressions)

    dashboardData.value = result

    // Summary
    const totalImpressions = result.reduce((s, r) => s + r.impressions, 0)
    const totalClicks = result.reduce((s, r) => s + r.clicks, 0)

    // Active ads count
    const { count } = await supabase
      .from('ads')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active')

    dashboardSummary.value = {
      totalImpressions,
      totalClicks,
      avgCTR: calcCTR(totalImpressions, totalClicks),
      activeAds: count || 0,
    }
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : String(e)
  } finally {
    loading.value = false
  }
}

// ─── CRUD Advertisers ────────────────────────────────────────
function openNewAdvertiser() {
  advertiserModal.value = {
    show: true,
    editing: null,
    form: getEmptyAdvertiserForm(),
  }
}

function openEditAdvertiser(adv: Advertiser) {
  advertiserModal.value = {
    show: true,
    editing: adv,
    form: {
      company_name: adv.company_name,
      contact_email: adv.contact_email || '',
      contact_phone: adv.contact_phone || '',
      website: adv.website || '',
      tax_id: adv.tax_id || '',
      logo_url: adv.logo_url || '',
      status: adv.status,
    },
  }
}

function closeAdvertiserModal() {
  advertiserModal.value = { show: false, editing: null, form: getEmptyAdvertiserForm() }
}

async function saveAdvertiser() {
  saving.value = true
  error.value = ''
  try {
    const payload = {
      company_name: advertiserModal.value.form.company_name,
      contact_email: advertiserModal.value.form.contact_email || null,
      contact_phone: advertiserModal.value.form.contact_phone || null,
      website: advertiserModal.value.form.website || null,
      tax_id: advertiserModal.value.form.tax_id || null,
      logo_url: advertiserModal.value.form.logo_url || null,
      status: advertiserModal.value.form.status,
    }

    if (advertiserModal.value.editing) {
      const { error: err } = await supabase
        .from('advertisers')
        .update(payload)
        .eq('id', advertiserModal.value.editing.id)
      if (err) throw err
    } else {
      const { error: err } = await supabase.from('advertisers').insert(payload)
      if (err) throw err
    }

    closeAdvertiserModal()
    await fetchAdvertisers()
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : String(e)
  } finally {
    saving.value = false
  }
}

// ─── CRUD Ads ────────────────────────────────────────────────
function openNewAd() {
  adModal.value = {
    show: true,
    editing: null,
    form: getEmptyAdForm(),
  }
}

function openEditAd(ad: Ad) {
  adModal.value = {
    show: true,
    editing: ad,
    form: {
      advertiser_id: ad.advertiser_id,
      title: ad.title,
      description: ad.description || '',
      link_url: ad.link_url || '',
      image_url: ad.image_url || '',
      logo_url: ad.logo_url || '',
      phone: ad.phone || '',
      email: ad.email || '',
      format: ad.format,
      positions: ad.positions || [],
      countries: (ad.countries || []).join(','),
      regions: (ad.regions || []).join(','),
      provinces: (ad.provinces || []).join(','),
      category_slugs: (ad.category_slugs || []).join(','),
      action_slugs: (ad.action_slugs || []).join(','),
      price_monthly_cents: ad.price_monthly_cents || 0,
      starts_at: ad.starts_at ? ad.starts_at.slice(0, 16) : '',
      ends_at: ad.ends_at ? ad.ends_at.slice(0, 16) : '',
      include_in_pdf: ad.include_in_pdf,
      include_in_email: ad.include_in_email,
      status: ad.status,
    },
  }
}

function closeAdModal() {
  adModal.value = { show: false, editing: null, form: getEmptyAdForm() }
}

function csvToArray(val: string): string[] {
  return val
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

async function saveAd() {
  saving.value = true
  error.value = ''
  try {
    const f = adModal.value.form
    const payload = {
      advertiser_id: f.advertiser_id,
      title: f.title,
      description: f.description || null,
      link_url: f.link_url || null,
      image_url: f.image_url || null,
      logo_url: f.logo_url || null,
      phone: f.phone || null,
      email: f.email || null,
      format: f.format,
      positions: f.positions,
      countries: csvToArray(f.countries),
      regions: csvToArray(f.regions),
      provinces: csvToArray(f.provinces),
      category_slugs: csvToArray(f.category_slugs),
      action_slugs: csvToArray(f.action_slugs),
      price_monthly_cents: f.price_monthly_cents || null,
      starts_at: f.starts_at || null,
      ends_at: f.ends_at || null,
      include_in_pdf: f.include_in_pdf,
      include_in_email: f.include_in_email,
      status: f.status,
    }

    if (adModal.value.editing) {
      const { error: err } = await supabase
        .from('ads')
        .update(payload)
        .eq('id', adModal.value.editing.id)
      if (err) throw err
    } else {
      const { error: err } = await supabase.from('ads').insert(payload)
      if (err) throw err
    }

    closeAdModal()
    await fetchAds()
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : String(e)
  } finally {
    saving.value = false
  }
}

// ─── Delete ──────────────────────────────────────────────────
function confirmDeleteAdvertiser(adv: Advertiser) {
  deleteModal.value = {
    show: true,
    type: 'advertiser',
    id: adv.id,
    name: adv.company_name,
    confirmText: '',
  }
}

function confirmDeleteAd(ad: Ad) {
  deleteModal.value = {
    show: true,
    type: 'ad',
    id: ad.id,
    name: ad.title,
    confirmText: '',
  }
}

function closeDeleteModal() {
  deleteModal.value = { show: false, type: '' as 'advertiser', id: '', name: '', confirmText: '' }
}

async function executeDelete() {
  if (!canDelete.value) return
  saving.value = true
  error.value = ''
  try {
    const table = deleteModal.value.type === 'advertiser' ? 'advertisers' : 'ads'
    const { error: err } = await supabase.from(table).delete().eq('id', deleteModal.value.id)
    if (err) throw err

    closeDeleteModal()
    if (table === 'advertisers') await fetchAdvertisers()
    else await fetchAds()
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : String(e)
  } finally {
    saving.value = false
  }
}

// ─── Toggle position in ad form ──────────────────────────────
function togglePosition(pos: string) {
  const idx = adModal.value.form.positions.indexOf(pos)
  if (idx === -1) adModal.value.form.positions.push(pos)
  else adModal.value.form.positions.splice(idx, 1)
}

// ─── Tab switching & data load ───────────────────────────────
function switchTab(tab: 'advertisers' | 'ads' | 'dashboard') {
  activeTab.value = tab
  error.value = ''
  if (tab === 'advertisers') fetchAdvertisers()
  else if (tab === 'ads') {
    fetchAds()
    // Also ensure advertisers are loaded for the ad modal's select dropdown
    if (!advertisers.value.length) fetchAdvertisers()
  } else fetchDashboard()
}

// ─── Helper: get advertiser name for ad table ────────────────
function getAdvertiserName(ad: Ad): string {
  if (ad.advertiser && typeof ad.advertiser === 'object' && 'company_name' in ad.advertiser) {
    return (ad.advertiser as Advertiser).company_name
  }
  return advertiserMap.value[ad.advertiser_id]?.company_name || '-'
}

// ─── Init ────────────────────────────────────────────────────
onMounted(() => {
  fetchAdvertisers()
})

watch(dateRange, () => {
  if (activeTab.value === 'dashboard' && dateRange.value !== 'custom') {
    fetchDashboard()
  }
})
</script>

<template>
  <div class="admin-publicidad">
    <!-- Header -->
    <div class="section-header">
      <h2>{{ t('admin.publicidad.title') }}</h2>
    </div>

    <!-- Tabs -->
    <div class="tabs-bar">
      <button
        class="tab-btn"
        :class="{ active: activeTab === 'advertisers' }"
        @click="switchTab('advertisers')"
      >
        {{ t('admin.publicidad.advertisersTab') }}
      </button>
      <button class="tab-btn" :class="{ active: activeTab === 'ads' }" @click="switchTab('ads')">
        {{ t('admin.publicidad.adsTab') }}
      </button>
      <button
        class="tab-btn"
        :class="{ active: activeTab === 'dashboard' }"
        @click="switchTab('dashboard')"
      >
        {{ t('admin.publicidad.dashboardTab') }}
      </button>
    </div>

    <!-- Error -->
    <div v-if="error" class="error-banner">
      {{ error }}
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      {{ t('admin.publicidad.loading') }}
    </div>

    <!-- ═══════════════════════════════════════════════════════ -->
    <!-- TAB 1: ADVERTISERS                                      -->
    <!-- ═══════════════════════════════════════════════════════ -->
    <template v-if="!loading && activeTab === 'advertisers'">
      <div class="tab-header">
        <span class="total-badge"
          >{{ advertisers.length }} {{ t('admin.publicidad.records') }}</span
        >
        <button class="btn-primary" @click="openNewAdvertiser">
          + {{ t('admin.publicidad.createAdvertiser') }}
        </button>
      </div>

      <div class="table-container">
        <table class="admin-table">
          <thead>
            <tr>
              <th>{{ t('admin.publicidad.companyName') }}</th>
              <th>{{ t('admin.publicidad.contactEmail') }}</th>
              <th>{{ t('admin.publicidad.contactPhone') }}</th>
              <th>{{ t('admin.publicidad.website') }}</th>
              <th style="width: 100px">
                {{ t('admin.publicidad.status') }}
              </th>
              <th style="width: 130px">
                {{ t('admin.publicidad.actions') }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="adv in advertisers" :key="adv.id">
              <td>
                <strong>{{ adv.company_name }}</strong>
              </td>
              <td class="text-muted">
                {{ adv.contact_email || '-' }}
              </td>
              <td class="text-muted">
                {{ adv.contact_phone || '-' }}
              </td>
              <td class="text-muted">
                <a v-if="adv.website" :href="adv.website" target="_blank" rel="noopener">{{
                  adv.website
                }}</a>
                <span v-else>-</span>
              </td>
              <td>
                <span
                  class="status-badge"
                  :style="{
                    background: getStatusColor(adv.status) + '18',
                    color: getStatusColor(adv.status),
                    borderColor: getStatusColor(adv.status) + '40',
                  }"
                >
                  {{ t(`admin.publicidad.statusLabels.${adv.status}`) }}
                </span>
              </td>
              <td>
                <div class="action-buttons">
                  <button
                    class="btn-icon btn-view"
                    :title="t('admin.publicidad.edit')"
                    @click="openEditAdvertiser(adv)"
                  >
                    &#9998;
                  </button>
                  <button
                    class="btn-icon btn-delete"
                    :title="t('admin.publicidad.delete')"
                    @click="confirmDeleteAdvertiser(adv)"
                  >
                    &#10005;
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="!advertisers.length">
              <td colspan="6" class="empty-state">
                {{ t('admin.publicidad.noAdvertisers') }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>

    <!-- ═══════════════════════════════════════════════════════ -->
    <!-- TAB 2: ADS                                              -->
    <!-- ═══════════════════════════════════════════════════════ -->
    <template v-if="!loading && activeTab === 'ads'">
      <div class="tab-header">
        <span class="total-badge">{{ ads.length }} {{ t('admin.publicidad.records') }}</span>
        <button class="btn-primary" @click="openNewAd">
          + {{ t('admin.publicidad.createAd') }}
        </button>
      </div>

      <div class="table-container">
        <table class="admin-table">
          <thead>
            <tr>
              <th>{{ t('admin.publicidad.advertiser') }}</th>
              <th>{{ t('admin.publicidad.adTitle') }}</th>
              <th>{{ t('admin.publicidad.positions') }}</th>
              <th>{{ t('admin.publicidad.format') }}</th>
              <th style="width: 90px">
                {{ t('admin.publicidad.status') }}
              </th>
              <th style="width: 90px">
                {{ t('admin.publicidad.price') }}
              </th>
              <th style="width: 80px">
                {{ t('admin.publicidad.impressions') }}
              </th>
              <th style="width: 60px">
                {{ t('admin.publicidad.clicks') }}
              </th>
              <th style="width: 60px">CTR</th>
              <th style="width: 90px">
                {{ t('admin.publicidad.dates') }}
              </th>
              <th style="width: 100px">
                {{ t('admin.publicidad.actions') }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="ad in ads" :key="ad.id">
              <td>
                <strong>{{ getAdvertiserName(ad) }}</strong>
              </td>
              <td>{{ ad.title }}</td>
              <td>
                <div class="positions-list">
                  <span
                    v-for="pos in (ad.positions || []).slice(0, 3)"
                    :key="pos"
                    class="position-chip"
                  >
                    {{ pos }}
                  </span>
                  <span v-if="(ad.positions || []).length > 3" class="position-chip more">
                    +{{ (ad.positions || []).length - 3 }}
                  </span>
                </div>
              </td>
              <td>
                <span class="format-badge">{{ ad.format }}</span>
              </td>
              <td>
                <span
                  class="status-badge"
                  :style="{
                    background: getStatusColor(ad.status) + '18',
                    color: getStatusColor(ad.status),
                    borderColor: getStatusColor(ad.status) + '40',
                  }"
                >
                  {{ t(`admin.publicidad.statusLabels.${ad.status}`) }}
                </span>
              </td>
              <td class="text-right">
                {{ formatPrice(ad.price_monthly_cents) }}
              </td>
              <td class="text-right">
                {{ formatNumber(ad.impressions) }}
              </td>
              <td class="text-right">
                {{ formatNumber(ad.clicks) }}
              </td>
              <td class="text-right">
                {{ calcCTR(ad.impressions, ad.clicks) }}
              </td>
              <td>
                <div class="dates-cell">
                  <span>{{ formatDate(ad.starts_at) }}</span>
                  <span v-if="ad.ends_at">{{ formatDate(ad.ends_at) }}</span>
                </div>
              </td>
              <td>
                <div class="action-buttons">
                  <button
                    class="btn-icon btn-view"
                    :title="t('admin.publicidad.edit')"
                    @click="openEditAd(ad)"
                  >
                    &#9998;
                  </button>
                  <button
                    class="btn-icon btn-delete"
                    :title="t('admin.publicidad.delete')"
                    @click="confirmDeleteAd(ad)"
                  >
                    &#10005;
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="!ads.length">
              <td colspan="11" class="empty-state">
                {{ t('admin.publicidad.noAds') }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>

    <!-- ═══════════════════════════════════════════════════════ -->
    <!-- TAB 3: DASHBOARD                                        -->
    <!-- ═══════════════════════════════════════════════════════ -->
    <template v-if="!loading && activeTab === 'dashboard'">
      <!-- Date range selector -->
      <div class="date-range-bar">
        <button class="range-btn" :class="{ active: dateRange === '7d' }" @click="dateRange = '7d'">
          {{ t('admin.publicidad.last7d') }}
        </button>
        <button
          class="range-btn"
          :class="{ active: dateRange === '30d' }"
          @click="dateRange = '30d'"
        >
          {{ t('admin.publicidad.last30d') }}
        </button>
        <button
          class="range-btn"
          :class="{ active: dateRange === '90d' }"
          @click="dateRange = '90d'"
        >
          {{ t('admin.publicidad.last90d') }}
        </button>
        <button
          class="range-btn"
          :class="{ active: dateRange === 'custom' }"
          @click="dateRange = 'custom'"
        >
          {{ t('admin.publicidad.customRange') }}
        </button>
        <template v-if="dateRange === 'custom'">
          <input v-model="customFrom" type="date" class="date-input" >
          <input v-model="customTo" type="date" class="date-input" >
          <button class="btn-primary btn-sm" @click="fetchDashboard">
            {{ t('admin.publicidad.apply') }}
          </button>
        </template>
      </div>

      <!-- Summary cards -->
      <div class="stats-grid">
        <div class="stat-card">
          <span class="stat-value">{{ formatNumber(dashboardSummary.totalImpressions) }}</span>
          <span class="stat-label">{{ t('admin.publicidad.totalImpressions') }}</span>
        </div>
        <div class="stat-card">
          <span class="stat-value" style="color: #3b82f6">{{
            formatNumber(dashboardSummary.totalClicks)
          }}</span>
          <span class="stat-label">{{ t('admin.publicidad.totalClicks') }}</span>
        </div>
        <div class="stat-card">
          <span class="stat-value" style="color: #8b5cf6">{{ dashboardSummary.avgCTR }}</span>
          <span class="stat-label">{{ t('admin.publicidad.avgCtr') }}</span>
        </div>
        <div class="stat-card">
          <span class="stat-value" style="color: #16a34a">{{ dashboardSummary.activeAds }}</span>
          <span class="stat-label">{{ t('admin.publicidad.activeAds') }}</span>
        </div>
      </div>

      <!-- Analytics table -->
      <div class="table-container">
        <table class="admin-table">
          <thead>
            <tr>
              <th>{{ t('admin.publicidad.adTitle') }}</th>
              <th>{{ t('admin.publicidad.advertiser') }}</th>
              <th style="width: 90px">
                {{ t('admin.publicidad.impressions') }}
              </th>
              <th style="width: 70px">
                {{ t('admin.publicidad.clicks') }}
              </th>
              <th style="width: 60px">CTR</th>
              <th style="width: 90px">
                {{ t('admin.publicidad.phoneClicks') }}
              </th>
              <th style="width: 90px">
                {{ t('admin.publicidad.emailClicks') }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in dashboardData" :key="row.ad_id">
              <td>{{ row.ad_title }}</td>
              <td class="text-muted">
                {{ row.advertiser_name }}
              </td>
              <td class="text-right">
                {{ formatNumber(row.impressions) }}
              </td>
              <td class="text-right">
                {{ formatNumber(row.clicks) }}
              </td>
              <td class="text-right">
                {{ calcCTR(row.impressions, row.clicks) }}
              </td>
              <td class="text-right">
                {{ formatNumber(row.phone_clicks) }}
              </td>
              <td class="text-right">
                {{ formatNumber(row.email_clicks) }}
              </td>
            </tr>
            <tr v-if="!dashboardData.length">
              <td colspan="7" class="empty-state">
                {{ t('admin.publicidad.noEvents') }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>

    <!-- ═══════════════════════════════════════════════════════ -->
    <!-- MODAL: ADVERTISER CREATE / EDIT                         -->
    <!-- ═══════════════════════════════════════════════════════ -->
    <Teleport to="body">
      <div v-if="advertiserModal.show" class="modal-overlay" @click.self="closeAdvertiserModal">
        <div class="modal-content modal-medium">
          <div class="modal-header">
            <h3>
              {{
                advertiserModal.editing
                  ? t('admin.publicidad.editAdvertiser')
                  : t('admin.publicidad.createAdvertiser')
              }}
            </h3>
            <button class="modal-close" @click="closeAdvertiserModal">&times;</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label for="adv-name">{{ t('admin.publicidad.companyName') }} *</label>
              <input
                id="adv-name"
                v-model="advertiserModal.form.company_name"
                type="text"
                required
              >
            </div>
            <div class="form-row">
              <div class="form-group">
                <label for="adv-email">{{ t('admin.publicidad.contactEmail') }}</label>
                <input id="adv-email" v-model="advertiserModal.form.contact_email" type="email" >
              </div>
              <div class="form-group">
                <label for="adv-phone">{{ t('admin.publicidad.contactPhone') }}</label>
                <input id="adv-phone" v-model="advertiserModal.form.contact_phone" type="tel" >
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label for="adv-website">{{ t('admin.publicidad.website') }}</label>
                <input id="adv-website" v-model="advertiserModal.form.website" type="url" >
              </div>
              <div class="form-group">
                <label for="adv-tax">{{ t('admin.publicidad.taxId') }}</label>
                <input id="adv-tax" v-model="advertiserModal.form.tax_id" type="text" >
              </div>
            </div>
            <div class="form-group">
              <label for="adv-logo">{{ t('admin.publicidad.logoUrl') }}</label>
              <input
                id="adv-logo"
                v-model="advertiserModal.form.logo_url"
                type="text"
                placeholder="https://..."
              >
            </div>
            <div class="form-group">
              <label for="adv-status">{{ t('admin.publicidad.status') }}</label>
              <select id="adv-status" v-model="advertiserModal.form.status">
                <option v-for="s in ADVERTISER_STATUSES" :key="s" :value="s">
                  {{ t(`admin.publicidad.statusLabels.${s}`) }}
                </option>
              </select>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" @click="closeAdvertiserModal">
              {{ t('admin.publicidad.cancel') }}
            </button>
            <button
              class="btn-primary"
              :disabled="saving || !advertiserModal.form.company_name"
              @click="saveAdvertiser"
            >
              {{ saving ? t('admin.publicidad.saving') : t('admin.publicidad.save') }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ═══════════════════════════════════════════════════════ -->
    <!-- MODAL: AD CREATE / EDIT                                 -->
    <!-- ═══════════════════════════════════════════════════════ -->
    <Teleport to="body">
      <div v-if="adModal.show" class="modal-overlay" @click.self="closeAdModal">
        <div class="modal-content modal-large">
          <div class="modal-header">
            <h3>
              {{ adModal.editing ? t('admin.publicidad.editAd') : t('admin.publicidad.createAd') }}
            </h3>
            <button class="modal-close" @click="closeAdModal">&times;</button>
          </div>
          <div class="modal-body">
            <!-- Advertiser -->
            <div class="form-group">
              <label for="ad-advertiser">{{ t('admin.publicidad.advertiser') }} *</label>
              <select id="ad-advertiser" v-model="adModal.form.advertiser_id" required>
                <option value="" disabled>
                  {{ t('admin.publicidad.selectAdvertiser') }}
                </option>
                <option v-for="adv in advertisers" :key="adv.id" :value="adv.id">
                  {{ adv.company_name }}
                </option>
              </select>
            </div>

            <!-- Title / Description -->
            <div class="form-group">
              <label for="ad-title">{{ t('admin.publicidad.adTitle') }} *</label>
              <input id="ad-title" v-model="adModal.form.title" type="text" required >
            </div>
            <div class="form-group">
              <label for="ad-desc">{{ t('admin.publicidad.description') }}</label>
              <textarea id="ad-desc" v-model="adModal.form.description" rows="3" />
            </div>

            <!-- URLs -->
            <div class="form-row">
              <div class="form-group">
                <label for="ad-link">{{ t('admin.publicidad.linkUrl') }}</label>
                <input id="ad-link" v-model="adModal.form.link_url" type="url" >
              </div>
              <div class="form-group">
                <label for="ad-image">{{ t('admin.publicidad.imageUrl') }}</label>
                <input id="ad-image" v-model="adModal.form.image_url" type="text" >
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="ad-logo">{{ t('admin.publicidad.logoUrl') }}</label>
                <input id="ad-logo" v-model="adModal.form.logo_url" type="text" >
              </div>
              <div class="form-group">
                <label for="ad-phone">{{ t('admin.publicidad.phone') }}</label>
                <input id="ad-phone" v-model="adModal.form.phone" type="tel" >
              </div>
            </div>

            <div class="form-group">
              <label for="ad-email">{{ t('admin.publicidad.email') }}</label>
              <input id="ad-email" v-model="adModal.form.email" type="email" >
            </div>

            <!-- Format -->
            <div class="form-group">
              <label for="ad-format">{{ t('admin.publicidad.format') }} *</label>
              <select id="ad-format" v-model="adModal.form.format">
                <option v-for="f in AD_FORMATS" :key="f" :value="f">
                  {{ f }}
                </option>
              </select>
            </div>

            <!-- Positions -->
            <div class="form-group">
              <label>{{ t('admin.publicidad.positions') }}</label>
              <div class="checkbox-grid">
                <label v-for="pos in AD_POSITIONS" :key="pos" class="checkbox-item">
                  <input
                    type="checkbox"
                    :checked="adModal.form.positions.includes(pos)"
                    @change="togglePosition(pos)"
                  >
                  <span>{{ pos }}</span>
                </label>
              </div>
            </div>

            <!-- Geo targeting -->
            <div class="form-row">
              <div class="form-group">
                <label for="ad-countries">{{ t('admin.publicidad.countries') }}</label>
                <input
                  id="ad-countries"
                  v-model="adModal.form.countries"
                  type="text"
                  placeholder="ES,PT"
                >
              </div>
              <div class="form-group">
                <label for="ad-regions">{{ t('admin.publicidad.regions') }}</label>
                <input
                  id="ad-regions"
                  v-model="adModal.form.regions"
                  type="text"
                  placeholder="andalucia,cataluna"
                >
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="ad-provinces">{{ t('admin.publicidad.provinces') }}</label>
                <input
                  id="ad-provinces"
                  v-model="adModal.form.provinces"
                  type="text"
                  placeholder="madrid,barcelona"
                >
              </div>
              <div class="form-group">
                <label for="ad-cats">{{ t('admin.publicidad.categories') }}</label>
                <input
                  id="ad-cats"
                  v-model="adModal.form.category_slugs"
                  type="text"
                  placeholder="semirremolques,cisternas"
                >
              </div>
            </div>

            <div class="form-group">
              <label for="ad-actions">{{ t('admin.publicidad.actionSlugs') }}</label>
              <input
                id="ad-actions"
                v-model="adModal.form.action_slugs"
                type="text"
                placeholder="venta,alquiler"
              >
            </div>

            <!-- Price & dates -->
            <div class="form-row">
              <div class="form-group">
                <label for="ad-price">{{ t('admin.publicidad.priceMonthly') }}</label>
                <input
                  id="ad-price"
                  v-model.number="adModal.form.price_monthly_cents"
                  type="number"
                  min="0"
                >
              </div>
              <div class="form-group">
                <label for="ad-status">{{ t('admin.publicidad.status') }}</label>
                <select id="ad-status" v-model="adModal.form.status">
                  <option v-for="s in AD_STATUSES" :key="s" :value="s">
                    {{ t(`admin.publicidad.statusLabels.${s}`) }}
                  </option>
                </select>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="ad-starts">{{ t('admin.publicidad.startDate') }}</label>
                <input id="ad-starts" v-model="adModal.form.starts_at" type="datetime-local" >
              </div>
              <div class="form-group">
                <label for="ad-ends">{{ t('admin.publicidad.endDate') }}</label>
                <input id="ad-ends" v-model="adModal.form.ends_at" type="datetime-local" >
              </div>
            </div>

            <!-- Checkboxes -->
            <div class="form-row checkboxes-row">
              <label class="checkbox-item">
                <input v-model="adModal.form.include_in_pdf" type="checkbox" >
                <span>{{ t('admin.publicidad.includePdf') }}</span>
              </label>
              <label class="checkbox-item">
                <input v-model="adModal.form.include_in_email" type="checkbox" >
                <span>{{ t('admin.publicidad.includeEmail') }}</span>
              </label>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" @click="closeAdModal">
              {{ t('admin.publicidad.cancel') }}
            </button>
            <button
              class="btn-primary"
              :disabled="saving || !adModal.form.title || !adModal.form.advertiser_id"
              @click="saveAd"
            >
              {{ saving ? t('admin.publicidad.saving') : t('admin.publicidad.save') }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ═══════════════════════════════════════════════════════ -->
    <!-- MODAL: DELETE CONFIRMATION                              -->
    <!-- ═══════════════════════════════════════════════════════ -->
    <Teleport to="body">
      <div v-if="deleteModal.show" class="modal-overlay" @click.self="closeDeleteModal">
        <div class="modal-content modal-small">
          <div class="modal-header">
            <h3>{{ t('admin.publicidad.confirmDelete') }}</h3>
            <button class="modal-close" @click="closeDeleteModal">&times;</button>
          </div>
          <div class="modal-body">
            <p>
              {{ t('admin.publicidad.deleteText') }}
              <strong>{{ deleteModal.name }}</strong
              >?
            </p>
            <div class="form-group delete-confirm-group">
              <label for="delete-confirm">
                {{ t('admin.publicidad.typeBorrar') }}
              </label>
              <input
                id="delete-confirm"
                v-model="deleteModal.confirmText"
                type="text"
                placeholder="Borrar"
                autocomplete="off"
              >
              <p v-if="deleteModal.confirmText && !canDelete" class="text-error">
                {{ t('admin.publicidad.typeBorrarError') }}
              </p>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" @click="closeDeleteModal">
              {{ t('admin.publicidad.cancel') }}
            </button>
            <button class="btn-danger" :disabled="!canDelete || saving" @click="executeDelete">
              {{ t('admin.publicidad.delete') }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.admin-publicidad {
  padding: 0;
}

/* Header */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
}

.section-header h2 {
  margin: 0;
  font-size: 1.5rem;
}

/* Tabs */
.tabs-bar {
  display: flex;
  gap: 0;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 20px;
  background: white;
}

.tab-btn {
  flex: 1;
  padding: 12px 16px;
  border: none;
  background: white;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  color: #6b7280;
  transition: all 0.2s;
  min-height: 44px;
}

.tab-btn:not(:last-child) {
  border-right: 1px solid #e5e7eb;
}

.tab-btn.active {
  background: var(--color-primary, #23424a);
  color: white;
}

.tab-btn:hover:not(.active) {
  background: #f3f4f6;
}

/* Tab header (badge + action button) */
.tab-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 12px;
}

.total-badge {
  background: #f3f4f6;
  color: #6b7280;
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 0.85rem;
}

/* Error / Loading */
.error-banner {
  background: #fef2f2;
  color: #dc2626;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.loading-state {
  text-align: center;
  padding: 40px;
  color: #6b7280;
}

/* Table */
.table-container {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow-x: auto;
}

.admin-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 700px;
}

.admin-table th,
.admin-table td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
  font-size: 0.875rem;
}

.admin-table th {
  background: #f9fafb;
  font-weight: 600;
  color: #374151;
}

.admin-table tr:hover {
  background: #f9fafb;
}

.text-muted {
  color: #6b7280;
  font-size: 0.85rem;
}

.text-right {
  text-align: right;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #6b7280;
}

/* Status badge */
.status-badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  border: 1px solid;
  white-space: nowrap;
}

/* Positions chips */
.positions-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.position-chip {
  background: #f3f4f6;
  color: #4b5563;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.7rem;
  white-space: nowrap;
}

.position-chip.more {
  background: #dbeafe;
  color: #1d4ed8;
}

/* Format badge */
.format-badge {
  background: #ede9fe;
  color: #7c3aed;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
}

/* Dates cell */
.dates-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 0.8rem;
  color: #6b7280;
}

/* Action buttons */
.action-buttons {
  display: flex;
  gap: 8px;
}

.btn-icon {
  background: none;
  border: 1px solid #e5e7eb;
  padding: 6px 10px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
  min-width: 36px;
  min-height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-icon:hover {
  background: #f3f4f6;
}

.btn-view:hover {
  background: #dbeafe;
}

.btn-delete:hover {
  background: #fee2e2;
  color: #dc2626;
}

/* Date range bar (dashboard) */
.date-range-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  margin-bottom: 20px;
  padding: 12px 16px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.range-btn {
  padding: 8px 16px;
  border: 1px solid #e5e7eb;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 500;
  color: #6b7280;
  transition: all 0.2s;
  min-height: 44px;
}

.range-btn.active {
  background: var(--color-primary, #23424a);
  color: white;
  border-color: var(--color-primary, #23424a);
}

.range-btn:hover:not(.active) {
  background: #f3f4f6;
}

.date-input {
  padding: 8px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 0.85rem;
  min-height: 44px;
}

.date-input:focus {
  outline: none;
  border-color: var(--color-primary, #23424a);
}

/* Stats grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}

.stat-card {
  background: white;
  border-radius: 8px;
  padding: 20px 16px;
  text-align: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.stat-value {
  display: block;
  font-size: 1.75rem;
  font-weight: 700;
  color: #111827;
}

.stat-label {
  display: block;
  font-size: 0.8rem;
  color: #6b7280;
  margin-top: 4px;
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 100%;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  max-height: 90vh;
  overflow-y: auto;
}

.modal-small {
  max-width: 420px;
}

.modal-medium {
  max-width: 560px;
}

.modal-large {
  max-width: 720px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
  position: sticky;
  top: 0;
  background: white;
  z-index: 1;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
}

.modal-close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #6b7280;
  min-width: 44px;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-body {
  padding: 24px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
  position: sticky;
  bottom: 0;
}

/* Form */
.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  font-weight: 500;
  margin-bottom: 6px;
  color: #374151;
  font-size: 0.875rem;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.9rem;
  box-sizing: border-box;
  min-height: 44px;
}

.form-group textarea {
  resize: vertical;
  min-height: 80px;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--color-primary, #23424a);
  box-shadow: 0 0 0 3px rgba(35, 66, 74, 0.1);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

/* Checkbox grid for positions */
.checkbox-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.checkbox-item {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 8px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 0.85rem;
  min-height: 44px;
  transition: background 0.15s;
}

.checkbox-item:hover {
  background: #f9fafb;
}

.checkbox-item input[type='checkbox'] {
  width: 18px;
  height: 18px;
  cursor: pointer;
  flex-shrink: 0;
}

.checkboxes-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 8px;
}

.checkboxes-row .checkbox-item {
  flex: 0 0 auto;
}

/* Delete confirmation */
.delete-confirm-group {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
}

.delete-confirm-group input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.95rem;
  min-height: 44px;
}

.delete-confirm-group input:focus {
  outline: none;
  border-color: #dc2626;
  box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
}

.text-error {
  color: #dc2626;
  font-size: 0.75rem;
  margin-top: 4px;
}

/* Buttons */
.btn-primary {
  background: var(--color-primary, #23424a);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  min-height: 44px;
  font-size: 0.9rem;
}

.btn-primary:hover:not(:disabled) {
  opacity: 0.9;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary.btn-sm {
  padding: 8px 16px;
  font-size: 0.85rem;
  min-height: 40px;
}

.btn-secondary {
  background: #e5e7eb;
  color: #374151;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  min-height: 44px;
}

.btn-danger {
  background: #dc2626;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  min-height: 44px;
}

.btn-danger:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ─── Mobile ──────────────────────────────────────────────── */
@media (max-width: 768px) {
  .section-header {
    flex-direction: column;
    align-items: stretch;
  }

  .tabs-bar {
    flex-direction: column;
  }

  .tab-btn:not(:last-child) {
    border-right: none;
    border-bottom: 1px solid #e5e7eb;
  }

  .tab-header {
    flex-direction: column;
    align-items: stretch;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .checkbox-grid {
    grid-template-columns: 1fr;
  }

  .date-range-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .range-btn {
    text-align: center;
  }

  .admin-table {
    min-width: 600px;
  }
}

@media (max-width: 480px) {
  .stats-grid {
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }

  .stat-card {
    padding: 12px;
  }

  .stat-value {
    font-size: 1.4rem;
  }
}
</style>

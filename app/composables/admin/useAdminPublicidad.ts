import type { Database } from '~/types/supabase'
import { useAdminAdDashboard } from '~/composables/admin/useAdminAdDashboard'

// ─── Types ───────────────────────────────────────────────────
export type Advertiser = {
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

export type Ad = {
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

// ─── Constants ───────────────────────────────────────────────
export const AD_POSITIONS = [
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

export const AD_FORMATS = ['card', 'banner', 'text', 'logo_strip'] as const
export const AD_STATUSES = ['draft', 'active', 'paused', 'ended'] as const
export const ADVERTISER_STATUSES = ['active', 'inactive'] as const

const STATUS_COLORS: Record<string, string> = {
  active: '#16a34a',
  inactive: '#9ca3af',
  draft: '#6b7280',
  paused: '#d97706',
  ended: '#dc2626',
}

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
    target_segments: '',
    price_monthly_cents: 0,
    starts_at: '',
    ends_at: '',
    include_in_pdf: false,
    include_in_email: false,
    status: 'draft' as string,
  }
}

// ─── Format helpers ──────────────────────────────────────────
export function formatPrice(cents: number | null): string {
  if (!cents) return '-'
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(cents / 100)
}

export function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat('es-ES').format(n)
}

export function calcCTR(impressions: number, clicks: number): string {
  if (!impressions) return '0.0%'
  return ((clicks / impressions) * 100).toFixed(1) + '%'
}

export function getStatusColor(status: string): string {
  return STATUS_COLORS[status] || '#6b7280'
}

export function csvToArray(val: string): string[] {
  return val
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

// ─── Composable ──────────────────────────────────────────────
export function useAdminPublicidad() {
  const supabase = useSupabaseClient<Database>()

  // ─── State ───────────────────────────────────────────────
  const activeTab = ref<'advertisers' | 'ads' | 'dashboard' | 'floor_prices'>('advertisers')
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

  // Enhanced dashboard composable
  const {
    dateRange: dashDateRange,
    customFrom: dashCustomFrom,
    customTo: dashCustomTo,
    summary: dashSummary,
    revenueBySource: dashRevenueBySource,
    performanceByPosition: dashPerformance,
    ctrByFormat: dashCtrByFormat,
    topAds: dashTopAds,
    audienceBreakdown: dashAudience,
    fetchDashboard: fetchEnhancedDashboard,
  } = useAdminAdDashboard()

  // Floor prices
  const floorPrices = ref<Array<{ position: string; floor_cpm_cents: number }>>([])
  const savingFloors = ref(false)

  // ─── Computed ────────────────────────────────────────────
  const canDelete = computed(() => deleteModal.value.confirmText.toLowerCase() === 'borrar')

  const advertiserMap = computed(() => {
    const map: Record<string, Advertiser> = {}
    for (const a of advertisers.value) {
      map[a.id] = a
    }
    return map
  })

  // ─── Fetch Advertisers ─────────────────────────────────────
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

  // ─── Fetch Ads ─────────────────────────────────────────────
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

  // ─── CRUD Advertisers ──────────────────────────────────────
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

  // ─── CRUD Ads ──────────────────────────────────────────────
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
        target_segments: (ad as Record<string, unknown>).target_segments
          ? ((ad as Record<string, unknown>).target_segments as string[]).join(', ')
          : '',
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
        target_segments: csvToArray(f.target_segments),
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

  // ─── Delete ────────────────────────────────────────────────
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

  // ─── Toggle position in ad form ────────────────────────────
  function togglePosition(pos: string) {
    const idx = adModal.value.form.positions.indexOf(pos)
    if (idx === -1) adModal.value.form.positions.push(pos)
    else adModal.value.form.positions.splice(idx, 1)
  }

  // ─── Tab switching & data load ─────────────────────────────
  function switchTab(tab: 'advertisers' | 'ads' | 'dashboard' | 'floor_prices') {
    activeTab.value = tab
    error.value = ''
    if (tab === 'advertisers') fetchAdvertisers()
    else if (tab === 'ads') {
      fetchAds()
      if (!advertisers.value.length) fetchAdvertisers()
    } else if (tab === 'dashboard') fetchEnhancedDashboard()
    else if (tab === 'floor_prices') fetchFloorPrices()
  }

  // ─── Floor Prices ──────────────────────────────────────────
  async function fetchFloorPrices() {
    loading.value = true
    try {
      const { data, error: err } = await supabase
        .from('ad_floor_prices')
        .select('position, floor_cpm_cents')
        .eq('vertical', 'tracciona')
        .order('position')
      if (err) throw err

      const existingMap = new Map<string, number>()
      for (const row of (data || []) as Array<{ position: string; floor_cpm_cents: number }>) {
        existingMap.set(row.position, row.floor_cpm_cents)
      }
      floorPrices.value = AD_POSITIONS.map((pos) => ({
        position: pos,
        floor_cpm_cents: existingMap.get(pos) || 0,
      }))
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : String(e)
    } finally {
      loading.value = false
    }
  }

  async function saveFloorPrices() {
    savingFloors.value = true
    error.value = ''
    try {
      for (const fp of floorPrices.value) {
        await supabase.from('ad_floor_prices').upsert(
          {
            position: fp.position,
            floor_cpm_cents: fp.floor_cpm_cents,
            vertical: 'tracciona',
            currency: 'EUR',
          },
          { onConflict: 'position,vertical' },
        )
      }
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : String(e)
    } finally {
      savingFloors.value = false
    }
  }

  // ─── Helper: get advertiser name for ad table ──────────────
  function getAdvertiserName(ad: Ad): string {
    if (ad.advertiser && typeof ad.advertiser === 'object' && 'company_name' in ad.advertiser) {
      return (ad.advertiser as Advertiser).company_name
    }
    return advertiserMap.value[ad.advertiser_id]?.company_name || '-'
  }

  return {
    // State
    activeTab,
    loading,
    saving,
    error,
    advertisers,
    advertiserModal,
    ads,
    adModal,
    deleteModal,
    floorPrices,
    savingFloors,
    // Computed
    canDelete,
    advertiserMap,
    // Dashboard (re-exported)
    dashDateRange,
    dashCustomFrom,
    dashCustomTo,
    dashSummary,
    dashRevenueBySource,
    dashPerformance,
    dashCtrByFormat,
    dashTopAds,
    dashAudience,
    fetchEnhancedDashboard,
    // Advertisers CRUD
    fetchAdvertisers,
    openNewAdvertiser,
    openEditAdvertiser,
    closeAdvertiserModal,
    saveAdvertiser,
    confirmDeleteAdvertiser,
    // Ads CRUD
    fetchAds,
    openNewAd,
    openEditAd,
    closeAdModal,
    saveAd,
    confirmDeleteAd,
    togglePosition,
    // Delete
    closeDeleteModal,
    executeDelete,
    // Floor prices
    fetchFloorPrices,
    saveFloorPrices,
    // Tab
    switchTab,
    // Helpers
    getAdvertiserName,
  }
}

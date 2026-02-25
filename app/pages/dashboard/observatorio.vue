<script setup lang="ts">
/**
 * Competition Observatory Page
 * Premium/Founding plan only. Dealers can track competitor vehicle listings
 * across platforms they configure.
 */
import { formatPrice } from '~/composables/shared/useListingUtils'

definePageMeta({
  layout: 'default',
  middleware: ['auth', 'dealer'],
})

const { t } = useI18n()
const supabase = useSupabaseClient()
const { userId } = useAuth()
const { dealerProfile, loadDealer } = useDealerDashboard()
const { currentPlan, fetchSubscription } = useSubscriptionPlan(userId.value || undefined)

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CompetitorStatus = 'watching' | 'sold' | 'expired'

interface Platform {
  id: string
  name: string
  slug: string
  is_default: boolean
}

interface DealerPlatform {
  id: string
  dealer_id: string
  platform_id: string
  custom_name: string | null
}

interface CompetitorVehicle {
  id: string
  dealer_id: string
  platform_id: string | null
  url: string | null
  brand: string
  model: string
  year: number | null
  price: number | null
  location: string | null
  notes: string | null
  status: CompetitorStatus
  created_at: string | null
  updated_at: string | null
}

interface CompetitorVehicleForm {
  platform_id: string
  url: string
  brand: string
  model: string
  year: string
  price: string
  location: string
  notes: string
  status: CompetitorStatus
}

// ---------------------------------------------------------------------------
// Plan Gate
// ---------------------------------------------------------------------------

const isPremium = computed(() => {
  return currentPlan.value === 'premium' || currentPlan.value === 'founding'
})

// ---------------------------------------------------------------------------
// Composable: useDealerObservatorio
// ---------------------------------------------------------------------------

function useDealerObservatorio(dealerId: Ref<string | null>) {
  const entries = ref<CompetitorVehicle[]>([])
  const platforms = ref<Platform[]>([])
  const dealerPlatforms = ref<DealerPlatform[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchEntries(): Promise<void> {
    if (!dealerId.value) return
    loading.value = true
    error.value = null
    try {
      const { data, error: err } = await supabase
        .from('competitor_vehicles')
        .select('*')
        .eq('dealer_id', dealerId.value)
        .order('created_at', { ascending: false })

      if (err) throw err
      entries.value = (data ?? []) as never as CompetitorVehicle[]
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error loading entries'
    } finally {
      loading.value = false
    }
  }

  async function fetchPlatforms(): Promise<void> {
    try {
      const { data, error: err } = await supabase
        .from('platforms')
        .select('*')
        .order('name', { ascending: true })

      if (err) throw err
      platforms.value = (data ?? []) as never as Platform[]
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error loading platforms'
    }
  }

  async function fetchDealerPlatforms(): Promise<void> {
    if (!dealerId.value) return
    try {
      const { data, error: err } = await supabase
        .from('dealer_platforms')
        .select('*')
        .eq('dealer_id', dealerId.value)

      if (err) throw err
      dealerPlatforms.value = (data ?? []) as never as DealerPlatform[]
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error loading dealer platforms'
    }
  }

  async function createEntry(form: CompetitorVehicleForm): Promise<boolean> {
    if (!dealerId.value) return false
    error.value = null
    try {
      const { error: err } = await supabase.from('competitor_vehicles').insert({
        dealer_id: dealerId.value,
        platform_id: form.platform_id || null,
        url: form.url || null,
        brand: form.brand,
        model: form.model,
        year: form.year ? Number(form.year) : null,
        price: form.price ? Number(form.price) : null,
        location: form.location || null,
        notes: form.notes || null,
        status: form.status,
      } as never)

      if (err) throw err
      await fetchEntries()
      return true
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error creating entry'
      return false
    }
  }

  async function updateEntry(id: string, form: CompetitorVehicleForm): Promise<boolean> {
    error.value = null
    try {
      const { error: err } = await supabase
        .from('competitor_vehicles')
        .update({
          platform_id: form.platform_id || null,
          url: form.url || null,
          brand: form.brand,
          model: form.model,
          year: form.year ? Number(form.year) : null,
          price: form.price ? Number(form.price) : null,
          location: form.location || null,
          notes: form.notes || null,
          status: form.status,
          updated_at: new Date().toISOString(),
        } as never)
        .eq('id', id)

      if (err) throw err
      await fetchEntries()
      return true
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error updating entry'
      return false
    }
  }

  async function deleteEntry(id: string): Promise<boolean> {
    error.value = null
    try {
      const { error: err } = await supabase.from('competitor_vehicles').delete().eq('id', id)

      if (err) throw err
      entries.value = entries.value.filter((e) => e.id !== id)
      return true
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error deleting entry'
      return false
    }
  }

  async function addPlatform(platformId: string): Promise<void> {
    if (!dealerId.value) return
    error.value = null
    try {
      const { error: err } = await supabase.from('dealer_platforms').insert({
        dealer_id: dealerId.value,
        platform_id: platformId,
      } as never)

      if (err) throw err
      await fetchDealerPlatforms()
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error adding platform'
    }
  }

  async function removePlatform(platformId: string): Promise<void> {
    if (!dealerId.value) return
    error.value = null
    try {
      const { error: err } = await supabase
        .from('dealer_platforms')
        .delete()
        .eq('dealer_id', dealerId.value)
        .eq('platform_id', platformId)

      if (err) throw err
      dealerPlatforms.value = dealerPlatforms.value.filter((dp) => dp.platform_id !== platformId)
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error removing platform'
    }
  }

  async function loadAll(): Promise<void> {
    loading.value = true
    await Promise.all([fetchEntries(), fetchPlatforms(), fetchDealerPlatforms()])
    loading.value = false
  }

  return {
    entries: readonly(entries),
    platforms: readonly(platforms),
    dealerPlatforms: readonly(dealerPlatforms),
    loading: readonly(loading),
    error,
    fetchEntries,
    fetchPlatforms,
    fetchDealerPlatforms,
    createEntry,
    updateEntry,
    deleteEntry,
    addPlatform,
    removePlatform,
    loadAll,
  }
}

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

const dealerId = computed(() => dealerProfile.value?.id ?? null)

const {
  entries,
  platforms,
  dealerPlatforms,
  loading,
  error,
  createEntry,
  updateEntry,
  deleteEntry,
  addPlatform,
  removePlatform,
  loadAll,
} = useDealerObservatorio(dealerId)

// Filters
const filterPlatform = ref('')
const filterStatus = ref<CompetitorStatus | ''>('')
const searchQuery = ref('')

// Modals
const showEntryModal = ref(false)
const showPlatformModal = ref(false)
const editingEntry = ref<CompetitorVehicle | null>(null)
const savingEntry = ref(false)
const confirmDeleteId = ref<string | null>(null)

const emptyForm: CompetitorVehicleForm = {
  platform_id: '',
  url: '',
  brand: '',
  model: '',
  year: '',
  price: '',
  location: '',
  notes: '',
  status: 'watching',
}

const entryForm = ref<CompetitorVehicleForm>({ ...emptyForm })

// Platform name map
const platformMap = computed(() => {
  const map = new Map<string, string>()
  for (const p of platforms.value) {
    map.set(p.id, p.name)
  }
  return map
})

// Dealer's active platform IDs
const activePlatformIds = computed(() => {
  return new Set(dealerPlatforms.value.map((dp) => dp.platform_id))
})

// Platforms available for the select (only ones the dealer has configured)
const selectablePlatforms = computed(() => {
  return platforms.value.filter((p) => activePlatformIds.value.has(p.id))
})

// Filtered entries
const filteredEntries = computed(() => {
  let result = [...entries.value]

  if (filterPlatform.value) {
    result = result.filter((e) => e.platform_id === filterPlatform.value)
  }

  if (filterStatus.value) {
    result = result.filter((e) => e.status === filterStatus.value)
  }

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase().trim()
    result = result.filter(
      (e) =>
        e.brand.toLowerCase().includes(q) ||
        e.model.toLowerCase().includes(q) ||
        (e.location && e.location.toLowerCase().includes(q)) ||
        (e.notes && e.notes.toLowerCase().includes(q)),
    )
  }

  return result
})

// Status options
const statusOptions: CompetitorStatus[] = ['watching', 'sold', 'expired']

// Platform color map for card border
const platformColors = [
  '#23424A',
  '#2563eb',
  '#7c3aed',
  '#059669',
  '#d97706',
  '#dc2626',
  '#6366f1',
  '#0891b2',
]
function getPlatformColor(platformId: string | null): string {
  if (!platformId) return '#94a3b8'
  const idx = platforms.value.findIndex((p) => p.id === platformId)
  return platformColors[idx % platformColors.length] || '#94a3b8'
}

// Status badge style
function getStatusClass(status: CompetitorStatus): string {
  switch (status) {
    case 'watching':
      return 'status-watching'
    case 'sold':
      return 'status-sold'
    case 'expired':
      return 'status-expired'
    default:
      return ''
  }
}

// ---------------------------------------------------------------------------
// Entry Modal Logic
// ---------------------------------------------------------------------------

function openAddEntry(): void {
  editingEntry.value = null
  entryForm.value = { ...emptyForm }
  showEntryModal.value = true
}

function openEditEntry(entry: CompetitorVehicle): void {
  editingEntry.value = entry
  entryForm.value = {
    platform_id: entry.platform_id || '',
    url: entry.url || '',
    brand: entry.brand,
    model: entry.model,
    year: entry.year ? String(entry.year) : '',
    price: entry.price ? String(entry.price) : '',
    location: entry.location || '',
    notes: entry.notes || '',
    status: entry.status,
  }
  showEntryModal.value = true
}

function closeEntryModal(): void {
  showEntryModal.value = false
  editingEntry.value = null
  entryForm.value = { ...emptyForm }
}

async function saveEntry(): Promise<void> {
  if (!entryForm.value.brand.trim() || !entryForm.value.model.trim()) return
  savingEntry.value = true

  let success: boolean
  if (editingEntry.value) {
    success = await updateEntry(editingEntry.value.id, entryForm.value)
  } else {
    success = await createEntry(entryForm.value)
  }

  savingEntry.value = false
  if (success) {
    closeEntryModal()
  }
}

async function handleDelete(id: string): Promise<void> {
  if (confirmDeleteId.value === id) {
    await deleteEntry(id)
    confirmDeleteId.value = null
  } else {
    confirmDeleteId.value = id
    setTimeout(() => {
      confirmDeleteId.value = null
    }, 3000)
  }
}

// ---------------------------------------------------------------------------
// Platform Settings Modal Logic
// ---------------------------------------------------------------------------

function openPlatformSettings(): void {
  showPlatformModal.value = true
}

function closePlatformSettings(): void {
  showPlatformModal.value = false
}

async function togglePlatform(platformId: string): Promise<void> {
  if (activePlatformIds.value.has(platformId)) {
    await removePlatform(platformId)
  } else {
    await addPlatform(platformId)
  }
}

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------

async function init(): Promise<void> {
  const dealer = dealerProfile.value || (await loadDealer())
  if (!dealer) return
  await fetchSubscription()
  if (isPremium.value) {
    await loadAll()
  }
}

onMounted(init)
</script>

<template>
  <div class="observatory-page">
    <!-- Plan Gate: Upgrade prompt for free/basic users -->
    <template v-if="!isPremium">
      <header class="page-header">
        <h1>{{ t('dashboard.observatory.title') }}</h1>
        <span class="plan-badge">{{ t(`dashboard.plans.${currentPlan}`) }}</span>
      </header>
      <div class="upgrade-card">
        <h3>{{ t('dashboard.observatory.upgradeTitle') }}</h3>
        <p>{{ t('dashboard.observatory.upgradeDesc') }}</p>
        <NuxtLink to="/dashboard/suscripcion" class="btn-primary">
          {{ t('dashboard.observatory.upgradeCta') }}
        </NuxtLink>
      </div>
    </template>

    <!-- Premium/Founding Content -->
    <template v-else>
      <header class="page-header">
        <div class="header-left">
          <h1>{{ t('dashboard.observatory.title') }}</h1>
          <span class="plan-badge">{{ t(`dashboard.plans.${currentPlan}`) }}</span>
        </div>
        <div class="header-actions">
          <button
            type="button"
            class="btn-icon"
            :title="t('dashboard.observatory.platformSettings')"
            @click="openPlatformSettings"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path d="M10 13a3 3 0 100-6 3 3 0 000 6z" stroke="currentColor" stroke-width="1.5" />
              <path
                d="M17.73 12.02l-1.09-.63a6.07 6.07 0 000-2.78l1.09-.63a.5.5 0 00.18-.68l-1-1.73a.5.5 0 00-.68-.18l-1.09.63a5.97 5.97 0 00-2.4-1.39V3.5a.5.5 0 00-.5-.5h-2a.5.5 0 00-.5.5v1.26a5.97 5.97 0 00-2.4 1.39l-1.09-.63a.5.5 0 00-.68.18l-1 1.73a.5.5 0 00.18.68l1.09.63a6.07 6.07 0 000 2.78l-1.09.63a.5.5 0 00-.18.68l1 1.73a.5.5 0 00.68.18l1.09-.63a5.97 5.97 0 002.4 1.39v1.26a.5.5 0 00.5.5h2a.5.5 0 00.5-.5v-1.26a5.97 5.97 0 002.4-1.39l1.09.63a.5.5 0 00.68-.18l1-1.73a.5.5 0 00-.18-.68z"
                stroke="currentColor"
                stroke-width="1.5"
              />
            </svg>
          </button>
          <button type="button" class="btn-primary" @click="openAddEntry">
            {{ t('dashboard.observatory.addEntry') }}
          </button>
        </div>
      </header>

      <!-- Error -->
      <div v-if="error" class="alert-error">{{ error }}</div>

      <!-- Loading -->
      <div v-if="loading" class="loading-state">
        <div class="spinner" />
      </div>

      <template v-else>
        <!-- Filters -->
        <div class="filters-bar">
          <select
            v-model="filterPlatform"
            class="filter-select"
            :aria-label="t('dashboard.observatory.filterPlatform')"
          >
            <option value="">{{ t('dashboard.observatory.allPlatforms') }}</option>
            <option v-for="p in selectablePlatforms" :key="p.id" :value="p.id">
              {{ p.name }}
            </option>
          </select>

          <select
            v-model="filterStatus"
            class="filter-select"
            :aria-label="t('dashboard.observatory.filterStatus')"
          >
            <option value="">{{ t('dashboard.observatory.allStatuses') }}</option>
            <option v-for="s in statusOptions" :key="s" :value="s">
              {{ t(`dashboard.observatory.status.${s}`) }}
            </option>
          </select>

          <input
            v-model="searchQuery"
            type="search"
            class="filter-search"
            :placeholder="t('dashboard.observatory.searchPlaceholder')"
          >
        </div>

        <!-- Empty State -->
        <div v-if="filteredEntries.length === 0" class="empty-state">
          <p>{{ t('dashboard.observatory.empty') }}</p>
          <button type="button" class="btn-primary" @click="openAddEntry">
            {{ t('dashboard.observatory.addFirst') }}
          </button>
        </div>

        <!-- Card Grid -->
        <div v-else class="card-grid">
          <div
            v-for="entry in filteredEntries"
            :key="entry.id"
            class="entry-card"
            :style="{ borderLeftColor: getPlatformColor(entry.platform_id) }"
          >
            <div class="card-top">
              <span
                v-if="entry.platform_id && platformMap.get(entry.platform_id)"
                class="platform-badge"
                :style="{ backgroundColor: getPlatformColor(entry.platform_id) }"
              >
                {{ platformMap.get(entry.platform_id) }}
              </span>
              <span :class="['status-badge', getStatusClass(entry.status)]">
                {{ t(`dashboard.observatory.status.${entry.status}`) }}
              </span>
            </div>

            <h3 class="card-title">
              {{ entry.brand }} {{ entry.model }}
              <span v-if="entry.year" class="card-year">({{ entry.year }})</span>
            </h3>

            <div class="card-details">
              <span v-if="entry.price !== null" class="card-price">
                {{ formatPrice(entry.price) }}
              </span>
              <span v-if="entry.location" class="card-location">
                {{ entry.location }}
              </span>
            </div>

            <p v-if="entry.notes" class="card-notes">
              {{ entry.notes.length > 120 ? entry.notes.substring(0, 120) + '...' : entry.notes }}
            </p>

            <div class="card-actions">
              <a
                v-if="entry.url"
                :href="entry.url"
                target="_blank"
                rel="noopener noreferrer"
                class="btn-link"
              >
                {{ t('dashboard.observatory.viewListing') }}
              </a>
              <button type="button" class="btn-action" @click="openEditEntry(entry)">
                {{ t('common.edit') }}
              </button>
              <button type="button" class="btn-action btn-danger" @click="handleDelete(entry.id)">
                {{
                  confirmDeleteId === entry.id
                    ? t('dashboard.observatory.confirmDelete')
                    : t('common.delete')
                }}
              </button>
            </div>
          </div>
        </div>
      </template>

      <!-- Add/Edit Entry Modal -->
      <Teleport to="body">
        <div v-if="showEntryModal" class="modal-overlay" @click.self="closeEntryModal">
          <div
            class="modal-content"
            role="dialog"
            :aria-label="
              editingEntry
                ? t('dashboard.observatory.editEntry')
                : t('dashboard.observatory.addEntry')
            "
          >
            <div class="modal-header">
              <h2>
                {{
                  editingEntry
                    ? t('dashboard.observatory.editEntry')
                    : t('dashboard.observatory.addEntry')
                }}
              </h2>
              <button type="button" class="btn-close" @click="closeEntryModal">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    d="M15 5L5 15M5 5l10 10"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-linecap="round"
                  />
                </svg>
              </button>
            </div>

            <form class="modal-form" @submit.prevent="saveEntry">
              <div class="form-group">
                <label for="obs-platform">{{ t('dashboard.observatory.platform') }}</label>
                <select id="obs-platform" v-model="entryForm.platform_id">
                  <option value="">{{ t('dashboard.observatory.selectPlatform') }}</option>
                  <option v-for="p in selectablePlatforms" :key="p.id" :value="p.id">
                    {{ p.name }}
                  </option>
                </select>
              </div>

              <div class="form-group">
                <label for="obs-url">{{ t('dashboard.observatory.url') }}</label>
                <input id="obs-url" v-model="entryForm.url" type="url" placeholder="https://..." >
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label for="obs-brand">{{ t('dashboard.observatory.brand') }} *</label>
                  <input
                    id="obs-brand"
                    v-model="entryForm.brand"
                    type="text"
                    required
                    :placeholder="t('dashboard.observatory.brandPlaceholder')"
                  >
                </div>
                <div class="form-group">
                  <label for="obs-model">{{ t('dashboard.observatory.model') }} *</label>
                  <input
                    id="obs-model"
                    v-model="entryForm.model"
                    type="text"
                    required
                    :placeholder="t('dashboard.observatory.modelPlaceholder')"
                  >
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label for="obs-year">{{ t('dashboard.observatory.year') }}</label>
                  <input
                    id="obs-year"
                    v-model="entryForm.year"
                    type="number"
                    min="1950"
                    max="2030"
                  >
                </div>
                <div class="form-group">
                  <label for="obs-price">{{ t('dashboard.observatory.price') }}</label>
                  <input id="obs-price" v-model="entryForm.price" type="number" min="0" step="1" >
                </div>
              </div>

              <div class="form-group">
                <label for="obs-location">{{ t('dashboard.observatory.location') }}</label>
                <input
                  id="obs-location"
                  v-model="entryForm.location"
                  type="text"
                  :placeholder="t('dashboard.observatory.locationPlaceholder')"
                >
              </div>

              <div class="form-group">
                <label for="obs-status">{{ t('dashboard.observatory.statusLabel') }}</label>
                <select id="obs-status" v-model="entryForm.status">
                  <option v-for="s in statusOptions" :key="s" :value="s">
                    {{ t(`dashboard.observatory.status.${s}`) }}
                  </option>
                </select>
              </div>

              <div class="form-group">
                <label for="obs-notes">{{ t('dashboard.observatory.notes') }}</label>
                <textarea
                  id="obs-notes"
                  v-model="entryForm.notes"
                  rows="3"
                  :placeholder="t('dashboard.observatory.notesPlaceholder')"
                />
              </div>

              <div class="modal-actions">
                <button type="button" class="btn-secondary" @click="closeEntryModal">
                  {{ t('common.cancel') }}
                </button>
                <button
                  type="submit"
                  class="btn-primary"
                  :disabled="savingEntry || !entryForm.brand.trim() || !entryForm.model.trim()"
                >
                  {{ savingEntry ? t('common.loading') : t('common.save') }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Teleport>

      <!-- Platform Settings Modal -->
      <Teleport to="body">
        <div v-if="showPlatformModal" class="modal-overlay" @click.self="closePlatformSettings">
          <div
            class="modal-content modal-platforms"
            role="dialog"
            :aria-label="t('dashboard.observatory.platformSettings')"
          >
            <div class="modal-header">
              <h2>{{ t('dashboard.observatory.platformSettings') }}</h2>
              <button type="button" class="btn-close" @click="closePlatformSettings">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    d="M15 5L5 15M5 5l10 10"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-linecap="round"
                  />
                </svg>
              </button>
            </div>

            <p class="platform-desc">{{ t('dashboard.observatory.platformDesc') }}</p>

            <div class="platform-list">
              <label v-for="p in platforms" :key="p.id" class="platform-item">
                <input
                  type="checkbox"
                  :checked="activePlatformIds.has(p.id)"
                  @change="togglePlatform(p.id)"
                >
                <span class="platform-name">{{ p.name }}</span>
                <span v-if="p.is_default" class="platform-default">{{
                  t('dashboard.observatory.defaultPlatform')
                }}</span>
              </label>
            </div>

            <div class="modal-actions">
              <button type="button" class="btn-primary" @click="closePlatformSettings">
                {{ t('common.close') }}
              </button>
            </div>
          </div>
        </div>
      </Teleport>
    </template>
  </div>
</template>

<style scoped>
.observatory-page {
  max-width: 1100px;
  margin: 0 auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* Header */
.page-header {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.page-header h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-primary, #23424a);
}

.plan-badge {
  padding: 4px 12px;
  background: var(--color-primary, #23424a);
  color: white;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  color: #475569;
  cursor: pointer;
}

.btn-icon:hover {
  background: #f8fafc;
  color: var(--color-primary, #23424a);
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
  text-decoration: none;
  font-size: 0.95rem;
}

.btn-primary:hover {
  background: #1a3238;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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
  cursor: pointer;
  font-size: 0.95rem;
}

.btn-secondary:hover {
  background: #f8fafc;
}

/* Alerts */
.alert-error {
  padding: 12px 16px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #dc2626;
}

/* Loading */
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

/* Filters */
.filters-bar {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filter-select,
.filter-search {
  width: 100%;
  min-height: 44px;
  padding: 10px 14px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.95rem;
  font-family: inherit;
  background: white;
}

.filter-select:focus,
.filter-search:focus {
  outline: none;
  border-color: var(--color-primary, #23424a);
  box-shadow: 0 0 0 3px rgba(35, 66, 74, 0.1);
}

/* Empty */
.empty-state {
  text-align: center;
  padding: 48px 20px;
  color: #64748b;
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.empty-state p {
  margin: 0 0 16px 0;
}

/* Card Grid */
.card-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

.entry-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  border-left: 4px solid #94a3b8;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.card-top {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.platform-badge {
  padding: 3px 10px;
  border-radius: 10px;
  font-size: 0.75rem;
  font-weight: 600;
  color: white;
}

.status-badge {
  padding: 3px 10px;
  border-radius: 10px;
  font-size: 0.75rem;
  font-weight: 600;
}

.status-watching {
  background: #dbeafe;
  color: #1d4ed8;
}

.status-sold {
  background: #dcfce7;
  color: #15803d;
}

.status-expired {
  background: #fef3c7;
  color: #92400e;
}

.card-title {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 600;
  color: #1e293b;
}

.card-year {
  font-weight: 400;
  color: #94a3b8;
}

.card-details {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.card-price {
  font-weight: 700;
  color: var(--color-primary, #23424a);
  font-size: 1rem;
}

.card-location {
  font-size: 0.875rem;
  color: #64748b;
}

.card-notes {
  font-size: 0.85rem;
  color: #64748b;
  margin: 0;
  line-height: 1.4;
}

.card-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 4px;
}

.btn-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 36px;
  padding: 6px 14px;
  background: var(--color-primary, #23424a);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 500;
  text-decoration: none;
  cursor: pointer;
}

.btn-link:hover {
  background: #1a3238;
}

.btn-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 36px;
  padding: 6px 14px;
  background: white;
  color: #475569;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 0.85rem;
  cursor: pointer;
}

.btn-action:hover {
  background: #f8fafc;
}

.btn-danger {
  color: #dc2626;
  border-color: #fecaca;
}

.btn-danger:hover {
  background: #fef2f2;
}

/* Upgrade Card */
.upgrade-card {
  background: linear-gradient(135deg, #f0f9ff, #eff6ff);
  border: 1px solid #bfdbfe;
  border-radius: 12px;
  padding: 24px;
  text-align: center;
}

.upgrade-card h3 {
  margin: 0 0 8px 0;
  font-size: 1.1rem;
  color: #1e40af;
}

.upgrade-card p {
  margin: 0 0 16px 0;
  color: #3b82f6;
  font-size: 0.9rem;
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
  padding: 16px;
}

.modal-content {
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 560px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
}

.modal-platforms {
  max-width: 480px;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 20px 0 20px;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 700;
  color: #1e293b;
}

.btn-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  border-radius: 8px;
}

.btn-close:hover {
  background: #f1f5f9;
  color: #475569;
}

/* Modal Form */
.modal-form {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #475569;
}

.form-group input,
.form-group select,
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
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--color-primary, #23424a);
  box-shadow: 0 0 0 3px rgba(35, 66, 74, 0.1);
}

.form-group textarea {
  resize: vertical;
  min-height: 80px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 0 20px 20px 20px;
}

/* Platform Settings Modal */
.platform-desc {
  margin: 0;
  padding: 16px 20px 0 20px;
  font-size: 0.9rem;
  color: #64748b;
}

.platform-list {
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.platform-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f8fafc;
  border-radius: 8px;
  cursor: pointer;
  min-height: 44px;
}

.platform-item:hover {
  background: #f1f5f9;
}

.platform-item input[type='checkbox'] {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  accent-color: var(--color-primary, #23424a);
}

.platform-name {
  flex: 1;
  font-weight: 500;
  color: #1e293b;
}

.platform-default {
  font-size: 0.75rem;
  color: #94a3b8;
  font-weight: 400;
}

/* Responsive */
@media (min-width: 480px) {
  .filters-bar {
    flex-direction: row;
    flex-wrap: wrap;
  }

  .filter-select {
    width: auto;
    min-width: 160px;
  }

  .filter-search {
    flex: 1;
    min-width: 180px;
  }
}

@media (min-width: 768px) {
  .observatory-page {
    padding: 24px;
  }

  .page-header {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }

  .card-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .card-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>

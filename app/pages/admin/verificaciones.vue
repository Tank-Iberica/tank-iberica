<script setup lang="ts">
import { localizedField } from '~/composables/useLocalized'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const { t } = useI18n()
const { locale } = useI18n()
const supabase = useSupabaseClient()

// ============================================
// TYPES
// ============================================
interface VehicleImage {
  url: string
  position: number
}

interface DealerInfo {
  company_name: Record<string, string> | null
}

interface VehicleInfo {
  id: string
  brand: string
  model: string
  year: number | null
  slug: string
  price: number | null
  dealer_id: string | null
  verification_level: string | null
  vehicle_images: VehicleImage[]
  dealers: DealerInfo | null
}

interface VerificationDocument {
  id: string
  vehicle_id: string
  doc_type: string
  file_url: string | null
  status: string | null
  level: number
  data: Record<string, unknown> | null
  generated_at: string | null
  expires_at: string | null
  notes: string | null
  rejection_reason: string | null
  submitted_by: string | null
  verified_by: string | null
  vehicles: VehicleInfo
}

type StatusFilter = 'all' | 'pending' | 'verified' | 'rejected'

// ============================================
// STATE
// ============================================
const documents = ref<VerificationDocument[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const search = ref('')
const statusFilter = ref<StatusFilter>('all')
function clearFilters() {
  statusFilter.value = 'all'
  search.value = ''
}
const expandedDocId = ref<string | null>(null)
const rejectionReason = ref('')
const actionLoading = ref(false)

// ============================================
// COMPUTED
// ============================================
const filteredDocuments = computed(() => {
  let result = documents.value

  // Filter by status
  if (statusFilter.value !== 'all') {
    const statusMap: Record<string, string> = {
      pending: 'pending',
      verified: 'verified',
      rejected: 'rejected',
    }
    result = result.filter((d) => d.status === statusMap[statusFilter.value])
  }

  // Filter by search
  if (search.value.trim()) {
    const q = search.value.toLowerCase().trim()
    result = result.filter((d) => {
      const brandModel = `${d.vehicles.brand} ${d.vehicles.model}`.toLowerCase()
      const dealerName = d.vehicles.dealers
        ? localizedField(d.vehicles.dealers.company_name, locale.value).toLowerCase()
        : ''
      return brandModel.includes(q) || dealerName.includes(q)
    })
  }

  return result
})

const pendingCount = computed(() => documents.value.filter((d) => d.status === 'pending').length)

const statusCounts = computed(() => ({
  all: documents.value.length,
  pending: documents.value.filter((d) => d.status === 'pending').length,
  verified: documents.value.filter((d) => d.status === 'verified').length,
  rejected: documents.value.filter((d) => d.status === 'rejected').length,
}))

// Group documents by vehicle for verification level display
const vehicleVerificationMap = computed(() => {
  const map = new Map<
    string,
    {
      vehicle: VehicleInfo
      docs: VerificationDocument[]
      verificationLevel: string
    }
  >()

  for (const doc of documents.value) {
    const vehicleId = doc.vehicle_id
    if (!map.has(vehicleId)) {
      map.set(vehicleId, {
        vehicle: doc.vehicles,
        docs: [],
        verificationLevel: doc.vehicles.verification_level || 'none',
      })
    }
    map.get(vehicleId)!.docs.push(doc)
  }

  return map
})

// ============================================
// DATA LOADING
// ============================================
async function fetchDocuments() {
  loading.value = true
  error.value = null

  try {
    const { data, error: fetchError } = await supabase
      .from('verification_documents')
      .select(
        '*, vehicles!inner(id, brand, model, year, slug, price, dealer_id, verification_level, vehicle_images(url, position), dealers(company_name))',
      )
      .order('generated_at', { ascending: false })

    if (fetchError) {
      error.value = fetchError.message
      return
    }

    documents.value = (data as unknown as VerificationDocument[]) || []
  } catch (err) {
    error.value = err instanceof Error ? err.message : String(err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchDocuments()
})

// ============================================
// ACTIONS
// ============================================
function toggleExpand(docId: string) {
  if (expandedDocId.value === docId) {
    expandedDocId.value = null
    rejectionReason.value = ''
  } else {
    expandedDocId.value = docId
    rejectionReason.value = ''
  }
}

async function approveDocument(doc: VerificationDocument) {
  actionLoading.value = true
  try {
    const { error: updateError } = await supabase
      .from('verification_documents')
      .update({
        status: 'verified',
        verified_by: (await supabase.auth.getUser()).data.user?.id || null,
      })
      .eq('id', doc.id)

    if (updateError) {
      error.value = updateError.message
      return
    }

    // The DB trigger auto-recalculates verification_level on the vehicle
    // Refresh data to see updated levels
    await fetchDocuments()
    expandedDocId.value = null
  } catch (err) {
    error.value = err instanceof Error ? err.message : String(err)
  } finally {
    actionLoading.value = false
  }
}

async function rejectDocument(doc: VerificationDocument) {
  if (!rejectionReason.value.trim()) {
    return
  }

  actionLoading.value = true
  try {
    const { error: updateError } = await supabase
      .from('verification_documents')
      .update({
        status: 'rejected',
        rejection_reason: rejectionReason.value.trim(),
        verified_by: (await supabase.auth.getUser()).data.user?.id || null,
      })
      .eq('id', doc.id)

    if (updateError) {
      error.value = updateError.message
      return
    }

    await fetchDocuments()
    expandedDocId.value = null
    rejectionReason.value = ''
  } catch (err) {
    error.value = err instanceof Error ? err.message : String(err)
  } finally {
    actionLoading.value = false
  }
}

// ============================================
// HELPERS
// ============================================
function getVehicleThumbnail(vehicle: VehicleInfo): string | null {
  if (!vehicle.vehicle_images?.length) return null
  const sorted = [...vehicle.vehicle_images].sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
  return sorted[0]?.url || null
}

function getDealerName(doc: VerificationDocument): string {
  if (!doc.vehicles.dealers) return '-'
  return localizedField(doc.vehicles.dealers.company_name, locale.value) || '-'
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function formatPrice(price: number | null): string {
  if (!price) return '-'
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
  }).format(price)
}

function getDocTypeLabel(docType: string): string {
  const labels: Record<string, string> = {
    ficha_tecnica: t('admin.verificaciones.docTypes.fichaTecnica'),
    foto_km: t('admin.verificaciones.docTypes.fotoKm'),
    fotos_exteriores: t('admin.verificaciones.docTypes.fotosExteriores'),
    placa_fabricante: t('admin.verificaciones.docTypes.placaFabricante'),
    permiso_circulacion: t('admin.verificaciones.docTypes.permisoCirculacion'),
    tarjeta_itv: t('admin.verificaciones.docTypes.tarjetaItv'),
    adr: 'ADR',
    atp: 'ATP',
    exolum: 'EXOLUM',
    estanqueidad: t('admin.verificaciones.docTypes.estanqueidad'),
    dgt_report: t('admin.verificaciones.docTypes.dgtReport'),
    inspection_report: t('admin.verificaciones.docTypes.inspectionReport'),
  }
  return labels[docType] || docType
}

function getStatusClass(status: string | null): string {
  if (status === 'verified') return 'status-verified'
  if (status === 'rejected') return 'status-rejected'
  return 'status-pending'
}

function getStatusLabel(status: string | null): string {
  if (status === 'verified') return t('admin.verificaciones.status.verified')
  if (status === 'rejected') return t('admin.verificaciones.status.rejected')
  return t('admin.verificaciones.status.pending')
}

// Verification level display
interface VerificationLevelInfo {
  label: string
  icon: string
  progress: number
  cssClass: string
}

function getVerificationLevelInfo(level: string | null): VerificationLevelInfo {
  const levels: Record<string, VerificationLevelInfo> = {
    none: {
      label: t('admin.verificaciones.levels.none'),
      icon: '-',
      progress: 0,
      cssClass: 'level-none',
    },
    verified: {
      label: t('admin.verificaciones.levels.verified'),
      icon: '\u2713',
      progress: 20,
      cssClass: 'level-verified',
    },
    extended: {
      label: t('admin.verificaciones.levels.extended'),
      icon: '\u2713\u2713',
      progress: 40,
      cssClass: 'level-extended',
    },
    detailed: {
      label: t('admin.verificaciones.levels.detailed'),
      icon: '\u2713\u2713\u2713',
      progress: 60,
      cssClass: 'level-detailed',
    },
    audited: {
      label: t('admin.verificaciones.levels.audited'),
      icon: '\u2605',
      progress: 80,
      cssClass: 'level-audited',
    },
    certified: {
      label: t('admin.verificaciones.levels.certified'),
      icon: '\uD83D\uDEE1',
      progress: 100,
      cssClass: 'level-certified',
    },
  }
  return levels[level || 'none'] || levels.none
}

function isFileImage(url: string | null): boolean {
  if (!url) return false
  const ext = url.split('.').pop()?.toLowerCase() || ''
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif', 'svg'].includes(ext)
}
</script>

<template>
  <div class="verificaciones-page">
    <!-- Header -->
    <header class="page-header">
      <div class="header-left">
        <h1>{{ t('admin.verificaciones.title') }}</h1>
        <span v-if="pendingCount > 0" class="count-badge pending">
          {{ pendingCount }} {{ t('admin.verificaciones.pending') }}
        </span>
        <span v-else class="count-badge">
          {{ documents.length }}
        </span>
      </div>
      <button class="btn-refresh" :disabled="loading" @click="fetchDocuments">
        {{ t('admin.verificaciones.refresh') }}
      </button>
    </header>

    <!-- Filters bar -->
    <div class="filters-bar">
      <div class="status-pills">
        <button
          v-for="pill in ['all', 'pending', 'verified', 'rejected'] as StatusFilter[]"
          :key="pill"
          class="status-pill"
          :class="{ active: statusFilter === pill }"
          @click="statusFilter = pill"
        >
          {{ t(`admin.verificaciones.filters.${pill}`) }}
          <span class="pill-count">{{ statusCounts[pill] }}</span>
        </button>
      </div>
      <div class="search-box">
        <span class="search-icon">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </span>
        <input
          v-model="search"
          type="text"
          :placeholder="t('admin.verificaciones.searchPlaceholder')"
        >
        <button v-if="search" class="clear-btn" @click="search = ''">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Error -->
    <div v-if="error" class="alert-error">
      {{ error }}
      <button class="dismiss-btn" @click="error = null">
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <div class="spinner" />
      <span>{{ t('admin.verificaciones.loading') }}</span>
    </div>

    <!-- Empty state -->
    <div v-else-if="filteredDocuments.length === 0" class="empty-state">
      <div class="empty-icon">
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          opacity="0.3"
        >
          <path d="M9 12l2 2 4-4" />
          <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
        </svg>
      </div>
      <p>{{ t('admin.verificaciones.empty') }}</p>
      <button v-if="statusFilter !== 'all' || search" class="btn-secondary" @click="clearFilters()">
        {{ t('admin.verificaciones.clearFilters') }}
      </button>
    </div>

    <!-- Document queue -->
    <div v-else class="doc-queue">
      <!-- Per-vehicle verification level cards -->
      <div v-if="statusFilter === 'all'" class="vehicle-levels">
        <div
          v-for="[vehicleId, vData] in vehicleVerificationMap"
          :key="vehicleId"
          class="vehicle-level-card"
        >
          <div class="vlc-info">
            <span class="vlc-name">{{ vData.vehicle.brand }} {{ vData.vehicle.model }}</span>
            <span class="vlc-docs"
              >{{ vData.docs.filter((d) => d.status === 'verified').length }}/{{
                vData.docs.length
              }}
              {{ t('admin.verificaciones.docsApproved') }}</span
            >
          </div>
          <div class="vlc-progress">
            <div class="progress-bar-container">
              <div
                class="progress-bar-fill"
                :class="getVerificationLevelInfo(vData.verificationLevel).cssClass"
                :style="{ width: getVerificationLevelInfo(vData.verificationLevel).progress + '%' }"
              />
            </div>
            <span
              class="vlc-level"
              :class="getVerificationLevelInfo(vData.verificationLevel).cssClass"
            >
              {{ getVerificationLevelInfo(vData.verificationLevel).icon }}
              {{ getVerificationLevelInfo(vData.verificationLevel).label }}
            </span>
          </div>
        </div>
      </div>

      <!-- Document list -->
      <div class="doc-list">
        <div
          v-for="doc in filteredDocuments"
          :key="doc.id"
          class="doc-item"
          :class="{ expanded: expandedDocId === doc.id }"
        >
          <!-- Row summary -->
          <button class="doc-row" @click="toggleExpand(doc.id)">
            <div class="doc-vehicle">
              <div class="doc-thumb">
                <img
                  v-if="getVehicleThumbnail(doc.vehicles)"
                  :src="getVehicleThumbnail(doc.vehicles)!"
                  :alt="`${doc.vehicles.brand} ${doc.vehicles.model}`"
                >
                <span v-else class="thumb-placeholder">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.5"
                    opacity="0.4"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <path d="M21 15l-5-5L5 21" />
                  </svg>
                </span>
              </div>
              <div class="doc-vehicle-info">
                <strong>{{ doc.vehicles.brand }} {{ doc.vehicles.model }}</strong>
                <span class="doc-dealer">{{ getDealerName(doc) }}</span>
              </div>
            </div>
            <div class="doc-type-cell">
              <span class="doc-type-badge">{{ getDocTypeLabel(doc.doc_type) }}</span>
            </div>
            <div class="doc-date-cell">
              {{ formatDate(doc.generated_at) }}
            </div>
            <div class="doc-status-cell">
              <span class="status-badge" :class="getStatusClass(doc.status)">
                {{ getStatusLabel(doc.status) }}
              </span>
            </div>
            <div class="doc-expand-icon">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                :class="{ rotated: expandedDocId === doc.id }"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
          </button>

          <!-- Expanded detail view -->
          <div v-if="expandedDocId === doc.id" class="doc-detail">
            <div class="detail-grid">
              <!-- Left: Document preview -->
              <div class="detail-preview">
                <h4>{{ t('admin.verificaciones.document') }}</h4>
                <div v-if="doc.file_url" class="preview-container">
                  <img
                    v-if="isFileImage(doc.file_url)"
                    :src="doc.file_url"
                    :alt="getDocTypeLabel(doc.doc_type)"
                    class="preview-image"
                  >
                  <a
                    v-else
                    :href="doc.file_url"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="preview-link"
                  >
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="1.5"
                    >
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                    <span>{{ t('admin.verificaciones.openDocument') }}</span>
                  </a>
                </div>
                <div v-else class="no-file">
                  {{ t('admin.verificaciones.noFile') }}
                </div>

                <!-- Verification level progress for this vehicle -->
                <div class="detail-level">
                  <h4>{{ t('admin.verificaciones.verificationLevel') }}</h4>
                  <div class="level-display">
                    <div class="progress-bar-container large">
                      <div
                        class="progress-bar-fill"
                        :class="getVerificationLevelInfo(doc.vehicles.verification_level).cssClass"
                        :style="{
                          width:
                            getVerificationLevelInfo(doc.vehicles.verification_level).progress +
                            '%',
                        }"
                      />
                    </div>
                    <span
                      class="level-label"
                      :class="getVerificationLevelInfo(doc.vehicles.verification_level).cssClass"
                    >
                      {{ getVerificationLevelInfo(doc.vehicles.verification_level).icon }}
                      {{ getVerificationLevelInfo(doc.vehicles.verification_level).label }}
                    </span>
                  </div>

                  <!-- Other docs for this vehicle -->
                  <div v-if="vehicleVerificationMap.has(doc.vehicle_id)" class="other-docs">
                    <span class="other-docs-label"
                      >{{ t('admin.verificaciones.vehicleDocs') }}:</span
                    >
                    <div class="other-docs-list">
                      <span
                        v-for="otherDoc in vehicleVerificationMap.get(doc.vehicle_id)!.docs"
                        :key="otherDoc.id"
                        class="other-doc-chip"
                        :class="getStatusClass(otherDoc.status)"
                      >
                        {{ getDocTypeLabel(otherDoc.doc_type) }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Right: Vehicle data + actions -->
              <div class="detail-data">
                <h4>{{ t('admin.verificaciones.vehicleData') }}</h4>
                <dl class="data-list">
                  <div class="data-row">
                    <dt>{{ t('admin.verificaciones.fields.brand') }}</dt>
                    <dd>{{ doc.vehicles.brand }}</dd>
                  </div>
                  <div class="data-row">
                    <dt>{{ t('admin.verificaciones.fields.model') }}</dt>
                    <dd>{{ doc.vehicles.model }}</dd>
                  </div>
                  <div class="data-row">
                    <dt>{{ t('admin.verificaciones.fields.year') }}</dt>
                    <dd>{{ doc.vehicles.year || '-' }}</dd>
                  </div>
                  <div class="data-row">
                    <dt>{{ t('admin.verificaciones.fields.price') }}</dt>
                    <dd>{{ formatPrice(doc.vehicles.price) }}</dd>
                  </div>
                  <div class="data-row">
                    <dt>{{ t('admin.verificaciones.fields.dealer') }}</dt>
                    <dd>{{ getDealerName(doc) }}</dd>
                  </div>
                  <div class="data-row">
                    <dt>{{ t('admin.verificaciones.fields.docType') }}</dt>
                    <dd>{{ getDocTypeLabel(doc.doc_type) }}</dd>
                  </div>
                  <div class="data-row">
                    <dt>{{ t('admin.verificaciones.fields.uploadDate') }}</dt>
                    <dd>{{ formatDate(doc.generated_at) }}</dd>
                  </div>
                  <div v-if="doc.expires_at" class="data-row">
                    <dt>{{ t('admin.verificaciones.fields.expiresAt') }}</dt>
                    <dd>{{ formatDate(doc.expires_at) }}</dd>
                  </div>
                  <div v-if="doc.notes" class="data-row full">
                    <dt>{{ t('admin.verificaciones.fields.notes') }}</dt>
                    <dd>{{ doc.notes }}</dd>
                  </div>
                  <div v-if="doc.rejection_reason" class="data-row full rejection">
                    <dt>{{ t('admin.verificaciones.fields.rejectionReason') }}</dt>
                    <dd>{{ doc.rejection_reason }}</dd>
                  </div>
                </dl>

                <!-- Actions -->
                <div v-if="doc.status === 'pending'" class="detail-actions">
                  <div class="rejection-input">
                    <label>{{ t('admin.verificaciones.rejectionReasonLabel') }}</label>
                    <textarea
                      v-model="rejectionReason"
                      rows="2"
                      :placeholder="t('admin.verificaciones.rejectionReasonPlaceholder')"
                    />
                  </div>
                  <div class="action-buttons">
                    <button
                      class="btn-approve"
                      :disabled="actionLoading"
                      @click="approveDocument(doc)"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      {{ t('admin.verificaciones.approve') }}
                    </button>
                    <button
                      class="btn-reject"
                      :disabled="actionLoading || !rejectionReason.trim()"
                      @click="rejectDocument(doc)"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                      >
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                      {{ t('admin.verificaciones.reject') }}
                    </button>
                  </div>
                </div>

                <!-- Already reviewed info -->
                <div v-else class="detail-reviewed">
                  <span class="reviewed-badge" :class="getStatusClass(doc.status)">
                    {{ getStatusLabel(doc.status) }}
                  </span>
                  <span v-if="doc.rejection_reason" class="reviewed-reason">
                    {{ doc.rejection_reason }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ============================================
   BASE LAYOUT
   ============================================ */
.verificaciones-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
}

/* ============================================
   HEADER
   ============================================ */
.page-header {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: stretch;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-left h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #1e293b;
}

.count-badge {
  background: #e2e8f0;
  color: #475569;
  font-size: 0.8rem;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 12px;
}

.count-badge.pending {
  background: #fef3c7;
  color: #92400e;
}

.btn-refresh {
  align-self: flex-start;
  padding: 10px 18px;
  background: var(--color-primary, #23424a);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background 0.2s;
  min-height: 44px;
}

.btn-refresh:hover {
  background: #1a3238;
}

.btn-refresh:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ============================================
   FILTERS BAR
   ============================================ */
.filters-bar {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.status-pills {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.status-pill {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  background: white;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 500;
  color: #64748b;
  transition: all 0.15s;
  min-height: 44px;
}

.status-pill:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
}

.status-pill.active {
  background: var(--color-primary, #23424a);
  color: white;
  border-color: var(--color-primary, #23424a);
}

.pill-count {
  font-size: 0.75rem;
  opacity: 0.7;
}

.status-pill.active .pill-count {
  opacity: 0.9;
}

.search-box {
  position: relative;
  width: 100%;
}

.search-box .search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
  display: flex;
  align-items: center;
}

.search-box input {
  width: 100%;
  padding: 10px 36px 10px 38px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.9rem;
  min-height: 44px;
}

.search-box input:focus {
  outline: none;
  border-color: var(--color-primary, #23424a);
  box-shadow: 0 0 0 3px rgba(35, 66, 74, 0.1);
}

.search-box .clear-btn {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  background: #e2e8f0;
  border: none;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
}

.search-box .clear-btn:hover {
  background: #cbd5e1;
}

/* ============================================
   ALERTS & STATES
   ============================================ */
.alert-error {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #dc2626;
  font-size: 0.9rem;
}

.dismiss-btn {
  background: none;
  border: none;
  color: #dc2626;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 60px 20px;
  color: #64748b;
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

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60px 20px;
  color: #64748b;
  gap: 12px;
}

.empty-icon {
  margin-bottom: 4px;
}

.empty-state p {
  margin: 0;
  font-size: 0.95rem;
}

.btn-secondary {
  background: white;
  color: #475569;
  border: 1px solid #e2e8f0;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  min-height: 44px;
}

.btn-secondary:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
}

/* ============================================
   VEHICLE VERIFICATION LEVELS
   ============================================ */
.vehicle-levels {
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
  margin-bottom: 8px;
}

.vehicle-level-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 16px;
  background: white;
  border-radius: 10px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.vlc-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.vlc-name {
  font-weight: 600;
  font-size: 0.9rem;
  color: #1e293b;
}

.vlc-docs {
  font-size: 0.8rem;
  color: #64748b;
}

.vlc-progress {
  display: flex;
  align-items: center;
  gap: 12px;
}

.progress-bar-container {
  flex: 1;
  height: 6px;
  background: #e2e8f0;
  border-radius: 3px;
  overflow: hidden;
}

.progress-bar-container.large {
  height: 8px;
  border-radius: 4px;
}

.progress-bar-fill {
  height: 100%;
  border-radius: inherit;
  transition: width 0.4s ease;
}

.progress-bar-fill.level-none {
  background: #94a3b8;
  width: 0;
}

.progress-bar-fill.level-verified {
  background: #22c55e;
}

.progress-bar-fill.level-extended {
  background: #3b82f6;
}

.progress-bar-fill.level-detailed {
  background: #8b5cf6;
}

.progress-bar-fill.level-audited {
  background: #f59e0b;
}

.progress-bar-fill.level-certified {
  background: #14b8a6;
}

.vlc-level {
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
}

.vlc-level.level-none {
  color: #94a3b8;
}
.vlc-level.level-verified {
  color: #16a34a;
}
.vlc-level.level-extended {
  color: #2563eb;
}
.vlc-level.level-detailed {
  color: #7c3aed;
}
.vlc-level.level-audited {
  color: #d97706;
}
.vlc-level.level-certified {
  color: #0d9488;
}

/* ============================================
   DOCUMENT QUEUE LIST
   ============================================ */
.doc-queue {
  flex: 1;
}

.doc-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.doc-item {
  background: white;
  border-radius: 10px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  transition: box-shadow 0.2s;
}

.doc-item:hover {
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
}

.doc-item.expanded {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.doc-row {
  display: grid;
  grid-template-columns: 1fr auto auto auto auto;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  width: 100%;
  border: none;
  background: transparent;
  cursor: pointer;
  text-align: left;
  min-height: 64px;
  font-family: inherit;
}

.doc-row:hover {
  background: #f8fafc;
}

/* Vehicle info cell */
.doc-vehicle {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.doc-thumb {
  width: 44px;
  height: 44px;
  border-radius: 6px;
  overflow: hidden;
  background: #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.doc-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.thumb-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
}

.doc-vehicle-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.doc-vehicle-info strong {
  font-size: 0.9rem;
  color: #1e293b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.doc-dealer {
  font-size: 0.8rem;
  color: #64748b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Doc type cell */
.doc-type-cell {
  display: none;
}

.doc-type-badge {
  display: inline-block;
  padding: 4px 10px;
  background: #f1f5f9;
  color: #475569;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 500;
  white-space: nowrap;
}

/* Date cell */
.doc-date-cell {
  display: none;
  font-size: 0.85rem;
  color: #64748b;
  white-space: nowrap;
}

/* Status cell */
.doc-status-cell {
  display: flex;
  align-items: center;
}

.status-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
  white-space: nowrap;
}

.status-badge.status-pending {
  background: #fef3c7;
  color: #92400e;
}

.status-badge.status-verified {
  background: #dcfce7;
  color: #16a34a;
}

.status-badge.status-rejected {
  background: #fee2e2;
  color: #dc2626;
}

/* Expand icon */
.doc-expand-icon {
  display: flex;
  align-items: center;
  color: #94a3b8;
}

.doc-expand-icon svg {
  transition: transform 0.2s;
}

.doc-expand-icon svg.rotated {
  transform: rotate(180deg);
}

/* ============================================
   EXPANDED DETAIL VIEW
   ============================================ */
.doc-detail {
  padding: 0 16px 16px;
  border-top: 1px solid #f1f5f9;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
  padding-top: 16px;
}

/* Preview section */
.detail-preview h4,
.detail-data h4 {
  margin: 0 0 12px 0;
  font-size: 0.85rem;
  font-weight: 600;
  color: #475569;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.preview-container {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 16px;
}

.preview-image {
  width: 100%;
  max-height: 320px;
  object-fit: contain;
  display: block;
  background: #f8fafc;
}

.preview-link {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 32px;
  color: var(--color-primary, #23424a);
  text-decoration: none;
  font-weight: 500;
  font-size: 0.9rem;
}

.preview-link:hover {
  background: #f8fafc;
}

.no-file {
  padding: 32px;
  text-align: center;
  color: #94a3b8;
  background: #f8fafc;
  border-radius: 8px;
  font-size: 0.9rem;
  margin-bottom: 16px;
}

/* Verification level in detail */
.detail-level {
  margin-top: 16px;
}

.level-display {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.level-label {
  font-size: 0.8rem;
  font-weight: 600;
  white-space: nowrap;
}

.level-label.level-none {
  color: #94a3b8;
}
.level-label.level-verified {
  color: #16a34a;
}
.level-label.level-extended {
  color: #2563eb;
}
.level-label.level-detailed {
  color: #7c3aed;
}
.level-label.level-audited {
  color: #d97706;
}
.level-label.level-certified {
  color: #0d9488;
}

.other-docs {
  margin-top: 8px;
}

.other-docs-label {
  font-size: 0.8rem;
  color: #64748b;
  display: block;
  margin-bottom: 6px;
}

.other-docs-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.other-doc-chip {
  display: inline-block;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 500;
}

.other-doc-chip.status-pending {
  background: #fef3c7;
  color: #92400e;
}

.other-doc-chip.status-verified {
  background: #dcfce7;
  color: #16a34a;
}

.other-doc-chip.status-rejected {
  background: #fee2e2;
  color: #dc2626;
}

/* Vehicle data section */
.data-list {
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0;
}

.data-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 8px 0;
  border-bottom: 1px solid #f1f5f9;
}

.data-row:last-child {
  border-bottom: none;
}

.data-row dt {
  font-size: 0.8rem;
  font-weight: 500;
  color: #64748b;
  flex-shrink: 0;
}

.data-row dd {
  margin: 0;
  font-size: 0.9rem;
  color: #1e293b;
  font-weight: 500;
  text-align: right;
}

.data-row.full {
  flex-direction: column;
  gap: 4px;
}

.data-row.full dd {
  text-align: left;
  font-weight: 400;
}

.data-row.rejection dt {
  color: #dc2626;
}

.data-row.rejection dd {
  color: #dc2626;
}

/* Actions section */
.detail-actions {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e2e8f0;
}

.rejection-input {
  margin-bottom: 12px;
}

.rejection-input label {
  display: block;
  font-size: 0.8rem;
  font-weight: 500;
  color: #475569;
  margin-bottom: 6px;
}

.rejection-input textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.9rem;
  font-family: inherit;
  resize: vertical;
  min-height: 60px;
}

.rejection-input textarea:focus {
  outline: none;
  border-color: var(--color-primary, #23424a);
  box-shadow: 0 0 0 3px rgba(35, 66, 74, 0.1);
}

.action-buttons {
  display: flex;
  gap: 12px;
}

.btn-approve,
.btn-reject {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition:
    background 0.2s,
    opacity 0.2s;
  min-height: 44px;
  flex: 1;
}

.btn-approve {
  background: #16a34a;
  color: white;
}

.btn-approve:hover {
  background: #15803d;
}

.btn-reject {
  background: #dc2626;
  color: white;
}

.btn-reject:hover {
  background: #b91c1c;
}

.btn-approve:disabled,
.btn-reject:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Already reviewed */
.detail-reviewed {
  margin-top: 16px;
  padding: 12px 16px;
  background: #f8fafc;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.reviewed-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 600;
}

.reviewed-badge.status-verified {
  background: #dcfce7;
  color: #16a34a;
}

.reviewed-badge.status-rejected {
  background: #fee2e2;
  color: #dc2626;
}

.reviewed-reason {
  font-size: 0.85rem;
  color: #64748b;
  font-style: italic;
}

/* ============================================
   RESPONSIVE — Mobile-first, breakpoints up
   ============================================ */

/* 480px+ : Show doc type column */
@media (min-width: 480px) {
  .doc-type-cell {
    display: flex;
    align-items: center;
  }
}

/* 768px+ : Tablet layout */
@media (min-width: 768px) {
  .page-header {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }

  .btn-refresh {
    align-self: auto;
  }

  .filters-bar {
    flex-direction: row;
    align-items: center;
  }

  .search-box {
    max-width: 280px;
  }

  .doc-date-cell {
    display: block;
  }

  .doc-row {
    grid-template-columns: 1fr auto auto auto auto;
  }

  .detail-grid {
    grid-template-columns: 1fr 1fr;
  }

  .vehicle-levels {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* 1024px+ : Desktop layout */
@media (min-width: 1024px) {
  .vehicle-levels {
    grid-template-columns: repeat(3, 1fr);
  }

  .action-buttons {
    flex: none;
  }

  .btn-approve,
  .btn-reject {
    flex: none;
    padding: 10px 24px;
  }
}

/* 1280px+ : Wide desktop */
@media (min-width: 1280px) {
  .vehicle-levels {
    grid-template-columns: repeat(4, 1fr);
  }
}
</style>

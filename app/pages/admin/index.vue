<template>
  <div class="admin-dashboard">
    <!-- KPI Summary Widget -->
    <div class="kpi-summary-row">
      <div class="kpi-mini-card">
        <span class="kpi-mini-label">Ingresos mes</span>
        <span class="kpi-mini-value">{{ formatKpiEuros(kpiSummary.monthlyRevenue.current) }}</span>
        <span
          class="kpi-mini-change"
          :class="kpiChangeClass(kpiSummary.monthlyRevenue.changePercent)"
        >
          {{ kpiSummary.monthlyRevenue.changePercent > 0 ? '+' : ''
          }}{{ kpiSummary.monthlyRevenue.changePercent }}%
        </span>
      </div>
      <div class="kpi-mini-card">
        <span class="kpi-mini-label">Vehiculos</span>
        <span class="kpi-mini-value">{{ kpiSummary.activeVehicles.current }}</span>
        <span
          class="kpi-mini-change"
          :class="kpiChangeClass(kpiSummary.activeVehicles.changePercent)"
        >
          {{ kpiSummary.activeVehicles.changePercent > 0 ? '+' : ''
          }}{{ kpiSummary.activeVehicles.changePercent }}%
        </span>
      </div>
      <div class="kpi-mini-card">
        <span class="kpi-mini-label">Dealers</span>
        <span class="kpi-mini-value">{{ kpiSummary.activeDealers.current }}</span>
        <span
          class="kpi-mini-change"
          :class="kpiChangeClass(kpiSummary.activeDealers.changePercent)"
        >
          {{ kpiSummary.activeDealers.changePercent > 0 ? '+' : ''
          }}{{ kpiSummary.activeDealers.changePercent }}%
        </span>
      </div>
      <div class="kpi-mini-card">
        <span class="kpi-mini-label">Leads mes</span>
        <span class="kpi-mini-value">{{ kpiSummary.monthlyLeads.current }}</span>
        <span
          class="kpi-mini-change"
          :class="kpiChangeClass(kpiSummary.monthlyLeads.changePercent)"
        >
          {{ kpiSummary.monthlyLeads.changePercent > 0 ? '+' : ''
          }}{{ kpiSummary.monthlyLeads.changePercent }}%
        </span>
      </div>
    </div>

    <!-- Banner Status Card -->
    <div class="banner-status-card" :class="{ active: bannerEnabled, inactive: !bannerEnabled }">
      <div class="banner-status-info">
        <span class="banner-status-icon">🔔</span>
        <div class="banner-status-text">
          <strong>Banner:</strong>
          <span v-if="bannerEnabled" class="status-label status-active">ACTIVO</span>
          <span v-else class="status-label status-inactive">INACTIVO</span>
          <span v-if="bannerText" class="banner-preview-text">
            - "{{ bannerText.length > 40 ? bannerText.substring(0, 40) + '...' : bannerText }}"
          </span>
        </div>
      </div>
      <div class="banner-actions">
        <button
          class="btn-banner-toggle"
          :class="{ 'btn-deactivate': bannerEnabled, 'btn-activate': !bannerEnabled }"
          @click="toggleBanner"
        >
          {{ bannerEnabled ? 'Desactivar' : 'Activar' }}
        </button>
        <NuxtLink to="/admin/banner" class="btn-banner-edit"> Editar </NuxtLink>
      </div>
    </div>

    <!-- Quick Actions Bar -->
    <div class="quick-actions-bar">
      <NuxtLink to="/admin/productos" class="action-btn" title="Nuevo Vehículo">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="1" y="3" width="15" height="13" rx="2" />
          <path d="M16 8h5l3 3v9a2 2 0 01-2 2h-6" />
          <circle cx="5.5" cy="18.5" r="2.5" />
          <circle cx="18.5" cy="18.5" r="2.5" />
        </svg>
        <span>Vehículo</span>
      </NuxtLink>
      <NuxtLink to="/admin/noticias" class="action-btn" title="Nueva Noticia">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
          <path d="M14 2v6h6" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
        </svg>
        <span>Noticia</span>
      </NuxtLink>
      <NuxtLink to="/admin/balance" class="action-btn" title="Balance">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="1" x2="12" y2="23" />
          <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
        </svg>
        <span>Balance</span>
      </NuxtLink>
    </div>

    <!-- Notifications Grid -->
    <div class="notifications-grid">
      <NuxtLink
        to="/admin/anunciantes"
        class="notification-card"
        :class="{ 'has-pending': stats.anunciantesPending > 0 }"
      >
        <div class="notification-icon">📣</div>
        <div class="notification-content">
          <span class="notification-label">Anunciantes</span>
          <span class="notification-value">{{ stats.anunciantes }}</span>
        </div>
        <span v-if="stats.anunciantesPending > 0" class="notification-badge">{{
          stats.anunciantesPending
        }}</span>
      </NuxtLink>

      <NuxtLink
        to="/admin/solicitantes"
        class="notification-card"
        :class="{ 'has-pending': stats.solicitantesPending > 0 }"
      >
        <div class="notification-icon">🔍</div>
        <div class="notification-content">
          <span class="notification-label">Solicitantes</span>
          <span class="notification-value">{{ stats.solicitantes }}</span>
        </div>
        <span v-if="stats.solicitantesPending > 0" class="notification-badge">{{
          stats.solicitantesPending
        }}</span>
      </NuxtLink>

      <NuxtLink
        to="/admin/comentarios"
        class="notification-card"
        :class="{ 'has-pending': stats.comentariosPending > 0 }"
      >
        <div class="notification-icon">💬</div>
        <div class="notification-content">
          <span class="notification-label">Comentarios</span>
          <span class="notification-value">{{ stats.comentarios }}</span>
        </div>
        <span v-if="stats.comentariosPending > 0" class="notification-badge">{{
          stats.comentariosPending
        }}</span>
      </NuxtLink>

      <NuxtLink
        to="/admin/chats"
        class="notification-card"
        :class="{ 'has-pending': stats.chatsUnread > 0 }"
      >
        <div class="notification-icon">📱</div>
        <div class="notification-content">
          <span class="notification-label">Chats</span>
          <span class="notification-value">{{ stats.chats }}</span>
        </div>
        <span v-if="stats.chatsUnread > 0" class="notification-badge">{{ stats.chatsUnread }}</span>
      </NuxtLink>

      <NuxtLink
        to="/admin/suscripciones"
        class="notification-card"
        :class="{ 'has-pending': stats.suscripcionesPending > 0 }"
      >
        <div class="notification-icon">📧</div>
        <div class="notification-content">
          <span class="notification-label">Suscripciones</span>
          <span class="notification-value">{{ stats.suscripciones }}</span>
        </div>
        <span v-if="stats.suscripcionesPending > 0" class="notification-badge">{{
          stats.suscripcionesPending
        }}</span>
      </NuxtLink>
    </div>

    <!-- Pendientes y Coincidencias -->
    <div class="two-columns">
      <!-- Pendientes -->
      <div class="dashboard-section">
        <h2 class="section-title">
          <span class="title-icon">⏳</span>
          Pendientes
        </h2>
        <div class="pending-list">
          <NuxtLink
            v-if="stats.anunciantesPending > 0"
            to="/admin/anunciantes"
            class="pending-item"
          >
            <span class="pending-icon">📣</span>
            <span class="pending-text"
              >{{ stats.anunciantesPending }} anunciante{{
                stats.anunciantesPending !== 1 ? 's' : ''
              }}
              por revisar</span
            >
            <span class="pending-arrow">→</span>
          </NuxtLink>
          <NuxtLink
            v-if="stats.solicitantesPending > 0"
            to="/admin/solicitantes"
            class="pending-item"
          >
            <span class="pending-icon">🔍</span>
            <span class="pending-text"
              >{{ stats.solicitantesPending }} solicitante{{
                stats.solicitantesPending !== 1 ? 's' : ''
              }}
              por revisar</span
            >
            <span class="pending-arrow">→</span>
          </NuxtLink>
          <NuxtLink
            v-if="stats.comentariosPending > 0"
            to="/admin/comentarios"
            class="pending-item"
          >
            <span class="pending-icon">💬</span>
            <span class="pending-text"
              >{{ stats.comentariosPending }} comentario{{
                stats.comentariosPending !== 1 ? 's' : ''
              }}
              por moderar</span
            >
            <span class="pending-arrow">→</span>
          </NuxtLink>
          <NuxtLink v-if="stats.chatsUnread > 0" to="/admin/chats" class="pending-item">
            <span class="pending-icon">📱</span>
            <span class="pending-text"
              >{{ stats.chatsUnread }} mensaje{{ stats.chatsUnread !== 1 ? 's' : '' }} sin
              leer</span
            >
            <span class="pending-arrow">→</span>
          </NuxtLink>
          <div v-if="totalPending === 0" class="pending-empty">
            <span class="empty-icon">✓</span>
            <span>Todo al día</span>
          </div>
        </div>
      </div>

      <!-- Coincidencias -->
      <div class="dashboard-section">
        <h2 class="section-title">
          <span class="title-icon">🔗</span>
          Coincidencias
        </h2>
        <div class="matches-list">
          <div v-for="match in matches" :key="match.id" class="match-item">
            <div class="match-info">
              <span class="match-type" :class="match.type">{{ match.typeLabel }}</span>
              <span class="match-text">{{ match.description }}</span>
            </div>
            <NuxtLink :to="match.link" class="match-action">Ver →</NuxtLink>
          </div>
          <div v-if="matches.length === 0" class="matches-empty">
            <span class="empty-icon">📭</span>
            <span>No hay coincidencias</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Collapsible Stats Sections -->
    <div class="collapsible-sections">
      <!-- PRODUCTOS -->
      <div class="collapsible-section" :class="{ open: sectionsOpen.products }">
        <button class="collapsible-header" @click="sectionsOpen.products = !sectionsOpen.products">
          <span class="collapsible-icon">🚛</span>
          <span class="collapsible-title">Productos</span>
          <span class="collapsible-summary"
            >{{ productStats.total }} total · {{ productStats.published }} publicados</span
          >
          <svg
            class="collapsible-chevron"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
        <div v-show="sectionsOpen.products" class="collapsible-content">
          <div class="stats-cards">
            <div class="mini-stat">
              <span class="mini-stat-value">{{ productStats.total }}</span>
              <span class="mini-stat-label">Total</span>
            </div>
            <div class="mini-stat published">
              <span class="mini-stat-value">{{ productStats.published }}</span>
              <span class="mini-stat-label">Publicados</span>
            </div>
            <div class="mini-stat unpublished">
              <span class="mini-stat-value">{{ productStats.unpublished }}</span>
              <span class="mini-stat-label">No publicados</span>
            </div>
          </div>

          <div class="stats-breakdown">
            <h4 class="breakdown-title">Por categoría</h4>
            <div class="breakdown-items">
              <div v-for="cat in productStats.byCategory" :key="cat.name" class="breakdown-item">
                <span class="breakdown-label">{{ cat.name }}</span>
                <span class="breakdown-value">{{ cat.count }}</span>
              </div>
              <div v-if="productStats.byCategory.length === 0" class="breakdown-empty">
                Sin datos
              </div>
            </div>
          </div>

          <div class="stats-breakdown">
            <h4 class="breakdown-title">Por tipo</h4>
            <div class="breakdown-items scrollable">
              <div v-for="sub in productStats.byType" :key="sub.name" class="breakdown-item">
                <span class="breakdown-label">{{ sub.name }}</span>
                <span class="breakdown-value">{{ sub.count }}</span>
              </div>
              <div v-if="productStats.byType.length === 0" class="breakdown-empty">Sin datos</div>
            </div>
          </div>
        </div>
      </div>

      <!-- COMUNIDAD -->
      <div class="collapsible-section" :class="{ open: sectionsOpen.users }">
        <button class="collapsible-header" @click="sectionsOpen.users = !sectionsOpen.users">
          <span class="collapsible-icon">👥</span>
          <span class="collapsible-title">Comunidad</span>
          <span class="collapsible-summary"
            >{{ userStats.registered }} registrados · {{ userStats.visits }} visitas</span
          >
          <svg
            class="collapsible-chevron"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
        <div v-show="sectionsOpen.users" class="collapsible-content">
          <div class="stats-cards">
            <div class="mini-stat">
              <span class="mini-stat-value">{{ userStats.visits }}</span>
              <span class="mini-stat-label">Visitas</span>
            </div>
            <div class="mini-stat">
              <span class="mini-stat-value">{{ userStats.uniqueVisits }}</span>
              <span class="mini-stat-label">Visitas únicas</span>
            </div>
            <div class="mini-stat highlight">
              <span class="mini-stat-value">{{ userStats.registered }}</span>
              <span class="mini-stat-label">Registrados</span>
            </div>
          </div>

          <div class="user-stats-grid">
            <div class="user-stat-item">
              <span class="user-stat-icon">🛒</span>
              <span class="user-stat-value">{{ userStats.buyers }}</span>
              <span class="user-stat-label">Compradores</span>
            </div>
            <div class="user-stat-item">
              <span class="user-stat-icon">🔑</span>
              <span class="user-stat-value">{{ userStats.renters }}</span>
              <span class="user-stat-label">Arrendatarios</span>
            </div>
            <div class="user-stat-item">
              <span class="user-stat-icon">📝</span>
              <span class="user-stat-value">{{ userStats.requests }}</span>
              <span class="user-stat-label">Solicitudes</span>
            </div>
            <div class="user-stat-item">
              <span class="user-stat-icon">📢</span>
              <span class="user-stat-value">{{ userStats.advertisers }}</span>
              <span class="user-stat-label">Anunciantes</span>
            </div>
            <div class="user-stat-item">
              <span class="user-stat-icon">👁️</span>
              <span class="user-stat-value">{{ userStats.newsVisits }}</span>
              <span class="user-stat-label">Visitas noticias</span>
            </div>
            <div class="user-stat-item">
              <span class="user-stat-icon">💬</span>
              <span class="user-stat-value">{{ userStats.newsComments }}</span>
              <span class="user-stat-label">Comentarios</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const supabase = useSupabaseClient()

// KPI Summary from metrics composable
const { kpiSummary, loadMetrics: loadKpiMetrics } = useAdminMetrics()

function formatKpiEuros(cents: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100)
}

function kpiChangeClass(pct: number): string {
  if (pct > 0) return 'kpi-change-up'
  if (pct < 0) return 'kpi-change-down'
  return 'kpi-change-flat'
}

// Notification stats
const stats = ref({
  anunciantes: 0,
  anunciantesPending: 0,
  solicitantes: 0,
  solicitantesPending: 0,
  comentarios: 0,
  comentariosPending: 0,
  chats: 0,
  chatsUnread: 0,
  suscripciones: 0,
  suscripcionesPending: 0,
})

// Product stats
const productStats = ref({
  total: 0,
  published: 0,
  unpublished: 0,
  byCategory: [] as Array<{ name: string; count: number }>,
  byType: [] as Array<{ name: string; count: number }>,
})

// User stats
const userStats = ref({
  visits: 0,
  uniqueVisits: 0,
  registered: 0,
  buyers: 0,
  renters: 0,
  requests: 0,
  advertisers: 0,
  newsVisits: 0,
  newsComments: 0,
})

// Banner control
const bannerEnabled = ref(false)
const bannerText = ref('')

// Collapsible sections state
const sectionsOpen = ref({
  products: false,
  users: false,
})

// Total pending
const totalPending = computed(
  () =>
    stats.value.anunciantesPending +
    stats.value.solicitantesPending +
    stats.value.comentariosPending +
    stats.value.chatsUnread,
)

// Matches (coincidencias entre solicitantes y vehículos disponibles)
const matches = ref<
  Array<{
    id: string
    type: 'demand' | 'vehicle'
    typeLabel: string
    description: string
    link: string
  }>
>([])

async function loadBannerConfig() {
  try {
    const { data } = await supabase.from('config').select('value').eq('key', 'banner').single()

    if (data?.value) {
      bannerEnabled.value = data.value.enabled || false
      bannerText.value = data.value.text_es || data.value.text || ''
    }
  } catch {
    // Config not found
  }
}

async function toggleBanner() {
  try {
    const { data: existing } = await supabase
      .from('config')
      .select('value')
      .eq('key', 'banner')
      .single()

    // Toggle the current state
    const newEnabledState = !bannerEnabled.value

    const newValue = {
      ...(existing?.value || {}),
      enabled: newEnabledState,
    }

    const { error: err } = await supabase.from('config').upsert({ key: 'banner', value: newValue })

    if (err) throw err

    // Update local state on success
    bannerEnabled.value = newEnabledState
  } catch (err) {
    if (import.meta.dev) console.error('Error toggling banner:', err)
  }
}

async function loadMatches() {
  // TODO(2026-02): Implementar lógica de coincidencias entre solicitantes y vehículos (requiere tabla de demandas cruzadas)
  // Por ahora solo mostramos un placeholder
  matches.value = []
}

async function loadStats() {
  try {
    // Load notification counts
    await Promise.all([
      loadAnunciantes(),
      loadSolicitantes(),
      loadComentarios(),
      loadChats(),
      loadSuscripciones(),
      loadProductStats(),
      loadUserStats(),
      loadBannerConfig(),
      loadMatches(),
    ])
  } catch (err) {
    if (import.meta.dev) console.error('Error loading stats:', err)
  }
}

async function loadAnunciantes() {
  try {
    const { data, count } = await supabase
      .from('advertisements')
      .select('status', { count: 'exact' })

    stats.value.anunciantes = count || 0
    stats.value.anunciantesPending = (data || []).filter(
      (a: { status: string }) => a.status === 'pending',
    ).length
  } catch {
    // Table doesn't exist yet
  }
}

async function loadSolicitantes() {
  try {
    const { data, count } = await supabase.from('demands').select('status', { count: 'exact' })

    stats.value.solicitantes = count || 0
    stats.value.solicitantesPending = (data || []).filter(
      (s: { status: string }) => s.status === 'pending',
    ).length
  } catch {
    // Table doesn't exist yet
  }
}

async function loadComentarios() {
  try {
    const { data, count } = await supabase.from('comments').select('status', { count: 'exact' })

    stats.value.comentarios = count || 0
    stats.value.comentariosPending = (data || []).filter(
      (c: { status: string }) => c.status === 'pending',
    ).length
  } catch {
    // Table doesn't exist yet
  }
}

async function loadChats() {
  try {
    const { data } = await supabase.from('chat_messages').select('is_read, user_id')

    const uniqueUsers = new Set((data || []).map((c: { user_id: string }) => c.user_id))
    stats.value.chats = uniqueUsers.size
    stats.value.chatsUnread = (data || []).filter((c: { is_read: boolean }) => !c.is_read).length
  } catch {
    // Table doesn't exist yet
  }
}

async function loadSuscripciones() {
  try {
    const { count } = await supabase
      .from('subscriptions')
      .select('*', { count: 'exact', head: true })

    stats.value.suscripciones = count || 0
    // For now, no pending status for subscriptions
    stats.value.suscripcionesPending = 0
  } catch {
    // Table doesn't exist yet
  }
}

async function loadProductStats() {
  try {
    // Total and by status
    const { data: vehicles } = await supabase.from('vehicles').select('status, category, type_id')

    const all = vehicles || []
    productStats.value.total = all.length
    productStats.value.published = all.filter(
      (v: { status: string }) => v.status === 'published',
    ).length
    productStats.value.unpublished = all.filter(
      (v: { status: string }) => v.status !== 'published',
    ).length

    // By category
    const categoryMap = new Map<string, number>()
    all.forEach((v: { category: string }) => {
      const cat = v.category || 'Sin categoría'
      categoryMap.set(cat, (categoryMap.get(cat) || 0) + 1)
    })
    productStats.value.byCategory = Array.from(categoryMap.entries())
      .map(([name, count]) => ({ name: formatCategory(name), count }))
      .sort((a, b) => b.count - a.count)

    // By type - need to join with types table
    const { data: types } = await supabase.from('subcategories').select('id, name_es')

    const subMap = new Map<string, string>()
    ;(types || []).forEach((s: { id: string; name_es: string }) => {
      subMap.set(s.id, s.name_es)
    })

    const typeCount = new Map<string, number>()
    all.forEach((v: { type_id: string | null }) => {
      if (v.type_id) {
        const name = subMap.get(v.type_id) || 'Desconocida'
        typeCount.set(name, (typeCount.get(name) || 0) + 1)
      }
    })
    productStats.value.byType = Array.from(typeCount.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
  } catch (err) {
    if (import.meta.dev) console.error('Error loading product stats:', err)
  }
}

async function loadUserStats() {
  try {
    // Registered users
    const { count: usersCount } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })

    userStats.value.registered = usersCount || 0

    // Advertisers (from advertisements table - unique users)
    try {
      const { data: ads } = await supabase.from('advertisements').select('user_id')
      const uniqueAdvertisers = new Set((ads || []).map((a: { user_id: string }) => a.user_id))
      userStats.value.advertisers = uniqueAdvertisers.size
    } catch {
      // Table doesn't exist
    }

    // Requests (from demands table)
    try {
      const { count: demandsCount } = await supabase
        .from('demands')
        .select('*', { count: 'exact', head: true })
      userStats.value.requests = demandsCount || 0
    } catch {
      // Table doesn't exist
    }

    // Comments count
    try {
      const { count: commentsCount } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
      userStats.value.newsComments = commentsCount || 0
    } catch {
      // Table doesn't exist
    }

    // News visits (from viewed_vehicles or a separate stats table)
    // For now, use placeholder
    userStats.value.visits = 0
    userStats.value.uniqueVisits = 0
    userStats.value.newsVisits = 0
    userStats.value.buyers = 0
    userStats.value.renters = 0
  } catch (err) {
    if (import.meta.dev) console.error('Error loading user stats:', err)
  }
}

function formatCategory(category: string): string {
  const map: Record<string, string> = {
    venta: 'Venta',
    alquiler: 'Alquiler',
    terceros: 'Terceros',
  }
  return map[category] || category
}

// Initial load
onMounted(() => {
  loadStats()
  loadKpiMetrics()
})
</script>

<style scoped>
.admin-dashboard {
  max-width: 1400px;
  margin: 0 auto;
}

/* KPI Summary Widget */
.kpi-summary-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-3);
  margin-bottom: var(--spacing-4);
}

.kpi-mini-card {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-3);
  display: flex;
  flex-direction: column;
  gap: 2px;
  box-shadow: var(--shadow-sm);
}

.kpi-mini-label {
  font-size: var(--font-size-xs);
  color: var(--text-auxiliary);
  font-weight: var(--font-weight-medium);
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.kpi-mini-value {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
}

.kpi-mini-change {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
}

.kpi-change-up {
  color: #16a34a;
}

.kpi-change-down {
  color: #dc2626;
}

.kpi-change-flat {
  color: var(--text-auxiliary);
}

@media (min-width: 768px) {
  .kpi-summary-row {
    grid-template-columns: repeat(4, 1fr);
  }

  .kpi-mini-value {
    font-size: var(--font-size-xl);
  }
}

/* Banner Status Card */
.banner-status-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--spacing-4);
  padding: var(--spacing-4) var(--spacing-5);
  border-radius: var(--border-radius-lg);
  border: 2px solid;
  margin-bottom: var(--spacing-4);
  transition: all 0.3s ease;
  flex-wrap: wrap;
}

.banner-status-card.active {
  background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);
  border-color: #28a745;
}

.banner-status-card.inactive {
  background: linear-gradient(135deg, #fff3cd 0%, #ffeeba 100%);
  border-color: #ffc107;
}

.banner-status-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  flex: 1;
  min-width: 0;
}

.banner-status-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.banner-status-text {
  font-size: var(--font-size-sm);
  color: #333;
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  flex-wrap: wrap;
}

.banner-status-text strong {
  color: #0f2a2e;
}

.status-label {
  font-weight: var(--font-weight-bold);
  padding: 2px 8px;
  border-radius: 4px;
  font-size: var(--font-size-xs);
}

.status-label.status-active {
  background: #28a745;
  color: white;
}

.status-label.status-inactive {
  background: #ffc107;
  color: #333;
}

.banner-preview-text {
  color: #555;
  font-style: italic;
}

.banner-actions {
  display: flex;
  gap: var(--spacing-2);
  flex-shrink: 0;
}

.btn-banner-toggle {
  padding: 8px 20px;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: var(--font-size-sm);
}

.btn-banner-toggle.btn-deactivate {
  background: #dc3545;
  color: white;
}

.btn-banner-toggle.btn-deactivate:hover {
  background: #c82333;
}

.btn-banner-toggle.btn-activate {
  background: #28a745;
  color: white;
}

.btn-banner-toggle.btn-activate:hover {
  background: #218838;
}

.btn-banner-edit {
  padding: 8px 16px;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  text-decoration: none;
  font-size: var(--font-size-sm);
  transition: background 0.2s;
}

.btn-banner-edit:hover {
  background: var(--color-primary-dark);
}

/* Quick Actions Bar */
.quick-actions-bar {
  display: flex;
  gap: var(--spacing-3);
  margin-bottom: var(--spacing-6);
  flex-wrap: wrap;
}

.quick-actions-bar .action-btn {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  padding: var(--spacing-2) var(--spacing-4);
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  color: var(--text-secondary);
  text-decoration: none;
  transition: all var(--transition-fast);
  font-size: var(--font-size-sm);
}

.quick-actions-bar .action-btn:hover {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
}

.quick-actions-bar .action-btn svg {
  width: 18px;
  height: 18px;
}

.quick-actions-bar .action-btn span {
  font-weight: var(--font-weight-medium);
}

/* Mobile base: banner & quick actions stacked */
.banner-status-card {
  flex-direction: column;
  align-items: stretch;
  gap: var(--spacing-3);
}

.banner-status-info {
  justify-content: center;
  text-align: center;
  flex-direction: column;
}

.banner-status-text {
  justify-content: center;
}

.banner-actions {
  justify-content: center;
}

.quick-actions-bar {
  justify-content: center;
}

.quick-actions-bar .action-btn span {
  display: none;
}

.quick-actions-bar .action-btn {
  padding: var(--spacing-3);
}

@media (min-width: 640px) {
  .banner-status-card {
    flex-direction: row;
    align-items: center;
    gap: var(--spacing-4);
  }

  .banner-status-info {
    justify-content: flex-start;
    text-align: left;
    flex-direction: row;
  }

  .banner-status-text {
    justify-content: flex-start;
  }

  .banner-actions {
    justify-content: flex-end;
  }

  .quick-actions-bar {
    justify-content: flex-start;
  }

  .quick-actions-bar .action-btn span {
    display: inline;
  }

  .quick-actions-bar .action-btn {
    padding: var(--spacing-2) var(--spacing-4);
  }
}

/* Notifications Grid */
.notifications-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-3);
  margin-bottom: var(--spacing-8);
}

@media (min-width: 600px) {
  .notifications-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (min-width: 900px) {
  .notifications-grid {
    grid-template-columns: repeat(5, 1fr);
  }
}

.notification-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  padding: var(--spacing-4);
  background: var(--bg-primary);
  border-radius: var(--border-radius-md);
  border: 1px solid var(--border-color);
  text-decoration: none;
  transition: all var(--transition-fast);
}

.notification-card:hover {
  box-shadow: var(--shadow-md);
  border-color: var(--color-primary);
}

.notification-card.has-pending {
  background: linear-gradient(135deg, #fef2f2 0%, #fff5f5 100%);
  border-color: #fecaca;
}

.notification-card.has-pending:hover {
  border-color: #f87171;
}

.notification-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.notification-content {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.notification-label {
  font-size: var(--font-size-sm);
  color: var(--text-auxiliary);
}

.notification-value {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
}

.notification-badge {
  position: absolute;
  top: -6px;
  right: -6px;
  min-width: 22px;
  height: 22px;
  padding: 0 6px;
  background: #ef4444;
  color: white;
  font-size: 12px;
  font-weight: var(--font-weight-bold);
  border-radius: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-3);
  margin-bottom: var(--spacing-4);
}

.mini-stat {
  background: var(--bg-secondary);
  border-radius: var(--border-radius);
  padding: var(--spacing-3);
  text-align: center;
}

.mini-stat.published {
  background: rgba(16, 185, 129, 0.1);
}

.mini-stat.unpublished {
  background: rgba(245, 158, 11, 0.1);
}

.mini-stat.highlight {
  background: rgba(35, 66, 74, 0.1);
}

.mini-stat-value {
  display: block;
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
}

.mini-stat-label {
  display: block;
  font-size: var(--font-size-xs);
  color: var(--text-auxiliary);
  margin-top: var(--spacing-1);
}

/* Breakdown */
.stats-breakdown {
  margin-bottom: var(--spacing-4);
}

.breakdown-title {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-secondary);
  margin-bottom: var(--spacing-2);
}

.breakdown-items {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
}

.breakdown-items.scrollable {
  max-height: 150px;
  overflow-y: auto;
}

.breakdown-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-2) var(--spacing-3);
  background: var(--bg-secondary);
  border-radius: var(--border-radius-sm);
}

.breakdown-label {
  font-size: var(--font-size-sm);
  color: var(--text-primary);
}

.breakdown-value {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-primary);
}

.breakdown-empty {
  font-size: var(--font-size-sm);
  color: var(--text-auxiliary);
  text-align: center;
  padding: var(--spacing-3);
}

/* User stats grid */
.user-stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-3);
}

@media (min-width: 480px) {
  .user-stats-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

.user-stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--spacing-3);
  background: var(--bg-secondary);
  border-radius: var(--border-radius);
  text-align: center;
}

.user-stat-icon {
  font-size: 20px;
  margin-bottom: var(--spacing-1);
}

.user-stat-value {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
}

.user-stat-label {
  font-size: var(--font-size-xs);
  color: var(--text-auxiliary);
}

/* Dashboard sections */
.dashboard-section {
  margin-bottom: var(--spacing-6);
}

.section-title {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin-bottom: var(--spacing-4);
}

.title-icon {
  font-size: 20px;
}

/* Toggle switch */
.toggle-switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
  flex-shrink: 0;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: 0.3s;
  border-radius: 24px;
}

.toggle-slider::before {
  position: absolute;
  content: '';
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.3s;
  border-radius: 50%;
}

.toggle-switch input:checked + .toggle-slider {
  background-color: #10b981;
}

.toggle-switch input:checked + .toggle-slider::before {
  transform: translateX(20px);
}

/* Two columns layout */
.two-columns {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-4);
  margin-bottom: var(--spacing-6);
}

@media (min-width: 768px) {
  .two-columns {
    grid-template-columns: repeat(2, 1fr);
  }
}

.two-columns .dashboard-section {
  margin-bottom: 0;
}

/* Pending list */
.pending-list {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-lg);
  overflow: hidden;
}

.pending-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  padding: var(--spacing-3) var(--spacing-4);
  text-decoration: none;
  color: var(--text-primary);
  border-bottom: 1px solid var(--border-color);
  transition: background var(--transition-fast);
}

.pending-item:last-child {
  border-bottom: none;
}

.pending-item:hover {
  background: var(--bg-secondary);
}

.pending-icon {
  font-size: 18px;
  flex-shrink: 0;
}

.pending-text {
  flex: 1;
  font-size: var(--font-size-sm);
}

.pending-arrow {
  color: var(--text-auxiliary);
  font-size: var(--font-size-sm);
}

.pending-empty,
.matches-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-2);
  padding: var(--spacing-6);
  color: var(--text-auxiliary);
  font-size: var(--font-size-sm);
}

.empty-icon {
  font-size: 20px;
}

/* Matches list */
.matches-list {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-lg);
  overflow: hidden;
}

.match-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-3);
  padding: var(--spacing-3) var(--spacing-4);
  border-bottom: 1px solid var(--border-color);
}

.match-item:last-child {
  border-bottom: none;
}

.match-info {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
  min-width: 0;
}

.match-type {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.match-type.demand {
  color: #8b5cf6;
}

.match-type.vehicle {
  color: #10b981;
}

.match-text {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.match-action {
  color: var(--color-primary);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  text-decoration: none;
  white-space: nowrap;
}

.match-action:hover {
  text-decoration: underline;
}

/* Collapsible Sections */
.collapsible-sections {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

.collapsible-section {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-lg);
  overflow: hidden;
}

.collapsible-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  width: 100%;
  padding: var(--spacing-4);
  text-align: left;
  transition: background var(--transition-fast);
  min-height: 56px;
}

.collapsible-header:hover {
  background: var(--bg-secondary);
}

.collapsible-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.collapsible-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
}

.collapsible-summary {
  flex: 1;
  font-size: var(--font-size-sm);
  color: var(--text-auxiliary);
  text-align: right;
  margin-right: var(--spacing-2);
}

.collapsible-chevron {
  width: 20px;
  height: 20px;
  color: var(--text-auxiliary);
  transition: transform var(--transition-fast);
  flex-shrink: 0;
}

.collapsible-section.open .collapsible-chevron {
  transform: rotate(180deg);
}

.collapsible-content {
  padding: 0 var(--spacing-4) var(--spacing-4);
  border-top: 1px solid var(--border-color);
}

.collapsible-content .stats-cards {
  margin-top: var(--spacing-4);
}

/* Mobile base: hide collapsible summary */
.collapsible-summary {
  display: none;
}

@media (min-width: 640px) {
  .collapsible-summary {
    display: block;
  }
}
</style>

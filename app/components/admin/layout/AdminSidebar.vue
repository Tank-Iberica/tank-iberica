<template>
  <aside class="admin-sidebar" :class="{ collapsed, open }">
    <!-- Header with company name and dropdown -->
    <div class="sidebar-header">
      <!-- Company name row -->
      <div class="header-top">
        <div v-if="!collapsed" class="company-dropdown" :class="{ 'dropdown-open': showDropdown }">
          <button class="company-btn" @click="toggleDropdown">
            <span class="logo-icon">TI</span>
            <span class="company-name">Tracciona</span>
            <svg
              class="dropdown-arrow"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>

          <!-- Dropdown menu -->
          <Transition name="dropdown">
            <div v-if="showDropdown" class="dropdown-menu">
              <button class="dropdown-item" @click="handleLogout">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Cerrar sesión
              </button>
            </div>
          </Transition>
        </div>

        <!-- Collapsed: just logo -->
        <span v-else class="logo-icon">TI</span>

        <!-- Mobile close button -->
        <button
          v-if="!collapsed"
          class="close-btn-mobile"
          aria-label="Cerrar menú"
          @click="$emit('close')"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Action buttons row (always visible) -->
      <div class="header-actions">
        <a href="/" target="_blank" class="header-btn" :title="collapsed ? '' : 'Abrir sitio'">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
          <span v-if="!collapsed" class="btn-label">Abrir sitio</span>
        </a>
        <button
          class="header-btn"
          :title="collapsed ? '' : collapsed ? 'Expandir' : 'Plegar'"
          @click="$emit('toggle-collapse')"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path v-if="collapsed" d="M9 18l6-6-6-6" />
            <path v-else d="M15 18l-6-6 6-6" />
          </svg>
          <span v-if="!collapsed" class="btn-label">Plegar menú</span>
        </button>
      </div>
    </div>

    <!-- Navigation -->
    <nav class="sidebar-nav">
      <!-- 1. DASHBOARD -->
      <NuxtLink to="/admin" class="nav-item" :class="{ active: isActive('/admin', true) }">
        <svg
          class="nav-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <rect x="3" y="3" width="7" height="9" rx="1" />
          <rect x="14" y="3" width="7" height="5" rx="1" />
          <rect x="14" y="12" width="7" height="9" rx="1" />
          <rect x="3" y="16" width="7" height="5" rx="1" />
        </svg>
        <span v-if="!collapsed" class="nav-label">Dashboard</span>
      </NuxtLink>

      <!-- 1b. METRICS -->
      <NuxtLink
        to="/admin/dashboard"
        class="nav-item"
        :class="{ active: isActive('/admin/dashboard') }"
      >
        <svg
          class="nav-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
        <span v-if="!collapsed" class="nav-label">Metricas</span>
      </NuxtLink>

      <!-- 2. CONFIGURACIÓN -->
      <div class="nav-group">
        <button
          class="nav-group-header"
          :class="{ 'has-badge': false, active: isActiveGroup('config') }"
          @click="collapsed ? openPopover('config', $event) : toggleGroup('config')"
        >
          <svg
            class="nav-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <circle cx="12" cy="12" r="3" />
            <path
              d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"
            />
          </svg>
          <span v-if="!collapsed" class="nav-label">Configuración</span>
          <svg
            v-if="!collapsed"
            class="nav-chevron"
            :class="{ open: openGroups.config }"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
        <div v-if="!collapsed" v-show="openGroups.config" class="nav-group-items">
          <NuxtLink
            to="/admin/config/branding"
            class="nav-item sub"
            :class="{ active: isActive('/admin/config/branding') }"
          >
            <span class="nav-label">Identidad</span>
          </NuxtLink>
          <NuxtLink
            to="/admin/config/navigation"
            class="nav-item sub"
            :class="{ active: isActive('/admin/config/navigation') }"
          >
            <span class="nav-label">Navegación</span>
          </NuxtLink>
          <NuxtLink
            to="/admin/config/homepage"
            class="nav-item sub"
            :class="{ active: isActive('/admin/config/homepage') }"
          >
            <span class="nav-label">Homepage</span>
          </NuxtLink>
          <NuxtLink
            to="/admin/config/catalog"
            class="nav-item sub"
            :class="{ active: isActive('/admin/config/catalog') }"
          >
            <span class="nav-label">Catálogo</span>
          </NuxtLink>
          <NuxtLink
            to="/admin/config/languages"
            class="nav-item sub"
            :class="{ active: isActive('/admin/config/languages') }"
          >
            <span class="nav-label">Idiomas</span>
          </NuxtLink>
          <NuxtLink
            to="/admin/config/pricing"
            class="nav-item sub"
            :class="{ active: isActive('/admin/config/pricing') }"
          >
            <span class="nav-label">Precios</span>
          </NuxtLink>
          <NuxtLink
            to="/admin/config/integrations"
            class="nav-item sub"
            :class="{ active: isActive('/admin/config/integrations') }"
          >
            <span class="nav-label">Integraciones</span>
          </NuxtLink>
          <NuxtLink
            to="/admin/config/emails"
            class="nav-item sub"
            :class="{ active: isActive('/admin/config/emails') }"
          >
            <span class="nav-label">Emails</span>
          </NuxtLink>
          <NuxtLink
            to="/admin/config/editorial"
            class="nav-item sub"
            :class="{ active: isActive('/admin/config/editorial') }"
          >
            <span class="nav-label">Editorial</span>
          </NuxtLink>
          <NuxtLink
            to="/admin/config/system"
            class="nav-item sub"
            :class="{ active: isActive('/admin/config/system') }"
          >
            <span class="nav-label">Sistema</span>
          </NuxtLink>
        </div>
      </div>

      <!-- 3. CATÁLOGO -->
      <div class="nav-group">
        <button
          class="nav-group-header"
          :class="{ 'has-badge': pendingCatalog > 0, active: isActiveGroup('catalog') }"
          @click="collapsed ? openPopover('catalog', $event) : toggleGroup('catalog')"
        >
          <svg
            class="nav-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <rect x="1" y="3" width="15" height="13" rx="2" />
            <path d="M16 8h5l3 3v9a2 2 0 01-2 2h-6" />
            <circle cx="5.5" cy="18.5" r="2.5" />
            <circle cx="18.5" cy="18.5" r="2.5" />
          </svg>
          <span v-if="!collapsed" class="nav-label">Catálogo</span>
          <span v-if="!collapsed && !openGroups.catalog && pendingCatalog > 0" class="badge">{{
            pendingCatalog
          }}</span>
          <span v-if="collapsed && pendingCatalog > 0" class="badge-dot" />
          <svg
            v-if="!collapsed"
            class="nav-chevron"
            :class="{ open: openGroups.catalog }"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
        <div v-if="!collapsed" v-show="openGroups.catalog" class="nav-group-items">
          <NuxtLink
            to="/admin/productos"
            class="nav-item sub"
            :class="{ active: isActive('/admin/productos') }"
          >
            <span class="nav-label">Productos</span>
          </NuxtLink>
          <NuxtLink
            to="/admin/anunciantes"
            class="nav-item sub"
            :class="{ active: isActive('/admin/anunciantes') }"
          >
            <span class="nav-label">Anunciantes</span>
            <span v-if="pendingAnunciantes > 0" class="badge">{{ pendingAnunciantes }}</span>
          </NuxtLink>
          <NuxtLink
            to="/admin/solicitantes"
            class="nav-item sub"
            :class="{ active: isActive('/admin/solicitantes') }"
          >
            <span class="nav-label">Solicitantes</span>
            <span v-if="pendingSolicitantes > 0" class="badge">{{ pendingSolicitantes }}</span>
          </NuxtLink>
          <NuxtLink
            to="/admin/cartera"
            class="nav-item sub"
            :class="{ active: isActive('/admin/cartera') }"
          >
            <span class="nav-label">Cartera</span>
          </NuxtLink>
          <NuxtLink
            to="/admin/agenda"
            class="nav-item sub"
            :class="{ active: isActive('/admin/agenda') }"
          >
            <span class="nav-label">Agenda</span>
          </NuxtLink>
        </div>
      </div>

      <!-- 4. FINANZAS -->
      <div class="nav-group">
        <button
          class="nav-group-header"
          :class="{ active: isActiveGroup('finance') }"
          @click="collapsed ? openPopover('finance', $event) : toggleGroup('finance')"
        >
          <svg
            class="nav-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <line x1="12" y1="1" x2="12" y2="23" />
            <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
          </svg>
          <span v-if="!collapsed" class="nav-label">Finanzas</span>
          <svg
            v-if="!collapsed"
            class="nav-chevron"
            :class="{ open: openGroups.finance }"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
        <div v-if="!collapsed" v-show="openGroups.finance" class="nav-group-items">
          <NuxtLink
            to="/admin/balance"
            class="nav-item sub"
            :class="{ active: isActive('/admin/balance') }"
          >
            <span class="nav-label">Balance</span>
          </NuxtLink>
          <NuxtLink
            to="/admin/registro"
            class="nav-item sub"
            :class="{ active: isActive('/admin/registro') }"
          >
            <span class="nav-label">Registro</span>
          </NuxtLink>
          <NuxtLink
            to="/admin/historico"
            class="nav-item sub"
            :class="{ active: isActive('/admin/historico') }"
          >
            <span class="nav-label">Histórico</span>
          </NuxtLink>
          <NuxtLink
            to="/admin/utilidades"
            class="nav-item sub"
            :class="{ active: isActive('/admin/utilidades') }"
          >
            <span class="nav-label">Utilidades</span>
          </NuxtLink>
        </div>
      </div>

      <!-- 5. COMUNICACIÓN -->
      <div class="nav-group">
        <button
          class="nav-group-header"
          :class="{ 'has-badge': pendingComunicacion > 0, active: isActiveGroup('communication') }"
          @click="collapsed ? openPopover('communication', $event) : toggleGroup('communication')"
        >
          <svg
            class="nav-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
          </svg>
          <span v-if="!collapsed" class="nav-label">Comunicación</span>
          <span
            v-if="!collapsed && !openGroups.communication && pendingComunicacion > 0"
            class="badge"
            >{{ pendingComunicacion }}</span
          >
          <span v-if="collapsed && pendingComunicacion > 0" class="badge-dot" />
          <svg
            v-if="!collapsed"
            class="nav-chevron"
            :class="{ open: openGroups.communication }"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
        <div v-if="!collapsed" v-show="openGroups.communication" class="nav-group-items">
          <NuxtLink
            to="/admin/banner"
            class="nav-item sub"
            :class="{ active: isActive('/admin/banner') }"
          >
            <span class="nav-label">Banner</span>
          </NuxtLink>
          <NuxtLink
            to="/admin/noticias"
            class="nav-item sub"
            :class="{ active: isActive('/admin/noticias') }"
          >
            <span class="nav-label">Noticias</span>
          </NuxtLink>
          <NuxtLink
            to="/admin/comentarios"
            class="nav-item sub"
            :class="{ active: isActive('/admin/comentarios') }"
          >
            <span class="nav-label">Comentarios</span>
            <span v-if="pendingComentarios > 0" class="badge">{{ pendingComentarios }}</span>
          </NuxtLink>
        </div>
      </div>

      <!-- 6. COMUNIDAD -->
      <div class="nav-group">
        <button
          class="nav-group-header"
          :class="{ 'has-badge': pendingUsuarios > 0, active: isActiveGroup('users') }"
          @click="collapsed ? openPopover('users', $event) : toggleGroup('users')"
        >
          <svg
            class="nav-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
          </svg>
          <span v-if="!collapsed" class="nav-label">Comunidad</span>
          <span v-if="!collapsed && !openGroups.users && pendingUsuarios > 0" class="badge">{{
            pendingUsuarios
          }}</span>
          <span v-if="collapsed && pendingUsuarios > 0" class="badge-dot" />
          <svg
            v-if="!collapsed"
            class="nav-chevron"
            :class="{ open: openGroups.users }"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
        <div v-if="!collapsed" v-show="openGroups.users" class="nav-group-items">
          <NuxtLink
            to="/admin/usuarios"
            class="nav-item sub"
            :class="{ active: isActive('/admin/usuarios') }"
          >
            <span class="nav-label">Usuarios</span>
          </NuxtLink>
          <NuxtLink
            to="/admin/chats"
            class="nav-item sub"
            :class="{ active: isActive('/admin/chats') }"
          >
            <span class="nav-label">Chats</span>
            <span v-if="pendingChats > 0" class="badge">{{ pendingChats }}</span>
          </NuxtLink>
          <NuxtLink
            to="/admin/suscripciones"
            class="nav-item sub"
            :class="{ active: isActive('/admin/suscripciones') }"
          >
            <span class="nav-label">Suscripciones</span>
            <span v-if="pendingSuscripciones > 0" class="badge">{{ pendingSuscripciones }}</span>
          </NuxtLink>
        </div>
      </div>

      <!-- 7. INFRAESTRUCTURA -->
      <NuxtLink
        to="/admin/infraestructura"
        class="nav-item"
        :class="{ active: isActive('/admin/infraestructura') }"
      >
        <svg
          class="nav-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <rect x="2" y="2" width="20" height="8" rx="2" />
          <rect x="2" y="14" width="20" height="8" rx="2" />
          <line x1="6" y1="6" x2="6.01" y2="6" />
          <line x1="6" y1="18" x2="6.01" y2="18" />
        </svg>
        <span v-if="!collapsed" class="nav-label">Infraestructura</span>
        <span v-if="infraAlertCount > 0" class="badge-dot" />
      </NuxtLink>
    </nav>

    <!-- Popover for collapsed state -->
    <Teleport to="body">
      <Transition name="popover">
        <div
          v-if="popover.show"
          class="nav-popover"
          :style="{ top: popover.top + 'px', left: popover.left + 'px' }"
          @mouseleave="closePopover"
        >
          <div class="popover-title">{{ popover.title }}</div>
          <NuxtLink
            v-for="item in popover.items"
            :key="item.to"
            :to="item.to"
            class="popover-item"
            :class="{ active: isActive(item.to) }"
            @click="closePopover"
          >
            {{ item.label }}
            <span v-if="item.badge" class="badge">{{ item.badge }}</span>
          </NuxtLink>
        </div>
      </Transition>
    </Teleport>
  </aside>
</template>

<script setup lang="ts">
defineProps<{
  collapsed: boolean
  open: boolean
}>()

defineEmits<{
  'toggle-collapse': []
  close: []
}>()

const route = useRoute()
const supabase = useSupabaseClient()

// Dropdown state
const showDropdown = ref(false)

function toggleDropdown() {
  showDropdown.value = !showDropdown.value
}

// Close dropdown when clicking outside
onMounted(() => {
  const handleClickOutside = (e: MouseEvent) => {
    const target = e.target as HTMLElement
    if (!target.closest('.company-dropdown')) {
      showDropdown.value = false
    }
  }
  document.addEventListener('click', handleClickOutside)
  onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside)
  })
})

// Secciones abiertas/cerradas - Persiste durante la sesión con useState
const openGroups = useState('admin-sidebar-groups', () => ({
  config: false,
  catalog: true,
  finance: false,
  communication: false,
  users: false,
}))

// Contadores de acciones pendientes (se conectarán a Supabase)
const pendingAnunciantes = ref(0)
const pendingSolicitantes = ref(0)
const pendingComentarios = ref(0)
const pendingChats = ref(0)
const pendingSuscripciones = ref(0)
const infraAlertCount = ref(0)

// Totales por sección
const pendingCatalog = computed(() => pendingAnunciantes.value + pendingSolicitantes.value)
const pendingComunicacion = computed(() => pendingComentarios.value)
const pendingUsuarios = computed(() => pendingChats.value + pendingSuscripciones.value)

function toggleGroup(group: keyof typeof openGroups.value) {
  openGroups.value[group] = !openGroups.value[group]
}

function isActive(path: string, exact = false): boolean {
  if (exact) {
    return route.path === path
  }
  return route.path.startsWith(path)
}

// Check if any item in a group is active
function isActiveGroup(group: string): boolean {
  const groupPaths: Record<string, string[]> = {
    config: ['/admin/config'],
    catalog: [
      '/admin/productos',
      '/admin/anunciantes',
      '/admin/solicitantes',
      '/admin/cartera',
      '/admin/agenda',
    ],
    finance: ['/admin/balance', '/admin/registro', '/admin/historico', '/admin/utilidades'],
    communication: ['/admin/banner', '/admin/noticias', '/admin/comentarios'],
    users: ['/admin/usuarios', '/admin/chats', '/admin/suscripciones'],
  }
  return groupPaths[group]?.some((path) => route.path.startsWith(path)) || false
}

// Popover state for collapsed sidebar
const popover = ref({
  show: false,
  top: 0,
  left: 0,
  title: '',
  items: [] as Array<{ to: string; label: string; badge?: number }>,
})

const popoverData: Record<
  string,
  { title: string; items: Array<{ to: string; label: string; badgeRef?: string }> }
> = {
  config: {
    title: 'Configuración',
    items: [
      { to: '/admin/config/branding', label: 'Identidad' },
      { to: '/admin/config/navigation', label: 'Navegación' },
      { to: '/admin/config/homepage', label: 'Homepage' },
      { to: '/admin/config/catalog', label: 'Catálogo' },
      { to: '/admin/config/languages', label: 'Idiomas' },
      { to: '/admin/config/pricing', label: 'Precios' },
      { to: '/admin/config/integrations', label: 'Integraciones' },
      { to: '/admin/config/emails', label: 'Emails' },
      { to: '/admin/config/editorial', label: 'Editorial' },
      { to: '/admin/config/system', label: 'Sistema' },
    ],
  },
  catalog: {
    title: 'Catálogo',
    items: [
      { to: '/admin/productos', label: 'Productos' },
      { to: '/admin/anunciantes', label: 'Anunciantes', badgeRef: 'pendingAnunciantes' },
      { to: '/admin/solicitantes', label: 'Solicitantes', badgeRef: 'pendingSolicitantes' },
      { to: '/admin/cartera', label: 'Cartera' },
      { to: '/admin/agenda', label: 'Agenda' },
    ],
  },
  finance: {
    title: 'Finanzas',
    items: [
      { to: '/admin/balance', label: 'Balance' },
      { to: '/admin/registro', label: 'Registro' },
      { to: '/admin/historico', label: 'Histórico' },
      { to: '/admin/utilidades', label: 'Utilidades' },
    ],
  },
  communication: {
    title: 'Comunicación',
    items: [
      { to: '/admin/banner', label: 'Banner' },
      { to: '/admin/noticias', label: 'Noticias' },
      { to: '/admin/comentarios', label: 'Comentarios', badgeRef: 'pendingComentarios' },
    ],
  },
  users: {
    title: 'Comunidad',
    items: [
      { to: '/admin/usuarios', label: 'Usuarios' },
      { to: '/admin/chats', label: 'Chats', badgeRef: 'pendingChats' },
      { to: '/admin/suscripciones', label: 'Suscripciones', badgeRef: 'pendingSuscripciones' },
    ],
  },
}

const badgeRefs: Record<string, Ref<number>> = {
  pendingAnunciantes,
  pendingSolicitantes,
  pendingComentarios,
  pendingChats,
  pendingSuscripciones,
}

function openPopover(group: string, event: MouseEvent) {
  const data = popoverData[group]
  if (!data) return

  const target = event.currentTarget as HTMLElement
  const rect = target.getBoundingClientRect()

  popover.value = {
    show: true,
    top: rect.top,
    left: rect.right + 8,
    title: data.title,
    items: data.items.map((item) => ({
      to: item.to,
      label: item.label,
      badge: item.badgeRef ? badgeRefs[item.badgeRef]?.value : undefined,
    })),
  }
}

function closePopover() {
  popover.value.show = false
}

async function fetchInfraAlerts() {
  const { count } = await supabase
    .from('infra_alerts')
    .select('*', { count: 'exact', head: true })
    .is('acknowledged_at', null)
    .in('alert_level', ['critical', 'emergency'])
  infraAlertCount.value = count ?? 0
}

onMounted(() => {
  fetchInfraAlerts()
})

async function handleLogout() {
  showDropdown.value = false
  await supabase.auth.signOut()
  navigateTo('/')
}
</script>

<style scoped>
.admin-sidebar {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  width: var(--sidebar-width);
  background: var(--color-primary);
  color: var(--text-on-dark-primary);
  display: flex;
  flex-direction: column;
  z-index: var(--z-modal);
  transition:
    transform var(--transition-normal),
    width var(--transition-normal);
}

/* Mobile: off-canvas */
@media (max-width: 767px) {
  .admin-sidebar {
    transform: translateX(-100%);
  }

  .admin-sidebar.open {
    transform: translateX(0);
  }
}

/* Tablet+: fixed sidebar */
@media (min-width: 768px) {
  .admin-sidebar {
    transform: translateX(0);
  }

  .admin-sidebar.collapsed {
    width: 64px;
  }

  .close-btn-mobile {
    display: none;
  }
}

/* Header */
.sidebar-header {
  display: flex;
  flex-direction: column;
  padding: var(--spacing-3) var(--spacing-4);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  gap: var(--spacing-2);
}

.collapsed .sidebar-header {
  padding: var(--spacing-3) var(--spacing-2);
  align-items: center;
}

/* Header top row */
.header-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.collapsed .header-top {
  justify-content: center;
}

.collapsed .header-top .logo-icon {
  width: 36px;
  height: 36px;
}

.company-dropdown {
  position: relative;
  flex: 1;
  min-width: 0;
}

.company-btn {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  padding: var(--spacing-2);
  border-radius: var(--border-radius);
  color: var(--text-on-dark-primary);
  transition: background var(--transition-fast);
  width: 100%;
  text-align: left;
}

.company-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.logo-icon {
  width: 32px;
  height: 32px;
  background: var(--color-accent);
  color: var(--color-primary);
  border-radius: var(--border-radius);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: var(--font-weight-bold);
  font-size: var(--font-size-sm);
  flex-shrink: 0;
}

.company-name {
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-base);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dropdown-arrow {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  transition: transform var(--transition-fast);
}

.dropdown-open .dropdown-arrow {
  transform: rotate(180deg);
}

/* Dropdown menu */
.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: #1a3238;
  border-radius: var(--border-radius);
  margin-top: var(--spacing-1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  z-index: 10;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  padding: var(--spacing-3);
  color: var(--text-on-dark-secondary);
  width: 100%;
  text-align: left;
  transition: all var(--transition-fast);
}

.dropdown-item:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-on-dark-primary);
}

.dropdown-item svg {
  width: 18px;
  height: 18px;
}

/* Dropdown transitions */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* Header actions */
.header-actions {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
  width: 100%;
}

.collapsed .header-actions {
  align-items: center;
}

.header-btn {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  padding: var(--spacing-2) var(--spacing-3);
  border-radius: var(--border-radius);
  color: var(--text-on-dark-secondary);
  transition: all var(--transition-fast);
  text-decoration: none;
  font-size: var(--font-size-sm);
}

.header-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-on-dark-primary);
}

.header-btn svg {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.btn-label {
  white-space: nowrap;
}

.collapsed .header-btn {
  padding: var(--spacing-2);
  justify-content: center;
  width: 40px;
  height: 40px;
}

.close-btn-mobile {
  display: none;
  color: var(--text-on-dark-secondary);
  padding: var(--spacing-2);
}

@media (max-width: 767px) {
  .close-btn-mobile {
    display: flex;
  }

  .header-actions {
    display: none;
  }
}

/* Navigation */
.sidebar-nav {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-3);
}

.nav-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  padding: var(--spacing-3);
  border-radius: var(--border-radius);
  color: var(--text-on-dark-secondary);
  text-decoration: none;
  transition:
    background var(--transition-fast),
    color var(--transition-fast);
  min-height: 44px;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-on-dark-primary);
}

.nav-item.active {
  background: rgba(127, 209, 200, 0.2);
  color: var(--color-accent);
}

.nav-item.sub {
  padding-left: var(--spacing-8);
}

.collapsed .nav-item.sub {
  padding-left: var(--spacing-3);
  justify-content: center;
}

.nav-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.nav-label {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
}

.nav-abbr {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
}

/* Badge */
.badge {
  background: #ef4444;
  color: white;
  font-size: 11px;
  font-weight: var(--font-weight-bold);
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: auto;
}

/* Nav groups */
.nav-group {
  margin-bottom: var(--spacing-1);
}

.nav-group-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  width: 100%;
  padding: var(--spacing-3);
  border-radius: var(--border-radius);
  color: var(--text-on-dark-secondary);
  text-align: left;
  transition:
    background var(--transition-fast),
    color var(--transition-fast);
  min-height: 44px;
}

.nav-group-header:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-on-dark-primary);
}

.nav-chevron {
  width: 16px;
  height: 16px;
  margin-left: auto;
  transition: transform var(--transition-fast);
  flex-shrink: 0;
}

.nav-chevron.open {
  transform: rotate(180deg);
}

.nav-group-items {
  margin-top: var(--spacing-1);
}

/* Collapsed state styles */
.collapsed .nav-group-header {
  justify-content: center;
  position: relative;
}

.collapsed .nav-group-header .nav-icon {
  margin: 0;
}

.collapsed .sidebar-nav {
  overflow-y: visible;
}

/* Badge dot for collapsed state */
.badge-dot {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 8px;
  height: 8px;
  background: #ef4444;
  border-radius: 50%;
}

/* Active state for group headers */
.nav-group-header.active {
  background: rgba(127, 209, 200, 0.2);
  color: var(--color-accent);
}

/* Popover menu for collapsed state */
.nav-popover {
  position: fixed;
  background: var(--color-primary);
  border-radius: var(--border-radius);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  min-width: 180px;
  z-index: 9999;
  overflow: hidden;
}

.popover-title {
  padding: var(--spacing-3) var(--spacing-4);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--text-on-dark-secondary);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.popover-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-3) var(--spacing-4);
  color: var(--text-on-dark-primary);
  text-decoration: none;
  transition: background var(--transition-fast);
}

.popover-item:hover {
  background: rgba(255, 255, 255, 0.1);
}

.popover-item.active {
  background: rgba(127, 209, 200, 0.2);
  color: var(--color-accent);
}

.popover-item .badge {
  margin-left: var(--spacing-2);
}

/* Popover transitions */
.popover-enter-active,
.popover-leave-active {
  transition: all 0.15s ease;
}

.popover-enter-from,
.popover-leave-to {
  opacity: 0;
  transform: translateX(-8px);
}
</style>

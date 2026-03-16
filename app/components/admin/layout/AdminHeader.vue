<template>
  <header class="admin-header">
    <!-- Mobile: hamburger + title -->
    <div class="header-left">
      <button
        class="hamburger-btn"
        :aria-label="$t('admin.header.openSidebar')"
        @click="$emit('toggle-sidebar')"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      <!-- Desktop: collapse toggle -->
      <button
        class="collapse-btn"
        :aria-label="$t('admin.header.collapseSidebar')"
        @click="$emit('toggle-collapse')"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      <!-- Breadcrumb -->
      <nav class="breadcrumb">
        <NuxtLink to="/admin" class="breadcrumb-item">Admin</NuxtLink>
        <span v-if="currentSection" class="breadcrumb-separator">/</span>
        <span v-if="currentSection" class="breadcrumb-item current">{{ currentSection }}</span>
      </nav>
    </div>

    <!-- Right side: vertical selector + user info -->
    <div class="header-right">
      <!-- Vertical selector (#250) -->
      <div v-if="verticals.length > 1" class="vertical-selector">
        <select
          :value="currentVertical"
          class="vertical-select"
          :aria-label="$t('admin.header.selectVertical')"
          @change="switchVertical(($event.target as HTMLSelectElement).value)"
        >
          <option v-for="v in verticals" :key="v.slug" :value="v.slug">
            {{ v.name }}
          </option>
        </select>
      </div>

      <NuxtLink to="/" class="view-site-btn" target="_blank">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
          <path d="M15 3h6v6" />
          <path d="M10 14L21 3" />
        </svg>
        <span class="view-site-label">{{ $t('admin.header.viewSite') }}</span>
      </NuxtLink>

      <div class="user-menu">
        <button class="user-btn" @click="menuOpen = !menuOpen">
          <div class="user-avatar">
            {{ userInitials }}
          </div>
          <span class="user-name">{{ userName }}</span>
          <svg
            class="user-chevron"
            :class="{ open: menuOpen }"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>

        <div v-if="menuOpen" class="user-dropdown">
          <div class="dropdown-header">
            <span class="dropdown-email">{{ userEmail }}</span>
          </div>
          <button class="dropdown-item" @click="handleLogout">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
              <path d="M16 17l5-5-5-5" />
              <path d="M21 12H9" />
            </svg>
            {{ $t('nav.logout') }}
          </button>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
defineEmits<{
  'toggle-sidebar': []
  'toggle-collapse': []
}>()

const { t } = useI18n()
const route = useRoute()
const user = useSupabaseUser()
const supabase = useSupabaseClient()

const menuOpen = ref(false)

// Vertical selector (#250)
const currentVertical = getVerticalSlug()
const verticals = ref<{ slug: string; name: string }[]>([])

async function loadVerticals() {
  const { data } = await supabase.from('vertical_config').select('vertical, name').order('vertical')
  if (data) {
    verticals.value = (
      data as unknown as { vertical: string; name: Record<string, string> | null }[]
    ).map((v) => ({
      slug: v.vertical,
      name: v.name?.es || v.name?.en || v.vertical,
    }))
  }
}

function switchVertical(slug: string) {
  // In multi-vertical, this would change the context.
  // For now, store preference and reload.
  if (globalThis.window !== undefined) {
    localStorage.setItem('admin_vertical', slug)
    globalThis.location.reload()
  }
}

onMounted(() => {
  void loadVerticals()
})

// Close menu on click outside
onMounted(() => {
  const handleClickOutside = (e: MouseEvent) => {
    const target = e.target as HTMLElement
    if (!target.closest('.user-menu')) {
      menuOpen.value = false
    }
  }
  document.addEventListener('click', handleClickOutside)
  onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside)
  })
})

// User info
const userName = computed(() => {
  if (!user.value) return 'Admin'
  return user.value.user_metadata?.name || user.value.email?.split('@')[0] || 'Admin'
})

const userEmail = computed(() => user.value?.email || '')

const userInitials = computed(() => {
  const name = userName.value
  if (!name) return 'A'
  const parts = name.split(' ')
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
})

// Current section for breadcrumb
const currentSection = computed(() => {
  const path = route.path
  const sections: Record<string, string> = {
    '/admin/vehiculos': t('admin.header.breadcrumbs.vehiculos'),
    '/admin/intermediacion': t('admin.header.breadcrumbs.intermediacion'),
    '/admin/ojeados': t('admin.header.breadcrumbs.ojeados'),
    '/admin/historico': t('admin.header.breadcrumbs.historico'),
    '/admin/config/tipos': t('admin.header.breadcrumbs.tipos'),
    '/admin/config/filtros': t('admin.header.breadcrumbs.filtros'),
    '/admin/config/banner': t('admin.header.breadcrumbs.banner'),
    '/admin/anunciantes': t('admin.header.breadcrumbs.anunciantes'),
    '/admin/solicitantes': t('admin.header.breadcrumbs.solicitantes'),
    '/admin/usuarios': t('admin.header.breadcrumbs.usuarios'),
    '/admin/agenda': t('admin.header.breadcrumbs.agenda'),
    '/admin/chat': t('admin.header.breadcrumbs.chat'),
    '/admin/suscripciones': t('admin.header.breadcrumbs.suscripciones'),
    '/admin/noticias': t('admin.header.breadcrumbs.noticias'),
    '/admin/comentarios': t('admin.header.breadcrumbs.comentarios'),
    '/admin/balance': t('admin.header.breadcrumbs.balance'),
    '/admin/design-system': t('admin.nav.designSystem'),
  }

  for (const [prefix, name] of Object.entries(sections)) {
    if (path.startsWith(prefix)) return name
  }

  if (path === '/admin') return ''
  return ''
})

async function handleLogout() {
  await supabase.auth.signOut()
  navigateTo('/')
}
</script>

<style scoped>
.admin-header {
  position: fixed;
  top: 0;
  right: 0;
  left: 0;
  min-height: 3.5rem;
  background: var(--bg-primary);
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--spacing-4);
  z-index: var(--z-header);
}

@media (min-width: 48em) {
  .admin-header {
    left: var(--sidebar-width);
    min-height: 3.75rem;
    transition: left var(--transition-normal);
  }

  .sidebar-collapsed .admin-header {
    left: 4rem;
  }
}

/* Left side */
.header-left {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
}

.hamburger-btn {
  color: var(--text-secondary);
  padding: var(--spacing-2);
}

.collapse-btn {
  display: none;
  color: var(--text-secondary);
  padding: var(--spacing-2);
}

@media (min-width: 48em) {
  .hamburger-btn {
    display: none;
  }

  .collapse-btn {
    display: flex;
  }
}

/* Breadcrumb */
.breadcrumb {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  font-size: var(--font-size-sm);
}

.breadcrumb-item {
  color: var(--text-auxiliary);
  text-decoration: none;
}

.breadcrumb-item:hover {
  color: var(--text-primary);
}

.breadcrumb-item.current {
  color: var(--text-primary);
  font-weight: var(--font-weight-medium);
}

.breadcrumb-separator {
  color: var(--text-auxiliary);
}

/* Vertical selector */
.vertical-selector {
  display: flex;
  align-items: center;
}

.vertical-select {
  appearance: none;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-1) var(--spacing-6) var(--spacing-1) var(--spacing-2);
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  cursor: pointer;
  background-image: url("data:image/svg+xml,%3Csvg width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.5rem center;
}

/* Right side */
.header-right {
  display: flex;
  align-items: center;
  gap: var(--spacing-4);
}

.view-site-btn {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  padding: var(--spacing-2) var(--spacing-3);
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
  border-radius: var(--border-radius);
  transition: background var(--transition-fast);
  min-height: auto;
}

.view-site-btn:hover {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.view-site-label {
  display: none;
}

@media (min-width: 48em) {
  .view-site-label {
    display: inline;
  }
}

/* User menu */
.user-menu {
  position: relative;
}

.user-btn {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  padding: var(--spacing-2);
  border-radius: var(--border-radius);
  transition: background var(--transition-fast);
  min-height: auto;
}

.user-btn:hover {
  background: var(--bg-secondary);
}

.user-avatar {
  width: 2rem;
  height: 2rem;
  background: var(--color-primary);
  color: var(--color-white);
  border-radius: var(--border-radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
}

.user-name {
  display: none;
  font-size: var(--font-size-sm);
  color: var(--text-primary);
}

@media (min-width: 48em) {
  .user-name {
    display: inline;
  }
}

.user-chevron {
  color: var(--text-auxiliary);
  transition: transform var(--transition-fast);
}

.user-chevron.open {
  transform: rotate(180deg);
}

/* Dropdown */
.user-dropdown {
  position: absolute;
  top: calc(100% + var(--spacing-2));
  right: 0;
  min-width: 12.5rem;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  box-shadow: var(--shadow-lg);
  overflow: hidden;
  z-index: var(--z-dropdown);
}

.dropdown-header {
  padding: var(--spacing-3) var(--spacing-4);
  border-bottom: 1px solid var(--border-color);
}

.dropdown-email {
  font-size: var(--font-size-sm);
  color: var(--text-auxiliary);
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  width: 100%;
  padding: var(--spacing-3) var(--spacing-4);
  color: var(--text-primary);
  font-size: var(--font-size-sm);
  text-align: left;
  transition: background var(--transition-fast);
  min-height: 2.75rem;
}

.dropdown-item:hover {
  background: var(--bg-secondary);
}

.dropdown-item svg {
  color: var(--text-auxiliary);
}
</style>

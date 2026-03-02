<template>
  <header class="admin-header">
    <!-- Mobile: hamburger + title -->
    <div class="header-left">
      <button class="hamburger-btn" @click="$emit('toggle-sidebar')">
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
      <button class="collapse-btn" @click="$emit('toggle-collapse')">
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

    <!-- Right side: user info -->
    <div class="header-right">
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
        <span class="view-site-label">Ver sitio</span>
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
            Cerrar sesión
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

const route = useRoute()
const user = useSupabaseUser()
const supabase = useSupabaseClient()

const menuOpen = ref(false)

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
    '/admin/vehiculos': 'Vehículos',
    '/admin/intermediacion': 'Intermediación',
    '/admin/ojeados': 'Ojeados',
    '/admin/historico': 'Histórico',
    '/admin/config/tipos': 'Tipos',
    '/admin/config/filtros': 'Filtros',
    '/admin/config/banner': 'Banner',
    '/admin/anunciantes': 'Anunciantes',
    '/admin/solicitantes': 'Solicitantes',
    '/admin/usuarios': 'Usuarios',
    '/admin/agenda': 'Agenda',
    '/admin/chat': 'Chat',
    '/admin/suscripciones': 'Suscripciones',
    '/admin/noticias': 'Noticias',
    '/admin/comentarios': 'Comentarios',
    '/admin/balance': 'Balance',
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
  min-height: 56px;
  background: var(--bg-primary);
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--spacing-4);
  z-index: var(--z-header);
}

@media (min-width: 768px) {
  .admin-header {
    left: var(--sidebar-width);
    min-height: 60px;
    transition: left var(--transition-normal);
  }

  .sidebar-collapsed .admin-header {
    left: 64px;
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

@media (min-width: 768px) {
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

@media (min-width: 768px) {
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
  width: 32px;
  height: 32px;
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

@media (min-width: 768px) {
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
  min-width: 200px;
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
  min-height: 44px;
}

.dropdown-item:hover {
  background: var(--bg-secondary);
}

.dropdown-item svg {
  color: var(--text-auxiliary);
}
</style>

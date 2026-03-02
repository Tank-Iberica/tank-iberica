<script setup lang="ts">
import { useAdminSidebar } from '~/composables/admin/useAdminSidebar'

defineProps<{
  collapsed: boolean
  open: boolean
}>()

defineEmits<{
  'toggle-collapse': []
  close: []
}>()

const {
  showDropdown,
  toggleDropdown,
  openGroups,
  toggleGroup,
  pendingCatalog,
  pendingComunicacion,
  pendingUsuarios,
  infraAlertCount,
  isActive,
  isActiveGroup,
  configItems,
  catalogItems,
  financeItems,
  communicationItems,
  usersItems,
  popover,
  openPopover,
  closePopover,
  handleLogout,
} = useAdminSidebar()

function onConfigPopover(e: MouseEvent) {
  openPopover('config', e)
}
function onCatalogPopover(e: MouseEvent) {
  openPopover('catalog', e)
}
function onFinancePopover(e: MouseEvent) {
  openPopover('finance', e)
}
function onCommunicationPopover(e: MouseEvent) {
  openPopover('communication', e)
}
function onUsersPopover(e: MouseEvent) {
  openPopover('users', e)
}
</script>

<template>
  <aside class="admin-sidebar" :class="{ collapsed, open }">
    <!-- Header -->
    <div class="sidebar-header">
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

        <span v-else class="logo-icon">TI</span>

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

      <div class="header-actions">
        <a href="/" target="_blank" class="header-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
          <span v-if="!collapsed" class="btn-label">Abrir sitio</span>
        </a>
        <button class="header-btn" @click="$emit('toggle-collapse')">
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
      <!-- Dashboard -->
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

      <!-- Métricas -->
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

      <!-- Configuración -->
      <AdminLayoutAdminSidebarNavGroup
        label="Configuración"
        :collapsed="collapsed"
        :is-open="openGroups.config"
        :badge="0"
        :is-active-group="isActiveGroup('config')"
        :items="configItems"
        :is-active-fn="isActive"
        @toggle="toggleGroup('config')"
        @open-popover="onConfigPopover"
      >
        <template #icon>
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
        </template>
      </AdminLayoutAdminSidebarNavGroup>

      <!-- Catálogo -->
      <AdminLayoutAdminSidebarNavGroup
        label="Catálogo"
        :collapsed="collapsed"
        :is-open="openGroups.catalog"
        :badge="pendingCatalog"
        :is-active-group="isActiveGroup('catalog')"
        :items="catalogItems"
        :is-active-fn="isActive"
        @toggle="toggleGroup('catalog')"
        @open-popover="onCatalogPopover"
      >
        <template #icon>
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
        </template>
      </AdminLayoutAdminSidebarNavGroup>

      <!-- Finanzas -->
      <AdminLayoutAdminSidebarNavGroup
        label="Finanzas"
        :collapsed="collapsed"
        :is-open="openGroups.finance"
        :badge="0"
        :is-active-group="isActiveGroup('finance')"
        :items="financeItems"
        :is-active-fn="isActive"
        @toggle="toggleGroup('finance')"
        @open-popover="onFinancePopover"
      >
        <template #icon>
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
        </template>
      </AdminLayoutAdminSidebarNavGroup>

      <!-- Comunicación -->
      <AdminLayoutAdminSidebarNavGroup
        label="Comunicación"
        :collapsed="collapsed"
        :is-open="openGroups.communication"
        :badge="pendingComunicacion"
        :is-active-group="isActiveGroup('communication')"
        :items="communicationItems"
        :is-active-fn="isActive"
        @toggle="toggleGroup('communication')"
        @open-popover="onCommunicationPopover"
      >
        <template #icon>
          <svg
            class="nav-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
          </svg>
        </template>
      </AdminLayoutAdminSidebarNavGroup>

      <!-- Comunidad -->
      <AdminLayoutAdminSidebarNavGroup
        label="Comunidad"
        :collapsed="collapsed"
        :is-open="openGroups.users"
        :badge="pendingUsuarios"
        :is-active-group="isActiveGroup('users')"
        :items="usersItems"
        :is-active-fn="isActive"
        @toggle="toggleGroup('users')"
        @open-popover="onUsersPopover"
      >
        <template #icon>
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
        </template>
      </AdminLayoutAdminSidebarNavGroup>

      <!-- Infraestructura -->
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

    <!-- Popover (collapsed sidebar) -->
    <AdminLayoutAdminSidebarPopover
      :popover="popover"
      :is-active-fn="isActive"
      @close="closePopover"
    />
  </aside>
</template>

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

.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: var(--color-primary-dark);
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

.collapsed .sidebar-nav {
  overflow-y: visible;
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

.badge-dot {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 8px;
  height: 8px;
  background: var(--color-error);
  border-radius: 50%;
}
</style>

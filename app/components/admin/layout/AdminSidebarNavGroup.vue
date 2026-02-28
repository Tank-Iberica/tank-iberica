<script setup lang="ts">
import type { SidebarNavItem } from '~/composables/admin/useAdminSidebar'

defineProps<{
  label: string
  collapsed: boolean
  isOpen: boolean
  badge: number
  isActiveGroup: boolean
  items: SidebarNavItem[]
  isActiveFn: (path: string) => boolean
}>()

defineEmits<{
  toggle: []
  openPopover: [event: MouseEvent]
}>()
</script>

<template>
  <div class="nav-group">
    <button
      class="nav-group-header"
      :class="{ 'has-badge': badge > 0, active: isActiveGroup }"
      @click="collapsed ? $emit('openPopover', $event) : $emit('toggle')"
    >
      <slot name="icon" />
      <span v-if="!collapsed" class="nav-label">{{ label }}</span>
      <span v-if="!collapsed && !isOpen && badge > 0" class="badge">{{ badge }}</span>
      <span v-if="collapsed && badge > 0" class="badge-dot" />
      <svg
        v-if="!collapsed"
        class="nav-chevron"
        :class="{ open: isOpen }"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <path d="M6 9l6 6 6-6" />
      </svg>
    </button>
    <div v-if="!collapsed" v-show="isOpen" class="nav-group-items">
      <NuxtLink
        v-for="item in items"
        :key="item.to"
        :to="item.to"
        class="nav-item sub"
        :class="{ active: isActiveFn(item.to) }"
      >
        <span class="nav-label">{{ item.label }}</span>
        <span v-if="item.badge" class="badge">{{ item.badge }}</span>
      </NuxtLink>
    </div>
  </div>
</template>

<style scoped>
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

.nav-group-header.active {
  background: rgba(127, 209, 200, 0.2);
  color: var(--color-accent);
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

/* Collapsed state */
.nav-group-header:has(.nav-label:not([class])) {
  /* fallback — no-op, collapsed handles via parent class */
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

/* Badge dot for collapsed */
.badge-dot {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 8px;
  height: 8px;
  background: #ef4444;
  border-radius: 50%;
}

/* Nav items */
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

.nav-label {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
}
</style>

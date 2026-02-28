<script setup lang="ts">
import type { SidebarNavItem } from '~/composables/admin/useAdminSidebar'

defineProps<{
  popover: {
    show: boolean
    top: number
    left: number
    title: string
    items: SidebarNavItem[]
  }
  isActiveFn: (path: string) => boolean
}>()

defineEmits<{
  close: []
}>()
</script>

<template>
  <Teleport to="body">
    <Transition name="popover">
      <div
        v-if="popover.show"
        class="nav-popover"
        :style="{ top: popover.top + 'px', left: popover.left + 'px' }"
        @mouseleave="$emit('close')"
      >
        <div class="popover-title">{{ popover.title }}</div>
        <NuxtLink
          v-for="item in popover.items"
          :key="item.to"
          :to="item.to"
          class="popover-item"
          :class="{ active: isActiveFn(item.to) }"
          @click="$emit('close')"
        >
          {{ item.label }}
          <span v-if="item.badge" class="badge">{{ item.badge }}</span>
        </NuxtLink>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
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

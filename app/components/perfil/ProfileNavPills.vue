<template>
  <nav class="profile-nav" :aria-label="$t('profile.nav.label')">
    <ul class="profile-nav__list" role="tablist">
      <li v-for="item in navItems" :key="item.to" role="none">
        <NuxtLink
          :to="item.to"
          class="profile-nav__pill"
          :aria-current="isActive(item.to) ? 'page' : undefined"
        >
          {{ $t(item.labelKey) }}
        </NuxtLink>
      </li>
    </ul>
  </nav>
</template>

<script setup lang="ts">
const route = useRoute()

const navItems = [
  { to: '/perfil', labelKey: 'profile.nav.overview' },
  { to: '/perfil/datos', labelKey: 'profile.nav.data' },
  { to: '/perfil/favoritos', labelKey: 'profile.nav.favorites' },
  { to: '/perfil/alertas', labelKey: 'profile.nav.alerts' },
  { to: '/perfil/mensajes', labelKey: 'profile.nav.messages' },
  { to: '/perfil/reservas', labelKey: 'profile.nav.reservations' },
  { to: '/perfil/suscripcion', labelKey: 'profile.nav.subscription' },
  { to: '/perfil/seguridad', labelKey: 'profile.nav.security' },
]

function isActive(to: string) {
  if (to === '/perfil') return route.path === '/perfil'
  return route.path.startsWith(to)
}
</script>

<style scoped>
.profile-nav {
  border-bottom: 1px solid var(--border-color-light);
  margin-bottom: var(--spacing-6);
}

.profile-nav__list {
  display: flex;
  gap: var(--spacing-1);
  overflow-x: auto;
  padding-bottom: 1px;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
  list-style: none;
  margin: 0;
  padding-left: 0;
}

.profile-nav__list::-webkit-scrollbar {
  display: none;
}

.profile-nav__pill {
  display: inline-block;
  padding: var(--spacing-2) var(--spacing-3);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-secondary);
  text-decoration: none;
  white-space: nowrap;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  transition: color var(--transition-fast), border-color var(--transition-fast);
}

.profile-nav__pill:hover {
  color: var(--text-primary);
}

.profile-nav__pill[aria-current="page"] {
  color: var(--color-primary);
  border-bottom-color: var(--color-primary);
  font-weight: var(--font-weight-semibold);
}

@media (min-width: 48em) {
  .profile-nav__pill {
    padding: var(--spacing-2) var(--spacing-4);
  }
}
</style>

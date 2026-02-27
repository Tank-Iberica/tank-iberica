<template>
  <div class="collapsible-sections">
    <!-- PRODUCTOS -->
    <div class="collapsible-section" :class="{ open: localSections.products }">
      <button class="collapsible-header" @click="localSections.products = !localSections.products">
        <span class="collapsible-icon">&#x1F69B;</span>
        <span class="collapsible-title">Productos</span>
        <span class="collapsible-summary"
          >{{ productStats.total }} total &middot; {{ productStats.published }} publicados</span
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
      <div v-show="localSections.products" class="collapsible-content">
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
          <h4 class="breakdown-title">Por categoria</h4>
          <div class="breakdown-items">
            <div v-for="cat in productStats.byCategory" :key="cat.name" class="breakdown-item">
              <span class="breakdown-label">{{ cat.name }}</span>
              <span class="breakdown-value">{{ cat.count }}</span>
            </div>
            <div v-if="productStats.byCategory.length === 0" class="breakdown-empty">Sin datos</div>
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
    <div class="collapsible-section" :class="{ open: localSections.users }">
      <button class="collapsible-header" @click="localSections.users = !localSections.users">
        <span class="collapsible-icon">&#x1F465;</span>
        <span class="collapsible-title">Comunidad</span>
        <span class="collapsible-summary"
          >{{ userStats.registered }} registrados &middot; {{ userStats.visits }} visitas</span
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
      <div v-show="localSections.users" class="collapsible-content">
        <div class="stats-cards">
          <div class="mini-stat">
            <span class="mini-stat-value">{{ userStats.visits }}</span>
            <span class="mini-stat-label">Visitas</span>
          </div>
          <div class="mini-stat">
            <span class="mini-stat-value">{{ userStats.uniqueVisits }}</span>
            <span class="mini-stat-label">Visitas unicas</span>
          </div>
          <div class="mini-stat highlight">
            <span class="mini-stat-value">{{ userStats.registered }}</span>
            <span class="mini-stat-label">Registrados</span>
          </div>
        </div>

        <div class="user-stats-grid">
          <div class="user-stat-item">
            <span class="user-stat-icon">&#x1F6D2;</span>
            <span class="user-stat-value">{{ userStats.buyers }}</span>
            <span class="user-stat-label">Compradores</span>
          </div>
          <div class="user-stat-item">
            <span class="user-stat-icon">&#x1F511;</span>
            <span class="user-stat-value">{{ userStats.renters }}</span>
            <span class="user-stat-label">Arrendatarios</span>
          </div>
          <div class="user-stat-item">
            <span class="user-stat-icon">&#x1F4DD;</span>
            <span class="user-stat-value">{{ userStats.requests }}</span>
            <span class="user-stat-label">Solicitudes</span>
          </div>
          <div class="user-stat-item">
            <span class="user-stat-icon">&#x1F4E2;</span>
            <span class="user-stat-value">{{ userStats.advertisers }}</span>
            <span class="user-stat-label">Anunciantes</span>
          </div>
          <div class="user-stat-item">
            <span class="user-stat-icon">&#x1F441;&#xFE0F;</span>
            <span class="user-stat-value">{{ userStats.newsVisits }}</span>
            <span class="user-stat-label">Visitas noticias</span>
          </div>
          <div class="user-stat-item">
            <span class="user-stat-icon">&#x1F4AC;</span>
            <span class="user-stat-value">{{ userStats.newsComments }}</span>
            <span class="user-stat-label">Comentarios</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ProductStats, UserStats } from '~/composables/admin/useAdminDashboard'

const props = defineProps<{
  productStats: ProductStats
  userStats: UserStats
  sectionsOpen: { products: boolean; users: boolean }
}>()

// Local copy of sections open state to avoid mutating props
const localSections = ref({
  products: props.sectionsOpen.products,
  users: props.sectionsOpen.users,
})

// Sync from parent if parent changes
watch(
  () => props.sectionsOpen,
  (val) => {
    localSections.value.products = val.products
    localSections.value.users = val.users
  },
  { deep: true },
)
</script>

<style scoped>
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

/* Stats cards */
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
</style>

<script setup lang="ts">
import type { CategoryOption } from '~/composables/dashboard/useDashboardWidget'

defineProps<{
  vehicleCount: number
  theme: 'light' | 'dark'
  categories: CategoryOption[]
  selectedCategory: string
  widgetWidth: string
  widgetHeight: string
  useAutoHeight: boolean
  countOptions: number[]
}>()

const emit = defineEmits<{
  (e: 'set-category' | 'set-width' | 'set-height', value: string): void
  (e: 'set-count', value: number): void
  (e: 'set-theme', value: 'light' | 'dark'): void
  (e: 'toggle-auto-height', value: boolean): void
}>()

const { t } = useI18n()
</script>

<template>
  <section class="card config-card">
    <h2 class="card-title">{{ t('dashboard.widget.configTitle') }}</h2>

    <!-- Vehicle count -->
    <div class="form-group">
      <label class="form-label">{{ t('dashboard.widget.vehicleCount') }}</label>
      <div class="count-options">
        <button
          v-for="count in countOptions"
          :key="count"
          class="count-btn"
          :class="{ active: vehicleCount === count }"
          @click="emit('set-count', count)"
        >
          {{ count }}
        </button>
      </div>
    </div>

    <!-- Theme -->
    <div class="form-group">
      <label class="form-label">{{ t('dashboard.widget.theme') }}</label>
      <div class="theme-options">
        <button
          class="theme-btn theme-light"
          :class="{ active: theme === 'light' }"
          @click="emit('set-theme', 'light')"
        >
          {{ t('dashboard.widget.themeLight') }}
        </button>
        <button
          class="theme-btn theme-dark"
          :class="{ active: theme === 'dark' }"
          @click="emit('set-theme', 'dark')"
        >
          {{ t('dashboard.widget.themeDark') }}
        </button>
      </div>
    </div>

    <!-- Category filter -->
    <div class="form-group">
      <label class="form-label">{{ t('dashboard.widget.categoryFilter') }}</label>
      <select
        class="form-select"
        :value="selectedCategory"
        @change="emit('set-category', ($event.target as HTMLSelectElement).value)"
      >
        <option value="">{{ t('dashboard.widget.allCategories') }}</option>
        <option v-for="cat in categories" :key="cat.id" :value="cat.slug">
          {{ cat.name_es }}
        </option>
      </select>
    </div>

    <!-- Width -->
    <div class="form-group">
      <label class="form-label">{{ t('dashboard.widget.width') }}</label>
      <input
        type="text"
        class="form-input"
        :value="widgetWidth"
        placeholder="100%"
        @input="emit('set-width', ($event.target as HTMLInputElement).value)"
      >
    </div>

    <!-- Height -->
    <div class="form-group">
      <label class="form-label">{{ t('dashboard.widget.height') }}</label>
      <div class="height-controls">
        <label class="checkbox-label">
          <input
            type="checkbox"
            class="form-checkbox"
            :checked="useAutoHeight"
            @change="emit('toggle-auto-height', ($event.target as HTMLInputElement).checked)"
          >
          <span>{{ t('dashboard.widget.autoHeight') }}</span>
        </label>
        <input
          v-if="!useAutoHeight"
          type="text"
          class="form-input"
          :value="widgetHeight"
          placeholder="600"
          @input="emit('set-height', ($event.target as HTMLInputElement).value)"
        >
      </div>
    </div>
  </section>
</template>

<style scoped>
.card {
  background: var(--bg-primary);
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  padding: 20px;
}

.card-title {
  margin: 0 0 16px 0;
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--text-primary);
}

.form-group {
  margin-bottom: 20px;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-label {
  display: block;
  font-size: 0.9rem;
  font-weight: 600;
  color: #334155;
  margin-bottom: 8px;
}

.form-select,
.form-input {
  width: 100%;
  min-height: 44px;
  padding: 10px 12px;
  border: 1px solid var(--color-gray-200);
  border-radius: 8px;
  font-size: 0.95rem;
  color: var(--text-primary);
  background: var(--bg-primary);
  box-sizing: border-box;
}

.form-select:focus,
.form-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(35, 66, 74, 0.15);
}

.count-options {
  display: flex;
  gap: 8px;
}

.count-btn {
  min-width: 44px;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 16px;
  border: 2px solid var(--color-gray-200);
  border-radius: 8px;
  background: var(--bg-primary);
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-secondary);
  cursor: pointer;
  transition:
    border-color 0.2s,
    background 0.2s;
}

.count-btn:hover {
  border-color: var(--color-gray-300);
}

.count-btn.active {
  border-color: var(--color-primary);
  background: var(--color-primary);
  color: white;
}

.theme-options {
  display: flex;
  gap: 8px;
}

.theme-btn {
  flex: 1;
  min-height: 44px;
  padding: 10px 16px;
  border: 2px solid var(--color-gray-200);
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: border-color 0.2s;
}

.theme-btn.theme-light {
  background: var(--bg-primary);
  color: var(--text-primary);
}

.theme-btn.theme-dark {
  background: var(--color-gray-800);
  color: var(--color-gray-100);
}

.theme-btn.active {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(35, 66, 74, 0.2);
}

.height-controls {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 44px;
  cursor: pointer;
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.form-checkbox {
  width: 20px;
  height: 20px;
  accent-color: var(--color-primary);
  cursor: pointer;
}
</style>

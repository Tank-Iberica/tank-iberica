<script setup lang="ts">
interface ColumnGroup {
  id: string
  name: string
  icon: string
  columns: string[]
  active: boolean
  required?: boolean
}

defineProps<{
  columnGroups: ColumnGroup[]
  driveConnected: boolean
  driveLoading: boolean
  selectedCount: number
  isFullscreen: boolean
}>()

const emit = defineEmits<{
  'toggle-group': [groupId: string]
  'connect-drive': []
  'open-config': []
  'open-export': []
  'toggle-fullscreen': []
}>()
</script>

<template>
  <div class="toolbar-section">
    <!-- Column Toggles -->
    <div class="column-toggles">
      <span class="toggles-label">Columnas:</span>
      <button
        v-for="group in columnGroups.filter((g) => !g.required)"
        :key="group.id"
        class="column-toggle"
        :class="{ active: group.active }"
        @click="emit('toggle-group', group.id)"
      >
        {{ group.name }}
      </button>
    </div>

    <!-- Actions -->
    <div class="toolbar-actions">
      <button
        class="btn-tool"
        :class="{ 'drive-on': driveConnected }"
        :disabled="driveLoading"
        @click="driveConnected ? undefined : emit('connect-drive')"
      >
        {{ driveConnected ? '🟢 Drive' : '🔗 Drive' }}
      </button>
      <button class="btn-tool" title="Configurar tabla" @click="emit('open-config')">
        ⚙️ Configurar
      </button>
      <button class="btn-tool" title="Exportar" @click="emit('open-export')">
        📥 Exportar
        <span v-if="selectedCount > 0" class="badge">{{ selectedCount }}</span>
      </button>
      <button
        class="btn-tool"
        :title="isFullscreen ? 'Salir' : 'Pantalla completa'"
        @click="emit('toggle-fullscreen')"
      >
        {{ isFullscreen ? '✕' : '⛶' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.toolbar-section {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--color-gray-200);
}

.column-toggles {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  flex: 1;
}

.toggles-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-auxiliary);
}

.column-toggle {
  padding: 6px 12px;
  border: 1px solid var(--color-gray-200);
  background: var(--bg-primary);
  color: var(--text-auxiliary);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s;
}

.column-toggle:hover {
  border-color: var(--color-gray-300);
}

.column-toggle.active {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.toolbar-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.btn-tool {
  padding: 8px 12px;
  border: 1px solid var(--color-gray-200);
  background: var(--bg-primary);
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s;
  position: relative;
  white-space: nowrap;
}

.btn-tool:hover:not(:disabled) {
  background: var(--bg-secondary);
  border-color: var(--color-gray-300);
}

.btn-tool:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-tool.drive-on {
  background: var(--color-success-bg, #dcfce7);
  border-color: #86efac;
  color: var(--color-success);
}

.badge {
  background: var(--color-error);
  color: white;
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 10px;
  margin-left: 4px;
}
</style>

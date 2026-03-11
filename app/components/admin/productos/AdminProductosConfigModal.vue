<script setup lang="ts">
interface ColumnDef {
  key: string
  label: string
  width?: string
  sortable?: boolean
  group?: string
}

interface ColumnGroup {
  id: string
  name: string
  icon: string
  columns: string[]
  active: boolean
  required?: boolean
}

const props = defineProps<{
  show: boolean
  columnGroups: ColumnGroup[]
  columnOrder: string[]
  allColumns: ColumnDef[]
  availableColumnsForGroups: ColumnDef[]
  draggedColumn: string | null
}>()

const emit = defineEmits<{
  'update:columnGroups': [groups: ColumnGroup[]]
  'update:columnOrder': [order: string[]]
  'drag-start': [key: string]
  'drag-over': [event: DragEvent, targetKey: string]
  'drag-end': []
  'start-edit-group': [group: ColumnGroup]
  'cancel-edit-group': []
  'save-edit-group': []
  'toggle-column-in-edit': [colKey: string]
  'create-group': [name: string, columns: string[]]
  'delete-group': [groupId: string]
  'reset-config': []
  close: []
}>()

const configTab = ref<'grupos' | 'ordenar'>('grupos')
const editingGroup = ref<ColumnGroup | null>(null)
const newGroupName = ref('')
const newGroupColumns = ref<string[]>([])

function startEditGroup(group: ColumnGroup) {
  editingGroup.value = { ...group, columns: [...group.columns] }
}

function cancelEditGroup() {
  editingGroup.value = null
}

function saveEditGroup() {
  if (!editingGroup.value) return
  const idx = props.columnGroups.findIndex((g) => g.id === editingGroup.value!.id)
  if (idx >= 0) {
    const newGroups = [...props.columnGroups]
    newGroups[idx] = { ...editingGroup.value }
    emit('update:columnGroups', newGroups)
  }
  editingGroup.value = null
}

function toggleColumnInEdit(colKey: string) {
  if (!editingGroup.value) return
  const idx = editingGroup.value.columns.indexOf(colKey)
  if (idx >= 0) {
    editingGroup.value.columns.splice(idx, 1)
  } else {
    editingGroup.value.columns.push(colKey)
  }
}

function createGroup() {
  if (!newGroupName.value.trim() || newGroupColumns.value.length === 0) return
  emit('create-group', newGroupName.value.trim(), [...newGroupColumns.value])
  newGroupName.value = ''
  newGroupColumns.value = []
}

function onDragStart(key: string) {
  emit('drag-start', key)
}

function onDragOver(e: DragEvent, targetKey: string) {
  emit('drag-over', e, targetKey)
}

function onDragEnd() {
  emit('drag-end')
}
</script>

<template>
  <Teleport to="body">
    <div v-if="show" class="modal-overlay" role="dialog" aria-modal="true" @click.self="emit('close')">
      <div class="modal modal-lg">
        <div class="modal-header">
          <h3>⚙️ {{ $t('admin.productos.configureTable') }}</h3>
          <button class="modal-close" :aria-label="$t('common.close')" @click="emit('close')">×</button>
        </div>
        <div class="modal-body config-body">
          <!-- Tabs -->
          <div class="config-tabs">
            <button :class="{ active: configTab === 'grupos' }" @click="configTab = 'grupos'">
              📁 {{ $t('admin.productos.columnGroups') }}
            </button>
            <button :class="{ active: configTab === 'ordenar' }" @click="configTab = 'ordenar'">
              📊 {{ $t('admin.productos.sortTable') }}
            </button>
          </div>

          <!-- Groups Tab -->
          <div v-if="configTab === 'grupos'" class="config-section">
            <!-- Editing a group -->
            <div v-if="editingGroup" class="edit-group-panel">
              <h4>{{ $t('admin.productos.editing', { name: editingGroup.name }) }}</h4>
              <div class="form-group">
                <label>{{ $t('admin.productos.groupName') }}</label>
                <input v-model="editingGroup.name" type="text" :disabled="editingGroup.required" >
              </div>
              <div class="form-group">
                <label>{{ $t('admin.productos.includedColumns') }}</label>
                <div class="columns-grid">
                  <label
                    v-for="col in availableColumnsForGroups"
                    :key="col.key"
                    class="column-checkbox"
                  >
                    <input
                      type="checkbox"
                      :checked="editingGroup.columns.includes(col.key)"
                      @change="toggleColumnInEdit(col.key)"
                    >
                    {{ col.label }}
                  </label>
                </div>
              </div>
              <div class="edit-group-actions">
                <button class="btn-secondary" @click="cancelEditGroup">{{ $t('common.cancel') }}</button>
                <button class="btn-primary" @click="saveEditGroup">{{ $t('common.save') }}</button>
              </div>
            </div>

            <!-- Groups list -->
            <div v-else>
              <div class="groups-list">
                <div
                  v-for="group in columnGroups"
                  :key="group.id"
                  class="group-item"
                  :class="{ required: group.required }"
                >
                  <div class="group-info">
                    <span class="group-icon">{{ group.icon }}</span>
                    <span class="group-name">{{ group.name }}</span>
                    <span class="group-count">{{ group.columns.length }} col.</span>
                    <span v-if="group.required" class="tag tag-gray">{{ $t('common.required') }}</span>
                  </div>
                  <div class="group-actions">
                    <button class="btn-sm" @click="startEditGroup(group)">✏️</button>
                    <button
                      v-if="!group.required"
                      class="btn-sm btn-danger-sm"
                      @click="emit('delete-group', group.id)"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>

              <!-- Create new group -->
              <div class="new-group-form">
                <h4>{{ $t('admin.productos.createNewGroup') }}</h4>
                <div class="form-row">
                  <input v-model="newGroupName" type="text" :placeholder="$t('admin.productos.groupName')" >
                </div>
                <div class="form-group">
                  <label>{{ $t('common.columns') }}</label>
                  <div class="columns-grid">
                    <label
                      v-for="col in availableColumnsForGroups"
                      :key="col.key"
                      class="column-checkbox"
                    >
                      <input v-model="newGroupColumns" type="checkbox" :value="col.key" >
                      {{ col.label }}
                    </label>
                  </div>
                </div>
                <button
                  class="btn-primary"
                  :disabled="!newGroupName.trim() || newGroupColumns.length === 0"
                  @click="createGroup"
                >
                  + {{ $t('admin.productos.createGroup') }}
                </button>
              </div>
            </div>
          </div>

          <!-- Ordenar Tab -->
          <div v-if="configTab === 'ordenar'" class="config-section">
            <p class="hint">{{ $t('admin.productos.dragHint') }}</p>
            <div class="sortable-list">
              <div
                v-for="key in columnOrder"
                :key="key"
                class="sortable-item"
                :class="{ dragging: draggedColumn === key }"
                draggable="true"
                @dragstart="onDragStart(key)"
                @dragover="(e) => onDragOver(e, key)"
                @dragend="onDragEnd"
              >
                <span class="drag-handle">⋮⋮</span>
                <span class="col-name">{{
                  allColumns.find((c) => c.key === key)?.label || key
                }}</span>
                <span v-if="key.startsWith('filter_')" class="tag tag-green">{{ $t('admin.productos.filterTag') }}</span>
                <span
                  v-else-if="allColumns.find((c) => c.key === key)?.sortable"
                  class="tag tag-blue"
                >
                  {{ $t('admin.productos.sortableTag') }}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-danger-outline" @click="emit('reset-config')">
            {{ $t('admin.productos.restoreDefaults') }}
          </button>
          <button class="btn-primary" @click="emit('close')">{{ $t('common.close') }}</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: var(--spacing-5);
}

.modal {
  background: var(--bg-primary);
  border-radius: var(--border-radius-md);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  max-height: 90vh;
  overflow: auto;
  animation: modalSlide 0.2s ease-out;
}

@keyframes modalSlide {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-lg {
  width: 100%;
  max-width: 50rem;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-5) var(--spacing-6);
  border-bottom: 1px solid var(--color-gray-200);
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.75rem;
  line-height: 1;
  cursor: pointer;
  color: var(--text-disabled);
  padding: 0;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--border-radius);
  transition: all 0.2s;
}

.modal-close:hover {
  background: rgba(0, 0, 0, 0.05);
  color: var(--text-secondary);
}

.modal-body {
  padding: 0;
}

.config-body {
  min-height: 25rem;
}

.config-tabs {
  display: flex;
  border-bottom: 2px solid var(--color-gray-200);
  padding: 0 var(--spacing-6);
}

.config-tabs button {
  padding: var(--spacing-4) var(--spacing-5);
  border: none;
  background: none;
  color: var(--text-auxiliary);
  font-size: var(--font-size-sm);
  font-weight: 500;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -0.125rem;
  transition: all 0.2s;
}

.config-tabs button:hover {
  color: var(--text-secondary);
}

.config-tabs button.active {
  color: var(--color-primary);
  border-bottom-color: var(--color-primary);
}

.config-section {
  padding: var(--spacing-6);
}

.hint {
  margin: 0 0 var(--spacing-5);
  color: var(--text-auxiliary);
  font-size: var(--font-size-sm);
}

.groups-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
  margin-bottom: var(--spacing-8);
}

.group-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-4);
  border: 2px solid var(--color-gray-200);
  border-radius: var(--border-radius);
  transition: border 0.2s;
}

.group-item:hover {
  border-color: var(--color-gray-300);
}

.group-item.required {
  background: var(--bg-secondary);
}

.group-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
}

.group-icon {
  font-size: var(--font-size-xl);
}

.group-name {
  font-weight: 600;
  color: var(--text-primary);
}

.group-count {
  font-size: 0.8125rem;
  color: var(--text-auxiliary);
}

.group-actions {
  display: flex;
  gap: var(--spacing-2);
}

.btn-sm {
  background: var(--bg-primary);
  border: 1px solid var(--color-gray-200);
  padding: 0.375rem 0.625rem;
  border-radius: var(--border-radius);
  cursor: pointer;
  font-size: var(--font-size-sm);
  transition: all 0.2s;
}

.btn-sm:hover {
  background: var(--bg-secondary);
  border-color: var(--color-gray-300);
}

.btn-danger-sm {
  border-color: var(--color-error-border);
  color: var(--color-error);
}

.btn-danger-sm:hover {
  background: var(--color-error-bg, var(--color-error-bg));
  border-color: var(--color-error-soft);
}

.tag {
  padding: 0.1875rem var(--spacing-2);
  border-radius: var(--border-radius-sm);
  font-size: 0.6875rem;
  font-weight: 600;
}

.tag-gray {
  background: var(--bg-tertiary);
  color: var(--text-auxiliary);
}

.tag-green {
  background: var(--color-emerald-100);
  color: var(--color-success-text);
}

.tag-blue {
  background: var(--color-info-bg, var(--color-info-bg));
  color: var(--badge-info-bg);
}

.new-group-form {
  padding: var(--spacing-5);
  border: 2px dashed var(--color-gray-300);
  border-radius: var(--border-radius);
  background: var(--color-off-white);
}

.new-group-form h4 {
  margin: 0 0 var(--spacing-4);
  font-size: var(--font-size-base);
  color: var(--text-primary);
}

.form-row {
  margin-bottom: var(--spacing-4);
}

.form-row input {
  width: 100%;
  padding: 0.625rem var(--spacing-3);
  border: 1px solid var(--color-gray-200);
  border-radius: var(--border-radius);
  font-size: var(--font-size-sm);
}

.form-row input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.form-group {
  margin-bottom: var(--spacing-5);
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-group label {
  display: block;
  margin-bottom: var(--spacing-3);
  font-weight: 500;
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
}

.form-group input[type='text'] {
  width: 100%;
  padding: 0.625rem var(--spacing-3);
  border: 1px solid var(--color-gray-200);
  border-radius: var(--border-radius);
  font-size: var(--font-size-sm);
}

.form-group input[type='text']:focus {
  outline: none;
  border-color: var(--color-primary);
}

.columns-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: var(--spacing-3);
}

.column-checkbox {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  padding: var(--spacing-2);
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: background 0.2s;
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.column-checkbox:hover {
  background: var(--bg-secondary);
}

.column-checkbox input {
  cursor: pointer;
}

.edit-group-panel {
  padding: var(--spacing-5);
  border: 2px solid var(--color-gray-200);
  border-radius: var(--border-radius);
  background: var(--color-off-white);
}

.edit-group-panel h4 {
  margin: 0 0 var(--spacing-5);
  font-size: var(--font-size-base);
  color: var(--text-primary);
}

.edit-group-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-3);
  margin-top: var(--spacing-5);
}

.sortable-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.sortable-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  padding: var(--spacing-3) var(--spacing-4);
  background: var(--bg-primary);
  border: 2px solid var(--color-gray-200);
  border-radius: var(--border-radius);
  cursor: move;
  transition: all 0.2s;
}

.sortable-item:hover {
  border-color: var(--color-gray-300);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.sortable-item.dragging {
  opacity: 0.5;
}

.drag-handle {
  color: var(--color-gray-300);
  font-size: var(--font-size-lg);
  cursor: grab;
}

.drag-handle:active {
  cursor: grabbing;
}

.col-name {
  flex: 1;
  font-weight: 500;
  color: var(--text-primary);
}

.modal-footer {
  display: flex;
  justify-content: space-between;
  gap: var(--spacing-3);
  padding: var(--spacing-4) var(--spacing-6);
  border-top: 1px solid var(--color-gray-200);
}

.btn-secondary {
  background: var(--bg-primary);
  border: 1px solid var(--color-gray-200);
  color: var(--text-secondary);
  padding: 0.625rem 1.125rem;
  border-radius: var(--border-radius);
  font-size: var(--font-size-sm);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary:hover {
  background: var(--bg-secondary);
  border-color: var(--color-gray-300);
}

.btn-primary {
  background: var(--color-primary);
  color: white;
  border: none;
  padding: 0.625rem 1.125rem;
  border-radius: var(--border-radius);
  font-size: var(--font-size-sm);
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-primary:hover:not(:disabled) {
  background: var(--color-primary-dark);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-danger-outline {
  background: var(--bg-primary);
  border: 1px solid var(--color-error);
  color: var(--color-error);
  padding: 0.625rem 1.125rem;
  border-radius: var(--border-radius);
  font-size: var(--font-size-sm);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-danger-outline:hover {
  background: var(--color-error-bg, var(--color-error-bg));
}
</style>

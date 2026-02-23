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
    <div v-if="show" class="modal-overlay" @click.self="emit('close')">
      <div class="modal modal-lg">
        <div class="modal-header">
          <h3>⚙️ Configurar tabla</h3>
          <button class="modal-close" @click="emit('close')">×</button>
        </div>
        <div class="modal-body config-body">
          <!-- Tabs -->
          <div class="config-tabs">
            <button :class="{ active: configTab === 'grupos' }" @click="configTab = 'grupos'">
              📁 Grupos de columnas
            </button>
            <button :class="{ active: configTab === 'ordenar' }" @click="configTab = 'ordenar'">
              📊 Ordenar tabla
            </button>
          </div>

          <!-- Groups Tab -->
          <div v-if="configTab === 'grupos'" class="config-section">
            <!-- Editing a group -->
            <div v-if="editingGroup" class="edit-group-panel">
              <h4>Editando: {{ editingGroup.name }}</h4>
              <div class="form-group">
                <label>Nombre del grupo</label>
                <input v-model="editingGroup.name" type="text" :disabled="editingGroup.required" >
              </div>
              <div class="form-group">
                <label>Columnas incluidas</label>
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
                <button class="btn-secondary" @click="cancelEditGroup">Cancelar</button>
                <button class="btn-primary" @click="saveEditGroup">Guardar</button>
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
                    <span v-if="group.required" class="tag tag-gray">Obligatorio</span>
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
                <h4>Crear nuevo grupo</h4>
                <div class="form-row">
                  <input v-model="newGroupName" type="text" placeholder="Nombre del grupo" >
                </div>
                <div class="form-group">
                  <label>Columnas</label>
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
                  + Crear grupo
                </button>
              </div>
            </div>
          </div>

          <!-- Ordenar Tab -->
          <div v-if="configTab === 'ordenar'" class="config-section">
            <p class="hint">Arrastra las columnas para cambiar su orden en la tabla.</p>
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
                <span v-if="key.startsWith('filter_')" class="tag tag-green">Filtro</span>
                <span
                  v-else-if="allColumns.find((c) => c.key === key)?.sortable"
                  class="tag tag-blue"
                >
                  Ordenable
                </span>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-danger-outline" @click="emit('reset-config')">
            Restaurar valores
          </button>
          <button class="btn-primary" @click="emit('close')">Cerrar</button>
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
  padding: 20px;
}

.modal {
  background: white;
  border-radius: 12px;
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
  max-width: 800px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e2e8f0;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e293b;
}

.modal-close {
  background: none;
  border: none;
  font-size: 28px;
  line-height: 1;
  cursor: pointer;
  color: #94a3b8;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.2s;
}

.modal-close:hover {
  background: rgba(0, 0, 0, 0.05);
  color: #475569;
}

.modal-body {
  padding: 0;
}

.config-body {
  min-height: 400px;
}

.config-tabs {
  display: flex;
  border-bottom: 2px solid #e2e8f0;
  padding: 0 24px;
}

.config-tabs button {
  padding: 16px 20px;
  border: none;
  background: none;
  color: #64748b;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  transition: all 0.2s;
}

.config-tabs button:hover {
  color: #475569;
}

.config-tabs button.active {
  color: var(--color-primary, #23424a);
  border-bottom-color: var(--color-primary, #23424a);
}

.config-section {
  padding: 24px;
}

.hint {
  margin: 0 0 20px;
  color: #64748b;
  font-size: 14px;
}

.groups-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 32px;
}

.group-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  transition: border 0.2s;
}

.group-item:hover {
  border-color: #cbd5e1;
}

.group-item.required {
  background: #f8fafc;
}

.group-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.group-icon {
  font-size: 20px;
}

.group-name {
  font-weight: 600;
  color: #1e293b;
}

.group-count {
  font-size: 13px;
  color: #64748b;
}

.group-actions {
  display: flex;
  gap: 8px;
}

.btn-sm {
  background: white;
  border: 1px solid #e2e8f0;
  padding: 6px 10px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.btn-sm:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
}

.btn-danger-sm {
  border-color: #fecaca;
  color: #dc2626;
}

.btn-danger-sm:hover {
  background: #fef2f2;
  border-color: #fca5a5;
}

.tag {
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
}

.tag-gray {
  background: #e2e8f0;
  color: #64748b;
}

.tag-green {
  background: #d1fae5;
  color: #065f46;
}

.tag-blue {
  background: #dbeafe;
  color: #1e40af;
}

.new-group-form {
  padding: 20px;
  border: 2px dashed #cbd5e1;
  border-radius: 8px;
  background: #fafbfc;
}

.new-group-form h4 {
  margin: 0 0 16px;
  font-size: 16px;
  color: #1e293b;
}

.form-row {
  margin-bottom: 16px;
}

.form-row input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
}

.form-row input:focus {
  outline: none;
  border-color: var(--color-primary, #23424a);
}

.form-group {
  margin-bottom: 20px;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-group label {
  display: block;
  margin-bottom: 12px;
  font-weight: 500;
  color: #475569;
  font-size: 14px;
}

.form-group input[type='text'] {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
}

.form-group input[type='text']:focus {
  outline: none;
  border-color: var(--color-primary, #23424a);
}

.columns-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}

.column-checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s;
  font-size: 14px;
  color: #475569;
}

.column-checkbox:hover {
  background: #f1f5f9;
}

.column-checkbox input {
  cursor: pointer;
}

.edit-group-panel {
  padding: 20px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  background: #fafbfc;
}

.edit-group-panel h4 {
  margin: 0 0 20px;
  font-size: 16px;
  color: #1e293b;
}

.edit-group-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 20px;
}

.sortable-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sortable-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  cursor: move;
  transition: all 0.2s;
}

.sortable-item:hover {
  border-color: #cbd5e1;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.sortable-item.dragging {
  opacity: 0.5;
}

.drag-handle {
  color: #cbd5e1;
  font-size: 18px;
  cursor: grab;
}

.drag-handle:active {
  cursor: grabbing;
}

.col-name {
  flex: 1;
  font-weight: 500;
  color: #1e293b;
}

.modal-footer {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid #e2e8f0;
}

.btn-secondary {
  background: white;
  border: 1px solid #e2e8f0;
  color: #475569;
  padding: 10px 18px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
}

.btn-primary {
  background: var(--color-primary, #23424a);
  color: white;
  border: none;
  padding: 10px 18px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-primary:hover:not(:disabled) {
  background: #1a3238;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-danger-outline {
  background: white;
  border: 1px solid #dc2626;
  color: #dc2626;
  padding: 10px 18px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-danger-outline:hover {
  background: #fef2f2;
}
</style>

<template>
  <Teleport to="body">
    <div v-if="show" class="modal-bg" @click.self="$emit('close')">
      <div class="modal">
        <div class="modal-head">
          <span>&#x1F4E5; Exportar Balance</span>
          <button @click="$emit('close')">&times;</button>
        </div>
        <div class="modal-body">
          <div class="field">
            <label>Formato</label>
            <div class="radio-group">
              <label><input v-model="localFormat" type="radio" value="excel" > Excel (CSV)</label>
              <label><input v-model="localFormat" type="radio" value="pdf" > PDF (Imprimir)</label>
            </div>
          </div>

          <div class="field">
            <label>Datos</label>
            <div class="radio-group">
              <label
                ><input v-model="localScope" type="radio" value="filtered" > Solo filtrados</label
              >
              <label><input v-model="localScope" type="radio" value="all" > Todos</label>
            </div>
          </div>

          <div class="field">
            <label>Columnas a incluir</label>
            <div class="checkbox-group">
              <label><input v-model="localColumns.tipo" type="checkbox" > Tipo</label>
              <label><input v-model="localColumns.fecha" type="checkbox" > Fecha</label>
              <label><input v-model="localColumns.razon" type="checkbox" > Razon</label>
              <label><input v-model="localColumns.detalle" type="checkbox" > Detalle</label>
              <label><input v-model="localColumns.importe" type="checkbox" > Importe</label>
              <label><input v-model="localColumns.estado" type="checkbox" > Estado</label>
              <label><input v-model="localColumns.notas" type="checkbox" > Notas</label>
            </div>
          </div>
        </div>
        <div class="modal-foot">
          <button class="btn" @click="$emit('close')">Cancelar</button>
          <button class="btn btn-primary" @click="$emit('export')">Exportar</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
const props = defineProps<{
  show: boolean
  exportFormat: 'excel' | 'pdf'
  exportDataScope: 'all' | 'filtered'
  exportColumns: {
    tipo: boolean
    fecha: boolean
    razon: boolean
    detalle: boolean
    importe: boolean
    estado: boolean
    notas: boolean
  }
}>()

const emit = defineEmits<{
  close: []
  export: []
  'update:exportFormat': [value: 'excel' | 'pdf']
  'update:exportDataScope': [value: 'all' | 'filtered']
  'update:exportColumns': [
    value: {
      tipo: boolean
      fecha: boolean
      razon: boolean
      detalle: boolean
      importe: boolean
      estado: boolean
      notas: boolean
    },
  ]
}>()

// Local two-way bindings that sync back to parent
const localFormat = computed({
  get: () => props.exportFormat,
  set: (v: 'excel' | 'pdf') => emit('update:exportFormat', v),
})

const localScope = computed({
  get: () => props.exportDataScope,
  set: (v: 'all' | 'filtered') => emit('update:exportDataScope', v),
})

const localColumns = reactive({
  tipo: props.exportColumns.tipo,
  fecha: props.exportColumns.fecha,
  razon: props.exportColumns.razon,
  detalle: props.exportColumns.detalle,
  importe: props.exportColumns.importe,
  estado: props.exportColumns.estado,
  notas: props.exportColumns.notas,
})

// Keep local columns in sync with parent props
watch(
  () => props.exportColumns,
  (v) => {
    Object.assign(localColumns, v)
  },
  { deep: true },
)

// Emit column changes back to parent
watch(
  localColumns,
  (v) => {
    emit('update:exportColumns', { ...v })
  },
  { deep: true },
)
</script>

<style scoped>
@import './balance-shared.css';
</style>

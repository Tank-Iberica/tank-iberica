<template>
  <Teleport to="body">
    <div v-if="show" class="modal-bg" @click.self="$emit('close')">
      <div class="modal">
        <div class="modal-head">
          <span>&#x1F4E5; {{ $t('admin.balance.exportBalanceTitle') }}</span>
          <button @click="$emit('close')">&times;</button>
        </div>
        <div class="modal-body">
          <div class="field">
            <label>{{ $t('common.format') }}</label>
            <div class="radio-group">
              <label><input v-model="localFormat" type="radio" value="excel" > {{ $t('admin.balance.excelCsv') }}</label>
              <label><input v-model="localFormat" type="radio" value="pdf" > {{ $t('admin.balance.pdfPrint') }}</label>
            </div>
          </div>

          <div class="field">
            <label>{{ $t('common.data') }}</label>
            <div class="radio-group">
              <label
                ><input v-model="localScope" type="radio" value="filtered" > {{ $t('admin.balance.onlyFiltered') }}</label
              >
              <label><input v-model="localScope" type="radio" value="all" > {{ $t('common.all') }}</label>
            </div>
          </div>

          <div class="field">
            <label>{{ $t('admin.balance.columnsToInclude') }}</label>
            <div class="checkbox-group">
              <label><input v-model="localColumns.tipo" type="checkbox" > {{ $t('admin.balance.colType') }}</label>
              <label><input v-model="localColumns.fecha" type="checkbox" > {{ $t('admin.balance.colDate') }}</label>
              <label><input v-model="localColumns.razon" type="checkbox" > {{ $t('admin.balance.colReason') }}</label>
              <label><input v-model="localColumns.detalle" type="checkbox" > {{ $t('admin.balance.colDetail') }}</label>
              <label><input v-model="localColumns.importe" type="checkbox" > {{ $t('admin.balance.colAmount') }}</label>
              <label><input v-model="localColumns.estado" type="checkbox" > {{ $t('admin.balance.colStatus') }}</label>
              <label><input v-model="localColumns.notas" type="checkbox" > {{ $t('admin.balance.colNotes') }}</label>
            </div>
          </div>
        </div>
        <div class="modal-foot">
          <button class="btn" @click="$emit('close')">{{ $t('common.cancel') }}</button>
          <button class="btn btn-primary" @click="$emit('export')">{{ $t('common.export') }}</button>
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

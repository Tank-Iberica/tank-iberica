<template>
  <Teleport to="body">
    <div v-if="show" class="modal-bg" @click.self="$emit('close')">
      <div class="modal">
        <div class="modal-head">
          <span>&#x1F4CA; Exportar Resumen</span>
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
            <label>Incluir</label>
            <div class="checkbox-group">
              <label
                ><input v-model="localOptions.totales" type="checkbox" > Totales
                (Ingresos/Gastos/Neto)</label
              >
              <label
                ><input v-model="localOptions.desglose" type="checkbox" > Desglose por Razon</label
              >
              <label
                ><input v-model="localOptions.mensual" type="checkbox" > Desglose Mensual</label
              >
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
  resumenOptions: {
    totales: boolean
    desglose: boolean
    mensual: boolean
  }
}>()

const emit = defineEmits<{
  close: []
  export: []
  'update:exportFormat': [value: 'excel' | 'pdf']
  'update:resumenOptions': [value: { totales: boolean; desglose: boolean; mensual: boolean }]
}>()

const localFormat = computed({
  get: () => props.exportFormat,
  set: (v: 'excel' | 'pdf') => emit('update:exportFormat', v),
})

const localOptions = reactive({
  totales: props.resumenOptions.totales,
  desglose: props.resumenOptions.desglose,
  mensual: props.resumenOptions.mensual,
})

// Keep local options in sync with parent props
watch(
  () => props.resumenOptions,
  (v) => {
    Object.assign(localOptions, v)
  },
  { deep: true },
)

// Emit option changes back to parent
watch(
  localOptions,
  (v) => {
    emit('update:resumenOptions', { ...v })
  },
  { deep: true },
)
</script>

<style scoped>
@import './balance-shared.css';
</style>

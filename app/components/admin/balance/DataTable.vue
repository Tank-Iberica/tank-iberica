<template>
  <div class="table-container">
    <div v-if="loading" class="loading">Cargando...</div>

    <table v-else class="balance-table">
      <thead>
        <tr>
          <th class="sortable" @click="$emit('toggleSort', 'tipo')">
            Tipo {{ getSortIcon('tipo') }}
          </th>
          <th class="sortable" @click="$emit('toggleSort', 'fecha')">
            Fecha {{ getSortIcon('fecha') }}
          </th>
          <th class="sortable" @click="$emit('toggleSort', 'razon')">
            Razon {{ getSortIcon('razon') }}
          </th>
          <th>Detalle</th>
          <th>Vehiculo</th>
          <th>Tipo</th>
          <th class="sortable num" @click="$emit('toggleSort', 'importe')">
            Importe {{ getSortIcon('importe') }}
          </th>
          <th class="num">Ben.%</th>
          <th>Factura</th>
          <th>Estado</th>
          <th class="actions">Acc.</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="sortedEntries.length === 0">
          <td colspan="11" class="empty">No hay transacciones</td>
        </tr>
        <tr v-for="e in sortedEntries" :key="e.id">
          <td>
            <span class="tipo-badge" :class="e.tipo">
              {{ e.tipo === 'ingreso' ? '\u2191' : '\u2193' }}
            </span>
          </td>
          <td>{{ fmtDate(e.fecha) }}</td>
          <td>{{ BALANCE_REASONS[e.razon] }}</td>
          <td class="detalle">{{ e.detalle || '\u2014' }}</td>
          <td class="vehiculo">
            <span v-if="e.vehicles" class="vehiculo-badge">
              {{ e.vehicles.brand }} {{ e.vehicles.model }} ({{ e.vehicles.year }})
            </span>
            <span v-else>&mdash;</span>
          </td>
          <td>{{ getEntryType(e) }}</td>
          <td class="num" :class="e.tipo">
            <strong>{{ fmt(e.importe) }}</strong>
          </td>
          <td class="num">
            <span
              v-if="e.tipo === 'ingreso' && e.coste_asociado"
              :class="
                calculateProfit(e.importe, e.coste_asociado)! >= 0 ? 'profit-pos' : 'profit-neg'
              "
            >
              {{ fmtPercent(calculateProfit(e.importe, e.coste_asociado)) }}
            </span>
            <span v-else>&mdash;</span>
          </td>
          <td>
            <a v-if="e.factura_url" :href="e.factura_url" target="_blank" class="factura-link"
              >Ver</a
            >
            <span v-else>&mdash;</span>
          </td>
          <td>
            <span class="estado-badge" :class="e.estado">{{
              BALANCE_STATUS_LABELS[e.estado]
            }}</span>
          </td>
          <td class="actions">
            <button class="btn-icon" title="Editar" @click="$emit('edit', e)">
              &#x270F;&#xFE0F;
            </button>
            <button class="btn-icon del" title="Eliminar" @click="$emit('delete', e)">
              &#x1F5D1;&#xFE0F;
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import {
  type BalanceEntry,
  BALANCE_REASONS,
  BALANCE_STATUS_LABELS,
} from '~/composables/admin/useAdminBalance'
import { fmt, fmtDate, fmtPercent } from '~/composables/admin/useAdminBalanceUI'
import { localizedName } from '~/composables/useLocalized'

const props = defineProps<{
  loading: boolean
  sortedEntries: BalanceEntry[]
  locale: string
  getSortIcon: (col: string) => string
  calculateProfit: (importe: number, coste: number | null) => number | null
}>()

function getEntryType(e: BalanceEntry): string {
  const rec = e as Record<string, unknown>
  return localizedName(rec.types, props.locale) || '\u2014'
}

defineEmits<{
  toggleSort: [col: 'fecha' | 'importe' | 'tipo' | 'razon']
  edit: [entry: BalanceEntry]
  delete: [entry: BalanceEntry]
}>()
</script>

<style scoped>
@import './balance-shared.css';
</style>

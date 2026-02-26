<template>
  <div class="table-container">
    <div v-if="loading" class="loading">{{ $t('admin.balance.loading') }}</div>

    <table v-else class="balance-table">
      <thead>
        <tr>
          <th class="sortable" @click="$emit('toggleSort', 'tipo')">
            {{ $t('admin.balance.colType') }} {{ getSortIcon('tipo') }}
          </th>
          <th class="sortable" @click="$emit('toggleSort', 'fecha')">
            {{ $t('admin.balance.colDate') }} {{ getSortIcon('fecha') }}
          </th>
          <th class="sortable" @click="$emit('toggleSort', 'razon')">
            {{ $t('admin.balance.colReason') }} {{ getSortIcon('razon') }}
          </th>
          <th>{{ $t('admin.balance.colDetail') }}</th>
          <th>{{ $t('admin.balance.colVehicle') }}</th>
          <th>{{ $t('admin.balance.colSubtype') }}</th>
          <th class="sortable num" @click="$emit('toggleSort', 'importe')">
            {{ $t('admin.balance.colAmount') }} {{ getSortIcon('importe') }}
          </th>
          <th class="num">{{ $t('admin.balance.colProfit') }}</th>
          <th>{{ $t('admin.balance.colInvoice') }}</th>
          <th>{{ $t('admin.balance.colStatus') }}</th>
          <th class="actions">{{ $t('admin.balance.colActions') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="sortedEntries.length === 0">
          <td colspan="11" class="empty">{{ $t('admin.balance.noTransactions') }}</td>
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
            <a v-if="e.factura_url" :href="e.factura_url" target="_blank" class="factura-link">{{
              $t('admin.balance.view')
            }}</a>
            <span v-else>&mdash;</span>
          </td>
          <td>
            <span class="estado-badge" :class="e.estado">{{
              BALANCE_STATUS_LABELS[e.estado]
            }}</span>
          </td>
          <td class="actions">
            <button class="btn-icon" :title="$t('admin.balance.edit')" @click="$emit('edit', e)">
              &#x270F;&#xFE0F;
            </button>
            <button
              class="btn-icon del"
              :title="$t('admin.balance.delete')"
              @click="$emit('delete', e)"
            >
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
  const rec = e as unknown as Record<string, unknown>
  const types = rec.types as
    | { name?: Record<string, string> | null; name_es?: string; name_en?: string | null }
    | null
    | undefined
  return localizedName(types, props.locale) || '\u2014'
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

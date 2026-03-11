<script setup lang="ts">
import type { HistoricoEntry } from '~/composables/admin/useAdminHistorico'
import { SALE_CATEGORIES } from '~/composables/admin/useAdminHistorico'
import type { SortColumn } from '~/composables/admin/useAdminHistoricoPage'
import { localizedName } from '~/composables/useLocalized'

defineProps<{
  entries: HistoricoEntry[]
  loading: boolean
  showDocs: boolean
  showTecnico: boolean
  showAlquiler: boolean
  locale: string
  fmt: (val: number | null | undefined) => string
  fmtDate: (date: string) => string
  getSortIcon: (col: string) => string
}>()

defineEmits<{
  (e: 'sort', col: SortColumn): void
  (e: 'open-detail' | 'open-restore' | 'open-delete', entry: HistoricoEntry): void
}>()

function getTypeName(entry: HistoricoEntry, locale: string): string {
  const rec = entry as unknown as Record<string, unknown>
  const types = rec.types as
    | { name?: Record<string, string> | null; name_es?: string; name_en?: string | null }
    | null
    | undefined
  return localizedName(types, locale) || '\u2014'
}
</script>

<template>
  <div class="table-container">
    <div v-if="loading" class="loading">Cargando...</div>

    <table v-else class="historico-table">
      <thead>
        <tr>
          <th class="sortable" @click="$emit('sort', 'brand')">
            Vehículo {{ getSortIcon('brand') }}
          </th>
          <th>Tipo</th>
          <th class="sortable" @click="$emit('sort', 'sale_date')">
            Fecha {{ getSortIcon('sale_date') }}
          </th>
          <th>Categoría</th>
          <th>Comprador</th>
          <th class="sortable num" @click="$emit('sort', 'sale_price')">
            Precio Venta {{ getSortIcon('sale_price') }}
          </th>
          <th class="num">Coste</th>
          <th class="sortable num" @click="$emit('sort', 'benefit')">
            Beneficio {{ getSortIcon('benefit') }}
          </th>
          <th class="num">%</th>
          <!-- DOCS group -->
          <template v-if="showDocs">
            <th>Docs</th>
          </template>
          <!-- TECNICO group -->
          <template v-if="showTecnico">
            <th>Año</th>
            <th>P.Original</th>
          </template>
          <!-- ALQUILER group -->
          <template v-if="showAlquiler">
            <th>Ing.Alquiler</th>
          </template>
          <th class="actions">Acc.</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="entries.length === 0">
          <td
            :colspan="9 + (showDocs ? 1 : 0) + (showTecnico ? 2 : 0) + (showAlquiler ? 1 : 0) + 1"
            class="empty"
          >
            {{ $t('common.noResults') }}
          </td>
        </tr>
        <tr v-for="e in entries" :key="e.id">
          <td class="vehiculo">
            <strong>{{ e.brand }}</strong> {{ e.model }}
          </td>
          <td>{{ getTypeName(e, locale) }}</td>
          <td>{{ e.sale_date ? fmtDate(e.sale_date) : '—' }}</td>
          <td>
            <span class="cat-badge" :class="e.sale_category">
              {{ SALE_CATEGORIES[e.sale_category || ''] || '—' }}
            </span>
          </td>
          <td class="buyer">{{ e.buyer_name || '—' }}</td>
          <td class="num">
            <strong>{{ fmt(e.sale_price) }}</strong>
          </td>
          <td class="num muted">{{ fmt(e.total_cost) }}</td>
          <td class="num" :class="(e.benefit || 0) >= 0 ? 'profit-pos' : 'profit-neg'">
            <strong>{{ fmt(e.benefit) }}</strong>
          </td>
          <td class="num" :class="(e.benefit_percent || 0) >= 0 ? 'profit-pos' : 'profit-neg'">
            {{ e.benefit_percent !== null ? `${e.benefit_percent}%` : '—' }}
          </td>
          <!-- DOCS group -->
          <template v-if="showDocs">
            <td>
              <span v-if="e.vehicle_data" class="doc-badge">📄</span>
              <span v-else>—</span>
            </td>
          </template>
          <!-- TECNICO group -->
          <template v-if="showTecnico">
            <td>{{ e.year || '—' }}</td>
            <td class="num muted">{{ fmt(e.original_price) }}</td>
          </template>
          <!-- ALQUILER group -->
          <template v-if="showAlquiler">
            <td class="num">{{ fmt(e.total_rental_income) }}</td>
          </template>
          <td class="actions">
            <button class="btn-icon" title="Ver detalles" @click="$emit('open-detail', e)">
              👁
            </button>
            <button class="btn-icon restore" title="Restaurar" @click="$emit('open-restore', e)">
              🔄
            </button>
            <button class="btn-icon del" title="Eliminar" @click="$emit('open-delete', e)">
              🗑️
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.table-container {
  background: var(--bg-primary);
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-card);
  overflow-x: auto;
}
.loading {
  padding: 2.5rem;
  text-align: center;
  color: var(--color-gray-500);
}
.historico-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}
.historico-table th {
  text-align: left;
  padding: 0.75rem 0.625rem;
  background: var(--color-gray-50);
  font-weight: 600;
  font-size: 0.75rem;
  text-transform: uppercase;
  color: var(--color-gray-500);
  border-bottom: 1px solid var(--bg-tertiary);
  white-space: nowrap;
}
.historico-table th.sortable {
  cursor: pointer;
}
.historico-table th.sortable:hover {
  background: var(--bg-secondary);
}
.historico-table th.num,
.historico-table td.num {
  text-align: right;
}
.historico-table th.actions {
  text-align: center;
  width: 6.25rem;
}
.historico-table td {
  padding: 0.625rem;
  border-bottom: 1px solid var(--bg-secondary);
  vertical-align: middle;
}
.historico-table td.empty {
  text-align: center;
  color: var(--text-disabled);
  padding: 2.5rem;
}
.historico-table td.vehiculo {
  font-weight: 500;
}
.historico-table td.buyer {
  max-width: 7.5rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.historico-table td.muted {
  color: var(--text-disabled);
}
.historico-table td.actions {
  text-align: center;
}

/* Category badges */
.cat-badge {
  padding: 0.1875rem 0.5rem;
  border-radius: var(--border-radius-md);
  font-size: 0.7rem;
  font-weight: 500;
}
.cat-badge.venta {
  background: var(--color-info-bg, var(--color-info-bg));
  color: var(--badge-info-bg);
}
.cat-badge.terceros {
  background: var(--color-purple-100);
  color: var(--color-purple-600);
}
.cat-badge.exportacion {
  background: var(--color-warning-bg, var(--color-warning-bg));
  color: var(--color-warning-text);
}

/* Profit colors */
.profit-pos {
  color: var(--color-success);
  font-weight: 600;
}
.profit-neg {
  color: var(--color-error);
  font-weight: 600;
}

/* Doc badge */
.doc-badge {
  font-size: 1rem;
}

/* Action buttons */
.btn-icon {
  width: 1.75rem;
  height: 1.75rem;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 0.9rem;
  border-radius: var(--border-radius-sm);
}
.btn-icon:hover {
  background: var(--bg-secondary);
}
.btn-icon.del:hover {
  background: var(--color-error-bg, var(--color-error-bg));
}
.btn-icon.restore:hover {
  background: var(--color-success-bg, var(--color-success-bg));
}

@media (max-width: 48em) {
  .historico-table {
    font-size: 0.75rem;
  }
  .historico-table th,
  .historico-table td {
    padding: 0.5rem 0.375rem;
  }
}
</style>

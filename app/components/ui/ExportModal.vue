<script setup lang="ts">
/**
 * ExportModal — Generic export modal for dashboard and admin pages.
 * Supports Excel (.xlsx) and PDF export with column selection.
 */
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'

interface ExportColumn {
  key: string
  label: string
  enabled: boolean
}

type ExportFormat = 'excel' | 'pdf'

interface Props {
  modelValue: boolean
  title?: string
  data: Record<string, unknown>[]
  columns: ExportColumn[]
  formats?: ExportFormat[]
  fileName?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  formats: () => ['excel', 'pdf'],
  fileName: 'export',
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  export: [payload: { format: ExportFormat; columns: string[] }]
}>()

const { t } = useI18n()

const localColumns = ref<ExportColumn[]>([])
const selectedFormat = ref<ExportFormat>('excel')
const isExporting = ref(false)

const modalTitle = computed(() => props.title || t('exportModal.title'))

const enabledColumns = computed(() => localColumns.value.filter((col) => col.enabled))

const allSelected = computed(
  () => localColumns.value.length > 0 && localColumns.value.every((col) => col.enabled),
)

const noneSelected = computed(() => localColumns.value.every((col) => !col.enabled))

function selectAll() {
  localColumns.value.forEach((col) => {
    col.enabled = true
  })
}

function deselectAll() {
  localColumns.value.forEach((col) => {
    col.enabled = false
  })
}

function toggleColumn(index: number) {
  const col = localColumns.value[index]
  if (col) {
    col.enabled = !col.enabled
  }
}

function close() {
  emit('update:modelValue', false)
}

function handleBackdropClick(e: MouseEvent) {
  if (e.target === e.currentTarget) {
    close()
  }
}

function handleKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    close()
  }
}

function formatDate(date: Date): string {
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

async function generateExcel() {
  const ExcelJS = await import('exceljs')
  const selectedCols = enabledColumns.value

  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('Data')

  // Set columns with headers
  worksheet.columns = selectedCols.map((col) => {
    // Calculate optimal width
    const headerWidth = col.label.length
    const dataWidths = props.data.map((row) => {
      const val = row[col.key]
      if (val === null || val === undefined) return 0
      return String(val).length
    })
    const maxWidth = Math.max(headerWidth, ...dataWidths)

    return {
      header: col.label,
      key: col.key,
      width: Math.min(maxWidth + 2, 50),
    }
  })

  // Add data rows
  props.data.forEach((row) => {
    const rowData: Record<string, unknown> = {}
    selectedCols.forEach((col) => {
      const val = row[col.key]
      rowData[col.key] = val === null || val === undefined ? '' : val
    })
    worksheet.addRow(rowData)
  })

  // Style header row
  worksheet.getRow(1).font = { bold: true }
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE5E7EB' },
  }

  // Generate and download file
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${props.fileName}.xlsx`
  link.click()
  URL.revokeObjectURL(url)
}

async function generatePdf() {
  const { jsPDF } = await import('jspdf')
  const autoTableModule = await import('jspdf-autotable')
  const autoTable = 'default' in autoTableModule ? autoTableModule.default : autoTableModule

  const selectedCols = enabledColumns.value
  const doc = new jsPDF({ orientation: 'landscape' })

  // Professional header
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text(modalTitle.value, 14, 20)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100)
  doc.text(`${t('exportModal.generatedOn')}: ${formatDate(new Date())}`, 14, 28)
  doc.setTextColor(0)

  const headers = selectedCols.map((col) => col.label)
  const rows = props.data.map((row) =>
    selectedCols.map((col) => {
      const val = row[col.key]
      if (val === null || val === undefined) return ''
      return String(val)
    }),
  )

  // Use autoTable — handle both function and method patterns
  if (typeof autoTable === 'function') {
    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: 34,
      styles: {
        fontSize: 8,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [35, 66, 74],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [245, 247, 249],
      },
      margin: { top: 34, left: 14, right: 14 },
    })
  }

  doc.save(`${props.fileName}.pdf`)
}

async function handleExport() {
  if (noneSelected.value) return

  isExporting.value = true

  try {
    if (selectedFormat.value === 'excel') {
      await generateExcel()
    } else {
      await generatePdf()
    }

    emit('export', {
      format: selectedFormat.value,
      columns: enabledColumns.value.map((col) => col.key),
    })

    close()
  } finally {
    isExporting.value = false
  }
}

watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue) {
      // Reset local columns from props
      localColumns.value = props.columns.map((col) => ({ ...col }))
      selectedFormat.value = props.formats[0] ?? 'excel'
      document.body.style.overflow = 'hidden'
      document.addEventListener('keydown', handleKeyDown)
    } else {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', handleKeyDown)
    }
  },
)
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="modelValue" class="export-backdrop" @click="handleBackdropClick">
        <div class="export-modal" role="dialog" :aria-label="modalTitle">
          <!-- Header -->
          <div class="export-header">
            <h2 class="export-title">{{ modalTitle }}</h2>
            <button
              type="button"
              class="export-close"
              :aria-label="t('common.close')"
              @click="close"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <!-- Body -->
          <div class="export-body">
            <!-- Column selection -->
            <div class="export-section">
              <div class="export-section-header">
                <h3 class="export-section-title">{{ t('exportModal.columns') }}</h3>
                <div class="export-section-actions">
                  <button
                    type="button"
                    class="export-link-btn"
                    :disabled="allSelected"
                    @click="selectAll"
                  >
                    {{ t('exportModal.selectAll') }}
                  </button>
                  <span class="export-separator">|</span>
                  <button
                    type="button"
                    class="export-link-btn"
                    :disabled="noneSelected"
                    @click="deselectAll"
                  >
                    {{ t('exportModal.deselectAll') }}
                  </button>
                </div>
              </div>

              <div class="export-columns-grid">
                <label v-for="(col, i) in localColumns" :key="col.key" class="export-column-item">
                  <input
                    type="checkbox"
                    class="export-checkbox"
                    :checked="col.enabled"
                    @change="toggleColumn(i)"
                  >
                  <span class="export-column-label">{{ col.label }}</span>
                </label>
              </div>

              <p v-if="noneSelected" class="export-warning">
                {{ t('exportModal.noColumns') }}
              </p>
            </div>

            <!-- Format selection -->
            <div class="export-section">
              <h3 class="export-section-title">{{ t('exportModal.format') }}</h3>
              <div class="export-formats">
                <label
                  v-for="fmt in formats"
                  :key="fmt"
                  class="export-format-option"
                  :class="{ 'export-format-selected': selectedFormat === fmt }"
                >
                  <input
                    v-model="selectedFormat"
                    type="radio"
                    name="export-format"
                    :value="fmt"
                    class="export-radio"
                  >
                  <svg
                    v-if="fmt === 'excel'"
                    class="export-format-icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="8" y1="13" x2="16" y2="13" />
                    <line x1="8" y1="17" x2="16" y2="17" />
                    <line x1="8" y1="9" x2="10" y2="9" />
                  </svg>
                  <svg
                    v-else
                    class="export-format-icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                  </svg>
                  <span class="export-format-label">
                    {{ fmt === 'excel' ? 'Excel (.xlsx)' : 'PDF (.pdf)' }}
                  </span>
                </label>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="export-footer">
            <button type="button" class="export-btn export-btn-secondary" @click="close">
              {{ t('common.cancel') }}
            </button>
            <button
              type="button"
              class="export-btn export-btn-primary"
              :disabled="isExporting || noneSelected"
              @click="handleExport"
            >
              {{ isExporting ? t('exportModal.exporting') : t('exportModal.export') }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* === Modal overlay (mobile-first: bottom sheet) === */
.export-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: var(--z-modal, 500);
  overflow-y: auto;
}

.export-modal {
  background: var(--bg-primary, white);
  width: 100%;
  max-height: 92vh;
  overflow-y: auto;
  border-radius: var(--border-radius-lg, 16px) var(--border-radius-lg, 16px) 0 0;
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-xl, 0 16px 32px rgba(0, 0, 0, 0.15));
}

/* === Header === */
.export-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-4) var(--spacing-4);
  border-bottom: 1px solid var(--border-color, #d1d5db);
  position: sticky;
  top: 0;
  background: var(--bg-primary, white);
  z-index: 1;
}

.export-title {
  font-size: var(--font-size-lg, 1.125rem);
  font-weight: var(--font-weight-semibold, 600);
  color: var(--text-primary, #1f2a2a);
  margin: 0;
}

.export-close {
  min-width: 44px;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--border-radius-full, 9999px);
  background: transparent;
  color: var(--text-auxiliary, #7a8a8a);
  cursor: pointer;
  transition: background var(--transition-fast, 150ms ease);
  flex-shrink: 0;
}

.export-close:hover {
  background: var(--bg-secondary, #f3f4f6);
  color: var(--text-primary, #1f2a2a);
}

/* === Body === */
.export-body {
  padding: var(--spacing-4);
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-6, 1.5rem);
}

/* === Section === */
.export-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3, 0.75rem);
}

.export-section-header {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2, 0.5rem);
}

.export-section-title {
  font-size: var(--font-size-sm, 0.875rem);
  font-weight: var(--font-weight-semibold, 600);
  color: var(--color-primary, #23424a);
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.export-section-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-2, 0.5rem);
}

.export-link-btn {
  background: none;
  border: none;
  color: var(--color-accent, #7fd1c8);
  font-size: var(--font-size-sm, 0.875rem);
  font-weight: var(--font-weight-medium, 500);
  cursor: pointer;
  padding: var(--spacing-1) 0;
  min-height: 44px;
  min-width: 44px;
  display: inline-flex;
  align-items: center;
  transition: color var(--transition-fast, 150ms ease);
}

.export-link-btn:hover:not(:disabled) {
  color: var(--color-accent-hover, #5fbfb4);
}

.export-link-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.export-separator {
  color: var(--border-color, #d1d5db);
  font-size: var(--font-size-sm, 0.875rem);
}

/* === Column grid === */
.export-columns-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-1, 0.25rem);
}

.export-column-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-3, 0.75rem);
  padding: var(--spacing-2) var(--spacing-3);
  border-radius: var(--border-radius, 8px);
  cursor: pointer;
  min-height: 44px;
  transition: background var(--transition-fast, 150ms ease);
}

.export-column-item:hover {
  background: var(--bg-secondary, #f3f4f6);
}

.export-checkbox {
  min-width: 18px;
  min-height: 18px;
  cursor: pointer;
  accent-color: var(--color-primary, #23424a);
}

.export-column-label {
  font-size: var(--font-size-sm, 0.875rem);
  color: var(--text-primary, #1f2a2a);
  line-height: var(--line-height-normal, 1.5);
}

.export-warning {
  font-size: var(--font-size-xs, 0.75rem);
  color: var(--color-error, #ef4444);
  margin: 0;
  padding: var(--spacing-2) var(--spacing-3);
  background: #fef2f2;
  border-radius: var(--border-radius-sm, 4px);
}

/* === Format selection === */
.export-formats {
  display: flex;
  gap: var(--spacing-3, 0.75rem);
}

.export-format-option {
  flex: 1;
  display: flex;
  align-items: center;
  gap: var(--spacing-3, 0.75rem);
  padding: var(--spacing-3) var(--spacing-4);
  border: 2px solid var(--border-color, #d1d5db);
  border-radius: var(--border-radius, 8px);
  cursor: pointer;
  min-height: 56px;
  transition:
    border-color var(--transition-fast, 150ms ease),
    background var(--transition-fast, 150ms ease);
}

.export-format-option:hover {
  border-color: var(--color-primary-light, #2d545e);
}

.export-format-selected {
  border-color: var(--color-primary, #23424a);
  background: rgba(35, 66, 74, 0.04);
}

.export-radio {
  min-width: 18px;
  min-height: 18px;
  cursor: pointer;
  accent-color: var(--color-primary, #23424a);
}

.export-format-icon {
  width: 24px;
  height: 24px;
  color: var(--color-primary, #23424a);
  flex-shrink: 0;
}

.export-format-label {
  font-size: var(--font-size-sm, 0.875rem);
  font-weight: var(--font-weight-medium, 500);
  color: var(--text-primary, #1f2a2a);
}

/* === Footer === */
.export-footer {
  display: flex;
  gap: var(--spacing-3, 0.75rem);
  padding: var(--spacing-4);
  border-top: 1px solid var(--border-color, #d1d5db);
  background: var(--bg-primary, white);
  position: sticky;
  bottom: 0;
}

.export-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: var(--spacing-2) var(--spacing-6);
  border-radius: var(--border-radius, 8px);
  font-size: var(--font-size-base, 1rem);
  font-weight: var(--font-weight-semibold, 600);
  cursor: pointer;
  transition: all var(--transition-fast, 150ms ease);
  border: none;
}

.export-btn-secondary {
  flex: 1;
  background: var(--bg-primary, white);
  color: var(--text-secondary, #4a5a5a);
  border: 1px solid var(--border-color, #d1d5db);
}

.export-btn-secondary:hover {
  background: var(--bg-secondary, #f3f4f6);
}

.export-btn-primary {
  flex: 2;
  background: linear-gradient(135deg, var(--color-primary, #23424a) 0%, #2d5560 100%);
  color: white;
}

.export-btn-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(35, 66, 74, 0.3);
}

.export-btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

/* === Transitions === */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-active .export-modal,
.modal-leave-active .export-modal {
  transition: transform 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .export-modal,
.modal-leave-to .export-modal {
  transform: translateY(100%);
}

/* === Tablet+ (768px) === */
@media (min-width: 768px) {
  .export-backdrop {
    align-items: center;
    padding: var(--spacing-6, 1.5rem);
  }

  .export-modal {
    max-width: 520px;
    max-height: 88vh;
    border-radius: var(--border-radius-md, 12px);
  }

  .export-section-header {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }

  .export-columns-grid {
    grid-template-columns: 1fr 1fr;
  }

  .export-footer {
    justify-content: flex-end;
  }

  .export-btn-secondary {
    flex: 0 0 auto;
    min-width: 100px;
  }

  .export-btn-primary {
    flex: 0 0 auto;
    min-width: 160px;
  }

  .modal-enter-from .export-modal,
  .modal-leave-to .export-modal {
    transform: scale(0.95);
  }
}
</style>

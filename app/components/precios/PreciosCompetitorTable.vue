<script setup lang="ts">
// N2 — Competitor comparison table: Tracciona vs Mascus vs Wallapop vs Excel
// Shows 8 dimensions so visitors understand the differentiation clearly.

const { t } = useI18n()

interface CompetitorRow {
  label: string
  tracciona: string
  mascus: string
  wallapop: string
  excel: string
  highlight?: boolean
}

const rows = computed<CompetitorRow[]>(() => [
  {
    label: t('landing.competitor.rowCost'),
    tracciona: t('landing.competitor.traccionaCost'),
    mascus: t('landing.competitor.mascusCost'),
    wallapop: t('landing.competitor.wallapopCost'),
    excel: t('landing.competitor.excelCost'),
  },
  {
    label: t('landing.competitor.rowAudience'),
    tracciona: t('landing.competitor.traccionaAudience'),
    mascus: t('landing.competitor.mascusAudience'),
    wallapop: t('landing.competitor.wallapopAudience'),
    excel: t('landing.competitor.excelAudience'),
  },
  {
    label: t('landing.competitor.rowAI'),
    tracciona: t('landing.competitor.traccionaAI'),
    mascus: t('landing.competitor.mascusAI'),
    wallapop: t('landing.competitor.wallapopAI'),
    excel: t('landing.competitor.excelAI'),
    highlight: true,
  },
  {
    label: t('landing.competitor.rowTools'),
    tracciona: t('landing.competitor.traccionaTools'),
    mascus: t('landing.competitor.mascusTools'),
    wallapop: t('landing.competitor.wallapopTools'),
    excel: t('landing.competitor.excelTools'),
    highlight: true,
  },
  {
    label: t('landing.competitor.rowBilingual'),
    tracciona: t('landing.competitor.traccionaBilingual'),
    mascus: t('landing.competitor.mascusBilingual'),
    wallapop: t('landing.competitor.wallapopBilingual'),
    excel: t('landing.competitor.excelBilingual'),
  },
  {
    label: t('landing.competitor.rowVerification'),
    tracciona: t('landing.competitor.traccionaVerification'),
    mascus: t('landing.competitor.mascusVerification'),
    wallapop: t('landing.competitor.wallapopVerification'),
    excel: t('landing.competitor.excelVerification'),
  },
  {
    label: t('landing.competitor.rowData'),
    tracciona: t('landing.competitor.traccionaData'),
    mascus: t('landing.competitor.mascusData'),
    wallapop: t('landing.competitor.wallapopData'),
    excel: t('landing.competitor.excelData'),
    highlight: true,
  },
  {
    label: t('landing.competitor.rowSupport'),
    tracciona: t('landing.competitor.traccionaSupport'),
    mascus: t('landing.competitor.mascusSupport'),
    wallapop: t('landing.competitor.wallapopSupport'),
    excel: t('landing.competitor.excelSupport'),
  },
])
</script>

<template>
  <section class="competitor-section">
    <div class="competitor-header">
      <h2 class="competitor-title">{{ $t('landing.competitor.title') }}</h2>
      <p class="competitor-subtitle">{{ $t('landing.competitor.subtitle') }}</p>
    </div>

    <!-- Mobile: card per competitor -->
    <div class="competitor-mobile">
      <div
        v-for="row in rows"
        :key="row.label"
        class="competitor-row-card"
        :class="{ 'competitor-row-card--highlight': row.highlight }"
      >
        <div class="row-label">{{ row.label }}</div>
        <div class="row-cells">
          <div class="row-cell row-cell--tracciona">
            <span class="cell-platform">Tracciona</span>
            <span class="cell-value">{{ row.tracciona }}</span>
          </div>
          <div class="row-cell">
            <span class="cell-platform">Mascus</span>
            <span class="cell-value cell-value--muted">{{ row.mascus }}</span>
          </div>
          <div class="row-cell">
            <span class="cell-platform">Wallapop</span>
            <span class="cell-value cell-value--muted">{{ row.wallapop }}</span>
          </div>
          <div class="row-cell">
            <span class="cell-platform">Excel</span>
            <span class="cell-value cell-value--muted">{{ row.excel }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Desktop: full table -->
    <div class="competitor-table-wrap">
      <table class="competitor-table">
        <thead>
          <tr>
            <th class="col-feature">{{ $t('landing.competitor.colFeature') }}</th>
            <th class="col-tracciona">
              <span class="platform-badge platform-badge--tracciona">Tracciona</span>
            </th>
            <th class="col-other">Mascus</th>
            <th class="col-other">Wallapop</th>
            <th class="col-other">Excel</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in rows" :key="row.label" :class="{ 'row--highlight': row.highlight }">
            <td class="feature-label">{{ row.label }}</td>
            <td class="tracciona-cell">{{ row.tracciona }}</td>
            <td class="other-cell">{{ row.mascus }}</td>
            <td class="other-cell">{{ row.wallapop }}</td>
            <td class="other-cell">{{ row.excel }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <p class="competitor-cta">{{ $t('landing.competitor.cta') }}</p>
  </section>
</template>

<style scoped>
.competitor-section {
  margin: var(--spacing-16) 0 var(--spacing-8);
}

.competitor-header {
  text-align: center;
  margin-bottom: var(--spacing-8);
}

.competitor-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--color-text);
  margin: 0 0 var(--spacing-3);
}

.competitor-subtitle {
  font-size: 1rem;
  color: var(--color-gray-500);
  margin: 0 auto;
  max-width: 36rem;
}

/* Mobile cards */
.competitor-mobile {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
}

.competitor-table-wrap {
  display: none;
}

.competitor-row-card {
  background: var(--bg-primary);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-4);
  box-shadow: var(--shadow-card);
}

.competitor-row-card--highlight {
  border-left: 3px solid var(--color-primary);
}

.row-label {
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--color-gray-700);
  margin-bottom: var(--spacing-3);
}

.row-cells {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-2);
}

.row-cell {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  padding: var(--spacing-2);
  border-radius: var(--border-radius);
  background: var(--bg-secondary);
}

.row-cell--tracciona {
  background: color-mix(in srgb, var(--color-primary) 8%, transparent);
}

.cell-platform {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--color-gray-500);
}

.row-cell--tracciona .cell-platform {
  color: var(--color-primary);
}

.cell-value {
  font-size: 0.8rem;
  color: var(--color-text);
  font-weight: 500;
}

.cell-value--muted {
  color: var(--color-gray-500);
  font-weight: 400;
}

/* Desktop table */
@media (min-width: 48em) {
  .competitor-mobile {
    display: none;
  }

  .competitor-table-wrap {
    display: block;
    overflow-x: auto;
    border-radius: var(--border-radius-md);
    box-shadow: var(--shadow-card);
  }

  .competitor-table {
    width: 100%;
    border-collapse: collapse;
    background: var(--bg-primary);
    font-size: 0.9rem;
  }

  .competitor-table thead tr {
    background: var(--color-primary);
    color: white;
  }

  .competitor-table th {
    padding: var(--spacing-4) var(--spacing-5);
    text-align: left;
    font-weight: 600;
    font-size: 0.85rem;
  }

  .col-feature {
    width: 25%;
    min-width: 10rem;
  }

  .col-tracciona {
    background: color-mix(in srgb, var(--color-primary) 15%, transparent);
  }

  .col-other {
    width: 18.75%;
    color: rgba(255, 255, 255, 0.8);
  }

  .platform-badge {
    font-size: 0.9rem;
    font-weight: 700;
  }

  .platform-badge--tracciona {
    color: white;
  }

  .competitor-table tbody tr {
    border-bottom: 1px solid var(--border-color-light);
    transition: background 0.15s;
  }

  .competitor-table tbody tr:hover {
    background: var(--bg-secondary);
  }

  .competitor-table tbody tr.row--highlight {
    background: color-mix(in srgb, var(--color-primary) 4%, transparent);
  }

  .competitor-table tbody tr.row--highlight:hover {
    background: color-mix(in srgb, var(--color-primary) 8%, transparent);
  }

  .feature-label {
    padding: var(--spacing-4) var(--spacing-5);
    font-weight: 600;
    color: var(--color-gray-800);
  }

  .tracciona-cell {
    padding: var(--spacing-4) var(--spacing-5);
    font-weight: 500;
    color: var(--color-primary-dark, var(--color-primary));
    background: color-mix(in srgb, var(--color-primary) 4%, transparent);
  }

  .other-cell {
    padding: var(--spacing-4) var(--spacing-5);
    color: var(--color-gray-500);
  }
}

.competitor-cta {
  text-align: center;
  margin-top: var(--spacing-6);
  font-size: 0.9rem;
  color: var(--color-gray-500);
  font-style: italic;
}
</style>

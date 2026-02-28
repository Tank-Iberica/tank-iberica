<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const supabase = useSupabaseClient()

interface VehicleOption {
  id: string
  label: string
  source: 'vehicles' | 'historico'
}

// Active tool
const activeTool = ref<'facturas' | 'contratos' | 'exportar' | null>('facturas')

// Available vehicles for selection
const vehicleOptions = ref<VehicleOption[]>([])
const loadingVehicles = ref(false)

// Load vehicles from database
async function loadVehicleOptions() {
  loadingVehicles.value = true
  try {
    // Load active vehicles
    const { data: vehicles } = await supabase
      .from('vehicles')
      .select('id, brand, model, year')
      .order('brand')

    // Load historical vehicles if table exists
    let historico: { id: string; brand: string; model: string; year?: number }[] = []
    try {
      const { data } = await supabase
        .from('historico')
        .select('id, brand, model, year')
        .order('brand')
      if (data) historico = data as unknown as typeof historico
    } catch {
      // Table might not exist yet
    }

    const options: VehicleOption[] = []

    if (vehicles) {
      for (const v of vehicles) {
        options.push({
          id: `V-${v.id}`,
          label: `${v.brand || ''} ${v.model || ''} - ${v.year || ''}`,
          source: 'vehicles',
        })
      }
    }

    for (const h of historico) {
      options.push({
        id: `H-${h.id}`,
        label: `${h.brand || ''} ${h.model || ''} [H]`,
        source: 'historico',
      })
    }

    vehicleOptions.value = options
  } finally {
    loadingVehicles.value = false
  }
}

function selectTool(tool: 'facturas' | 'contratos' | 'exportar') {
  activeTool.value = tool
  loadVehicleOptions()
}

// Load data on mount
onMounted(async () => {
  await loadVehicleOptions()
})
</script>

<template>
  <div class="utilidades-page">
    <!-- Header -->
    <header class="page-header">
      <h1>🛠️ Utilidades</h1>
      <p class="subtitle">Herramientas de gestión financiera</p>
    </header>

    <!-- Tool Cards -->
    <div class="tools-grid">
      <!-- Generador de Facturas -->
      <div
        class="tool-card"
        :class="{ active: activeTool === 'facturas' }"
        @click="selectTool('facturas')"
      >
        <div class="tool-icon">🧾</div>
        <div class="tool-info">
          <h3>{{ $t('admin.utilidades.invoiceTitle') }}</h3>
          <p>{{ $t('admin.utilidades.invoiceDesc') }}</p>
        </div>
      </div>

      <!-- Generador de Contratos -->
      <div
        class="tool-card"
        :class="{ active: activeTool === 'contratos' }"
        @click="selectTool('contratos')"
      >
        <div class="tool-icon">📝</div>
        <div class="tool-info">
          <h3>{{ $t('admin.utilidades.contractTitle') }}</h3>
          <p>{{ $t('admin.utilidades.contractDesc') }}</p>
        </div>
      </div>

      <!-- Exportar Balance -->
      <div
        class="tool-card"
        :class="{ active: activeTool === 'exportar' }"
        @click="activeTool = 'exportar'"
      >
        <div class="tool-icon">📊</div>
        <div class="tool-info">
          <h3>{{ $t('admin.utilidades.exportTitle') }}</h3>
          <p>{{ $t('admin.utilidades.exportDesc') }}</p>
        </div>
      </div>
    </div>

    <!-- Invoice Generator Component -->
    <AdminUtilidadesInvoiceGenerator
      v-if="activeTool === 'facturas'"
      :vehicle-options="vehicleOptions"
      :loading-vehicles="loadingVehicles"
    />

    <!-- Contract Generator Component -->
    <AdminUtilidadesContractGenerator
      v-if="activeTool === 'contratos'"
      :vehicle-options="vehicleOptions"
      :loading-vehicles="loadingVehicles"
    />

    <!-- Balance Exporter Component -->
    <AdminUtilidadesBalanceExporter v-if="activeTool === 'exportar'" />
  </div>
</template>

<style scoped>
.utilidades-page {
  max-width: 1000px;
  margin: 0 auto;
}

/* Header */
.page-header {
  margin-bottom: 24px;
}

.page-header h1 {
  margin: 0 0 4px;
  font-size: 1.5rem;
}

.subtitle {
  margin: 0;
  color: #6b7280;
  font-size: 0.9rem;
}

/* Tools Grid */
.tools-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.tool-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: #fff;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.tool-card:hover:not(.disabled) {
  border-color: #23424a;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.tool-card.active {
  border-color: #23424a;
  background: #f0f9ff;
}

.tool-card.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.tool-icon {
  font-size: 2rem;
  flex-shrink: 0;
}

.tool-info h3 {
  margin: 0 0 4px;
  font-size: 1rem;
}

.tool-info p {
  margin: 0;
  color: #6b7280;
  font-size: 0.8rem;
}

/* Mobile */
@media (max-width: 768px) {
  .tools-grid {
    grid-template-columns: 1fr;
  }
}
</style>

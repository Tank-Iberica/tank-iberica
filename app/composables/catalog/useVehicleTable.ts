import type { Vehicle } from '~/composables/useVehicles'
import { generateVehiclePdf } from '~/utils/generatePdf'

export type SortCol =
  | 'category'
  | 'price'
  | 'product'
  | 'brand'
  | 'model'
  | 'year'
  | 'volume'
  | 'compartments'
  | 'power'
  | 'location'

export function useVehicleTable(getVehicles: () => readonly Vehicle[]) {
  const { t, locale } = useI18n()
  const { location: userLocation } = useUserLocation()
  const router = useRouter()
  const { toggle: toggleFav, isFavorite } = useFavorites()

  // --- Selection for PDF export ---
  const selectedIds = ref<Set<string>>(new Set())
  const showPdfModal = ref(false)

  function toggleSelect(id: string) {
    const next = new Set(selectedIds.value)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    selectedIds.value = next
  }

  function onPdfHeaderClick() {
    showPdfModal.value = true
  }

  function selectAll() {
    const all = new Set<string>()
    for (const v of sortedVehicles.value) {
      all.add(v.id)
    }
    selectedIds.value = all
  }

  async function confirmExportPdf() {
    showPdfModal.value = false
    const selected = sortedVehicles.value.filter((v) => selectedIds.value.has(v.id))
    for (const vehicle of selected) {
      await generateVehiclePdf({
        vehicle,
        locale: locale.value,
        productName: buildProductName(vehicle, locale.value, true),
        priceText: priceText(vehicle),
      })
    }
  }

  // --- Sorting ---
  const sortColumn = ref<SortCol | null>(null)
  const sortDir = ref<'asc' | 'desc'>('asc')

  function toggleSort(col: SortCol) {
    if (sortColumn.value === col) {
      sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
    } else {
      sortColumn.value = col
      sortDir.value = 'asc'
    }
  }

  function sortClass(col: SortCol): string {
    if (sortColumn.value !== col) return ''
    return sortDir.value === 'asc' ? 'sorted-asc' : 'sorted-desc'
  }

  // --- Dynamic columns detection ---
  const showVolumeCol = computed(() =>
    getVehicles().some((v) => {
      const fj = v.attributes_json
      return fj && (fj.volume || fj.capacity || fj.volumen || fj.capacidad)
    }),
  )
  const showCompartmentsCol = computed(() =>
    getVehicles().some((v) => {
      const fj = v.attributes_json
      return fj && (fj.compartments || fj.compartimentos)
    }),
  )
  const showPowerCol = computed(() =>
    getVehicles().some((v) => {
      const fj = v.attributes_json
      return fj && (fj.power || fj.potencia || fj.cv)
    }),
  )

  // --- Sorted vehicles ---
  const sortedVehicles = computed(() => {
    const list = [...getVehicles()]
    if (!sortColumn.value) return list

    const col = sortColumn.value
    const dir = sortDir.value === 'asc' ? 1 : -1

    list.sort((a, b) => {
      let va: string | number = ''
      let vb: string | number = ''

      switch (col) {
        case 'category':
          va = a.category
          vb = b.category
          break
        case 'price':
          va = getPrice(a)
          vb = getPrice(b)
          break
        case 'product':
          va = buildProductName(a, locale.value)
          vb = buildProductName(b, locale.value)
          break
        case 'brand':
          va = a.brand
          vb = b.brand
          break
        case 'model':
          va = a.model
          vb = b.model
          break
        case 'year':
          va = a.year ?? 0
          vb = b.year ?? 0
          break
        case 'volume':
          va = getVolume(a)
          vb = getVolume(b)
          break
        case 'compartments':
          va = getCompartments(a)
          vb = getCompartments(b)
          break
        case 'power':
          va = getPower(a)
          vb = getPower(b)
          break
        case 'location':
          va = a.location ?? ''
          vb = b.location ?? ''
          break
      }

      if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * dir
      return String(va).localeCompare(String(vb)) * dir
    })

    return list
  })

  // --- Helpers ---
  function navigateTo(slug: string) {
    router.push(`/vehiculo/${slug}`)
  }

  function firstImage(vehicle: Vehicle): string | undefined {
    if (!vehicle.vehicle_images?.length) return undefined
    const sorted = [...vehicle.vehicle_images].sort((a, b) => a.position - b.position)
    return sorted[0]?.thumbnail_url || sorted[0]?.url || undefined
  }

  function getPrice(v: Vehicle): number {
    if (v.category === 'alquiler' && v.rental_price) return v.rental_price
    return v.price ?? 0
  }

  function priceText(vehicle: Vehicle): string {
    if (vehicle.category === 'terceros') return t('catalog.solicitar')
    if (vehicle.category === 'alquiler' && vehicle.rental_price) {
      const formatted = new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: 'EUR',
        maximumFractionDigits: 0,
      }).format(vehicle.rental_price)
      return `${formatted}/${t('catalog.month')}`
    }
    if (vehicle.price) {
      return new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: 'EUR',
        maximumFractionDigits: 0,
      }).format(vehicle.price)
    }
    return t('catalog.solicitar')
  }

  function locationLabel(vehicle: Vehicle): string {
    const loc =
      locale.value === 'en' && vehicle.location_en ? vehicle.location_en : vehicle.location
    if (!loc) return '—'
    const vehicleCountry = vehicle.location_country
    const bothInSpain = userLocation.value.country === 'ES' && vehicleCountry === 'ES'
    if (bothInSpain) {
      return loc.replace(/,?\s*(España|Spain)\s*$/i, '').trim()
    }
    return loc
  }

  function locationFlagCode(vehicle: Vehicle): string | null {
    const vehicleCountry = vehicle.location_country
    if (!vehicleCountry) return null
    if (userLocation.value.country === 'ES' && vehicleCountry === 'ES') return null
    return vehicleCountry.toLowerCase()
  }

  function getVolume(v: Vehicle): number {
    const fj = v.attributes_json
    if (!fj) return 0
    return Number(fj.volume || fj.volumen || fj.capacity || fj.capacidad || 0)
  }

  function volumeText(v: Vehicle): string {
    const fj = v.attributes_json
    if (!fj) return '—'
    if (fj.volume || fj.volumen) return `${fj.volume || fj.volumen} L`
    if (fj.capacity || fj.capacidad) return `${fj.capacity || fj.capacidad} kg`
    return '—'
  }

  function getPower(v: Vehicle): number {
    const fj = v.attributes_json
    if (!fj) return 0
    return Number(fj.power || fj.potencia || fj.cv || 0)
  }

  function powerText(v: Vehicle): string {
    const fj = v.attributes_json
    if (!fj) return '—'
    const val = fj.power || fj.potencia || fj.cv
    return val ? `${val} CV` : '—'
  }

  function getCompartments(v: Vehicle): number {
    const fj = v.attributes_json
    if (!fj) return 0
    return Number(fj.compartments || fj.compartimentos || 0)
  }

  function compartmentsText(v: Vehicle): string {
    const fj = v.attributes_json
    if (!fj) return '—'
    const val = fj.compartments || fj.compartimentos
    return val ? String(val) : '—'
  }

  async function downloadBrochure(vehicle: Vehicle) {
    await generateVehiclePdf({
      vehicle,
      locale: locale.value,
      productName: buildProductName(vehicle, locale.value, true),
      priceText: priceText(vehicle),
    })
  }

  async function shareVehicle(vehicle: Vehicle) {
    const url = `${window.location.origin}/vehiculo/${vehicle.slug}`
    const title = buildProductName(vehicle, locale.value)
    if (navigator.share) {
      try {
        await navigator.share({ title, url })
      } catch {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(url)
    }
  }

  return {
    locale,
    selectedIds,
    showPdfModal,
    toggleSelect,
    onPdfHeaderClick,
    selectAll,
    confirmExportPdf,
    sortClass,
    toggleSort,
    showVolumeCol,
    showCompartmentsCol,
    showPowerCol,
    sortedVehicles,
    navigateTo,
    firstImage,
    priceText,
    locationLabel,
    locationFlagCode,
    volumeText,
    powerText,
    compartmentsText,
    downloadBrochure,
    shareVehicle,
    toggleFav,
    isFavorite,
  }
}

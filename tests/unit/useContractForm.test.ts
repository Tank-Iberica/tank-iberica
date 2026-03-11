import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useContractForm } from '../../app/composables/admin/useContractForm'

// ─── Supabase helpers ─────────────────────────────────────────────────────

function makeSupabaseWithVehicles(
  vehicles: Record<string, unknown>[] = [],
  error: unknown = null,
) {
  return {
    from: () => ({
      select: () => ({
        eq: () => ({
          order: () => Promise.resolve({ data: vehicles, error }),
        }),
      }),
      update: () => ({
        eq: () => Promise.resolve({ data: null, error: null }),
      }),
    }),
  }
}

beforeEach(() => {
  vi.stubGlobal('useSupabaseClient', () => makeSupabaseWithVehicles())
})

// ─── Initial state ─────────────────────────────────────────────────────────

describe('initial state', () => {
  it('contractType starts as "arrendamiento"', () => {
    const c = useContractForm()
    expect(c.contractType.value).toBe('arrendamiento')
  })

  it('clientType starts as "persona"', () => {
    const c = useContractForm()
    expect(c.clientType.value).toBe('persona')
  })

  it('contractMonthlyRent starts as 1200', () => {
    const c = useContractForm()
    expect(c.contractMonthlyRent.value).toBe(1200)
  })

  it('contractDeposit starts as 2400', () => {
    const c = useContractForm()
    expect(c.contractDeposit.value).toBe(2400)
  })

  it('contractDuration starts as 8', () => {
    const c = useContractForm()
    expect(c.contractDuration.value).toBe(8)
  })

  it('contractDurationUnit starts as "meses"', () => {
    const c = useContractForm()
    expect(c.contractDurationUnit.value).toBe('meses')
  })

  it('contractHasPurchaseOption starts as true', () => {
    const c = useContractForm()
    expect(c.contractHasPurchaseOption.value).toBe(true)
  })

  it('contractPurchasePrice starts as 10000', () => {
    const c = useContractForm()
    expect(c.contractPurchasePrice.value).toBe(10000)
  })

  it('contractPurchaseNotice starts as 14', () => {
    const c = useContractForm()
    expect(c.contractPurchaseNotice.value).toBe(14)
  })

  it('contractRentMonthsToDiscount starts as 3', () => {
    const c = useContractForm()
    expect(c.contractRentMonthsToDiscount.value).toBe(3)
  })

  it('contractSalePrice starts as 0', () => {
    const c = useContractForm()
    expect(c.contractSalePrice.value).toBe(0)
  })

  it('contractVehicleResidualValue starts as 13000', () => {
    const c = useContractForm()
    expect(c.contractVehicleResidualValue.value).toBe(13000)
  })

  it('loadingVehicles starts as false', () => {
    const c = useContractForm()
    expect(c.loadingVehicles.value).toBe(false)
  })

  it('vehicleOptions starts as empty array', () => {
    const c = useContractForm()
    expect(c.vehicleOptions.value).toHaveLength(0)
  })

  it('contractLocation starts as empty string', () => {
    const c = useContractForm()
    expect(c.contractLocation.value).toBe('')
  })

  it('contractPaymentDays starts as 10', () => {
    const c = useContractForm()
    expect(c.contractPaymentDays.value).toBe(10)
  })
})

// ─── loadVehicleOptions ────────────────────────────────────────────────────

describe('loadVehicleOptions', () => {
  it('returns early for empty dealerId', async () => {
    const c = useContractForm()
    await c.loadVehicleOptions('')
    expect(c.vehicleOptions.value).toHaveLength(0)
  })

  it('sets loadingVehicles to false after loading', async () => {
    const c = useContractForm()
    await c.loadVehicleOptions('dealer-1')
    expect(c.loadingVehicles.value).toBe(false)
  })

  it('populates vehicleOptions from supabase data', async () => {
    vi.stubGlobal(
      'useSupabaseClient',
      () =>
        makeSupabaseWithVehicles([
          { id: 'v1', brand: 'Volvo', model: 'FH16', plate: '1234ABC', year: 2020 },
        ]),
    )
    const c = useContractForm()
    await c.loadVehicleOptions('dealer-1')
    expect(c.vehicleOptions.value).toHaveLength(1)
  })

  it('vehicle label includes brand, model, plate and year', async () => {
    vi.stubGlobal(
      'useSupabaseClient',
      () =>
        makeSupabaseWithVehicles([
          { id: 'v1', brand: 'Volvo', model: 'FH16', plate: '1234ABC', year: 2020 },
        ]),
    )
    const c = useContractForm()
    await c.loadVehicleOptions('dealer-1')
    expect(c.vehicleOptions.value[0]!.label).toContain('Volvo')
    expect(c.vehicleOptions.value[0]!.label).toContain('1234ABC')
  })

  it('detects "semirremolque cisterna" vehicle type from brand/model containing cisterna', async () => {
    vi.stubGlobal(
      'useSupabaseClient',
      () =>
        makeSupabaseWithVehicles([
          { id: 'v1', brand: 'Cisterna', model: 'Renault', plate: '', year: 2020 },
        ]),
    )
    const c = useContractForm()
    await c.loadVehicleOptions('dealer-1')
    expect(c.vehicleOptions.value[0]!.vehicleType).toBe('semirremolque cisterna')
  })

  it('detects "camion" vehicle type from brand containing camion', async () => {
    vi.stubGlobal(
      'useSupabaseClient',
      () =>
        makeSupabaseWithVehicles([
          { id: 'v1', brand: 'Camion', model: 'Mercedes', plate: '', year: 2019 },
        ]),
    )
    const c = useContractForm()
    await c.loadVehicleOptions('dealer-1')
    expect(c.vehicleOptions.value[0]!.vehicleType).toBe('camion')
  })

  it('defaults to "vehiculo" for unknown vehicle type', async () => {
    vi.stubGlobal(
      'useSupabaseClient',
      () =>
        makeSupabaseWithVehicles([
          { id: 'v1', brand: 'Unknown', model: 'Brand', plate: '', year: 2020 },
        ]),
    )
    const c = useContractForm()
    await c.loadVehicleOptions('dealer-1')
    expect(c.vehicleOptions.value[0]!.vehicleType).toBe('vehiculo')
  })

  it('keeps vehicleOptions empty when data is null', async () => {
    vi.stubGlobal('useSupabaseClient', () => makeSupabaseWithVehicles([], null))
    const c = useContractForm()
    await c.loadVehicleOptions('dealer-1')
    expect(c.vehicleOptions.value).toHaveLength(0)
  })
})

// ─── onContractVehicleSelected ────────────────────────────────────────────

describe('onContractVehicleSelected', () => {
  it('returns early when contractVehicle is empty', () => {
    const c = useContractForm()
    c.contractVehicle.value = ''
    c.onContractVehicleSelected()
    expect(c.contractVehiclePlate.value).toBe('')
  })

  it('sets contractVehiclePlate from matching vehicle option', () => {
    const c = useContractForm()
    c.vehicleOptions.value = [{ id: 'v1', label: 'Volvo FH16', plate: 'TEST001', vehicleType: 'camion' }]
    c.contractVehicle.value = 'v1'
    c.onContractVehicleSelected()
    expect(c.contractVehiclePlate.value).toBe('TEST001')
  })

  it('sets contractVehicleType from matching vehicle option', () => {
    const c = useContractForm()
    c.vehicleOptions.value = [{ id: 'v1', label: 'Cisterna', plate: '', vehicleType: 'semirremolque cisterna' }]
    c.contractVehicle.value = 'v1'
    c.onContractVehicleSelected()
    expect(c.contractVehicleType.value).toBe('semirremolque cisterna')
  })

  it('does nothing when vehicle id is not in vehicleOptions', () => {
    const c = useContractForm()
    c.vehicleOptions.value = [{ id: 'v1', label: 'Volvo', plate: 'AAA', vehicleType: 'camion' }]
    c.contractVehicle.value = 'nonexistent'
    c.onContractVehicleSelected()
    expect(c.contractVehiclePlate.value).toBe('')
  })
})

// ─── prefillFromDealer ────────────────────────────────────────────────────

describe('prefillFromDealer', () => {
  it('sets lessorCompany from legal_name when present', () => {
    const c = useContractForm()
    c.prefillFromDealer({ legal_name: 'Acme Legal SL', company_name: 'Acme', cif_nif: 'B12345678' })
    expect(c.lessorCompany.value).toBe('Acme Legal SL')
  })

  it('falls back to company_name string when no legal_name', () => {
    const c = useContractForm()
    c.prefillFromDealer({ company_name: 'Acme Trade SL', cif_nif: 'B12345678' })
    expect(c.lessorCompany.value).toBe('Acme Trade SL')
  })

  it('extracts .es from company_name object', () => {
    const c = useContractForm()
    c.prefillFromDealer({ company_name: { es: 'Empresa ES', en: 'Company EN' }, cif_nif: '' })
    expect(c.lessorCompany.value).toBe('Empresa ES')
  })

  it('sets lessorCIF from cif_nif', () => {
    const c = useContractForm()
    c.prefillFromDealer({ legal_name: 'Test SL', cif_nif: 'B87654321' })
    expect(c.lessorCIF.value).toBe('B87654321')
  })

  it('sets lessorAddress from location_data.es', () => {
    const c = useContractForm()
    c.prefillFromDealer({ location_data: { es: 'Madrid', en: 'Madrid' } })
    expect(c.lessorAddress.value).toBe('Madrid')
  })

  it('sets lessorAddress from location string when no location_data', () => {
    const c = useContractForm()
    c.prefillFromDealer({ location: 'Barcelona' })
    expect(c.lessorAddress.value).toBe('Barcelona')
  })

  it('sets contractLocation when empty', () => {
    const c = useContractForm()
    c.contractLocation.value = ''
    c.prefillFromDealer({ location: 'Valencia' })
    expect(c.contractLocation.value).toBe('Valencia')
  })

  it('does not overwrite contractLocation when already set', () => {
    const c = useContractForm()
    c.contractLocation.value = 'Existing location'
    c.prefillFromDealer({ location: 'Valencia' })
    expect(c.contractLocation.value).toBe('Existing location')
  })

  it('sets contractJurisdiction when empty', () => {
    const c = useContractForm()
    c.prefillFromDealer({ location: 'Sevilla' })
    expect(c.contractJurisdiction.value).toBe('Sevilla')
  })

  it('returns early for null/falsy dealer', () => {
    const c = useContractForm()
    // @ts-expect-error - testing null guard
    c.prefillFromDealer(null)
    expect(c.lessorCompany.value).toBe('')
  })
})

// ─── resetForm ────────────────────────────────────────────────────────────

describe('resetForm', () => {
  it('resets contractType to "arrendamiento"', () => {
    const c = useContractForm()
    c.contractType.value = 'compraventa'
    c.resetForm()
    expect(c.contractType.value).toBe('arrendamiento')
  })

  it('resets clientType to "persona"', () => {
    const c = useContractForm()
    c.clientType.value = 'empresa'
    c.resetForm()
    expect(c.clientType.value).toBe('persona')
  })

  it('resets clientName to empty string', () => {
    const c = useContractForm()
    c.clientName.value = 'John Doe'
    c.resetForm()
    expect(c.clientName.value).toBe('')
  })

  it('resets contractMonthlyRent to 1200', () => {
    const c = useContractForm()
    c.contractMonthlyRent.value = 5000
    c.resetForm()
    expect(c.contractMonthlyRent.value).toBe(1200)
  })

  it('resets contractDuration to 8', () => {
    const c = useContractForm()
    c.contractDuration.value = 24
    c.resetForm()
    expect(c.contractDuration.value).toBe(8)
  })

  it('resets contractDurationUnit to "meses"', () => {
    const c = useContractForm()
    c.contractDurationUnit.value = 'anos'
    c.resetForm()
    expect(c.contractDurationUnit.value).toBe('meses')
  })

  it('resets contractSalePrice to 0', () => {
    const c = useContractForm()
    c.contractSalePrice.value = 50000
    c.resetForm()
    expect(c.contractSalePrice.value).toBe(0)
  })

  it('resets contractSalePaymentMethod to "Transferencia bancaria"', () => {
    const c = useContractForm()
    c.contractSalePaymentMethod.value = 'Efectivo'
    c.resetForm()
    expect(c.contractSalePaymentMethod.value).toBe('Transferencia bancaria')
  })

  it('resets contractVehicleResidualValue to 13000', () => {
    const c = useContractForm()
    c.contractVehicleResidualValue.value = 0
    c.resetForm()
    expect(c.contractVehicleResidualValue.value).toBe(13000)
  })
})

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref, readonly, computed } from 'vue'

vi.stubGlobal('ref', ref)
vi.stubGlobal('readonly', readonly)
vi.stubGlobal('computed', computed)

// ── Supabase mock ────────────────────────────────────────────────────────────

let mockQueryResult: { data: unknown[] | null; error: unknown }

vi.stubGlobal(
  'useSupabaseClient',
  vi.fn(() => {
    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn(),
    }
    chain.order.mockImplementation(() => Promise.resolve(mockQueryResult))
    return { from: vi.fn(() => chain) }
  }),
)

import {
  useCustomFields,
  validateFieldValue,
  type CustomFieldDef,
} from '~/composables/useCustomFields'

// ── Test data ────────────────────────────────────────────────────────────────

function makeDef(overrides: Partial<CustomFieldDef> = {}): CustomFieldDef {
  return {
    id: 'field-1',
    vertical: 'tracciona',
    entity_type: 'vehicle',
    field_name: 'test_field',
    field_type: 'text',
    label: { es: 'Campo', en: 'Field' },
    placeholder: { es: '', en: '' },
    validation: {},
    options: [],
    sort_order: 0,
    required: false,
    ...overrides,
  }
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('validateFieldValue (F51)', () => {
  it('returns null for valid optional empty value', () => {
    const def = makeDef({ required: false })
    expect(validateFieldValue(def, '')).toBeNull()
    expect(validateFieldValue(def, null)).toBeNull()
    expect(validateFieldValue(def, undefined)).toBeNull()
  })

  it('returns "required" for empty required field', () => {
    const def = makeDef({ required: true })
    expect(validateFieldValue(def, '')).toBe('required')
    expect(validateFieldValue(def, null)).toBe('required')
    expect(validateFieldValue(def, undefined)).toBe('required')
  })

  it('validates text maxLength', () => {
    const def = makeDef({ field_type: 'text', validation: { maxLength: 5 } })
    expect(validateFieldValue(def, 'hello')).toBeNull()
    expect(validateFieldValue(def, 'toolong')).toBe('too_long')
  })

  it('validates number type', () => {
    const def = makeDef({ field_type: 'number' })
    expect(validateFieldValue(def, 42)).toBeNull()
    expect(validateFieldValue(def, 'abc')).toBe('invalid_number')
  })

  it('validates number min/max', () => {
    const def = makeDef({
      field_type: 'number',
      validation: { min: 0, max: 100 },
    })
    expect(validateFieldValue(def, 50)).toBeNull()
    expect(validateFieldValue(def, -1)).toBe('below_min')
    expect(validateFieldValue(def, 101)).toBe('above_max')
  })

  it('validates select options', () => {
    const def = makeDef({
      field_type: 'select',
      options: [
        { value: 'a', label: { es: 'A', en: 'A' } },
        { value: 'b', label: { es: 'B', en: 'B' } },
      ],
    })
    expect(validateFieldValue(def, 'a')).toBeNull()
    expect(validateFieldValue(def, 'c')).toBe('invalid_option')
  })

  it('validates boolean type', () => {
    const def = makeDef({ field_type: 'boolean' })
    expect(validateFieldValue(def, true)).toBeNull()
    expect(validateFieldValue(def, false)).toBeNull()
    expect(validateFieldValue(def, 'true')).toBeNull()
    expect(validateFieldValue(def, 'maybe')).toBe('invalid_boolean')
  })

  it('validates date type', () => {
    const def = makeDef({ field_type: 'date' })
    expect(validateFieldValue(def, '2026-01-01')).toBeNull()
    expect(validateFieldValue(def, 'not-a-date')).toBe('invalid_date')
  })

  it('validates url type', () => {
    const def = makeDef({ field_type: 'url' })
    expect(validateFieldValue(def, 'https://example.com')).toBeNull()
    expect(validateFieldValue(def, 'not-a-url')).toBe('invalid_url')
  })
})

describe('useCustomFields (F51)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockQueryResult = { data: [], error: null }
  })

  describe('fetchFields', () => {
    it('fetches fields for a vertical', async () => {
      mockQueryResult = {
        data: [
          makeDef({ id: 'f1', field_name: 'weight' }),
          makeDef({ id: 'f2', field_name: 'length' }),
        ],
        error: null,
      }

      const { fetchFields, fields } = useCustomFields()
      await fetchFields('tracciona', 'vehicle')

      expect(fields.value).toHaveLength(2)
    })

    it('sets error on failure', async () => {
      mockQueryResult = { data: null, error: new Error('DB error') }

      const { fetchFields, error } = useCustomFields()
      await fetchFields('tracciona')

      expect(error.value).toBe('DB error')
    })

    it('manages loading state', async () => {
      mockQueryResult = { data: [], error: null }
      const { fetchFields, loading } = useCustomFields()

      expect(loading.value).toBe(false)
      const p = fetchFields('tracciona')
      expect(loading.value).toBe(true)
      await p
      expect(loading.value).toBe(false)
    })
  })

  describe('validateCustomData', () => {
    it('validates all fields against custom data', async () => {
      mockQueryResult = {
        data: [
          makeDef({ field_name: 'weight', field_type: 'number', required: true }),
          makeDef({ field_name: 'color', field_type: 'text', required: false }),
        ],
        error: null,
      }

      const { fetchFields, validateCustomData } = useCustomFields()
      await fetchFields('tracciona')

      const result = validateCustomData({ weight: 5000, color: 'blue' })
      expect(result.valid).toBe(true)
      expect(Object.keys(result.errors)).toHaveLength(0)
    })

    it('returns errors for invalid data', async () => {
      mockQueryResult = {
        data: [
          makeDef({ field_name: 'weight', field_type: 'number', required: true }),
          makeDef({ field_name: 'axles', field_type: 'number', validation: { min: 2, max: 8 } }),
        ],
        error: null,
      }

      const { fetchFields, validateCustomData } = useCustomFields()
      await fetchFields('tracciona')

      const result = validateCustomData({ weight: 'not-a-number', axles: 20 })
      expect(result.valid).toBe(false)
      expect(result.errors.weight).toBe('invalid_number')
      expect(result.errors.axles).toBe('above_max')
    })

    it('flags missing required fields', async () => {
      mockQueryResult = {
        data: [makeDef({ field_name: 'weight', required: true })],
        error: null,
      }

      const { fetchFields, validateCustomData } = useCustomFields()
      await fetchFields('tracciona')

      const result = validateCustomData({})
      expect(result.valid).toBe(false)
      expect(result.errors.weight).toBe('required')
    })
  })
})

/**
 * Composable for dynamic custom fields per vertical (F51).
 *
 * Fetches field definitions from vertical_custom_fields
 * and validates custom_data against them.
 */

export interface CustomFieldDef {
  id: string
  vertical: string
  entity_type: string
  field_name: string
  field_type: string
  label: Record<string, string>
  placeholder: Record<string, string>
  validation: Record<string, unknown>
  options: Array<{ value: string; label: Record<string, string> }>
  sort_order: number
  required: boolean
}

export interface ValidationResult {
  valid: boolean
  errors: Record<string, string>
}

/**
 * Validate a single field value against its definition.
 */
export function validateFieldValue(def: CustomFieldDef, value: unknown): string | null {
  // Required check
  if (def.required && (value === undefined || value === null || value === '')) {
    return 'required'
  }

  // Skip validation for empty optional fields
  if (value === undefined || value === null || value === '') {
    return null
  }

  switch (def.field_type) {
    case 'number': {
      const num = Number(value)
      if (Number.isNaN(num)) return 'invalid_number'
      const min = def.validation?.min as number | undefined
      const max = def.validation?.max as number | undefined
      if (min !== undefined && num < min) return 'below_min'
      if (max !== undefined && num > max) return 'above_max'
      break
    }
    case 'text': {
      const str = String(value)
      const maxLength = (def.validation?.maxLength as number) ?? 500
      if (str.length > maxLength) return 'too_long'
      break
    }
    case 'select': {
      const validValues = def.options.map((o) => o.value)
      if (!validValues.includes(String(value))) return 'invalid_option'
      break
    }
    case 'boolean': {
      if (typeof value !== 'boolean' && value !== 'true' && value !== 'false') {
        return 'invalid_boolean'
      }
      break
    }
    case 'date': {
      if (Number.isNaN(Date.parse(String(value)))) return 'invalid_date'
      break
    }
    case 'url': {
      try {
        new URL(String(value))
      } catch {
        return 'invalid_url'
      }
      break
    }
  }

  return null
}

export function useCustomFields() {
  const supabase = useSupabaseClient()

  const loading = ref(false)
  const error = ref<string | null>(null)
  const fields = ref<CustomFieldDef[]>([])

  /**
   * Fetch active field definitions for a vertical and entity type.
   */
  async function fetchFields(
    vertical: string,
    entityType: string = 'vehicle',
  ): Promise<CustomFieldDef[]> {
    loading.value = true
    error.value = null

    try {
      const { data, error: err } = await supabase
        .from('vertical_custom_fields')
        .select(
          'id, vertical, entity_type, field_name, field_type, label, placeholder, validation, options, sort_order, required',
        )
        .eq('vertical', vertical)
        .eq('entity_type', entityType)
        .eq('active', true)
        .order('sort_order', { ascending: true })

      if (err) throw err

      fields.value = (data ?? []) as unknown as CustomFieldDef[]
      return fields.value
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error loading custom fields'
      return []
    } finally {
      loading.value = false
    }
  }

  /**
   * Validate a custom_data object against field definitions.
   */
  function validateCustomData(customData: Record<string, unknown>): ValidationResult {
    const errors: Record<string, string> = {}

    for (const def of fields.value) {
      const value = customData[def.field_name]
      const fieldError = validateFieldValue(def, value)
      if (fieldError) {
        errors[def.field_name] = fieldError
      }
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors,
    }
  }

  return {
    loading: readonly(loading),
    error,
    fields: readonly(fields),
    fetchFields,
    validateCustomData,
  }
}

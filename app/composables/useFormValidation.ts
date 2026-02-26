/**
 * useFormValidation — bridges VeeValidate + Zod + Nuxt i18n.
 *
 * Usage:
 *   const { form, fields, onSubmit, errors, isSubmitting } = useFormValidation(loginSchema, {
 *     initialValues: { email: '', password: '' },
 *     onSubmit: async (values) => { ... },
 *   })
 *
 * Error messages from Zod schemas use i18n keys (e.g. 'validation.required')
 * which are automatically resolved via $t() in the translatedErrors computed.
 */
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import type { z } from 'zod'

interface UseFormValidationOptions<T extends Record<string, unknown>> {
  initialValues?: Partial<T>
  onSubmit: (values: T) => Promise<void> | void
}

export function useFormValidation<S extends z.ZodType>(
  schema: S,
  options: UseFormValidationOptions<z.infer<S>>,
) {
  type FormValues = z.infer<S>

  const { t } = useI18n()

  const typedSchema = toTypedSchema(schema)

  const form = useForm<FormValues>({
    validationSchema: typedSchema,
    initialValues: (options.initialValues ?? {}) as FormValues,
  })

  const onSubmit = form.handleSubmit(async (values) => {
    await options.onSubmit(values)
  })

  // Translate Zod error messages (they're i18n keys like 'validation.required')
  const translatedErrors = computed(() => {
    const result: Record<string, string> = {}
    for (const [key, msg] of Object.entries(form.errors.value)) {
      if (!msg) continue
      // If the message looks like an i18n key (contains a dot), translate it
      result[key] = msg.includes('.') ? t(msg) : msg
    }
    return result
  })

  return {
    form,
    defineField: form.defineField,
    errors: form.errors,
    translatedErrors,
    isSubmitting: form.isSubmitting,
    meta: form.meta,
    values: form.values,
    resetForm: form.resetForm,
    setFieldValue: form.setFieldValue,
    setFieldError: form.setFieldError,
    onSubmit,
  }
}

/**
 * useReports — DSA content reporting composable
 */
export function useReports() {
  const supabase = useSupabaseClient()

  const submitting = ref(false)
  const submitted = ref(false)
  const error = ref<string | null>(null)

  async function submitReport(report: {
    reporter_email: string
    entity_type: 'vehicle' | 'dealer' | 'article' | 'comment'
    entity_id: string
    reason: string
    details?: string
  }): Promise<boolean> {
    submitting.value = true
    error.value = null
    submitted.value = false

    try {
      const { error: err } = await supabase.from('reports').insert({
        reporter_email: report.reporter_email,
        entity_type: report.entity_type,
        entity_id: report.entity_id,
        reason: report.reason,
        details: report.details || null,
      })

      if (err) throw err
      submitted.value = true
      return true
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error submitting report'
      return false
    } finally {
      submitting.value = false
    }
  }

  function reset() {
    submitting.value = false
    submitted.value = false
    error.value = null
  }

  return {
    submitting: readonly(submitting),
    submitted: readonly(submitted),
    error: readonly(error),
    submitReport,
    reset,
  }
}

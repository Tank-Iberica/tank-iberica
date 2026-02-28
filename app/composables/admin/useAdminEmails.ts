/**
 * Admin composable for email template management.
 * Extracts all logic from /admin/config/emails.vue.
 * Static data & types → utils/adminEmailTemplates
 */
import { useAdminVerticalConfig } from '~/composables/admin/useAdminVerticalConfig'
import {
  TEMPLATE_DEFINITIONS,
  escapeRegex,
  getSampleValue,
  type CategoryKey,
  type TemplateData,
  type TemplateStats,
} from '~/utils/adminEmailTemplates'

// Re-export types so consumers have one import point
export type {
  CategoryKey,
  TemplateDefinition,
  TemplateData,
  TemplateStats,
  EmailCategory,
} from '~/utils/adminEmailTemplates'
export { TEMPLATE_DEFINITIONS, CATEGORIES } from '~/utils/adminEmailTemplates'

// ---------------------------------------------------------------------------
// Composable
// ---------------------------------------------------------------------------

export function useAdminEmails() {
  const { sanitize } = useSanitize()
  const { t } = useI18n()
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()
  const {
    config: _config,
    loading,
    saving,
    error,
    saved,
    loadConfig,
    saveFields,
  } = useAdminVerticalConfig()

  // ── State ──
  const activeCategory = ref<CategoryKey>('dealers')
  const selectedTemplateKey = ref<string>('dealer_welcome')
  const activeLang = ref<'es' | 'en'>('es')
  const templates = ref<Record<string, TemplateData>>({})
  const templateStats = ref<Record<string, TemplateStats>>({})
  const showPreview = ref(false)
  const sendingTest = ref(false)
  const testSent = ref(false)
  const loadingStats = ref(false)

  // ── Computed ──
  const filteredTemplates = computed(() =>
    TEMPLATE_DEFINITIONS.filter((td) => td.category === activeCategory.value),
  )

  const selectedDefinition = computed(() =>
    TEMPLATE_DEFINITIONS.find((td) => td.key === selectedTemplateKey.value),
  )

  const currentTemplate = computed(() => templates.value[selectedTemplateKey.value])

  const currentStats = computed(
    () => templateStats.value[selectedTemplateKey.value] || { sent: 0, opened: 0, clicked: 0 },
  )

  const openRate = computed(() => {
    const s = currentStats.value
    if (s.sent === 0) return '0'
    return ((s.opened / s.sent) * 100).toFixed(1)
  })

  const clickRate = computed(() => {
    const s = currentStats.value
    if (s.sent === 0) return '0'
    return ((s.clicked / s.sent) * 100).toFixed(1)
  })

  const previewHtml = computed(() => {
    if (!currentTemplate.value || !selectedDefinition.value) return ''
    let body = currentTemplate.value.body[activeLang.value] || ''
    const subject = currentTemplate.value.subject[activeLang.value] || ''

    for (const v of selectedDefinition.value.variables) {
      const varName = v.replace(/\{\{|\}\}/g, '')
      body = body.replace(new RegExp(escapeRegex(v), 'g'), getSampleValue(varName))
    }

    let html = body
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" style="color:#23424A;">$1</a>')
      .replace(/^- (.*)$/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>\n?)+/g, (m) => `<ul>${m}</ul>`)
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>')

    html = `<p>${html}</p>`

    const subjectRendered = selectedDefinition.value.variables.reduce(
      (s, v) =>
        s.replace(new RegExp(escapeRegex(v), 'g'), getSampleValue(v.replace(/\{\{|\}\}/g, ''))),
      subject,
    )

    return `
    <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#fff;border:1px solid #e5e7eb;border-radius:8px;">
      <div style="background:#23424A;color:#fff;padding:16px 24px;border-radius:8px 8px 0 0;margin:-24px -24px 24px;">
        <strong>Tracciona</strong>
      </div>
      <div style="margin-bottom:16px;padding-bottom:16px;border-bottom:1px solid #e5e7eb;">
        <span style="font-size:0.85rem;color:#6b7280;">${t('admin.emails.subject')}:</span><br>
        <strong>${subjectRendered}</strong>
      </div>
      <div style="line-height:1.6;color:#374151;font-size:0.95rem;">
        ${html}
      </div>
      <div style="margin-top:32px;padding-top:16px;border-top:1px solid #e5e7eb;font-size:0.8rem;color:#9ca3af;text-align:center;">
        Tracciona — Marketplace de vehiculos industriales
      </div>
    </div>
  `
  })

  // ── Helpers ──
  function initializeTemplates(): Record<string, TemplateData> {
    const result: Record<string, TemplateData> = {}
    for (const td of TEMPLATE_DEFINITIONS) {
      result[td.key] = {
        subject: { es: td.defaultSubject.es, en: td.defaultSubject.en },
        body: { es: td.defaultBody.es, en: td.defaultBody.en },
        active: true,
      }
    }
    return result
  }

  function categoryCount(cat: CategoryKey): number {
    return TEMPLATE_DEFINITIONS.filter((td) => td.category === cat).length
  }

  // ── Data loading ──
  async function init() {
    templates.value = initializeTemplates()

    const cfg = await loadConfig()
    if (cfg?.email_templates) {
      for (const td of TEMPLATE_DEFINITIONS) {
        const stored = cfg.email_templates[td.key] as Partial<TemplateData> | undefined
        if (stored) {
          templates.value[td.key] = {
            subject: {
              es: (stored.subject as Record<string, string>)?.es || td.defaultSubject.es,
              en: (stored.subject as Record<string, string>)?.en || td.defaultSubject.en,
            },
            body: {
              es: (stored.body as Record<string, string>)?.es || td.defaultBody.es,
              en: (stored.body as Record<string, string>)?.en || td.defaultBody.en,
            },
            active: stored.active !== undefined ? Boolean(stored.active) : true,
          }
        }
      }
    }

    await loadStats()
  }

  async function loadStats() {
    loadingStats.value = true
    try {
      const { data } = await supabase
        .from('email_logs')
        .select('template_key, status')
        .eq('vertical', getVerticalSlug())

      if (data) {
        const statsMap: Record<string, TemplateStats> = {}
        for (const row of data) {
          const key = row.template_key
          const status = row.status ?? ''
          if (!key) continue
          if (!statsMap[key]) statsMap[key] = { sent: 0, opened: 0, clicked: 0 }
          if (['sent', 'delivered', 'opened', 'clicked'].includes(status)) statsMap[key].sent++
          if (['opened', 'clicked'].includes(status)) statsMap[key].opened++
          if (status === 'clicked') statsMap[key].clicked++
        }
        templateStats.value = statsMap
      }
    } catch {
      // Stats are non-critical; silently fail
    } finally {
      loadingStats.value = false
    }
  }

  // ── Actions ──
  function selectCategory(cat: CategoryKey) {
    activeCategory.value = cat
    const firstTemplate = TEMPLATE_DEFINITIONS.find((td) => td.category === cat)
    if (firstTemplate) selectedTemplateKey.value = firstTemplate.key
  }

  function toggleTemplate(key: string) {
    if (templates.value[key]) templates.value[key].active = !templates.value[key].active
  }

  function insertVariable(variable: string) {
    const tpl = templates.value[selectedTemplateKey.value]
    if (tpl) tpl.body[activeLang.value] += variable
  }

  function resetToDefault() {
    const def = selectedDefinition.value
    if (!def) return
    templates.value[def.key] = {
      subject: { es: def.defaultSubject.es, en: def.defaultSubject.en },
      body: { es: def.defaultBody.es, en: def.defaultBody.en },
      active: templates.value[def.key]?.active ?? true,
    }
  }

  async function handleSave() {
    const payload: Record<string, Record<string, unknown>> = {}
    for (const td of TEMPLATE_DEFINITIONS) {
      const tpl = templates.value[td.key]
      if (tpl) {
        payload[td.key] = {
          subject: { ...tpl.subject },
          body: { ...tpl.body },
          active: tpl.active,
        }
      }
    }
    await saveFields({ email_templates: payload })
  }

  async function sendTest() {
    if (!user.value?.email || !selectedDefinition.value) return
    sendingTest.value = true
    testSent.value = false

    try {
      const def = selectedDefinition.value
      const sampleVars: Record<string, string> = {}
      for (const v of def.variables) {
        const varName = v.replace(/\{\{|\}\}/g, '')
        sampleVars[varName] = getSampleValue(varName)
      }

      await $fetch('/api/email/send', {
        method: 'POST',
        body: {
          to: user.value.email,
          template_key: selectedTemplateKey.value,
          subject: currentTemplate.value?.subject[activeLang.value] || '',
          body: currentTemplate.value?.body[activeLang.value] || '',
          variables: sampleVars,
          locale: activeLang.value,
        },
      })
      testSent.value = true
      setTimeout(() => {
        testSent.value = false
      }, 4000)
    } catch {
      error.value = t('admin.emails.testError')
    } finally {
      sendingTest.value = false
    }
  }

  return {
    // State
    activeCategory,
    selectedTemplateKey,
    activeLang,
    templates,
    templateStats,
    showPreview,
    sendingTest,
    testSent,
    loadingStats,
    // From vertical config
    loading,
    saving,
    error,
    saved,
    // Computed
    filteredTemplates,
    selectedDefinition,
    currentTemplate,
    currentStats,
    openRate,
    clickRate,
    previewHtml,
    // Functions
    sanitize,
    categoryCount,
    init,
    loadStats,
    selectCategory,
    toggleTemplate,
    insertVariable,
    resetToDefault,
    handleSave,
    sendTest,
  }
}

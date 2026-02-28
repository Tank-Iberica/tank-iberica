export interface MerchProduct {
  id: string
  name_es: string
  name_en: string
  description_es: string
  description_en: string
  unit_es: string
  unit_en: string
  icon: string
  color: string
}

export interface MerchForm {
  product: string
  quantity: string
  email: string
  notes: string
}

export const products: MerchProduct[] = [
  {
    id: 'tarjetas-visita',
    name_es: 'Tarjetas de visita',
    name_en: 'Business cards',
    description_es:
      '500 unidades, papel premium 350g, barniz UV selectivo. Incluye logo, datos de contacto y QR a tu perfil.',
    description_en:
      '500 units, premium 350g paper, selective UV varnish. Includes logo, contact info and QR to your profile.',
    unit_es: '500 uds',
    unit_en: '500 pcs',
    icon: '🪪',
    color: '#dbeafe',
  },
  {
    id: 'imanes-furgoneta',
    name_es: 'Imanes para furgoneta',
    name_en: 'Van magnets',
    description_es:
      '2 unidades, 60×30 cm cada uno. Resistentes a lluvia y sol. Incluyen logo, nombre y teléfono.',
    description_en:
      '2 units, 60×30 cm each. Weather resistant. Include logo, company name and phone.',
    unit_es: '2 uds · 60×30 cm',
    unit_en: '2 pcs · 60×30 cm',
    icon: '🚐',
    color: '#dcfce7',
  },
  {
    id: 'lona-feria',
    name_es: 'Lona para feria',
    name_en: 'Fair banner',
    description_es:
      '1 unidad, 200×100 cm. PVC resistente con ojales. Incluye logo, nombre, teléfono y URL del perfil.',
    description_en:
      '1 unit, 200×100 cm. Durable PVC with eyelets. Includes logo, name, phone and profile URL.',
    unit_es: '1 ud · 200×100 cm',
    unit_en: '1 pc · 200×100 cm',
    icon: '🏳️',
    color: '#fef9c3',
  },
  {
    id: 'pegatinas-qr',
    name_es: 'Pegatinas QR',
    name_en: 'QR stickers',
    description_es:
      '50 unidades, 5×5 cm. Vinilo resistente. QR personalizado que enlaza a tu perfil en Tracciona.',
    description_en: '50 units, 5×5 cm. Durable vinyl. Custom QR linking to your Tracciona profile.',
    unit_es: '50 uds · 5×5 cm',
    unit_en: '50 pcs · 5×5 cm',
    icon: '📱',
    color: '#f3e8ff',
  },
  {
    id: 'roll-up',
    name_es: 'Roll-up expositor',
    name_en: 'Roll-up display',
    description_es:
      '1 unidad, 200×85 cm. Estructura de aluminio con bolsa de transporte. Incluye logo, nombre y catálogo destacado.',
    description_en:
      '1 unit, 200×85 cm. Aluminum structure with carrying bag. Includes logo, name and featured catalog.',
    unit_es: '1 ud · 200×85 cm',
    unit_en: '1 pc · 200×85 cm',
    icon: '📋',
    color: '#ffe4e6',
  },
]

export function useDashboardMerchandising() {
  const { t, locale } = useI18n()
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()
  const { dealerProfile, loadDealer } = useDealerDashboard()

  const pageLoading = ref(false)
  const submitting = ref(false)
  const submitted = ref(false)
  const submitError = ref<string | null>(null)

  const form = ref<MerchForm>({ product: '', quantity: '', email: '', notes: '' })

  function getProductName(product: MerchProduct): string {
    return locale.value === 'en' ? product.name_en : product.name_es
  }

  function getProductDescription(product: MerchProduct): string {
    return locale.value === 'en' ? product.description_en : product.description_es
  }

  function getProductUnit(product: MerchProduct): string {
    return locale.value === 'en' ? product.unit_en : product.unit_es
  }

  async function submitInterest() {
    submitError.value = null
    if (!form.value.product || !form.value.email) {
      submitError.value = t('dashboard.tools.merchandising.errorRequired')
      return
    }
    submitting.value = true
    try {
      const selectedProduct = products.find((p) => p.id === form.value.product)
      const { error: insertError } = await supabase.from('service_requests').insert({
        type: 'merchandising',
        user_id: user.value?.id ?? null,
        status: 'requested',
        details: {
          product_id: form.value.product,
          product_name_es: selectedProduct?.name_es ?? form.value.product,
          product_name_en: selectedProduct?.name_en ?? form.value.product,
          estimated_quantity: form.value.quantity || null,
          contact_email: form.value.email,
          notes: form.value.notes || null,
          dealer_company: dealerProfile.value?.company_name ?? null,
          requested_at: new Date().toISOString(),
        },
      })
      if (insertError) throw insertError
      submitted.value = true
      form.value = { product: '', quantity: '', email: '', notes: '' }
    } catch (err: unknown) {
      const e = err as { message?: string }
      submitError.value = e?.message ?? t('dashboard.tools.merchandising.errorSubmit')
    } finally {
      submitting.value = false
    }
  }

  function resetSubmitted() {
    submitted.value = false
  }

  function updateFormField(field: keyof MerchForm, value: string) {
    form.value[field] = value
  }

  async function init(): Promise<void> {
    pageLoading.value = true
    try {
      await loadDealer()
      const email = dealerProfile.value?.email ?? user.value?.email ?? ''
      if (email) form.value.email = email
    } finally {
      pageLoading.value = false
    }
  }

  return {
    pageLoading,
    submitting,
    submitted,
    submitError,
    form,
    dealerProfile,
    getProductName,
    getProductDescription,
    getProductUnit,
    submitInterest,
    resetSubmitted,
    updateFormField,
    init,
  }
}

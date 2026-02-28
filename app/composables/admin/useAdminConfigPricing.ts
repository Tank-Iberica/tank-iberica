interface VerticalConfig {
  subscription_prices: Record<string, Record<string, number>>
  commission_rates: Record<string, number>
}

export interface PlanDefinition {
  key: string
  labelKey: string
  readonly: boolean
}

export interface CommissionDefinition {
  key: string
  labelKey: string
  type: 'pct' | 'cents'
}

export const planDefinitions: PlanDefinition[] = [
  { key: 'founding', labelKey: 'admin.configPricing.planFounding', readonly: true },
  { key: 'basic', labelKey: 'admin.configPricing.planBasic', readonly: false },
  { key: 'premium', labelKey: 'admin.configPricing.planPremium', readonly: false },
]

export const commissionDefinitions: CommissionDefinition[] = [
  { key: 'sale_pct', labelKey: 'admin.configPricing.salePct', type: 'pct' },
  {
    key: 'auction_buyer_premium_pct',
    labelKey: 'admin.configPricing.auctionBuyerPremiumPct',
    type: 'pct',
  },
  {
    key: 'transport_commission_pct',
    labelKey: 'admin.configPricing.transportCommissionPct',
    type: 'pct',
  },
  {
    key: 'transfer_commission_pct',
    labelKey: 'admin.configPricing.transferCommissionPct',
    type: 'pct',
  },
  {
    key: 'verification_level1_cents',
    labelKey: 'admin.configPricing.verificationLevel1',
    type: 'cents',
  },
  {
    key: 'verification_level2_cents',
    labelKey: 'admin.configPricing.verificationLevel2',
    type: 'cents',
  },
  {
    key: 'verification_level3_cents',
    labelKey: 'admin.configPricing.verificationLevel3',
    type: 'cents',
  },
]

export function useAdminConfigPricing() {
  const supabase = useSupabaseClient()

  const loading = ref(true)
  const savingPrices = ref(false)
  const savingCommissions = ref(false)
  const error = ref<string | null>(null)
  const successPrices = ref(false)
  const successCommissions = ref(false)

  const subscriptionPrices = ref<Record<string, { monthly: number; annual: number }>>({
    founding: { monthly: 0, annual: 0 },
    basic: { monthly: 0, annual: 0 },
    premium: { monthly: 0, annual: 0 },
  })

  const commissionRates = ref<Record<string, number>>({
    sale_pct: 0,
    auction_buyer_premium_pct: 0,
    transport_commission_pct: 0,
    transfer_commission_pct: 0,
    verification_level1_cents: 0,
    verification_level2_cents: 0,
    verification_level3_cents: 0,
  })

  function centsToEuros(cents: number): number {
    return Math.round(cents) / 100
  }

  function eurosToCents(euros: number): number {
    return Math.round(euros * 100)
  }

  async function loadConfig() {
    loading.value = true
    error.value = null
    try {
      const { data, error: fetchError } = await supabase
        .from('vertical_config')
        .select('subscription_prices, commission_rates')
        .eq('vertical', getVerticalSlug())
        .single()

      if (fetchError) {
        error.value = fetchError.message
        return
      }

      const cfg = data as VerticalConfig
      const prices = cfg.subscription_prices || {}
      for (const plan of planDefinitions) {
        const planData = prices[plan.key] as Record<string, number> | undefined
        if (planData) {
          subscriptionPrices.value[plan.key] = {
            monthly: centsToEuros(planData.monthly_cents || 0),
            annual: centsToEuros(planData.annual_cents || 0),
          }
        }
      }

      const rates = cfg.commission_rates || {}
      for (const def of commissionDefinitions) {
        commissionRates.value[def.key] =
          def.type === 'cents'
            ? centsToEuros((rates[def.key] as number) || 0)
            : (rates[def.key] as number) || 0
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : String(err)
    } finally {
      loading.value = false
    }
  }

  async function savePrices() {
    savingPrices.value = true
    error.value = null
    successPrices.value = false
    try {
      const pricesPayload: Record<string, Record<string, number>> = {}
      for (const plan of planDefinitions) {
        const localPlan = subscriptionPrices.value[plan.key]
        pricesPayload[plan.key] = {
          monthly_cents: plan.readonly ? 0 : eurosToCents(localPlan.monthly),
          annual_cents: plan.readonly ? 0 : eurosToCents(localPlan.annual),
        }
      }
      const { error: updateError } = await supabase
        .from('vertical_config')
        .update({ subscription_prices: pricesPayload })
        .eq('vertical', getVerticalSlug())
      if (updateError) {
        error.value = updateError.message
        return
      }
      successPrices.value = true
      setTimeout(() => {
        successPrices.value = false
      }, 3000)
    } catch (err) {
      error.value = err instanceof Error ? err.message : String(err)
    } finally {
      savingPrices.value = false
    }
  }

  async function saveCommissions() {
    savingCommissions.value = true
    error.value = null
    successCommissions.value = false
    try {
      const ratesPayload: Record<string, number> = {}
      for (const def of commissionDefinitions) {
        ratesPayload[def.key] =
          def.type === 'cents'
            ? eurosToCents(commissionRates.value[def.key])
            : commissionRates.value[def.key]
      }
      const { error: updateError } = await supabase
        .from('vertical_config')
        .update({ commission_rates: ratesPayload })
        .eq('vertical', getVerticalSlug())
      if (updateError) {
        error.value = updateError.message
        return
      }
      successCommissions.value = true
      setTimeout(() => {
        successCommissions.value = false
      }, 3000)
    } catch (err) {
      error.value = err instanceof Error ? err.message : String(err)
    } finally {
      savingCommissions.value = false
    }
  }

  function updatePrice(planKey: string, field: 'monthly' | 'annual', value: number) {
    subscriptionPrices.value[planKey][field] = value
  }

  function updateRate(rateKey: string, value: number) {
    commissionRates.value[rateKey] = value
  }

  function dismissError() {
    error.value = null
  }

  return {
    loading,
    savingPrices,
    savingCommissions,
    error,
    successPrices,
    successCommissions,
    subscriptionPrices,
    commissionRates,
    loadConfig,
    savePrices,
    saveCommissions,
    updatePrice,
    updateRate,
    dismissError,
  }
}

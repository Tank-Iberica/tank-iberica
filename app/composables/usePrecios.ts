import type { PlanType } from '~/composables/useSubscriptionPlan'

export interface PlanCardData {
  plan: PlanType
  name: string
  price: string
  suffix: string
  highlighted: boolean
  founding: boolean
  features: string[]
}

export interface ComparisonRow {
  label: string
  free: string | boolean
  basic: string | boolean
  premium: string | boolean
  founding: string | boolean
}

export interface FaqItem {
  question: string
  answer: string
}

export type BillingInterval = 'month' | 'year'

export function usePrecios() {
  const { t } = useI18n()
  const user = useSupabaseUser()
  const supabase = useSupabaseClient()
  const localePath = useLocalePath()

  const billingInterval = ref<BillingInterval>('month')
  const loading = ref(false)
  const checkoutError = ref('')
  const isTrialEligible = ref(false)
  const openFaq = ref<number | null>(null)

  async function checkTrialEligibility() {
    if (!user.value) {
      isTrialEligible.value = true
      return
    }
    const { data } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('user_id', user.value.id)
      .limit(1)
    isTrialEligible.value = !data || data.length === 0
  }

  watch(user, checkTrialEligibility)

  useHead({
    title: t('pricing.seoTitle'),
    meta: [{ name: 'description', content: t('pricing.seoDescription') }],
  })

  const prices = computed(() => ({
    basic: {
      month: t('pricing.priceBasicMonth'),
      year: t('pricing.priceBasicYear'),
    },
    premium: {
      month: t('pricing.pricePremiumMonth'),
      year: t('pricing.pricePremiumYear'),
    },
  }))

  const planCards = computed<PlanCardData[]>(() => [
    {
      plan: 'free',
      name: t('pricing.planFree'),
      price: '0',
      suffix: '',
      highlighted: false,
      founding: false,
      features: [
        t('pricing.featureListings', { count: 3 }),
        t('pricing.featurePhotos', { count: 5 }),
        t('pricing.featureBasicProfile'),
        t('pricing.featureBasicStats'),
      ],
    },
    {
      plan: 'basic',
      name: t('pricing.planBasic'),
      price: prices.value.basic[billingInterval.value],
      suffix: billingInterval.value === 'month' ? t('pricing.month') : t('pricing.year'),
      highlighted: true,
      founding: false,
      features: [
        t('pricing.featureListings', { count: 20 }),
        t('pricing.featurePhotos', { count: 15 }),
        t('pricing.featureFullProfile'),
        t('pricing.featureStandardStats'),
        t('pricing.featureBadgeBasic'),
        t('pricing.featureWhatsapp'),
        t('pricing.featureExport'),
        t('pricing.featureAiListings', { count: 20 }),
      ],
    },
    {
      plan: 'premium',
      name: t('pricing.planPremium'),
      price: prices.value.premium[billingInterval.value],
      suffix: billingInterval.value === 'month' ? t('pricing.month') : t('pricing.year'),
      highlighted: false,
      founding: false,
      features: [
        t('pricing.featureListingsUnlimited'),
        t('pricing.featurePhotos', { count: 30 }),
        t('pricing.featureFullProfileCover'),
        t('pricing.featureFullStats'),
        t('pricing.featureBadgePremium'),
        t('pricing.featureWhatsapp'),
        t('pricing.featureWidget'),
        t('pricing.featureExport'),
        t('pricing.featureDemandAlerts'),
        t('pricing.featureAiListingsUnlimited'),
        t('pricing.featurePriority'),
      ],
    },
    {
      plan: 'founding',
      name: t('pricing.planFounding'),
      price: '0',
      suffix: '',
      highlighted: false,
      founding: true,
      features: [
        t('pricing.featureEverythingPremium'),
        t('pricing.featureBadgeFounding'),
        t('pricing.foundingForever'),
      ],
    },
  ])

  const comparisonRows = computed<ComparisonRow[]>(() => [
    {
      label: t('pricing.compareActiveListings'),
      free: '3',
      basic: '20',
      premium: t('pricing.compareUnlimited'),
      founding: t('pricing.compareUnlimited'),
    },
    {
      label: t('pricing.comparePhotosPerListing'),
      free: '5',
      basic: '15',
      premium: '30',
      founding: '30',
    },
    {
      label: t('pricing.comparePublicProfile'),
      free: t('pricing.compareBasic'),
      basic: t('pricing.compareFull'),
      premium: t('pricing.compareFullCover'),
      founding: t('pricing.compareFullCover'),
    },
    {
      label: t('pricing.compareStats'),
      free: t('pricing.compareStatsBasic'),
      basic: t('pricing.compareStatsStandard'),
      premium: t('pricing.compareStatsFull'),
      founding: t('pricing.compareStatsFull'),
    },
    {
      label: t('pricing.compareBadge'),
      free: false,
      basic: true,
      premium: true,
      founding: true,
    },
    {
      label: t('pricing.compareWhatsapp'),
      free: false,
      basic: true,
      premium: true,
      founding: true,
    },
    {
      label: t('pricing.compareWidget'),
      free: false,
      basic: false,
      premium: true,
      founding: true,
    },
    {
      label: t('pricing.compareExport'),
      free: false,
      basic: true,
      premium: true,
      founding: true,
    },
    {
      label: t('pricing.compareDemandAlerts'),
      free: false,
      basic: false,
      premium: true,
      founding: true,
    },
    {
      label: t('pricing.compareAiListings'),
      free: '3' + t('pricing.comparePerMonth'),
      basic: '20' + t('pricing.comparePerMonth'),
      premium: t('pricing.compareUnlimited'),
      founding: t('pricing.compareUnlimited'),
    },
    {
      label: t('pricing.comparePriority'),
      free: false,
      basic: false,
      premium: true,
      founding: true,
    },
  ])

  const faqs = computed<FaqItem[]>(() => [
    { question: t('pricing.faq1Question'), answer: t('pricing.faq1Answer') },
    { question: t('pricing.faq2Question'), answer: t('pricing.faq2Answer') },
    { question: t('pricing.faq3Question'), answer: t('pricing.faq3Answer') },
    { question: t('pricing.faq4Question'), answer: t('pricing.faq4Answer') },
  ])

  function toggleFaq(index: number) {
    openFaq.value = openFaq.value === index ? null : index
  }

  async function startCheckout(plan: 'basic' | 'premium') {
    if (!user.value) {
      navigateTo(localePath('/login'))
      return
    }

    loading.value = true
    checkoutError.value = ''

    try {
      const response = await $fetch<{ url: string }>('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'x-requested-with': 'XMLHttpRequest' },
        body: {
          plan,
          interval: billingInterval.value,
          userId: user.value.id,
          successUrl: `${window.location.origin}${localePath('/admin/productos')}?checkout=success`,
          cancelUrl: `${window.location.origin}${localePath('/precios')}?checkout=cancelled`,
        },
      })

      if (response.url) {
        window.location.href = response.url
      }
    } catch {
      checkoutError.value = t('pricing.checkoutError')
    } finally {
      loading.value = false
    }
  }

  function handleCta(plan: PlanType) {
    if (plan === 'free') {
      navigateTo(localePath(user.value ? '/admin/productos' : '/login'))
    } else if (plan === 'founding') {
      window.location.href = 'mailto:tankiberica@gmail.com?subject=Solicitud%20Founding%20Dealer'
    } else {
      startCheckout(plan as 'basic' | 'premium')
    }
  }

  async function init() {
    await checkTrialEligibility()
  }

  return {
    billingInterval,
    loading,
    checkoutError,
    isTrialEligible,
    openFaq,
    planCards,
    comparisonRows,
    faqs,
    toggleFaq,
    handleCta,
    init,
  }
}

/**
 * Auction Detail Composable
 * Extracts all logic from the public auction detail page (subastas/[id].vue).
 * Receives auction ID as Ref<string>. Does NOT call onMounted.
 */

import type { Ref } from 'vue'
import { useAuction, type AuctionStatus, type AuctionBid } from '~/composables/useAuction'
import {
  useAuctionRegistration,
  type RegistrationFormData,
} from '~/composables/useAuctionRegistration'
import { useCloudinaryUpload } from '~/composables/admin/useCloudinaryUpload'
import { formatPrice } from '~/composables/shared/useListingUtils'

/** Image entry from the vehicle_images join */
export interface VehicleImage {
  url: string
  position: number
}

export function useAuctionDetail(auctionId: Ref<string>) {
  const { t, locale } = useI18n()
  const toast = useToast()
  const route = useRoute()

  const {
    auction,
    bids,
    loading,
    error,
    fetchAuctionById,
    placeBid,
    subscribeToAuction,
    formatCents,
  } = useAuction()

  const { isRegistered, canBid, fetchRegistration, submitRegistration, initiateDeposit } =
    useAuctionRegistration(auctionId.value)

  const { upload: uploadToCloudinary } = useCloudinaryUpload()

  // ---- Reactive state ----

  const mutableBids = computed(() => [...bids.value] as AuctionBid[])

  const showRegForm = ref(false)
  const regFormIdDocumentUrl = ref<string | null>(null)
  const regFormTransportLicenseUrl = ref<string | null>(null)

  const selectedImageIdx = ref(0)

  // ---- Computed ----

  const vehicleImages = computed<VehicleImage[]>(() => {
    const images = auction.value?.vehicle?.vehicle_images
    if (!images || images.length === 0) return []
    return [...images].sort((a, b) => a.position - b.position)
  })

  const primaryImage = computed<string | null>(() => {
    return vehicleImages.value[selectedImageIdx.value]?.url ?? null
  })

  const vehicleTitle = computed<string>(() => {
    if (auction.value?.title) return auction.value.title
    if (auction.value?.vehicle)
      return `${auction.value.vehicle.brand} ${auction.value.vehicle.model}`
    return t('auction.untitledAuction')
  })

  const auctionTitle = computed<string>(() => {
    if (!auction.value) return t('auction.pageTitle')
    return (
      auction.value.title ||
      `${auction.value.vehicle?.brand || ''} ${auction.value.vehicle?.model || ''}`.trim()
    )
  })

  // ---- SEO ----

  const currentPath = computed(() => route.fullPath)

  const seoTitle = computed<string>(() => {
    if (!auction.value) return t('auction.seoTitle')
    return t('auction.seoDetailTitle', { title: auctionTitle.value })
  })

  const seoDescription = computed<string>(() => {
    if (!auction.value) return t('auction.seoDescription')
    return t('auction.seoDetailDescription', {
      title: auctionTitle.value,
      startDate: formatDate(auction.value.starts_at),
      price: formatCents(auction.value.start_price_cents),
    })
  })

  const eventJsonLd = computed<Record<string, unknown> | null>(() => {
    if (!auction.value) return null

    return {
      '@context': 'https://schema.org',
      '@type': 'Event',
      name: `${t('auction.pageTitle')}: ${auctionTitle.value}`,
      description: auction.value.description || seoDescription.value,
      startDate: auction.value.starts_at,
      endDate: auction.value.extended_until || auction.value.ends_at,
      eventStatus:
        auction.value.status === 'active'
          ? 'https://schema.org/EventScheduled'
          : auction.value.status === 'ended'
            ? 'https://schema.org/EventCompleted'
            : 'https://schema.org/EventScheduled',
      eventAttendanceMode: 'https://schema.org/OnlineEventAttendanceMode',
      location: {
        '@type': 'VirtualLocation',
        url: `https://tracciona.com/subastas/${auction.value.id}`,
      },
      organizer: {
        '@type': 'Organization',
        name: 'Tracciona',
        url: 'https://tracciona.com',
      },
      offers: {
        '@type': 'Offer',
        price: (auction.value.start_price_cents / 100).toString(),
        priceCurrency: 'EUR',
        availability:
          auction.value.status === 'active'
            ? 'https://schema.org/InStock'
            : 'https://schema.org/OutOfStock',
      },
    }
  })

  // ---- Handlers ----

  async function handlePlaceBid(amountCents: number) {
    const ok = await placeBid(auctionId.value, amountCents)
    if (!ok) toast.error(error.value || t('toast.errorGeneric'))
  }

  function handleRequestRegistration() {
    showRegForm.value = true
  }

  function closeRegForm() {
    showRegForm.value = false
  }

  async function handleIdDocUpload(e: Event) {
    const input = e.target as HTMLInputElement
    if (!input.files?.length) return
    const result = await uploadToCloudinary(input.files[0]!, {
      publicId: `auction-reg/${auctionId.value}/${Date.now()}`,
      tags: ['auction', 'registration'],
    })
    if (result) regFormIdDocumentUrl.value = result.secure_url
  }

  async function handleTransportLicenseUpload(e: Event) {
    const input = e.target as HTMLInputElement
    if (!input.files?.length) return
    const result = await uploadToCloudinary(input.files[0]!, {
      publicId: `auction-reg/${auctionId.value}/transport-${Date.now()}`,
      tags: ['auction', 'registration', 'transport-license'],
    })
    if (result) regFormTransportLicenseUrl.value = result.secure_url
  }

  async function handleSubmitRegistration(formData: RegistrationFormData) {
    if (!formData.id_number.trim()) return
    const payload: RegistrationFormData = {
      ...formData,
      id_document_url: regFormIdDocumentUrl.value,
      transport_license_url: regFormTransportLicenseUrl.value,
    }
    const ok = await submitRegistration(payload)
    if (ok) {
      showRegForm.value = false
      const clientSecret = await initiateDeposit()
      if (clientSecret) {
        toast.success(t('toast.depositInitiated'))
      }
    }
  }

  // ---- Helpers ----

  function getStatusLabel(status: AuctionStatus): string {
    const map: Record<AuctionStatus, string> = {
      draft: t('auction.draft'),
      scheduled: t('auction.scheduled'),
      active: t('auction.live'),
      ended: t('auction.ended'),
      adjudicated: t('auction.adjudicated'),
      cancelled: t('auction.cancelled'),
      no_sale: t('auction.noSaleTitle'),
    }
    return map[status] || status
  }

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString(locale.value === 'en' ? 'en-GB' : 'es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  function selectImage(idx: number) {
    selectedImageIdx.value = idx
  }

  // ---- Initialization (called from page's onMounted) ----

  async function init() {
    await fetchAuctionById(auctionId.value)
    await fetchRegistration()
    if (auction.value) {
      subscribeToAuction(auctionId.value)
    }
  }

  return {
    // State
    auction,
    bids,
    mutableBids,
    loading,
    error,
    showRegForm,
    regFormIdDocumentUrl,
    regFormTransportLicenseUrl,
    selectedImageIdx,
    isRegistered,
    canBid,

    // Computed
    vehicleImages,
    primaryImage,
    vehicleTitle,
    auctionTitle,
    currentPath,
    seoTitle,
    seoDescription,
    eventJsonLd,

    // Handlers
    handlePlaceBid,
    handleRequestRegistration,
    closeRegForm,
    handleIdDocUpload,
    handleTransportLicenseUpload,
    handleSubmitRegistration,
    selectImage,

    // Helpers
    getStatusLabel,
    formatDate,
    formatCents,
    formatPrice,

    // Initialization
    init,
  }
}

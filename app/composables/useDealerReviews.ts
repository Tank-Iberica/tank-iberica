/**
 * Composable for reading and submitting dealer reviews.
 * Fetches approved reviews from Supabase; authenticated users can submit.
 */

export interface DealerReview {
  id: string
  rating: number
  comment: string | null
  created_at: string
  reviewer_id: string | null
}

export interface ReviewFormData {
  rating: number
  comment: string
}

/**
 * Composable for dealer reviews.
 *
 * @param dealerId
 */
export function useDealerReviews(dealerId: string) {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()
  const { t } = useI18n()

  const reviews = ref<DealerReview[]>([])
  const loading = ref(false)
  const submitting = ref(false)
  const error = ref<string | null>(null)
  const submitSuccess = ref(false)

  const averageRating = computed((): number => {
    if (!reviews.value.length) return 0
    const sum = reviews.value.reduce((acc, r) => acc + r.rating, 0)
    return Math.round((sum / reviews.value.length) * 10) / 10
  })

  const reviewCount = computed(() => reviews.value.length)

  /** Fetch approved reviews for this dealer */
  async function fetchReviews(): Promise<void> {
    loading.value = true
    error.value = null
    try {
      // Schema pending: dealer_reviews table
      const { data, error: err } = await (supabase as any) // eslint-disable-line @typescript-eslint/no-explicit-any
        .from('dealer_reviews')
        .select('id, rating, comment, created_at, reviewer_id')
        .eq('dealer_id', dealerId)
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(50)

      if (err) throw err
      reviews.value = (data || []) as DealerReview[]
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error loading reviews'
    } finally {
      loading.value = false
    }
  }

  /** Submit a review for this dealer. Requires authentication. */
  async function submitReview(form: ReviewFormData): Promise<boolean> {
    if (!user.value) {
      error.value = t('vehicle.reviews.loginRequired')
      return false
    }

    if (form.rating < 1 || form.rating > 5) {
      error.value = t('vehicle.reviews.ratingRequired')
      return false
    }

    submitting.value = true
    error.value = null
    submitSuccess.value = false

    try {
      // Schema pending: dealer_reviews table
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: err } = await (supabase as any).from('dealer_reviews').insert({
        dealer_id: dealerId,
        reviewer_id: user.value.id,
        rating: form.rating,
        comment: form.comment.trim() || null,
        status: 'pending',
      })

      if (err) {
        // Unique constraint violation — already reviewed
        if (err.code === '23505') {
          error.value = t('vehicle.reviews.alreadyReviewed')
        } else {
          throw err
        }
        return false
      }

      submitSuccess.value = true
      return true
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error submitting review'
      return false
    } finally {
      submitting.value = false
    }
  }

  return {
    reviews,
    loading,
    submitting,
    error,
    submitSuccess,
    averageRating,
    reviewCount,
    fetchReviews,
    submitReview,
  }
}

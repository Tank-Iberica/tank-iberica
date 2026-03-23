-- Migration: dealer_reviews table
-- Used by: app/composables/useDealerReviews.ts, app/components/DealerPortal.vue

CREATE TABLE IF NOT EXISTS public.dealer_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id uuid NOT NULL REFERENCES public.dealers(id) ON DELETE CASCADE,
  reviewer_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  rating smallint NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  -- One review per user per dealer
  CONSTRAINT dealer_reviews_unique_reviewer UNIQUE (dealer_id, reviewer_id)
);

-- Indexes
CREATE INDEX idx_dealer_reviews_dealer_status ON public.dealer_reviews(dealer_id, status);
CREATE INDEX idx_dealer_reviews_created ON public.dealer_reviews(created_at DESC);

-- RLS
ALTER TABLE public.dealer_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read approved reviews"
  ON public.dealer_reviews FOR SELECT
  USING (status = 'approved');

CREATE POLICY "Authenticated users can insert reviews"
  ON public.dealer_reviews FOR INSERT
  TO authenticated
  WITH CHECK (reviewer_id = auth.uid());

CREATE POLICY "Admins can manage all reviews"
  ON public.dealer_reviews FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

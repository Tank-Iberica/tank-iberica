<template>
  <div v-if="showTeaser" class="pro-teaser">
    <div class="pro-teaser__icon">
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    </div>
    <div class="pro-teaser__content">
      <p class="pro-teaser__title">
        {{ $t('pro.teaserCount', { count: hiddenCount }) }}
      </p>
      <p class="pro-teaser__subtitle">
        {{ $t('pro.teaserSubtitle') }}
      </p>
    </div>
    <div class="pro-teaser__actions">
      <NuxtLink to="/pro" class="pro-teaser__btn pro-teaser__btn--primary">
        {{ $t('pro.subscribeBtn') }}
      </NuxtLink>
      <NuxtLink to="/pro?plan=pass" class="pro-teaser__btn pro-teaser__btn--secondary">
        {{ $t('pro.passBtn') }}
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  filters: Record<string, unknown>
}>()

const supabase = useSupabaseClient()
const user = useSupabaseUser()

const hiddenCount = ref(0)
const loading = ref(false)

// Check if user has a Pro subscription
const isPro = ref(false)

async function checkProStatus(): Promise<void> {
  if (!user.value) {
    isPro.value = false
    return
  }

  try {
    const { data } = await supabase
      .from('subscriptions')
      .select('id, plan, status, expires_at')
      .eq('user_id', user.value.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!data) {
      isPro.value = false
      return
    }

    // Check if the subscription is still valid
    const isExpired = data.expires_at && new Date(data.expires_at) < new Date()
    isPro.value = !isExpired && ['basic', 'premium', 'founding', 'pro', 'pass'].includes(data.plan)
  } catch {
    isPro.value = false
  }
}

async function fetchHiddenCount(): Promise<void> {
  loading.value = true
  try {
    let query = supabase
      .from('vehicles')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'published')
      .gt('visible_from', new Date().toISOString())

    // Apply category filter if active
    if (props.filters.type_id) {
      query = query.eq('type_id', props.filters.type_id as string)
    }

    if (props.filters.category_id) {
      query = query.eq('category_id', props.filters.category_id as string)
    }

    const { count, error: err } = await query

    if (err) throw err
    hiddenCount.value = count || 0
  } catch {
    hiddenCount.value = 0
  } finally {
    loading.value = false
  }
}

const showTeaser = computed(() => {
  return hiddenCount.value > 0 && !isPro.value && !loading.value
})

// Watch for filter changes and re-fetch
watch(
  () => props.filters,
  () => {
    fetchHiddenCount()
  },
  { deep: true },
)

onMounted(async () => {
  await Promise.all([checkProStatus(), fetchHiddenCount()])
})
</script>

<style scoped>
.pro-teaser {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: var(--spacing-3);
  padding: var(--spacing-4);
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%);
  border-radius: var(--border-radius-md);
  color: var(--color-white);
  margin: var(--spacing-4) 0;
}

.pro-teaser__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: var(--border-radius-full);
  flex-shrink: 0;
}

.pro-teaser__icon svg {
  stroke: var(--color-white);
}

.pro-teaser__content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
}

.pro-teaser__title {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-bold);
  margin: 0;
  line-height: var(--line-height-tight);
}

.pro-teaser__subtitle {
  font-size: var(--font-size-sm);
  margin: 0;
  opacity: 0.85;
  line-height: var(--line-height-normal);
}

.pro-teaser__actions {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
  width: 100%;
}

.pro-teaser__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-3) var(--spacing-4);
  border-radius: var(--border-radius);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  text-decoration: none;
  min-height: 44px;
  min-width: 44px;
  transition:
    background var(--transition-fast),
    transform var(--transition-fast);
  cursor: pointer;
  text-align: center;
}

.pro-teaser__btn:hover {
  transform: translateY(-1px);
}

.pro-teaser__btn--primary {
  background: var(--color-gold);
  color: var(--color-white);
}

.pro-teaser__btn--primary:hover {
  background: var(--color-gold-dark);
}

.pro-teaser__btn--secondary {
  background: rgba(255, 255, 255, 0.15);
  color: var(--color-white);
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.pro-teaser__btn--secondary:hover {
  background: rgba(255, 255, 255, 0.25);
}

/* ==================================
   Responsive: tablet+
   ================================== */
@media (min-width: 768px) {
  .pro-teaser {
    flex-direction: row;
    text-align: left;
    padding: var(--spacing-4) var(--spacing-6);
    gap: var(--spacing-4);
  }

  .pro-teaser__content {
    flex: 1;
    min-width: 0;
  }

  .pro-teaser__title {
    font-size: var(--font-size-lg);
  }

  .pro-teaser__actions {
    flex-direction: row;
    width: auto;
    flex-shrink: 0;
  }

  .pro-teaser__btn {
    white-space: nowrap;
    padding: var(--spacing-3) var(--spacing-5);
  }
}

@media (min-width: 1024px) {
  .pro-teaser {
    padding: var(--spacing-5) var(--spacing-8);
  }

  .pro-teaser__title {
    font-size: var(--font-size-xl);
  }

  .pro-teaser__subtitle {
    font-size: var(--font-size-base);
  }
}
</style>

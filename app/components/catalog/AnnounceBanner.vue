<template>
  <div v-if="bannerText" class="announce-banner">
    <p>{{ bannerText }}</p>
  </div>
</template>

<script setup lang="ts">
const supabase = useSupabaseClient()
const { locale } = useI18n()

const bannerData = ref<Record<string, unknown> | null>(null)

const bannerText = computed(() => {
  if (!bannerData.value?.active) return null
  if (locale.value === 'en' && bannerData.value.text_en) return bannerData.value.text_en as string
  return (bannerData.value.text_es as string) || null
})

onMounted(async () => {
  const { data } = await supabase
    .from('config')
    .select('value')
    .eq('key', 'banner')
    .single()

  if (data) {
    bannerData.value = (data as Record<string, unknown>).value as Record<string, unknown>
  }
})
</script>

<style scoped>
.announce-banner {
  background: var(--color-primary);
  color: var(--text-on-dark-primary);
  text-align: center;
  padding: var(--spacing-2) var(--spacing-4);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
}
</style>

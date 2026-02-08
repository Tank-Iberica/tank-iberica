<template>
  <div class="confirm">
    <p>{{ $t('common.loading') }}</p>
  </div>
</template>

<script setup lang="ts">
const user = useSupabaseUser()
const route = useRoute()
const supabase = useSupabaseClient()

async function handleRedirect() {
  if (!user.value) return

  const redirectUrl = route.query.redirect as string | undefined

  if (redirectUrl) {
    // For admin routes, verify user is admin first
    if (redirectUrl.startsWith('/admin')) {
      const { data } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.value.id)
        .single<{ role: string }>()

      if (data?.role === 'admin') {
        await navigateTo(redirectUrl)
        return
      }
      // Not admin, go to home
      await navigateTo('/')
      return
    }
    // Non-admin redirect
    await navigateTo(redirectUrl)
    return
  }

  // No redirect - check if admin and redirect to admin panel
  const { data } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.value.id)
    .single<{ role: string }>()

  if (data?.role === 'admin') {
    await navigateTo('/admin')
  } else {
    await navigateTo('/')
  }
}

watch(user, (val) => {
  if (val) {
    handleRedirect()
  }
}, { immediate: true })
</script>

<style scoped>
.confirm {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - var(--header-height));
  color: var(--text-auxiliary);
}
</style>

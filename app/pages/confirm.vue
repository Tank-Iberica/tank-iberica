<template>
  <div class="confirm">
    <p>{{ $t('common.loading') }}</p>
  </div>
</template>

<script setup lang="ts">
const user = useSupabaseUser()

watch(user, (val) => {
  if (val) {
    navigateTo('/')
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

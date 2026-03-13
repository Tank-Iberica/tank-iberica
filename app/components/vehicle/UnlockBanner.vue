<!--
  UnlockBanner — #9 (Early-access unlock)

  Stub component. Full implementation pending (#9).
  Shows a CTA for users to unlock early-access listings before the
  `visible_from` date. For now renders nothing until feature is built.
-->
<template>
  <!-- #9 Early-access unlock — pending full implementation -->
</template>

<script setup lang="ts">
defineProps<{
  vehicleId: string
  visibleFrom: string
  initiallyUnlocked: boolean
}>()

defineEmits<{
  unlocked: []
}>()
</script>

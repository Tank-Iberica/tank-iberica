<template>
  <div>
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage :keepalive="{ include: ['index'] }" />
    </NuxtLayout>
  </div>
</template>

<script setup lang="ts">
// Site-wide Organization schema (appears on every page)
useJsonLd(buildOrganizationSchema())
</script>

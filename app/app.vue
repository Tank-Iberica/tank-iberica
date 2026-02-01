<template>
  <div>
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage :keepalive="{ include: ['index'] }" />
    </NuxtLayout>
  </div>
</template>

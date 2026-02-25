<template>
  <div class="filters-bar">
    <div class="status-pills">
      <button
        v-for="tab in tabs"
        :key="tab"
        class="status-pill"
        :class="{ active: modelValue === tab }"
        @click="$emit('update:modelValue', tab)"
      >
        {{ t(`admin.social.tabs.${tab}`) }}
        <span class="pill-count">{{ counts[tab] }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { StatusFilter } from '~/composables/admin/useSocialAdminUI'

const { t } = useI18n()

const tabs: StatusFilter[] = ['all', 'pending', 'approved', 'posted', 'rejected', 'failed']

defineProps<{
  modelValue: StatusFilter
  counts: Record<StatusFilter, number>
}>()

defineEmits<{
  'update:modelValue': [value: StatusFilter]
}>()
</script>

<style scoped>
@import './social-shared.css';
</style>

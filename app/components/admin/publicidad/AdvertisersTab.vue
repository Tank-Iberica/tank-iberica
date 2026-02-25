<template>
  <div>
    <div class="tab-header">
      <span class="total-badge">{{ advertisers.length }} {{ t('admin.publicidad.records') }}</span>
      <button class="btn-primary" @click="$emit('newAdvertiser')">
        + {{ t('admin.publicidad.createAdvertiser') }}
      </button>
    </div>

    <div class="table-container">
      <table class="admin-table">
        <thead>
          <tr>
            <th>{{ t('admin.publicidad.companyName') }}</th>
            <th>{{ t('admin.publicidad.contactEmail') }}</th>
            <th>{{ t('admin.publicidad.contactPhone') }}</th>
            <th>{{ t('admin.publicidad.website') }}</th>
            <th style="width: 100px">{{ t('admin.publicidad.status') }}</th>
            <th style="width: 130px">{{ t('admin.publicidad.actions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="adv in advertisers" :key="adv.id">
            <td>
              <strong>{{ adv.company_name }}</strong>
            </td>
            <td class="text-muted">{{ adv.contact_email || '-' }}</td>
            <td class="text-muted">{{ adv.contact_phone || '-' }}</td>
            <td class="text-muted">
              <a v-if="adv.website" :href="adv.website" target="_blank" rel="noopener">{{
                adv.website
              }}</a>
              <span v-else>-</span>
            </td>
            <td>
              <span
                class="status-badge"
                :style="{
                  background: getStatusColor(adv.status) + '18',
                  color: getStatusColor(adv.status),
                  borderColor: getStatusColor(adv.status) + '40',
                }"
              >
                {{ t(`admin.publicidad.statusLabels.${adv.status}`) }}
              </span>
            </td>
            <td>
              <div class="action-buttons">
                <button
                  class="btn-icon btn-view"
                  :title="t('admin.publicidad.edit')"
                  @click="$emit('editAdvertiser', adv)"
                >
                  &#9998;
                </button>
                <button
                  class="btn-icon btn-delete"
                  :title="t('admin.publicidad.delete')"
                  @click="$emit('deleteAdvertiser', adv)"
                >
                  &#10005;
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="!advertisers.length">
            <td colspan="6" class="empty-state">{{ t('admin.publicidad.noAdvertisers') }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Advertiser } from '~/composables/admin/useAdminPublicidad'
import { getStatusColor } from '~/composables/admin/useAdminPublicidad'

const { t } = useI18n()

defineProps<{
  advertisers: Advertiser[]
}>()

defineEmits<{
  newAdvertiser: []
  editAdvertiser: [adv: Advertiser]
  deleteAdvertiser: [adv: Advertiser]
}>()
</script>

<style scoped>
@import './publicidad-shared.css';
</style>

<template>
  <div>
    <div class="tab-header">
      <span class="total-badge">{{ ads.length }} {{ t('admin.publicidad.records') }}</span>
      <button class="btn-primary" @click="$emit('newAd')">
        + {{ t('admin.publicidad.createAd') }}
      </button>
    </div>

    <div class="table-container">
      <table class="admin-table">
        <thead>
          <tr>
            <th>{{ t('admin.publicidad.advertiser') }}</th>
            <th>{{ t('admin.publicidad.adTitle') }}</th>
            <th>{{ t('admin.publicidad.positions') }}</th>
            <th>{{ t('admin.publicidad.format') }}</th>
            <th style="width: 90px">{{ t('admin.publicidad.status') }}</th>
            <th style="width: 90px">{{ t('admin.publicidad.price') }}</th>
            <th style="width: 80px">{{ t('admin.publicidad.impressions') }}</th>
            <th style="width: 60px">{{ t('admin.publicidad.clicks') }}</th>
            <th style="width: 60px">CTR</th>
            <th style="width: 90px">{{ t('admin.publicidad.dates') }}</th>
            <th style="width: 100px">{{ t('admin.publicidad.actions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="ad in ads" :key="ad.id">
            <td>
              <strong>{{ getAdvertiserName(ad) }}</strong>
            </td>
            <td>{{ ad.title }}</td>
            <td>
              <div class="positions-list">
                <span
                  v-for="pos in (ad.positions || []).slice(0, 3)"
                  :key="pos"
                  class="position-chip"
                  >{{ pos }}</span
                >
                <span v-if="(ad.positions || []).length > 3" class="position-chip more"
                  >+{{ (ad.positions || []).length - 3 }}</span
                >
              </div>
            </td>
            <td>
              <span class="format-badge">{{ ad.format }}</span>
            </td>
            <td>
              <span
                class="status-badge"
                :style="{
                  background: getStatusColor(ad.status) + '18',
                  color: getStatusColor(ad.status),
                  borderColor: getStatusColor(ad.status) + '40',
                }"
              >
                {{ t(`admin.publicidad.statusLabels.${ad.status}`) }}
              </span>
            </td>
            <td class="text-right">{{ formatPrice(ad.price_monthly_cents) }}</td>
            <td class="text-right">{{ formatNumber(ad.impressions) }}</td>
            <td class="text-right">{{ formatNumber(ad.clicks) }}</td>
            <td class="text-right">{{ calcCTR(ad.impressions, ad.clicks) }}</td>
            <td>
              <div class="dates-cell">
                <span>{{ formatDate(ad.starts_at) }}</span>
                <span v-if="ad.ends_at">{{ formatDate(ad.ends_at) }}</span>
              </div>
            </td>
            <td>
              <div class="action-buttons">
                <button
                  class="btn-icon btn-view"
                  :title="t('admin.publicidad.edit')"
                  @click="$emit('editAd', ad)"
                >
                  &#9998;
                </button>
                <button
                  class="btn-icon btn-delete"
                  :title="t('admin.publicidad.delete')"
                  @click="$emit('deleteAd', ad)"
                >
                  &#10005;
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="!ads.length">
            <td colspan="11" class="empty-state">{{ t('admin.publicidad.noAds') }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Ad } from '~/composables/admin/useAdminPublicidad'
import {
  getStatusColor,
  formatPrice,
  formatDate,
  formatNumber,
  calcCTR,
} from '~/composables/admin/useAdminPublicidad'

const { t } = useI18n()

defineProps<{
  ads: Ad[]
  getAdvertiserName: (ad: Ad) => string
}>()

defineEmits<{
  newAd: []
  editAd: [ad: Ad]
  deleteAd: [ad: Ad]
}>()
</script>

<style scoped>
@import './publicidad-shared.css';
</style>

<template>
  <div>
    <!-- Date range selector -->
    <div class="date-range-bar">
      <button
        class="range-btn"
        :class="{ active: dateRange === '7d' }"
        @click="$emit('update:dateRange', '7d')"
      >
        {{ t('admin.publicidad.last7d') }}
      </button>
      <button
        class="range-btn"
        :class="{ active: dateRange === '30d' }"
        @click="$emit('update:dateRange', '30d')"
      >
        {{ t('admin.publicidad.last30d') }}
      </button>
      <button
        class="range-btn"
        :class="{ active: dateRange === '90d' }"
        @click="$emit('update:dateRange', '90d')"
      >
        {{ t('admin.publicidad.last90d') }}
      </button>
      <button
        class="range-btn"
        :class="{ active: dateRange === 'custom' }"
        @click="$emit('update:dateRange', 'custom')"
      >
        {{ t('admin.publicidad.customRange') }}
      </button>
      <template v-if="dateRange === 'custom'">
        <input
          :value="customFrom"
          type="date"
          class="date-input"
          @input="$emit('update:customFrom', ($event.target as HTMLInputElement).value)"
        >
        <input
          :value="customTo"
          type="date"
          class="date-input"
          @input="$emit('update:customTo', ($event.target as HTMLInputElement).value)"
        >
        <button class="btn-primary btn-sm" @click="$emit('refresh')">
          {{ t('admin.publicidad.apply') }}
        </button>
      </template>
    </div>

    <!-- Summary cards -->
    <div class="stats-grid stats-grid--8">
      <div class="stat-card">
        <span class="stat-value">{{ formatNumber(summary.totalImpressions) }}</span>
        <span class="stat-label">{{ t('admin.publicidad.totalImpressions') }}</span>
      </div>
      <div class="stat-card">
        <span class="stat-value" style="color: #3b82f6">{{
          formatNumber(summary.totalClicks)
        }}</span>
        <span class="stat-label">{{ t('admin.publicidad.totalClicks') }}</span>
      </div>
      <div class="stat-card">
        <span class="stat-value" style="color: #8b5cf6">{{ summary.avgCTR }}</span>
        <span class="stat-label">{{ t('admin.publicidad.avgCtr') }}</span>
      </div>
      <div class="stat-card">
        <span class="stat-value" style="color: #16a34a">{{ summary.activeAds }}</span>
        <span class="stat-label">{{ t('admin.publicidad.activeAds') }}</span>
      </div>
      <div class="stat-card">
        <span class="stat-value" style="color: #059669">{{
          formatPrice(summary.estimatedRevenue)
        }}</span>
        <span class="stat-label">{{ t('admin.publicidad.estimatedRevenue') }}</span>
      </div>
      <div class="stat-card">
        <span class="stat-value" style="color: #0891b2">{{ formatPrice(summary.avgEcpm) }}</span>
        <span class="stat-label">{{ t('admin.publicidad.avgEcpm') }}</span>
      </div>
      <div class="stat-card">
        <span class="stat-value" style="color: #d97706">{{ summary.fillRate }}</span>
        <span class="stat-label">{{ t('admin.publicidad.fillRate') }}</span>
      </div>
      <div class="stat-card">
        <span class="stat-value" style="color: #7c3aed">{{ summary.viewabilityRate }}</span>
        <span class="stat-label">{{ t('admin.publicidad.viewabilityRate') }}</span>
      </div>
    </div>

    <!-- Revenue by Source -->
    <h3 class="section-subtitle">{{ t('admin.publicidad.revenueBySource') }}</h3>
    <div class="table-container">
      <table class="admin-table">
        <thead>
          <tr>
            <th>{{ t('admin.publicidad.source') }}</th>
            <th style="width: 100px">{{ t('admin.publicidad.impressions') }}</th>
            <th style="width: 100px">{{ t('admin.publicidad.revenue') }}</th>
            <th style="width: 80px">eCPM</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in revenueBySource" :key="row.source">
            <td>{{ t(`admin.publicidad.src_${row.source}`) }}</td>
            <td class="text-right">{{ formatNumber(row.impressions) }}</td>
            <td class="text-right">{{ formatPrice(row.revenue) }}</td>
            <td class="text-right">{{ formatPrice(row.ecpm) }}</td>
          </tr>
          <tr v-if="!revenueBySource.length">
            <td colspan="4" class="empty-state">{{ t('admin.publicidad.noEvents') }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Performance by Position -->
    <h3 class="section-subtitle">{{ t('admin.publicidad.performanceByPosition') }}</h3>
    <div class="table-container">
      <table class="admin-table">
        <thead>
          <tr>
            <th>{{ t('admin.publicidad.positions') }}</th>
            <th style="width: 90px">{{ t('admin.publicidad.impressions') }}</th>
            <th style="width: 70px">{{ t('admin.publicidad.clicks') }}</th>
            <th style="width: 60px">CTR</th>
            <th style="width: 90px">{{ t('admin.publicidad.viewability') }}</th>
            <th style="width: 90px">{{ t('admin.publicidad.revenue') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in performance" :key="row.position">
            <td>{{ row.position }}</td>
            <td class="text-right">{{ formatNumber(row.impressions) }}</td>
            <td class="text-right">{{ formatNumber(row.clicks) }}</td>
            <td class="text-right">{{ row.ctr }}</td>
            <td class="text-right">{{ row.viewabilityRate }}</td>
            <td class="text-right">{{ formatPrice(row.revenue) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- CTR by Format -->
    <h3 class="section-subtitle">{{ t('admin.publicidad.ctrByFormat') }}</h3>
    <div class="table-container">
      <table class="admin-table">
        <thead>
          <tr>
            <th>{{ t('admin.publicidad.format') }}</th>
            <th style="width: 100px">{{ t('admin.publicidad.impressions') }}</th>
            <th style="width: 80px">{{ t('admin.publicidad.clicks') }}</th>
            <th style="width: 60px">CTR</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in ctrByFormat" :key="row.format">
            <td>{{ row.format }}</td>
            <td class="text-right">{{ formatNumber(row.impressions) }}</td>
            <td class="text-right">{{ formatNumber(row.clicks) }}</td>
            <td class="text-right">{{ row.ctr }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Top 10 Performing Ads -->
    <h3 class="section-subtitle">{{ t('admin.publicidad.topPerformingAds') }}</h3>
    <div class="table-container">
      <table class="admin-table">
        <thead>
          <tr>
            <th>{{ t('admin.publicidad.adTitle') }}</th>
            <th>{{ t('admin.publicidad.advertiser') }}</th>
            <th style="width: 90px">{{ t('admin.publicidad.impressions') }}</th>
            <th style="width: 70px">{{ t('admin.publicidad.clicks') }}</th>
            <th style="width: 60px">CTR</th>
            <th style="width: 90px">{{ t('admin.publicidad.viewability') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in topAds" :key="row.adId">
            <td>{{ row.title }}</td>
            <td class="text-muted">{{ row.advertiser }}</td>
            <td class="text-right">{{ formatNumber(row.impressions) }}</td>
            <td class="text-right">{{ formatNumber(row.clicks) }}</td>
            <td class="text-right">{{ row.ctr }}</td>
            <td class="text-right">{{ row.viewableRate }}</td>
          </tr>
          <tr v-if="!topAds.length">
            <td colspan="6" class="empty-state">{{ t('admin.publicidad.noEvents') }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Audience Segments -->
    <h3 v-if="audience.length" class="section-subtitle">
      {{ t('admin.publicidad.audienceSegments') }}
    </h3>
    <div v-if="audience.length" class="table-container">
      <table class="admin-table">
        <thead>
          <tr>
            <th>{{ t('admin.publicidad.segment') }}</th>
            <th style="width: 100px">{{ t('admin.publicidad.users') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in audience" :key="row.segment">
            <td>
              <code>{{ row.segment }}</code>
            </td>
            <td class="text-right">{{ formatNumber(row.userCount) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatPrice, formatNumber } from '~/composables/admin/useAdminPublicidad'

const { t } = useI18n()

defineProps<{
  dateRange: string
  customFrom: string
  customTo: string
  summary: {
    totalImpressions: number
    totalClicks: number
    avgCTR: string
    activeAds: number
    estimatedRevenue: number
    avgEcpm: number
    fillRate: string
    viewabilityRate: string
  }
  revenueBySource: Array<{ source: string; impressions: number; revenue: number; ecpm: number }>
  performance: Array<{
    position: string
    impressions: number
    clicks: number
    ctr: string
    viewabilityRate: string
    revenue: number
  }>
  ctrByFormat: Array<{ format: string; impressions: number; clicks: number; ctr: string }>
  topAds: Array<{
    adId: string
    title: string
    advertiser: string
    impressions: number
    clicks: number
    ctr: string
    viewableRate: string
  }>
  audience: Array<{ segment: string; userCount: number }>
}>()

defineEmits<{
  'update:dateRange': [value: string]
  'update:customFrom': [value: string]
  'update:customTo': [value: string]
  refresh: []
}>()
</script>

<style scoped>
@import './publicidad-shared.css';
</style>

<template>
  <Teleport to="body">
    <div v-if="modal.show" class="modal-overlay" @click.self="$emit('close')">
      <div class="modal-content modal-large">
        <div class="modal-header">
          <h3>
            {{ modal.editing ? t('admin.publicidad.editAd') : t('admin.publicidad.createAd') }}
          </h3>
          <button class="modal-close" @click="$emit('close')">&times;</button>
        </div>
        <div class="modal-body">
          <!-- Advertiser -->
          <div class="form-group">
            <label for="ad-advertiser">{{ t('admin.publicidad.advertiser') }} *</label>
            <select id="ad-advertiser" v-model="modal.form.advertiser_id" required>
              <option value="" disabled>{{ t('admin.publicidad.selectAdvertiser') }}</option>
              <option v-for="adv in advertisers" :key="adv.id" :value="adv.id">
                {{ adv.company_name }}
              </option>
            </select>
          </div>

          <!-- Title / Description -->
          <div class="form-group">
            <label for="ad-title">{{ t('admin.publicidad.adTitle') }} *</label>
            <input id="ad-title" v-model="modal.form.title" type="text" required >
          </div>
          <div class="form-group">
            <label for="ad-desc">{{ t('admin.publicidad.description') }}</label>
            <textarea id="ad-desc" v-model="modal.form.description" rows="3" />
          </div>

          <!-- URLs -->
          <div class="form-row">
            <div class="form-group">
              <label for="ad-link">{{ t('admin.publicidad.linkUrl') }}</label>
              <input id="ad-link" v-model="modal.form.link_url" type="url" >
            </div>
            <div class="form-group">
              <label for="ad-image">{{ t('admin.publicidad.imageUrl') }}</label>
              <input id="ad-image" v-model="modal.form.image_url" type="text" >
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="ad-logo">{{ t('admin.publicidad.logoUrl') }}</label>
              <input id="ad-logo" v-model="modal.form.logo_url" type="text" >
            </div>
            <div class="form-group">
              <label for="ad-phone">{{ t('admin.publicidad.phone') }}</label>
              <input id="ad-phone" v-model="modal.form.phone" type="tel" >
            </div>
          </div>

          <div class="form-group">
            <label for="ad-email">{{ t('admin.publicidad.email') }}</label>
            <input id="ad-email" v-model="modal.form.email" type="email" >
          </div>

          <!-- Format -->
          <div class="form-group">
            <label for="ad-format">{{ t('admin.publicidad.format') }} *</label>
            <select id="ad-format" v-model="modal.form.format">
              <option v-for="f in AD_FORMATS" :key="f" :value="f">{{ f }}</option>
            </select>
          </div>

          <!-- Positions -->
          <div class="form-group">
            <label>{{ t('admin.publicidad.positions') }}</label>
            <div class="checkbox-grid">
              <label v-for="pos in AD_POSITIONS" :key="pos" class="checkbox-item">
                <input
                  type="checkbox"
                  :checked="modal.form.positions.includes(pos)"
                  @change="$emit('togglePosition', pos)"
                >
                <span>{{ pos }}</span>
              </label>
            </div>
          </div>

          <!-- Geo targeting -->
          <div class="form-row">
            <div class="form-group">
              <label for="ad-countries">{{ t('admin.publicidad.countries') }}</label>
              <input
                id="ad-countries"
                v-model="modal.form.countries"
                type="text"
                placeholder="ES,PT"
              >
            </div>
            <div class="form-group">
              <label for="ad-regions">{{ t('admin.publicidad.regions') }}</label>
              <input
                id="ad-regions"
                v-model="modal.form.regions"
                type="text"
                placeholder="andalucia,cataluna"
              >
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="ad-provinces">{{ t('admin.publicidad.provinces') }}</label>
              <input
                id="ad-provinces"
                v-model="modal.form.provinces"
                type="text"
                placeholder="madrid,barcelona"
              >
            </div>
            <div class="form-group">
              <label for="ad-cats">{{ t('admin.publicidad.categories') }}</label>
              <input
                id="ad-cats"
                v-model="modal.form.category_slugs"
                type="text"
                placeholder="semirremolques,cisternas"
              >
            </div>
          </div>

          <div class="form-group">
            <label for="ad-actions">{{ t('admin.publicidad.actionSlugs') }}</label>
            <input
              id="ad-actions"
              v-model="modal.form.action_slugs"
              type="text"
              placeholder="venta,alquiler"
            >
          </div>

          <!-- Target segments -->
          <div class="form-group">
            <label for="ad-segments">{{ t('admin.publicidad.targetSegments') }}</label>
            <input
              id="ad-segments"
              v-model="modal.form.target_segments"
              type="text"
              placeholder="cat:semirremolques,price:premium,intent:buyer"
            >
            <small class="form-help">{{ t('admin.publicidad.targetSegmentsHelp') }}</small>
          </div>

          <!-- Price & dates -->
          <div class="form-row">
            <div class="form-group">
              <label for="ad-price">{{ t('admin.publicidad.priceMonthly') }}</label>
              <input
                id="ad-price"
                v-model.number="modal.form.price_monthly_cents"
                type="number"
                min="0"
              >
            </div>
            <div class="form-group">
              <label for="ad-status">{{ t('admin.publicidad.status') }}</label>
              <select id="ad-status" v-model="modal.form.status">
                <option v-for="s in AD_STATUSES" :key="s" :value="s">
                  {{ t(`admin.publicidad.statusLabels.${s}`) }}
                </option>
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="ad-starts">{{ t('admin.publicidad.startDate') }}</label>
              <input id="ad-starts" v-model="modal.form.starts_at" type="datetime-local" >
            </div>
            <div class="form-group">
              <label for="ad-ends">{{ t('admin.publicidad.endDate') }}</label>
              <input id="ad-ends" v-model="modal.form.ends_at" type="datetime-local" >
            </div>
          </div>

          <!-- Checkboxes -->
          <div class="form-row checkboxes-row">
            <label class="checkbox-item">
              <input v-model="modal.form.include_in_pdf" type="checkbox" >
              <span>{{ t('admin.publicidad.includePdf') }}</span>
            </label>
            <label class="checkbox-item">
              <input v-model="modal.form.include_in_email" type="checkbox" >
              <span>{{ t('admin.publicidad.includeEmail') }}</span>
            </label>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="$emit('close')">
            {{ t('admin.publicidad.cancel') }}
          </button>
          <button
            class="btn-primary"
            :disabled="saving || !modal.form.title || !modal.form.advertiser_id"
            @click="$emit('save')"
          >
            {{ saving ? t('admin.publicidad.saving') : t('admin.publicidad.save') }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import type { Ad, Advertiser } from '~/composables/admin/useAdminPublicidad'
import { AD_POSITIONS, AD_FORMATS, AD_STATUSES } from '~/composables/admin/useAdminPublicidad'

const { t } = useI18n()

const modal = defineModel<{
  show: boolean
  editing: Ad | null
  form: {
    advertiser_id: string
    title: string
    description: string
    link_url: string
    image_url: string
    logo_url: string
    phone: string
    email: string
    format: string
    positions: string[]
    countries: string
    regions: string
    provinces: string
    category_slugs: string
    action_slugs: string
    target_segments: string
    price_monthly_cents: number
    starts_at: string
    ends_at: string
    include_in_pdf: boolean
    include_in_email: boolean
    status: string
  }
}>('modal', { required: true })

defineProps<{
  advertisers: Advertiser[]
  saving: boolean
}>()

defineEmits<{
  close: []
  save: []
  togglePosition: [pos: string]
}>()
</script>

<style scoped>
@import './publicidad-shared.css';
</style>

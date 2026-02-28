<template>
  <Teleport to="body">
    <div v-if="modal.show" class="modal-overlay" @click.self="$emit('close')">
      <div class="modal-content modal-medium">
        <div class="modal-header">
          <h3>
            {{
              modal.editing
                ? t('admin.publicidad.editAdvertiser')
                : t('admin.publicidad.createAdvertiser')
            }}
          </h3>
          <button class="modal-close" @click="$emit('close')">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label for="adv-name">{{ t('admin.publicidad.companyName') }} *</label>
            <input
              id="adv-name"
              v-model="modal.form.company_name"
              type="text"
              autocomplete="organization"
              required
            >
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="adv-email">{{ t('admin.publicidad.contactEmail') }}</label>
              <input
                id="adv-email"
                v-model="modal.form.contact_email"
                type="email"
                autocomplete="email"
              >
            </div>
            <div class="form-group">
              <label for="adv-phone">{{ t('admin.publicidad.contactPhone') }}</label>
              <input
                id="adv-phone"
                v-model="modal.form.contact_phone"
                type="tel"
                autocomplete="tel"
              >
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="adv-website">{{ t('admin.publicidad.website') }}</label>
              <input id="adv-website" v-model="modal.form.website" type="url" >
            </div>
            <div class="form-group">
              <label for="adv-tax">{{ t('admin.publicidad.taxId') }}</label>
              <input id="adv-tax" v-model="modal.form.tax_id" type="text" >
            </div>
          </div>
          <div class="form-group">
            <label for="adv-logo">{{ t('admin.publicidad.logoUrl') }}</label>
            <input
              id="adv-logo"
              v-model="modal.form.logo_url"
              type="text"
              placeholder="https://..."
            >
          </div>
          <div class="form-group">
            <label for="adv-status">{{ t('admin.publicidad.status') }}</label>
            <select id="adv-status" v-model="modal.form.status">
              <option v-for="s in ADVERTISER_STATUSES" :key="s" :value="s">
                {{ t(`admin.publicidad.statusLabels.${s}`) }}
              </option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="$emit('close')">
            {{ t('admin.publicidad.cancel') }}
          </button>
          <button
            class="btn-primary"
            :disabled="saving || !modal.form.company_name"
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
import type { Advertiser } from '~/composables/admin/useAdminPublicidad'
import { ADVERTISER_STATUSES } from '~/composables/admin/useAdminPublicidad'

const { t } = useI18n()

const modal = defineModel<{
  show: boolean
  editing: Advertiser | null
  form: {
    company_name: string
    contact_email: string
    contact_phone: string
    website: string
    tax_id: string
    logo_url: string
    status: string
  }
}>('modal', { required: true })

defineProps<{
  saving: boolean
}>()

defineEmits<{
  close: []
  save: []
}>()
</script>

<style scoped>
@import './publicidad-shared.css';
</style>

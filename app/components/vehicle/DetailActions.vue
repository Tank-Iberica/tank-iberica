<template>
  <div class="vehicle-actions-row">
    <button class="vehicle-pdf-btn" :title="$t('vehicle.downloadPdf')" @click="$emit('pdf')">
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
      <span>{{ $t('vehicle.downloadPdf') }}</span>
    </button>

    <div class="vehicle-contact-btns">
      <button v-if="sellerUserId" class="contact-btn contact-chat" @click="$emit('start-chat')">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        <span>{{ $t('messages.contactSeller') }}</span>
      </button>
      <a
        :href="`mailto:info@tracciona.com?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`"
        class="contact-btn contact-email"
        @click="$emit('contact-click', vehicleId, dealerId, 'form')"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
          <polyline points="22,6 12,13 2,6" />
        </svg>
        <span>{{ $t('vehicle.email') }}</span>
      </a>
      <a
        :href="`tel:${$t('nav.phoneNumber')}`"
        class="contact-btn contact-call"
        @click="$emit('contact-click', vehicleId, dealerId, 'phone')"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path
            d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"
          />
        </svg>
        <span>{{ $t('vehicle.call') }}</span>
      </a>
      <a
        :href="`https://wa.me/${$t('nav.whatsappNumber')}?text=${encodeURIComponent(shareText)}`"
        target="_blank"
        rel="noopener"
        class="contact-btn contact-whatsapp"
        @click="$emit('contact-click', vehicleId, dealerId, 'whatsapp')"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path
            d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"
          />
          <path
            d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.5.5 0 00.611.611l4.458-1.495A11.943 11.943 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22a9.94 9.94 0 01-5.39-1.586l-.386-.232-2.646.887.887-2.646-.232-.386A9.94 9.94 0 012 12C2 6.486 6.486 2 12 2s10 4.486 10 10-4.486 10-10 10z"
          />
        </svg>
        <span>{{ $t('vehicle.whatsapp') }}</span>
      </a>
    </div>

    <div class="vehicle-icon-btns">
      <button
        :class="['vehicle-icon-btn', 'favorite-btn', { active: isFav }]"
        :title="$t('vehicle.favorite')"
        @click="$emit('favorite')"
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          :fill="isFav ? 'currentColor' : 'none'"
          stroke="currentColor"
          stroke-width="2"
        >
          <polygon
            points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
          />
        </svg>
      </button>
      <button
        class="vehicle-icon-btn share-btn"
        :title="$t('vehicle.share')"
        @click="$emit('share')"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
          <polyline points="7 9 12 4 17 9" />
          <line x1="12" y1="4" x2="12" y2="16" />
        </svg>
      </button>
      <button
        class="vehicle-icon-btn report-btn"
        :title="$t('report.title')"
        @click="$emit('report')"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
          <line x1="4" y1="22" x2="4" y2="15" />
        </svg>
      </button>
      <button
        :class="['vehicle-icon-btn', 'compare-btn', { active: inComparison }]"
        :title="$t('comparator.addToCompare')"
        @click="$emit('compare')"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  vehicleId: string
  dealerId: string
  sellerUserId: string | null
  emailSubject: string
  emailBody: string
  shareText: string
  isFav: boolean
  inComparison: boolean
}>()

defineEmits<{
  (e: 'pdf' | 'favorite' | 'share' | 'report' | 'compare' | 'start-chat'): void
  (
    e: 'contact-click',
    vehicleId: string,
    dealerId: string,
    method: 'phone' | 'whatsapp' | 'form',
  ): void
}>()
</script>

<style scoped>
.vehicle-actions-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
  margin-bottom: var(--spacing-4);
}

.vehicle-pdf-btn {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.5rem 0.75rem;
  border: 2px solid var(--border-color-dark) !important;
  border-radius: 8px;
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: var(--font-size-sm);
  font-weight: 600;
  cursor: pointer;
  min-height: 44px;
  transition: all 0.2s ease;
}

.vehicle-pdf-btn:hover {
  border-color: var(--color-primary) !important;
  color: var(--color-primary);
}

.vehicle-contact-btns {
  display: flex;
  gap: 0.4rem;
  flex: 1;
  min-width: 0;
}

.contact-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  flex: 1;
  padding: 0.5rem 0.6rem;
  border-radius: 8px;
  font-weight: 600;
  font-size: var(--font-size-xs);
  min-height: 44px;
  text-decoration: none;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.contact-btn:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

.contact-chat {
  background: var(--color-primary);
  color: var(--color-white);
  border: none;
  cursor: pointer;
}

.contact-email {
  background: var(--color-primary);
  color: var(--color-white);
  opacity: 0.75;
}

.contact-call {
  background: #334155;
  color: var(--color-white);
}

.contact-whatsapp {
  background: #25d366;
  color: var(--color-white);
}

.vehicle-icon-btns {
  display: flex;
  gap: 0.4rem;
}

.vehicle-icon-btn {
  width: 44px;
  height: 44px;
  min-width: 44px;
  min-height: 44px;
  border-radius: 50%;
  border: 2px solid var(--border-color-dark) !important;
  background: var(--bg-primary);
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.vehicle-icon-btn:hover {
  border-color: var(--color-primary) !important;
  color: var(--color-primary);
  transform: scale(1.05);
}

.favorite-btn.active {
  border-color: #f39c12;
  background: rgba(243, 156, 18, 0.1);
  color: #f39c12;
}

.share-btn:hover {
  border-color: var(--color-primary);
  background: rgba(35, 66, 74, 0.05);
}

.report-btn:hover {
  border-color: var(--color-error) !important;
  color: var(--color-error);
}

.compare-btn.active {
  border-color: var(--color-primary) !important;
  background: rgba(35, 66, 74, 0.1);
  color: var(--color-primary);
}

/* Mobile base: contact btns on a separate row */
.vehicle-pdf-btn {
  order: 1;
  flex-shrink: 0;
}

.vehicle-pdf-btn span {
  display: none;
}

.vehicle-icon-btns {
  order: 2;
  margin-left: auto;
}

.vehicle-contact-btns {
  order: 3;
  flex-basis: 100%;
}

.contact-btn {
  padding: 0.5rem 0.4rem;
  font-size: 0.875rem;
  gap: 0.25rem;
}

@media (min-width: 480px) {
  .vehicle-actions-row {
    flex-wrap: nowrap;
  }

  .vehicle-pdf-btn {
    order: unset;
    flex-shrink: unset;
  }

  .vehicle-pdf-btn span {
    display: inline;
  }

  .vehicle-icon-btns {
    order: unset;
    margin-left: 0;
  }

  .vehicle-contact-btns {
    order: unset;
    flex-basis: auto;
  }

  .contact-btn {
    padding: 0.5rem 0.75rem;
    font-size: 0.875rem;
    gap: 0.4rem;
  }
}

@media (min-width: 768px) {
  .contact-btn {
    font-size: var(--font-size-sm);
    padding: 0.5rem 0.75rem;
  }
}
</style>

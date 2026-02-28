<script setup lang="ts">
import { useUserPanel } from '~/composables/user/useUserPanel'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const { locale } = useI18n()
const { t } = useI18n()

const {
  userDisplayName,
  userEmail,
  userInitial,
  favoritesCount,
  chatMessages,
  chatLoading,
  chatSending,
  chatUnread,
  sendMessage,
  formatTime,
  activeSection,
  toggleSection,
  profileForm,
  profileSaving,
  profileMessage,
  saveProfile,
  subscriptions,
  saveSubscriptions,
  userDemands,
  demandsLoading,
  userAds,
  adsLoading,
  exportLoading,
  deleteModalOpen,
  deleteLoading,
  deleteError,
  handleExportData,
  openDeleteModal,
  handleDeleteAccount,
  handleLogout,
  panelBanner,
} = useUserPanel(
  () => props.modelValue,
  () => emit('update:modelValue', false),
)

const demandItems = computed(() =>
  userDemands.value.map((d) => ({
    id: d.id,
    title: d.vehicle_type,
    date: d.created_at,
    status: d.status,
  })),
)

const adItems = computed(() =>
  userAds.value.map((a) => ({
    id: a.id,
    title: `${a.brand} ${a.model}`,
    date: a.created_at,
    status: a.status,
  })),
)
</script>

<template>
  <Teleport to="body">
    <Transition name="panel">
      <div v-if="modelValue" class="user-panel-wrapper">
        <div class="user-panel-overlay" @click="emit('update:modelValue', false)" />

        <aside class="user-panel">
          <button class="panel-close" @click="emit('update:modelValue', false)">&times;</button>

          <a
            v-if="panelBanner"
            :href="panelBanner.url || undefined"
            class="panel-banner"
            :target="panelBanner.url ? '_blank' : undefined"
            :rel="panelBanner.url ? 'noopener' : undefined"
          >
            {{ locale === 'en' ? panelBanner.text_en : panelBanner.text_es }}
          </a>

          <div class="panel-header">
            <div class="user-avatar">
              <span>{{ userInitial }}</span>
            </div>
            <div class="user-info">
              <h2>{{ userDisplayName }}</h2>
              <p>{{ userEmail }}</p>
            </div>
          </div>

          <div class="panel-menu">
            <!-- PERFIL -->
            <UserPanelSection
              section-id="perfil"
              :active-section="activeSection"
              :title="t('user.profile')"
              @toggle="toggleSection"
            >
              <UserPanelProfileForm
                :initial-data="profileForm"
                :saving="profileSaving"
                :message="profileMessage"
                @save="saveProfile"
              />
            </UserPanelSection>

            <!-- CHAT -->
            <UserPanelSection
              section-id="chat"
              :active-section="activeSection"
              :title="t('user.chat')"
              :badge="chatUnread"
              @toggle="toggleSection"
            >
              <UserPanelChat
                :messages="chatMessages"
                :loading="chatLoading"
                :sending="chatSending"
                :send-message="sendMessage"
                :format-time="formatTime"
              />
            </UserPanelSection>

            <!-- FAVORITOS -->
            <UserPanelSection
              section-id="favoritos"
              :active-section="activeSection"
              :title="t('user.favorites')"
              :badge="favoritesCount()"
              @toggle="toggleSection"
            >
              <div v-if="favoritesCount() === 0" class="empty-state">
                {{ t('user.noFavorites') }}
              </div>
              <div v-else class="favorites-section">
                <p class="favorites-count">{{ favoritesCount() }} {{ t('user.vehiclesSaved') }}</p>
                <NuxtLink to="/" class="btn-secondary" @click="emit('update:modelValue', false)">
                  {{ t('user.viewFavorites') }}
                </NuxtLink>
              </div>
            </UserPanelSection>

            <!-- SOLICITUDES -->
            <UserPanelSection
              section-id="solicitudes"
              :active-section="activeSection"
              :title="t('user.requests')"
              @toggle="toggleSection"
            >
              <p class="section-info">{{ t('user.requestsInfo') }}</p>
              <UserPanelItemsList
                :items="demandItems"
                :loading="demandsLoading"
                empty-key="user.noRequests"
              />
            </UserPanelSection>

            <!-- MIS ANUNCIOS -->
            <UserPanelSection
              section-id="anuncios"
              :active-section="activeSection"
              :title="t('user.myAds')"
              @toggle="toggleSection"
            >
              <UserPanelItemsList :items="adItems" :loading="adsLoading" empty-key="user.noAds" />
            </UserPanelSection>

            <!-- FACTURAS -->
            <UserPanelSection
              section-id="facturas"
              :active-section="activeSection"
              :title="t('user.invoices')"
              @toggle="toggleSection"
            >
              <div class="empty-state">{{ t('user.noInvoices') }}</div>
              <p class="section-info">{{ t('user.invoicesInfo') }}</p>
            </UserPanelSection>

            <!-- SUSCRIPCIONES -->
            <UserPanelSection
              section-id="suscripciones"
              :active-section="activeSection"
              :title="t('user.subscriptions')"
              @toggle="toggleSection"
            >
              <h4>{{ t('user.receiveNotifications') }}</h4>
              <label class="checkbox-label">
                <input v-model="subscriptions.web" type="checkbox" @change="saveSubscriptions" >
                <span>{{ t('user.webNotifications') }}</span>
              </label>
              <label class="checkbox-label">
                <input v-model="subscriptions.prensa" type="checkbox" @change="saveSubscriptions" >
                <span>{{ t('user.pressArea') }}</span>
              </label>
              <label class="checkbox-label">
                <input
                  v-model="subscriptions.boletines"
                  type="checkbox"
                  @change="saveSubscriptions"
                >
                <span>{{ t('user.newsletters') }}</span>
              </label>
              <label class="checkbox-label">
                <input
                  v-model="subscriptions.destacados"
                  type="checkbox"
                  @change="saveSubscriptions"
                >
                <span>{{ t('user.featuredVehicles') }}</span>
              </label>
              <label class="checkbox-label">
                <input
                  v-model="subscriptions.eventos"
                  type="checkbox"
                  @change="saveSubscriptions"
                >
                <span>{{ t('user.events') }}</span>
              </label>
              <label class="checkbox-label">
                <input v-model="subscriptions.rsc" type="checkbox" @change="saveSubscriptions" >
                <span>{{ t('user.csr') }}</span>
              </label>
            </UserPanelSection>

            <!-- GDPR DANGER ZONE -->
            <UserPanelSection
              section-id="danger"
              :active-section="activeSection"
              :title="t('gdpr.dangerZone')"
              :danger="true"
              @toggle="toggleSection"
            >
              <p class="section-info">{{ t('gdpr.dangerZoneDesc') }}</p>
              <button class="btn-export" :disabled="exportLoading" @click="handleExportData">
                {{ exportLoading ? t('common.loading') : t('gdpr.exportData') }}
              </button>
              <button class="btn-delete-account" @click="openDeleteModal">
                {{ t('gdpr.deleteAccount') }}
              </button>
            </UserPanelSection>
          </div>

          <div class="panel-footer">
            <button class="btn-logout" @click="handleLogout">{{ t('user.logout') }}</button>
          </div>
        </aside>
      </div>
    </Transition>
  </Teleport>

  <UserPanelDeleteModal
    :open="deleteModalOpen"
    :loading="deleteLoading"
    :api-error="deleteError"
    @close="deleteModalOpen = false"
    @confirm="handleDeleteAccount"
  />
</template>

<style scoped>
.user-panel-wrapper {
  position: fixed;
  inset: 0;
  z-index: 9999;
}

.user-panel-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
}

.user-panel {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  max-width: 400px;
  background: white;
  display: flex;
  flex-direction: column;
  box-shadow: -4px 0 24px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}

.panel-close {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 44px;
  height: 44px;
  min-width: 44px;
  min-height: 44px;
  border: none;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 50%;
  font-size: 24px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  z-index: 10;
}

.panel-close:hover {
  background: rgba(0, 0, 0, 0.1);
}

.panel-banner {
  display: flex;
  padding: var(--spacing-3, 12px) var(--spacing-4, 16px);
  background: linear-gradient(
    135deg,
    var(--color-primary, #23424a) 0%,
    var(--color-primary-dark, #1a3238) 100%
  );
  color: var(--color-white, #fff);
  font-size: var(--font-size-sm, 0.875rem);
  font-weight: 600;
  text-align: center;
  text-decoration: none;
  border-radius: var(--border-radius, 8px);
  margin: 12px 12px 0;
  min-height: 44px;
  align-items: center;
  justify-content: center;
}

.panel-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 24px 20px;
  background: var(--color-primary, #23424a);
  color: white;
}

.user-avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: 600;
  flex-shrink: 0;
}

.user-info h2 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
}

.user-info p {
  margin: 4px 0 0;
  font-size: 0.85rem;
  opacity: 0.8;
}

.panel-menu {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}

.panel-footer {
  padding: 16px 20px;
  border-top: 1px solid #eee;
}

.btn-logout {
  width: 100%;
  padding: 12px;
  background: none;
  border: 1px solid #ddd;
  border-radius: 8px;
  color: #666;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-logout:hover {
  background: #fee2e2;
  border-color: #fca5a5;
  color: #dc2626;
}

.section-info {
  font-size: 0.85rem;
  color: #666;
  margin-bottom: 12px;
}

.empty-state {
  text-align: center;
  color: #999;
  padding: 20px;
  font-size: 0.9rem;
}

.favorites-section .favorites-count {
  margin-bottom: 12px;
  font-weight: 500;
}

.btn-secondary {
  display: block;
  width: 100%;
  padding: 12px;
  background: #f0f0f0;
  color: #333;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  text-align: center;
  text-decoration: none;
  cursor: pointer;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 0;
  cursor: pointer;
}

.checkbox-label input[type='checkbox'] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.btn-export {
  width: 100%;
  padding: 12px;
  background: var(--color-primary, #23424a);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  margin-bottom: 8px;
  min-height: 44px;
}

.btn-export:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-delete-account {
  width: 100%;
  padding: 12px;
  background: #dc2626;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  min-height: 44px;
  transition: background 0.15s;
}

.btn-delete-account:hover {
  background: #b91c1c;
}

/* Panel slide-in transitions */
.panel-enter-active,
.panel-leave-active {
  transition: opacity 0.3s ease;
}

.panel-enter-active .user-panel,
.panel-leave-active .user-panel {
  transition: transform 0.3s ease;
}

.panel-enter-from,
.panel-leave-to {
  opacity: 0;
}

.panel-enter-from .user-panel,
.panel-leave-to .user-panel {
  transform: translateX(100%);
}

@media (max-width: 480px) {
  .user-panel {
    max-width: 100%;
  }
}
</style>

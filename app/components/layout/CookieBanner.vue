<script setup lang="ts">
import type { ConsentState } from '~/composables/useConsent'

const { loaded, loadConsent, saveConsent, defaultConsent } = useConsent()

/** Whether the banner is visible */
const visible = ref(false)

/** Whether the customization panel is expanded */
const showCustomize = ref(false)

/** Local toggle state for customization */
const localConsent = ref<ConsentState>({
  necessary: true,
  analytics: false,
  marketing: false,
  timestamp: '',
})

/** Load consent on mount, show banner if no consent stored */
onMounted(() => {
  const stored = loadConsent()
  if (!stored) {
    visible.value = true
    localConsent.value = { ...defaultConsent }
  } else {
    localConsent.value = { ...stored }
  }
})

/** Accept all cookies */
async function acceptAll() {
  await saveConsent({
    necessary: true,
    analytics: true,
    marketing: true,
    timestamp: new Date().toISOString(),
  })
  visible.value = false
  showCustomize.value = false
}

/** Accept only necessary cookies */
async function acceptNecessary() {
  await saveConsent({
    necessary: true,
    analytics: false,
    marketing: false,
    timestamp: new Date().toISOString(),
  })
  visible.value = false
  showCustomize.value = false
}

/** Save custom preferences */
async function saveCustom() {
  await saveConsent({
    necessary: true,
    analytics: localConsent.value.analytics,
    marketing: localConsent.value.marketing,
    timestamp: new Date().toISOString(),
  })
  visible.value = false
  showCustomize.value = false
}

/** Toggle customization panel */
function toggleCustomize() {
  showCustomize.value = !showCustomize.value
}
</script>

<template>
  <Teleport to="body">
    <Transition name="cookie-banner">
      <div
        v-if="visible && loaded"
        class="cookie-banner"
        role="dialog"
        :aria-label="$t('gdpr.bannerTitle')"
        aria-modal="false"
      >
        <div class="cookie-banner__inner">
          <!-- Main banner content -->
          <div class="cookie-banner__main">
            <div class="cookie-banner__text">
              <h3 class="cookie-banner__title">{{ $t('gdpr.bannerTitle') }}</h3>
              <p class="cookie-banner__desc">{{ $t('gdpr.bannerDesc') }}</p>
              <NuxtLink to="/legal" class="cookie-banner__link">
                {{ $t('gdpr.learnMore') }}
              </NuxtLink>
            </div>

            <div class="cookie-banner__actions">
              <button class="cookie-banner__btn cookie-banner__btn--primary" @click="acceptAll">
                {{ $t('gdpr.acceptAll') }}
              </button>
              <button
                class="cookie-banner__btn cookie-banner__btn--secondary"
                @click="acceptNecessary"
              >
                {{ $t('gdpr.acceptNecessary') }}
              </button>
              <button
                class="cookie-banner__btn cookie-banner__btn--outline"
                @click="toggleCustomize"
              >
                {{ $t('gdpr.customize') }}
              </button>
            </div>
          </div>

          <!-- Customization panel -->
          <Transition name="customize-panel">
            <div v-if="showCustomize" class="cookie-banner__customize">
              <div class="cookie-banner__separator" />

              <!-- Necessary cookies (always on) -->
              <div class="cookie-category">
                <div class="cookie-category__info">
                  <span class="cookie-category__name">{{ $t('gdpr.categoryNecessary') }}</span>
                  <span class="cookie-category__desc">{{ $t('gdpr.categoryNecessaryDesc') }}</span>
                </div>
                <label class="cookie-toggle cookie-toggle--disabled">
                  <input
                    id="cookie-necessary"
                    type="checkbox"
                    checked
                    disabled
                    :aria-label="$t('gdpr.categoryNecessary')"
                  >
                  <span class="cookie-toggle__slider" />
                </label>
              </div>

              <!-- Analytics cookies -->
              <div class="cookie-category">
                <div class="cookie-category__info">
                  <span class="cookie-category__name">{{ $t('gdpr.categoryAnalytics') }}</span>
                  <span class="cookie-category__desc">{{ $t('gdpr.categoryAnalyticsDesc') }}</span>
                </div>
                <label
                  class="cookie-toggle"
                  :class="{ 'cookie-toggle--active': localConsent.analytics }"
                >
                  <input
                    id="cookie-analytics"
                    v-model="localConsent.analytics"
                    type="checkbox"
                    :aria-label="$t('gdpr.categoryAnalytics')"
                  >
                  <span class="cookie-toggle__slider" />
                </label>
              </div>

              <!-- Marketing cookies -->
              <div class="cookie-category">
                <div class="cookie-category__info">
                  <span class="cookie-category__name">{{ $t('gdpr.categoryMarketing') }}</span>
                  <span class="cookie-category__desc">{{ $t('gdpr.categoryMarketingDesc') }}</span>
                </div>
                <label
                  class="cookie-toggle"
                  :class="{ 'cookie-toggle--active': localConsent.marketing }"
                >
                  <input
                    id="cookie-marketing"
                    v-model="localConsent.marketing"
                    type="checkbox"
                    :aria-label="$t('gdpr.categoryMarketing')"
                  >
                  <span class="cookie-toggle__slider" />
                </label>
              </div>

              <!-- Save preferences button -->
              <button
                class="cookie-banner__btn cookie-banner__btn--primary cookie-banner__btn--full"
                @click="saveCustom"
              >
                {{ $t('gdpr.savePreferences') }}
              </button>
            </div>
          </Transition>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.cookie-banner {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 10000;
  padding: var(--spacing-3);
  pointer-events: none;
}

.cookie-banner__inner {
  max-width: 720px;
  margin: 0 auto;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-xl);
  padding: var(--spacing-4);
  pointer-events: auto;
}

/* Main content */
.cookie-banner__main {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
}

.cookie-banner__title {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: 0 0 var(--spacing-1) 0;
}

.cookie-banner__desc {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  line-height: var(--line-height-normal);
  margin: 0;
}

.cookie-banner__link {
  display: inline-block;
  margin-top: var(--spacing-1);
  font-size: var(--font-size-xs);
  color: var(--color-primary);
  text-decoration: underline;
}

/* Actions */
.cookie-banner__actions {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.cookie-banner__btn {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: var(--spacing-3) var(--spacing-4);
  border-radius: var(--border-radius);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  border: none;
  transition:
    background-color var(--transition-fast),
    border-color var(--transition-fast);
}

.cookie-banner__btn--primary {
  background-color: var(--color-primary);
  color: var(--color-white);
}

.cookie-banner__btn--primary:hover {
  background-color: var(--color-primary-dark);
}

.cookie-banner__btn--secondary {
  background-color: var(--bg-tertiary);
  color: var(--text-primary);
}

.cookie-banner__btn--secondary:hover {
  background-color: var(--color-gray-300);
}

.cookie-banner__btn--outline {
  background: transparent;
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
}

.cookie-banner__btn--outline:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.cookie-banner__btn--full {
  width: 100%;
  margin-top: var(--spacing-3);
}

/* Customization panel */
.cookie-banner__customize {
  overflow: hidden;
}

.cookie-banner__separator {
  height: 1px;
  background: var(--border-color-light);
  margin: var(--spacing-4) 0;
}

/* Cookie category rows */
.cookie-category {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-3);
  padding: var(--spacing-3) 0;
}

.cookie-category + .cookie-category {
  border-top: 1px solid var(--color-gray-100);
}

.cookie-category__info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;
}

.cookie-category__name {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
}

.cookie-category__desc {
  font-size: var(--font-size-xs);
  color: var(--text-auxiliary);
  line-height: var(--line-height-normal);
}

/* Toggle switch */
.cookie-toggle {
  position: relative;
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  cursor: pointer;
  width: 48px;
  height: 28px;
  min-height: 44px;
  min-width: 44px;
  justify-content: center;
}

.cookie-toggle input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.cookie-toggle__slider {
  position: absolute;
  width: 48px;
  height: 28px;
  background-color: var(--color-gray-300);
  border-radius: var(--border-radius-full);
  transition: background-color var(--transition-fast);
}

.cookie-toggle__slider::before {
  content: '';
  position: absolute;
  top: 3px;
  left: 3px;
  width: 22px;
  height: 22px;
  background-color: var(--color-white);
  border-radius: 50%;
  transition: transform var(--transition-fast);
  box-shadow: var(--shadow-sm);
}

.cookie-toggle--active .cookie-toggle__slider {
  background-color: var(--color-primary);
}

.cookie-toggle--active .cookie-toggle__slider::before {
  transform: translateX(20px);
}

.cookie-toggle--disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.cookie-toggle--disabled .cookie-toggle__slider {
  background-color: var(--color-primary-light);
}

.cookie-toggle--disabled .cookie-toggle__slider::before {
  transform: translateX(20px);
}

/* ---- Transitions ---- */
.cookie-banner-enter-active {
  transition:
    transform var(--transition-normal),
    opacity var(--transition-normal);
}

.cookie-banner-leave-active {
  transition:
    transform var(--transition-fast),
    opacity var(--transition-fast);
}

.cookie-banner-enter-from {
  opacity: 0;
  transform: translateY(24px);
}

.cookie-banner-leave-to {
  opacity: 0;
  transform: translateY(24px);
}

.customize-panel-enter-active,
.customize-panel-leave-active {
  transition: all var(--transition-normal);
  overflow: hidden;
}

.customize-panel-enter-from,
.customize-panel-leave-to {
  opacity: 0;
  max-height: 0;
}

.customize-panel-enter-to,
.customize-panel-leave-from {
  max-height: 500px;
}

/* ---- Tablet / Desktop ---- */
@media (min-width: 768px) {
  .cookie-banner {
    padding: var(--spacing-4);
  }

  .cookie-banner__inner {
    padding: var(--spacing-6);
  }

  .cookie-banner__main {
    flex-direction: row;
    align-items: flex-start;
    gap: var(--spacing-6);
  }

  .cookie-banner__text {
    flex: 1;
    min-width: 0;
  }

  .cookie-banner__actions {
    flex-direction: column;
    flex-shrink: 0;
    width: 180px;
  }
}
</style>

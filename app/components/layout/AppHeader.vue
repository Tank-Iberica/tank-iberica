<template>
  <header :class="['app-header', { scrolled }]">
    <div class="header-content">
      <NuxtLink to="/" class="logo">TRACCIONA</NuxtLink>

      <div class="header-right">
        <!-- Anúnciate button -->
        <button class="anunciate-btn" @click="$emit('openAnunciate')">
          <span class="anunciate-mobile">{{ $t('catalog.anunciate') }}</span>
          <span class="anunciate-desktop">{{ $t('catalog.anunciateDesktop') }}</span>
        </button>

        <!-- Desktop: social links (5 icons) -->
        <nav class="social-links desktop-only" :aria-label="$t('nav.contact')">
          <a :href="`mailto:${$t('nav.email')}`" class="contact-icon" :title="$t('nav.contact')">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
              />
              <polyline points="22,6 12,13 2,6" />
            </svg>
          </a>
          <a :href="`tel:${$t('nav.phoneNumber')}`" class="contact-icon" :title="$t('nav.phone')">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"
              />
            </svg>
          </a>
          <a
            :href="`https://wa.me/${$t('nav.whatsappNumber')}`"
            target="_blank"
            rel="noopener"
            class="contact-icon"
            title="WhatsApp"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path
                d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"
              />
            </svg>
          </a>
          <!-- LinkedIn and Facebook links hidden until profiles are created -->
        </nav>

        <!-- Mobile: Contact & Social dropdown (globe icon) -->
        <div
          :class="['mobile-menu-group', 'mobile-only', { active: openMenu === 'social' }]"
          @click.stop="toggleMenu('social')"
        >
          <button class="header-icon-btn mobile-trigger" aria-label="Social">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <path
                d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"
              />
            </svg>
          </button>
          <Transition name="dropdown">
            <div v-if="openMenu === 'social'" class="mobile-menu-dropdown">
              <a :href="`mailto:${$t('nav.email')}`" class="header-icon-btn" title="Email">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path
                    d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
                  />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </a>
              <a
                :href="`tel:${$t('nav.phoneNumber')}`"
                class="header-icon-btn"
                :title="$t('nav.phone')"
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
                    d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"
                  />
                </svg>
              </a>
              <a
                :href="`https://wa.me/${$t('nav.whatsappNumber')}`"
                target="_blank"
                rel="noopener"
                class="header-icon-btn"
                title="WhatsApp"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path
                    d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"
                  />
                </svg>
              </a>
              <!-- LinkedIn and Facebook links hidden until profiles are created -->
            </div>
          </Transition>
        </div>

        <!-- Mobile: Language dropdown (flag) -->
        <div
          :class="['mobile-menu-group', 'mobile-only', { active: openMenu === 'lang' }]"
          @click.stop="toggleMenu('lang')"
        >
          <button class="header-icon-btn mobile-trigger lang-trigger">
            <img
              :src="`https://flagcdn.com/w40/${locale === 'es' ? 'es' : 'gb'}.png`"
              :alt="locale.toUpperCase()"
              class="lang-flag"
            >
          </button>
          <Transition name="dropdown">
            <div v-if="openMenu === 'lang'" class="mobile-lang-dropdown">
              <button
                class="header-icon-btn lang-option"
                @click.stop="
                  () => {
                    setLocale(altLocale as 'es' | 'en')
                    openMenu = null
                  }
                "
              >
                <img
                  :src="`https://flagcdn.com/w40/${locale === 'es' ? 'gb' : 'es'}.png`"
                  :alt="altLocale.toUpperCase()"
                  class="lang-flag"
                >
              </button>
            </div>
          </Transition>
        </div>

        <!-- Desktop: Language switcher with flags -->
        <div class="lang-switch desktop-only">
          <button
            :class="['lang-flag-btn', { active: locale === 'es' }]"
            title="Español"
            @click="setLocale('es')"
          >
            <img src="https://flagcdn.com/w40/es.png" alt="ES" class="lang-flag-desktop" >
          </button>
          <button
            :class="['lang-flag-btn', { active: locale === 'en' }]"
            title="English"
            @click="setLocale('en')"
          >
            <img src="https://flagcdn.com/w40/gb.png" alt="EN" class="lang-flag-desktop" >
          </button>
        </div>

        <!-- Account button (not logged in) -->
        <button
          v-if="!authState.isAuthenticated.value"
          class="account-btn"
          @click="$emit('openAuth')"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <span class="account-text">{{ $t('nav.myAccount') }}</span>
        </button>

        <!-- Logged-in user — opens UserPanel -->
        <button v-else class="account-btn logged-in" @click="$emit('openUserPanel')">
          <span class="account-icon-wrap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <span
              v-if="unreadMessages > 0"
              class="account-unread-badge"
              aria-label="`${unreadMessages} mensajes no leídos`"
            >
              {{ unreadMessages > 9 ? '9+' : unreadMessages }}
            </span>
          </span>
          <span class="account-text">{{ userDisplayName }}</span>
        </button>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
defineEmits<{
  openAuth: []
  openAnunciate: []
  openUserPanel: []
}>()

const user = useSupabaseUser()
const authState = useAuth()
const { unreadCount: unreadMessages } = useUnreadMessages()

const { locale, setLocale } = useI18n()
const scrolled = ref(false)
const openMenu = ref<string | null>(null)

const altLocale = computed(() => (locale.value === 'es' ? 'en' : 'es'))

const userDisplayName = computed(() => {
  if (authState.displayName.value) return authState.displayName.value
  if (!user.value) return ''
  return (
    user.value.user_metadata?.pseudonimo ||
    user.value.user_metadata?.name ||
    user.value.email?.split('@')[0] ||
    ''
  )
})

function toggleMenu(menu: string) {
  openMenu.value = openMenu.value === menu ? null : menu
}

function closeMenus(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (!target.closest('.mobile-menu-group') && !target.closest('.user-menu')) {
    openMenu.value = null
  }
}

function onScroll() {
  scrolled.value = window.scrollY > 30
}

// Fetch user profile on mount — function handles auth check internally via getSession()
onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true })
  document.addEventListener('click', closeMenus)
  authState.fetchProfile()
})

onUnmounted(() => {
  window.removeEventListener('scroll', onScroll)
  document.removeEventListener('click', closeMenus)
})
</script>

<style scoped>
/* ============================================
   HEADER — BASE = MOBILE (360px)
   ============================================ */
.app-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: var(--z-header);
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
  color: var(--color-white);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
}

/* Scrolled state — mobile */
.app-header.scrolled {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.scrolled .header-content {
  padding-top: 0.2rem;
  padding-bottom: 0.2rem;
}

.scrolled .header-icon-btn {
  width: 36px;
  height: 36px;
  min-width: 36px;
  min-height: 36px;
}

.scrolled .header-icon-btn svg {
  width: 15px;
  height: 15px;
}

/* .scrolled .account-btn — mobile shrink handled here, desktop override at ≥768px */
.scrolled .account-btn {
  width: 36px;
  height: 36px;
  min-width: 36px;
  min-height: 36px;
}

.scrolled .account-btn svg {
  width: 15px;
  height: 15px;
}

.scrolled .lang-flag {
  width: 18px;
  height: 18px;
}

.scrolled .logo {
  font-size: 1rem;
  letter-spacing: 0.3px;
}

.header-content {
  max-width: 100%;
  margin: 0 auto;
  padding: 0.8rem 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  transition: padding 0.4s ease;
}

/* ============================================
   LOGO — Base = smallest mobile (<=360px)
   Legacy: 300 weight, text-shadow, uppercase
   ============================================ */
.logo {
  font-size: 1.2rem;
  font-weight: 300;
  letter-spacing: 0.5px;
  color: var(--color-white);
  text-decoration: none;
  text-transform: uppercase;
  white-space: nowrap;
  flex-shrink: 0;
  transition: font-size 0.4s ease;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

/* ============================================
   ANUNCIATE BUTTON — gold gradient, same height as header buttons
   ============================================ */
.anunciate-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--color-gold) 0%, var(--color-gold-dark) 100%);
  color: var(--color-white);
  border: 2px solid var(--color-gold-dark);
  border-radius: 9999px;
  height: 38px;
  padding: 0 0.8rem;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  line-height: 1;
  letter-spacing: 0;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
  flex-shrink: 0;
}

.anunciate-btn:hover {
  background: linear-gradient(135deg, var(--color-gold-dark) 0%, var(--color-gold) 100%);
  border-color: var(--color-gold);
}

/* Mobile: show short text */
.anunciate-mobile {
  display: inline;
}

/* Desktop: show full text */
.anunciate-desktop {
  display: none;
}

/* Scrolled state — mobile: match other header buttons (36px) */
.scrolled .anunciate-btn {
  height: 36px;
  min-height: 36px;
  padding: 0 0.6rem;
  font-size: 10px;
}

/* ============================================
   DESKTOP SOCIAL ICONS
   ============================================ */
.social-links {
  display: flex;
  gap: 0.6rem;
  align-items: center;
  flex-shrink: 0;
}

.contact-icon {
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 50%;
  color: var(--color-white);
  text-decoration: none;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  cursor: pointer;
  flex-shrink: 0;
}

.contact-icon:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-3px) scale(1.05);
}

/* .scrolled .contact-icon — moved to ≥768px media query */

/* ============================================
   MOBILE MENU GROUPS
   ============================================ */
.mobile-menu-group {
  position: relative;
}

/* Connection bridge between trigger and dropdown */
.mobile-menu-group.active::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  height: 15px;
}

.header-icon-btn {
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 50%;
  color: var(--color-white);
  text-decoration: none;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  cursor: pointer;
  flex-shrink: 0;
  border: none;
}

.header-icon-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
}

/* Active menu trigger indicator — glow */
.mobile-menu-group.active > .header-icon-btn,
.mobile-menu-group.active > .mobile-trigger {
  background: rgba(255, 255, 255, 0.4);
  box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.2);
}

/* Mobile dropdowns — HORIZONTAL row, CENTERED under trigger */
.mobile-menu-dropdown {
  position: absolute;
  top: calc(100% + 10px);
  left: 50%;
  transform: translateX(-50%);
  background: rgba(35, 66, 74, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  display: flex;
  flex-direction: row;
  gap: 6px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  padding: 8px;
  z-index: 1000;
}

.mobile-menu-dropdown .header-icon-btn {
  width: 36px;
  height: 36px;
}

.mobile-menu-dropdown .header-icon-btn svg {
  width: 16px;
  height: 16px;
}

/* ============================================
   LANGUAGE SELECTOR
   ============================================ */

/* Mobile: flag trigger */
.lang-trigger {
  padding: 0.4rem;
  overflow: hidden;
}

.lang-flag {
  width: 26px;
  height: 18px;
  border-radius: 9999px;
  object-fit: cover;
  display: block;
}

/* Mobile lang dropdown — CIRCULAR like legacy */
.mobile-lang-dropdown {
  position: absolute;
  top: calc(100% + 10px);
  left: 50%;
  transform: translateX(-50%);
  background: rgba(35, 66, 74, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 50%;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
  padding: 4px;
  z-index: 1000;
}

.lang-option {
  cursor: pointer;
}

/* Desktop: Flag buttons */
.lang-switch {
  display: flex;
  gap: 0.3rem;
  flex-shrink: 0;
  align-items: center;
}

.lang-flag-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid transparent !important;
  border-radius: 9999px;
  cursor: pointer;
  padding: 3px;
  transition: all 0.3s ease;
  min-height: auto;
  min-width: auto;
  opacity: 0.6;
}

.lang-flag-btn:hover {
  opacity: 0.9;
  background: rgba(255, 255, 255, 0.2);
}

.lang-flag-btn.active {
  opacity: 1;
  border-color: var(--color-white) !important;
  background: rgba(255, 255, 255, 0.2);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.lang-flag-desktop {
  width: 28px;
  height: 19px;
  object-fit: cover;
  border-radius: 9999px;
  display: block;
}

/* ============================================
   ACCOUNT BUTTON — Base = mobile (icon only, circle)
   ============================================ */
.account-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background: rgba(255, 255, 255, 0.15);
  width: 38px;
  height: 38px;
  min-width: 38px;
  min-height: 38px;
  padding: 0;
  border-radius: 50%;
  backdrop-filter: blur(10px);
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
  color: var(--color-white);
  font-size: 0.85rem;
  font-weight: 600;
  white-space: nowrap;
}

.account-btn:hover {
  background: rgba(255, 255, 255, 0.25);
}

.account-btn svg {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.account-icon-wrap {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.account-unread-badge {
  position: absolute;
  top: -6px;
  right: -8px;
  background: #ef4444;
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  line-height: 1;
  padding: 2px 4px;
  border-radius: 999px;
  min-width: 16px;
  text-align: center;
  pointer-events: none;
}

/* Hidden on mobile — shown at desktop via media query */
.account-text {
  display: none;
}

.account-btn.logged-in {
  background: rgba(255, 255, 255, 0.25);
}

/* ============================================
   TRANSITIONS
   ============================================ */
.dropdown-enter-active {
  transition:
    opacity 0.15s ease,
    transform 0.15s ease;
}
.dropdown-leave-active {
  transition: opacity 0.1s ease;
}
.dropdown-enter-from {
  opacity: 0;
  transform: translateY(-4px);
}
.dropdown-leave-to {
  opacity: 0;
}

/* ============================================
   VISIBILITY — Base = mobile
   ============================================ */
.desktop-only {
  display: none;
}
.mobile-only {
  display: flex;
}

/* ============================================
   RESPONSIVE: MOBILE LARGE (≥480px)
   Logo: 1.1rem → 1.3rem at tablet range
   ============================================ */
@media (min-width: 480px) {
  .header-content {
    padding: 0.6rem 1rem;
    gap: 0.5rem;
  }

  .logo {
    font-size: 1.1rem;
    letter-spacing: 1px;
  }
}

/* ============================================
   RESPONSIVE: TABLET (≥768px) — switch to desktop layout
   ============================================ */
@media (min-width: 768px) {
  .header-content {
    padding: 0.6rem 3rem;
    gap: 1.5rem;
  }

  .logo {
    font-size: 1.8rem;
    letter-spacing: 3px;
  }

  .header-right {
    gap: 1.5rem;
  }

  .desktop-only {
    display: flex;
  }
  .mobile-only {
    display: none !important;
  }

  /* Anunciate: show full text on desktop */
  .anunciate-mobile {
    display: none;
  }

  .anunciate-desktop {
    display: inline;
  }

  .anunciate-btn {
    height: 38px;
    padding: 0 1rem;
    font-size: 12px;
    letter-spacing: 0.2px;
  }

  .scrolled .anunciate-btn {
    height: 28px;
    padding: 0 0.8rem;
    font-size: 11px;
  }

  /* Account: show text, pill shape */
  .account-btn {
    width: auto;
    height: auto;
    min-width: auto;
    min-height: 38px;
    padding: 0.4rem 1rem;
    border-radius: 24px;
  }

  .account-btn svg {
    width: 18px;
    height: 18px;
  }

  .account-text {
    display: inline;
  }

  /* Scrolled state compressions — desktop only */
  .scrolled.app-header {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  }

  .scrolled .contact-icon {
    width: 28px;
    height: 28px;
  }

  .scrolled .contact-icon svg {
    width: 14px;
    height: 14px;
  }

  .scrolled .header-content {
    padding: 0.24rem 3rem;
  }

  .scrolled .logo {
    font-size: 1.2rem;
  }

  .scrolled .lang-flag-btn {
    padding: 2px;
  }

  .scrolled .lang-flag-desktop {
    width: 22px;
    height: 15px;
  }

  .scrolled .account-btn {
    width: auto;
    height: auto;
    min-width: auto;
    min-height: 32px;
    padding: 0.3rem 0.8rem;
    font-size: 0.75rem;
    border-radius: 24px;
  }

  .scrolled .account-btn svg {
    width: 14px;
    height: 14px;
  }

  .scrolled .social-links svg {
    width: 14px;
    height: 14px;
  }
}
</style>

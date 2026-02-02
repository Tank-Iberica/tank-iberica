<template>
  <header :class="['app-header', { scrolled }]">
    <div class="header-content">
      <NuxtLink to="/" class="logo">TANK IBERICA</NuxtLink>

      <div class="header-right">
        <!-- Desktop: social links (5 icons) -->
        <nav class="social-links desktop-only" :aria-label="$t('nav.contact')">
          <a href="mailto:info@tankiberica.com" class="contact-icon" :title="$t('nav.contact')">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
          </a>
          <a href="tel:+34600000000" class="contact-icon" :title="$t('nav.phone')">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
            </svg>
          </a>
          <a href="https://wa.me/34600000000" target="_blank" rel="noopener" class="contact-icon" title="WhatsApp">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.119.553 4.11 1.519 5.838L.057 23.534l5.846-1.533A11.95 11.95 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.82c-1.97 0-3.867-.53-5.526-1.533l-.396-.236-4.107 1.077 1.097-4.007-.259-.412A9.776 9.776 0 012.18 12c0-5.423 4.397-9.82 9.82-9.82 5.423 0 9.82 4.397 9.82 9.82 0 5.423-4.397 9.82-9.82 9.82z" />
            </svg>
          </a>
          <a href="https://linkedin.com/company/tankiberica" target="_blank" rel="noopener" class="contact-icon" title="LinkedIn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
            </svg>
          </a>
          <a href="https://facebook.com/tankiberica" target="_blank" rel="noopener" class="contact-icon" title="Facebook">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
          </a>
        </nav>

        <!-- Mobile: Contact dropdown (phone icon) -->
        <div class="mobile-menu-group mobile-only" @click.stop="toggleMenu('contact')">
          <button class="header-icon-btn mobile-trigger" :aria-label="$t('nav.phone')">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
              <line x1="12" y1="18" x2="12.01" y2="18" />
            </svg>
          </button>
          <Transition name="dropdown">
            <div v-if="openMenu === 'contact'" class="mobile-menu-dropdown">
              <a href="mailto:info@tankiberica.com" class="mobile-dropdown-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
                Email
              </a>
              <a href="tel:+34600000000" class="mobile-dropdown-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" /></svg>
                {{ $t('nav.phone') }}
              </a>
              <a href="https://wa.me/34600000000" target="_blank" rel="noopener" class="mobile-dropdown-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" /><path d="M12 0C5.373 0 0 5.373 0 12c0 2.119.553 4.11 1.519 5.838L.057 23.534l5.846-1.533A11.95 11.95 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.82c-1.97 0-3.867-.53-5.526-1.533l-.396-.236-4.107 1.077 1.097-4.007-.259-.412A9.776 9.776 0 012.18 12c0-5.423 4.397-9.82 9.82-9.82 5.423 0 9.82 4.397 9.82 9.82 0 5.423-4.397 9.82-9.82 9.82z" /></svg>
                WhatsApp
              </a>
            </div>
          </Transition>
        </div>

        <!-- Mobile: Social dropdown (globe icon) -->
        <div class="mobile-menu-group mobile-only" @click.stop="toggleMenu('social')">
          <button class="header-icon-btn mobile-trigger" aria-label="Social">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
            </svg>
          </button>
          <Transition name="dropdown">
            <div v-if="openMenu === 'social'" class="mobile-menu-dropdown">
              <a href="https://wa.me/34600000000" target="_blank" rel="noopener" class="mobile-dropdown-item">WhatsApp</a>
              <a href="https://linkedin.com/company/tankiberica" target="_blank" rel="noopener" class="mobile-dropdown-item">LinkedIn</a>
              <a href="https://facebook.com/tankiberica" target="_blank" rel="noopener" class="mobile-dropdown-item">Facebook</a>
            </div>
          </Transition>
        </div>

        <!-- Mobile: Language dropdown (flag) -->
        <div class="mobile-menu-group mobile-only" @click.stop="toggleMenu('lang')">
          <button class="header-icon-btn mobile-trigger lang-trigger">
            <img
              :src="`https://flagcdn.com/w40/${locale === 'es' ? 'es' : 'gb'}.png`"
              :alt="locale.toUpperCase()"
              width="20"
              height="15"
              class="lang-flag"
            >
          </button>
          <Transition name="dropdown">
            <div v-if="openMenu === 'lang'" class="mobile-lang-dropdown">
              <button
                class="header-icon-btn lang-option"
                @click="setLocale(altLocale as 'es' | 'en'); openMenu = null"
              >
                <img
                  :src="`https://flagcdn.com/w40/${locale === 'es' ? 'gb' : 'es'}.png`"
                  :alt="altLocale.toUpperCase()"
                  width="20"
                  height="15"
                  class="lang-flag"
                >
              </button>
            </div>
          </Transition>
        </div>

        <!-- Desktop: Language switcher ES/EN -->
        <div class="lang-switch desktop-only">
          <button
            v-for="loc in availableLocales"
            :key="loc.code"
            :class="['lang-btn', { active: locale === loc.code }]"
            @click="setLocale(loc.code as 'es' | 'en')"
          >
            {{ loc.code.toUpperCase() }}
          </button>
        </div>

        <!-- Account button -->
        <button
          v-if="!user"
          class="account-btn"
          @click="$emit('openAuth')"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <span class="account-text desktop-only">{{ $t('nav.login') }}</span>
        </button>

        <!-- Logged-in user -->
        <div v-else class="user-menu">
          <button class="account-btn logged-in" @click="toggleMenu('user')">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <span class="account-text desktop-only">{{ userDisplayName }}</span>
          </button>
          <Transition name="fade">
            <div v-if="openMenu === 'user'" class="user-dropdown-backdrop" @click="openMenu = null" />
          </Transition>
          <Transition name="slide-up">
            <div v-if="openMenu === 'user'" class="user-dropdown">
              <div class="dropdown-user-info">{{ userDisplayName }}</div>
              <button class="dropdown-item" @click="handleLogout">
                {{ $t('nav.logout') }}
              </button>
            </div>
          </Transition>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
defineEmits<{
  openAuth: []
}>()

const user = useSupabaseUser()
const supabase = useSupabaseClient()

const { locale, setLocale, locales } = useI18n()
const scrolled = ref(false)
const openMenu = ref<string | null>(null)

const altLocale = computed(() => locale.value === 'es' ? 'en' : 'es')

const userDisplayName = computed(() => {
  if (!user.value) return ''
  return user.value.user_metadata?.pseudonimo
    || user.value.user_metadata?.name
    || user.value.email?.split('@')[0]
    || ''
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

async function handleLogout() {
  openMenu.value = null
  await supabase.auth.signOut()
}

const availableLocales = computed(() =>
  (locales.value as Array<{ code: string; name: string }>),
)

function onScroll() {
  scrolled.value = window.scrollY > 50
}

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true })
  document.addEventListener('click', closeMenus)
})

onUnmounted(() => {
  window.removeEventListener('scroll', onScroll)
  document.removeEventListener('click', closeMenus)
})
</script>

<style scoped>
.app-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: var(--z-header);
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
  color: var(--color-white);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: var(--shadow-header);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.6rem 1rem;
  max-width: var(--container-max-width);
  margin: 0 auto;
  gap: 0.5rem;
  transition: padding 0.4s ease;
}

/* Logo */
.logo {
  font-family: var(--font-family-logo);
  font-size: 1.1rem;
  font-weight: 300;
  letter-spacing: 1px;
  color: var(--color-white);
  text-decoration: none;
  text-transform: uppercase;
  white-space: nowrap;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
  transition: font-size 0.4s ease;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* Contact icon buttons */
.contact-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.15);
  border-radius: var(--border-radius-full);
  color: var(--color-white);
  text-decoration: none;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(10px);
}

.contact-icon:hover {
  background: rgba(255, 255, 255, 0.3);
}

.scrolled .contact-icon {
  width: 28px;
  height: 28px;
}

.scrolled .contact-icon svg {
  width: 14px;
  height: 14px;
}

/* Social links container (desktop) */
.social-links {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

/* Mobile menu groups */
.mobile-menu-group {
  position: relative;
}

.header-icon-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.15);
  border-radius: var(--border-radius-full);
  color: var(--color-white);
  backdrop-filter: blur(10px);
  transition: all var(--transition-fast);
  min-height: 32px;
  min-width: 32px;
}

.header-icon-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* Mobile dropdowns */
.mobile-menu-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  background: var(--color-primary-dark);
  border-radius: var(--border-radius);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
  min-width: 140px;
  overflow: hidden;
  z-index: 10;
}

.mobile-dropdown-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  color: var(--text-on-dark-primary);
  text-decoration: none;
  font-size: var(--font-size-sm);
  transition: background var(--transition-fast);
  min-height: 44px;
  white-space: nowrap;
  border: none;
  background: none;
  width: 100%;
  cursor: pointer;
}

.mobile-dropdown-item:hover {
  background: rgba(255, 255, 255, 0.1);
}

/* Mobile language dropdown */
.mobile-lang-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  right: 0;
  z-index: 10;
}

.lang-trigger {
  padding: 0.4rem;
}

.lang-flag {
  border-radius: 2px;
  display: block;
}

.lang-option {
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  border-radius: var(--border-radius-full);
}

/* Desktop language switch */
.lang-switch {
  display: flex;
  gap: 0.25rem;
  background: rgba(255, 255, 255, 0.15);
  padding: 0.3rem;
  border-radius: var(--border-radius-full);
  backdrop-filter: blur(10px);
}

.lang-btn {
  background: none;
  color: var(--color-white);
  padding: 0.3rem 0.7rem;
  border-radius: var(--border-radius-full);
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-sm);
  transition: all var(--transition-fast);
  min-height: auto;
  min-width: auto;
}

.lang-btn.active {
  background: var(--color-white);
  color: var(--color-primary);
  box-shadow: var(--shadow-sm);
}

/* Account button */
.account-btn {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  background: rgba(255, 255, 255, 0.15);
  padding: 0.5rem;
  border-radius: var(--border-radius-full);
  backdrop-filter: blur(10px);
  color: var(--color-white);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  transition: all var(--transition-fast);
  min-width: 44px;
  min-height: 44px;
  justify-content: center;
}

.account-btn:hover {
  background: rgba(255, 255, 255, 0.25);
}

.account-text { white-space: nowrap; }

.account-btn.logged-in {
  background: rgba(255, 255, 255, 0.25);
}

/* User dropdown */
.user-menu { position: relative; }

.user-dropdown {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #ffffff;
  border-radius: 16px 16px 0 0;
  box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.15);
  z-index: calc(var(--z-header) + 1);
  overflow: hidden;
}

.user-dropdown-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: var(--z-header);
}

.dropdown-user-info {
  padding: 12px 16px;
  font-size: var(--font-size-sm);
  color: var(--text-auxiliary);
  border-bottom: 1px solid var(--border-color-light);
  font-weight: var(--font-weight-medium);
}

.dropdown-item {
  width: 100%;
  padding: 12px 16px;
  background: none;
  color: var(--text-primary);
  font-size: var(--font-size-sm);
  text-align: left;
  min-height: 44px;
  display: flex;
  align-items: center;
  transition: background 0.15s ease;
  cursor: pointer;
}

.dropdown-item:hover { background: var(--bg-secondary); }

/* Transitions */
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.slide-up-enter-active, .slide-up-leave-active { transition: transform 0.25s ease; }
.slide-up-enter-from, .slide-up-leave-to { transform: translateY(100%); }

.dropdown-enter-active { transition: opacity 0.15s ease, transform 0.15s ease; }
.dropdown-leave-active { transition: opacity 0.1s ease; }
.dropdown-enter-from { opacity: 0; transform: translateY(-4px); }
.dropdown-leave-to { opacity: 0; }

/* Visibility helpers */
.desktop-only { display: none; }
.mobile-only { display: flex; }

/* ---- Tablet (768px) ---- */
@media (min-width: 768px) {
  .header-content {
    padding: 0.75rem 1.5rem;
    gap: 0.75rem;
  }

  .logo {
    font-size: 1.3rem;
    letter-spacing: 1.5px;
  }

  .header-right { gap: 0.5rem; }
}

/* ---- Desktop (1024px) ---- */
@media (min-width: 1024px) {
  .header-content {
    padding: 0.6rem 3rem;
    gap: 1.5rem;
  }

  .logo {
    font-size: 1.8rem;
    letter-spacing: 3px;
  }

  .scrolled .header-content {
    padding: 0.24rem 3rem;
  }

  .scrolled .logo {
    font-size: 1.2rem;
  }

  .desktop-only { display: flex; }
  .mobile-only { display: none; }

  .account-btn {
    padding: 0.4rem 1rem;
    border-radius: 24px;
  }

  .user-dropdown-backdrop { display: none; }

  .user-dropdown {
    position: absolute;
    bottom: auto;
    left: auto;
    top: calc(100% + 8px);
    right: 0;
    border-radius: 8px;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.15);
    min-width: 200px;
    border: 1px solid var(--border-color-light);
  }

  .slide-up-enter-from, .slide-up-leave-to {
    transform: none;
    opacity: 0;
  }

  .slide-up-enter-active, .slide-up-leave-active {
    transition: opacity 0.15s ease;
  }
}
</style>

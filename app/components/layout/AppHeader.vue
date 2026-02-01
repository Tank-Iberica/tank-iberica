<template>
  <header :class="['app-header', { scrolled }]">
    <div class="header-content">
      <NuxtLink to="/" class="logo">TANK IBERICA</NuxtLink>

      <div class="header-right">
        <!-- Desktop: social links -->
        <nav class="social-links desktop-only" :aria-label="$t('nav.contact')">
          <a href="mailto:info@tankiberica.com" class="icon-btn" :title="$t('nav.contact')">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
          </a>
          <a href="tel:+34600000000" class="icon-btn" :title="$t('nav.phone')">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
            </svg>
          </a>
          <a href="https://wa.me/34600000000" target="_blank" rel="noopener" class="icon-btn" title="WhatsApp">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.119.553 4.11 1.519 5.838L.057 23.534l5.846-1.533A11.95 11.95 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.82c-1.97 0-3.867-.53-5.526-1.533l-.396-.236-4.107 1.077 1.097-4.007-.259-.412A9.776 9.776 0 012.18 12c0-5.423 4.397-9.82 9.82-9.82 5.423 0 9.82 4.397 9.82 9.82 0 5.423-4.397 9.82-9.82 9.82z" />
            </svg>
          </a>
        </nav>

        <!-- Mobile: hamburger menu -->
        <button
          class="hamburger mobile-only"
          :aria-label="$t('nav.menu')"
          :aria-expanded="mobileMenuOpen"
          @click="mobileMenuOpen = !mobileMenuOpen"
        >
          <span :class="['hamburger-line', { open: mobileMenuOpen }]" />
          <span :class="['hamburger-line', { open: mobileMenuOpen }]" />
          <span :class="['hamburger-line', { open: mobileMenuOpen }]" />
        </button>

        <!-- Language switch (desktop) -->
        <div class="lang-switch desktop-only">
          <button
            v-for="loc in availableLocales"
            :key="loc.code"
            :class="['lang-btn', { active: locale === loc.code }]"
            @click="setLocale(loc.code)"
          >
            {{ loc.code.toUpperCase() }}
          </button>
        </div>

        <!-- Account button -->
        <button class="account-btn" @click="$emit('openAuth')">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <span class="account-text desktop-only">{{ $t('nav.login') }}</span>
        </button>
      </div>
    </div>

    <!-- Mobile menu overlay -->
    <Transition name="slide">
      <div v-if="mobileMenuOpen" class="mobile-menu" @click.self="mobileMenuOpen = false">
        <nav class="mobile-nav">
          <a href="mailto:info@tankiberica.com" class="mobile-link">{{ $t('nav.contact') }}</a>
          <a href="tel:+34600000000" class="mobile-link">{{ $t('nav.phone') }}</a>
          <a href="https://wa.me/34600000000" target="_blank" rel="noopener" class="mobile-link">WhatsApp</a>
          <div class="mobile-lang">
            <button
              v-for="loc in availableLocales"
              :key="loc.code"
              :class="['lang-btn', { active: locale === loc.code }]"
              @click="setLocale(loc.code); mobileMenuOpen = false"
            >
              {{ loc.code.toUpperCase() }}
            </button>
          </div>
        </nav>
      </div>
    </Transition>
  </header>
</template>

<script setup lang="ts">
defineEmits<{
  openAuth: []
}>()

const { locale, setLocale, locales } = useI18n()
const scrolled = ref(false)
const mobileMenuOpen = ref(false)

const availableLocales = computed(() =>
  (locales.value as Array<{ code: string; name: string }>),
)

function onScroll() {
  scrolled.value = window.scrollY > 50
}

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('scroll', onScroll)
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
  transition: all var(--transition-bounce);
  box-shadow: var(--shadow-header);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  max-width: var(--container-max-width);
  margin: 0 auto;
  gap: 0.5rem;
}

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
  transition: font-size var(--transition-normal);
}

.scrolled .logo {
  font-size: 1rem;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* Icon buttons */
.icon-btn {
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.15);
  border-radius: var(--border-radius-full);
  color: var(--color-white);
  text-decoration: none;
  transition: all var(--transition-fast);
  backdrop-filter: blur(10px);
}

.icon-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* Social links (desktop) */
.social-links {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

/* Language switch */
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

.account-text {
  white-space: nowrap;
}

/* Hamburger (mobile) */
.hamburger {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 5px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: var(--border-radius-full);
  padding: 0.5rem;
  backdrop-filter: blur(10px);
}

.hamburger-line {
  display: block;
  width: 20px;
  height: 2px;
  background: var(--color-white);
  border-radius: 2px;
  transition: all var(--transition-fast);
}

.hamburger-line.open:nth-child(1) {
  transform: translateY(7px) rotate(45deg);
}

.hamburger-line.open:nth-child(2) {
  opacity: 0;
}

.hamburger-line.open:nth-child(3) {
  transform: translateY(-7px) rotate(-45deg);
}

/* Mobile menu */
.mobile-menu {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: calc(var(--z-header) - 1);
  padding-top: 70px;
}

.mobile-nav {
  background: var(--color-primary-dark);
  padding: var(--spacing-6) var(--spacing-4);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
}

.mobile-link {
  color: var(--text-on-dark-primary);
  text-decoration: none;
  font-size: var(--font-size-lg);
  padding: var(--spacing-3) 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  min-height: 44px;
  display: flex;
  align-items: center;
}

.mobile-lang {
  display: flex;
  gap: var(--spacing-2);
  padding-top: var(--spacing-2);
}

/* Transition */
.slide-enter-active,
.slide-leave-active {
  transition: opacity var(--transition-fast);
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
}

/* Visibility helpers */
.desktop-only {
  display: none;
}

.mobile-only {
  display: flex;
}

/* ---- Tablet (768px) ---- */
@media (min-width: 768px) {
  .header-content {
    padding: 0.75rem 2rem;
    gap: 1rem;
  }

  .logo {
    font-size: 1.3rem;
    letter-spacing: 1.5px;
  }

  .header-right {
    gap: 0.75rem;
  }
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

  .desktop-only {
    display: flex;
  }

  .mobile-only {
    display: none;
  }

  .account-btn {
    padding: 0.4rem 1rem;
    border-radius: 24px;
  }
}
</style>

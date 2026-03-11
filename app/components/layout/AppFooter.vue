<template>
  <footer class="app-footer">
    <nav class="footer-content" :aria-label="$t('footer.siteNavigation')">
      <div class="footer-section">
        <h3>{{ $t('footer.communications') }}</h3>
        <div class="footer-links">
          <NuxtLink to="/noticias">{{ $t('footer.newsroom') }}</NuxtLink>
          <NuxtLink to="/noticias">{{ $t('footer.newsletters') }}</NuxtLink>
          <NuxtLink to="/noticias?cat=destacados">{{ $t('footer.featured') }}</NuxtLink>
          <NuxtLink to="/noticias?cat=eventos">{{ $t('footer.events') }}</NuxtLink>
        </div>
      </div>

      <div class="footer-section">
        <h3>{{ $t('footer.aboutUs') }}</h3>
        <div class="footer-links">
          <NuxtLink to="/sobre-nosotros#quienes-somos">{{ $t('footer.whoWeAre') }}</NuxtLink>
          <NuxtLink to="/sobre-nosotros#mision">{{ $t('footer.ourMission') }}</NuxtLink>
          <NuxtLink to="/sobre-nosotros#equipo">{{ $t('footer.team') }}</NuxtLink>
        </div>
      </div>

      <div class="footer-section">
        <h3>{{ $t('footer.legal') }}</h3>
        <div class="footer-links">
          <NuxtLink to="/legal#aviso-legal">{{ $t('footer.legalNotice') }}</NuxtLink>
          <NuxtLink to="/legal#terminos">{{ $t('footer.terms') }}</NuxtLink>
          <NuxtLink to="/legal#privacidad">{{ $t('footer.privacy') }}</NuxtLink>
          <NuxtLink to="/legal#cookies">{{ $t('footer.cookies') }}</NuxtLink>
          <NuxtLink to="/transparencia">{{ $t('footer.transparency') }}</NuxtLink>
        </div>
      </div>
    </nav>

    <!-- Legal disclaimer -->
    <DisclaimerFooter />

    <div class="footer-bottom">
      <p>&copy; {{ year }} Tracciona. {{ $t('footer.allRights') }}</p>
    </div>
  </footer>
</template>

<script setup lang="ts">
const year = new Date().getFullYear()
</script>

<style scoped>
/* ============================================
   FOOTER — Base = mobile (360px)
   Gradient petrol-dark → petrol-blue
   Mobile: h3 titles only (links hidden)
   Desktop: full 3-column layout with links
   ============================================ */
.app-footer {
  background: linear-gradient(
    135deg,
    var(--color-primary-dark, #1a3a40) 0%,
    var(--color-primary) 100%
  );
  color: var(--text-on-dark-primary, rgba(255, 255, 255, 0.95));
  padding: 3rem 0 2rem 0;
  padding-bottom: max(2rem, env(safe-area-inset-bottom, 0));
  padding-left: env(safe-area-inset-left, 0);
  padding-right: env(safe-area-inset-right, 0);
  margin-top: 4rem;
}

.footer-content {
  max-width: 56.25em;
  margin: 0 auto 3rem;
  padding: 0 1rem;
  display: flex;
  flex-direction: row;
  justify-content: space-around;
  gap: 0.5rem;
}

.footer-section {
  flex: 0 0 auto;
  min-width: auto;
}

.footer-section h3 {
  font-size: 0.875rem;
  line-height: 1.4;
  margin-bottom: 0;
  font-weight: 700;
}

/* Links hidden on mobile */
.footer-links {
  display: none;
  flex-direction: column;
  gap: 0.75rem;
}

.footer-links a {
  color: var(--text-on-dark-secondary, rgba(255, 255, 255, 0.7));
  text-decoration: none;
  line-height: 1.6;
  transition: all 0.3s ease;
  display: block;
  cursor: pointer;
  font-size: 0.875rem;
}

.footer-links a:hover {
  color: var(--text-on-dark-primary, rgba(255, 255, 255, 0.95));
  padding-left: 0.5rem;
}

/* Footer bottom */
.footer-bottom {
  border-top: 1px solid rgba(255, 255, 255, 0.2);
  padding: 2rem 1rem 0;
  text-align: center;
  color: var(--text-on-dark-secondary, rgba(255, 255, 255, 0.7));
  font-size: 0.875rem;
  line-height: 1.6;
}

/* ============================================
   RESPONSIVE: ≥30em (large mobile)
   ============================================ */
@media (min-width: 30em) {
  .footer-content {
    gap: 1rem;
    padding: 0 2rem;
  }

  .footer-bottom {
    padding: 2rem 2rem 0;
  }
}

/* ============================================
   RESPONSIVE: ≥48em (tablet — show links)
   ============================================ */
@media (min-width: 48em) {
  .footer-content {
    gap: 2rem;
    padding: 0 2rem;
  }

  .footer-section h3 {
    font-size: 1rem;
    margin-bottom: 1rem;
  }

  .footer-links {
    display: flex;
  }
}

/* ============================================
   RESPONSIVE: ≥64em (desktop)
   ============================================ */
@media (min-width: 64em) {
  .footer-content {
    padding: 0 3rem;
    gap: 4rem;
    justify-content: space-evenly;
  }

  .footer-section {
    min-width: 9.375rem;
  }

  .footer-bottom {
    padding: 2rem 3rem 0;
  }
}
</style>

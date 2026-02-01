<template>
  <footer class="app-footer">
    <div class="footer-content">
      <div class="footer-section">
        <h3>{{ $t('footer.communications') }}</h3>
        <div class="footer-links">
          <NuxtLink to="/noticias">{{ $t('footer.newsroom') }}</NuxtLink>
          <NuxtLink to="/noticias">{{ $t('footer.newsletters') }}</NuxtLink>
          <NuxtLink to="/noticias">{{ $t('footer.featured') }}</NuxtLink>
          <NuxtLink to="/noticias">{{ $t('footer.events') }}</NuxtLink>
        </div>
      </div>

      <div class="footer-section">
        <h3>{{ $t('footer.aboutUs') }}</h3>
        <div class="footer-links">
          <NuxtLink to="/sobre-nosotros">{{ $t('footer.whoWeAre') }}</NuxtLink>
          <NuxtLink to="/sobre-nosotros">{{ $t('footer.ourMission') }}</NuxtLink>
          <NuxtLink to="/sobre-nosotros">{{ $t('footer.team') }}</NuxtLink>
        </div>
      </div>

      <div class="footer-section">
        <h3>{{ $t('footer.legal') }}</h3>
        <div class="footer-links">
          <NuxtLink to="/legal">{{ $t('footer.terms') }}</NuxtLink>
          <NuxtLink to="/legal">{{ $t('footer.privacy') }}</NuxtLink>
          <NuxtLink to="/legal">{{ $t('footer.cookies') }}</NuxtLink>
        </div>
      </div>
    </div>

    <div class="footer-bottom">
      <p>&copy; {{ year }} Tank Iberica. {{ $t('footer.allRights') }}</p>
    </div>
  </footer>
</template>

<script setup lang="ts">
const year = new Date().getFullYear()
</script>

<style scoped>
.app-footer {
  background: linear-gradient(135deg, var(--color-primary-dark) 0%, var(--color-primary) 100%);
  color: var(--text-on-dark-primary);
  padding: var(--spacing-12) 0 var(--spacing-8) 0;
  margin-top: var(--spacing-16);
}

.footer-content {
  max-width: var(--container-max-width);
  margin: 0 auto;
  padding: 0 var(--spacing-4);
  display: flex;
  flex-direction: row;
  justify-content: space-around;
  gap: var(--spacing-4);
  margin-bottom: var(--spacing-12);
}

.footer-section h3 {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  margin-bottom: 0;
}

.footer-links {
  display: none;
  flex-direction: column;
  gap: var(--spacing-3);
}

.footer-links a {
  color: var(--text-on-dark-secondary);
  text-decoration: none;
  font-size: var(--font-size-sm);
  transition: all var(--transition-fast);
}

.footer-links a:hover {
  color: var(--text-on-dark-primary);
  padding-left: var(--spacing-2);
}

.footer-bottom {
  border-top: 1px solid rgba(255, 255, 255, 0.2);
  padding: var(--spacing-8) var(--spacing-4) 0;
  text-align: center;
  color: var(--text-on-dark-secondary);
  font-size: var(--font-size-sm);
}

/* ---- Tablet (768px) ---- */
@media (min-width: 768px) {
  .footer-content {
    padding: 0 var(--spacing-8);
    gap: var(--spacing-8);
  }

  .footer-section h3 {
    font-size: var(--font-size-base);
    margin-bottom: var(--spacing-4);
  }

  .footer-links {
    display: flex;
  }
}

/* ---- Desktop (1024px) ---- */
@media (min-width: 1024px) {
  .footer-content {
    padding: 0 var(--spacing-12);
    gap: var(--spacing-16);
    justify-content: space-evenly;
  }
}
</style>

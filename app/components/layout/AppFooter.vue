<template>
  <footer class="app-footer">
    <div class="footer-content">
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
          <NuxtLink to="/legal#terminos">{{ $t('footer.terms') }}</NuxtLink>
          <NuxtLink to="/legal#privacidad">{{ $t('footer.privacy') }}</NuxtLink>
          <NuxtLink to="/legal#cookies">{{ $t('footer.cookies') }}</NuxtLink>
        </div>
      </div>
    </div>

    <!-- Kit Digital banner -->
    <div class="footer-kit-digital">
      <img
        src="https://lh3.googleusercontent.com/d/13QhArniHSTlOWD1WmODl3b_AqwKhRGqY"
        alt="Tank Iberica"
        loading="lazy"
      >
    </div>

    <div class="footer-bottom">
      <p>&copy; {{ year }} Tank Iberica. {{ $t('footer.allRights') }}</p>
      <NuxtLink to="/admin" class="admin-link">Admin</NuxtLink>
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
  background: linear-gradient(135deg, var(--color-primary-dark, #1A3A40) 0%, var(--color-primary) 100%);
  color: var(--text-on-dark-primary, rgba(255, 255, 255, 0.95));
  padding: 48px 0 32px 0;
  margin-top: 64px;
}

.footer-content {
  max-width: 900px;
  margin: 0 auto 48px;
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
  font-size: 14px;
  line-height: 1.4;
  margin-bottom: 0;
  font-weight: 700;
}

/* Links hidden on mobile */
.footer-links {
  display: none;
  flex-direction: column;
  gap: 12px;
}

.footer-links a {
  color: var(--text-on-dark-secondary, rgba(255, 255, 255, 0.7));
  text-decoration: none;
  line-height: 1.6;
  transition: all 0.3s ease;
  display: block;
  cursor: pointer;
  font-size: 14px;
}

.footer-links a:hover {
  color: var(--text-on-dark-primary, rgba(255, 255, 255, 0.95));
  padding-left: 0.5rem;
}

/* Kit Digital banner */
.footer-kit-digital {
  text-align: center;
  padding: 0 1rem;
  margin-bottom: 32px;
}

.footer-kit-digital img {
  width: 100%;
  max-width: 1600px;
  height: auto;
}

/* Footer bottom */
.footer-bottom {
  border-top: 1px solid rgba(255, 255, 255, 0.2);
  padding: 32px 1rem 0;
  text-align: center;
  color: var(--text-on-dark-secondary, rgba(255, 255, 255, 0.7));
  font-size: 14px;
  line-height: 1.6;
}

.admin-link {
  display: inline-block;
  margin-top: 16px;
  padding: 8px 20px;
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-on-dark-secondary, rgba(255, 255, 255, 0.7));
  text-decoration: none;
  border-radius: 6px;
  font-size: 13px;
  transition: all 0.2s;
}

.admin-link:hover {
  background: rgba(255, 255, 255, 0.2);
  color: var(--text-on-dark-primary, rgba(255, 255, 255, 0.95));
}

/* ============================================
   RESPONSIVE: ≥480px (large mobile)
   ============================================ */
@media (min-width: 480px) {
  .footer-content {
    gap: 1rem;
    padding: 0 2rem;
  }

  .footer-kit-digital {
    padding: 0 2rem;
  }

  .footer-bottom {
    padding: 32px 2rem 0;
  }
}

/* ============================================
   RESPONSIVE: ≥768px (tablet — show links)
   ============================================ */
@media (min-width: 768px) {
  .footer-content {
    gap: 2rem;
    padding: 0 2rem;
  }

  .footer-section h3 {
    font-size: 16px;
    margin-bottom: 16px;
  }

  .footer-links {
    display: flex;
  }
}

/* ============================================
   RESPONSIVE: ≥1024px (desktop)
   ============================================ */
@media (min-width: 1024px) {
  .footer-content {
    padding: 0 3rem;
    gap: 4rem;
    justify-content: space-evenly;
  }

  .footer-section {
    min-width: 150px;
  }

  .footer-kit-digital {
    padding: 0 3rem;
  }

  .footer-bottom {
    padding: 32px 3rem 0;
  }
}
</style>

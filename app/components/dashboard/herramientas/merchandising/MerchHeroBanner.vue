<template>
  <section class="hero-banner">
    <div class="hero-content">
      <div class="hero-badge">{{ $t('dashboard.tools.merchandising.badge') }}</div>
      <h1>{{ $t('dashboard.tools.merchandising.title') }}</h1>
      <p class="hero-desc">{{ $t('dashboard.tools.merchandising.heroDesc') }}</p>
    </div>
    <div class="hero-icon" aria-hidden="true">🎁</div>
  </section>
</template>

<style scoped>
.hero-banner {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  background: linear-gradient(135deg, var(--color-primary) 0%, #1a5f6e 100%);
  border-radius: var(--border-radius-lg);
  padding: 1.5rem 1.25rem;
  color: white;
  position: relative;
  overflow: hidden;
}

.hero-content {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-width: 35rem;
}

.hero-badge {
  display: inline-block;
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: var(--border-radius-xl);
  padding: 0.25rem 0.75rem;
  font-size: var(--font-size-xs);
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  align-self: flex-start;
}

.hero-banner h1 {
  margin: 0;
  font-size: var(--font-size-2xl);
  font-weight: 700;
  line-height: 1.2;
}

.hero-desc {
  margin: 0;
  font-size: 0.9rem;
  opacity: 0.85;
  line-height: 1.5;
}

.hero-icon {
  font-size: 3rem;
  line-height: 1;
  align-self: flex-end;
  position: absolute;
  right: 1.25rem;
  top: 50%;
  transform: translateY(-50%);
  opacity: 0.35;
  pointer-events: none;
}

@media (min-width: 48em) {
  .hero-banner {
    flex-direction: row;
    align-items: center;
    padding: 2rem;
  }

  .hero-icon {
    position: static;
    transform: none;
    opacity: 0.5;
    font-size: 5rem;
    margin-left: auto;
  }

  .hero-banner h1 {
    font-size: 1.75rem;
  }
}
</style>

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
  gap: 12px;
  background: linear-gradient(135deg, var(--color-primary) 0%, #1a5f6e 100%);
  border-radius: 16px;
  padding: 24px 20px;
  color: white;
  position: relative;
  overflow: hidden;
}

.hero-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-width: 560px;
}

.hero-badge {
  display: inline-block;
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 20px;
  padding: 4px 12px;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  align-self: flex-start;
}

.hero-banner h1 {
  margin: 0;
  font-size: 1.5rem;
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
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  opacity: 0.35;
  pointer-events: none;
}

@media (min-width: 768px) {
  .hero-banner {
    flex-direction: row;
    align-items: center;
    padding: 32px;
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

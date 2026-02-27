<script setup lang="ts">
const { t } = useI18n()
</script>

<template>
  <div class="upgrade-card">
    <h2>{{ t('dashboard.adExport.upgradeTitle') }}</h2>
    <p>{{ t('dashboard.adExport.upgradeDesc') }}</p>
    <NuxtLink to="/dashboard/suscripcion" class="btn-upgrade">
      {{ t('dashboard.adExport.upgradeCta') }}
    </NuxtLink>
  </div>
</template>

<style scoped>
.upgrade-card {
  background: linear-gradient(135deg, #fffbeb, #fef3c7);
  border: 1px solid #fde68a;
  border-radius: 12px;
  padding: 24px;
  text-align: center;
}

.upgrade-card h2 {
  margin: 0 0 8px 0;
  font-size: 1.15rem;
  font-weight: 700;
  color: #92400e;
}

.upgrade-card p {
  margin: 0 0 16px 0;
  color: #a16207;
  font-size: 0.95rem;
}

.btn-upgrade {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 10px 24px;
  background: #f59e0b;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
}

.btn-upgrade:hover {
  background: #d97706;
}
</style>

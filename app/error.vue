<template>
  <div class="error-page">
    <div class="error-container">
      <h1 class="error-code">
        {{ error?.statusCode || 404 }}
      </h1>
      <h2 class="error-title">
        {{ error?.statusCode === 500 ? 'Error del servidor' : 'Página no encontrada' }}
      </h2>
      <p class="error-message">
        {{ error?.statusCode === 500
          ? 'Ha ocurrido un error interno. Inténtalo de nuevo más tarde.'
          : 'La página que buscas no existe o ha sido movida.'
        }}
      </p>
      <div class="error-actions">
        <NuxtLink to="/" class="btn-primary">
          Ver catálogo
        </NuxtLink>
        <NuxtLink to="/noticias" class="btn-secondary">
          Noticias
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  error: {
    statusCode: number
    message: string
  }
}>()

useSeoMeta({
  title: `${props.error?.statusCode || 404} — Tank Iberica`,
  robots: 'noindex, nofollow',
})
</script>

<style scoped>
.error-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
  background: #f9fafb;
  font-family: 'Inter', sans-serif;
}

.error-container {
  text-align: center;
  max-width: 480px;
}

.error-code {
  font-size: 6rem;
  font-weight: 800;
  color: var(--color-primary, #23424A);
  line-height: 1;
  margin: 0 0 0.5rem;
}

.error-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 1rem;
}

.error-message {
  font-size: 1rem;
  color: #6b7280;
  line-height: 1.6;
  margin: 0 0 2rem;
}

.error-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  padding: 12px 24px;
  background: var(--color-primary, #23424A);
  color: white;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.95rem;
  text-decoration: none;
  transition: background 0.2s;
}

.btn-primary:hover {
  background: var(--color-primary-dark, #1a3238);
}

.btn-secondary {
  display: inline-flex;
  align-items: center;
  padding: 12px 24px;
  background: white;
  color: var(--color-primary, #23424A);
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.95rem;
  text-decoration: none;
  transition: all 0.2s;
}

.btn-secondary:hover {
  border-color: var(--color-primary, #23424A);
}

@media (min-width: 480px) {
  .error-code {
    font-size: 8rem;
  }

  .error-title {
    font-size: 1.75rem;
  }
}
</style>

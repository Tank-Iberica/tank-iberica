<script setup lang="ts">
defineProps<{
  socialLinks: Record<string, string>
}>()

const emit = defineEmits<{
  'update-field': [key: string, value: string]
}>()
</script>

<template>
  <div class="config-card">
    <h3 class="card-title">Redes Sociales</h3>
    <p class="card-subtitle">URLs de los perfiles de redes sociales</p>

    <div class="social-grid">
      <div class="form-group">
        <label for="social-linkedin">LinkedIn</label>
        <input
          id="social-linkedin"
          type="text"
          :value="socialLinks.linkedin"
          placeholder="https://linkedin.com/company/..."
          @input="emit('update-field', 'linkedin', ($event.target as HTMLInputElement).value)"
        />
      </div>
      <div class="form-group">
        <label for="social-instagram">Instagram</label>
        <input
          id="social-instagram"
          type="text"
          :value="socialLinks.instagram"
          placeholder="https://instagram.com/..."
          @input="emit('update-field', 'instagram', ($event.target as HTMLInputElement).value)"
        />
      </div>
      <div class="form-group">
        <label for="social-facebook">Facebook</label>
        <input
          id="social-facebook"
          type="text"
          :value="socialLinks.facebook"
          placeholder="https://facebook.com/..."
          @input="emit('update-field', 'facebook', ($event.target as HTMLInputElement).value)"
        />
      </div>
      <div class="form-group">
        <label for="social-x">X (Twitter)</label>
        <input
          id="social-x"
          type="text"
          :value="socialLinks.x"
          placeholder="https://x.com/..."
          @input="emit('update-field', 'x', ($event.target as HTMLInputElement).value)"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.config-card {
  background: var(--bg-primary);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-6);
  margin-bottom: var(--spacing-5);
  box-shadow: var(--shadow-card);
}

.card-title {
  margin: 0 0 var(--spacing-1);
  font-size: 1.25rem;
  color: var(--color-gray-800);
}

.card-subtitle {
  margin: 0 0 var(--spacing-5);
  color: var(--color-gray-500);
  font-size: 0.875rem;
}

.social-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-4);
}

.form-group {
  margin-bottom: 0;
}

.form-group > label {
  display: block;
  font-weight: 600;
  margin-bottom: var(--spacing-2);
  color: var(--color-gray-700);
  font-size: 0.875rem;
}

.form-group input[type='text'] {
  width: 100%;
  padding: 0.625rem var(--spacing-3);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: 0.95rem;
  box-sizing: border-box;
}

.form-group input[type='text']:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: var(--shadow-focus);
}

@media (min-width: 48em) {
  .social-grid {
    grid-template-columns: 1fr 1fr;
  }
}
</style>

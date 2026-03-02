<script setup lang="ts">
defineProps<{
  socialLinks: Record<string, string>
}>()

const emit = defineEmits<{
  (e: 'update-field', key: string, value: string): void
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
        >
      </div>
      <div class="form-group">
        <label for="social-instagram">Instagram</label>
        <input
          id="social-instagram"
          type="text"
          :value="socialLinks.instagram"
          placeholder="https://instagram.com/..."
          @input="emit('update-field', 'instagram', ($event.target as HTMLInputElement).value)"
        >
      </div>
      <div class="form-group">
        <label for="social-facebook">Facebook</label>
        <input
          id="social-facebook"
          type="text"
          :value="socialLinks.facebook"
          placeholder="https://facebook.com/..."
          @input="emit('update-field', 'facebook', ($event.target as HTMLInputElement).value)"
        >
      </div>
      <div class="form-group">
        <label for="social-x">X (Twitter)</label>
        <input
          id="social-x"
          type="text"
          :value="socialLinks.x"
          placeholder="https://x.com/..."
          @input="emit('update-field', 'x', ($event.target as HTMLInputElement).value)"
        >
      </div>
    </div>
  </div>
</template>

<style scoped>
.config-card {
  background: var(--bg-primary);
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.card-title {
  margin: 0 0 4px;
  font-size: 1.25rem;
  color: #1f2937;
}

.card-subtitle {
  margin: 0 0 20px;
  color: #6b7280;
  font-size: 0.875rem;
}

.social-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

.form-group {
  margin-bottom: 0;
}

.form-group > label {
  display: block;
  font-weight: 600;
  margin-bottom: 8px;
  color: #374151;
  font-size: 0.875rem;
}

.form-group input[type='text'] {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 0.95rem;
  box-sizing: border-box;
}

.form-group input[type='text']:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(35, 66, 74, 0.1);
}

@media (min-width: 768px) {
  .social-grid {
    grid-template-columns: 1fr 1fr;
  }
}
</style>

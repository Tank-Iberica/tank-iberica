<script setup lang="ts">
const props = defineProps<{
  socialPostText: Record<string, string> | null
  open: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'update:socialPostText': [value: Record<string, string> | null]
}>()

function updateSocialField(platform: string, value: string) {
  const social = { ...(props.socialPostText || {}) }
  social[platform] = value
  emit('update:socialPostText', social)
}

function getSocialField(platform: string): string {
  return props.socialPostText?.[platform] || ''
}
</script>

<template>
  <div class="section">
    <button class="section-toggle" @click="$emit('update:open', !open)">
      <span>Redes Sociales</span>
      <span class="toggle-icon">{{ open ? '−' : '+' }}</span>
    </button>
    <div v-if="open" class="section-body">
      <div class="field">
        <label>Twitter / X (max 280)</label>
        <textarea
          :value="getSocialField('twitter')"
          rows="3"
          class="input textarea"
          maxlength="280"
          placeholder="Texto para compartir en Twitter..."
          @input="updateSocialField('twitter', ($event.target as HTMLTextAreaElement).value)"
        />
        <span
          class="char-count"
          :class="
            getSocialField('twitter').length > 260
              ? 'count-warning'
              : getSocialField('twitter').length > 280
                ? 'count-bad'
                : ''
          "
        >
          {{ getSocialField('twitter').length }}/280
        </span>
      </div>
      <div class="field">
        <label>LinkedIn (max 700)</label>
        <textarea
          :value="getSocialField('linkedin')"
          rows="4"
          class="input textarea"
          maxlength="700"
          placeholder="Texto para compartir en LinkedIn..."
          @input="updateSocialField('linkedin', ($event.target as HTMLTextAreaElement).value)"
        />
        <span class="char-count"> {{ getSocialField('linkedin').length }}/700 </span>
      </div>
      <div class="field">
        <label>Facebook (max 500)</label>
        <textarea
          :value="getSocialField('facebook')"
          rows="3"
          class="input textarea"
          maxlength="500"
          placeholder="Texto para compartir en Facebook..."
          @input="updateSocialField('facebook', ($event.target as HTMLTextAreaElement).value)"
        />
        <span class="char-count"> {{ getSocialField('facebook').length }}/500 </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.section {
  background: var(--bg-primary);
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.section-toggle {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  font-weight: 600;
  font-size: 0.9rem;
  color: #374151;
  cursor: pointer;
  border: none;
  background: none;
  padding: 0;
}

.toggle-icon {
  font-size: 1.2rem;
  color: var(--text-disabled);
}

.section-body {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--color-gray-100);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.field label {
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--text-auxiliary);
}

.input {
  padding: 8px 12px;
  border: 1px solid var(--color-gray-200);
  border-radius: 6px;
  font-size: 0.875rem;
  width: 100%;
  box-sizing: border-box;
}

.input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.textarea {
  resize: vertical;
  font-family: inherit;
  line-height: 1.6;
}

.char-count {
  font-size: 0.7rem;
  color: var(--text-disabled);
  text-align: right;
}

.count-warning {
  color: var(--color-warning);
}
.count-bad {
  color: var(--color-error);
}
</style>

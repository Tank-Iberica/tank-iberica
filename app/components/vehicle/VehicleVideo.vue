<template>
  <section v-if="embedId" class="vehicle-video" aria-label="$t('vehicle.videoLabel')">
    <h2 class="vehicle-video__title">{{ $t('vehicle.video') }}</h2>

    <!-- Privacy-friendly: show thumbnail + play button until user clicks -->
    <div v-if="!accepted" class="vehicle-video__facade" @click="accept">
      <NuxtImg
        v-if="thumbnailUrl"
        :src="thumbnailUrl"
        :alt="$t('vehicle.videoThumbnailAlt')"
        width="800"
        height="450"
        sizes="(max-width: 48em) 100vw, 800px"
        fit="cover"
        format="webp"
        class="vehicle-video__thumb"
        loading="lazy"
        decoding="async"
      />
      <div
        v-else
        class="vehicle-video__thumb vehicle-video__thumb--placeholder"
        aria-hidden="true"
      />

      <button
        type="button"
        class="vehicle-video__play"
        :aria-label="$t('vehicle.videoPlay')"
        @click.stop="accept"
      >
        <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <circle cx="12" cy="12" r="12" fill="rgba(0,0,0,0.6)" />
          <polygon points="10,8 18,12 10,16" fill="#fff" />
        </svg>
      </button>

      <p class="vehicle-video__consent">
        {{ $t('vehicle.videoConsentNotice', { provider: providerName }) }}
      </p>
    </div>

    <!-- Embedded iframe after consent -->
    <div v-else class="vehicle-video__wrapper">
      <iframe
        :src="embedUrl"
        :title="$t('vehicle.videoIframeTitle')"
        allow="
          accelerometer;
          autoplay;
          clipboard-write;
          encrypted-media;
          gyroscope;
          picture-in-picture;
        "
        allowfullscreen
        loading="lazy"
        class="vehicle-video__iframe"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
const props = defineProps<{
  /** Raw video URL from the vehicle record (YouTube or Vimeo) */
  videoUrl: string | null | undefined
}>()

type Provider = 'youtube' | 'vimeo'

const accepted = ref(false)

function accept() {
  accepted.value = true
}

/** Extract provider + ID from a raw YouTube or Vimeo URL */
const parsed = computed<{ provider: Provider; id: string } | null>(() => {
  const url = props.videoUrl?.trim()
  if (!url) return null

  // YouTube: youtu.be/ID or youtube.com/watch?v=ID or youtube.com/embed/ID
  const ytMatch = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/,
  )
  if (ytMatch) return { provider: 'youtube', id: ytMatch[1]! }

  // Vimeo: vimeo.com/ID or player.vimeo.com/video/ID
  const vmMatch = url.match(/(?:vimeo\.com\/(?:video\/)?|player\.vimeo\.com\/video\/)(\d+)/)
  if (vmMatch) return { provider: 'vimeo', id: vmMatch[1]! }

  return null
})

const embedId = computed(() => parsed.value?.id ?? null)

const providerName = computed(() => (parsed.value?.provider === 'vimeo' ? 'Vimeo' : 'YouTube'))

const thumbnailUrl = computed(() => {
  if (!parsed.value) return null
  if (parsed.value.provider === 'youtube') {
    return `https://img.youtube.com/vi/${parsed.value.id}/hqdefault.jpg`
  }
  // Vimeo thumbnail requires an API call — skip to avoid external request on SSR
  return null
})

const embedUrl = computed(() => {
  if (!parsed.value) return ''
  if (parsed.value.provider === 'youtube') {
    return `https://www.youtube-nocookie.com/embed/${parsed.value.id}?autoplay=1&rel=0`
  }
  return `https://player.vimeo.com/video/${parsed.value.id}?autoplay=1`
})
</script>

<style scoped>
.vehicle-video {
  margin: var(--spacing-8) 0;
}

.vehicle-video__title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin-bottom: var(--spacing-3);
}

/* Facade (before consent) */
.vehicle-video__facade {
  position: relative;
  cursor: pointer;
  border-radius: var(--radius-lg);
  overflow: hidden;
  background: var(--bg-muted);
  aspect-ratio: 16 / 9;
  display: flex;
  align-items: center;
  justify-content: center;
}

.vehicle-video__thumb {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.vehicle-video__thumb--placeholder {
  background: linear-gradient(135deg, var(--bg-muted) 0%, var(--color-border) 100%);
}

.vehicle-video__play {
  position: relative;
  z-index: 1;
  background: none;
  border: none;
  cursor: pointer;
  color: #fff;
  transition: transform 0.15s;
  touch-action: manipulation;
}

.vehicle-video__play:hover {
  transform: scale(1.1);
}

.vehicle-video__play:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 4px;
  border-radius: var(--radius-full);
}

.vehicle-video__consent {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: var(--spacing-2) var(--spacing-3);
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
  font-size: var(--font-size-xs);
  text-align: center;
}

/* Embedded wrapper */
.vehicle-video__wrapper {
  position: relative;
  padding-bottom: 56.25%; /* 16:9 */
  height: 0;
  overflow: hidden;
  border-radius: var(--radius-lg);
}

.vehicle-video__iframe {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border: 0;
}

@media (min-width: 768px) {
  .vehicle-video__title {
    font-size: var(--font-size-xl);
  }
}
</style>

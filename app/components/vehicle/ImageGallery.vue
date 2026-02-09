<template>
  <div class="gallery">
    <!-- Main image -->
    <div
      class="gallery-main"
      @touchstart="onTouchStart"
      @touchend="onTouchEnd"
    >
      <NuxtImg
        v-if="currentImage && isCloudinary(currentImageRaw)"
        provider="cloudinary"
        :src="currentImage"
        :alt="alt"
        width="800"
        height="600"
        fit="cover"
        format="webp"
        class="gallery-img"
      />
      <img
        v-else-if="currentImageRaw"
        :src="currentImageRaw.url"
        :alt="alt"
        class="gallery-img"
      >
      <div v-else class="gallery-placeholder">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <path d="m21 15-5-5L5 21" />
        </svg>
      </div>

      <!-- Navigation arrows -->
      <template v-if="images.length > 1">
        <button class="gallery-nav gallery-prev" :aria-label="'Previous'" @click="prev">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <button class="gallery-nav gallery-next" :aria-label="'Next'" @click="next">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </template>

      <!-- Counter -->
      <span v-if="images.length > 1" class="gallery-counter">
        {{ currentIndex + 1 }} / {{ images.length }}
      </span>
    </div>

    <!-- Thumbnails (desktop) -->
    <div v-if="images.length > 1" class="gallery-thumbs">
      <button
        v-for="(img, i) in images"
        :key="img.id"
        class="gallery-thumb"
        :class="{ active: currentIndex === i }"
        @click="currentIndex = i"
      >
        <NuxtImg
          v-if="isCloudinary(img)"
          provider="cloudinary"
          :src="extractPath(img)"
          :alt="`${alt} ${i + 1}`"
          width="100"
          height="75"
          fit="cover"
          format="webp"
        />
        <img
          v-else
          :src="img.url"
          :alt="`${alt} ${i + 1}`"
        >
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { VehicleImage } from '~/composables/useVehicles'

const props = defineProps<{
  images: VehicleImage[]
  alt: string
}>()

const currentIndex = ref(0)
let touchStartX = 0

const sortedImages = computed(() =>
  [...props.images].sort((a, b) => a.position - b.position),
)

const currentImageRaw = computed(() => sortedImages.value[currentIndex.value] || null)

const currentImage = computed(() => {
  const img = currentImageRaw.value
  if (!img) return null
  return extractPath(img)
})

function isCloudinary(img: VehicleImage | null): boolean {
  return !!img?.url?.includes('cloudinary.com')
}

function extractPath(img: VehicleImage): string {
  if (img.url?.includes('cloudinary.com')) {
    const match = img.url.match(/\/upload\/(.+)$/)
    if (match) return match[1]!
  }
  return img.url || ''
}

function prev() {
  currentIndex.value = currentIndex.value > 0
    ? currentIndex.value - 1
    : sortedImages.value.length - 1
}

function next() {
  currentIndex.value = currentIndex.value < sortedImages.value.length - 1
    ? currentIndex.value + 1
    : 0
}

function onTouchStart(e: TouchEvent) {
  touchStartX = e.touches[0]?.clientX ?? 0
}

function onTouchEnd(e: TouchEvent) {
  const diff = touchStartX - (e.changedTouches[0]?.clientX ?? 0)
  if (Math.abs(diff) > 50) {
    if (diff > 0) next()
    else prev()
  }
}
</script>

<style scoped>
.gallery-main {
  position: relative;
  aspect-ratio: 4 / 3;
  background: var(--bg-secondary);
  border-radius: var(--border-radius-md);
  overflow: hidden;
  touch-action: pan-y;
}

.gallery-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.gallery-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-auxiliary);
}

.gallery-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(0, 0, 0, 0.4);
  color: var(--color-white);
  border-radius: var(--border-radius-full);
  min-width: 44px;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity var(--transition-fast);
}

.gallery-main:hover .gallery-nav {
  opacity: 1;
}

/* Always visible on touch devices */
@media (hover: none) {
  .gallery-nav {
    opacity: 0.7;
  }
}

.gallery-prev {
  left: var(--spacing-2);
}

.gallery-next {
  right: var(--spacing-2);
}

.gallery-counter {
  position: absolute;
  bottom: var(--spacing-2);
  right: var(--spacing-2);
  background: rgba(0, 0, 0, 0.5);
  color: var(--color-white);
  font-size: var(--font-size-xs);
  padding: var(--spacing-1) var(--spacing-2);
  border-radius: var(--border-radius-sm);
}

.gallery-thumbs {
  display: none;
}

@media (min-width: 768px) {
  .gallery-thumbs {
    display: flex;
    gap: var(--spacing-2);
    margin-top: var(--spacing-2);
    overflow-x: auto;
    scrollbar-width: none;
  }

  .gallery-thumbs::-webkit-scrollbar {
    display: none;
  }

  .gallery-thumb {
    flex-shrink: 0;
    width: 80px;
    height: 60px;
    border-radius: var(--border-radius-sm);
    overflow: hidden;
    border: 2px solid transparent;
    opacity: 0.6;
    transition: all var(--transition-fast);
    cursor: pointer;
  }

  .gallery-thumb.active {
    border-color: var(--color-primary);
    opacity: 1;
  }

  .gallery-thumb:hover {
    opacity: 1;
  }

  .gallery-thumb img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}
</style>

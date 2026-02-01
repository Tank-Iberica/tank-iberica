---
name: mobile-first
description: Mobile-first CSS and component patterns. Use when creating any Vue component, page, or layout. The main target of this project uses mobile.
---

# Mobile-First Patterns

## CSS structure (ALWAYS follow this)
```css
/* BASE = MOBILE (360px). No media query needed. */
.vehicle-card {
  display: flex;
  flex-direction: column;
  padding: 12px;
  gap: 8px;
}

/* Tablet */
@media (min-width: 768px) {
  .vehicle-card {
    flex-direction: row;
    padding: 16px;
    gap: 16px;
  }
}

/* Desktop */
@media (min-width: 1024px) {
  .vehicle-card {
    padding: 24px;
    gap: 24px;
  }
}
```

## NEVER do this
```css
/* ❌ WRONG: desktop-first */
.vehicle-card { padding: 24px; }
@media (max-width: 768px) { .vehicle-card { padding: 12px; } }

/* ❌ WRONG: fixed widths */
.container { width: 1200px; }

/* ❌ WRONG: hover-only interaction */
.dropdown:hover .menu { display: block; }
```

## Grid pattern (responsive columns)
```css
.vehicle-grid {
  display: grid;
  grid-template-columns: 1fr; /* Mobile: 1 column */
  gap: 16px;
}

@media (min-width: 768px) {
  .vehicle-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (min-width: 1024px) {
  .vehicle-grid { grid-template-columns: repeat(3, 1fr); }
}
```

## Touch targets
```css
/* Every interactive element: min 44x44px */
.btn, .icon-btn, a, input, select {
  min-height: 44px;
  min-width: 44px;
}
```

## Bottom sheet pattern (for modals on mobile)
```vue
<template>
  <div :class="isMobile ? 'bottom-sheet' : 'modal-centered'">
    <slot />
  </div>
</template>

<script setup>
const { width } = useWindowSize()
const isMobile = computed(() => width.value < 768)
</script>

<style scoped>
.bottom-sheet {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  max-height: 85vh;
  overflow-y: auto;
  border-radius: 16px 16px 0 0;
  background: white;
  padding: 16px;
}

.modal-centered {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  max-width: 600px;
  width: 90%;
  border-radius: 12px;
  background: white;
  padding: 24px;
}
</style>
```

## PASO 6B: DEUDA TÉCNICA DIFERIDA (NO hacer durante migración — referencia)

Estos problemas están identificados pero NO deben resolverse durante la migración. Requieren más trabajo o tienen dependencias externas. Se documentan aquí para no olvidarlos.

### 6B.1 Nominatim sin fallback robusto (Prioridad: MEDIA)

`useUserLocation` llama a `nominatim.openstreetmap.org` para reverse geocoding. Nominatim tiene rate limiting estricto (1 req/s) y exige identificar la aplicación. Con tráfico real, puede bloquear requests.

**Solución futura (post-lanzamiento):**

- Cachear respuestas de Nominatim en Supabase por coordenadas redondeadas (2 decimales = ~1km precisión)
- O migrar a Google Maps Geocoding API (tiene coste pero es fiable)
- O usar un servicio gratuito con más cuota como LocationIQ

### 6B.2 Favoritos en localStorage (Prioridad: MEDIA)

`useFavorites` usa localStorage. Los favoritos se pierden al cambiar de navegador o limpiar datos. El código tiene un comentario: "Will be migrated to Supabase favorites table in Step 3".

**Solución futura (Step 3 del roadmap):**

- Crear tabla `favorites` en Supabase con `user_id` + `vehicle_id`
- Sincronizar localStorage con Supabase cuando el usuario está autenticado
- Mantener localStorage como fallback para usuarios no autenticados

### 6B.3 Validación servidor en AdvertiseModal (Prioridad: MEDIA)

El formulario de "Anúnciate" valida solo en cliente. Un usuario autenticado puede insertar datos maliciosos directamente vía API de Supabase saltándose la validación Vue.

**Solución futura:**

- Añadir CHECK constraints en la tabla de Supabase (NOT NULL, longitud, formato)
- O crear Edge Function intermediaria que valide antes de insertar
- O crear server route en Nuxt como proxy con validación

### 6B.4 Cloudinary fallback hardcodeado (Prioridad: BAJA)

En `nuxt.config.ts`: `process.env.CLOUDINARY_CLOUD_NAME || 'djhcqgyjr'`. Si alguien clona el repo sin `.env`, tiene acceso de lectura a la cuenta Cloudinary real.

**Acción:** No es urgente (solo lectura, mismo patrón que la anon key de Supabase que es pública por diseño). Tener presente si se cambia a un plan de Cloudinary de pago con assets privados.

### 6B.5 Error boundary global (Prioridad: BAJA)

No hay `app:error` hook ni error boundaries por componente. Un fallo en el chat tumba toda la página en vez de solo el componente del chat.

**Solución futura:**

```typescript
// /app/plugins/error-handler.ts
export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.hook('app:error', (error) => {
    // Log a Sentry cuando se implemente
    console.error('Global error:', error)
  })

  nuxtApp.vueApp.config.errorHandler = (error, instance, info) => {
    // Capturar errores de componentes sin tumbar la app
    console.error('Component error:', error, info)
  }
})
```

---

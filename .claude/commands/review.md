Revisa los cambios recientes del proyecto Tracciona. Analiza:

1. **Seguridad** (CRÍTICO):
   - ¿Endpoints sin `serverSupabaseUser`?
   - ¿Service role sin verificación de ownership?
   - ¿innerHTML sin DOMPurify?
   - ¿Secretos hardcodeados?
   - ¿createError con mensajes detallados en producción? (usar safeError)
   - ¿RLS faltante en tablas nuevas?
   - ¿Crons sin verifyCronSecret?

2. **Rendimiento**:
   - ¿Queries sin índice en campos filtrados?
   - ¿Imports pesados en rutas públicas? (Chart.js, xlsx en home/catálogo)
   - ¿Componentes Vue > 500 líneas sin dividir?
   - ¿Imágenes sin NuxtImg o sin alt?

3. **TypeScript**:
   - ¿Uso de `any`?
   - ¿Tipos faltantes en props/emits/composables?

4. **i18n**:
   - ¿Texto hardcodeado en templates? (debe ser $t())
   - ¿Acceso directo a .name_es/.name_en? (debe ser localizedField)

5. **Mobile-first**:
   - ¿Elementos < 44px touch target?
   - ¿Overflow horizontal en 360px?

Para cada problema: muestra el archivo, la línea, y la corrección.

Ejecuta `npm run lint` y `npm run build` para verificar.

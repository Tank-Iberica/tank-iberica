Ejecuta un item del backlog técnico de Tracciona.

**Procedimiento:**

1. Lee docs/tracciona-docs/BACKLOG.md
2. Busca el item "$ARGUMENTS" (ej: "S1", "A2", "SEO1")
3. Lee los archivos relacionados del proyecto para entender el estado actual
4. Planifica la implementación basándote en el objetivo y entregables del item
5. Ejecuta parte por parte, en orden
6. Al terminar, ejecuta:
   - `npm run build` (debe compilar sin errores)
   - Tests relevantes si los hay
7. Reporta: qué se hizo, qué archivos se crearon/modificaron, si hubo problemas
8. Elimina el item completado del BACKLOG.md

**Reglas:**

- Sigue el objetivo del item. Lee el código actual antes de implementar.
- Si algo no está claro, PREGUNTA antes de actuar.
- Si un archivo que necesitas no existe, avísame.
- Usa context7 para verificar APIs actualizadas.

Item del backlog a ejecutar: $ARGUMENTS

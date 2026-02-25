Investiga y corrige el siguiente bug en Tracciona.

1. **Reproduce**: Lee el código relacionado. Entiende el flujo completo.
2. **Localiza**: Busca la causa raíz. Usa grep, revisa logs, traza el flujo.
3. **Analiza**: Usa Sequential Thinking para razonar sobre posibles causas.
4. **Contexto**: Revisa si alguna sesión de INSTRUCCIONES-MAESTRAS.md toca ese módulo.
5. **Corrige**: Implementa la solución mínima. No refactorices de más.
6. **Verifica**: `npm run build` + test si existe.
7. **Previene**: Si el bug es de seguridad o lógica crítica, añade un test en tests/security/ o tests/unit/.

Commit con formato: `fix: descripción del bug corregido`

Bug a investigar: $ARGUMENTS

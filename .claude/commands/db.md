Trabaja en la base de datos de Tracciona (Supabase PostgreSQL).

**ANTES de hacer cambios:**

1. Lee el schema actual: revisa las últimas migraciones en supabase/migrations/
2. Consulta contexto-global.md para ver migraciones recientes
3. La próxima migración debe ser numerada incrementalmente (00058, 00059...)

**Reglas Supabase:**

- RLS OBLIGATORIO en toda tabla nueva
- Nunca borrar columnas en producción → marcar como deprecated, migrar datos, luego borrar
- Índices en: campos de filtro/búsqueda, foreign keys, campos de ordenamiento
- JSONB para campos traducibles cortos (name, label)
- Tabla content_translations para textos largos (description, content)
- Usar `serverSupabaseServiceRole` SOLO cuando RLS no basta. Siempre verificar ownership después.
- Función `is_admin()` ya existe (migración 00055). Usarla en RLS policies.

**Formato de migración:**

```sql
-- Migración: 00058_descripcion.sql
-- Sesión: X (si aplica)
-- Propósito: descripción breve

BEGIN;
-- DDL aquí
COMMIT;
```

**Después del cambio:**

1. Verificar con Supabase MCP que la migración es correcta
2. `npx supabase db push` (si tienes CLI)
3. Regenerar tipos: `npx supabase gen types typescript --project-id gmnrfuzekbwyzkgsaftv > types/supabase.ts`

Cambio en BD: $ARGUMENTS

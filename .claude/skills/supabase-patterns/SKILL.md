---
name: supabase-patterns
description: Patrones de Supabase para Tracciona. Usar cuando se trabaje con migraciones, RLS, queries, o server routes que acceden a la BD.
globs: ['**/supabase/**', '**/server/api/**', '**/server/utils/supabase*']
---

# Patrones Supabase para Tracciona

## RLS obligatorio

- TODAS las tablas nuevas llevan RLS activado
- Policy mínima: SELECT para anon en tablas públicas, todo lo demás autenticado
- Patrón ownership: auth.uid() = user_id o dealer_id verificado via JOIN

## Server routes

- Lectura pública: serverSupabaseClient (usa anon key, respeta RLS)
- Lectura autenticada: serverSupabaseUser(event) para obtener user
- Escritura admin: serverSupabaseServiceRole(event) + verificar ownership manual
- Crons: verifyCronSecret(event) al inicio

## Migraciones

- Numeración incremental: 00058, 00059...
- Siempre incluir RLS policies en la misma migración
- Índices en: foreign keys, campos de búsqueda, campos de ordenamiento
- Después de migración: npx supabase gen types typescript --project-id gmnrfuzekbwyzkgsaftv > types/supabase.ts

## Queries

- Usar select() explícito, nunca traer todas las columnas
- Paginación con range() para listas grandes
- Siempre .single() cuando esperas un solo resultado
- Manejar error: if (error) throw safeError(500, error.message)

## i18n en BD

- Campos traducibles cortos: JSONB { es: "...", en: "..." }
- Campos traducibles largos: tabla content_translations
- NUNCA columnas \_es/\_en separadas (legacy, migrar si encuentras)

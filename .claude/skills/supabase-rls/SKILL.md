---
name: supabase-rls
description: Reglas y patrones de Row Level Security para Supabase en Tracciona. Usar cuando se creen tablas, migraciones, o se trabaje con permisos de BD.
globs: ['**/migrations/**', '**/supabase/**', '**/*.sql']
---

# Supabase RLS en Tracciona

## Función helper (ya existe en migración 00055)

```sql
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;
```

## Patrones RLS estándar

### Tabla pública (lectura abierta, escritura por owner)

```sql
ALTER TABLE mi_tabla ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lectura pública" ON mi_tabla
  FOR SELECT USING (true);

CREATE POLICY "Owner puede insertar" ON mi_tabla
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owner puede actualizar" ON mi_tabla
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Owner puede borrar" ON mi_tabla
  FOR DELETE USING (auth.uid() = user_id);
```

### Tabla privada (solo owner + admin)

```sql
CREATE POLICY "Solo owner o admin" ON mi_tabla
  FOR ALL USING (auth.uid() = user_id OR is_admin());
```

### Tabla solo admin

```sql
CREATE POLICY "Solo admin" ON mi_tabla
  FOR ALL USING (is_admin());
```

## Reglas

- NUNCA crear tabla sin RLS
- NUNCA usar service role sin verificar ownership después
- Siempre testear: ¿usuario A puede ver datos de usuario B?
- Índice en `user_id` si la tabla tiene RLS por owner

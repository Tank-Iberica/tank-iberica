# Runbook — Migración de Vertical entre Clusters Supabase

> **Uso:** Cuando una vertical (ej: maquinaria agrícola) crece y necesita su propio cluster Supabase.
> **Tiempo estimado:** 2-4 horas (con downtime de ~15 min en ventana de corte).
> **Prerrequisito:** Supabase CLI instalado y autenticado (`supabase login`).

---

## Conceptos

En Tracciona cada vertical está aislada por la columna `vertical` en todas las tablas.
Una migración inter-cluster mueve TODOS los datos de `vertical = 'X'` a un nuevo proyecto Supabase
manteniendo RLS, storage e integraciones.

```
[Cluster origen]  →  [Cluster destino]
gmnrfuzekbwyzkgsaftv     nuevo-project-id
vertical='trucks'    →   vertical='trucks'
(coexiste con otros)     (solo trucks)
```

---

## Paso 0 — Preparación (días antes)

### 0.1 Crear el nuevo proyecto Supabase

1. Dashboard → New Project
2. Misma región que el origen (reduce latencia inter-cluster si hay queries cross)
3. Anotar: `NEW_PROJECT_ID`, `NEW_DB_URL`, `NEW_ANON_KEY`, `NEW_SERVICE_KEY`

### 0.2 Añadir secrets al gestor

```bash
# Añadir en .env.local (NO commitear)
SUPABASE_NEW_URL=https://<NEW_PROJECT_ID>.supabase.co
SUPABASE_NEW_ANON_KEY=<NEW_ANON_KEY>
SUPABASE_NEW_SERVICE_KEY=<NEW_SERVICE_KEY>
SUPABASE_NEW_DB_URL=postgresql://postgres:<password>@db.<NEW_PROJECT_ID>.supabase.co:5432/postgres
```

### 0.3 Aplicar migraciones en el destino

```bash
# Enlazar proyecto destino en una carpeta temporal
cd /tmp && mkdir migration-target && cd migration-target
supabase init
supabase link --project-ref <NEW_PROJECT_ID>
supabase db push  # aplica todas las migraciones de /supabase/migrations
```

Verificar que el schema está correcto:
```bash
supabase db diff --linked  # debe mostrar 0 diferencias
```

### 0.4 Activar extensiones en el destino

```sql
-- Ejecutar en el SQL Editor del nuevo cluster
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "unaccent";
```

---

## Paso 1 — Pre-migración (día anterior)

### 1.1 Congelar creación de datos en la vertical

```sql
-- En el cluster ORIGEN: deshabilitar publicaciones nuevas temporalmente
UPDATE vertical_config
SET settings = jsonb_set(settings, '{maintenance_mode}', 'true')
WHERE vertical = '<VERTICAL>';
```

### 1.2 Contar registros a migrar (verificar luego)

```sql
-- Guardar estos números para verificación post-migración
SELECT 'vehicles' AS tabla, COUNT(*) FROM vehicles WHERE vertical = '<VERTICAL>'
UNION ALL
SELECT 'dealers', COUNT(*) FROM dealers WHERE vertical = '<VERTICAL>'
UNION ALL
SELECT 'auctions', COUNT(*) FROM auctions WHERE vertical = '<VERTICAL>'
UNION ALL
SELECT 'categories', COUNT(*) FROM categories WHERE vertical = '<VERTICAL>'
UNION ALL
SELECT 'subcategories', COUNT(*) FROM subcategories WHERE vertical = '<VERTICAL>'
UNION ALL
SELECT 'vertical_config', COUNT(*) FROM vertical_config WHERE vertical = '<VERTICAL>';
```

Anotar resultados en `/tmp/migration-counts.txt`.

### 1.3 Backup explícito antes de migrar

```bash
# Backup del cluster origen enfocado en la vertical
pg_dump "$SUPABASE_DB_URL" \
  --table=vehicles --table=dealers --table=auctions \
  --table=categories --table=subcategories --table=vertical_config \
  --table=bids --table=reservations --table=price_history \
  -F c -f /tmp/backup-<VERTICAL>-$(date +%Y%m%d).dump

# Verificar tamaño del dump
ls -lh /tmp/backup-<VERTICAL>-*.dump
```

---

## Paso 2 — Migración de datos (ventana de corte ~15 min)

### 2.1 Activar maintenance mode en frontend

```bash
# En nuxt.config.ts: añadir routeRule temporal
# O via Cloudflare Pages: Environment Variable NUXT_PUBLIC_MAINTENANCE=true
# Hacer deploy rápido (Pages tarda ~30s)
```

### 2.2 Exportar tablas de configuración

```bash
# vertical_config (tabla pequeña, exportar completa para esta vertical)
psql "$SUPABASE_DB_URL" -c "\COPY (
  SELECT * FROM vertical_config WHERE vertical = '<VERTICAL>'
) TO '/tmp/vertical_config_<VERTICAL>.csv' CSV HEADER"

# categories y subcategories
psql "$SUPABASE_DB_URL" -c "\COPY (
  SELECT * FROM categories WHERE vertical = '<VERTICAL>'
) TO '/tmp/categories_<VERTICAL>.csv' CSV HEADER"

psql "$SUPABASE_DB_URL" -c "\COPY (
  SELECT * FROM subcategories WHERE vertical = '<VERTICAL>'
) TO '/tmp/subcategories_<VERTICAL>.csv' CSV HEADER"
```

### 2.3 Exportar tablas de negocio

```bash
# Dealers
psql "$SUPABASE_DB_URL" -c "\COPY (
  SELECT * FROM dealers WHERE vertical = '<VERTICAL>'
) TO '/tmp/dealers_<VERTICAL>.csv' CSV HEADER"

# Vehicles (puede ser grande, añadir progress)
psql "$SUPABASE_DB_URL" -c "\COPY (
  SELECT * FROM vehicles WHERE vertical = '<VERTICAL>'
) TO '/tmp/vehicles_<VERTICAL>.csv' CSV HEADER"

# Auctions
psql "$SUPABASE_DB_URL" -c "\COPY (
  SELECT * FROM auctions a
  JOIN vehicles v ON v.id = a.vehicle_id
  WHERE v.vertical = '<VERTICAL>'
) TO '/tmp/auctions_<VERTICAL>.csv' CSV HEADER"

# Price history
psql "$SUPABASE_DB_URL" -c "\COPY (
  SELECT ph.* FROM price_history ph
  JOIN vehicles v ON v.id = ph.vehicle_id
  WHERE v.vertical = '<VERTICAL>'
) TO '/tmp/price_history_<VERTICAL>.csv' CSV HEADER"
```

### 2.4 Exportar usuarios auth (requiere service role)

```bash
# Obtener user_ids de dealers de esta vertical
psql "$SUPABASE_DB_URL" -c "\COPY (
  SELECT DISTINCT user_id FROM dealers WHERE vertical = '<VERTICAL>'
) TO '/tmp/user_ids_<VERTICAL>.csv' CSV HEADER"

# Nota: auth.users NO se puede exportar/importar directamente con pg_dump/restore
# entre proyectos Supabase (auth schema es gestionado por Supabase).
# Los usuarios deben recibir un email para re-registrarse en el nuevo cluster,
# O usar Supabase Admin API para crear cuentas con mismo email:
# POST /auth/v1/admin/users { email, email_confirm: true, user_metadata }
```

### 2.5 Importar en el cluster destino

```bash
# Orden importación: config → dealers → vehicles → dependientes

# 1. Config
psql "$SUPABASE_NEW_DB_URL" -c "\COPY vertical_config FROM '/tmp/vertical_config_<VERTICAL>.csv' CSV HEADER"
psql "$SUPABASE_NEW_DB_URL" -c "\COPY categories FROM '/tmp/categories_<VERTICAL>.csv' CSV HEADER"
psql "$SUPABASE_NEW_DB_URL" -c "\COPY subcategories FROM '/tmp/subcategories_<VERTICAL>.csv' CSV HEADER"

# 2. Dealers (sin user_id si los usuarios no existen aún en destino)
psql "$SUPABASE_NEW_DB_URL" -c "\COPY dealers FROM '/tmp/dealers_<VERTICAL>.csv' CSV HEADER"

# 3. Vehicles
psql "$SUPABASE_NEW_DB_URL" -c "\COPY vehicles FROM '/tmp/vehicles_<VERTICAL>.csv' CSV HEADER"

# 4. Dependientes
psql "$SUPABASE_NEW_DB_URL" -c "\COPY auctions FROM '/tmp/auctions_<VERTICAL>.csv' CSV HEADER"
psql "$SUPABASE_NEW_DB_URL" -c "\COPY price_history FROM '/tmp/price_history_<VERTICAL>.csv' CSV HEADER"
```

---

## Paso 3 — Verificación

### 3.1 Contar registros en destino

```sql
-- Ejecutar en el cluster DESTINO
SELECT 'vehicles' AS tabla, COUNT(*) FROM vehicles WHERE vertical = '<VERTICAL>'
UNION ALL
SELECT 'dealers', COUNT(*) FROM dealers WHERE vertical = '<VERTICAL>'
UNION ALL
SELECT 'auctions', COUNT(*) FROM auctions WHERE vertical = '<VERTICAL>'
UNION ALL
SELECT 'categories', COUNT(*) FROM categories WHERE vertical = '<VERTICAL>'
UNION ALL
SELECT 'subcategories', COUNT(*) FROM subcategories WHERE vertical = '<VERTICAL>'
UNION ALL
SELECT 'vertical_config', COUNT(*) FROM vertical_config WHERE vertical = '<VERTICAL>';
```

Comparar con los números de `/tmp/migration-counts.txt`. Deben coincidir exactamente.

### 3.2 Verificar integridad referencial

```sql
-- Vehicles sin dealer válido
SELECT COUNT(*) FROM vehicles v
LEFT JOIN dealers d ON d.id = v.dealer_id
WHERE v.vertical = '<VERTICAL>' AND d.id IS NULL;
-- Esperado: 0

-- Auctions sin vehicle válido
SELECT COUNT(*) FROM auctions a
LEFT JOIN vehicles v ON v.id = a.vehicle_id
WHERE v.vertical = '<VERTICAL>' AND v.id IS NULL;
-- Esperado: 0
```

### 3.3 Test de lectura via API

```bash
# Probar el nuevo cluster directamente
curl -s "https://<NEW_PROJECT_ID>.supabase.co/rest/v1/vehicles?vertical=eq.<VERTICAL>&status=eq.published&limit=3" \
  -H "apikey: $SUPABASE_NEW_ANON_KEY" \
  -H "Authorization: Bearer $SUPABASE_NEW_ANON_KEY" | jq 'length'
# Esperado: 3 (o menos si hay menos publicados)
```

---

## Paso 4 — Corte de tráfico

### 4.1 Actualizar variables de entorno

En Cloudflare Pages → Settings → Environment Variables:

```
# Para la vertical que migra a nuevo cluster
SUPABASE_URL_<VERTICAL_UPPER>=https://<NEW_PROJECT_ID>.supabase.co
SUPABASE_ANON_KEY_<VERTICAL_UPPER>=<NEW_ANON_KEY>
```

O si el código usa una única URL de Supabase (arquitectura actual):
1. Actualizar `SUPABASE_URL` y `SUPABASE_ANON_KEY` en el nuevo entorno
2. Hacer redeploy inmediato

### 4.2 Desactivar maintenance mode

```bash
# Revertir el cambio de maintenance mode
# En Cloudflare Pages: quitar NUXT_PUBLIC_MAINTENANCE
```

---

## Paso 5 — Limpieza post-migración (1 semana después)

> ⚠️ NO eliminar datos del origen hasta verificar que el sistema lleva 7 días estable en el destino.

### 5.1 Archivar datos del origen

```sql
-- En el cluster ORIGEN: marcar la vertical como migrada
UPDATE vertical_config
SET settings = jsonb_set(settings, '{migrated_to}', '"<NEW_PROJECT_ID>"')
WHERE vertical = '<VERTICAL>';

-- Opcional: deshabilitar definitivamente
UPDATE vertical_config
SET settings = jsonb_set(settings, '{migrated_at}', to_jsonb(NOW()::text))
WHERE vertical = '<VERTICAL>';
```

### 5.2 Eliminar datos del origen (después de confirmación explícita)

```sql
-- EJECUTAR SOLO DESPUÉS DE CONFIRMACIÓN EXPLÍCITA DEL EQUIPO
-- Orden: dependientes → principales → config
DELETE FROM price_history WHERE vehicle_id IN (SELECT id FROM vehicles WHERE vertical = '<VERTICAL>');
DELETE FROM bids WHERE auction_id IN (SELECT id FROM auctions WHERE vehicle_id IN (SELECT id FROM vehicles WHERE vertical = '<VERTICAL>'));
DELETE FROM auctions WHERE vehicle_id IN (SELECT id FROM vehicles WHERE vertical = '<VERTICAL>');
DELETE FROM reservations WHERE vehicle_id IN (SELECT id FROM vehicles WHERE vertical = '<VERTICAL>');
DELETE FROM vehicles WHERE vertical = '<VERTICAL>';
DELETE FROM dealers WHERE vertical = '<VERTICAL>';
DELETE FROM subcategories WHERE vertical = '<VERTICAL>';
DELETE FROM categories WHERE vertical = '<VERTICAL>';
DELETE FROM vertical_config WHERE vertical = '<VERTICAL>';
```

---

## Rollback

Si algo falla antes del corte de tráfico (Paso 4):

```bash
# 1. El cluster origen sigue intacto — simplemente no hacer el corte
# 2. Desactivar maintenance mode
# 3. Restaurar vertical_config maintenance_mode = false en origen

# Si ya se hizo el corte:
# 1. Revertir variables de entorno a los valores del origen
# 2. Redeploy en Cloudflare Pages
# 3. El origen tiene todos los datos — los nuevos escritos en destino
#    durante la ventana de corte se pierden (< 15 min de gap)
```

---

## Checklist completo

```
PRE-MIGRACIÓN:
[ ] Nuevo proyecto Supabase creado
[ ] Migraciones aplicadas en destino (supabase db push)
[ ] Extensiones pg_trgm, uuid-ossp, unaccent activas en destino
[ ] Counts de origen anotados
[ ] Backup explícito generado y verificado

MIGRACIÓN:
[ ] Maintenance mode activo
[ ] CSVs exportados (verificar tamaños != 0)
[ ] CSVs importados en orden correcto
[ ] Counts de destino == counts de origen
[ ] Integridad referencial: 0 orphans
[ ] Test curl a nuevo cluster devuelve datos

CORTE:
[ ] Variables de entorno actualizadas en Cloudflare Pages
[ ] Redeploy exitoso
[ ] Maintenance mode desactivado
[ ] Test manual en producción (crear anuncio, ver detalle, subir imagen)

POST-MIGRACIÓN (7 días después):
[ ] 7 días sin incidencias en el destino
[ ] Datos del origen archivados o eliminados
[ ] Secrets del origen rotados si ya no se usan
[ ] DISASTER-RECOVERY.md actualizado con nuevo cluster
```

---

*Ver también: `referencia/DISASTER-RECOVERY.md`, `referencia/SECRETS-ROTATION.md`*

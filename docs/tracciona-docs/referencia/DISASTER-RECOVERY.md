# Disaster Recovery — Tracciona

## Capas de backup

### Capa 1: Supabase PITR (incluido en Pro)

- RPO: 0 minutos (restaura a cualquier segundo)
- Retención: 7 días (Pro) / 28 días (Team)
- Cómo restaurar: Dashboard → Database → Backups → Point in Time Recovery
- Tiempo de restauración: 5-30 minutos según tamaño de BD
- LIMITACIÓN: Solo restaura la BD de Supabase, NO archivos en Cloudflare/Cloudinary

### Capa 2: Backup diario automatizado a B2

- RPO: 24 horas
- Retención: 7 backups diarios + 4 semanales + 6 mensuales
- Ejecución: GitHub Actions diario a las 02:00 UTC
- Script: `scripts/backup-multi-tier.sh`
- Workflow: `.github/workflows/backup.yml`
- Destino: Backblaze B2 (S3-compatible)
- Cifrado: AES-256-CBC con PBKDF2

### Capa 3: Backup mensual de larga retención

- RPO: 30 días
- Retención: 6 meses
- Ejecución: automática (primer domingo de cada mes, incluido en Capa 2)

## Escenarios de recuperación

| Escenario                              | Capa                   | Datos perdidos (máx) |
| -------------------------------------- | ---------------------- | -------------------- |
| Error hace 2 horas                     | PITR                   | 0 minutos            |
| Error hace 12 horas                    | PITR                   | 0 minutos            |
| Supabase borra tu proyecto             | Backup diario en B2    | 24 horas             |
| Corrupción detectada 3 días después    | Backup diario (hay 7)  | 0-24 horas           |
| Corrupción detectada 2 semanas después | Backup semanal (hay 4) | 0-7 días             |
| Desastre mayor hace 3 meses            | Backup mensual (hay 6) | 0-30 días            |

## Restauración desde B2

1. Descargar backup: `b2 download-file tracciona-backups/daily/tracciona_YYYYMMDD_HHMMSS.sql.enc`
2. Descifrar: `openssl enc -aes-256-cbc -d -pbkdf2 -iter 100000 -in backup.sql.enc -out backup.sql -pass pass:"$KEY"`
3. Restaurar: `psql $DATABASE_URL < backup.sql`
4. Verificar conteos de tablas clave

## Backup de imágenes originales (#92)

Las imágenes de vehículos son irreemplazables. Proceso para preservar los originales:

### Cloudinary (transformaciones + entrega)

- Los originales subidos se almacenan en Cloudinary bajo la carpeta `tracciona/vehicles/{dealer_id}/`.
- Cloudinary Pro incluye backup automático. Verificar que está activo: Settings → Backup → S3 bucket propio.
- **Proceso de backup manual (mensual):** Usar Cloudinary CLI para exportar a B2:
  ```bash
  # Requiere: cloudinary-cli instalado y CLOUDINARY_URL configurada
  cld fetch-resources --folder tracciona/vehicles --output /tmp/cloudinary-backup
  # Subir a B2
  b2 sync /tmp/cloudinary-backup b2://tracciona-backups/images/
  ```

### Cloudflare Images (almacenamiento permanente)

- Los IDs de imagen se guardan en la BD (`vehicles.image_ids[]`). Si se pierde una imagen en CF Images, la referencia queda huérfana.
- **Recuperación:** Con el backup de BD, se pueden identificar todos los `image_ids` y verificar disponibilidad en CF Images via API.
- No hay backup automático propio de CF Images — la BD es el índice de verdad.

### Política de retención de originales

| Tipo          | Almacén        | Backup           | Retención |
| ------------- | -------------- | ---------------- | --------- |
| Fotos vehículo | CF Images       | Solo BD (índice) | Permanente |
| Docs dealer   | Cloudinary (privado) | CF R2 mensual | 5 años |
| Logos/branding | Cloudinary     | CF R2 mensual    | Permanente |

## Servicios NO cubiertos por backup de BD

- Cloudinary: imágenes (tiene su propio backup, ver sección anterior)
- Cloudflare Images: imágenes (BD es el índice, ver sección anterior)
- Stripe: datos de pago (Stripe mantiene su propio historial)
- GitHub: código fuente (git es el backup)

## Test de restauración

Ejecutar 1x/trimestre:

1. Descargar último backup daily
2. Restaurar en instancia temporal (Railway/Neon)
3. Verificar conteos: vehicles, dealers, users, subscriptions
4. Documentar resultado en PLAN-AUDITORIA.md

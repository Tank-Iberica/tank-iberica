# Release Checklist — Tracciona

Cloudflare Pages despliega automáticamente en cada push a `main`.
Este checklist aplica a releases que incluyan cambios críticos
(migraciones de BD, nuevas features de monetización, cambios de auth).

---

## Checklist pre-merge a main

### Seguridad

- [ ] `npm audit --omit=dev` sin HIGH/CRITICAL nuevos
- [ ] Gitleaks no reportó secretos nuevos en el PR
- [ ] Semgrep sin findings CRITICAL/HIGH nuevos
- [ ] Si hay nueva tabla: RLS policies creadas y revisadas

### Calidad

- [ ] CI verde (ESLint + TypeScript + Tests)
- [ ] Build local sin errores: `npm run build`
- [ ] Si hay nueva página: revisar mobile (360px)
- [ ] Si hay formulario nuevo: autocomplete + validación + aria

### Base de datos (solo si hay migración)

- [ ] Migración probada en Supabase preview/dev branch o staging (`xddjhrgkwwolpugtxgfk`)
- [ ] Sin datos irrecuperables borrados (migración reversible o con backup)
- [ ] Si hay columnas nuevas: valores por defecto no null razonables
- [ ] RLS policies para tablas nuevas
- [ ] Tests IDOR pasan en CI (job `idor-tests`) — verificar si la migración afecta RLS

### Configuración (solo si hay nuevo servicio)

- [ ] Secrets añadidos en GitHub (Settings → Secrets)
- [ ] Variable de entorno documentada en `.env.example`
- [ ] Entrada añadida en `ENTORNO-DESARROLLO.md` si requiere setup manual

---

## Checklist post-deploy

_(Deploy automático en ~2 min tras push a main)_

- [ ] Abrir https://tracciona.com y verificar que carga (no 500/blank)
- [ ] Si había migración: verificar en Supabase que se aplicó
- [ ] Si había nueva feature: smoke test manual de la feature
- [ ] Cloudflare Pages: confirmar deployment exitoso en dashboard

---

## Rollback

Si algo falla tras deploy:

1. **Código:** `git revert HEAD && git push origin main`
   CF Pages desplegará el revert automáticamente (~2 min)

2. **BD (si migración rompió algo):**
   - Usar Supabase PITR (Point in Time Recovery) en Dashboard → Database → Backups
   - O restaurar desde backup B2 (ver DISASTER-RECOVERY.md)

3. **Notificar:** Si hay usuarios activos afectados, actualizar estado en página de status (si existe)

---

_Última actualización: mar-2026_

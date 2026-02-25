# Convenciones de codigo

## Tamano de archivos

- Componentes Vue: maximo 500 lineas. Si crece, extraer sub-componentes.
- Server routes: maximo 200 lineas. Si crece, extraer logica a `server/utils/` o `server/services/`.

## Composables

- Un composable por dominio: `useVehicles`, `useAuction`, `useAuth`.
- Si necesitas compartir entre admin y dashboard: `composables/shared/`.
- NO crear composables genericos tipo `useHelper` o `useUtils`.

## Componentes

- Especificos de admin: `components/admin/`
- Especificos de dashboard: `components/dashboard/`
- Compartidos: `components/shared/`
- Genericos (UI): `components/ui/`

## Server routes

- Auth: siempre `serverSupabaseUser(event)` al inicio.
- Service role: solo cuando RLS no es suficiente. Verificar ownership despues.
- Errores: usar `safeError()` para mensajes genericos en produccion.

## i18n

- Textos UI: siempre `$t('key')`, nunca texto hardcodeado.
- Datos dinamicos: `localizedField(item.name, locale)`.
- NUNCA acceder a `.name_es` o `.name_en` directamente.

## Tests

- Seguridad: `tests/security/` — se ejecutan en CI
- Unitarios: `tests/unit/` — Vitest
- E2E: `tests/e2e/` — Playwright

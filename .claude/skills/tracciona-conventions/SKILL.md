---
name: tracciona-conventions
description: Convenciones de código y arquitectura de Tracciona. Se activa en todo el proyecto.
globs: ['**/*.vue', '**/*.ts', '**/composables/**', '**/components/**']
---

# Convenciones — Tracciona

## Tamaños máximos

- Componentes Vue: 500 líneas → dividir en subcomponentes
- Server routes: 200 líneas → extraer a server/services/
- Composables: 1 por dominio (useVehicles, useAuction, useAuth)

## Estructura de componentes

- admin/ → solo /admin/\*
- dashboard/ → solo /dashboard/\*
- shared/ → compartidos admin+dashboard
- ui/ → genéricos (Button, Modal, Input)
- features/ → dominio (VehicleCard, AuctionTimer)

## i18n

- Texto UI: `$t('seccion.clave')`
- Datos BD traducibles: `localizedField(item.name, locale)`
- NUNCA: `.name_es`, `.name_en` directamente

## CSS

- Mobile-first: base 360px, breakpoints con min-width
- Design tokens en tokens.css (--primary, --accent, spacing)
- Touch targets ≥ 44px

## Git

- Commits en español: feat:, fix:, refactor:, test:, docs:
- Un commit por parte de sesión
- `npm run build` antes de push

## Imports

- Absolutos: `~/composables/`, `~/components/`
- Nunca importar desde node_modules directamente si hay wrapper

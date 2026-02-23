# Estructura de la carpeta Tracciona

```
C:\Users\j_m_g\OneDrive\Documentos\
├── tank-iberica\              ← BACKUP INTACTO. No tocar nunca más.
│
└── Tracciona\                 ← COPIA DE TANK-IBERICA + DOCS NUEVOS
    │
    ├── .claude\
    │   ├── commands\          ← ya existe (de tank-iberica)
    │   ├── skills\            ← ya existe
    │   ├── settings.json      ← ya existe
    │   └── settings.local.json ← ya existe
    │
    ├── CLAUDE.md              ← REEMPLAZAR con el nuevo (el que te di)
    │
    ├── docs\
    │   ├── admin-funcionalidades.md    ← ya existe (referencia legacy)
    │   ├── esquema-bd.md               ← ya existe
    │   ├── GUIA_CONFIGURACION.md       ← ya existe
    │   ├── hoja-de-ruta.md             ← ya existe
    │   ├── index-funcionalidades.md    ← ya existe
    │   ├── inventario-ui.md            ← ya existe
    │   ├── legacy\                     ← ya existe
    │   ├── plan-v3.md                  ← ya existe
    │   ├── progreso.md                 ← ya existe
    │   │
    │   └── tracciona-docs\             ← NUEVO — descomprimir zip aquí
    │       ├── contexto-global.md
    │       ├── README.md
    │       ├── CHANGELOG.md
    │       ├── migracion\
    │       │   ├── 00-backup.md
    │       │   ├── 01-pasos-0-6-migracion.md
    │       │   ├── 02-deuda-tecnica-diferida.md
    │       │   └── 03-roadmap-post-lanzamiento.md
    │       ├── anexos\
    │       │   ├── A-verticales-confirmados.md
    │       │   ├── B-verticales-futuros.md
    │       │   ├── ... (C hasta V)
    │       │   └── W-panel-configuracion.md
    │       ├── pitch\
    │       │   ├── pitch-inversores.html
    │       │   └── pitch-dealers.html
    │       └── referencia\
    │           ├── addendum-business-bible.md
    │           ├── addendum-plan-operativo.md
    │           └── documentos-relacionados.md
    │
    ├── app\                   ← ya existe (Claude Code MODIFICA esto)
    │   ├── app.vue
    │   ├── components\
    │   │   ├── admin\
    │   │   ├── catalog\
    │   │   ├── layout\
    │   │   ├── modals\
    │   │   ├── ui\
    │   │   ├── user\
    │   │   └── vehicle\
    │   ├── composables\
    │   │   ├── admin\
    │   │   ├── useCatalogState.ts
    │   │   ├── useFavorites.ts
    │   │   ├── useFilters.ts
    │   │   ├── useNews.ts
    │   │   ├── usePageSeo.ts
    │   │   ├── useUserChat.ts
    │   │   ├── useUserLocation.ts
    │   │   ├── useVehicles.ts
    │   │   └── useVehicleTypeSelector.ts
    │   ├── pages\
    │   │   ├── admin\
    │   │   ├── confirm.vue
    │   │   ├── index.vue
    │   │   ├── legal.vue
    │   │   ├── noticias\
    │   │   ├── sobre-nosotros.vue
    │   │   └── vehiculo\
    │   ├── layouts\
    │   ├── middleware\
    │   ├── plugins\
    │   ├── assets\
    │   └── utils\
    │
    ├── i18n\                  ← ya existe (es.json, en.json)
    ├── public\                ← ya existe
    ├── server\                ← ya existe
    ├── supabase\
    │   ├── migrations\        ← 30 migraciones existentes (00001-00030)
    │   │                        Claude Code añade 00031, 00032...
    │   └── seed\
    │
    ├── nuxt.config.ts         ← ya existe (Claude Code modifica)
    ├── package.json           ← ya existe
    ├── tsconfig.json          ← ya existe
    ├── .env                   ← ya existe (keys de Supabase)
    ├── .gitignore             ← ya existe
    └── eslint.config.mjs      ← ya existe
```

## Pasos para preparar

1. Copiar carpeta completa:
   tank-iberica → Tracciona

2. En Tracciona/, reemplazar CLAUDE.md con el nuevo

3. En Tracciona/docs/, crear carpeta tracciona-docs/
   y descomprimir el zip dentro

4. Abrir terminal:
   cd C:\Users\j_m_g\OneDrive\Documentos\Tracciona
   claude

5. Primer prompt:
   "Lee docs/tracciona-docs/migracion/00-backup.md y ejecuta el backup"

```

```

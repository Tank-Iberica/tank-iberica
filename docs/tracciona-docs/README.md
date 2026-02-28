# Tracciona.com — Documentacion de Producto

> **Estado:** Migracion completada (sesiones 1-64). Este directorio contiene la documentacion de producto activa.

## Estructura de carpetas

```
tracciona-docs/
├── README.md                          ← ESTAS AQUI
├── contexto-global.md                 ← MAPA del proyecto para Claude Code (SSOT)
├── INSTRUCCIONES-MAESTRAS.md          ← Sesiones de ejecucion 1-43 (SSOT)
├── CHANGELOG.md                       ← Registro de decisiones estrategicas
├── CHECKLIST-SEO-UX-TECNICO.md        ← Checklist SEO/UX/tecnico con responsable
├── anexos/                            ← Especificaciones detalladas por modulo (A-Y)
│   ├── A-verticales-confirmados.md
│   ├── B-verticales-futuros.md
│   ├── ...
│   └── Y-mapa-composables.md
└── referencia/                        ← Documentacion tecnica de referencia
    ├── API-PUBLIC.md
    ├── ARQUITECTURA-ESCALABILIDAD.md
    ├── CLOUDFLARE-WAF-CONFIG.md
    ├── CRON-JOBS.md
    ├── DATA-RETENTION.md
    ├── DISASTER-RECOVERY.md
    ├── ERD.md
    ├── FLUJOS-OPERATIVOS.md
    ├── INVENTARIO-ENDPOINTS.md
    ├── SECRETS-ROTATION.md
    ├── SECURITY-TESTING.md
    └── THIRD-PARTY-DEPENDENCIES.md
```

## Documentos SSOT (fuente de verdad)

| Documento                   | Que contiene                        |
| --------------------------- | ----------------------------------- |
| `contexto-global.md`        | Mapa del proyecto, estado, sesiones |
| `INSTRUCCIONES-MAESTRAS.md` | Sesiones 1-43 de ejecucion          |
| `CHANGELOG.md`              | Registro cronologico de decisiones  |

## Anexos (referencia de especificaciones)

Los anexos A-Y contienen especificaciones detalladas por modulo. Se consultan cuando `INSTRUCCIONES-MAESTRAS.md` los referencia en una sesion concreta.

## Referencia tecnica

La carpeta `referencia/` contiene documentacion tecnica operativa (endpoints, arquitectura, seguridad, cron jobs, etc.).

## Documentos movidos a legacy

Los documentos de migracion (`00-backup.md`, `01-pasos-0-6-migracion.md`, etc.) y los addendums han sido movidos a `docs/legacy/` por estar completados y superseded.

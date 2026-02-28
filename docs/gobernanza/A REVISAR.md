# A REVISAR — Ideas y flujos rescatables de docs legacy

> **Proposito:** Capturar ideas, herramientas y flujos utiles encontrados en documentos movidos a `docs/legacy/` que NO estan cubiertos en docs vivos. Cada item debe evaluarse y, si se decide implementar, documentarse en el doc SSOT correspondiente y eliminarse de aqui.

**Generado:** 2026-02-28
**Fuente:** Auditoria de gobernanza documental

---

## 1. TAREAS FUNDADORES (de DOC2-TAREAS-FUNDADORES.md)

Tareas que requieren accion humana (no automatizable por Claude Code):

### Urgentes (no verificadas como completadas)

| #   | Tarea                                                                | Estado estimado | Donde verificar         |
| --- | -------------------------------------------------------------------- | --------------- | ----------------------- |
| 1   | Registrar marca "Tracciona" en OEPM (clases 35/42, ~300EUR)          | Sin verificar   | Preguntar a fundadores  |
| 2   | Comprar dominio defensivo tracciona.es                               | Sin verificar   | Registrador de dominios |
| 3   | Configurar rate limiting en Cloudflare WAF (tabla de reglas en DOC2) | Sin verificar   | Dashboard Cloudflare    |
| 4   | Configurar UptimeRobot (plan gratuito, 2 monitores)                  | Sin verificar   | uptimerobot.com         |

### Alta prioridad

| #   | Tarea                                                         | Notas                               |
| --- | ------------------------------------------------------------- | ----------------------------------- |
| 6   | Verificar paginas legales con contenido REAL (no placeholder) | Herramienta AEPD: facilita-emprende |
| 7   | Crear RAT (Registro Actividades Tratamiento) obligatorio GDPR | Plantilla AEPD disponible           |
| 8   | Verificar banner cookies bloquea scripts ANTES de aceptar     | Verificar en DevTools               |
| 9   | Documentar quien ejecuta los 12 cron jobs                     | GitHub Actions scheduler propuesto  |
| 10  | Probar restore de backup manualmente (Backblaze B2 + Neon)    | Nunca probado                       |

### Prioridad media

| #   | Tarea                                                 | Notas                            |
| --- | ----------------------------------------------------- | -------------------------------- |
| 13  | Tank Iberica como primer dealer (dogfooding)          | Probar flujo WhatsApp completo   |
| 14  | Contactar 50 dealers vehiculos industriales           | Video 60s + mensaje tipo en DOC2 |
| 15  | Sprint planning minimo semanal (15 min Lu, 10 min Vi) | 5 metricas semanales definidas   |

### Prioridad baja

| #   | Tarea                                     | Notas                            |
| --- | ----------------------------------------- | -------------------------------- |
| 16  | Contratos tipo Founding Dealers           | Antes del primer dealer de pago  |
| 17  | Asesor fiscal UK/ES para transfer pricing | Cuando haya ingresos cruzados    |
| 18  | Seguro RC profesional (~300-600EUR/ano)   | Cuando haya transacciones reales |

---

## 2. ESTRATEGIA WHATSAPP MULTI-PAIS (de DOC2)

Documentacion de referencia para escalar WhatsApp internacionalmente:

- **Fase 1 (ahora):** Un +34, deteccion automatica de idioma, 0EUR
- **Fase 2 (ano 2):** Smart routing con links/QR por pais, 0EUR extra
- **Fase 3 (ano 3+):** Numeros locales virtuales via Telnyx/Vonage (~1EUR/mes/pais)
- **Opciones:** Twilio virtual, Meta Cloud API directo, proveedores bulk (MessageBird/Vonage/Telnyx)
- **Decision clave:** Si coste > percepcion local → smart routing (0EUR). Si presencia local → Telnyx (~1EUR/mes/pais)

---

## 3. ESTRATEGIA DE NEGOCIO (de DOC3-APOYO-ESTRATEGIA.md)

### Hallazgos no resueltos

- Auth middleware verifica rol admin? (posible acceso admin para usuarios autenticados)
- `verify-document.post.ts` usa SDK Anthropic directo sin failover
- Prebid configurado pero posiblemente inactivo
- `scrape-competitors.ts` posiblemente deprecado — decidir si borrar

### Roadmap hacia 100/100 por dimension

- Dimension 7 (Legal): de 50 a 100 requiere contenido real en paginas legales, RAT, banner cookies funcional
- Dimension 12 (PI): de 45 a 100 requiere registro marca OEPM, dominios defensivos (.es), NDA template

### Breakeven y proyeccion financiera

- **Costes fijos estimados ano 1:** ~50EUR/mes (Supabase Pro + Cloudflare + dominio)
- **Breakeven con suscripciones:** 5 dealers Basic (25EUR) + 2 Pro (75EUR) = 275EUR/mes → rentable
- **Proyeccion DOC3:** 10 dealers pagando mes 3, 50 dealers mes 6, 200 dealers ano 1

---

## 4. FLUJOS OPERATIVOS (de FLUJOS-OPERATIVOS-TRACCIONA.md)

### Pipeline imagenes — Fases 2 y 3 no implementadas

- **Fase 2:** Cloudinary transforma + CF Images almacena (cache immutable 30d)
- **Fase 3:** CF Images directo (eliminar Cloudinary)
- **Decision pendiente:** Cuando migrar de fase 1 (Cloudinary only) a fase 2

### Contenido editorial — Workflow no implementado

- Flujo dominical con Claude Max: preparar noticias de la semana
- Auto-publish: cron Ma/Ju 09:00 CET para web, Lu-Vi para redes
- SEO Score Potenciador ampliado

---

## 5. MIGRACION LEGACY (de migracion-\*)

### Plan de contingencia rescatable

- Procedimientos de migracion de cada servicio (Supabase, Cloudflare, Cloudinary)
- Alternativas documentadas para cada proveedor
- GitHub como fuente de verdad del codigo (regla vigente)

### Deuda tecnica diferida

- Items originales de deuda tecnica que pueden seguir pendientes
- Verificar contra CHECKLIST-POST-SESIONES.md para no duplicar

---

## 6. AUDITORIA BASELINE (de PLAN-AUDITORIA-TRACCIONA.md)

### Plan de auditoria a 20 anos (2026-2046)

- Calendario maestro de auditoria por dimension
- Fases evolutivas del plan
- Herramientas y coste por fase
- Plantilla de informe de auditoria
- **Valor:** Marco formal para auditorias futuras, no implementado actualmente

---

## 7. DESIGN SYSTEM ORIGINAL (de DESIGN_SYSTEM.md)

### Elementos posiblemente no migrados

- Paleta de colores original Tank Iberica (referencia para vertical config)
- Tipografia y espaciados del sistema anterior
- **Verificar:** tokens.css cubre todo lo necesario? O hay gaps del design system original?

---

## 8. INVENTARIO UI ORIGINAL (de inventario-ui.md)

### Elementos UI del sistema anterior

- Inventario completo de elementos UI de index.html (12.788 lineas) y admin.html (8.860 lineas)
- **Valor:** Referencia para verificar que la migracion cubrio todos los elementos UI funcionales
- **Accion:** Cruzar contra ESTADO-REAL-PRODUCTO.md para detectar gaps

---

## PREGUNTAS DE DECISION (para vaciar este documento)

Al resolver cada pregunta, mover la decision al doc SSOT correspondiente y eliminar de aqui:

1. **Marca OEPM:** Se registro? Si no, es urgente. Si si, documentar en CLAUDE.md
2. **Rate limiting CF:** Se configuro? Si no, es blocker pre-lanzamiento
3. **Cron scheduler:** Se configuro GitHub Actions o servicio externo? Si no, los crons no se ejecutan
4. **Restore backup:** Se probo? Si no, el backup es "una esperanza, no un plan"
5. **Primer dealer:** Tank Iberica esta registrada como dealer en la plataforma?
6. **Prebid:** Se usa o se elimina?
7. **scrape-competitors.ts:** Se usa o se elimina?
8. **Pipeline imagenes:** Cuando migrar de Cloudinary-only a Cloudinary+CF Images?
9. **Contenido editorial:** Se implemento el workflow dominical con Claude Max?
10. **Plan auditoria 20 anos:** Se adopta el marco formal o se simplifica?

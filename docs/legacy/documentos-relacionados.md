## RESUMEN COMPLETO DEL DOCUMENTO

| Sección             | Contenido                                                                                                                                                                                        | Líneas aprox. |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------- |
| **Pasos 0-5**       | Migración técnica (backup, SQL, frontend, landings, routing)                                                                                                                                     | ~550          |
| **Paso 6**          | 20 mejoras pre-lanzamiento                                                                                                                                                                       | ~300          |
| **Paso 6B**         | 5 items deuda técnica diferida                                                                                                                                                                   | ~80           |
| **Pasos 7-9**       | Roadmap post-lanzamiento (semanas 1 → 18 meses)                                                                                                                                                  | ~450          |
| **Anexo A-C**       | Verticales (7 confirmados + 4 futuros)                                                                                                                                                           | ~130          |
| **Anexo D**         | Monetización (16 fuentes de ingreso)                                                                                                                                                             | ~70           |
| **Anexo E**         | Sistema Pro + Founding Dealers                                                                                                                                                                   | ~170          |
| **Anexo F**         | Publicidad directa                                                                                                                                                                               | ~110          |
| **Anexo G + G-BIS** | Verificación "Carfax" + Transporte                                                                                                                                                               | ~330          |
| **Anexo H**         | Subastas                                                                                                                                                                                         | ~330          |
| **Anexo I**         | Automatización con IA                                                                                                                                                                            | ~310          |
| **Anexo J**         | AdSense + Google Ads                                                                                                                                                                             | ~330          |
| **Anexo K**         | Dealer Toolkit                                                                                                                                                                                   | ~440          |
| **Anexo L**         | Flujo post-venta                                                                                                                                                                                 | ~130          |
| **Anexo M**         | Herramientas adicionales dealer                                                                                                                                                                  | ~170          |
| **Anexo N**         | Seguridad y mantenimiento                                                                                                                                                                        | ~200          |
| **Anexo O**         | Hub físico León                                                                                                                                                                                  | ~120          |
| **Anexo P**         | Contenido editorial (guías, noticias, normativa, comparativas) — actualizado con i18n y scheduling                                                                                               | ~160          |
| **Anexo Q**         | Merchandising para dealers (imprenta partner, comisiones)                                                                                                                                        | ~80           |
| **Anexo R**         | Marco legal, disclaimers, RGPD, setup coste-0                                                                                                                                                    | ~140          |
| **Anexo S**         | Monetización de datos (productos, clientes, marco legal)                                                                                                                                         | ~140          |
| **Anexo T**         | **NUEVO** — Sistema de internacionalización (i18n) escalable: JSONB + content_translations + traducción automática GPT-4o mini + helper localizedField() + cambio strategy prefix_except_default | ~240          |
| **Anexo U**         | **NUEVO** — Publicación programada + calendario editorial: cron auto-publish, horarios web (Ma/Ju 09:00), redes (Lu-Vi), SEO Score Potenciador ampliado, flujo dominical con Claude Max          | ~130          |
| **Anexo V**         | **NUEVO** — Tablas placeholder Capa 2: dealers, vehicles extras, auctions, verification, ad_slots, transport_quotes — solo schema SQL sin frontend                                               | ~170          |

---

## DOCUMENTOS RELACIONADOS

Este prompt de migración es la referencia técnica y estratégica de producto. Existen otros documentos operativos generados en sesiones anteriores que lo complementan:

### Documentos generados (Word/PDF)

| Documento                                    | Contenido                                                                                                                                                                                                                                                                                                 | Sesión         |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- |
| **Business Bible (Biblia de TradeBase)**     | Estrategia corporativa completa: visión, estructura empresarial (Tank Ibérica + SL verticales + IberHaul + Gesturban), modelo de negocio, análisis de mercado, ventajas competitivas, roadmap de verticales, financiación. Documento para inversores y referencia estratégica.                            | 13-14 Feb 2026 |
| **Plan Operativo Tracciona.com**             | Calendario semana a semana (24 semanas), scripts de llamada comercial (apertura, propuesta, objeciones, cierre), email post-llamada, checklist técnico de lanzamiento (30+ items), KPIs con semáforo rojo/amarillo/verde, proceso de onboarding dealer (autoservicio vs asistido), stack de herramientas. | 16 Feb 2026    |
| **Especificación SEO Landing System**        | Especificación técnica completa del sistema de landing pages dinámicas: schema de BD, URL architecture, anti-canibalization logic, breadcrumbs, internal linking. Base para el Paso 3 de este prompt.                                                                                                     | 17 Feb 2026    |
| **Categorías y Subcategorías de Verticales** | Taxonomía completa de los 7 verticales: 46 categorías, 209 subcategorías. Referencia para configurar la BD de cada vertical.                                                                                                                                                                              | 17 Feb 2026    |

### Sesiones de contexto (transcripts disponibles)

| Fecha          | Transcript                                       | Temas clave no cubiertos aquí                                                                                                                                              |
| -------------- | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 10 Feb 2026    | `tank-iberica-seo-audit.txt`                     | Auditoría SEO original de Tank Ibérica, análisis de competidores (Mascus, Europa-Camiones, Autoline), keywords research                                                    |
| 10 Feb 2026    | `marketplace-b2b-business-strategy.txt`          | Estrategia de negocio B2B, preparación pitch inversores, análisis competitivo detallado                                                                                    |
| 12 Feb 2026    | `tank-iberica-verification-levels-documents.txt` | Discusión original de niveles de verificación, documentos por tipo de vehículo, costes de extracción con IA                                                                |
| 13-14 Feb 2026 | `tradebase-business-bible-structure.txt`         | Estructura corporativa completa, financiación Tank Ibérica (500K€), modelo operativo con subcontratistas                                                                   |
| 16 Feb 2026    | `tracciona-operational-plan-automation.txt`      | Plan operativo 6 meses, staffing (2 personas → 4-5 en mes 18), costes primer año (~900-5.000€), perfil del primer comercial, análisis de automatización                    |
| 16 Feb 2026    | `tracciona-dealer-tools-post-sale-flow.txt`      | Herramientas de facturas/contratos existentes en código, seguridad del stack serverless, modelo de subastas presenciales vs online, hub de León como centro de liquidación |
| 17 Feb 2026    | `tracciona-url-structure-seo-dynamic-pages.txt`  | Arquitectura URL, generación dinámica de landings, anti-canibalization, breadcrumbs                                                                                        |
| 17 Feb 2026    | `tracciona-seo-landing-system-legal-costs.txt`   | Costes legales SL (~3.000€), GDPR, responsabilidad civil, review del código Nuxt/Supabase                                                                                  |

### Datos clave de contexto (de sesiones anteriores)

**Tank Ibérica SL:**

- CIF: B24724684
- Facturación: ~500K€/año
- Ubicación: Onzonilla, León
- Representante: Vicente González Martín
- Operaciones: compraventa física de vehículos industriales, alquiler de cisternas

**Equipo actual:**

- 2 personas (tú + hermano en León)
- Plan de contratación: comercial a comisión en mes 6-10, admin media jornada en mes 12-18
- Chófer por servicio (no empleado fijo)

**Costes del primer año del marketplace:**

- Mínimo: ~900€ (solo infraestructura)
- Recomendado: ~2.500-3.000€ (+ Google Ads de prueba)
- Cómodo: ~4.000-5.000€ (+ constitución SL nueva)

**Stack técnico actual:**

- Frontend: Nuxt 3 (Vue 3) + TypeScript
- Backend: Supabase (PostgreSQL + Auth + Realtime + Storage)
- Hosting: Cloudflare Pages
- Imágenes: Cloudinary
- Desarrollo: Claude Code
- Dominio: tracciona.com (pendiente registro)

---

_Documento compilado en febrero de 2026._
_Última actualización: 18 de febrero de 2026._
_Total: ~5.100 líneas. 10 pasos de migración + 22 anexos (A-V)._

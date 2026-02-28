/**
 * generate-rat.ts — Auto-generates a GDPR Article 30 RAT draft.
 *
 * RAT = Registro de Actividades de Tratamiento (Record of Processing Activities)
 *
 * Sources:
 *   1. types/supabase.ts     → detects tables with PII columns
 *   2. .env.example           → lists external processors (Stripe, Supabase, etc.)
 *   3. docs/.../DATA-RETENTION.md → retention periods
 *
 * Usage:  npx tsx scripts/generate-rat.ts
 * Output: docs/legal/RAT-BORRADOR.md
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const ROOT = resolve(import.meta.dirname ?? __dirname, '..')

// ---------------------------------------------------------------------------
// 1. Parse Supabase types to detect PII columns
// ---------------------------------------------------------------------------

const PII_PATTERNS = [
  /email/i,
  /phone/i,
  /name/i,
  /ip_address/i,
  /tax_id/i,
  /cif_nif/i,
  /nif/i,
  /avatar/i,
  /id_number/i,
  /document_number/i,
]

// Columns that match "name" but are NOT personal data
const FALSE_POSITIVES = new Set([
  'name', // generic JSONB label on categories/brands/attributes
  'display_name',
  'file_name',
  'column_name',
  'table_name',
  'brand_name',
  'model_name',
  'vertical_name',
  'slug_name',
  'name_en',
  'name_es',
  'name_fr',
  'name_singular',
  'name_singular_en',
  'name_singular_es',
  'name_singular_fr',
  'zone_name',
  'region_name',
  'partner_name',
  'provider_name',
  'subcategory_name',
  'cloudinary_cloud_name',
  'email_templates',
  'email_type',
  'include_in_email',
  'phone_verified',
  'phone_number_id',
  'owner_name', // vehicle previous owner — not a registered user
])

interface TablePII {
  table: string
  columns: { col: string; type: string }[]
  hasUserId: boolean
}

function parseSupabaseTypes(): TablePII[] {
  const src = readFileSync(resolve(ROOT, 'types/supabase.ts'), 'utf-8')
  const results: TablePII[] = []

  // Match each table block:  tableName: { Row: { ... } }
  const tableRe = /^ {6}(\w+): \{\n {8}Row: \{([\s\S]*?)\}/gm
  let match: RegExpExecArray | null
  while ((match = tableRe.exec(src)) !== null) {
    const tableName = match[1]
    const rowBlock = match[2]

    const piiCols: { col: string; type: string }[] = []
    let hasUserId = false

    // Parse each column line
    const colRe = /(\w+):\s*([^\n]+)/g
    let colMatch: RegExpExecArray | null
    while ((colMatch = colRe.exec(rowBlock)) !== null) {
      const colName = colMatch[1]
      const colType = colMatch[2].replace(/\s*$/, '')

      if (colName === 'user_id') {
        hasUserId = true
        continue
      }

      // Skip false positives (generic "name" on non-personal tables)
      if (FALSE_POSITIVES.has(colName)) continue

      const isPII = PII_PATTERNS.some((p) => p.test(colName))
      if (isPII) {
        piiCols.push({ col: colName, type: colType.replace(/\|/g, '/').trim() })
      }
    }

    if (piiCols.length > 0 || hasUserId) {
      results.push({ table: tableName, columns: piiCols, hasUserId })
    }
  }

  return results
}

// ---------------------------------------------------------------------------
// 2. Parse .env.example to identify external processors
// ---------------------------------------------------------------------------

interface Processor {
  name: string
  service: string
  purpose: string
  location: string
  scc: boolean // Standard Contractual Clauses (for non-EU transfers)
}

const PROCESSOR_MAP: Record<string, Omit<Processor, 'name'>> = {
  SUPABASE: {
    service: 'Supabase Inc.',
    purpose: 'Base de datos, autenticación, almacenamiento',
    location: 'AWS eu-central-1 (Frankfurt)',
    scc: false,
  },
  STRIPE: {
    service: 'Stripe Inc.',
    purpose: 'Procesamiento de pagos, facturación',
    location: 'EE.UU. (con SCC)',
    scc: true,
  },
  CLOUDINARY: {
    service: 'Cloudinary Ltd.',
    purpose: 'Procesamiento y transformación de imágenes',
    location: 'EE.UU. (con SCC)',
    scc: true,
  },
  RESEND: {
    service: 'Resend Inc.',
    purpose: 'Envío de emails transaccionales',
    location: 'EE.UU. (con SCC)',
    scc: true,
  },
  CLOUDFLARE: {
    service: 'Cloudflare Inc.',
    purpose: 'CDN, WAF, hosting, almacenamiento de imágenes',
    location: 'Global (con SCC)',
    scc: true,
  },
  WHATSAPP: {
    service: 'Meta Platforms Ireland Ltd.',
    purpose: 'Notificaciones WhatsApp Business',
    location: 'Irlanda / EE.UU. (con SCC)',
    scc: true,
  },
  ANTHROPIC: {
    service: 'Anthropic PBC',
    purpose: 'Generación de contenido con IA',
    location: 'EE.UU. (con SCC)',
    scc: true,
  },
  OPENAI: {
    service: 'OpenAI Inc.',
    purpose: 'IA de respaldo (failover)',
    location: 'EE.UU. (con SCC)',
    scc: true,
  },
  SENTRY: {
    service: 'Functional Software Inc. (Sentry)',
    purpose: 'Monitorización de errores',
    location: 'EE.UU. (con SCC)',
    scc: true,
  },
  QUADERNO: {
    service: 'Quaderno (Recrea Systems SL)',
    purpose: 'Facturación y cumplimiento fiscal',
    location: 'España (UE)',
    scc: false,
  },
  GOOGLE: {
    service: 'Google Ireland Ltd.',
    purpose: 'OAuth, Google Ads',
    location: 'Irlanda / EE.UU. (con SCC)',
    scc: true,
  },
  TURNSTILE: {
    service: 'Cloudflare Inc.',
    purpose: 'Protección anti-bot (CAPTCHA)',
    location: 'Global (con SCC)',
    scc: true,
  },
}

function parseEnvProcessors(): Processor[] {
  const env = readFileSync(resolve(ROOT, '.env.example'), 'utf-8')
  const found = new Set<string>()

  for (const line of env.split('\n')) {
    if (line.startsWith('#') || !line.includes('=')) continue
    const key = line.split('=')[0].trim()

    for (const prefix of Object.keys(PROCESSOR_MAP)) {
      if (key.toUpperCase().includes(prefix)) {
        found.add(prefix)
      }
    }
  }

  return Array.from(found).map((key) => ({
    name: key,
    ...PROCESSOR_MAP[key],
  }))
}

// ---------------------------------------------------------------------------
// 3. Parse DATA-RETENTION.md
// ---------------------------------------------------------------------------

interface RetentionEntry {
  dataType: string
  active: string
  archive: string
  delete: string
  legalBasis: string
}

function parseRetention(): RetentionEntry[] {
  const md = readFileSync(
    resolve(ROOT, 'docs/tracciona-docs/referencia/DATA-RETENTION.md'),
    'utf-8',
  )
  const entries: RetentionEntry[] = []

  const lines = md.split('\n')
  for (const line of lines) {
    // Match table rows (skip headers and separators)
    if (!line.startsWith('|') || line.includes('---') || line.includes('Data Type')) continue
    const cells = line
      .split('|')
      .map((c) => c.trim())
      .filter(Boolean)
    if (cells.length >= 5) {
      entries.push({
        dataType: cells[0],
        active: cells[1],
        archive: cells[2],
        delete: cells[3],
        legalBasis: cells[4],
      })
    }
  }
  return entries
}

// ---------------------------------------------------------------------------
// 4. Processing activities catalog (business-level)
// ---------------------------------------------------------------------------

interface ProcessingActivity {
  id: string
  name: string
  purpose: string
  legalBasis: string
  dataSubjects: string
  dataCategories: string[]
  relatedTables: string[]
  retention: string
  processors: string[]
}

const ACTIVITIES: ProcessingActivity[] = [
  {
    id: 'ACT-01',
    name: 'Registro y autenticación de usuarios',
    purpose: 'Crear y gestionar cuentas de usuario (compradores y concesionarios)',
    legalBasis: 'Art. 6.1.b RGPD — Ejecución de contrato',
    dataSubjects: 'Usuarios registrados (compradores, concesionarios)',
    dataCategories: ['Email', 'Nombre completo', 'Teléfono', 'Contraseña (hash)', 'Avatar'],
    relatedTables: ['users', 'profiles', 'consents'],
    retention: 'Indefinido (hasta solicitud de supresión)',
    processors: ['Supabase Inc.', 'Google Ireland Ltd.'],
  },
  {
    id: 'ACT-02',
    name: 'Gestión de concesionarios',
    purpose: 'Verificar y gestionar cuentas de concesionarios profesionales',
    legalBasis: 'Art. 6.1.b RGPD — Ejecución de contrato',
    dataSubjects: 'Concesionarios profesionales',
    dataCategories: ['Razón social', 'CIF/NIF', 'Email', 'Teléfono', 'Documentos de verificación'],
    relatedTables: [
      'dealers',
      'dealer_fiscal_data',
      'verification_documents',
      'auction_registrations',
    ],
    retention: 'Indefinido (hasta baja del concesionario)',
    processors: ['Supabase Inc.'],
  },
  {
    id: 'ACT-03',
    name: 'Publicación de anuncios de vehículos',
    purpose: 'Permitir la publicación y gestión de anuncios de vehículos',
    legalBasis: 'Art. 6.1.b RGPD — Ejecución de contrato',
    dataSubjects: 'Anunciantes (particulares y concesionarios)',
    dataCategories: ['Nombre de contacto', 'Email', 'Teléfono'],
    relatedTables: ['advertisements', 'ads'],
    retention: 'Activo: indefinido | Archivado: 2 años tras venta/eliminación',
    processors: ['Supabase Inc.', 'Cloudinary Ltd.', 'Cloudflare Inc.'],
  },
  {
    id: 'ACT-04',
    name: 'Procesamiento de pagos',
    purpose: 'Gestionar suscripciones, destacados y depósitos de subasta',
    legalBasis: 'Art. 6.1.b RGPD — Ejecución de contrato',
    dataSubjects: 'Usuarios que realizan pagos',
    dataCategories: ['Datos de pago (vía Stripe)', 'NIF facturación', 'Email'],
    relatedTables: ['payments', 'dealer_invoices', 'reservations'],
    retention: 'Facturas: 10 años (obligación fiscal España)',
    processors: ['Stripe Inc.', 'Recrea Systems SL (Quaderno)'],
  },
  {
    id: 'ACT-05',
    name: 'Subastas',
    purpose: 'Gestionar subastas de vehículos y pujas',
    legalBasis: 'Art. 6.1.b RGPD — Ejecución de contrato',
    dataSubjects: 'Participantes en subastas',
    dataCategories: ['user_id', 'DNI/NIE', 'Razón social', 'Datos del depósito'],
    relatedTables: ['auction_bids', 'auction_registrations'],
    retention: 'Pujas: 5 años (requisito legal)',
    processors: ['Supabase Inc.', 'Stripe Inc.'],
  },
  {
    id: 'ACT-06',
    name: 'Leads y contactos comerciales',
    purpose: 'Gestionar solicitudes de contacto, demandas e inspecciones',
    legalBasis: 'Art. 6.1.b RGPD — Ejecución de contrato / Art. 6.1.f — Interés legítimo',
    dataSubjects: 'Usuarios interesados en vehículos',
    dataCategories: ['Nombre', 'Email', 'Teléfono', 'Empresa'],
    relatedTables: ['contacts', 'dealer_leads', 'demands', 'leads', 'pipeline_items'],
    retention: 'Indefinido (hasta eliminación del concesionario)',
    processors: ['Supabase Inc.', 'Resend Inc.'],
  },
  {
    id: 'ACT-07',
    name: 'Comunicaciones (email y WhatsApp)',
    purpose: 'Envío de notificaciones, alertas y comunicaciones transaccionales',
    legalBasis: 'Art. 6.1.b RGPD — Ejecución de contrato / Art. 6.1.a — Consentimiento',
    dataSubjects: 'Usuarios registrados, suscriptores newsletter',
    dataCategories: ['Email', 'Teléfono (WhatsApp)', 'Preferencias de email'],
    relatedTables: [
      'email_logs',
      'email_preferences',
      'newsletter_subscriptions',
      'whatsapp_submissions',
    ],
    retention: 'Logs email: 6 meses | WhatsApp: 1 año | Newsletter: hasta baja',
    processors: ['Resend Inc.', 'Meta Platforms Ireland Ltd.'],
  },
  {
    id: 'ACT-08',
    name: 'Analítica y seguimiento de actividad',
    purpose: 'Registrar actividad para seguridad, auditoría y mejora del servicio',
    legalBasis: 'Art. 6.1.f RGPD — Interés legítimo',
    dataSubjects: 'Todos los usuarios',
    dataCategories: ['user_id', 'Dirección IP', 'Eventos de actividad'],
    relatedTables: [
      'activity_logs',
      'ad_events',
      'user_vehicle_views',
      'user_ad_profiles',
      'vehicle_comparisons',
    ],
    retention: 'Logs: 6 meses activo, 2 años archivo | Impresiones: 90 días',
    processors: ['Supabase Inc.', 'Functional Software Inc. (Sentry)'],
  },
  {
    id: 'ACT-09',
    name: 'Alertas de búsqueda y favoritos',
    purpose: 'Guardar preferencias y notificar sobre nuevos vehículos',
    legalBasis: 'Art. 6.1.a RGPD — Consentimiento',
    dataSubjects: 'Usuarios registrados',
    dataCategories: ['user_id', 'Criterios de búsqueda', 'Vehículos favoritos'],
    relatedTables: ['search_alerts', 'favorites'],
    retention: 'Indefinido (hasta eliminación de cuenta)',
    processors: ['Supabase Inc.'],
  },
  {
    id: 'ACT-10',
    name: 'Suscripciones de datos de mercado',
    purpose: 'Ofrecer acceso a informes y datos de mercado',
    legalBasis: 'Art. 6.1.b RGPD — Ejecución de contrato',
    dataSubjects: 'Suscriptores profesionales',
    dataCategories: ['Email', 'Empresa', 'user_id'],
    relatedTables: ['data_subscriptions'],
    retention: 'Indefinido (hasta cancelación)',
    processors: ['Supabase Inc.', 'Stripe Inc.'],
  },
  {
    id: 'ACT-11',
    name: 'Generación de contenido con IA',
    purpose: 'Generar descripciones de vehículos y contenido editorial',
    legalBasis: 'Art. 6.1.f RGPD — Interés legítimo',
    dataSubjects: 'N/A (no se envían datos personales a la IA)',
    dataCategories: ['Datos técnicos de vehículos (no PII)'],
    relatedTables: [],
    retention: 'No aplica',
    processors: ['Anthropic PBC', 'OpenAI Inc.'],
  },
  {
    id: 'ACT-12',
    name: 'Notificaciones push',
    purpose: 'Enviar notificaciones push a dispositivos suscritos',
    legalBasis: 'Art. 6.1.a RGPD — Consentimiento',
    dataSubjects: 'Usuarios que aceptan push',
    dataCategories: ['user_id', 'Endpoint push', 'Claves VAPID'],
    relatedTables: ['push_subscriptions'],
    retention: 'Hasta revocación del consentimiento',
    processors: ['Cloudflare Inc.'],
  },
  {
    id: 'ACT-13',
    name: 'Reseñas de vendedores',
    purpose: 'Permitir valoraciones de concesionarios por compradores',
    legalBasis: 'Art. 6.1.f RGPD — Interés legítimo',
    dataSubjects: 'Compradores que escriben reseñas',
    dataCategories: ['user_id', 'Texto de reseña'],
    relatedTables: ['seller_reviews'],
    retention: 'Indefinido (moderadas)',
    processors: ['Supabase Inc.'],
  },
]

// ---------------------------------------------------------------------------
// 5. Generate the RAT document
// ---------------------------------------------------------------------------

function generateRAT(): string {
  const now = new Date().toISOString().split('T')[0]
  const tables = parseSupabaseTypes()
  const processors = parseEnvProcessors()
  const retention = parseRetention()

  const lines: string[] = []
  const w = (s = '') => lines.push(s)

  w('# Registro de Actividades de Tratamiento (RAT)')
  w()
  w('> **Artículo 30 del Reglamento General de Protección de Datos (RGPD)**')
  w(`> Generado automáticamente el ${now} por \`scripts/generate-rat.ts\``)
  w('> **BORRADOR** — Requiere revisión legal antes de su uso oficial.')
  w()
  w('---')
  w()

  // -- Section 1: Responsible entity
  w('## 1. Responsable del tratamiento')
  w()
  w('| Campo | Valor |')
  w('|-------|-------|')
  w('| **Razón social** | *[Completar]* |')
  w('| **CIF** | *[Completar]* |')
  w('| **Domicilio** | *[Completar]* |')
  w('| **Email de contacto** | tankiberica@gmail.com |')
  w('| **Web** | https://tracciona.com |')
  w('| **DPO designado** | *[Completar si aplica — obligatorio si tratamiento a gran escala]* |')
  w()

  // -- Section 2: Processing activities
  w('## 2. Actividades de tratamiento')
  w()

  for (const act of ACTIVITIES) {
    w(`### ${act.id}: ${act.name}`)
    w()
    w('| Campo | Detalle |')
    w('|-------|---------|')
    w(`| **Finalidad** | ${act.purpose} |`)
    w(`| **Base jurídica** | ${act.legalBasis} |`)
    w(`| **Categoría de interesados** | ${act.dataSubjects} |`)
    w(`| **Categorías de datos** | ${act.dataCategories.join(', ')} |`)
    w(
      `| **Tablas BD relacionadas** | ${act.relatedTables.length ? '`' + act.relatedTables.join('`, `') + '`' : 'N/A'} |`,
    )
    w(`| **Plazo de conservación** | ${act.retention} |`)
    w(`| **Encargados del tratamiento** | ${act.processors.join(', ')} |`)
    w(
      `| **Transferencias internacionales** | ${act.processors.some((p) => p.includes('Inc.') || p.includes('PBC')) ? 'Sí — con Cláusulas Contractuales Tipo (SCC)' : 'No'} |`,
    )
    w()
  }

  // -- Section 3: External processors
  w('## 3. Encargados del tratamiento (subprocesadores)')
  w()
  w('> Detectados automáticamente desde `.env.example`')
  w()
  w('| Proveedor | Servicio | Ubicación | SCC/Adecuación |')
  w('|-----------|----------|-----------|----------------|')
  for (const p of processors) {
    w(
      `| ${p.service} | ${p.purpose} | ${p.location} | ${p.scc ? 'SCC vigentes' : 'UE — no requiere'} |`,
    )
  }
  w()

  // -- Section 4: Retention
  w('## 4. Plazos de conservación')
  w()
  w('> Extraído de `DATA-RETENTION.md`')
  w()
  w('| Tipo de dato | Activo | Archivo | Eliminación | Base legal |')
  w('|-------------|--------|---------|-------------|------------|')
  for (const r of retention) {
    w(`| ${r.dataType} | ${r.active} | ${r.archive} | ${r.delete} | ${r.legalBasis} |`)
  }
  w()

  // -- Section 5: PII inventory
  w('## 5. Inventario de datos personales en base de datos')
  w()
  w('> Detectado automáticamente desde `types/supabase.ts`')
  w()
  w(`Se han identificado **${tables.length} tablas** con datos personales:`)
  w()
  w('| Tabla | Columnas PII | Vinculada a usuario |')
  w('|-------|-------------|---------------------|')
  for (const t of tables) {
    const cols = t.columns.map((c) => `\`${c.col}\``).join(', ') || '—'
    w(`| \`${t.table}\` | ${cols} | ${t.hasUserId ? 'Sí' : 'No'} |`)
  }
  w()

  // -- Section 6: Security measures
  w('## 6. Medidas de seguridad (Art. 32 RGPD)')
  w()
  w('### Medidas técnicas')
  w()
  w('- **Cifrado en tránsito**: TLS 1.3 en todas las conexiones (Cloudflare)')
  w('- **Cifrado en reposo**: AES-256 en base de datos (Supabase/AWS)')
  w('- **Autenticación**: Supabase Auth con hash bcrypt, soporte OAuth 2.0')
  w('- **Autorización**: Row Level Security (RLS) en todas las tablas')
  w('- **WAF**: Cloudflare WAF con rate limiting por endpoint')
  w('- **Anti-bot**: Cloudflare Turnstile en formularios públicos')
  w('- **Sanitización**: DOMPurify para contenido HTML, parametrización SQL')
  w('- **Headers de seguridad**: CSP, X-Frame-Options, HSTS')
  w('- **Monitorización**: Sentry para errores, alertas de infraestructura')
  w()
  w('### Medidas organizativas')
  w()
  w('- **Acceso mínimo**: Solo admin tiene acceso al panel de administración')
  w('- **Backups**: Diarios (7 días), semanales (4 semanas), mensuales (6 meses)')
  w('- **Revisión de accesos**: Periódica en Supabase Dashboard')
  w('- **Formación**: *[Completar — plan de formación RGPD para el equipo]* ')
  w()

  // -- Section 7: Data subject rights
  w('## 7. Derechos de los interesados')
  w()
  w('| Derecho | Implementación | Endpoint |')
  w('|---------|---------------|----------|')
  w('| **Acceso** (Art. 15) | Perfil de usuario visible en `/perfil` | — |')
  w('| **Rectificación** (Art. 16) | Edición en `/perfil` | — |')
  w(
    '| **Supresión** (Art. 17) | Borrado de cuenta en `/perfil/seguridad` | `DELETE /api/account/delete` |',
  )
  w('| **Portabilidad** (Art. 20) | Exportación de datos | `GET /api/account/export` |')
  w('| **Oposición** (Art. 21) | Preferencias de email, desuscripción | `/perfil/notificaciones` |')
  w('| **Limitación** (Art. 18) | Contacto vía email | tankiberica@gmail.com |')
  w()

  // -- Section 8: Changelog
  w('## 8. Historial de cambios')
  w()
  w('| Fecha | Cambio | Autor |')
  w('|-------|--------|-------|')
  w(`| ${now} | Generación inicial automática | generate-rat.ts |`)
  w()
  w('---')
  w()
  w('*Este documento se regenera ejecutando `npx tsx scripts/generate-rat.ts`.')
  w('Cada cambio en tablas, procesadores o retención se reflejará automáticamente.*')

  return lines.join('\n')
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const output = generateRAT()
const outPath = resolve(ROOT, 'docs/legal/RAT-BORRADOR.md')
writeFileSync(outPath, output, 'utf-8')

console.log(`RAT generated → ${outPath}`)
console.log(`  Tables with PII: ${parseSupabaseTypes().length}`)
console.log(`  Processors found: ${parseEnvProcessors().length}`)
console.log(`  Retention entries: ${parseRetention().length}`)

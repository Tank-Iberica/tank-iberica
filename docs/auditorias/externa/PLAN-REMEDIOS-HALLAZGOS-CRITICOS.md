# PLAN DE REMEDIOS — HALLAZGOS CRÍTICOS

**Tracciona | 25 febrero 2026**

---

## VISIÓN GENERAL

**Estado actual:** 5 hallazgos críticos + 7 hallazgos altos = Lanzamiento en riesgo  
**Objetivo:** Elevar a 80/100 (launch-safe) en 2-3 semanas  
**Responsables:** Fundador dev (sesiones código), Fundador ops (paralelo)

---

## C1 — COLUMNA `vertical` FALTANTE EN `vehicles` Y `advertisements`

### Gravedad: 🔴 CRÍTICA

Si se lanza con 2+ verticales, datos se mezclan. Garantizado bug en producción.

### El problema

```sql
-- Hoy: query devuelve TODO sin filtrar
SELECT * FROM vehicles WHERE status = 'published'
-- Devuelve: vehículos de Tracciona + vehículos de Horecaria (cuando exista)

-- Esperado: filtrar por vertical
SELECT * FROM vehicles WHERE status = 'published' AND vertical = 'tracciona'
```

### Solución: Migración 00063

**Crear archivo:** `supabase/migrations/00063_vehicles_vertical_column.sql`

```sql
-- 1. Añadir columna vertical con default 'tracciona'
ALTER TABLE vehicles
  ADD COLUMN IF NOT EXISTS vertical text NOT NULL DEFAULT 'tracciona';

ALTER TABLE advertisements
  ADD COLUMN IF NOT EXISTS vertical text NOT NULL DEFAULT 'tracciona';

-- 2. Crear índices para queries rápidas
CREATE INDEX IF NOT EXISTS idx_vehicles_vertical
  ON vehicles(vertical);

CREATE INDEX IF NOT EXISTS idx_vehicles_vertical_status
  ON vehicles(vertical, status);

CREATE INDEX IF NOT EXISTS idx_advertisements_vertical
  ON advertisements(vertical);

-- 3. RLS policy (si no existe): solo ver datos del vertical del usuario
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vehicles_by_vertical" ON vehicles
  FOR SELECT
  USING (vertical = current_setting('app.current_vertical', true)::text);

-- 4. Asegurarse de que datos existentes tienen vertical
UPDATE vehicles SET vertical = 'tracciona' WHERE vertical IS NULL OR vertical = '';
UPDATE advertisements SET vertical = 'tracciona' WHERE vertical IS NULL OR vertical = '';

-- 5. Verificación post-migración
-- (Admin ejecuta manualmente después de deploy)
-- SELECT COUNT(*) FROM vehicles WHERE vertical IS NULL; -- Debe ser 0
```

### Cambios en código

**Archivo:** `server/utils/supabaseQuery.ts`

- Localizar función `vehiclesQuery()`
- Verificar que incluye `.eq('vertical', vertical)` en la query
- Si usa `where` con string, cambiar a método `.eq()` si no está

**Antes:**

```typescript
export function vehiclesQuery(vertical: string) {
  return supabase.from('vehicles').select('*')
  // ❌ FALTA el filtro vertical
}
```

**Después:**

```typescript
export function vehiclesQuery(vertical: string) {
  return supabase.from('vehicles').select('*').eq('vertical', vertical) // ✅ Filtrar por vertical
}
```

### Testing

**Crear test:** `tests/security/vertical-isolation-c1.test.ts`

```typescript
describe('Vertical isolation - vehicles table', () => {
  it('vehiclesQuery(tracciona) should NOT return horecaria data', async () => {
    const { data } = await vehiclesQuery('tracciona')
    const hasHorecaria = data?.some((v) => v.vertical === 'horecaria')
    expect(hasHorecaria).toBe(false)
  })

  it('vehiclesQuery(horecaria) should NOT return tracciona data', async () => {
    // Similar test para otro vertical
  })
})
```

### Timeline

- **Dev time:** 30 minutos (migración + cambios código)
- **Testing:** 30 minutos (test manual + automatizado)
- **Total:** 1 hora
- **Blocker:** SÍ, hasta completar

### Verificación

```bash
# Post-deploy
npm run build  # Debe compilar sin errores
npm run test -- vertical-isolation  # Debe pasar

# Manual en Supabase dashboard
SELECT COUNT(*) FROM vehicles WHERE vertical IS NULL;  -- Debe ser 0
SELECT COUNT(DISTINCT vertical) FROM vehicles;  -- Debe ser ≥1
```

---

## C2 — TESTS DE VERTICAL-ISOLATION SON STUBS

### Gravedad: 🔴 CRÍTICA

Si tests pasan sin verificar nada, los bugs de mezclado de datos llegan a producción sin detección.

### El problema

**Archivo:** `tests/security/vertical-isolation.test.ts`

```typescript
describe('Vertical isolation', () => {
  it('dealersQuery should filter by vertical', () => {
    expect(true).toBe(true) // ❌ STUB: no verifica nada
  })
})
```

### Solución: Sesión 47B — Tests reales

**Reescribir completamente:** `tests/security/vertical-isolation.test.ts`

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createClient } from '@supabase/supabase-js'

// Mock de Supabase (sin conectar a BD real)
const mockSupabaseClient = {
  from: (table: string) => ({
    select: () => ({
      eq: (field: string, value: string) => ({
        data: mockData[table]?.filter((row) => row[field] === value) || [],
        error: null,
      }),
    }),
  }),
}

const mockData = {
  vehicles: [
    { id: 1, vertical: 'tracciona', brand: 'Mercedes' },
    { id: 2, vertical: 'tracciona', brand: 'Volvo' },
    { id: 3, vertical: 'horecaria', brand: 'Horno' },
    { id: 4, vertical: 'campoindustrial', brand: 'Tractor' },
  ],
  dealers: [
    { id: 1, vertical: 'tracciona', name: 'Dealer A' },
    { id: 2, vertical: 'horecaria', name: 'Dealer B' },
  ],
  categories: [
    { id: 1, vertical: 'tracciona', name: 'Cisternas' },
    { id: 2, vertical: 'horecaria', name: 'Hornos' },
  ],
}

describe('Vertical isolation', () => {
  describe('vehiclesQuery isolation', () => {
    it('vehiclesQuery(tracciona) should return ONLY tracciona vehicles', async () => {
      const { data } = vehiclesQuery('tracciona')
      const allTracciona = data.every((v) => v.vertical === 'tracciona')
      const hasHorecaria = data.some((v) => v.vertical === 'horecaria')

      expect(allTracciona).toBe(true)
      expect(hasHorecaria).toBe(false)
    })

    it('vehiclesQuery(tracciona) should NOT return horecaria data', async () => {
      const { data } = vehiclesQuery('tracciona')
      expect(data.length).toBe(2) // Solo 2 vehículos de Tracciona
    })

    it('vehiclesQuery(horecaria) should NOT return tracciona data', async () => {
      const { data } = vehiclesQuery('horecaria')
      const hasTracciona = data.some((v) => v.vertical === 'tracciona')
      expect(hasTracciona).toBe(false)
    })
  })

  describe('dealersQuery isolation', () => {
    it('dealersQuery(tracciona) should return ONLY tracciona dealers', async () => {
      const { data } = dealersQuery('tracciona')
      const allTracciona = data.every((d) => d.vertical === 'tracciona')
      expect(allTracciona).toBe(true)
    })
  })

  describe('categoriesQuery isolation', () => {
    it('categoriesQuery(tracciona) should filter by vertical', async () => {
      const { data } = categoriesQuery('tracciona')
      const hasHorecaria = data.some((c) => c.vertical === 'horecaria')
      expect(hasHorecaria).toBe(false)
    })
  })

  describe('RLS policies enforcement', () => {
    it('vertical-context middleware should set correct vertical', () => {
      // Si el middleware detecta vertical desde env var,
      // verifica que lo inyecta en Supabase client
      const vertical = extractVerticalFromEnv('VERTICAL=tracciona')
      expect(vertical).toBe('tracciona')
    })
  })
})
```

### Timeline

- **Dev time:** 1 hora (escribir tests reales con mocks)
- **Testing:** 30 minutos (ejecutar, verificar cobertura)
- **Total:** 1.5 horas
- **Blocker:** SÍ, debe ejecutar en CI

### Verificación

```bash
npm run test -- vertical-isolation.test.ts --reporter=verbose
# Output debe mostrar ✓ para cada test, no stubs
```

---

## C3 — MARCA TRACCIONA SIN REGISTRAR EN OEPM

### Gravedad: 🔴 CRÍTICA (pero diferente)

Sin registro de marca, competidor puede registrarla. Post-lanzamiento es más caro/complejo reconquistar.

### El problema

- Nombre de dominio ≠ Marca registrada
- Tracciona.com es tuyo, pero "Tracciona™" como marca no está reservada
- Alguien más podría registrarla en OEPM y bloquear tu uso comercial

### Solución: Registrar en OEPM

**Dónde:** OEPM.es (Oficina Española de Patentes y Marcas)

**Proceso:**

1. Crear cuenta en oepm.es
2. Solicitud de registro de marca
3. Clase: 35 (servicios administrativos, marketplace)
4. Costo: ~150€ (aprox)
5. Timeline: 2-3 meses (proceso administrativo)

**Importante:** ⚠️ Iniciar AHORA paralelamente a desarrollo

**Quién:** Fundador ops (Spain)

**Prioridad:** MÁXIMA (antes de lanzamiento público si es posible)

### Opcionales

- Registrar también en EUIPO (Unión Europea): ~850€, cubre 27 países
- Registrar dominios defensivos: .es, .eu, .co.uk, .fr

---

## C4 — LEGAL: ToS, PRIVACIDAD, DSA INCOMPLETOS

### Gravedad: 🔴 CRÍTICA (compliance regulatorio)

Sin estas páginas, vulnera DSA (Digital Services Act) que es obligatorio UE desde 2024.

### El problema

| Página          | Estado | Impacto                                               |
| --------------- | ------ | ----------------------------------------------------- |
| /legal          | Falta  | DSA: no hay punto de contacto                         |
| /privacidad     | Falta  | GDPR: sin política de privacidad                      |
| /cookies        | Existe | CookieBanner funciona, pero puede mejorar             |
| /condiciones    | Falta  | ToS servicios específicos (subastas, verificación)    |
| /reportar-abuso | Falta  | DSA: no hay formulario para reportar contenido ilegal |

### Solución: Sesión 54 (parte)

**Crear 4 páginas nuevas:**

#### 1. `/legal` (Términos generales + Punto de contacto DSA)

```markdown
# Términos y condiciones de Tracciona

## Punto de contacto (DSA Art. 13)

[Nombre, email, teléfono]

## Intermediación

Tracciona actúa como intermediaria entre compradores y vendedores.
No somos responsables de...

## Responsabilidad limitada

...

## Modificaciones

Nos reservamos el derecho de modificar estos términos...

## Ley aplicable

España (Ley 34/1988 de publicidad)
```

#### 2. `/privacidad` (GDPR completo)

```markdown
# Política de privacidad — Tracciona

## Responsable del tratamiento

[Datos de TradeBase SL]

## Datos que recopilamos

- Email, teléfono, localización
- Datos de actividad (búsquedas, favoritos)
- Datos de pago (intermediado por Stripe)

## Derechos del usuario (GDPR Art. 12-22)

- Derecho de acceso (puedo descargar mis datos)
- Rectificación (puedo corregir datos incorrectos)
- Supresión (derecho al olvido)
- Limitación del tratamiento
- Portabilidad
- Oposición
- Decisiones automatizadas

## Base legal del tratamiento

- Contrato (usuario usa la plataforma)
- Interés legítimo (prevenir fraude)
- Cumplimiento legal (DSA, IVA)
- Consentimiento (para marketing)

## Cookies y tracking

Usamos cookies para:

- Sesión del usuario (necesarias)
- Preferencias idioma (necesarias)
- Analytics Google (consentimiento)

## Retención de datos

- Usuarios activos: mientras cuente activa
- Usuarios inactivos 2 años: eliminados o anonimizados
- Facturas: 6 años (ley fiscal)

## Cómo ejercer derechos

Email: privacy@tracciona.com
Formulario: /privacidad/solicitud

## DPO

[Si está designado, datos de contacto]
```

#### 3. `/condiciones` (ToS específicos por servicio)

```markdown
# Condiciones de uso por servicio — Tracciona

## Publicación de vehículos

### Tu responsabilidad

- Los datos del vehículo son precisos
- Las fotos reflejan el estado real
- Tienes derecho a vender el vehículo

### Nuestro papel

- Intermediarios, no compradores
- No verificamos datos (salvo niveles pagos)

### Suspensión

Nos reservamos derecho de suspender listado si:

- Fotos falsas/engañosas
- Spam o contenido ilegal
- Pricing sospechoso

## Subastas

### Obligaciones tuyas

- Depósito requerido para participar
- Acepta términos específicos de subasta
- Si ganas, tienes X días para pagar

### Buyer premium

Se aplica 8% comisión sobre pujas

## Verificación de vehículos

### Garantías

- Nivel ✓: análisis documental, sin garantía legal
- Nivel ✓✓: informe DGT, sin responsabilidad Tracciona
- Nivel ✓✓✓: validación legal, solo información
- Nivel ★: inspección tercero (perito independiente)
- Nivel 🛡: Garantía Tracciona (con partner asegurador)

## Servicios conectados

### Transporte (IberHaul)

- Precios estimados, no vinculantes
- Transportista confirma precio real
- Responsabilidad transportista, no Tracciona

### Trámites (gestoría)

- Gestoría responsable de trámites
- Tracciona solo conecta, no ejecuta

---

## Reportar abuso (DSA)

Si ves contenido ilegal, hazlo aquí.
```

#### 4. `/reportar-abuso` (Formulario DSA)

```html
<form>
  <label
    >Tipo de abuso:
    <select>
      <option>Vehículo robado</option>
      <option>Fraude / estafa</option>
      <option>Contenido sexual explícito</option>
      <option>Datos personales publicados sin consentimiento</option>
      <option>Otra violación legal</option>
    </select>
  </label>

  <label
    >URL del anuncio:
    <input type="url" required />
  </label>

  <label
    >Descripción:
    <textarea required></textarea>
  </label>

  <label
    >Contacto (si quieres seguimiento):
    <input type="email" />
  </label>

  <button type="submit">Enviar reporte</button>
</form>

<!-- Backend: INSERT en tabla reports -->
```

### Timeline

- **Crear páginas:** 2 horas (Claude Max puede generar draft)
- **Review legal:** 1-2 horas (asesor fiscal)
- **Integrar en frontend:** 1 hora (routing, navbar)
- **Testing:** 30 minutos
- **Total:** 4-5 horas

### Verificación

```bash
# Verificar que existen:
curl https://localhost/legal  # 200 OK
curl https://localhost/privacidad  # 200 OK
curl https://localhost/condiciones  # 200 OK
curl https://localhost/reportar-abuso  # 200 OK + formulario funciona

# Verificar contenido:
grep -l "punto de contacto" public/pages/legal.vue  # DSA
grep -l "derecho al olvido" public/pages/privacidad.vue  # GDPR
```

---

## C5 — DESALINEACIÓN DOCS VS CÓDIGO: 12 GAPS SIN VERIFICAR

### Gravedad: 🟠 ALTA

Documentación detalla 12 funcionalidades (balance, chat, maintenance, etc.), pero ¿están en código?

### El problema

**Sesión 12 auditoría identificó:**

1. **Tablas legacy:** balance, chat_messages, maintenance_records, rental_records, advertisements, demands, filter_definitions
2. **Rutas admin faltantes:** agenda→CRM, cartera→pipeline, comentarios, histórico, productos, utilidades
3. **Composables existentes:** useGoogleDrive, useSeoScore, useUserChat, useFavorites, useAdminHistórico
4. **Utils reutilizables:** generatePdf, fileNaming, geoData, fuzzyMatch
5. **Flujos complejos:** intermediación + comisión, transacciones alquiler/venta, exportaciones avanzadas

**Pregunta:** ¿Están en el código actual o solo en documentación?

### Solución: Ejecutar script de estado real

**Crear/ejecutar:** `scripts/generate-estado-real.sh`

```bash
#!/bin/bash

# Genera ESTADO-REAL-PRODUCTO.md basado en código actual

echo "=== AUDITORÍA DE CÓDIGO ACTUAL ===" > ESTADO-REAL-PRODUCTO.md

# 1. Contar endpoints
echo "## Endpoints API" >> ESTADO-REAL-PRODUCTO.md
find server/api -name "*.ts" | wc -l >> ESTADO-REAL-PRODUCTO.md

# 2. Contar componentes
echo "## Componentes" >> ESTADO-REAL-PRODUCTO.md
find components -name "*.vue" | wc -l >> ESTADO-REAL-PRODUCTO.md

# 3. Contar composables
echo "## Composables" >> ESTADO-REAL-PRODUCTO.md
find composables -name "use*.ts" | wc -l >> ESTADO-REAL-PRODUCTO.md

# 4. Listar tablas Supabase (teórico, requiere BD conectada)
echo "## Tablas en BD (desde migraciones)" >> ESTADO-REAL-PRODUCTO.md
ls supabase/migrations | grep "CREATE TABLE" | wc -l >> ESTADO-REAL-PRODUCTO.md

# 5. Verificar que las 12 funcionalidades existen
echo "## Funcionalidades verificadas" >> ESTADO-REAL-PRODUCTO.md

for feature in "balance" "chat_messages" "maintenance" "rental" "advertisements" "demands" "filter_definitions"; do
  if grep -r "$feature" components/ pages/ server/ > /dev/null 2>&1; then
    echo "✅ $feature: ENCONTRADO" >> ESTADO-REAL-PRODUCTO.md
  else
    echo "❌ $feature: NO ENCONTRADO" >> ESTADO-REAL-PRODUCTO.md
  fi
done

# 6. Comparar con documentación
echo "## Discrepancias doc-código" >> ESTADO-REAL-PRODUCTO.md
# (comparación manual luego)
```

**Ejecutar:**

```bash
cd /ruta/proyecto
bash scripts/generate-estado-real.sh

# Output:
# ✅ balance: ENCONTRADO
# ❌ chat_messages: NO ENCONTRADO  ← GAP
# ✅ maintenance: ENCONTRADO
# ...
```

**Basado en output:**

- ✅ Si "ENCONTRADO" → funcionalidad existe, docs correctos
- ❌ Si "NO ENCONTRADO" → GAP. Dos opciones:
  1. Implementar ahora (sesión correspondiente)
  2. Marcar en docs como "pospuesto a fase 2" (honesto)

### Timeline

- **Crear script:** 30 minutos
- **Ejecutar:** 5 minutos
- **Analizar output:** 1-2 horas (manualmente)
- **Actuar según gaps:** Variable (crear issues, reprogramar sesiones)
- **Total:** 2-3 horas

### Verificación

```bash
# Después de ejecutar script:
wc -l ESTADO-REAL-PRODUCTO.md  # Debe ser >100 líneas con detalle

# Comparar con docs:
grep "balance" INSTRUCCIONES-MAESTRAS.md  # En qué sesión se menciona
grep "balance" ESTADO-REAL-PRODUCTO.md  # ¿Está implementado?
```

---

## RESUMEN DE 5 HALLAZGOS — TIMELINE TOTAL

| C # | Hallazgo                     | Sesión     | Dev time        | Timeline         |
| --- | ---------------------------- | ---------- | --------------- | ---------------- |
| C1  | Columna `vertical` faltante  | 47A        | 1h              | Semana 1         |
| C2  | Tests stubs                  | 47B        | 1.5h            | Semana 1         |
| C3  | Marca sin registrar          | Manual     | 15min admin     | AHORA (paralelo) |
| C4  | Legal/compliance             | 54 (parte) | 4-5h            | Semana 2         |
| C5  | Verificar 12 funcionalidades | 47 (parte) | 2-3h            | Semana 1         |
| —   | **TOTAL CRÍTICO**            | —          | **~10-12h dev** | **2-3 semanas**  |

---

## CÓMO EJECUTAR EN PARALELO

**Timeline paralela (Dev + Ops):**

```
SEMANA 1 (Dev trabajando en C1-C2-C5, Ops en C3)
  Lunes: C1 migración + C5 script
  Martes: C2 tests
  Miércoles-Viernes: Testing, verificación
  PARALELO (Ops): Registrar marca OEPM

SEMANA 2 (Dev en C4, Ops en paralelo)
  Lunes-Viernes: Crear páginas legales, review
  PARALELO (Ops): Seguimiento OEPM, validar con asesor fiscal

SEMANA 3 (Integración final)
  Testing end-to-end
  Verificación compliance
  ✅ LISTO PARA PRODUCCIÓN
```

---

## CHECKLIST PRE-LANZAMIENTO

```
C1 — Columna vertical
  [ ] Migración 00063 creada y probada
  [ ] vehiclesQuery() filtra por vertical
  [ ] índices creados
  [ ] RLS policy activa
  [ ] Test pasa: vehiclesQuery('tracciona') NO devuelve horecaria

C2 — Tests vertical-isolation
  [ ] Archivo reescrito sin stubs
  [ ] Tests usan mocks Supabase
  [ ] Todos los tests pasan
  [ ] CI ejecuta automáticamente

C3 — Marca Tracciona
  [ ] Solicitud presentada en OEPM
  [ ] Pago realizado (~150€)
  [ ] Confirmación de recepción recibida

C4 — Legal pages
  [ ] /legal creado con punto de contacto DSA
  [ ] /privacidad con derechos GDPR completos
  [ ] /condiciones con ToS servicios
  [ ] /reportar-abuso con formulario funcional
  [ ] Asesor fiscal ha revisado (sin cambios obligatorios)

C5 — Verificar código
  [ ] Script generate-estado-real.sh ejecutado
  [ ] Discrepancias doc-código identificadas
  [ ] Gaps documentados o implementados

GENERAL
  [ ] npm run build sin errores
  [ ] npm run typecheck sin errores
  [ ] npm run test pasa (incluyendo security tests)
  [ ] npm run lint pasa
  [ ] E2E tests (8 journeys) ejecutan sin fallos críticos
```

---

## ESCALADA SI ALGO FALLA

| Situación                           | Acción                                         | Responsable |
| ----------------------------------- | ---------------------------------------------- | ----------- |
| Migración 63 rompe datos existentes | Rollback, analizar, intentar de nuevo          | Dev         |
| Tests de vertical-isolation fallan  | Debug con mocks, verificar RLS                 | Dev         |
| OEPM rechaza solicitud              | Contactar con gestoría especializada           | Ops         |
| Asesor fiscal pide cambios en ToS   | Iterar con legal, no bloquea lanzamiento       | Ops         |
| Script encuentra 10+ gaps           | Priorizar por impacto, algunos pueden posponer | Dev         |

---

## PRÓXIMOS PASOS POST-REMEDIACIÓN

Una vez completados los 5 hallazgos:

1. **Sesión 48:** Refactorizar whatsapp/process.post.ts (código > 200 líneas)
2. **Sesiones 61-64:** Implementar SEO quick wins (impacto directo en tracción)
3. **Sesión 52:** Lighthouse CI (monitoreo continuo de performance)
4. **Sesión 55:** Test de restore (resiliencia probada)

---

_Plan detallado de remedios | 25 febrero 2026 | Revisión: 1 marzo 2026_

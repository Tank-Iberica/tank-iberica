## ANEXO G: SISTEMA DE VERIFICACIÓN — "CARFAX" POR VERTICAL

### G.1 Niveles de verificación (transversal a todos los verticales)

| Nivel          | Badge | Qué implica                                               | Coste      | Pagador              |
| -------------- | ----- | --------------------------------------------------------- | ---------- | -------------------- |
| ✓ Verificado   | ✓     | Ficha técnica + foto km/horas + fotos coinciden con datos | 0€         | Nadie                |
| ✓✓ Extendido   | ✓✓    | + Docs condicionales según tipo (ver por vertical)        | 0€         | Nadie                |
| ✓✓✓ Detallado  | ✓✓✓   | + Docs específicos del sector (ver por vertical)          | 0€         | Nadie                |
| ★ Auditado     | ★     | + Informe oficial verificado por tercero                  | 25-50€     | Comprador o vendedor |
| 🛡 Certificado | 🛡    | + Inspección física por profesional                       | 200-500€   | Comprador o vendedor |
| ⭐ Destacado   | ⭐    | Visibilidad preferente (independiente de verificación)    | 30-50€/mes | Vendedor             |

Cada nivel incluye los anteriores. Solo se muestra el badge más alto + ⭐ si aplica.

### G.2 Documentación específica por vertical

**Tracciona (vehículos industriales):**

| Nivel             | Documentos requeridos                                                                                                                                                                 |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ✓ Verificado      | Ficha técnica + foto cuentakilómetros + fotos exteriores coinciden                                                                                                                    |
| ✓✓ Extendido      | + Placa fabricante + permiso de circulación + tarjeta ITV                                                                                                                             |
| ✓✓✓ Detallado     | + Certificado ADR (si aplica) + ATP (si frigorífico) + certificado Exolum (si cisterna hidrocarburos) + prueba estanqueidad (cisternas)                                               |
| ★ Auditado        | + Informe DGT oficial: historial ITVs con km, titulares, cargas, embargos, seguro. Claude analiza coherencia de km y genera score de fiabilidad                                       |
| 🛡 Certificado TI | + Inspección física 30 puntos por mecánico profesional. 25 fotos, checklist estandarizado. Claude genera informe con estado, defectos, estimación reparación, recomendación de compra |

**CampoIndustrial (maquinaria agrícola):**

| Nivel          | Documentos requeridos                                                                                         |
| -------------- | ------------------------------------------------------------------------------------------------------------- |
| ✓ Verificado   | Ficha técnica + foto horómetro + fotos exteriores coinciden                                                   |
| ✓✓ Extendido   | + Placa fabricante + libro de mantenimiento + permiso circulación (si matriculado)                            |
| ✓✓✓ Detallado  | + Certificado ROMA (Registro Oficial de Maquinaria Agrícola) + historial de revisiones del concesionario      |
| ★ Auditado     | + Informe de historial ROMA oficial. Claude analiza coherencia de horas de uso con edad y tipo de explotación |
| 🛡 Certificado | + Inspección física por mecánico agrícola. Comprobación hidráulica, motor, transmisión, implementos           |

**Horecaria (equipamiento hostelería):**

| Nivel          | Documentos requeridos                                                                                                       |
| -------------- | --------------------------------------------------------------------------------------------------------------------------- |
| ✓ Verificado   | Fotos del equipo + placa datos (potencia, modelo, nº serie)                                                                 |
| ✓✓ Extendido   | + Certificado CE + manual de usuario + último parte de mantenimiento                                                        |
| ✓✓✓ Detallado  | + Certificado de instalación de gas (si aplica) + certificado de eficiencia energética (si aplica)                          |
| ★ Auditado     | + Verificación de número de serie con fabricante (para detectar robos/equipos dados de baja)                                |
| 🛡 Certificado | + Inspección física por técnico de hostelería. Prueba de funcionamiento, estado de resistencias/compresor, limpieza interna |

**ReSolar (energía renovable):**

| Nivel          | Documentos requeridos                                                                                                       |
| -------------- | --------------------------------------------------------------------------------------------------------------------------- |
| ✓ Verificado   | Fotos de paneles/inversores + placa datos + nº serie                                                                        |
| ✓✓ Extendido   | + Ficha técnica del fabricante + certificado IEC/UL + flash test (si panel)                                                 |
| ✓✓✓ Detallado  | + Curva IV reciente (paneles) + informe de degradación + certificado de desmontaje (si procede de instalación)              |
| ★ Auditado     | + Verificación de nº serie con fabricante + informe independiente de potencia real vs nominal                               |
| 🛡 Certificado | + Inspección física: termografía infrarroja (detecta células defectuosas), test de aislamiento, medición de producción real |

**Clinistock (equipamiento médico):**

| Nivel          | Documentos requeridos                                                                                                          |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| ✓ Verificado   | Fotos del equipo + placa datos + nº serie                                                                                      |
| ✓✓ Extendido   | + Certificado CE médico + manual de servicio + historial de calibraciones                                                      |
| ✓✓✓ Detallado  | + Última calibración vigente + versión de software actualizada + certificado de descontaminación                               |
| ★ Auditado     | + Verificación con fabricante de estado de garantía/recall + historial de reparaciones oficial                                 |
| 🛡 Certificado | + Inspección por ingeniero biomédico: pruebas de seguridad eléctrica, calibración funcional, verificación de sondas/accesorios |

**BoxPort (contenedores):**

| Nivel          | Documentos requeridos                                                                        |
| -------------- | -------------------------------------------------------------------------------------------- |
| ✓ Verificado   | Fotos exteriores 4 lados + interior + placa CSC                                              |
| ✓✓ Extendido   | + Certificado CSC vigente + informe de condición (IICL)                                      |
| ✓✓✓ Detallado  | + PTI report (para reefer) + certificado de fumigación (si exportación)                      |
| ★ Auditado     | + Inspección IICL por surveyor certificado                                                   |
| 🛡 Certificado | + Inspección física completa: suelo, paredes, techo, puertas, mecanismo cierre, estanqueidad |

**Municipiante (maquinaria municipal):**

| Nivel          | Documentos requeridos                                                                          |
| -------------- | ---------------------------------------------------------------------------------------------- |
| ✓ Verificado   | Ficha técnica + foto horómetro/km + fotos exteriores                                           |
| ✓✓ Extendido   | + Placa fabricante + permiso circulación + tarjeta ITV (si matriculado)                        |
| ✓✓✓ Detallado  | + Historial de mantenimiento municipal + certificado de baja del inventario del ayuntamiento   |
| ★ Auditado     | + Informe DGT (si matriculado) + verificación de procedencia (no robado de inventario público) |
| 🛡 Certificado | + Inspección física por mecánico especializado en vehículos municipales                        |

### G.3 Implementación técnica

**Migración SQL:**

```sql
-- Campo de nivel de verificación en vehicles
ALTER TABLE vehicles ADD COLUMN verification_level VARCHAR DEFAULT 'none';
-- Valores: 'none', 'verified', 'extended', 'detailed', 'audited', 'certified'

-- Tabla de documentos de verificación
CREATE TABLE verification_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  doc_type VARCHAR NOT NULL, -- 'ficha_tecnica', 'placa_fabricante', 'permiso_circulacion', 'itv', 'adr', 'atp', 'exolum', 'estanqueidad', 'dgt_report', 'inspection_report', etc.
  file_url TEXT NOT NULL, -- URL en Cloudinary
  verified_by UUID REFERENCES auth.users(id), -- Admin que verificó
  verified_at TIMESTAMPTZ,
  status VARCHAR DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_verification_docs_vehicle ON verification_documents(vehicle_id);

ALTER TABLE verification_documents ENABLE ROW LEVEL SECURITY;

-- El vendedor puede subir documentos de sus propios vehículos
CREATE POLICY "owner_upload_docs" ON verification_documents FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM vehicles v WHERE v.id = vehicle_id AND v.user_id = auth.uid())
  );

-- Lectura pública de documentos aprobados
CREATE POLICY "public_read_approved_docs" ON verification_documents FOR SELECT
  USING (status = 'approved');

-- Admin gestiona todo
CREATE POLICY "admin_manage_docs" ON verification_documents FOR ALL
  USING (EXISTS (SELECT 1 FROM auth.users au WHERE au.id = auth.uid() AND au.raw_user_meta_data->>'role' = 'admin'));
```

**Lógica de verificación automática:**

```typescript
// Cuando el vendedor sube documentos, el sistema:
// 1. Claude Vision analiza las fotos: extrae datos de placa fabricante, lee km del cuentakilómetros
// 2. Compara datos extraídos con los declarados en el anuncio
// 3. Si coinciden → nivel ✓ automático
// 4. Si hay discrepancia → flag para revisión manual del admin
// 5. Niveles ✓✓ y ✓✓✓ requieren revisión manual (admin verifica documentos subidos)
// 6. ★ Auditado requiere informe externo (DGT, fabricante, etc.)
// 7. 🛡 Certificado requiere inspección física programada
```

### G.4 Impacto en conversión

Los anuncios verificados se venden más rápido, generan más confianza, y alimentan toda la cadena de monetización:

- Más intermediación (el comprador confía y cierra la operación)
- Más inspecciones solicitadas (el sistema muestra "Mejora tu anuncio a 🛡 Certificado")
- Más transportes (la operación se cierra → necesita transporte)
- Más trámites (operación cerrada → necesita gestión documental)
- Más seguros (vehículo comprado → necesita seguro)

### G.5 Integración API DGT para informes ★ Auditado

**Proveedores de datos:**

- **Carvertical** — API REST, cobertura europea, 3-5€/consulta según volumen. Buena cobertura de turismos, limitada en industriales.
- **InfoCar / InfoCoche** — Centrado en España, datos DGT directos. 2-4€/consulta.
- **INTV** — Acceso a datos de ITVs. Más específico.
- **Ganvam** — Asociación de concesionarios, datos de mercado.

**Recomendación:** Empezar con InfoCar o consulta manual en sede electrónica DGT (5 min/informe con certificado digital). Automatizar con API cuando haya >20 informes/mes.

**Datos disponibles por informe:**

- Fecha de primera matriculación y antigüedad
- Número de titulares previos
- Historial de ITVs con resultado Y kilometraje en cada inspección
- Cargas, embargos, reservas de dominio vigentes
- Si es importado o nacional
- Estado administrativo (alta, baja temporal, baja definitiva)
- Seguro vigente (sí/no)

**Server route:**

```typescript
// /server/api/dgt-report.post.ts
export default defineEventHandler(async (event) => {
  const { vehicleId, matricula } = await readBody(event)

  // 1. Verificar que el usuario ha pagado el informe (check en Stripe o tabla payments)
  // 2. Llamar a API del proveedor de datos
  const dgtData = await fetch('https://api.infocar.es/v1/vehicle/' + matricula, {
    headers: { Authorization: 'Bearer ' + process.env.INFOCAR_API_KEY },
  }).then((r) => r.json())

  // 3. Claude analiza coherencia de km
  const kmAnalysis = await analyzeKmReliability(dgtData.itv_history)

  // 4. Generar PDF con branding Tracciona
  const pdfUrl = await generateDgtReportPdf(dgtData, kmAnalysis, vehicleId)

  // 5. Guardar informe en verification_documents
  // 6. Actualizar verification_level del vehículo a 'audited'

  return { reportUrl: pdfUrl, kmScore: kmAnalysis.score }
})
```

### G.6 Score de fiabilidad de km

Badge visual en la ficha del vehículo que muestra la fiabilidad del kilometraje basada en el historial de ITVs.

**Lógica de cálculo:**

```typescript
// Claude analiza la progresión de km en las ITVs:
function analyzeKmReliability(itvHistory: ITVRecord[]): KmAnalysis {
  // 1. Ordenar ITVs por fecha
  // 2. Calcular km/año entre cada inspección
  // 3. Detectar anomalías:
  //    - Km que bajan entre inspecciones → FRAUDE (score 0-20)
  //    - Km que suben demasiado rápido (>150.000 km/año) → SOSPECHOSO (score 30-50)
  //    - Km con progresión lineal consistente → FIABLE (score 80-100)
  //    - Km con variaciones razonables → NORMAL (score 60-80)
  // 4. Generar explicación en texto:
  //    "6 inspecciones ITV entre 2017-2024. Progresión de km consistente:
  //     ~45.000 km/año. Sin anomalías detectadas."

  return {
    score: 92, // 0-100
    label: 'Muy fiable', // Muy fiable / Fiable / Con reservas / Sospechoso / Manipulado
    explanation: '...',
    itvDataPoints: [...], // Para el gráfico
  }
}
```

**Visualización en la ficha:**

```
┌──────────────────────────────────┐
│ 🔍 Fiabilidad del kilometraje    │
│                                  │
│ ████████████████████░░  92/100   │
│ Muy fiable                       │
│                                  │
│ 6 ITVs verificadas (2017-2024)   │
│ Progresión consistente: ~45k/año │
│                                  │
│ [Ver informe completo — 25€]     │
└──────────────────────────────────┘
```

El score se muestra gratuitamente como badge. El informe completo con detalle de cada ITV es de pago.

**Aplicación a otros verticales:**

- **CampoIndustrial:** Score de fiabilidad de horas de motor (mismo concepto, horómetro en vez de km)
- **ReSolar:** Score de degradación de paneles (potencia real vs nominal según edad)
- **Clinistock:** Score de mantenimiento (calibraciones al día, software actualizado)
- Los verticales sin registro centralizado (Horecaria, BoxPort) no pueden tener score automático, usan verificación documental manual

---

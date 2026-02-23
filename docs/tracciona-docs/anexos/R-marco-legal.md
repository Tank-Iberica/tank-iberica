- **Vistaprint API** — Integración directa, precios competitivos, envío incluido
- **Pixartprinting** — Calidad superior, API disponible, popular en España
- **Imprenta local en León** — Menor coste, más margen, menos automatización

**Recomendación:** Empezar con imprenta local (mayor margen, relación directa). Cuando haya >20 pedidos/mes, evaluar integración API con Vistaprint para automatizar.

---

## ANEXO R: MARCO LEGAL Y DISCLAIMERS

### R.1 Disclaimers obligatorios en la plataforma

**En la ficha de cada vehículo con badge de verificación (✓, ✓✓, ✓✓✓):**

```
⚠️ AVISO SOBRE VERIFICACIÓN
La verificación se basa en documentación aportada por el vendedor.
Tracciona no inspecciona físicamente los vehículos ni garantiza su estado.
La verificación confirma que la documentación aportada es coherente
con los datos declarados.
```

**En el footer de todas las páginas (aviso legal resumido):**

```
Tracciona es una plataforma de intermediación que facilita el contacto
entre vendedores y compradores de vehículos industriales. Tracciona no
es parte en las transacciones entre usuarios. Tracciona no inspecciona,
verifica ni garantiza el estado, la legalidad ni la disponibilidad de
los vehículos publicados. Los badges de verificación se basan en
documentación aportada por el vendedor y no constituyen garantía. Los
servicios de transporte, inspección y gestión documental son prestados
por profesionales independientes bajo su propia responsabilidad.
```

**En la página de informes DGT / Km Score:**

```
El Km Score es un indicador estadístico basado en el análisis automático
del historial de inspecciones ITV del vehículo. No constituye garantía
de que los kilómetros actuales sean correctos. El informe refleja datos
obtenidos de fuentes oficiales (DGT/INTV) en la fecha de generación.
Tracciona no se responsabiliza de errores en los datos de origen ni de
cambios posteriores a la fecha del informe.
```

**En subastas:**

```
Los vehículos en subasta se venden "tal cual" (as-is). El comprador es
responsable de verificar el estado del vehículo antes de pujar. El
buyer's premium (8%) no es reembolsable una vez adjudicada la subasta.
La puja constituye un compromiso vinculante de compra.
```

### R.2 Implementación técnica de disclaimers

```vue
<!-- components/DisclaimerBadge.vue -->
<!-- Se muestra automáticamente junto a cada badge de verificación -->
<!-- Tooltip al pasar el ratón / tap en móvil con el texto completo -->

<!-- components/DisclaimerFooter.vue -->
<!-- Se incluye en el footer global del layout -->
<!-- Enlaza a /legal para texto completo -->
```

**Páginas legales obligatorias:**

```
/legal                → Aviso legal completo (datos empresa, CIF, dirección, contacto)
/privacidad           → Política de privacidad
/cookies              → Política de cookies
/condiciones          → Términos y condiciones de uso
/condiciones-subasta  → Términos específicos de subastas
```

### R.3 Setup legal de coste cero

| Trámite                                             | Coste   | Cómo                                                                                                                                                                                                                                                                                                               |
| --------------------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Alta IAE**                                        | 0€      | Online con certificado digital en sede electrónica AEAT. Epígrafe 665.9 (comercio electrónico) o 631.4 (intermediación comercio). Tu asesoría de Tank Ibérica puede añadir el epígrafe sin coste si ya te lleva las cuentas.                                                                                       |
| **Política de privacidad**                          | 0€      | Generador gratuito de la AEPD (agpd.es). Adaptas los textos a tu caso.                                                                                                                                                                                                                                             |
| **Aviso legal**                                     | 0€      | Texto estándar: datos de la empresa (razón social, CIF, dirección, email, teléfono, registro mercantil). Template disponible en cualquier web de abogados.                                                                                                                                                         |
| **Política de cookies**                             | 0€      | Banner con cookieconsent.js (open source) o el banner de Cloudflare (si usas CF Workers). Texto generado con la herramienta de la AEPD.                                                                                                                                                                            |
| **RGPD — Registro de actividades**                  | 0€      | Documento interno. La AEPD tiene herramienta gratuita "Facilita RGPD" que te guía paso a paso y genera el documento. Describe: qué datos recoges (nombre, email, teléfono, CIF de dealers), para qué (contacto, facturación, estadísticas), dónde se almacenan (Supabase, Cloudinary), quién tiene acceso (admin). |
| **DPD (Delegado de Protección de Datos)**           | 0€      | NO obligatorio para pymes que no tratan datos sensibles a gran escala. Con menos de 250 empleados y sin datos de salud/biométricos, no necesitas DPD.                                                                                                                                                              |
| **Constitución SL (si decides crear TradeBase SL)** | ~3.000€ | Capital social mínimo 3.000€ + notaría + registro mercantil. La asesoría te lo gestiona. NO es urgente el primer año — puedes operar bajo Tank Ibérica SL inicialmente.                                                                                                                                            |

### R.4 Responsabilidad civil

**Tracciona como intermediario puro:**
La plataforma facilita el contacto. No es parte en la transacción. Esto es clave para evitar responsabilidad:

- Si un vehículo tiene defectos ocultos → responsabilidad del vendedor, no de Tracciona
- Si un transporte sufre un accidente → responsabilidad de IberHaul/transportista, no de Tracciona
- Si una inspección no detecta un fallo → responsabilidad del mecánico inspector, no de Tracciona

**Para que esto funcione legalmente:**

1. Los disclaimers de R.1 deben estar visibles en cada punto relevante
2. Los términos y condiciones deben ser aceptados por cada usuario al registrarse
3. Los servicios de terceros (transporte, inspección, gestoría) deben tener su propio contrato/factura directa con el cliente
4. Tracciona factura la comisión de intermediación, no el servicio en sí

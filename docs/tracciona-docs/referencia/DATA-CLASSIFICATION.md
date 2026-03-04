# Clasificación de Datos — Tracciona

Marco de clasificación para GDPR compliance y gestión de riesgo.
Complementa el RAT-BORRADOR.md (Registro de Actividades de Tratamiento).

---

## Niveles de clasificación

| Nivel               | Definición                                                   | Ejemplos en Tracciona                                                                                    |
| ------------------- | ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| **🔴 Crítico**      | Datos cuya exposición causa daño directo e irreparable       | Contraseñas (hash), tokens de sesión, claves API, documentos de identidad                                |
| **🟠 Confidencial** | Datos personales o de negocio con protección GDPR estricta   | Email, teléfono, NIF/CIF, datos bancarios (Stripe los gestiona, no nosotros), historial de transacciones |
| **🟡 Interno**      | Datos operativos no públicos, impacto limitado si se exponen | Estadísticas de dealers, precios de venta históricos, logs internos                                      |
| **🟢 Público**      | Datos visibles sin autenticación                             | Listados de vehículos, precios, fotos, contenido editorial                                               |

---

## Inventario de datos por tabla

| Tabla               | Nivel           | Base legal GDPR  | Retención                     | Notas                        |
| ------------------- | --------------- | ---------------- | ----------------------------- | ---------------------------- |
| `auth.users`        | 🔴 Crítico      | Contrato         | Vida cuenta + 5 años          | Gestionado por Supabase Auth |
| `dealers`           | 🟠 Confidencial | Contrato         | Vida cuenta + 7 años (fiscal) | NIF, datos bancarios         |
| `vehicles`          | 🟢 Público      | Interés legítimo | Mientras activo + 2 años      | Listado público              |
| `vehicle_documents` | 🔴 Crítico      | Contrato         | Vida vehículo + 5 años        | Docs identidad, permisos     |
| `conversations`     | 🟠 Confidencial | Contrato         | 2 años tras última actividad  | Mensajes buyer-seller        |
| `subscriptions`     | 🟠 Confidencial | Contrato         | 7 años (fiscal)               | Historial pagos              |
| `audit_logs`        | 🟡 Interno      | Interés legítimo | 1 año                         | Logs de acciones admin       |
| `price_history`     | 🟢 Público      | Interés legítimo | Indefinido (dato de mercado)  | Datos de mercado             |
| `infra_metrics`     | 🟡 Interno      | Interés legítimo | 6 meses                       | Métricas de rendimiento      |

---

## Reglas por nivel

### 🔴 Crítico

- Nunca en logs (ni en dev)
- Nunca en mensajes de error expuestos al cliente
- Cifrado en reposo (Supabase lo gestiona)
- Acceso solo por sistema (no por roles de usuario, ni siquiera admin)
- En código: nunca en `console.log`, nunca en variables con nombre revelador en cliente

### 🟠 Confidencial

- Solo accesible por el titular o admins con justificación
- RLS policies obligatorias en Supabase
- En respuestas API: select explícito (nunca `SELECT *`)
- En logs: solo IDs, nunca valores raw

### 🟡 Interno

- Accesible por roles internos (admin, dealer dueño)
- RLS policies recomendadas
- No exponer en endpoints públicos

### 🟢 Público

- Sin restricciones de acceso
- Validar que no contengan datos de niveles superiores por error

---

## Derechos GDPR — Procedimientos

| Derecho           | Procedimiento                                                                    | SLA       |
| ----------------- | -------------------------------------------------------------------------------- | --------- |
| **Acceso**        | Exportar datos del usuario desde Supabase → email CSV                            | 30 días   |
| **Rectificación** | Update en BD por admin o self-service en perfil                                  | 30 días   |
| **Supresión**     | Soft delete: anonimizar email/teléfono, mantener IDs para integridad referencial | 30 días   |
| **Portabilidad**  | Exportar listados propios como JSON/CSV                                          | 30 días   |
| **Oposición**     | Desactivar alertas de precio, newsletter                                         | Inmediato |

### Script de supresión (borrado GDPR)

```sql
-- Anonimizar usuario (no borrar — integridad referencial)
UPDATE auth.users SET email = 'deleted-' || id || '@tracciona.com' WHERE id = $1;
UPDATE dealers SET
  contact_email = 'deleted-' || id || '@tracciona.com',
  contact_phone = NULL,
  nif = NULL
WHERE user_id = $1;
-- Marcar vehículos como anónimos (mantener datos de mercado)
UPDATE vehicles SET dealer_id = NULL WHERE dealer_id = $dealer_id;
```

---

## Transferencias internacionales

| Servicio       | País                 | Mecanismo legal                                         |
| -------------- | -------------------- | ------------------------------------------------------- |
| Supabase       | EU (Frankfurt)       | GDPR directo                                            |
| Cloudflare     | EU nodes disponibles | SCCs + BCR                                              |
| Stripe         | EU (Dublin)          | SCCs                                                    |
| Cloudinary     | US                   | SCCs                                                    |
| Resend         | US                   | SCCs                                                    |
| Anthropic (AI) | US                   | SCCs — solo metadata de vehículos, sin datos personales |

---

_Última actualización: mar-2026 | Revisar: mar-2027_

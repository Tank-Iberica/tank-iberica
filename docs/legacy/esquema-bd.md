> **DOCUMENTO HISTORICO.** Este documento es referencia del diseno original. La fuente de verdad actual es [`README-PROYECTO.md`](../../README-PROYECTO.md) y [`INSTRUCCIONES-MAESTRAS.md`](../tracciona-docs/INSTRUCCIONES-MAESTRAS.md).

# Tank Iberica — Esquema de Base de Datos (Supabase/PostgreSQL)

Extraído del Plan de Profesionalización v3.
Migración de las 17 hojas de Google Sheets a tablas PostgreSQL relacionales con tipos, índices y restricciones.

---

## 1. Tablas Principales (17 tablas)

| Tabla PostgreSQL       | Columnas Principales                                                                                                                                                                                                           | Origen Sheets                     |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------- |
| **vehicles**           | id (uuid PK), slug (unique), brand, model, year (int), price (numeric), rental_price, category (enum), subcategory_id (FK), location, description_es/en, filters_json (jsonb), status (enum), featured, created_at, updated_at | vehiculos                         |
| **vehicle_images**     | id (uuid PK), vehicle_id (FK CASCADE), cloudinary_public_id, url, thumbnail_url, position (int), alt_text                                                                                                                      | URLs en vehiculos                 |
| **subcategories**      | id (uuid PK), name_es, name_en, slug (unique), applicable_categories (text[]), stock_count, status (enum), sort_order                                                                                                          | subcategorias                     |
| **filter_definitions** | id (uuid PK), subcategory_id (FK), name, type (enum), label_es/en, unit, options (jsonb), is_extra, is_hidden, status, sort_order                                                                                              | filtros                           |
| **users**              | id (uuid PK, = auth.users.id), email (unique), pseudonimo, name, apellidos, avatar_url, provider, role (enum), phone, lang, created_at                                                                                         | usuarios + admins                 |
| **favorites**          | user_id (FK), vehicle_id (FK), created_at — PK compuesta                                                                                                                                                                       | favoritos_usuarios + localStorage |
| **advertisements**     | id (uuid PK), user*id (FK), vehicle_type, brand, model, year, price, location, description, photos, contact*\*, status (enum), created_at                                                                                      | anunciantes                       |
| **demands**            | id (uuid PK), user*id (FK), vehicle_type, year_min/max, price_min/max, specs (jsonb), contact*\*, status (enum), created_at                                                                                                    | solicitantes                      |
| **subscriptions**      | id (uuid PK), email (unique), pref_web, pref_press, pref_newsletter, pref_featured, pref_events, pref_csr, created_at                                                                                                          | subscripciones                    |
| **news**               | id (uuid PK), title_es/en, slug, category (enum), image_url, content_es/en, hashtags, views, status, published_at                                                                                                              | noticias                          |
| **comments**           | id (uuid PK), news_id (FK), user_id (FK), parent_id (FK self-ref), content, status, likes, created_at                                                                                                                          | comentarios                       |
| **chat_messages**      | id (uuid PK), user_id (FK), content, direction (enum), is_read, created_at                                                                                                                                                     | chat                              |
| **config**             | key (text PK), value (jsonb)                                                                                                                                                                                                   | config + tabla_config             |
| **balance**            | id (uuid PK), vehicle_id (FK nullable), concept, amount (numeric), invoice_url, date, type (enum)                                                                                                                              | balance                           |
| **intermediation**     | id (uuid PK), vehicle_id (FK), buyer, seller, commission, status, notes, created_at                                                                                                                                            | intermediacion                    |
| **history_log**        | id (uuid PK), vehicle_id (FK), action (enum), details (jsonb), performed_by (FK), created_at                                                                                                                                   | historico                         |
| **viewed_vehicles**    | id (uuid PK), vehicle_id (FK), viewer_ip (inet), user_id (FK nullable), viewed_at                                                                                                                                              | ojeados                           |

---

## 2. Enums PostgreSQL

```sql
CREATE TYPE vehicle_status AS ENUM ('draft','published','sold','archived');
CREATE TYPE vehicle_category AS ENUM ('alquiler','venta','terceros');
CREATE TYPE user_role AS ENUM ('visitor','user','admin');
CREATE TYPE filter_type AS ENUM ('caja','desplegable','desplegable_tick','tick','slider','calc');
CREATE TYPE msg_direction AS ENUM ('user_to_admin','admin_to_user');
CREATE TYPE balance_type AS ENUM ('income','expense','recurring_income','recurring_expense');
```

---

## 3. Row Level Security (RLS)

| Tabla                    | Operación                     | Política RLS                                     |
| ------------------------ | ----------------------------- | ------------------------------------------------ |
| vehicles                 | SELECT                        | Público: solo status = 'published'. Admin: todos |
| vehicles                 | INSERT/UPDATE/DELETE          | Solo admin (role = 'admin')                      |
| favorites                | SELECT/INSERT/DELETE          | Solo el propio usuario (auth.uid() = user_id)    |
| advertisements           | INSERT                        | Cualquier usuario autenticado                    |
| advertisements           | SELECT                        | Propio usuario: las suyas. Admin: todas          |
| demands                  | INSERT/SELECT                 | Mismo patrón que advertisements                  |
| chat_messages            | SELECT                        | Propio usuario: sus mensajes. Admin: todos       |
| chat_messages            | INSERT                        | Autenticado (dirección user_to_admin)            |
| subscriptions            | INSERT                        | Público (no requiere auth)                       |
| users                    | SELECT/UPDATE (propio)        | Cada usuario solo ve/edita su perfil             |
| balance / intermediation | ALL                           | Solo admin                                       |
| config                   | SELECT público / UPDATE admin | Lectura libre, escritura solo admin              |

---

## 4. Edge Functions

Lógica servidor que no se resuelve solo con RLS:

- Email de bienvenida al registrarse (sustituye `enviarEmailBienvenida()` de AppsScript.gs)
- Email de recuperación de contraseña (sustituye `enviarEmailRecuperacion()` de AppsScript.gs)
- Notificar admin de nuevo anúnciate/solicitante
- Validar y subir fotos a Cloudinary (sustituye `uploadFileToDrive()` de admin.html)
- Generar PDF de folleto del vehículo server-side

---

## 5. Creación de Tablas por Step

| Step   | Tabla              | Razón                                                     |
| ------ | ------------------ | --------------------------------------------------------- |
| Step 1 | users              | Primera tabla. FK en 8 tablas. RLS depende de auth.uid(). |
| Step 2 | vehicles           | Tabla principal del catálogo. Página /vehiculo/[slug].    |
| Step 2 | vehicle_images     | FK CASCADE a vehicles.                                    |
| Step 2 | subcategories      | Dinámicas: añadir desde admin sin código.                 |
| Step 2 | filter_definitions | 6 tipos de filtro. Añadir desde admin sin código.         |
| Step 2 | config             | Banner, ajustes. Key-value JSONB.                         |
| Step 3 | favorites          | Requiere auth + vehicles.                                 |
| Step 3 | advertisements     | Primer INSERT de usuario. RLS escritura.                  |
| Step 3 | demands            | Misma lógica que advertisements.                          |
| Step 3 | subscriptions      | INSERT público sin auth.                                  |
| Step 4 | news               | Página real: /noticias/[slug].                            |
| Step 4 | comments           | Hilos anidados (self-ref parent_id).                      |
| Step 4 | chat_messages      | Supabase Realtime.                                        |
| Step 5 | balance            | Solo admin.                                               |
| Step 5 | intermediation     | Solo admin.                                               |
| Step 5 | history_log        | Solo admin. Audit log.                                    |
| Step 5 | viewed_vehicles    | Solo admin. Ojeados.                                      |

---

## 6. API Autogenerada (PostgREST)

Supabase genera automáticamente una API REST para cada tabla. Esto reemplaza tanto `readSheetData()` (usado en 4 archivos) como los 2 Apps Scripts completos.

```javascript
// Ejemplo: Listar vehículos publicados con filtros y paginación
const { data } = await supabase
  .from('vehicles')
  .select('*, vehicle_images(*), subcategories(name_es,name_en)')
  .eq('status', 'published')
  .gte('price', 10000)
  .lte('price', 50000)
  .order('created_at', { ascending: false })
  .range(0, 19)
```

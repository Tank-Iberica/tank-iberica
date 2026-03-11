# Guía de Microcopy — Tracciona / TradeBase

> **Versión:** 1.0 — Marzo 2026
> **Aplica a:** todos los textos UI en `i18n/es.json`, `i18n/en.json` y futuros idiomas.
> **Objetivo:** Consistencia total en tono, fórmulas y patrones. Escalable a N verticales e idiomas.

---

## 1. Voz y tono

### 1.1 Personalidad de marca

| Atributo | Definición |
|---|---|
| **Profesional** | Sector industrial B2B — no somos una app de moda |
| **Cercano** | Pero no frío. Hablamos como un compañero experto del sector |
| **Confiable** | Cada palabra transmite seguridad. Nunca ambigüedad |
| **Directo** | Sin relleno. Cada palabra tiene propósito |

### 1.2 Registro de formalidad

| Idioma | Registro | Ejemplo |
|---|---|---|
| **ES** | **Tuteo informal** ("tú") | "Tu vehículo se ha publicado" |
| **EN** | **Informal directo** ("you") | "Your vehicle has been published" |

**Valoración comercial/psicológica:**

- **Actual (ES):** Tuteo en la mayoría, pero **hay restos de "usted"** en secciones como `advertise` y `demand` ("Describa su vehículo"). Esto genera **inconsistencia cognitiva** — el usuario siente que habla con dos personas distintas.
- **Recomendación:** **Tuteo 100%** en toda la plataforma. Razón: el sector de vehículos industriales en España/Latam usa tuteo natural entre profesionales del transporte. "Usted" crea distancia innecesaria y reduce conversión en formularios (estudio Nielsen Norman: formularios informales +12% completion rate). **Excepción única:** textos legales (`legal.*`, `gdpr.*`) donde el registro formal es expectativa legal.
- **EN:** Sin cambios. El inglés no tiene esta distinción.

> **Patrón actual a corregir:** Buscar todas las instancias de "su", "usted", "describa", "indique" en `es.json` y convertir a tuteo.

---

## 2. CTAs (Call to Action)

### 2.1 Forma verbal

| Idioma | Forma | Ejemplo |
|---|---|---|
| **ES** | **Infinitivo** | "Guardar", "Enviar", "Eliminar" |
| **EN** | **Imperativo** | "Save", "Send", "Delete" |

**Valoración comercial/psicológica:**

- **Infinitivo (actual ES):** Es el estándar de facto en software español (Google, Apple, Microsoft lo usan). **Neutral, profesional, sin ambigüedad.** No genera resistencia.
- **Alternativa — Imperativo tú:** "Guarda", "Envía", "Elimina" → más personal pero puede sonar **mandón** en un contexto B2B. Menos común en software español.
- **Alternativa — Primera persona:** "Quiero guardar", "Enviar mi anuncio" → **mayor conversión en CTAs de alto valor** (estudio Unbounce: +90% en botones de conversión). Pero inadecuado para acciones comunes (no vas a poner "Quiero cerrar modal").
- **Recomendación final:**
  - **Acciones comunes** (guardar, cancelar, cerrar, editar): **Infinitivo** (actual). Es correcto.
  - **CTAs de conversión** (publicar anuncio, suscribirse, solicitar): **Primera persona**. Ejemplo: "Publicar mi vehículo" → "Publicar mi anuncio" en vez de solo "Enviar".
  - **CTAs de compra/pago**: **Primera persona + beneficio**. Ejemplo: "Activar mi plan Pro" en vez de "Suscribirse".

### 2.2 Longitud de CTAs

| Tipo | Máximo | Ejemplo bueno | Ejemplo malo |
|---|---|---|---|
| **Botón primario** | 3 palabras | "Publicar anuncio" | "Enviar formulario de publicación de vehículo" |
| **Botón secundario** | 4 palabras | "Guardar como borrador" | "Guardar" (ambiguo si hay 2 acciones) |
| **Link de acción** | 5 palabras | "Ver todos los vehículos" | "Haz clic aquí para ver el catálogo completo" |

**Valoración:** Los CTAs actuales son generalmente buenos en longitud. Problema detectado: algunos CTAs usan solo un verbo genérico ("Enviar", "Guardar") cuando hay múltiples acciones posibles en la misma vista. **Añadir contexto al verbo** cuando haya ambigüedad: "Guardar cambios" vs "Guardar borrador".

### 2.3 CTAs de conversión alta (monetización)

Estos son los CTAs más importantes comercialmente. Cada palabra cuenta.

| Actual | Recomendado | Razón psicológica |
|---|---|---|
| "Suscribirse" | "Activar mi plan" | Primera persona + sensación de control |
| "Enviar" (formulario anuncio) | "Publicar mi vehículo" | Resultado visible, no el proceso |
| "Comprar" | "Obtener acceso" | Reduce dolor de pago |
| "Solicitar transporte" | "Calcular mi envío" | Primer paso sin compromiso |
| "Contactar" | "Enviar mensaje" | Acción concreta > abstracta |
| "Go Pro — 29€/mo" | "Probar Pro — 29€/mes" | "Probar" reduce barrera vs "ir a" |
| "72h Pass — 9.99€" | "Ver ahora — 9,99€" | Beneficio inmediato |

### 2.4 Parejas de botones (confirmar/cancelar)

| Contexto | Primario | Secundario |
|---|---|---|
| **Guardar formulario** | "Guardar cambios" | "Descartar" |
| **Eliminar** | "Eliminar" (rojo) | "Cancelar" |
| **Confirmar acción** | "[Verbo específico]" | "Volver" |
| **Modal informativo** | "Entendido" | — |

**Valoración:** Actualmente se usa "Cancelar" como secundario en casi todos los modales. Esto es correcto para modales de acción, pero en modales de confirmación destructiva, **"Volver"** es mejor que "Cancelar" porque refuerza la idea de que la acción destructiva es la que se cancela, no el proceso.

---

## 3. Mensajes de error

### 3.1 Fórmula

```
[Qué pasó — sin culpar al usuario]. [Qué puede hacer para resolverlo].
```

**Valoración comercial/psicológica:**

- **Actual:** La fórmula base es correcta. Ejemplo bueno existente: `"Demasiadas solicitudes. Inténtalo de nuevo en unos minutos."` — describe qué pasó + ofrece solución.
- **Problema detectado:** Algunos errores **no incluyen la segunda parte** (solución). Ejemplo: `"Error al cargar suscripciones"` → ¿Qué hago? ¿Recargo? ¿Contacto soporte?
- **Recomendación:** TODOS los errores deben incluir acción. Sin excepción. Si no hay acción posible → "Estamos trabajando en ello."

### 3.2 Patrón por tipo de error

| Tipo | Patrón ES | Patrón EN | Ejemplo |
|---|---|---|---|
| **Validación** | "Introduce [qué falta]" | "Enter [what's missing]" | "Introduce un email válido" / "Enter a valid email" |
| **Servidor** | "No hemos podido [acción]. Inténtalo de nuevo." | "We couldn't [action]. Please try again." | "No hemos podido guardar. Inténtalo de nuevo." |
| **Rate limit** | "[Acción] temporalmente limitada. Inténtalo en [tiempo]." | "[Action] temporarily limited. Try again in [time]." | "Envío temporalmente limitado. Inténtalo en 5 minutos." |
| **No encontrado** | "[Recurso] no disponible." | "[Resource] not available." | "Este vehículo ya no está disponible." |
| **Permisos** | "Necesitas [permiso] para [acción]." | "You need [permission] to [action]." | "Necesitas una cuenta de dealer para publicar." |
| **Red/offline** | "Sin conexión. Se guardará cuando vuelvas a conectar." | "Offline. Changes will be saved when you reconnect." | — |

**Clave psicológica:** **Nunca culpar al usuario.** "Introduce un email válido" es mejor que "Email inválido" o "Error en el campo email". El primero guía, los otros dos acusan.

### 3.3 Tono de errores

| Hacer | No hacer |
|---|---|
| "No hemos podido cargar los datos" | "Error 500" |
| "Este campo es obligatorio" | "Campo requerido" (demasiado técnico) |
| "La contraseña necesita al menos 8 caracteres" | "Contraseña inválida" |
| "No hemos encontrado resultados para tu búsqueda" | "Sin resultados" (frío) |
| "Algo ha ido mal. Inténtalo de nuevo." | "Error inesperado" |

**Valoración del estado actual:**
- Errores de validación: Generalmente bien. Zod + vee-validate generan mensajes claros.
- Errores de API: **Inconsistentes.** Algunos dicen "Error al [acción]" (correcto) y otros solo "Error" (insuficiente).
- Empty states: **Bien** — "No hay vehículos que coincidan" es mejor que "Sin resultados".

---

## 4. Mensajes de éxito

### 4.1 Fórmula

```
[Acción completada] + [Qué ocurre ahora / siguiente paso] (opcional).
```

### 4.2 Patrones

| Tipo | Patrón ES | Patrón EN |
|---|---|---|
| **CRUD exitoso** | "[Recurso] [participio] correctamente" | "[Resource] [past participle] successfully" |
| **Envío formulario** | "¡[Recurso] enviado! [Qué sigue]" | "[Resource] submitted! [What's next]" |
| **Conversión** | "¡Bienvenido a [plan]! [Beneficio inmediato]" | "Welcome to [plan]! [Immediate benefit]" |

**Valoración comercial/psicológica:**

- **Actual:** Inconsistente. Algunos usan `"correctamente"`, otros `"con éxito"`, otros sin adverbio. Algunos con `¡!`, otros sin.
- **Recomendación:**
  - **Acciones rutinarias** (guardar, editar): Sin exclamación, tono neutro. `"Cambios guardados"` — no celebres cada guardado.
  - **Acciones de valor** (publicar, suscribirse, primera venta): Con exclamación + siguiente paso. `"¡Vehículo publicado! Ya es visible en el catálogo."`
  - **Hitos del usuario** (primer vehículo, primer lead): Celebración breve + refuerzo. `"¡Tu primer vehículo está en línea! Compartirlo en redes aumenta un 3x las visitas."`
  - **Adverbio estándar:** Usar `"correctamente"` siempre (no `"con éxito"`, `"exitosamente"`, `"satisfactoriamente"`).

### 4.3 Duración de toasts

| Tipo | Duración | Auto-cierre |
|---|---|---|
| **Éxito rutinario** | 3s | Sí |
| **Éxito con info** | 5s | Sí |
| **Error** | 0 (manual) | No — el usuario cierra |
| **Warning** | 5s | Sí |

---

## 5. Estados de carga (loading)

### 5.1 Fórmula

```
[Gerundio]...
```

| ES | EN |
|---|---|
| "Guardando..." | "Saving..." |
| "Enviando..." | "Sending..." |
| "Cargando..." | "Loading..." |
| "Eliminando..." | "Deleting..." |
| "Exportando..." | "Exporting..." |
| "Generando..." | "Generating..." |
| "Creando..." | "Creating..." |

**Valoración:**
- **Actual:** Correcto y consistente. El gerundio + puntos suspensivos es el estándar universal.
- **Mejora para operaciones largas (>3s):** Añadir contexto. `"Generando informe... Esto puede tardar unos segundos."` En vez de solo `"Generando..."` durante 10 segundos de silencio.
- **Mejora para uploads:** Mostrar progreso. `"Subiendo foto 3 de 7..."` es mucho mejor que `"Subiendo..."`.

### 5.2 Skeleton vs spinner

| Caso | Usar |
|---|---|
| **Contenido con layout conocido** | Skeleton (placeholder con forma) |
| **Acción puntual (botón)** | Spinner en el botón + texto loading |
| **Página completa** | Skeleton de la página |
| **Lista/tabla** | Skeleton de 3 filas |

---

## 6. Empty states (estados vacíos)

### 6.1 Fórmula

```
[Descripción amigable]. [CTA para resolver].
```

**Valoración comercial/psicológica:**

- **Actual:** Mixto. Algunos empty states son solo `"No hay resultados"` (frío, sin guía). Otros son buenos: `"No tienes favoritos aún"` (el "aún" implica que habrá).
- **Recomendación:**
  - **Siempre incluir un CTA.** Un empty state sin acción es un callejón sin salida.
  - **Usar "aún" / "yet"** cuando el estado es temporal: `"No tienes vehículos publicados aún"`.
  - **Tono:** Optimista, no acusatorio. `"Tu bandeja de entrada está vacía"` > `"No hay mensajes"`.

### 6.2 Patrones por contexto

| Contexto | Mensaje ES | CTA |
|---|---|---|
| **Lista vacía (propia)** | "Aún no tienes [recursos]" | "Crear [primer recurso]" / "Explorar [catálogo]" |
| **Búsqueda sin resultados** | "No encontramos [recursos] con esos filtros" | "Ampliar búsqueda" / "Ver todos" |
| **Favoritos vacíos** | "Guarda vehículos que te interesen para compararlos después" | "Explorar catálogo" |
| **Dashboard vacío** | "Publica tu primer vehículo para ver estadísticas aquí" | "Publicar vehículo" |
| **Historial vacío** | "Aquí verás el historial de [acciones]" | — (informativo) |

---

## 7. Placeholders

### 7.1 Reglas

| Regla | Ejemplo bueno | Ejemplo malo |
|---|---|---|
| **Usar ejemplos realistas** | `placeholder="ej: Renault T480"` | `placeholder="Escribe aquí"` |
| **Formato esperado** | `placeholder="+34 600 000 000"` | `placeholder="Teléfono"` |
| **No repetir el label** | Label: "Email" → `placeholder="tu@empresa.com"` | Label: "Email" → `placeholder="Introduce tu email"` |
| **Inputs de búsqueda** | `placeholder="Buscar por marca o modelo..."` | `placeholder="Buscar"` |
| **Textarea** | `placeholder="Describe el estado, extras, historial..."` | `placeholder="Descripción"` |

**Valoración:**
- **Actual:** Bueno en general. Los placeholders usan ejemplos realistas del sector (`"B12345678"` para CIF, `"Renault, Iveco, MAN..."` para marcas).
- **Problema:** Algunos placeholders repiten el label (`"Seleccionar vehiculo..."` cuando el label ya dice "Vehículo"). Eliminar redundancia.
- **Psicología:** Un buen placeholder **reduce ansiedad de formulario**. El usuario ve exactamente qué formato se espera. Los puntos suspensivos (`...`) en búsquedas invitan a escribir.

### 7.2 Prefijos de placeholder por tipo

| Tipo de input | Prefijo ES | Prefijo EN |
|---|---|---|
| **Búsqueda** | "Buscar [qué]..." | "Search [what]..." |
| **Texto libre** | "ej: [ejemplo realista]" | "e.g. [realistic example]" |
| **Selección** | "Seleccionar [qué]" | "Select [what]" |
| **Numérico** | Formato: "0.000,00 €" | Format: "0,000.00 €" |
| **Fecha** | "DD/MM/AAAA" | "DD/MM/YYYY" |

---

## 8. Confirmaciones destructivas

### 8.1 Regla de oro

> **A mayor impacto, mayor fricción de confirmación.**

| Nivel | Impacto | Confirmación |
|---|---|---|
| **Bajo** | Borrar un filtro, quitar de favoritos | Sin confirmación (undo disponible) |
| **Medio** | Borrar borrador, cancelar edición | Modal simple con "¿Seguro?" |
| **Alto** | Eliminar vehículo publicado, cancelar subasta | Modal + motivo obligatorio |
| **Crítico** | Eliminar cuenta, cancelar suscripción | Modal + escribir palabra clave + espera 3s |

### 8.2 Fórmula de confirmación destructiva

```
[Vas a + acción]. [Consecuencia concreta]. [Este paso no se puede deshacer].
```

**Ejemplo:**
```
Vas a eliminar el vehículo "Renault T480 2022".
Se eliminará del catálogo y perderás las 47 visitas acumuladas.
Esta acción no se puede deshacer.
```

**Valoración comercial/psicológica:**

- **Actual:** Correcto en patrón base. Se usa `"Escribe [palabra] para confirmar"` en acciones críticas.
- **Problema:** Algunas confirmaciones no mencionan la **consecuencia concreta**. `"¿Seguro que deseas cancelar esta subasta?"` no dice que los depósitos serán liberados (aunque sí lo dice en `cancelWarning`).
- **Recomendación:** Siempre incluir la consecuencia más relevante **en el texto principal**, no solo en un warning aparte.
- **Palabra a escribir:** Usar siempre la acción en infinitivo: "Eliminar" / "Cancelar" / "DELETE". Nunca "Borrar" vs "Eliminar" mezclados (actualmente se usa `"Borrar"` en publicidad y `"ELIMINAR"` en cuenta — inconsistente). **Estandarizar a "ELIMINAR" / "DELETE"**.

---

## 9. Labels y encabezados

### 9.1 Capitalización

| Elemento | Estilo ES | Estilo EN | Ejemplo |
|---|---|---|---|
| **Título de página** | Capitalización tipo oración | Title Case | "Configuración del catálogo" / "Catalog Settings" |
| **Label de campo** | Capitalización tipo oración | Sentence case | "Nombre de empresa" / "Company name" |
| **Botón** | Capitalización tipo oración | Title Case | "Guardar cambios" / "Save Changes" |
| **Header de tabla** | Capitalización tipo oración | Sentence case | "Fecha de creación" / "Created at" |
| **Tab** | Capitalización tipo oración | Title Case | "En vivo" / "Live" |
| **Badge/tag** | Minúscula | Lowercase | "publicado" / "published" |

**Valoración:**
- **Actual (ES):** Generalmente correcto. Algunos títulos admin tienen inconsistencias ("Solicitudes de transporte" vs "Captación de dealers" — la C debería ser minúscula si no es nombre propio).
- **Actual (EN):** Inconsistente. Mezcla Title Case y sentence case en títulos de página.
- **Recomendación:** EN debe usar **Title Case en títulos/tabs/botones** y **sentence case en labels/descriptions**. Seguir AP Stylebook.

### 9.2 Labels de formulario

| Hacer | No hacer |
|---|---|
| "Email de contacto" | "E-mail" (anticuado) |
| "Teléfono" | "Nº de teléfono" (abreviatura innecesaria) |
| "CIF/NIF" | "Número de identificación fiscal" (demasiado largo) |
| "Precio (€)" | "Precio en euros" |
| "Precio de salida" | "Starting price" (no mezclar idiomas) |

---

## 10. Números, fechas y moneda

### 10.1 Formato por idioma

| Elemento | ES | EN |
|---|---|---|
| **Precio** | 24.500 € | €24,500 |
| **Separador miles** | punto (.) | comma (,) |
| **Separador decimal** | coma (,) | period (.) |
| **Fecha corta** | 08/03/2026 | 08 Mar 2026 |
| **Fecha larga** | 8 de marzo de 2026 | March 8, 2026 |
| **Hora** | 14:30 | 2:30 PM |
| **Rango** | 15.000 € — 25.000 € | €15,000 — €25,000 |
| **Porcentaje** | 8,5% | 8.5% |

**Implementación:** Usar `Intl.NumberFormat` y `Intl.DateTimeFormat` siempre. Nunca formatear manualmente.

### 10.2 Abreviaciones de cantidades grandes

| Rango | ES | EN |
|---|---|---|
| < 10.000 | Número completo | Full number |
| 10.000 — 999.999 | "15.000 €" (completo) | "€15,000" |
| 1M+ | "1,2M €" | "€1.2M" |

---

## 11. Ortografía y acentos

### 11.1 Regla de oro

> **Todos los textos en español DEBEN llevar acentos correctos. Sin excepción.**

**Estado actual — PROBLEMA DETECTADO:**

Hay **decenas de strings sin acentos** en `es.json`. Esto es un error de calidad que afecta la percepción profesional.

| Incorrecto (actual) | Correcto |
|---|---|
| "vehiculo" | "vehículo" |
| "telefono" | "teléfono" |
| "cancelacion" | "cancelación" |
| "suscripcion" | "suscripción" |
| "adjudicacion" | "adjudicación" |
| "descripcion" | "descripción" |
| "informacion" | "información" |
| "configuracion" | "configuración" |
| "posicion" | "posición" |
| "titulo" | "título" |
| "deposito" | "depósito" |
| "ultimo" | "último" |
| "categorias" | "categorías" |
| "paises" | "países" |
| "dias" | "días" |

**Impacto:** Un marketplace profesional B2B con faltas de ortografía pierde credibilidad. Es como un concesionario con un cartel mal escrito.

**Acción:** Pasar lint ortográfico a todo `es.json`. Corregir todos los acentos faltantes.

---

## 12. Terminología unificada

### 12.1 Glosario de términos estándar

Cada concepto tiene **un solo término** en cada idioma. Nunca sinónimos.

**REGLA CLAVE — Castellano en ES:** El mercado español de vehículos industriales es tradicional. Los anglicismos no estandarizados (dealer, lead, listing) generan desconfianza. Usar **castellano natural** en todo texto visible al usuario en ES. Los anglicismos son aceptables solo en EN y en paneles internos de admin.

**Problema "dealer":** No siempre es empresa ni concesionario. Puede ser autónomo, particular, taller, importador... Necesitamos un término **que englobe a todos sin fallar.**

**Solución: depende del contexto, no del tipo de persona:**

| Contexto de uso | Término ES (público) | Por qué funciona |
|---|---|---|
| Quien **publica** un anuncio | **anunciante** | Describe la acción, no la forma jurídica. Vale para empresa, autónomo, particular, taller, importador |
| Quien **tiene panel/suscripción** | **profesional** | Diferencia del particular. Un autónomo ES un profesional |
| En la **ficha del vehículo** (quién vende) | **vendedor** | Lo que el comprador entiende. Universal |
| **Badges** de confianza | **Profesional Verificado**, **Socio Fundador** | Sin asumir tipo legal |
| Referencia **genérica** a quien usa la plataforma | **usuario** | Neutro total |
| Contexto de **compraventa** | **vendedor** / **comprador** | Roles, no identidades |

| Concepto | ES — usuario final | ES — admin (interno) | EN | NO usar en ES público |
|---|---|---|---|---|
| Quien publica (genérico) | **anunciante** | "dealer" (aceptable CRM) | **dealer** | dealer, concesionario (no siempre lo es) |
| Quien tiene suscripción | **profesional** | dealer / profesional | **dealer** | empresa (puede ser autónomo) |
| Quien vende en una ficha | **vendedor** | vendedor | **seller** | dealer, profesional (el comprador no piensa así) |
| Anuncio/listado | **anuncio** | anuncio | **listing** | publicación, artículo, listing |
| Particular | **particular** | particular | **private seller** | usuario vendedor |
| Vehículo | **vehículo** | vehículo | **vehicle** | producto, ítem |
| Subasta | **subasta** | subasta | **auction** | licitación |
| Puja | **puja** | puja | **bid** | oferta |
| Plan/suscripción | **plan** / **suscripción** | plan / suscripción | **plan** / **subscription** | membresía, paquete |
| Categoría | **categoría** | categoría | **category** | tipo (que es otra cosa) |
| Subcategoría | **subcategoría** | subcategoría | **subcategory** | tipo, clase |
| Tipo | **tipo** | tipo | **type** | variante |
| Favorito | **favorito** | favorito | **favorite** | bookmark, guardado |
| Contacto/consulta recibida | **consulta** o **contacto** | "lead" (aceptable) | **lead** | lead (en texto público ES) |
| Verificación | **verificación** | verificación | **verification** | validación, certificación |
| Ficha técnica | **ficha técnica** | ficha técnica | **technical sheet** | hoja técnica |
| Socio fundador | **Socio Fundador** | Founding (aceptable) | **Founding Dealer** | Founding Dealer (en ES público) |

### 12.2 Contextos donde el anglicismo ES aceptable

| Contexto | Ejemplo | Razón |
|---|---|---|
| **Panel admin** (solo empleados internos) | "Leads del mes", "Dealers activos" | Jerga CRM interna, no la ve el usuario final |
| **Nombre de plan como marca registrada** | "Plan Pro", "Plan Premium" | "Premium" sí está aceptado en español comercial |
| **Siglas técnicas universales** | ADR, GPS, CRM, SEO | Son siglas, no palabras |
| **Variables de código/BD** | `dealer_id`, `lead_status` | El código es en inglés, no afecta UI |

### 12.3 Términos técnicos del sector (no se traducen)

| Término | Razón |
|---|---|
| **ADR** | Certificación europea de mercancías peligrosas |
| **CNAE** | Código Nacional de Actividades Económicas |
| **CIF/NIF** | Documentos fiscales españoles |
| **ITV** | Inspección Técnica de Vehículos |
| **PMA/MMA** | Peso Máximo Autorizado / Masa Máxima Autorizada |
| **CV** | Caballos de vapor (ES). En EN → HP |
| **Prima del comprador** | En subastas. EN: "buyer's premium" |

### 12.4 Migración de anglicismos actuales en `es.json`

**Estado actual:** ~60 apariciones de "dealer" y ~30 de "lead" en textos ES visibles al usuario.

| Actual (incorrecto en ES público) | Correcto | Razón | Dónde |
|---|---|---|---|
| "Dealer no encontrado" | "Anunciante no encontrado" | Genérico, vale para todos | `error.dealerNotFound` |
| "Este dealer ya no está activo" | "Este anunciante ya no está activo en la plataforma" | — | `error.dealerNotFoundMessage` |
| "Founding Dealer" (badges) | "Socio Fundador" | Marca propia, castellano | `dealer.badgeFounding`, `.foundingBadge` |
| "Premium Dealer" | "Profesional Premium" | "Premium" sí se acepta | `dealer.badgePremium` |
| "Dealer Verificado" | "Profesional Verificado" | — | `dealer.badgeVerified` |
| "Panel de dealer" | "Mi panel" | El usuario sabe quién es | `dashboard.title` |
| "No tienes perfil de dealer" | "No tienes perfil de anunciante" | — | `dealer.noProfile` |
| "Leads recibidos" | "Consultas recibidas" | El vendedor recibe consultas | `dashboard.leads.title` |
| "Leads este mes" | "Consultas este mes" | — | `dashboard.leadsThisMonth` |
| "No hay leads" | "No hay consultas" | — | `dashboard.leads.empty` |
| "Detalle del lead" | "Detalle de la consulta" | — | `dashboard.leads.detail` |
| "Planes para Dealers" | "Planes para profesionales" | Suscripción = profesional | `pricing.seoTitle` |
| "Información del vendedor" | **Mantener** "Información del vendedor" | En ficha = "vendedor" | `vehicle.sellerInfo` (ya correcto) |
| "Captación de dealers" | Tolerable en admin | Solo lo ven empleados | `admin.captacion.title` |
| "Suscripciones de Dealers" | Tolerable en admin | Solo lo ven empleados | `admin.dealerSubscriptions.title` |
| "dealers colaboradores" | "anunciantes colaboradores" | Texto público visible | `requestSearchDesc` |

**Criterio práctico — 3 zonas:**

| Zona | Quién lo ve | Regla |
|---|---|---|
| **Pública** (catálogo, fichas, landing, precios, legal) | Cualquier visitante | **Castellano 100%.** "vendedor", "anunciante", "profesional". Cero anglicismos no estandarizados. |
| **Panel del anunciante** (dashboard, herramientas, estadísticas) | El vendedor que tiene cuenta | **Castellano.** El anunciante ES un usuario. "Consultas recibidas", "Mi panel", "Profesional Verificado". |
| **Admin** (solo empleados Tracciona) | Equipo interno | **Anglicismo CRM tolerable.** "Dealers activos", "Leads del mes", "Pipeline". Es jerga de trabajo interna. |

---

## 13. Tooltips y texto de ayuda

### 13.1 Cuándo usar tooltip vs texto inline

| Caso | Usar |
|---|---|
| **Campo con formato específico** | Texto inline bajo el campo |
| **Concepto que no todos conocen** | Tooltip (icono `?`) |
| **Restricción importante** | Texto inline visible siempre |
| **Info complementaria no esencial** | Tooltip |

### 13.2 Fórmula de tooltip

```
[Definición en una línea]. [Ejemplo si aplica].
```

**Máximo:** 2 líneas / 120 caracteres. Si necesita más → link a documentación.

**Ejemplo:** `"El buyer's premium es un porcentaje adicional que paga el comprador sobre la puja ganadora. Ej: 8% sobre 50.000€ = 4.000€ extra."`

---

## 14. Notificaciones push y email

### 14.1 Títulos de notificación push

```
[Emoji contextual] [Acción/novedad en ≤50 chars]
```

| Tipo | Ejemplo |
|---|---|
| **Nuevo match** | "🚛 Nuevo vehículo que encaja con tu búsqueda" |
| **Bajada de precio** | "📉 Un favorito tuyo ha bajado de precio" |
| **Mensaje** | "💬 Nuevo mensaje de [dealer]" |
| **Subasta** | "🔨 Superada tu puja en [vehículo]" |

### 14.2 Asuntos de email

```
[Acción/beneficio] — [Contexto] | Tracciona
```

| Tipo | Ejemplo |
|---|---|
| **Bienvenida** | "Bienvenido a Tracciona — Tu cuenta está lista" |
| **Lead recibido** | "Nuevo contacto interesado en tu [vehículo]" |
| **Bajada precio** | "Un favorito tuyo ha bajado de precio" |
| **Factura** | "Tu factura de [mes] está disponible" |

**Valoración:** Nunca usar MAYÚSCULAS en asuntos. Nunca emojis en asuntos de email (sí en push). Evitar palabras spam: "GRATIS", "OFERTA", "URGENTE".

---

## 15. Accesibilidad en microcopy

### 15.1 Textos para screen readers

| Elemento | Patrón |
|---|---|
| **Botón con solo icono** | `aria-label="[Acción] [objeto]"` → "Eliminar vehículo" |
| **Badge de estado** | `aria-label="Estado: [estado]"` |
| **Imagen** | `alt="[Descripción funcional]"` → "Foto frontal del Renault T480" |
| **Link externo** | `"[Texto] (abre en nueva pestaña)"` |
| **Campo obligatorio** | `aria-required="true"` + `"(obligatorio)"` en label |

### 15.2 Textos ocultos pero semánticos

| Caso | Texto sr-only |
|---|---|
| **Tabla con acciones** | "Acciones para [recurso]" |
| **Paginación** | "Ir a página [n]" |
| **Breadcrumb** | `aria-label="Navegación de migas"` |
| **Filtros** | "Filtrar por [dimensión]" |

---

## 16. Microcopy por vertical

### 16.1 Regla de extensibilidad

Todos los textos específicos de vertical deben estar en **un namespace separado** o ser **configurables desde `vertical_config`**.

| Tipo | Dónde vive | Ejemplo |
|---|---|---|
| **UI genérica** | `i18n/{lang}.json` | "Guardar", "Eliminar", "Buscar" |
| **Sector-específico** | `i18n/{lang}.json` namespace `vertical.*` | "Categorías", "Ficha técnica" |
| **Vertical-específico** | `vertical_config` tabla (BD) | "camiones" → "barcos", "CV" → "eslora" |

### 16.2 Textos que cambian por vertical

| Genérico | Vehículos (Tracciona) | Inmobiliaria (futuro) | Náutica (futuro) |
|---|---|---|---|
| "Producto" | "Vehículo" | "Propiedad" | "Embarcación" |
| "Vendedor" | "Dealer" | "Agencia" | "Bróker" |
| "Características" | "Ficha técnica" | "Características" | "Especificaciones" |
| "Año" | "Año de matriculación" | "Año de construcción" | "Año de botadura" |
| "km" | "Kilómetros" | "m²" | "Horas de motor" |

**Implementación:** Estos textos deben resolverse con `localizedField()` desde `vertical_config.labels` (JSONB), NO hardcodeados en i18n.

---

## 17. Checklist de calidad

Antes de aprobar cualquier texto nuevo en `i18n/`:

- [ ] ¿Usa tuteo (ES) / you (EN)?
- [ ] ¿Acentos correctos en ES?
- [ ] ¿Usa terminología del glosario (sección 12)?
- [ ] ¿Los errores incluyen acción sugerida?
- [ ] ¿Los CTAs de conversión usan primera persona?
- [ ] ¿Los placeholders usan ejemplos realistas?
- [ ] ¿Las confirmaciones destructivas mencionan la consecuencia?
- [ ] ¿El texto es ≤ longitud máxima para su contexto?
- [ ] ¿Existe traducción EN paralela?
- [ ] ¿No repite el label en el placeholder?
- [ ] ¿Funciona sin contexto visual (screen readers)?

---

## 18. Inconsistencias actuales a corregir

### 18.1 Prioridad alta (afectan percepción profesional)

| ID | Problema | Ubicación | Corrección |
|---|---|---|---|
| MC-01 | ~50+ strings sin acentos en ES | `es.json` (admin.*) | Pasar lint, corregir todos |
| MC-02 | Mezcla tuteo/usted | `es.json` (advertise.*, demand.*) | Convertir a tuteo |
| MC-03 | "Borrar" vs "Eliminar" inconsistente | `es.json` (publicidad.typeBorrar) | Estandarizar a "Eliminar" |
| MC-04 | Errores sin acción sugerida | ~15 strings `errorLoad`, `errorCreate` | Añadir sugerencia a todos |
| MC-13 | ~60 "dealer" + ~30 "lead" en textos ES públicos | `es.json` (todo el archivo) | Reemplazar por "profesional"/"anunciante" y "consulta"/"contacto" según §12.1 y §12.4 |

### 18.2 Prioridad media (afectan UX)

| ID | Problema | Ubicación | Corrección |
|---|---|---|---|
| MC-05 | Placeholders que repiten label | Varios `selectVehicle`, `selectDealer` | Eliminar redundancia |
| MC-06 | Success inconsistente ("correctamente" vs "con éxito") | Varias secciones | Estandarizar a "correctamente" |
| MC-07 | Empty states sin CTA | ~10 `noResults`, `noDocuments` | Añadir CTA o sugerencia |
| MC-08 | "Email" vs "e-mail" vs "correo" | Varias secciones | Estandarizar a "email" |

### 18.3 Prioridad baja (mejoras futuras)

| ID | Problema | Corrección |
|---|---|---|
| MC-09 | CTAs de conversión genéricos | Aplicar regla de primera persona (§2.3) |
| MC-10 | Loading sin contexto en operaciones largas | Añadir explicación para >3s (§5.1) |
| MC-11 | Namespace vertical no separado | Crear `vertical.*` namespace (§16.1) |
| MC-12 | Capitalización EN inconsistente | Aplicar Title Case en títulos/botones |

---

## 19. Escalabilidad multi-mercado e idiomas

### 19.1 Arquitectura actual (lo que YA funciona)

| Capa | Mecanismo | Añadir idioma |
|---|---|---|
| **UI strings** | `@nuxtjs/i18n` + `$t()` + lazy loading | Crear `fr.json`, registrar en `nuxt.config.ts` |
| **Datos BD** (categorías, atributos) | JSONB + `localizedField()` fallback `locale→en→es→first` | `INSERT` con `{"fr": "Camions"}` |
| **Contenido largo** (descripciones) | Tabla `content_translations` | `INSERT` por locale |
| **Detección idioma** | Plugin: `user.lang` → cookie → IP country → default | Mapear país en `geoData.ts` |
| **Config vertical** | `active_locales[]` + `default_locale` por vertical | `["fr","en","es"]` |
| **URLs** | `strategy: prefix_except_default` → `/en/`, `/fr/` | Automático |
| **Textos de marca** | `name`, `tagline`, `hero_*`, `footer_text` → JSONB | `{"fr": "Bienvenue"}` |

### 19.2 Gaps técnicos a resolver ANTES de abrir nuevo mercado

| ID | Gap | Impacto | Solución | Prioridad |
|---|---|---|---|---|
| **G-1** | `marketReport.ts` tiene ~50 strings ES hardcodeadas ("Resumen Ejecutivo", "Tendencia alcista", "Marca"...) | Informes solo en español | Mover a `i18n` o tabla `report_templates` JSONB | P1 (antes de mercado no-ES) |
| **G-2** | `vertical_config` no tiene campo `sector_labels` JSONB | "Vehículo"→"Embarcación" requiere código | Añadir `sector_labels: JSONB` → `{"vehicle": {"es": "Embarcación", "en": "Vessel"}, "km": {"es": "Horas de motor"}}` | P2 (antes de nueva vertical) |
| **G-3** | `geoData.ts` solo mapea español→`es` y resto→`en` | Usuario francés en Francia recibe `en` | Añadir: `FR→fr`, `PT→pt`, `DE→de`, `IT→it` en `getLocaleFallbackForCountry()` | P1 (antes de mercado no-ES/EN) |
| **G-4** | Email templates (notifications, adminEmailTemplates) — hardcoded ES/EN | Emails en 3er idioma imposibles | Migrar a tabla `email_templates` con JSONB por locale, o usar `$t()` server-side | P1 |
| **G-5** | `og:locale` hardcoded `es_ES` / `en_GB` en `nuxt.config.ts` | SEO de nuevos idiomas sin OG correcto | Hacer dinámico: `og:locale` = `i18n.locale` + `_` + country code | P2 |
| **G-6** | Sin variantes regionales de español | Latam: "tractomula" (CO), "acoplado" (AR) vs "semirremolque" (ES) | Documentar vocabulario universal del sector. No crear variantes `es-MX`, `es-AR` por ahora — un solo `es` neutro | FUTURO |
| **G-7** | Namespace `vertical.*` no existe en `es.json`/`en.json` | Sin separación clara UI genérica vs sector | Crear namespace vacío `"vertical": {}` como placeholder | P3 |
| **G-8** | Sin workflow de traducción documentado | ¿Quién traduce? ¿Cómo? ¿AI + revisión? | Ver §19.4 | P1 (antes de 3er idioma) |

### 19.3 Checklist para abrir nuevo idioma

```
1. [ ] Crear `i18n/{code}.json` copiando estructura de `en.json`
2. [ ] Traducir (AI + revisión humana — ver §19.4)
3. [ ] Registrar en `nuxt.config.ts` → `i18n.locales`
4. [ ] Añadir locale a `vertical_config.active_locales` en BD
5. [ ] Mapear países en `geoData.ts` → `getLocaleFallbackForCountry()`
6. [ ] Traducir JSONB de categorías/subcategorías/atributos en BD
7. [ ] Traducir email templates
8. [ ] Traducir strings hardcoded de marketReport.ts
9. [ ] Añadir `og:locale` dinámico
10. [ ] QA: revisar CTAs, errores, placeholders siguen patrones de esta guía
11. [ ] SEO: verificar hreflang tags, sitemap por locale, meta descriptions
```

### 19.4 Workflow de traducción recomendado

```
Paso 1 — AI genera traducción base
   Input: en.json (source of truth para traducciones)
   Herramienta: Claude / GPT con contexto de esta guía de microcopy
   Output: fr.json (borrador)

Paso 2 — Revisión humana nativa
   Revisor: hablante nativo del idioma + conocimiento del sector
   Foco: terminología técnica, tono, naturalidad
   Herramienta: diff entre borrador AI y correcciones

Paso 3 — QA automatizado
   - Verificar que todas las keys de en.json existen en fr.json
   - Verificar que no hay strings vacías
   - Verificar que placeholders ({count}, {name}) se mantienen
   - Verificar longitud (strings FR suelen ser 20-30% más largas que EN)

Paso 4 — Publicación
   - Merge a main
   - Activar locale en vertical_config
   - Monitorizar errores en Sentry (strings missing = key shown)
```

### 19.5 Español neutro vs regional

| Término | ES (neutro/universal) | NO usar (regional) |
|---|---|---|
| Camión | camión | troca (MX), lorry (UK-ES) |
| Semirremolque | semirremolque | tractomula (CO), acoplado (AR) |
| Matrícula | matrícula | placa (Latam), patente (AR/CL) |
| Neumático | neumático | llanta (Latam), goma (AR) |
| Conductor | conductor | chofer (Latam) |
| Taller | taller | — (universal) |
| Grúa | grúa | — (universal) |
| Carrocería | carrocería | — (universal) |

**Decisión:** Un solo `es.json` con español peninsular neutro. El sector industrial europeo es el mercado primario. Latam se atiende con el mismo español — la terminología técnica es suficientemente universal. Si Latam crece significativamente → considerar `es-419` como variante.

### 19.6 Consideraciones por mercado

| Mercado | Idioma | Moneda | Formato fecha | Formato número | Notas |
|---|---|---|---|---|---|
| **España** | es | EUR (€) | DD/MM/AAAA | 24.500,00 | Mercado base |
| **UK** | en | GBP (£) | DD/MM/YYYY | 24,500.00 | Post-Brexit: regulación diferente, legal UK separado (`legal/uk.vue` ya existe) |
| **Francia** | fr | EUR (€) | DD/MM/AAAA | 24 500,00 | Espacio como separador miles, no punto |
| **Alemania** | de | EUR (€) | DD.MM.JJJJ | 24.500,00 | Punto en fechas, TÜV en vez de ITV |
| **Portugal** | pt | EUR (€) | DD/MM/AAAA | 24.500,00 | Similar a ES, regulación EU |
| **Italia** | it | EUR (€) | DD/MM/AAAA | 24.500,00 | Similar a ES |
| **Latam** | es | USD/local | DD/MM/AAAA | 24,500.00 | Formato US para números |

**Implementación:** `Intl.NumberFormat(locale)` y `Intl.DateTimeFormat(locale)` resuelven todo automáticamente. NUNCA formatear manualmente.

---

## Apéndice A — Referencia rápida de patrones

```
CTA rutinario:     "Guardar cambios"
CTA conversión:    "Publicar mi vehículo"
CTA pago:          "Activar mi plan Pro"
Error validación:  "Introduce un email válido"
Error servidor:    "No hemos podido guardar. Inténtalo de nuevo."
Error permisos:    "Necesitas una cuenta dealer para publicar."
Éxito rutinario:   "Cambios guardados"
Éxito valor:       "¡Vehículo publicado! Ya es visible en el catálogo."
Loading:           "Guardando..."
Loading largo:     "Generando informe... Puede tardar unos segundos."
Empty state:       "Aún no tienes vehículos publicados. ¡Publica el primero!"
Confirmación:      "Vas a eliminar [X]. [Consecuencia]. No se puede deshacer."
Placeholder:       "ej: Renault T480 2022"
Tooltip:           "El buyer's premium es un % adicional sobre la puja. Ej: 8% = 4.000€."
```

---

*Última actualización: Marzo 2026. Revisar anualmente o al lanzar nueva vertical.*

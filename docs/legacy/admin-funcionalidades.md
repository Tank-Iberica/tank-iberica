> ⚠️ **[LEGACY]** Documento histórico — solo referencia. No modificar ni usar como fuente de verdad. Ver [docs/README.md](../README.md) para navegación activa.

**TANK IBERICA**

Panel de Administración

_admin.html_

**Documentación Completa de Funcionalidades**

8.860 líneas • Single Page Application • Vanilla JavaScript

Enero 2026

1\. Visión General

admin.html es una Single Page Application (SPA) de 8.860 líneas que constituye el panel de administración completo de Tank Ibérica, una empresa de compraventa y alquiler de vehículos industriales. La aplicación está construida enteramente en HTML, CSS y JavaScript nativo (sin frameworks), e integra múltiples APIs de Google para su funcionamiento.

1.1 Tecnologías y Dependencias

---

**Componente** **Tecnología** **Uso**

Backend de datos Google Sheets API v4 Almacenamiento de todos los datos (CRUD)

Almacenamiento archivos Google Drive API v3 Imágenes, documentos, facturas

Lógica servidor Apps Script Operaciones backend personalizadas

Autenticación Google OAuth 2.0 Login de administradores

Exportación Excel XLSX.js (SheetJS) Generación de archivos .xlsx

Exportación PDF jsPDF + AutoTable Generación de archivos .pdf

Gráficos Chart.js Visualización de datos (reservado)

Fuente Google Fonts (Inter) Tipografía de la interfaz

---

1.2 Identificadores Clave

- **SHEET_ID:** 1GdmirqWFKVt39QvEJxdMH3zW0-itl64YuqYEsOAkF30

- **CLIENT_ID:** 928575372421-rlq17ptufeppbkqs1a26o0pb97pfut0a.apps.googleusercontent.com

- **Apps Script URL:** AKfycbzvweSBncWu0sXaZspE6tQ6ZMJIIcmk9dKlpXgjdSdU0LJZUzLOsE3LdeuSkP86H337sw

  1.3 Hojas de Google Sheets

Todas las hojas que componen la base de datos:

---

**Hoja** **Propósito**

vehiculos Inventario principal de vehículos

subcategorias Tipos de vehículos (cisternas, tractoras, etc.)

filtros Sistema dinámico de filtros configurables

anunciantes Personas que quieren vender vehículos

solicitantes Personas que buscan comprar vehículos

noticias Artículos/posts del blog

comentarios Comentarios de usuarios en posts

usuarios Cuentas de usuario registradas

suscripciones Suscriptores al newsletter

historico Archivo de vehículos vendidos

balance Transacciones financieras (ingresos/gastos)

intermediacion Vehículos gestionados por terceros

ojeados Productos vistos en otras plataformas

tabla_config Configuración de columnas y grupos de tabla

admins Lista de administradores autorizados

config Configuración general (plataformas, etc.)

---

2\. Autenticación y Acceso

El sistema implementa un flujo de autenticación basado en Google OAuth 2.0 con validación adicional contra una lista de administradores autorizados.

2.1 Flujo de Login

- Pantalla de login con botón \"Acceder con Google\" (clase .login-screen)

- Función iniciarLogin() inicia el flujo OAuth con los scopes de Sheets y Drive

- Tras autenticación, se verifica el email del usuario contra la hoja \'admins\'

- Si el email no está en la lista, muestra error y bloquea el acceso

- Token almacenado en localStorage para persistencia entre sesiones

- Foto y nombre del usuario mostrados en el sidebar (.admin-user)

  2.2 Scopes Requeridos

- https://www.googleapis.com/auth/spreadsheets (lectura/escritura de datos)

- https://www.googleapis.com/auth/drive.file (gestión de archivos en Drive)

  2.3 Logout

La función logout() limpia el token de localStorage y recarga la página, mostrando nuevamente la pantalla de login.

3\. Navegación y Estructura

3.1 Sidebar (Barra Lateral)

El sidebar (.admin-sidebar) es el elemento principal de navegación con las siguientes características:

- **Colapsable:** Botón toggleSidebar() alterna entre modo completo (240px) y modo icono (60px)

- **Logo y usuario:** Muestra \'TANK IBERICA\', foto del admin, nombre y botón de cerrar sesión

- **Navegación jerárquica:** Categorías colapsables (.nav-cat) con subitems (.nav-sub)

- **Badges:** Contadores en tiempo real sobre elementos pendientes (rojo para urgentes, verde/turquesa para información)

  3.2 Secciones Principales

---

**Sección** **Icono** **Descripción**

Dashboard 📊 Panel principal con estadísticas y resumen

Configuración \> Subcategorías 📋 Tipos de vehículos

Configuración \> Filtros 🔍 Sistema de filtros dinámicos

Configuración \> Banner 🔔 Banner de notificación del sitio

Catálogo \> Vehículos 🚚 Inventario principal

Catálogo \> Intermediación 🤝 Vehículos de terceros

Catálogo \> Ojeados 👁 Productos vistos en competencia

Catálogo \> Anunciantes 📢 Vendedores potenciales

Catálogo \> Solicitantes 🔎 Compradores potenciales

Balance 💰 Gestión financiera

Histórico 📜 Archivo de ventas

Comunicación \> Posts 📝 Artículos del blog

Comunicación \> Comentarios 💬 Moderación de comentarios

Usuarios \> Usuarios 👤 Gestión de cuentas

Usuarios \> Chat 💬 Mensajería admin-usuario

Usuarios \> Suscripciones 📧 Newsletter

---

4\. Dashboard

La sección Dashboard (section-dashboard) es la pantalla principal que se muestra al iniciar sesión y ofrece una visión general del estado del negocio.

4.1 Tarjeta de Estado del Banner

En la parte superior, una tarjeta (.banner-status-card) muestra si el banner del sitio web está activo o inactivo, con un botón rápido para activar/desactivar (toggleBannerRapido()). La tarjeta cambia de color según el estado: verde cuando activo, amarillo cuando inactivo.

4.2 Tarjetas de Estadísticas

Una rejilla de 5 tarjetas (.stats-grid) muestra contadores interactivos:

- Vehículos: total de vehículos en el inventario activo

- Anunciantes: personas que quieren vender, con indicador si hay nuevos

- Solicitantes: personas que buscan comprar, con indicador si hay nuevos

- Chats: conversaciones con mensajes sin leer

- Comentarios: comentarios pendientes de moderación

Cada tarjeta es clickable y navega a su sección correspondiente (goSection()). Las tarjetas con elementos pendientes muestran fondo degradado rojo (.has-pending).

4.3 Panel de Pendientes

Muestra una lista de elementos que requieren atención inmediata: anunciantes y solicitantes con estado \'nuevo\', chats sin responder, comentarios sin moderar. Cada elemento es clickable para navegar directamente al item.

4.4 Panel de Matches

Muestra coincidencias potenciales entre solicitantes/anunciantes y vehículos del inventario, basado en el campo vehiculo_match_id que se asigna manualmente.

5\. Configuración

5.1 Subcategorías

Las subcategorías definen los tipos de vehículos disponibles (cisternas, tractoras, remolques, etc.). Cada subcategoría tiene:

- **Nombre bilingüe:** Campos separados para español e inglés

- **Filtros aplicables:** Checkboxes para seleccionar qué filtros se muestran al crear/editar vehículos de esta subcategoría

- **Estado publicado/no publicado:** Toggle que controla si aparece en la web pública

- **Stock:** Contador automático del número de vehículos activos en esa subcategoría

- **Orden:** Botones de subir/bajar para reordenar la presentación

Modal: modalSubcat con funciones abrirModalSubcat() y guardarSubcat().

5.2 Filtros

El sistema de filtros es completamente dinámico y configurable. Los filtros se aplican tanto en la web pública de búsqueda como en los formularios de creación/edición de vehículos.

5.2.1 Tipos de Filtro

---

**Tipo** **Código** **Descripción**

Campo de texto caja Input libre para texto o números

Desplegable desplegable Select con opciones predefinidas

Desplegable con tick desplegable_tick Desplegable que se activa con checkbox

Checkbox tick Casilla de verificación (sí/no)

Slider slider Rango numérico con min/max

Calculadora calc Botones +/- para incrementar/decrementar

---

5.2.2 Propiedades de Filtro

- **Nombre ES/EN:** Bilingüe para la web pública

- **Unidad de medida:** Se muestra junto al valor (km, L, kg, etc.)

- **Valor por defecto:** Valor inicial del filtro

- **Extra:** Solo para tipo tick. Permite seleccionar otros filtros que aparecen condicionalmente cuando el tick está activado

- **Ocultar:** Solo para tipo tick. Permite seleccionar filtros que se ocultan cuando el tick está activado

- **Estado:** Tres estados posibles: publicado (activo), oculto (existe pero no visible), inactivo (eliminado lógicamente)

- **Orden:** Reordenable con botones arriba/abajo

  5.3 Banner

Configuración del banner de notificación que aparece en la web pública:

- **Texto bilingüe:** Mensaje en español e inglés

- **URL opcional:** Enlace al que lleva el banner al hacer clic

- **Programación:** Fechas \'desde\' y \'hasta\' para activación automática

- **Estado:** Activo/inactivo con toggle

- **Vista previa:** Botón para ver cómo quedará el banner

- **Emoji picker:** Selector integrado de emojis comunes para insertar en el texto

6\. Catálogo de Vehículos

6.1 Vehículos (Inventario Principal)

Es la sección más compleja del panel, gestionando el inventario completo de vehículos de Tank Ibérica.

6.1.1 Filtros de Búsqueda

- **Búsqueda de texto:** Busca en múltiples campos (marca, modelo, matrícula, etc.)

- **Categoría:** Checkboxes para Venta, Alquiler, Terceros

- **Subcategoría:** Desplegable filtrado según subcategorías publicadas

- **Grupos de columnas:** Checkboxes para mostrar/ocultar grupos de columnas (DOCS, TÉCNICO, CUENTAS, etc.)

- **Botón de configuración:** Acceso al modal de configuración de tabla

  6.1.2 Tabla de Vehículos

La tabla es completamente configurable a través del sistema de \'grupos\':

- **Columnas ordenables:** Click en cabecera para ordenar ascendente/descendente (ID, marca, modelo, año, precio, estado)

- **Imágenes thumbnail:** Miniatura de la foto de portada

- **Badges de categoría:** Etiquetas de color para venta (azul), alquiler (amarillo), terceros (violeta)

- **Estado semáforo:** Indicadores de color: verde (publicado), gris (oculto), azul (alquilado), rojo (taller)

- **Acciones por fila:** Editar, Vender, Eliminar

- **Pantalla completa:** Botón para expandir la tabla a toda la pantalla

  6.1.3 Modal de Vehículo (modalVehiculo)

El formulario de creación/edición de vehículos es el más extenso del sistema. Contiene las siguientes secciones:

**Estado (Semáforo Visual):**

- Radio buttons estilizados con puntos de color

- Opciones: Publicado (verde), Oculto (gris), Alquilado (azul), Taller (rojo)

- Selección visual con borde y fondo del color correspondiente

**Imágenes:**

- Zona de arrastre para subir imágenes (máximo 10)

- Preview en grid con miniaturas

- Click en imagen para establecer como portada (.portada)

- Botón X para eliminar cada imagen

- Subida a Google Drive en carpeta organizada (TankIberica/Vehiculos/\[Subcategoria\]/\[Tipo\]/\[Marca\_(Año)\_Matricula\]/Fotos/)

**Datos Básicos:**

- Categorías: checkboxes múltiples (Venta, Alquiler, Terceros) - un vehículo puede estar en varias

- Subcategoría: desplegable dinámico

- Marca, Modelo, Año, Matrícula

- Precio venta / Precio alquiler (condicional según categorías seleccionadas)

- Ubicación bilingüe (ES/EN)

- Descripción bilingüe (ES/EN, límite 300 caracteres)

**Filtros Dinámicos:**

- Grid de filtros que cambia según la subcategoría seleccionada

- Cada filtro se renderiza según su tipo (input, select, checkbox, slider, calc)

- Soporte bilingüe en los valores

- Almacenados como JSON en el campo filtros_json

**Características Personalizadas:**

- Sistema dinámico de pares clave-valor

- Botón \'+ Añadir\' para agregar filas

- Botón X para eliminar filas

- Almacenadas como JSON en caracteristicas_json

**Documentación:**

- Zona de subida de documentos

- Renombrar documentos con botón de edición

- Subida a Drive en carpeta Documentos del vehículo

- Links directos a carpeta de Drive

**Sección Financiera:**

- Precio mínimo (umbral de negociación)

- Coste de adquisición

- Fecha de adquisición

**Tabla de Mantenimiento:**

- Registros de fecha, razón, coste

- Subida de facturas a subcarpeta Facturas en Drive

- Botón \'+ Añadir\' para nuevos registros

- Total autocalculado

**Tabla de Ingresos por Alquiler:**

- Registros de desde, hasta, razón, importe

- Subida de facturas

- Total autocalculado

**Cálculo de Coste Total:**

- Fórmula: Coste Adquisición + Total Mantenimiento - Total Renta

- Mostrado en caja destacada (.coste-total-box) con gradiente oscuro

  6.1.4 Sistema de IDs

Los vehículos usan IDs numéricos secuenciales (1, 2, 3\...) con un sistema de reutilización que rellena huecos dejados por vehículos eliminados, evitando así saltos en la numeración.

6.1.5 Modal de Transacción (modalTransaccion)

Se abre al pulsar el botón \'Vender\' en un vehículo. Tiene dos pestañas:

**Pestaña Alquilado:**

- Fechas desde/hasta del alquiler

- Cliente

- Importe

- Subida de factura

- Crea entrada automática en el balance

- Cambia el estado del vehículo a \'alquilado\'

**Pestaña Venta:**

- Fecha de venta

- Comprador

- Precio de venta

- Subida de factura

- Checkbox de \'Exportación\' (para ventas internacionales)

- Mensaje de advertencia (la venta mueve el vehículo al histórico)

- Crea entrada en el balance y mueve el vehículo a la hoja \'historico\'

  6.2 Intermediación

Gestiona vehículos que no pertenecen a Tank Ibérica pero que la empresa intermedia. No se publican en la web pública.

6.2.1 Diferencias con Vehículos

- **IDs con prefijo P:** P1, P2, P3\... para diferenciarlos del inventario propio

- **Estados diferentes:** Disponible, Reservado, Alquilado, Vendido

- **Sin categorías:** No usa el sistema venta/alquiler/terceros

- **Campos de propietario:** Propietario, Contacto, Notas (datos del dueño real)

- **Gastos/Ingresos propios:** Tablas separadas para gestionar los costes e ingresos de la intermediación

- **Cálculo de beneficio:** Ingresos - Gastos mostrado en el modal

  6.2.2 Tabla Configurable

Tiene su propio sistema de grupos de columnas, independiente del de vehículos. La configuración se almacena en tabla_config con el campo sección=\'intermediacion\' o \'ambos\'.

6.3 Ojeados

Sección para rastrear productos vistos en plataformas de la competencia (Milanuncios, Wallapop, etc.).

6.3.1 Sistema de Plataformas

- Lista configurable de plataformas (panel desplegable con botón de engranaje)

- Añadir/eliminar plataformas dinámicamente

- Almacenadas en la hoja \'config\'

- Opción \'Otra\' para plataformas puntuales

  6.3.2 Campos del Ojeado

- **Producto:** Descripción del vehículo/producto visto

- **Plataforma:** Dónde se encontró

- **Enlace:** URL directa al anuncio

- **Precio / Negociado:** Precio publicado y precio tras negociación

- **Teléfono / Email:** Contacto del vendedor

- **Estado:** Inactivo, Contactado, Negociando, Otro

- **Notas:** Observaciones libres

  6.4 Anunciantes

Personas que contactan a Tank Ibérica para vender sus vehículos.

- Campos: nombre, contacto, descripción del vehículo, precio pedido, imágenes

- Estados: nuevo (badge rojo), contactado

- Match con inventario: campo vehiculo_match_id para vincular si se compra el vehículo

- Eliminación con confirmación (escribir \'Borrar\')

- Badge en navegación para anunciantes con estado \'nuevo\'

  6.5 Solicitantes

Personas que buscan comprar un tipo específico de vehículo.

- Campos: nombre, contacto, requisitos/especificaciones, fecha

- Estados: nuevo (badge rojo), contactado

- Match con inventario: vincular con vehículos disponibles

- Eliminación con confirmación

- Badge en navegación para solicitantes con estado \'nuevo\'

7\. Balance (Gestión Financiera)

Sección completa de contabilidad que registra todos los ingresos y gastos del negocio.

7.1 Tipos de Transacción

---

**Tipo** **Razones Disponibles**

Ingreso Venta, Alquiler, Exportación, Dividendos, Otros

Gasto Compra, Taller, Documentación, Servicios, Salario, Seguro, Almacenamiento, Bancario, Efectivo, Otros

---

7.2 Estados de Pago

- Pendiente: transacción registrada pero no completada (badge amarillo)

- Pagado: gasto completado (badge verde)

- Cobrado: ingreso recibido (badge verde)

  7.3 Filtros

- Año: filtra por año de la transacción

- Tipo: ingreso/gasto

- Razón: filtro por concepto

- Estado: pendiente/pagado/cobrado

- Subcategoría: filtro por subcategoría de vehículo relacionado

- Búsqueda de texto: en detalle y notas

  7.4 Resumen Financiero

Panel inferior (.balance-summary) con tres tarjetas:

- **Total Ingresos:** Suma de todos los ingresos (verde)

- **Total Gastos:** Suma de todos los gastos (rojo)

- **Balance Neto:** Ingresos - Gastos (azul)

Toggle para mostrar desglose por razón, con tarjetas individuales mostrando ingresos y gastos por cada concepto.

7.5 Facturas y Recibos

Cada transacción puede tener un documento asociado (factura o recibo) que se sube a Drive con la siguiente estructura:

_TankIberica/Tickets/\[Año\]/Ingresos/Facturas/ o TankIberica/Tickets/\[Año\]/Gastos/Recibos/_

7.6 Generador de Facturas (modalFactura)

Sistema completo de generación de facturas en PDF:

- Selector de vehículos asociados (0-9)

- Datos del cliente (nombre, dirección, tipo documento, número documento)

- Líneas de factura dinámicas (tipo, concepto, cantidad, precio/ud, IVA%)

- Cálculos automáticos: subtotal, IVA, total, pagado, a pagar

- Método de pago, banco, IBAN

- Opción de emitir en inglés

- Datos de empresa precargados (Tank Iberica S.L., NIF, dirección, etc.)

- Generación de PDF con jsPDF y autoTable

8\. Histórico

Archivo de vehículos que han sido vendidos. Se puebla automáticamente cuando se completa una venta desde la sección de vehículos.

8.1 Datos Registrados

- Todos los datos originales del vehículo

- fecha_venta: fecha de la transacción

- precio_venta: importe final de venta

- comprador: nombre/datos del comprador

- categoría de venta: venta, terceros, o exportación

- beneficio: cálculo automático (precio_venta - coste_total)

  8.2 Filtros

- Año de venta

- Categoría (venta, terceros, exportación)

- Subcategoría del vehículo

- Marca

  8.3 Grupos de Columnas Opcionales

- DOCS: columnas de documentación

- TÉCNICO: datos técnicos del vehículo

- ALQUILER: historial de alquiler previo a la venta

  8.4 Restauración

Opción de restaurar un vehículo del histórico al catálogo activo. Requiere escribir \'Restaurar\' como confirmación. Elimina la entrada del balance asociada si existe.

9\. Comunicación

9.1 Posts

Sección de blog/noticias actualmente marcada como \'En desarrollo\'. La estructura existe con campos para imagen, título, categoría, fecha, vistas y estado, pero la funcionalidad de creación no está implementada.

9.2 Comentarios

Sistema de moderación de comentarios de usuarios en posts:

- Datos: autor, email, texto, fecha, post asociado, parent_id (para hilos)

- Acciones: aprobar o eliminar

- Badge en navegación con conteo de comentarios pendientes

- Soporte para comentarios anidados (respuestas) mediante parent_id

10\. Usuarios

10.1 Gestión de Usuarios

Administración de cuentas de usuarios registrados en la web pública:

- Campos: pseudo (nombre de usuario), nombre completo, email, fecha de registro

- Estados: activo/inactivo

- Acciones: ver, editar, eliminar

  10.2 Chat

Sistema de mensajería entre administradores y usuarios:

- **Lista de conversaciones:** Panel izquierdo con todas las conversaciones, indicadores de no leído

- **Detalle de chat:** Panel derecho con historial de mensajes, burbujas diferenciadas (azul oscuro para usuario, gris para admin)

- **Envío de respuestas:** Textarea con botón de envío

- **Opciones de borrado:** Eliminar solo mensajes admin, solo usuario, o ambos

- **Refresco manual:** Botón para actualizar mensajes (sin actualización en tiempo real)

- **Badge:** Contador de chats con mensajes sin leer en la navegación

  10.3 Suscripciones

Gestión de suscriptores al newsletter:

- Email del suscriptor

- Tipos de suscripción: Web, Prensa, Boletín, Destacados, Eventos, Responsabilidad

- Fecha de registro

11\. Sistema de Configuración de Tablas

Uno de los sistemas más sofisticados del panel. Permite personalizar completamente las tablas de vehículos e intermediación.

11.1 Grupos

Los grupos son agrupaciones lógicas de columnas que pueden activarse/desactivarse:

- **Nombre ES/EN:** Bilingüe

- **Elementos:** Lista de columnas incluidas (separadas por punto y coma)

- **Obligatorio:** Si es true, el grupo siempre está visible y no se puede desactivar

- **Activo por defecto:** Si aparece activado al cargar la página

- **Sección:** Aplica a vehiculos, intermediacion, o ambos

- **Orden:** Reordenable con drag-and-drop

  11.2 Columnas

Cada columna tiene configuración avanzada:

- **Visibilidad:** Toggle individual

- **Sistema de fallback:** Si una columna no tiene datos, puede mostrar automáticamente el valor de otra columna (prioridad configurable)

- **Combinar/Separar:** Fusionar múltiples campos en una sola columna

- **Reordenable:** Drag-and-drop para cambiar el orden

  11.3 Modal de Configuración (modalConfigTabla)

Interfaz con sidebar de tres secciones: Grupos, Columnas Vehículos, Columnas Intermediación. Cada sección muestra una lista de items arrastrables (.sortable-item) con handles de arrastre y botones de acción.

12\. Sistema de Exportación

Múltiples modales de exportación para diferentes secciones:

12.1 Exportar Vehículos (modalExportar)

- Formato: Excel (.xlsx) o PDF

- Datos: todos o solo los filtrados actualmente

- Columnas: todas o solo las visibles

- Excluir columnas específicas: ID, Imagen, Categoría, Subcategoría, Precio, Estado, Acciones

  12.2 Exportar Balance (modalExportarBalance)

- Formato: Excel o PDF

- Datos: todos o filtrados por año/tipo

- Selección de columnas

  12.3 Exportar Resumen (modalExportarResumen)

- Formato: Excel o PDF

- Período: todo o año específico

- Incluir: totales, desglose por razón, desglose mensual

  12.4 Exportar Histórico (modalExportarHistorico)

- Formato: Excel o PDF

- Datos: todos o filtrados

- Selección extensa de columnas (básicas, documentación, técnicas, financieras)

  12.5 Exportar Intermediación y Ojeados

Cada sección tiene su propio modal de exportación con opciones de formato, datos y columnas.

13\. Estructura de Google Drive

Los archivos se organizan en una estructura de carpetas jerárquica:

**TankIberica/**

- Vehiculos/ \> \[Subcategoria\]/ \> \[Tipo\]/ \> \[Marca\_(Año)\_Matricula\]/
  - └ Fotos/ (imágenes del vehículo)

  - └ Documentos/ \> Facturas/ (documentación y facturas de mantenimiento)

- Intermediacion/ \> \[Subcategoria\]/ \> \[Tipo\]/ \> \[Marca\_(Año)\_Matricula\]/ \> Facturas/

- Historico/ \> \[Marca\_(Año)\_Matricula\]/ \> Documentos/

- Tickets/ \> \[Año\]/ \> Ingresos/Facturas/ y Gastos/Recibos/

  13.1 Funciones de Subida

- **uploadImg():** Sube imágenes de vehículos a la carpeta Fotos

- **uploadDoc():** Sube documentos a la carpeta Documentos

- **subirFacturaADrive():** Sube facturas a la subcarpeta Facturas

- **getOrCreateFolder():** Busca o crea carpetas automáticamente

Todos los archivos subidos reciben permisos públicos y sus URLs se convierten al formato lh3.googleusercontent.com para servir imágenes.

14\. Funcionalidades Transversales

14.1 Soporte Bilingüe

Todo el contenido orientado al usuario final tiene campos separados para español e inglés: nombres de subcategorías, filtros, ubicaciones, descripciones, texto del banner.

14.2 Sistema de Badges

Contadores visuales en la navegación que se actualizan al cargar datos:

- Rojo: elementos urgentes/nuevos (badgeAnunciantes, badgeSolicitantes, badgeChat)

- Las categorías colapsables muestran el total agregado de sus subitems

- Las tarjetas del dashboard cambian de estilo cuando hay pendientes

  14.3 Notificaciones Toast

Sistema de notificaciones temporales en la esquina inferior derecha:

- Success (verde): operaciones completadas correctamente

- Error (rojo): fallos en operaciones

- Info (azul oscuro): mensajes informativos

Animación de entrada slideIn y desaparición automática.

14.4 Confirmaciones de Seguridad

- Borrar: modal que requiere escribir \'Borrar\' exactamente

- Restaurar: modal que requiere escribir \'Restaurar\' exactamente

- Validación de fila (row \>= 2) antes de cualquier eliminación para proteger cabeceras

  14.5 Normalización de Estados

Función que normaliza abreviaturas de estado: \'pub\' → publicado, \'ocul\' → oculto, \'inact\' → inactivo, etc.

14.6 Formato de Datos

- **Números:** Separador de miles (formatNumber)

- **Fechas:** Formato localizado (fmtDate)

- **URLs de Drive:** Conversión a formato lh3.googleusercontent.com para imágenes

- **Moneda:** Formato con símbolo €

  14.7 Caché Local

Objeto cache global que almacena arrays para todas las hojas (vehiculos, subcategorias, filtros, anunciantes, solicitantes, noticias, comentarios, usuarios, suscripciones, historico, balance, intermediacion, ojeados, tabla_config). Los datos se cargan al inicio y se actualizan tras cada operación.

14.8 Responsive Design

- Grid adaptable para estadísticas (5 → 3 → 2 columnas)

- Sidebar colapsable

- Tablas con scroll horizontal

- PWA-ready con manifest y meta tags para móvil

15\. Resumen de Modales

---

**Modal** **Función** **Confirmación**

modalVehiculo Crear/editar vehículo con todos los datos Guardar

modalIntermediacion Crear/editar vehículo de intermediación Guardar

modalOjeado Crear/editar producto ojeado Guardar

modalTransaccion Registrar alquiler o venta de vehículo Guardar

modalBalance Crear/editar transacción financiera Guardar

modalSubcat Crear/editar subcategoría Guardar

modalFiltro Crear/editar filtro Guardar

modalConfirm Confirmar eliminación Escribir \'Borrar\'

modalRestaurar Restaurar vehículo del histórico Escribir \'Restaurar\'

modalExportar Exportar vehículos Exportar

modalExportarBalance Exportar balance Exportar

modalExportarResumen Exportar resumen financiero Exportar

modalExportarHistorico Exportar histórico Exportar

modalExportarInter Exportar intermediación Exportar

modalExportarOjeados Exportar ojeados Exportar

modalConfigTabla Configurar columnas y grupos de tabla Guardar

modalFactura Generar factura PDF Generar PDF

---

16\. Funcionalidades Pendientes / En Desarrollo

- Posts: sección de blog marcada como \'En desarrollo\' - estructura HTML presente pero sin lógica de creación

- Chat en tiempo real: actualmente requiere refresco manual (botón \'Refrescar\')

- Chart.js: librería importada pero sin gráficos implementados visiblemente



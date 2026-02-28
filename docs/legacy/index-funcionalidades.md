> ⚠️ **[LEGACY]** Documento histórico — solo referencia. No modificar ni usar como fuente de verdad. Ver `docs/tracciona-docs/` para documentación activa.

> **DOCUMENTO HISTORICO.** Este documento es referencia del diseno original. La fuente de verdad actual es [`README-PROYECTO.md`](../../README-PROYECTO.md) y [`INSTRUCCIONES-MAESTRAS.md`](../tracciona-docs/INSTRUCCIONES-MAESTRAS.md).

**TANK IBERICA**

Plataforma Pública de Vehículos

**Documentación Funcional Completa**

index.html --- Single Page Application (SPA)

12.788 líneas • Vanilla JavaScript • Google Sheets API v4

Generado: 31 de enero de 2026

Índice

1\. Visión General del Sistema

2\. Arquitectura Técnica

3\. Sistema de Diseño (Design Tokens)

4\. Header (Cabecera Fija)

5\. Banner de Anuncios

6\. Categorías

7\. Subcategorías

8\. Sistema de Filtros

9\. Controles del Catálogo

10\. Catálogo / Rejilla de Vehículos

11\. Modal de Detalle del Vehículo

12\. Modal de Contacto

13\. Modal de Cuenta / Autenticación

14\. Modal Anúnciate (Formulario del Anunciante)

15\. Modal Solicitar (Formulario de Demanda)

16\. Modal Dev (Desarrollo)

17\. Sistema de Favoritos

18\. Footer

19\. Secciones Noticias, Sobre Nosotros, Legal

20\. Modal de Suscripción

21\. Chat con Admin (Lado Usuario)

22\. Sistema Bilingüe (ES/EN)

23\. Diseño Responsivo

24\. Integraciones y Fuentes de Datos

25\. Resumen de Modales

26\. Funcionalidades Pendientes

1\. Visión General del Sistema

index.html es la aplicación pública (Single Page Application) de Tank Iberica, un marketplace de vehículos industriales. El archivo completo contiene 12.788 líneas de código incluyendo HTML, CSS y JavaScript en un único fichero sin dependencias de frameworks externos.

La aplicación permite a los usuarios navegar, filtrar y buscar vehículos industriales disponibles para alquiler, venta o de terceros. También ofrece formularios para anunciantes y solicitantes, sistema de favoritos, chat con administrador y soporte bilingüe completo español/inglés.

---

**Elemento** **Detalle**

Tecnología Vanilla JavaScript (ES6+), CSS Grid/Flexbox, HTML5

Líneas de código 12.788 líneas (HTML + CSS + JS en un solo archivo)

Backend Google Sheets API v4 (SHEET_ID: 1GdmirqWFKVt39QvEJxdMH3zW0-itl64YuqYEsOAkF30)

Almacenamiento imágenes Google Drive API v3

Autenticación Google OAuth 2.0 (CLIENT_ID: 928575\...0a)

PWA Manifest.json, service worker compatible, instalable

Responsivo Mobile-first con breakpoints: 360, 480, 768, 1024 px

Idiomas Español (ES) e Inglés (EN) con cambio dinámico

---

2\. Arquitectura Técnica

2.1 Estructura del Archivo

Todo el código reside en un único archivo index.html organizado en tres bloques principales:

- Líneas 1--6086: Estilos CSS (incluyendo media queries responsivas)

- Líneas 6087--7200: Estructura HTML (header, main, modales, footer)

- Líneas 7200--12788: JavaScript (lógica de negocio, APIs, eventos)

  2.2 Fuentes de Datos (Google Sheets)

La aplicación consume datos de múltiples hojas de un mismo libro de Google Sheets:

---

**Hoja** **Contenido** **Uso**

vehiculos Inventario de vehículos Catlogo principal, filtrado, detalle

subcategorias Definiciones de subcategorías Navegación por tipo de vehículo

filtros Configuración de filtros dinámicos Filtros avanzados por subcategoría

anunciantes Envíos del formulario Anúnciate Recepción de anuncios de terceros

solicitantes Envíos del formulario Solicitar Demandas de compradores

usuarios Cuentas de usuario Autenticación y perfil

suscripciones Suscripciones a newsletter Gestión de boletines

noticias Artículos de noticias Sección de noticias (en desarrollo)

comentarios Comentarios de usuarios Sistema de comentarios en noticias

---

2.3 Almacenamiento Local

Se utiliza localStorage para persistir preferencias del usuario entre sesiones:

- Idioma seleccionado (ES/EN)

- Lista de favoritos (requiere autenticación para persistencia server-side)

- Preferencia de vista (grid/lista)

- Estado de sesión del usuario

3\. Sistema de Diseño (Design Tokens)

El sistema de diseño se basa en custom properties CSS documentadas en DESIGN_SYSTEM.md. Los colores, tipografía y espaciado mantienen coherencia visual en toda la aplicación.

3.1 Paleta de Colores

---

**Token** **Valor** **Uso**

\--ds-petrol-blue #0F2A2E Color primario, fondos header, botones activos

\--ds-white #FFFFFF Fondo principal, texto sobre oscuro

\--ds-text-dark-primary #E6ECEC Texto principal sobre fondo oscuro

\--ds-text-dark-secondary #C9D4D4 Texto secundario sobre fondo oscuro

\--ds-text-dark-auxiliary #9FB1B1 Texto auxiliar sobre fondo oscuro

\--ds-text-dark-accent #7FD1C8 Acentos sobre fondo oscuro

\--ds-text-light-primary #1F2A2A Texto principal sobre fondo claro

\--ds-text-light-secondary #4A5A5A Texto secundario sobre fondo claro

\--ds-text-light-accent #0F2A2E Acentos sobre fondo claro

---

3.2 Tipografía

---

**Elemento** **Detalle**

Familia Inter (Google Fonts)

Tamaño base 18px (1rem)

Peso por defecto 400 (Regular)

Interlineado 1.6

Escalas heading H1: 36pt, H2: 28pt, H3: 24pt

---

4\. Header (Cabecera Fija)

El header es un elemento fijo (position: fixed) con z-index 1000, siempre visible en la parte superior. Contiene la identidad de marca, navegación de contacto, selector de idioma y acceso a cuenta.

4.1 Estructura del Header

---

**Elemento** **Detalle**

Posición Fixed, top: 0, z-index: 1000

Fondo Petrol blue (#0F2A2E)

Logo \"TANK IBERICA\" (clickable, vuelve al catálogo)

Estado scroll Reduce padding y tamaño de iconos al hacer scroll

Banner-aware Ajusta top cuando el banner de anuncios está activo

---

4.2 Contacto y Redes (Desktop)

En escritorio, el header muestra iconos directos para cada canal de contacto: Email (mailto), Teléfono (tel:), WhatsApp (wa.me), LinkedIn y Facebook. Cada uno abre su respectivo enlace nativo.

4.3 Menús Móviles

En móvil, los iconos se agrupan en dos menús desplegables:

- Icono Smartphone: despliega Email, Teléfono, WhatsApp

- Icono Globo: despliega WhatsApp, LinkedIn, Facebook

  4.4 Selector de Idioma

- Desktop: botones ES/EN con clase active

- Móvil: bandera del idioma actual, despliega la alternativa con flagcdn.com

  4.5 Botón de Cuenta

Botón \"Mi cuenta\" / \"My account\" con icono de usuario SVG. Al pulsar, abre el modal de autenticación. Si el usuario ya está autenticado, muestra su nombre.

5\. Banner de Anuncios

Banner opcional que aparece debajo del header con un gradiente dorado (#D4A017 a #B8860B). Controlado desde el panel de administración.

---

**Elemento** **Detalle**

Z-index 1001 (por encima del header)

Fondo Gradiente dorado (#D4A017 → #B8860B)

Contenido Texto bilingüe con URL opcional

Cierre Botón ×, descartable por el usuario

Programación Campos desde/hasta para activación temporal

Efecto en layout Ajusta padding del body y posición del header

---

6\. Categorías

Barra horizontal de selección múltiple con scroll. Permite filtrar el catálogo por tipo de operación comercial.

6.1 Categorías Disponibles

---

**Categoría** **Texto ES** **Texto EN**

alquiler Alquiler Rental

venta Venta Sale

terceros Terceros Third Party

anunciate Anúnciate Advertise

---

6.2 Comportamiento

- Multi-selección: se pueden activar Alquiler, Venta y Terceros simultáneamente

- Estado activo: fondo petrol-blue, texto blanco

- \"Anúnciate\" abre el modal de formulario del anunciante (no filtra el catálogo)

- Botones de scroll (◀ ▶) aparecen cuando hay overflow horizontal

- En móvil: todas visibles en formato compacto

7\. Subcategorías

Barra dinámica de subcategorías cargada desde la hoja \'subcategorias\' de Google Sheets. Se actualiza automáticamente según las categorías activas.

7.1 Características

- Contenido dinámico: subcategorías cargadas desde Google Sheets

- Filtrado por categorías activas

- Selección única dentro del contexto de categoría

- Estado activo: fondo blanco, texto petrol-blue

- Texto en mayúsculas (desktop), normal (móvil)

- Botones de scroll para overflow

- Al seleccionar, actualiza filtros dinámicos y el catálogo

8\. Sistema de Filtros

El sistema de filtros combina filtros estáticos (siempre visibles) con filtros dinámicos cargados desde Google Sheets, adaptados a cada subcategoría.

8.1 Filtros Estáticos

---

**Filtro** **Tipo** **Rango / Opciones**

Precio Dual-range slider 0€ -- 200.000€ (paso: 100€)

Marca Dropdown Scania, Volvo, Mercedes, MAN, DAF, Iveco, Renault

Año Dual-range slider 1900 -- 2024

---

8.2 Filtros Dinámicos

Cargados desde la hoja \'filtros\' de Google Sheets. Solo se muestran los que tienen estado \"publicado\" y corresponden a la subcategoría activa. Soportan etiquetas bilingües y unidades de medida.

---

**Tipo** **Componente UI** **Descripción**

caja Input de texto Campo de texto libre

desplegable Select dropdown Lista de opciones únicas

desplegable_tick Dropdown con checkboxes Selección múltiple en dropdown

tick Grupo de checkboxes Opciones de marcado múltiple

slider Range slider Valor numérico con rango

calc Campo calculado Valor derivado de otros filtros

---

8.3 Filtros Extra y Ocultos

- Filtros Extra: visibilidad condicional basada en otras selecciones

- Filtros Ocultar: ocultos en la vista principal del usuario

- Ambos tipos se controlan mediante campos específicos en la hoja de Google Sheets

  8.4 Indicadores Visuales

- Fade en los bordes cuando hay contenido fuera de vista (scroll)

- Alineación responsiva con el padding del header

9\. Controles del Catálogo

Barra sticky de controles que permanece visible al hacer scroll. Permite gestionar la visualización, búsqueda y ordenación del catálogo.

9.1 Grupo Izquierdo

- Botón Menú: toggle de visibilidad de categorías, subcategorías y filtros. Desktop muestra texto \"Menú\" + icono ojo; móvil solo icono.

- Buscador: input de texto en desktop; icono + dropdown en móvil. Búsqueda en marca, modelo y descripción. Tiempo real, case-insensitive.

  9.2 Grupo Central

- Contador de resultados: \"X vehículos\" / \"X vehicles\"

- Botón Solicitar: abre el modal de demanda del comprador

  9.3 Grupo Derecho

- Favoritos: icono corazón con badge contador

- Vista: toggle grid/lista

- Ordenar: dropdown con 6 opciones

  9.4 Opciones de Ordenación

---

**Elemento** **Detalle**

Precio ↑ Precio ascendente (menor a mayor)

Precio ↓ Precio descendente (mayor a menor)

Año ↑ Año ascendente (más antiguo primero)

Año ↓ Año descendente (más nuevo primero)

Marca A-Z Marca alfabética ascendente

Marca Z-A Marca alfabética descendente

---

10\. Catálogo / Rejilla de Vehículos

10.1 Vista Grid (por defecto)

Distribución responsiva de tarjetas en cuadrícula:

---

**Elemento** **Detalle**

Desktop (\>1024px) 4 columnas

Tablet (768--1024px) 3 columnas

Móvil (480--768px) 2 columnas

Móvil pequeño (\<480px) 1 columna

---

10.2 Componentes de la Tarjeta

- Carrusel de imágenes con indicadores (dots)

- Badges de categoría (Alquiler/Venta/Terceros)

- Título: marca + modelo

- Año y ubicación

- Precio (venta o alquiler/mes)

- Botón favorito (corazón)

- Botón \"Ver detalles\"

- Hover: elevación y sombra

- Lazy loading para imágenes

  10.3 Vista Lista

Formato de tabla con columnas ordenables: Imagen, Marca, Modelo, Año, Precio, Ubicación, Categoría y Acciones. Click en fila abre el modal de detalle. Scroll horizontal en móvil.

10.4 Lógica de Filtrado

- Multi-categoría: muestra vehículos que coincidan con CUALQUIER categoría activa (OR)

- Subcategoría: filtra dentro de categorías activas

- Precio/Año: filtrado por rango

- Marca: coincidencia exacta

- Filtros dinámicos: lógica específica por tipo

- Modo \"Solo Alquiler\": manejo especial para vista exclusiva de alquiler

11\. Modal de Detalle del Vehículo

Superposición a pantalla completa (overlay) con dos secciones principales: galería de imágenes y panel de información.

11.1 Galería (Izquierda / Superior)

- Imagen principal grande

- Tira de miniaturas (scroll horizontal)

- Flechas de navegación (← →)

- Indicadores (dots) de imagen actual

- Click en miniatura cambia imagen principal

  11.2 Panel de Información (Derecha / Inferior)

- Título + Precio (misma línea)

- Badge de categoría + Ubicación

- Disclaimer para categoría \"Terceros\"

- Grid de características (3 columnas, responsivo)

- Descripción bilingüe

- Botón Contactar (abre modal contacto)

- Botón Favorito

- Botón Compartir (copia URL al portapapeles)

  11.3 Cierre y Layout

- Botón ×: esquina superior derecha (desktop), centro superior (móvil)

- Contenido scrollable con scrollbar oculta

12\. Modal de Contacto

Modal con 3 opciones de contacto directo, cada una con icono SVG grande y datos de contacto.

---

**Elemento** **Detalle**

Email Enlace mailto con referencia del vehículo en asunto/cuerpo

Teléfono Enlace tel: para llamada directa

WhatsApp Enlace wa.me con mensaje pre-rellenado incluyendo referencia del vehículo

---

Efectos hover y botón de cierre (×).

13\. Modal de Cuenta / Autenticación

Título: \"Accede o Regístrate\" / \"Log In or Register\". Ofrece 5 proveedores de autenticación en iconos circulares.

13.1 Proveedores

---

**Proveedor** **Icono** **Método**

Google Logo coloreado (4 colores) OAuth 2.0

Apple Logo negro Sign in with Apple

Microsoft Logo Windows Microsoft Identity

Teléfono Icono teléfono SMS/OTP

Email Icono sobre Enlace mágico / código

---

13.2 Layout

- Grid: 5 columnas (desktop) → 3 (tablet) → 2 (móvil)

- Hover: elevación, escala, cambio de color de borde

- Divisor: \"o continúa con\" / \"or continue with\"

- Campos de input (ocultos hasta seleccionar proveedor)

14\. Modal Anúnciate (Formulario del Anunciante)

Formulario extenso en grid de 4 columnas (responsivo: 2 tablet, 1 móvil) para que terceros publiquen sus vehículos.

14.1 Secciones del Formulario

---

**Elemento** **Detalle**

Información del Vehículo Marca, modelo, año, matrícula, km, precio

Ubicación Provincia, localidad

Características Subcategoría, combustible, potencia, ejes, capacidad

Fotos Upload area (máx 10), drag-drop, preview grid, botón eliminar

Contacto Nombre, email, teléfono, preferencia de contacto

Aceptación Checkbox de términos y condiciones

---

14.2 Subida de Fotos

- Area de carga con borde punteado

- Icono + texto de instrucciones

- Recomendaciones: formato, tamaño, calidad

- Preview grid con botón de eliminar individual

- Selección múltiple de archivos

- Máximo 10 fotos por anuncio

  14.3 Validación

- Campos obligatorios marcados con \*

- Validación de formato email

- Validación de formato teléfono

- Aceptación de términos requerida

- Botón submit centrado, max-width 300px

15\. Modal Solicitar (Formulario de Demanda)

Formulario para compradores que buscan vehículos específicos. Grid de 4 columnas, misma estructura responsiva que Anúnciate.

15.1 Secciones

---

**Elemento** **Detalle**

Tipo de Vehículo Subcategoría, marca preferida

Especificaciones Año (dual slider 1900--2024), precio (dual slider 0--200k€), km máximo

Características Deseadas Combustible, potencia, ejes, capacidad (opcionales)

Uso Previsto Textarea para descripción libre

Contacto Nombre, email, teléfono

Preferencia de Contacto Checkboxes: Email, Teléfono, WhatsApp

Aceptación Checkbox de términos

---

15.2 Dual-Range Sliders

Los sliders de Año y Precio utilizan dos thumbs (mínimo y máximo) con feedback visual: valores mostrados encima del slider, fondo gris para el track y thumbs en petrol-blue.

16\. Modal Dev (Desarrollo)

Modal informativo para funcionalidades en desarrollo. Muestra el título \"Funcionalidad en Desarrollo\" con una explicación del estado. Incluye un campo de email para suscribirse a notificaciones de lanzamiento y botón de envío.

17\. Sistema de Favoritos

---

**Elemento** **Detalle**

Icono Corazón en tarjetas del catálogo y modal de detalle

Contador Badge numérico en el botón de favoritos del toolbar

Almacenamiento localStorage (persistencia server-side requiere autenticación)

Toggle Click alterna añadir/quitar

Sin sesión Muestra notificación: \"Debes iniciar sesión para guardar favoritos\"

Acción notif. Botón Login que abre modal de cuenta

---

18\. Footer

Pie de página con información corporativa, enlaces de navegación y redes sociales. Declarado en JavaScript a partir de la línea \~10395.

---

**Elemento** **Detalle**

Empresa Tank Iberica S.L.

Enlaces Noticias, Sobre Nosotros, Legal, Contacto

Redes Sociales Iconos SVG con enlaces externos

Newsletter Formulario de suscripción

Copyright Aviso legal de derechos

Responsivo Layout apilado en móvil

---

19\. Secciones Noticias, Sobre Nosotros, Legal

Tres secciones con estructura similar: overlay a página completa, activadas desde el footer. Ocultan el catálogo, categorías, subcategorías y filtros cuando están activas (mediante :has() CSS).

19.1 Noticias

- Activada vía enlace del footer

- Header con botón atrás + título

- Estado: \"En desarrollo\" (placeholder)

- Estructura de datos preparada: id, title, date, category, image, content, hashtags

- Sistema de comentarios con respuestas anidadas

- Filtrado por hashtags

- Modal de detalle de noticia

  19.2 Sobre Nosotros

- Placeholder: \"Información sobre Tank Iberica\"

- Estructura básica con header y contenido

  19.3 Legal

- Placeholder: \"Información legal\"

- Misma estructura que Sobre Nosotros

20\. Modal de Suscripción

Formulario de suscripción a newsletter con campo email y checkboxes de preferencias.

Preferencias Disponibles

- Web

- Prensa

- Boletín

- Destacados

- Eventos

- Responsabilidad

Botón de envío y cierre (×).

21\. Chat con Admin (Lado Usuario)

Sistema de mensajería integrado para comunicación directa con el administrador. Declarado a partir de la línea \~11977.

---

**Elemento** **Detalle**

Ubicación Botón flotante esquina inferior derecha

Ventana Lista de conversaciones + vista de mensajes

Envío Campo de texto + botón enviar

Indicadores Mensajes no leídos

Actualización Manual (refresh) --- tiempo real pendiente

Requisito Autenticación de usuario requerida

---

22\. Sistema Bilingüe (ES/EN)

Todos los elementos de texto utilizan atributos data-es y data-en para almacenar traducciones. El cambio de idioma actualiza dinámicamente todo el contenido visible.

22.1 Mecanismo

- Atributos HTML: data-es=\"texto español\" data-en=\"english text\"

- Función de traducción recorre todos los elementos con estos atributos

- Idioma almacenado en localStorage

- Selector de idioma en header (desktop: botones, móvil: banderas)

  22.2 Alcance

- Labels, botones, placeholders de formularios

- Títulos de modales y secciones

- Mensajes de sistema y notificaciones

- Categorías y subcategorías

- Opciones de filtros

- Descripciones de vehículos

23\. Diseño Responsivo

Enfoque mobile-first con 4 breakpoints principales. Requisito crítico P0-01: sin scroll horizontal.

23.1 Breakpoints

---

**Breakpoint** **Dispositivo** **Columnas Grid** **Adaptaciones Clave**

360px Móvil crítico 1 Sin scroll horizontal, padding mínimo

480px Móvil pequeño 1--2 Botones 28px, fuentes reducidas

768px Tablet 2--3 Formularios 2 col, menús dropdown

1024px Desktop 3--4 Layout completo, texto + iconos

---

23.2 Adaptaciones Principales

- Header: iconos colapsados en menús desplegables; logo más pequeño

- Controles catálogo: solo iconos sin texto; botones 28--32px

- Tarjetas: columnas reducidas progresivamente

- Modales: full-width en móvil; formularios 1 columna

- Filtros: scroll horizontal con fade indicators

- Touch targets: mínimo 32×32px

- Detail modal: galería full-width arriba, info abajo

24\. Integraciones y Fuentes de Datos

24.1 Google Sheets API v4

Fuente principal de datos. Todas las lecturas y escrituras de datos pasan por la API de Sheets usando el SHEET_ID compartido con el panel de administración.

24.2 Google Drive API v3

Almacenamiento de imágenes de vehículos. Las URLs de Drive se convierten a formato lh3.googleusercontent.com para visualización directa. Soporte de lazy loading.

24.3 Google OAuth 2.0

Autenticación de usuarios. CLIENT_ID configurado: 928575372421-rlq17ptufeppbkqs1a26o0pb97pfut0a.apps.googleusercontent.com. Múltiples proveedores: Google, Apple, Microsoft, Teléfono, Email.

24.4 Servicios Externos

---

**Elemento** **Detalle**

flagcdn.com Imágenes de banderas para selector de idioma

wa.me Links directos a WhatsApp

mailto: Composición de emails con datos del vehículo

tel: Llamadas directas

---

25\. Resumen de Modales

La aplicación utiliza un sistema de modales con overlay (rgba(0,0,0,0.7)), z-index 2000+, cierre con botón × y contenido scrollable.

---

**Modal** **ID** **Contenido** **Trigger**

Detalle Vehículo vehicleDetailModal Galería + info completa del vehículo Click \"Ver detalles\" / fila lista

Contacto contactModal 3 opciones: Email, Teléfono, WhatsApp Botón contactar en detalle

Cuenta accountModal 5 proveedores de autenticación Botón \"Mi cuenta\"

Anúnciate advertiseModal Formulario completo para anunciantes Categoría \"Anúnciate\"

Solicitar demandModal Formulario de demanda del comprador Botón \"Solicitar\"

Dev devModal Info de funcionalidad en desarrollo Funciones no implementadas

Favoritos favNotification Aviso para iniciar sesión Favorito sin autenticación

Suscripción subscribeModal Newsletter con preferencias Enlace en footer

---

26\. Funcionalidades Pendientes

Las siguientes funcionalidades están preparadas estructuralmente pero aún no están completamente implementadas:

---

**Elemento** **Detalle**

Sección de Noticias Marcada \"En desarrollo\". Estructura de datos preparada con sistema de comentarios y hashtags.

Sección Sobre Nosotros Placeholder con contenido pendiente.

Sección Legal Placeholder con contenido pendiente.

Chat tiempo real Actualmente con refresco manual. Falta implementación WebSocket/polling.

Service Worker Referenciado en manifest pero no implementado aún.

Modo Offline PWA preparada pero requiere service worker funcional.

Notificaciones Push Infraestructura lista, implementación pendiente.

Moderación de comentarios Solo accesible desde panel admin, no desde interfaz pública.

---

_Fin del documento --- Tank Iberica --- Documentación Funcional index.html_

> **DOCUMENTO HISTORICO.** Este documento es referencia del diseno original. La fuente de verdad actual es [`README-PROYECTO.md`](../../README-PROYECTO.md) y [`INSTRUCCIONES-MAESTRAS.md`](../tracciona-docs/INSTRUCCIONES-MAESTRAS.md).

# Tank Iberica — Inventario completo de elementos UI

## PARTE 1: WEB PUBLICA

### Layout — AppHeader

| #   | Elemento             | Tipo  | Proposito                  |
| --- | -------------------- | ----- | -------------------------- |
| 1   | Logo "TANK IBERICA"  | Link  | Ir a inicio                |
| 2   | Boton "Anunciate"    | Boton | Abre AdvertiseModal        |
| 3   | Icono sobre          | Boton | Mailto contacto            |
| 4   | Icono telefono       | Boton | Tel contacto               |
| 5   | Icono WhatsApp       | Boton | Enlace WhatsApp            |
| 6   | Icono LinkedIn       | Boton | Red social                 |
| 7   | Icono Facebook       | Boton | Red social                 |
| 8   | Boton globo (mobile) | Boton | Desplegable redes sociales |
| 9   | Bandera ES           | Boton | Cambiar a espanol          |
| 10  | Bandera GB           | Boton | Cambiar a ingles           |
| 11  | Boton usuario        | Boton | Abre UserPanel o AuthModal |

### Layout — AppFooter

| #   | Elemento                 | Tipo    | Proposito                                         |
| --- | ------------------------ | ------- | ------------------------------------------------- |
| 12  | Seccion "Comunicaciones" | Seccion | Links: Noticias, Newsletters, Destacados, Eventos |
| 13  | Seccion "Sobre Nosotros" | Seccion | Links: Quienes somos, Mision, Equipo              |
| 14  | Seccion "Legal"          | Seccion | Links: Terminos, Privacidad, Cookies              |
| 15  | Imagen Kit Digital       | Imagen  | Banner Cloudinary                                 |
| 16  | Texto copyright          | Texto   | Pie legal                                         |
| 17  | Link Admin               | Link    | Solo visible para admins                          |

### Layout — AnnounceBanner

| #   | Elemento        | Tipo  | Proposito                  |
| --- | --------------- | ----- | -------------------------- |
| 18  | Texto dinamico  | Texto | Mensaje desde tabla config |
| 19  | Link "Mas info" | Link  | Enlace opcional            |
| 20  | Boton X         | Boton | Cerrar banner              |

### Catalogo — CategoryBar

| #   | Elemento         | Tipo  | Proposito             |
| --- | ---------------- | ----- | --------------------- |
| 21  | Flecha izquierda | Boton | Scroll categorias     |
| 22  | Boton "Alquiler" | Boton | Filtrar por categoria |
| 23  | Boton "Venta"    | Boton | Filtrar por categoria |
| 24  | Boton "Terceros" | Boton | Filtrar por categoria |
| 25  | Flecha derecha   | Boton | Scroll categorias     |

### Catalogo — SubcategoryBar

| #   | Elemento              | Tipo  | Proposito                                     |
| --- | --------------------- | ----- | --------------------------------------------- |
| 26  | Botones subcategoria  | Boton | Dinamicos desde BD — seleccionar subcategoria |
| 27  | Separador ">"         | Texto | Jerarquia visual                              |
| 28  | Botones tipo (dashed) | Boton | Dinamicos desde BD — seleccionar tipo         |

### Catalogo — FilterBar

| #   | Elemento                           | Tipo           | Proposito                         |
| --- | ---------------------------------- | -------------- | --------------------------------- |
| 29  | Boton reset (icono refresh)        | Boton          | Limpiar todos los filtros         |
| 30  | Dropdown ubicacion (icono pin)     | Dropdown       | Filtro pais/provincia/rango       |
| 31  | Dropdown pais                      | Dropdown       | Filtro de pais                    |
| 32  | Dropdown provincia                 | Dropdown       | Filtro de provincia               |
| 33  | Botones Nacional/Internacional     | Boton          | Rango de ubicacion                |
| 34  | Slider precio                      | Slider         | Rango de precio                   |
| 35  | Dropdown marca                     | Dropdown       | Filtro de marca                   |
| 36  | Slider ano                         | Slider         | Rango de ano                      |
| 37  | Boton "Filtros avanzados" (mobile) | Boton          | Abre bottom sheet de filtros      |
| 38  | Bottom sheet (mobile)              | Emergente      | Contenedor filtros en movil       |
| 39  | Filtro tipo desplegable            | Dropdown       | Dinamico desde filter_definitions |
| 40  | Filtro tipo desplegable_tick       | Dropdown+Check | Dinamico desde filter_definitions |
| 41  | Filtro tipo caja                   | Input texto    | Dinamico desde filter_definitions |
| 42  | Filtro tipo slider                 | Slider         | Dinamico desde filter_definitions |
| 43  | Filtro tipo calc                   | Input numero   | Dinamico desde filter_definitions |
| 44  | Filtro tipo tick                   | Checkbox       | Dinamico desde filter_definitions |

### Catalogo — ControlsBar

| #   | Elemento                        | Tipo          | Proposito                  |
| --- | ------------------------------- | ------------- | -------------------------- |
| 45  | Boton ojo (abierto/cerrado)     | Boton         | Mostrar/ocultar menu       |
| 46  | Input busqueda (icono lupa)     | Input         | Buscar vehiculos por texto |
| 47  | Boton X                         | Boton         | Limpiar busqueda           |
| 48  | Botones Alquiler/Venta/Terceros | Boton         | Filtro rapido categoria    |
| 49  | Boton estrella                  | Boton         | Filtrar solo favoritos     |
| 50  | Boton grid (icono cuadricula)   | Boton         | Vista cuadricula           |
| 51  | Boton lista (icono lista)       | Boton         | Vista tabla                |
| 52  | Boton ordenar                   | Boton         | Abre dropdown de orden     |
| 53  | Item: Recomendado               | Dropdown item | Orden por defecto          |
| 54  | Item: Precio asc                | Dropdown item | Precio bajo a alto         |
| 55  | Item: Precio desc               | Dropdown item | Precio alto a bajo         |
| 56  | Item: Ano asc                   | Dropdown item | Ano antiguo a nuevo        |
| 57  | Item: Ano desc                  | Dropdown item | Ano nuevo a antiguo        |
| 58  | Item: Marca A-Z                 | Dropdown item | Marca alfabetico           |
| 59  | Item: Marca Z-A                 | Dropdown item | Marca inverso              |

### Catalogo — VehicleCard (por vehiculo)

| #   | Elemento                        | Tipo      | Proposito                 |
| --- | ------------------------------- | --------- | ------------------------- |
| 60  | Imagen principal                | Imagen    | Foto del vehiculo         |
| 61  | Flecha izquierda                | Boton     | Foto anterior             |
| 62  | Flecha derecha                  | Boton     | Foto siguiente            |
| 63  | Puntos indicadores              | Indicador | Posicion en galeria       |
| 64  | Boton estrella                  | Boton     | Toggle favorito           |
| 65  | Badge precio                    | Badge     | Precio en EUR             |
| 66  | Badge categoria                 | Badge     | Alquiler/Venta/Terceros   |
| 67  | Badge ubicacion (pin + bandera) | Badge     | Ciudad + pais             |
| 68  | Titulo (heading)                | Texto     | Nombre del vehiculo       |
| 69  | Badge dorado "Destacado"        | Badge     | Si es featured            |
| 70  | Banner amarillo terceros        | Banner    | Disclaimer intermediacion |
| 71  | Texto ano                       | Texto     | Especificacion            |
| 72  | Texto precio alquiler           | Texto     | Si aplica                 |

### Catalogo — VehicleTable (vista lista)

| #   | Elemento                       | Tipo       | Proposito                       |
| --- | ------------------------------ | ---------- | ------------------------------- |
| 73  | Boton exportar PDF             | Boton      | Descargar tabla en PDF          |
| 74  | Checkbox "Seleccionar todos"   | Checkbox   | Marcar todos para exportar      |
| 75  | Columna Imagen                 | Col. tabla | Sortable                        |
| 76  | Columna Categoria              | Col. tabla | Sortable                        |
| 77  | Columna Precio                 | Col. tabla | Sortable                        |
| 78  | Columna Producto               | Col. tabla | Sortable                        |
| 79  | Columna Ano                    | Col. tabla | Sortable                        |
| 80  | Columna Volumen                | Col. tabla | Sortable                        |
| 81  | Columna Compartimentos         | Col. tabla | Sortable                        |
| 82  | Columna Potencia               | Col. tabla | Sortable                        |
| 83  | Columna Ubicacion              | Col. tabla | Sortable                        |
| 84  | Checkbox por fila              | Checkbox   | Seleccionar vehiculo            |
| 85  | Thumbnail                      | Imagen     | Miniatura del vehiculo          |
| 86  | Boton ojo                      | Boton      | Ver detalle                     |
| 87  | Boton estrella                 | Boton      | Toggle favorito                 |
| 88  | Boton compartir                | Boton      | Compartir vehiculo              |
| 89  | Boton descargar                | Boton      | Descargar folleto               |
| 90  | Modal confirmacion exportacion | Modal      | Confirmar/cancelar exportar PDF |

### Catalogo — VehicleGrid

| #   | Elemento                     | Tipo     | Proposito            |
| --- | ---------------------------- | -------- | -------------------- |
| 91  | Skeleton cards (x6)          | Skeleton | Placeholder de carga |
| 92  | Estado vacio (icono + texto) | Estado   | "Sin resultados"     |
| 93  | Boton "Limpiar filtros"      | Boton    | Reset filtros        |
| 94  | Boton "Cargar mas"           | Boton    | Paginacion infinita  |

### Ficha vehiculo — vehiculo/[slug].vue

| #   | Elemento                        | Tipo       | Proposito                        |
| --- | ------------------------------- | ---------- | -------------------------------- |
| 95  | Breadcrumb (Home > nombre)      | Navegacion | Ruta de migas                    |
| 96  | Imagen principal galeria        | Imagen     | Foto grande con swipe            |
| 97  | Flechas izq/der galeria         | Boton      | Navegar fotos                    |
| 98  | Contador "X / Y"                | Texto      | Posicion actual                  |
| 99  | Thumbnails (desktop)            | Imagen     | Selector de foto                 |
| 100 | Boton campana (sticky)          | Boton      | Abre DemandModal                 |
| 101 | Boton descargar PDF             | Boton      | Folleto del vehiculo             |
| 102 | Boton sobre (email)             | Boton      | Contacto email                   |
| 103 | Boton telefono                  | Boton      | Contacto telefono                |
| 104 | Boton WhatsApp                  | Boton      | Contacto WhatsApp                |
| 105 | Boton estrella                  | Boton      | Toggle favorito                  |
| 106 | Boton compartir                 | Boton      | Compartir enlace                 |
| 107 | Titulo (heading)                | Texto      | Nombre del vehiculo              |
| 108 | Precio (grande, verde)          | Texto      | Precio en EUR                    |
| 109 | Badge "Destacado"               | Badge      | Si es featured                   |
| 110 | Texto precio alquiler           | Texto      | Si aplica                        |
| 111 | Badge categoria                 | Badge      | Tipo                             |
| 112 | Badge ubicacion (pin + bandera) | Badge      | Ciudad + pais                    |
| 113 | Banner amarillo terceros        | Banner     | Disclaimer intermediacion        |
| 114 | Seccion "Caracteristicas"       | Seccion    | Heading + grid de filtros        |
| 115 | Grid label/valor                | Grid       | Cada caracteristica del vehiculo |
| 116 | Seccion "Descripcion"           | Seccion    | Heading + texto descriptivo      |

### Noticias — Listado (noticias/index.vue)

| #   | Elemento                 | Tipo     | Proposito                    |
| --- | ------------------------ | -------- | ---------------------------- |
| 117 | Titulo pagina "Noticias" | Texto    | Heading                      |
| 118 | Boton "Todas"            | Boton    | Mostrar todas las categorias |
| 119 | Boton "Prensa"           | Boton    | Filtro categoria             |
| 120 | Boton "Eventos"          | Boton    | Filtro categoria             |
| 121 | Boton "Destacados"       | Boton    | Filtro categoria             |
| 122 | Boton "General"          | Boton    | Filtro categoria             |
| 123 | Skeleton cards (x6)      | Skeleton | Placeholder carga            |
| 124 | Card noticia (link)      | Card     | Navegar al articulo          |
| 125 | Imagen articulo          | Imagen   | Foto o placeholder           |
| 126 | Badge categoria          | Badge    | Categoria del articulo       |
| 127 | Titulo articulo          | Texto    | Heading dinamico             |
| 128 | Fecha publicacion        | Texto    | Fecha formateada             |
| 129 | Boton "Cargar mas"       | Boton    | Paginacion                   |

### Noticias — Articulo (noticias/[slug].vue)

| #   | Elemento                 | Tipo       | Proposito              |
| --- | ------------------------ | ---------- | ---------------------- |
| 130 | Breadcrumb               | Navegacion | Ruta de migas          |
| 131 | Badge categoria          | Badge      | Tipo de articulo       |
| 132 | Fecha                    | Texto      | Fecha publicacion      |
| 133 | Titulo (heading)         | Texto      | Titulo del articulo    |
| 134 | Imagen principal         | Imagen     | Foto del articulo      |
| 135 | Contenido HTML           | Texto      | Texto del articulo     |
| 136 | Badges hashtags          | Badge      | Tags del articulo      |
| 137 | Boton WhatsApp compartir | Boton      | Compartir por WhatsApp |
| 138 | Boton email compartir    | Boton      | Compartir por email    |

### Paginas estaticas — Sobre Nosotros

| #   | Elemento               | Tipo       | Proposito                     |
| --- | ---------------------- | ---------- | ----------------------------- |
| 139 | Titulo + 3 links ancla | Navegacion | Quienes Somos, Mision, Equipo |
| 140 | Seccion Quienes Somos  | Seccion    | Heading + texto i18n          |
| 141 | Seccion Mision         | Seccion    | Heading + texto i18n          |
| 142 | Seccion Equipo         | Seccion    | Heading + texto i18n          |

### Paginas estaticas — Legal

| #   | Elemento               | Tipo       | Proposito                     |
| --- | ---------------------- | ---------- | ----------------------------- |
| 143 | Titulo + 3 links ancla | Navegacion | Terminos, Privacidad, Cookies |
| 144 | Seccion Terminos       | Seccion    | Heading + texto i18n          |
| 145 | Seccion Privacidad     | Seccion    | Heading + texto i18n          |
| 146 | Seccion Cookies        | Seccion    | Heading + texto i18n          |

### Paginas estaticas — Confirm

| #   | Elemento                     | Tipo   | Proposito             |
| --- | ---------------------------- | ------ | --------------------- |
| 147 | Icono check + titulo + texto | Estado | Confirmacion de email |
| 148 | Boton "Ir a inicio"          | Boton  | Navegar a home        |

### Modal — AuthModal

| #   | Elemento                     | Tipo  | Proposito             |
| --- | ---------------------------- | ----- | --------------------- |
| 149 | Boton X                      | Boton | Cerrar modal          |
| 150 | Titulo Login/Registro        | Texto | Dinamico segun modo   |
| 151 | Boton Google (logo)          | Boton | OAuth con Google      |
| 152 | Divider "o continuar con"    | Texto | Separador visual      |
| 153 | Input email                  | Input | Campo email           |
| 154 | Input password               | Input | Campo contrasena      |
| 155 | Input confirmar password     | Input | Solo en registro      |
| 156 | Texto error                  | Texto | Errores de validacion |
| 157 | Boton submit                 | Boton | Login o Registro      |
| 158 | Link "No tienes cuenta?"     | Link  | Cambiar a registro    |
| 159 | Link "Ya tienes cuenta?"     | Link  | Cambiar a login       |
| 160 | Link "Olvidaste contrasena?" | Link  | Recuperar             |

### Modal — AdvertiseModal (4 secciones)

| #   | Elemento                                    | Tipo         | Proposito                |
| --- | ------------------------------------------- | ------------ | ------------------------ |
| 161 | Header titulo + subtitulo + X               | Header       | Cabecera modal           |
| 162 | Dropdown subcategoria                       | Dropdown     | Tipo de vehiculo         |
| 163 | Dropdown tipo                               | Dropdown     | Subtipo                  |
| 164 | Filtros dinamicos (6 tipos)                 | Inputs       | Caracteristicas desde BD |
| 165 | Input marca\*                               | Input        | Dato del vehiculo        |
| 166 | Input modelo\*                              | Input        | Dato del vehiculo        |
| 167 | Input ano\*                                 | Input        | Dato del vehiculo        |
| 168 | Input kilometros                            | Input        | Dato del vehiculo        |
| 169 | Input precio\*                              | Input        | Dato del vehiculo        |
| 170 | Input ubicacion\*                           | Input        | Dato del vehiculo        |
| 171 | Textarea descripcion\*                      | Textarea     | Dato del vehiculo        |
| 172 | Upload fotos (drag-drop + icono SVG camara) | Upload       | Min 3, max 6 fotos       |
| 173 | Lista recomendaciones foto                  | Lista        | 5 tips                   |
| 174 | Grid previews fotos + boton X               | Grid         | Previews con eliminar    |
| 175 | Upload ficha tecnica (icono SVG doc)        | Upload       | 1 foto legible           |
| 176 | Preview ficha + nota privacidad             | Imagen+Texto | Privacidad               |
| 177 | Input nombre\*                              | Input        | Contacto                 |
| 178 | Input email\*                               | Input        | Contacto                 |
| 179 | Input telefono\*                            | Input        | Contacto                 |
| 180 | Dropdown preferencia contacto               | Dropdown     | Email/Telefono/WhatsApp  |
| 181 | Checkbox aceptacion                         | Checkbox     | Terminos                 |
| 182 | Resumen validacion (banner rojo)            | Banner       | Errores                  |
| 183 | Boton enviar                                | Boton        | Submit                   |

### Modal — DemandModal

| #   | Elemento                              | Tipo           | Proposito                |
| --- | ------------------------------------- | -------------- | ------------------------ |
| 184 | Header titulo + X                     | Header         | Cabecera                 |
| 185 | Dropdown subcategoria + tipo          | Dropdown       | Tipo vehiculo buscado    |
| 186 | Filtros dinamicos                     | Inputs         | Caracteristicas deseadas |
| 187 | Input marca preferida                 | Input          | Preferencia              |
| 188 | Slider rango ano (desde/hasta)        | Slider         | Rango                    |
| 189 | Slider rango precio (min/max)         | Slider         | Rango                    |
| 190 | Textarea especificaciones             | Textarea       | Requisitos               |
| 191 | Inputs contacto (nombre, email, tel)  | Input          | Datos contacto           |
| 192 | Dropdown preferencia + checkbox terms | Dropdown+Check | Opciones                 |
| 193 | Boton enviar                          | Boton          | Submit                   |

### Modal — SubscribeModal

| #   | Elemento            | Tipo     | Proposito                |
| --- | ------------------- | -------- | ------------------------ |
| 194 | Header titulo + X   | Header   | Cabecera                 |
| 195 | Input email         | Input    | Correo para suscripcion  |
| 196 | Checkbox Web        | Checkbox | Preferencia notificacion |
| 197 | Checkbox Prensa     | Checkbox | Preferencia notificacion |
| 198 | Checkbox Newsletter | Checkbox | Preferencia notificacion |
| 199 | Checkbox Destacados | Checkbox | Preferencia notificacion |
| 200 | Checkbox Eventos    | Checkbox | Preferencia notificacion |
| 201 | Checkbox CSR        | Checkbox | Preferencia notificacion |
| 202 | Boton suscribir     | Boton    | Submit                   |

### Panel — UserPanel (slide-in lateral)

| #   | Elemento                 | Tipo     | Proposito                                                              |
| --- | ------------------------ | -------- | ---------------------------------------------------------------------- |
| 203 | Boton X                  | Boton    | Cerrar panel                                                           |
| 204 | Avatar + nombre + email  | Info     | Datos del usuario                                                      |
| 205 | Acordeon "Perfil"        | Acordeon | Inputs: pseudonimo, nombre, apellidos, telefono, email + boton guardar |
| 206 | Acordeon "Chat"          | Acordeon | Badge no leidos, burbujas mensajes, textarea + boton enviar            |
| 207 | Acordeon "Favoritos"     | Acordeon | Badge contador, link "Ver en catalogo", estado vacio                   |
| 208 | Acordeon "Solicitudes"   | Acordeon | Lista demands con badge estado                                         |
| 209 | Acordeon "Mis Anuncios"  | Acordeon | Lista ads con badge estado                                             |
| 210 | Acordeon "Facturas"      | Acordeon | Estado vacio + info                                                    |
| 211 | Acordeon "Suscripciones" | Acordeon | 6 checkboxes preferencias                                              |
| 212 | Boton "Cerrar sesion"    | Boton    | Logout                                                                 |

---

## PARTE 2: PANEL ADMIN

### Admin Layout — Sidebar

| #   | Elemento                                   | Tipo      | Proposito                                             |
| --- | ------------------------------------------ | --------- | ----------------------------------------------------- |
| 213 | Logo "TI" + texto "Tank Iberica"           | Logo      | Identidad                                             |
| 214 | Boton dropdown empresa                     | Boton     | Menu con "Cerrar sesion"                              |
| 215 | Link "Abrir sitio" (icono externo)         | Link      | Abre la web publica                                   |
| 216 | Boton "Plegar menu" (chevron)              | Boton     | Colapsar sidebar                                      |
| 217 | Link Dashboard (icono grid)                | Link      | /admin                                                |
| 218 | Grupo Configuracion (icono engranaje)      | Grupo nav | Subcategorias, Tipos, Caracteristicas                 |
| 219 | Grupo Catalogo (icono camion) + badge      | Grupo nav | Productos, Anunciantes, Solicitantes, Cartera, Agenda |
| 220 | Grupo Finanzas (icono $)                   | Grupo nav | Balance, Registro, Historico, Utilidades              |
| 221 | Grupo Comunicacion (icono burbuja) + badge | Grupo nav | Banner, Noticias, Comentarios                         |
| 222 | Grupo Comunidad (icono usuarios) + badge   | Grupo nav | Usuarios, Chats, Suscripciones                        |
| 223 | Badges rojos (contadores)                  | Badge     | Pendientes en cada seccion                            |
| 224 | Popover menu (estado colapsado)            | Popover   | Links con badges al hacer hover                       |

### Admin Layout — Header

| #   | Elemento                                  | Tipo       | Proposito                   |
| --- | ----------------------------------------- | ---------- | --------------------------- |
| 225 | Boton hamburguesa (mobile)                | Boton      | Abre sidebar                |
| 226 | Boton colapsar (desktop)                  | Boton      | Toggle sidebar              |
| 227 | Breadcrumb "Admin / Seccion"              | Navegacion | Ruta actual                 |
| 228 | Link "Ver sitio"                          | Link       | Abre web publica            |
| 229 | Boton usuario (avatar + nombre + chevron) | Boton      | Dropdown con email + logout |

### Admin Layout — Pantallas acceso

| #   | Elemento                                         | Tipo     | Proposito       |
| --- | ------------------------------------------------ | -------- | --------------- |
| 230 | Logo + "Panel de Administracion"                 | Texto    | Pantalla login  |
| 231 | Boton "Iniciar sesion con Google" (icono Google) | Boton    | OAuth login     |
| 232 | Texto "Cargando..."                              | Texto    | Estado de carga |
| 233 | Mensaje error (rojo)                             | Texto    | Error de acceso |
| 234 | Pantalla "Acceso Denegado" + boton logout        | Pantalla | Sin permisos    |
| 235 | Pantalla "Verificando acceso..."                 | Pantalla | Comprobacion    |

### Dashboard (admin/index.vue)

| #   | Elemento                                                                   | Tipo    | Proposito              |
| --- | -------------------------------------------------------------------------- | ------- | ---------------------- |
| 236 | Card banner: icono + estado ACTIVO/INACTIVO + texto preview                | Card    | Estado del banner      |
| 237 | Boton "Desactivar"/"Activar" (rojo/verde)                                  | Boton   | Toggle banner          |
| 238 | Boton "Editar"                                                             | Boton   | Editar banner          |
| 239 | Boton "Vehiculo" (icono camion)                                            | Boton   | Crear vehiculo         |
| 240 | Boton "Noticia" (icono documento)                                          | Boton   | Crear noticia          |
| 241 | Boton "Balance" (icono $)                                                  | Boton   | Crear entrada balance  |
| 242 | Card Anunciantes + badge pendientes                                        | Card    | Contador               |
| 243 | Card Solicitantes + badge pendientes                                       | Card    | Contador               |
| 244 | Card Comentarios + badge pendientes                                        | Card    | Contador               |
| 245 | Card Chats + badge no leidos                                               | Card    | Contador               |
| 246 | Card Suscripciones + badge pendientes                                      | Card    | Contador               |
| 247 | Seccion "Pendientes" (lista items o "Todo al dia")                         | Seccion | Items por gestionar    |
| 248 | Seccion "Coincidencias" (badge tipo + descripcion + "Ver")                 | Seccion | Matches demanda/oferta |
| 249 | Seccion Productos (colapsable): total, publicados, no publicados, desglose | Seccion | Estadisticas           |
| 250 | Seccion Comunidad (colapsable): visitas, unicos, registrados, 6 stats      | Seccion | Estadisticas           |

### Productos — Lista (admin/productos/index.vue)

| #   | Elemento                                                                      | Tipo         | Proposito                  |
| --- | ----------------------------------------------------------------------------- | ------------ | -------------------------- |
| 251 | Heading "Productos" + badge conteo                                            | Texto        | Titulo                     |
| 252 | Boton "+ Nuevo Producto"                                                      | Boton        | Crear vehiculo             |
| 253 | Input busqueda (lupa + placeholder + X)                                       | Input        | Buscar marca/modelo        |
| 254 | Segmento "Tipo": Todos/Online/Offline                                         | Boton grupo  | Filtro visibilidad         |
| 255 | Dropdown "Categoria"                                                          | Dropdown     | Filtro categoria           |
| 256 | Dropdown "Estado"                                                             | Dropdown     | Filtro estado              |
| 257 | Dropdown "Subcat."                                                            | Dropdown     | Filtro subcategoria        |
| 258 | Dropdown "Tipo" (filtrado por subcat)                                         | Dropdown     | Filtro tipo                |
| 259 | Boton "X Limpiar"                                                             | Boton        | Reset filtros              |
| 260 | Toggle grupo "Docs"                                                           | Boton toggle | Columnas documentos        |
| 261 | Toggle grupo "Tecnico"                                                        | Boton toggle | Columnas tecnicas          |
| 262 | Toggle grupo "Cuentas"                                                        | Boton toggle | Columnas financieras       |
| 263 | Toggle grupo "Alquiler"                                                       | Boton toggle | Columnas alquiler          |
| 264 | Toggle grupo "Filtros"                                                        | Boton toggle | Columnas filtros dinamicos |
| 265 | Boton "Drive" (conexion)                                                      | Boton        | Conexion Google Drive      |
| 266 | Boton "Configurar"                                                            | Boton        | Abre modal config tabla    |
| 267 | Boton "Exportar" + badge seleccion                                            | Boton        | Exportar productos         |
| 268 | Boton fullscreen                                                              | Boton        | Pantalla completa          |
| 269 | Checkbox header (seleccionar todos)                                           | Checkbox     | Seleccion masiva           |
| 270 | Columna "Img"                                                                 | Col. tabla   | Thumbnail 44x44            |
| 271 | Columna "Tipo" (ON/OFF pill)                                                  | Col. tabla   | Visibilidad                |
| 272 | Columna "Marca" (sortable)                                                    | Col. tabla   | Link bold al vehiculo      |
| 273 | Tag propietario                                                               | Tag          | Si es offline              |
| 274 | Columna "Modelo"                                                              | Col. tabla   | Texto                      |
| 275 | Columna "Subcat."                                                             | Col. tabla   | Subcategoria               |
| 276 | Columna "Tipo"                                                                | Col. tabla   | Tipo vehiculo              |
| 277 | Columna "Ano" (sortable)                                                      | Col. tabla   | Ano                        |
| 278 | Columna "Precio" (sortable)                                                   | Col. tabla   | Formateado                 |
| 279 | Columnas opcionales (Matricula, Ubicacion, Desc, P.Minimo, Coste, P.Alquiler) | Col. tabla   | Segun grupo activo         |
| 280 | Columnas filtros dinamicos                                                    | Col. tabla   | Segun filter_definitions   |
| 281 | Columna "Cat." (badge coloreado)                                              | Col. tabla   | Categoria                  |
| 282 | Columna "Estado" (dropdown select)                                            | Col. tabla   | Estado con fondo color     |
| 283 | Boton Editar                                                                  | Boton        | Ir a ficha vehiculo        |
| 284 | Boton Drive                                                                   | Boton        | Abrir carpeta en Drive     |
| 285 | Boton Exportar ficha                                                          | Boton        | Generar ficha PDF          |
| 286 | Boton Transaccion                                                             | Boton        | Alquilar/Vender            |
| 287 | Boton Eliminar (hover rojo)                                                   | Boton        | Borrar vehiculo            |
| 288 | Estado vacio + "Limpiar filtros"                                              | Estado       | Sin resultados             |
| 289 | Modal Eliminar: heading rojo + warning + input "borrar" + botones             | Modal        | Confirmacion borrado       |
| 290 | Modal Exportar: formato PDF/Excel + scope + botones                           | Modal        | Exportacion                |
| 291 | Modal Transaccion: tabs Alquilar/Vender + campos + botones                    | Modal        | Registrar operacion        |
| 292 | Modal Configurar: tab Grupos (lista + edit + crear) + tab Ordenar (drag&drop) | Modal        | Configurar tabla           |

### Productos — Ficha edicion (admin/productos/[id].vue)

| #   | Elemento                                                             | Tipo        | Proposito                       |
| --- | -------------------------------------------------------------------- | ----------- | ------------------------------- |
| 293 | Boton volver                                                         | Boton       | Navegar atras                   |
| 294 | Heading "Marca Modelo" + estrella                                    | Texto       | Titulo + destacado              |
| 295 | Boton "Drive"                                                        | Boton       | Conexion Drive                  |
| 296 | Boton "Vender" (verde)                                               | Boton       | Registrar venta                 |
| 297 | Boton eliminar (rojo outline)                                        | Boton       | Eliminar vehiculo               |
| 298 | Boton "Cancelar"                                                     | Boton       | Descartar cambios               |
| 299 | Boton "Guardar"                                                      | Boton       | Guardar cambios                 |
| 300 | Radio Publicado                                                      | Radio       | Estado vehiculo                 |
| 301 | Radio Oculto                                                         | Radio       | Estado vehiculo                 |
| 302 | Radio Alquilado                                                      | Radio       | Estado vehiculo                 |
| 303 | Radio En Taller                                                      | Radio       | Estado vehiculo                 |
| 304 | Radio card Web (Publico)                                             | Radio card  | Visible en web                  |
| 305 | Radio card Intermediacion (Interno)                                  | Radio card  | Solo admin                      |
| 306 | Campos propietario (fondo amarillo)                                  | Input       | Si es offline                   |
| 307 | Label "Imagenes (count/10)"                                          | Texto       | Contador                        |
| 308 | Upload "Subir imagenes" (borde dashed)                               | Upload      | Seleccionar archivos            |
| 309 | Progress bar subida                                                  | Barra       | Progreso Cloudinary             |
| 310 | Grid imagenes (5col/3col)                                            | Grid        | Vista previa                    |
| 311 | Overlay hover: portada + subir + bajar + eliminar                    | Boton grupo | Acciones por imagen             |
| 312 | Badge "PORTADA"                                                      | Badge       | Primera imagen                  |
| 313 | Checkbox Venta                                                       | Checkbox    | Categoria                       |
| 314 | Checkbox Alquiler                                                    | Checkbox    | Categoria                       |
| 315 | Checkbox Terceros                                                    | Checkbox    | Categoria                       |
| 316 | Checkbox "Destacado" (naranja)                                       | Checkbox    | Featured                        |
| 317 | Dropdown Subcategoria                                                | Dropdown    | Clasificacion                   |
| 318 | Dropdown Tipo\*                                                      | Dropdown    | Clasificacion                   |
| 319 | Input Marca\*                                                        | Input       | Dato                            |
| 320 | Input Modelo\*                                                       | Input       | Dato                            |
| 321 | Input Ano\*                                                          | Input       | Dato                            |
| 322 | Input Matricula                                                      | Input       | Dato                            |
| 323 | Input Precio Venta                                                   | Input       | Financiero                      |
| 324 | Input Precio Alquiler                                                | Input       | Financiero                      |
| 325 | Input Ubicacion ES (+ deteccion auto)                                | Input       | Localizacion                    |
| 326 | Input Ubicacion EN                                                   | Input       | Localizacion                    |
| 327 | Toggle "Descripcion" +/-                                             | Boton       | Expandir/colapsar               |
| 328 | Textarea Descripcion ES + contador                                   | Textarea    | Texto ES                        |
| 329 | Textarea Descripcion EN + contador                                   | Textarea    | Texto EN                        |
| 330 | Toggle "Filtros (count)" +/-                                         | Boton       | Expandir/colapsar               |
| 331 | Grid filtros dinamicos (3col)                                        | Grid        | Segun filter_definitions        |
| 332 | Toggle "Caract. adicionales" + "+ Anadir"                            | Boton       | Expandir + crear                |
| 333 | Filas: nombre + valor ES + valor EN + X                              | Input grupo | Caracteristica libre            |
| 334 | Toggle "Documentos (count)" + Drive                                  | Boton       | Expandir + Drive                |
| 335 | Dropdown tipo documento                                              | Dropdown    | ITV, Ficha-Tecnica, Contrato... |
| 336 | Upload "Subir documento"                                             | Upload      | Subir a Drive                   |
| 337 | Lista docs: link + badge tipo + X                                    | Lista       | Documentos subidos              |
| 338 | Toggle "Cuentas" + badge COSTE TOTAL                                 | Boton       | Expandir + resumen              |
| 339 | Input Precio minimo                                                  | Input       | Financiero                      |
| 340 | Input Coste adquisicion                                              | Input       | Financiero                      |
| 341 | Input Fecha adquisicion                                              | Input fecha | Financiero                      |
| 342 | Heading "Mantenimiento" + "+ Anadir"                                 | Boton       | Subseccion                      |
| 343 | Tabla mantenimiento: Fecha+Razon+Coste+Factura+X                     | Tabla       | Filas editables                 |
| 344 | Footer "Total Mant"                                                  | Texto       | Suma                            |
| 345 | Heading "Renta" + "+ Anadir"                                         | Boton       | Subseccion                      |
| 346 | Tabla renta: Desde+Hasta+Razon+Importe+Factura+X                     | Tabla       | Filas editables                 |
| 347 | Footer "Total Renta" (verde)                                         | Texto       | Suma                            |
| 348 | Caja resumen: Adquisicion + Mant - Renta = COSTE TOTAL               | Calculo     | Resumen financiero              |
| 349 | Modal Eliminar: warning + input "Borrar" + botones                   | Modal       | Confirmacion                    |
| 350 | Modal Venta: precio+comision+comprador+fecha+notas+calculo beneficio | Modal       | Registrar venta                 |

### Productos — Nuevo (admin/productos/nuevo.vue)

| #   | Elemento                                                     | Tipo       | Proposito        |
| --- | ------------------------------------------------------------ | ---------- | ---------------- |
| 351 | Heading "Nuevo Vehiculo"                                     | Texto      | Titulo           |
| 352 | Mismas secciones 1-10 que ficha edicion                      | Formulario | Formulario vacio |
| 353 | Upload "Seleccionar imagenes" + preview grid + badge PORTADA | Upload     | Pre-upload       |
| 354 | Hint "Las imagenes se subiran al guardar"                    | Texto      | Informacion      |
| 355 | Boton "Guardar" con estados (Subiendo.../Guardando...)       | Boton      | Submit           |

### Configuracion — Index (admin/config/index.vue)

| #   | Elemento                                                        | Tipo      | Proposito            |
| --- | --------------------------------------------------------------- | --------- | -------------------- |
| 356 | Heading "Configuracion" + subtitulo                             | Texto     | Titulo               |
| 357 | Card Subcategorias (icono + titulo + desc + 4 pills + flecha)   | Card link | Ir a subcategorias   |
| 358 | Card Tipos (icono + titulo + desc + 4 pills + flecha)           | Card link | Ir a tipos           |
| 359 | Card Caracteristicas (icono + titulo + desc + 4 pills + flecha) | Card link | Ir a caracteristicas |

### Configuracion — Caracteristicas (admin/config/caracteristicas.vue)

| #   | Elemento                                                                       | Tipo        | Proposito                   |
| --- | ------------------------------------------------------------------------------ | ----------- | --------------------------- |
| 360 | Heading "Caracteristicas" + badge + boton "+ Nueva"                            | Texto+Boton | Header                      |
| 361 | Input busqueda                                                                 | Input       | Buscar                      |
| 362 | Dropdowns filtro: estado, tipo, subcategoria                                   | Dropdown    | Filtros                     |
| 363 | Tabla con columnas sortables                                                   | Tabla       | Lista de filter_definitions |
| 364 | Acciones por fila: editar, duplicar, eliminar, reordenar                       | Boton       | Gestion                     |
| 365 | Modal crear/editar: nombre, tipo (6 opciones), unidad, opciones, subcat, orden | Modal       | Formulario                  |
| 366 | Modal eliminar con confirmacion                                                | Modal       | Seguridad                   |

### Noticias — Lista (admin/noticias/index.vue)

| #   | Elemento                                                                | Tipo        | Proposito                               |
| --- | ----------------------------------------------------------------------- | ----------- | --------------------------------------- |
| 367 | Heading "Noticias" + badge + boton "+ Nueva Noticia"                    | Texto+Boton | Header                                  |
| 368 | Input busqueda                                                          | Input       | Buscar                                  |
| 369 | Dropdown "Estado"                                                       | Dropdown    | Todos/Borrador/Publicado/Archivado      |
| 370 | Dropdown "Categoria"                                                    | Dropdown    | Todas/Prensa/Eventos/Destacados/General |
| 371 | Boton "X Limpiar"                                                       | Boton       | Reset filtros                           |
| 372 | Tabla: Titulo+Categoria+Vistas+Fecha creacion+Fecha pub+Estado+Acciones | Tabla       | Datos                                   |
| 373 | Boton Editar por fila                                                   | Boton       | Ir a editor                             |
| 374 | Boton Eliminar por fila                                                 | Boton       | Borrar noticia                          |
| 375 | Modal eliminar ("Escribe borrar")                                       | Modal       | Confirmacion                            |

### Noticias — Editor/Creador

| #   | Elemento                                            | Tipo     | Proposito         |
| --- | --------------------------------------------------- | -------- | ----------------- |
| 376 | Radios estado: Borrador/Publicado/Archivado         | Radio    | Estado            |
| 377 | Input Titulo ES + Input Titulo EN                   | Input    | Titulos bilingues |
| 378 | Input Slug (auto-generado)                          | Input    | URL amigable      |
| 379 | Dropdown Categoria                                  | Dropdown | Clasificacion     |
| 380 | Upload imagen (Cloudinary) + preview                | Upload   | Imagen articulo   |
| 381 | Input Meta description + contador palabras          | Input    | SEO               |
| 382 | Textarea Contenido ES + Contenido EN                | Textarea | Texto articulo    |
| 383 | Input Hashtags                                      | Input    | Tags              |
| 384 | Panel SEO Score (puntuacion 0-100, color, feedback) | Panel    | Optimizacion SEO  |
| 385 | Botones Guardar/Publicar                            | Boton    | Submit            |

### Balance (admin/balance.vue)

| #   | Elemento                                                | Tipo        | Proposito             |
| --- | ------------------------------------------------------- | ----------- | --------------------- |
| 386 | Heading "Balance" + boton "+ Nueva Entrada"             | Texto+Boton | Header                |
| 387 | Dropdown selector ano                                   | Dropdown    | Filtro temporal       |
| 388 | Boton "Exportar"                                        | Boton       | Exportar datos        |
| 389 | Boton "Resumen"                                         | Boton       | Generar resumen       |
| 390 | Boton fullscreen                                        | Boton       | Pantalla completa     |
| 391 | Segmento: Todos/Ingresos/Gastos                         | Boton grupo | Filtro tipo           |
| 392 | Dropdown "Razon"                                        | Dropdown    | Filtro razon          |
| 393 | Dropdown "Estado"                                       | Dropdown    | Filtro estado         |
| 394 | Dropdown "Subcat." + "Tipo"                             | Dropdown    | Filtros clasificacion |
| 395 | Input busqueda + "X Limpiar"                            | Input+Boton | Buscar + reset        |
| 396 | Card Total Ingresos (verde)                             | Card        | Suma ingresos         |
| 397 | Card Total Gastos (rojo)                                | Card        | Suma gastos           |
| 398 | Card Balance (verde/rojo)                               | Card        | Diferencia            |
| 399 | Boton "Ver desglose"                                    | Boton       | Toggle desglose       |
| 400 | Boton "Ver graficos" + toggle Barras/Circular           | Boton       | Toggle graficos       |
| 401 | Tabla: Tipo+Fecha+Razon+Detalle+Importe+Estado+Acciones | Tabla       | Datos sortables       |
| 402 | Pill tipo por fila (Ingreso verde/Gasto rojo)           | Badge       | Indicador visual      |
| 403 | Botones Editar + Eliminar por fila                      | Boton       | Acciones              |
| 404 | Fila footer TOTAL                                       | Texto       | Suma total            |
| 405 | Modal crear/editar entrada                              | Modal       | Formulario            |
| 406 | Modal eliminar                                          | Modal       | Confirmacion          |
| 407 | Modal exportar (formato + scope + columnas)             | Modal       | Exportacion           |
| 408 | Modal resumen (opciones)                                | Modal       | Generacion resumen    |

### Historico (admin/historico.vue)

| #   | Elemento                                                                              | Tipo           | Proposito            |
| --- | ------------------------------------------------------------------------------------- | -------------- | -------------------- |
| 409 | Heading "Historico" + badge + "Exportar" + fullscreen                                 | Texto+Boton    | Header               |
| 410 | Dropdowns: ano, categoria, subcat, tipo, marca + busqueda + "Limpiar"                 | Dropdown+Input | Filtros              |
| 411 | Card Total ventas                                                                     | Card           | Conteo               |
| 412 | Card Total ingresos (verde)                                                           | Card           | Suma                 |
| 413 | Card Total beneficio (verde/rojo)                                                     | Card           | Suma                 |
| 414 | Card Margen promedio %                                                                | Card           | Porcentaje           |
| 415 | Toggles columnas: Docs/Tecnico/Alquiler                                               | Boton toggle   | Visibilidad columnas |
| 416 | Tabla: Imagen+Marca+Modelo+Ano+Cat.venta+Fecha+Precio+Coste+Beneficio+Margen+Acciones | Tabla          | Datos historicos     |
| 417 | Boton Ver detalle                                                                     | Boton          | Modal detalle        |
| 418 | Boton Restaurar                                                                       | Boton          | Devolver a activo    |
| 419 | Boton Eliminar permanente                                                             | Boton          | Borrar definitivo    |
| 420 | Modal detalle (info completa vehiculo + venta)                                        | Modal          | Vista lectura        |
| 421 | Modal restaurar ("Escribe restaurar")                                                 | Modal          | Confirmacion         |
| 422 | Modal eliminar ("Escribe borrar")                                                     | Modal          | Confirmacion         |
| 423 | Modal exportar (formato + scope)                                                      | Modal          | Exportacion          |

### Utilidades (admin/utilidades.vue)

| #   | Elemento                                                       | Tipo        | Proposito                 |
| --- | -------------------------------------------------------------- | ----------- | ------------------------- |
| 424 | Tab "Facturas"                                                 | Tab         | Generador facturas        |
| 425 | Tab "Contratos"                                                | Tab         | Generador contratos       |
| 426 | Tab "Exportar"                                                 | Tab         | Exportacion personalizada |
| 427 | Input "Numero de vehiculos"                                    | Input       | Cantidad                  |
| 428 | Dropdowns seleccion vehiculos                                  | Dropdown    | Identificacion            |
| 429 | Display numero factura (auto)                                  | Texto       | Referencia                |
| 430 | Input fecha factura                                            | Input fecha | Fecha                     |
| 431 | Input "Condiciones de pago"                                    | Input       | Condiciones               |
| 432 | Checkbox "En ingles"                                           | Checkbox    | Idioma                    |
| 433 | Seccion cliente: Nombre+Direccion(3)+Tipo doc dropdown+N doc   | Input grupo | Datos cliente             |
| 434 | Seccion empresa: Nombre, NIF, Direccion, Tel, Email, Web, Logo | Input grupo | Datos empresa             |
| 435 | Tabla lineas factura + "+ Anadir linea"                        | Tabla+Boton | Conceptos                 |
| 436 | Por linea: Tipo dropdown+Concepto+Cantidad+Precio ud+IVA%+X    | Input grupo | Datos linea               |
| 437 | Calculos auto: Subtotal + IVA + Total                          | Calculo     | Importes                  |
| 438 | Boton "Vista previa"                                           | Boton       | Preview PDF               |
| 439 | Boton "Generar PDF"                                            | Boton       | Descargar                 |
| 440 | Boton "Enviar por email"                                       | Boton       | Email                     |

### Banner (admin/banner.vue)

| #   | Elemento                        | Tipo         | Proposito        |
| --- | ------------------------------- | ------------ | ---------------- |
| 441 | Toggle activar/desactivar       | Toggle       | Estado banner    |
| 442 | Input texto ES + Input texto EN | Input        | Mensaje bilingue |
| 443 | Color picker fondo + texto      | Color picker | Colores          |
| 444 | Input URL enlace                | Input        | Link opcional    |
| 445 | Dropdown icono                  | Dropdown     | Decoracion       |
| 446 | Preview en vivo                 | Preview      | Vista previa     |
| 447 | Boton Guardar                   | Boton        | Persistir        |

### Otras paginas admin (patron comun)

| #   | Elemento                                                       | Tipo        | Proposito             |
| --- | -------------------------------------------------------------- | ----------- | --------------------- |
| 448 | Usuarios: header + filtros + tabla + modales                   | Pagina CRUD | Gestion usuarios      |
| 449 | Chats: lista conversaciones + vista chat + input + realtime    | Pagina      | Mensajeria admin      |
| 450 | Suscripciones: tabla emails + preferencias + acciones          | Pagina CRUD | Gestion suscripciones |
| 451 | Anunciantes: tabla + estado + aprobar/rechazar + contacto      | Pagina CRUD | Gestion anuncios      |
| 452 | Solicitantes: tabla + specs + estado + acciones                | Pagina CRUD | Gestion solicitudes   |
| 453 | Comentarios: lista + filtro estado/articulo + aprobar/rechazar | Pagina CRUD | Moderacion            |

---

**RESUMEN**

| Seccion     | Elementos |
| ----------- | --------- |
| Web publica | 212       |
| Panel admin | 241       |
| **TOTAL**   | **453**   |

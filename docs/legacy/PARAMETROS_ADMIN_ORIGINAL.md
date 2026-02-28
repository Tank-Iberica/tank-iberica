> ⚠️ **[LEGACY]** Documento histórico — solo referencia. No modificar ni usar como fuente de verdad. Ver `docs/tracciona-docs/` para documentación activa.

> **DOCUMENTO HISTORICO.** Este documento es referencia del diseno original. La fuente de verdad actual es [`README-PROYECTO.md`](../../README-PROYECTO.md) y [`INSTRUCCIONES-MAESTRAS.md`](../tracciona-docs/INSTRUCCIONES-MAESTRAS.md).

# PARÁMETROS DEL ADMIN.HTML ORIGINAL

## Referencia completa para migración

---

## RESUMEN

- **IDs únicos:** 404
- **Funciones:** 261
- **Secciones:** 16
- **Modales:** 15+

---

## SECCIONES (16 total)

| Línea | ID                     | Nombre         |
| ----- | ---------------------- | -------------- |
| 663   | section-dashboard      | Dashboard      |
| 693   | section-vehiculos      | Vehículos      |
| 742   | section-intermediacion | Intermediación |
| 804   | section-ojeados        | Ojeados        |
| 873   | section-subcategorias  | Subcategorías  |
| 879   | section-filtros        | Filtros        |
| 885   | section-anunciantes    | Anunciantes    |
| 891   | section-solicitantes   | Solicitantes   |
| 897   | section-posts          | Posts          |
| 903   | section-comentarios    | Comentarios    |
| 909   | section-banner         | Banner         |
| 949   | section-usuarios       | Usuarios       |
| 955   | section-chat           | Chat           |
| 985   | section-suscripciones  | Suscripciones  |
| 991   | section-balance        | Balance        |
| 1073  | section-historico      | Histórico      |

---

## NAVEGACIÓN SIDEBAR

```
📊 Dashboard (principal)

⚙️ Configuración (desplegable)
   ├── 📋 Subcategorías
   ├── 🔍 Filtros
   └── 🔔 Banner

🚛 Catálogo (desplegable, abierto por defecto)
   ├── 🚚 Vehículos
   ├── 🤝 Intermediación
   ├── 👁️ Ojeados (badge: badgeOjeados)
   ├── 📢 Anunciantes (badge: badgeAnunciantes)
   └── 🔎 Solicitantes (badge: badgeSolicitantes)

💰 Balance (directo)
📜 Histórico (directo)

📰 Comunicación (desplegable)
   ├── 📝 Posts
   └── 💬 Comentarios (badge: badgeCom)

👥 Usuarios (desplegable)
   ├── 👤 Usuarios
   ├── 💬 Chat (badge: badgeChat)
   └── 📧 Suscripciones
```

---

## IDS POR SECCIÓN

### DASHBOARD

- `cardVeh`, `cardAnu`, `cardSol`, `cardChat`, `cardCom`
- `sVeh`, `sAnu`, `sSol`, `sChat`, `sCom`
- `pendientes`, `matches`
- `bannerStatusCard`, `bannerStatusIcon`, `bannerStatusText`, `btnToggleBanner`

### VEHÍCULOS

- Tabla: `tablaVehiculos`, `theadVeh`, `tVeh`
- Búsqueda: `buscarVeh`
- Modal: `modalVehiculo`, `modalVehTitle`
- Campos: `vehId`, `vehRow`, `vehEstado`, `estadoSelector`
- Categorías: `vehCatVenta`, `vehCatAlquiler`, `vehCatTerceros`
- Datos: `vehMarca`, `vehModelo`, `vehAno`, `vehMatricula`
- Precios: `vehPrecio`, `vehPrecioAlquiler`, `vehPrecioMin`, `vehCoste`
- Ubicación: `vehUbic`, `vehUbicEn`
- Descripción: `vehDesc`, `vehDescEn`
- Subcategoría: `vehSubcat`
- Imágenes: `vehImgInput`
- Documentos: `vehDocsInput`, `vehDocumentacion`, `docsPreview`
- Fechas: `vehAdquisicion`
- Mantenimiento: `mantTable`, `mantBody`, `mantTotal`
- Renta: `rentaTable`, `rentaBody`, `rentaTotal`
- Coste total: `costeTotalCalc`
- Características: `caracteristicasContainer`
- Grupos visibles: `precioAlquilerGroup`, `precioVentaGroup`

### INTERMEDIACIÓN

- Tabla: `tablaIntermediacion`, `theadInter`, `tInter`
- Búsqueda: `buscarInter`
- Modal: `modalIntermediacion`, `modalInterTitle`
- Características: `caracteristicasContainerInter`
- Documentos: `docsPreviewInter`
- Estado: `estadoSelectorInter`

### OJEADOS

- Tabla: `tablaOjeados`, `tOjeados`
- Búsqueda: `buscarOjeado`
- Modal: `modalOjeado`, `modalOjeadoTitle`
- Campos: `ojeadoId`, `ojeadoRow`, `ojeadoProducto`, `ojeadoPrecio`
- Contacto: `ojeadoEmail`, `ojeadoTelefono`, `ojeadoEnlace`
- Plataforma: `ojeadoPlataforma`, `ojeadoOtraPlataforma`, `otraPlataformaGroup`
- Estado: `ojeadoEstado`, `ojeadoNegociado`
- Notas: `ojeadoNotas`

### SUBCATEGORÍAS

- Tabla: `tSub`
- Modal: `modalSubcat`, `modalSubcatTitle`
- Campos: `subId`, `subRow`, `subNombre`, `subNombreEn`, `subPublicado`
- Filtros: `subFiltrosCheck`

### FILTROS

- Tabla: `tFil`
- Modal: `modalFiltro`, `modalFiltroTitle`
- Campos: Dinámicos según tipo

### BANNER

- Campos: `bannerEs`, `bannerEn`, `bannerUrl`
- Fechas: `bannerDesde`, `bannerHasta`
- Estado: `bannerActivo`

### ANUNCIANTES

- Tabla: `tAnu`

### SOLICITANTES

- Tabla: `tSol`

### POSTS

- Tabla: `tPos`

### COMENTARIOS

- Tabla: `tCom`

### USUARIOS

- Tabla: `tUsu`

### CHAT

- Lista: `chatList`
- Detalle: `chatDetail`, `chatDetailHeader`, `chatDetailTitle`, `chatDetailMessages`, `chatDetailInput`
- Input admin: `chatAdminInput`
- Acciones: `chatActions`
- Emoji: `emojiPicker`

### SUSCRIPCIONES

- Tabla: `tSus`

### BALANCE

- Tabla: `balanceTable`, `balanceTableContainer`, `tBalance`
- Filtros: `balanceSearch`, `balanceYearFilter`, `balanceTipoFilter`, `balanceRazonFilter`, `balanceEstadoFilter`, `balanceSubcatFilter`
- Totales: `totalIngresos`, `totalGastos`, `balanceNeto`
- Resumen: `balanceSummary`
- Desglose: `balanceDesglose`, `toggleDesglose`
- Gráficos: `balanceGraficos`, `toggleGraficos`, `tipoGrafico`, `chartRazon`, `chartSubcat`
- Modal: `modalBalance`, `modalBalanceTitle`
- Campos: `balanceId`, `balanceRow`, `balanceTipo`, `balanceFecha`, `balanceRazon`, `balanceDetalle`, `balanceImporte`, `balanceEstado`, `balanceFactura`, `balanceFacturaUrl`, `balanceNotas`

### HISTÓRICO

- Tabla: `historicoTable`, `historicoTableContainer`, `historicoThead`, `tHistorico`
- Filtros: `historicoSearch`, `historicoYearFilter`, `historicoSubcatFilter`, `historicoMarcaFilter`
- Categorías: `histCatVenta`, `histCatTerceros`, `histCatExportacion`
- Columnas extra: `histColDocs`, `histColTecnico`, `histColAlquiler`

---

## MODALES PRINCIPALES

| ID                     | Nombre             | Uso                     |
| ---------------------- | ------------------ | ----------------------- |
| modalVehiculo          | Vehículo           | CRUD vehículos          |
| modalIntermediacion    | Intermediación     | CRUD intermediación     |
| modalOjeado            | Ojeado             | CRUD ojeados            |
| modalSubcat            | Subcategoría       | CRUD subcategorías      |
| modalFiltro            | Filtro             | CRUD filtros            |
| modalBalance           | Balance            | CRUD transacciones      |
| modalVender            | Vender             | Proceso de venta        |
| modalTransaccion       | Transacción        | Alquiler/venta          |
| modalConfirm           | Confirmar          | Eliminar con "Borrar"   |
| modalRestaurar         | Restaurar          | Restaurar de histórico  |
| modalExportar          | Exportar           | Exportar vehículos      |
| modalExportarBalance   | Exportar Balance   | Exportar balance        |
| modalExportarHistorico | Exportar Histórico | Exportar histórico      |
| modalExportarInter     | Exportar Inter     | Exportar intermediación |
| modalFactura           | Factura            | Generar factura         |
| modalConfigTabla       | Config Tabla       | Configurar columnas     |

---

## FUNCIONES PRINCIPALES POR MÓDULO

### Autenticación

- `iniciarLogin()`, `logout()`, `checkAuth()`

### Navegación

- `showSection(id)`, `toggleNav(el)`, `toggleSidebar()`, `toggleFullscreen(id)`

### CRUD General

- `abrirModal(id)`, `cerrarModal(id)`, `toast(msg, tipo)`
- `readSheetData(sheet)`, `writeRow(sheet, row, data)`, `appendRow(sheet, data)`, `deleteRow(sheet, row)`

### Vehículos

- `renderVehiculos()`, `abrirModalVehiculo()`, `editarVehiculo(idx)`, `guardarVehiculo()`
- `setEstadoVeh(estado)`, `onCategoriasChange()`
- `addFilaMant()`, `removeMant(idx)`, `calcCosteTotal()`
- `addFilaRenta()`, `removeRenta(idx)`
- `prepTransaccion(idx, tipo)`, `venderVehiculo()`

### Intermediación

- `renderIntermediacion()`, `abrirModalIntermediacion()`, `editarIntermediacion(idx)`, `guardarIntermediacion()`

### Ojeados

- `renderOjeados()`, `abrirModalOjeado()`, `editarOjeado(idx)`, `guardarOjeado()`
- `filterOjeados()`, `sortOjeados(col)`

### Subcategorías

- `renderSubcategorias()`, `abrirModalSubcat()`, `editarSubcategoria(idx)`, `guardarSubcategoria()`
- `moverSubcategoria(idx, dir)`

### Filtros

- `renderFiltros()`, `abrirModalFiltro()`, `editarFiltro(idx)`, `guardarFiltro()`
- `onTipoFiltroChange()`, `moverFiltro(idx, dir)`

### Balance

- `renderBalance()`, `filterBalance()`, `sortBalance(col)`
- `abrirModalBalance()`, `editBalance(idx)`, `guardarBalance()`
- `calcularBalanceTotales(data)`, `renderDesglose(data)`
- `toggleDesglose()`, `toggleGraficos()`, `renderGraficos()`
- `renderChartRazon(data, tipo)`, `exportarBalance()`
- `subirFacturaBalance(file, tipo, razon, fecha)`
- `prepDelBalance(idx)`, `poblarFiltroSubcategorias()`

### Histórico

- `renderHistorico()`, `filterHistorico()`, `sortHistorico(col)`
- `verMantHistorico(idx)`, `verRentaHistorico(idx)`
- `prepRestaurar(idx)`, `confirmarRestaurar()`
- `exportarHistorico()`

### Chat

- `renderChatList()`, `renderChatDetail(idx)`, `enviarMensajeAdmin()`
- `toggleEmoji()`, `insertEmoji(emoji)`

### Utilidades

- `fmtNum(n)`, `fmtDate(d)`, `initDriveFolders()`
- `getOrCreateFolder(name, parent)`, `uploadFileToDrive(file, folder)`

---

## ESTRUCTURA DE DATOS (cache)

```javascript
let cache = {
  vehiculos: [],
  subcategorias: [],
  filtros: [],
  anunciantes: [],
  solicitantes: [],
  noticias: [],
  comentarios: [],
  usuarios: [],
  suscripciones: [],
  historico: [],
  balance: [],
  intermediacion: [],
  ojeados: [],
  chat: [],
  tabla_config: [],
}
```

---

## HOJAS DE GOOGLE SHEETS

1. vehiculos
2. subcategorias
3. filtros
4. anunciantes
5. solicitantes
6. noticias
7. comentarios
8. usuarios
9. suscripciones
10. historico
11. balance
12. intermediacion
13. ojeados
14. chat
15. config (tabla_config)

---

## CONVENCIÓN DE NOMBRES

- **IDs HTML:** camelCase (ej: `balanceSearch`, `vehMarca`)
- **Secciones:** kebab-case con prefijo `section-` (ej: `section-balance`)
- **Tablas tbody:** prefijo `t` + nombre (ej: `tBalance`, `tVeh`)
- **Modales:** prefijo `modal` + nombre (ej: `modalBalance`)
- **Badges:** prefijo `badge` + nombre (ej: `badgeAnunciantes`)
- **Funciones:** camelCase (ej: `renderBalance`, `filterHistorico`)

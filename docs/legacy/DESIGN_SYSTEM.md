> ⚠️ **[LEGACY]** Documento histórico — solo referencia. No modificar ni usar como fuente de verdad. Ver `docs/tracciona-docs/` para documentación activa.

> **DOCUMENTO HISTORICO.** Este documento es referencia del diseno original. La fuente de verdad actual es [`README-PROYECTO.md`](../../README-PROYECTO.md) y [`INSTRUCCIONES-MAESTRAS.md`](../tracciona-docs/INSTRUCCIONES-MAESTRAS.md).

# TANK IBERICA - PARAMETROS DEL PROYECTO Y DESIGN SYSTEM

> Documento de referencia obligatorio para todo el desarrollo

---

## 1. PARAMETROS DEL PROYECTO

### 1.1 Reglas de Desarrollo

| #   | Regla                         | Descripcion                                                                                                             |
| --- | ----------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| 1   | **Documentar cambios**        | Actualizar ROADMAP.md y CHANGELOG.md en cada iteracion, teniendo en cuenta que cada iteracion puede sufrir correcciones |
| 2   | **Estilo corporativo**        | Respetar SIEMPRE los colores, tipografia y espaciados definidos aqui                                                    |
| 3   | **Consultar antes de actuar** | No ejecutar nada no solicitado sin preguntar y recibir aprobacion                                                       |
| 4   | **Responsive obligatorio**    | Todo debe funcionar en desktop Y movil                                                                                  |
| 5   | **Bilingue ES/EN**            | Todo texto visible debe tener traduccion. Estructura escalable para mas idiomas                                         |
| 6   | **Aplicar siempre**           | Estos parametros aplican a CADA cosa que se desarrolle                                                                  |
| 7   | **Preguntar dudas**           | Ante CUALQUIER duda antes o durante el proceso, preguntar para asegurar que se siguen las pautas correctas              |
| 8   | **Confirmar parametros**      | Al final de cada respuesta, confirmar si se han seguido todos los parametros o no                                       |

### 1.2 Nombre del Proyecto

```
CORRECTO:   Tank Iberica (sin tilde)
INCORRECTO: Tank Ibérica (con tilde)
```

### 1.3 Idiomas Soportados

| Codigo | Idioma  | Estado       |
| ------ | ------- | ------------ |
| `es`   | Espanol | ✅ Principal |
| `en`   | Ingles  | ✅ Activo    |

**Estructura de traducciones:** `src/config/translations.js`

---

## 2. DESIGN SYSTEM

### 2.1 Colores Principales

```css
/* COLORES BASE */
--color-petrol-blue: #23424a; /* Principal - ACTUALIZADO */
--color-petrol-dark: #1a3238; /* Gradientes oscuros */
--color-petrol-light: #2d545e; /* Hovers */
--color-white: #ffffff;

/* ACENTO */
--color-accent: #7fd1c8; /* Links, destacados */
--color-accent-hover: #5fbfb4;

/* DORADO (Banner, alertas) */
--color-gold: #d4a017;
--color-gold-dark: #b8860b;
```

### 2.2 Texto sobre Fondo Oscuro

```css
--text-on-dark-primary: #e6ecec; /* Texto principal */
--text-on-dark-secondary: #c9d4d4; /* Texto secundario */
--text-on-dark-auxiliary: #9fb1b1; /* Texto auxiliar */
--text-on-dark-accent: #7fd1c8; /* Links, destacados */
```

### 2.3 Texto sobre Fondo Claro

```css
--text-primary: #1f2a2a; /* Texto principal */
--text-secondary: #4a5a5a; /* Texto secundario */
--text-auxiliary: #7a8a8a; /* Texto auxiliar, placeholders */
--text-disabled: #9ca3af; /* Texto deshabilitado */
```

### 2.4 Grises y Fondos

```css
/* Fondos */
--bg-primary: #ffffff; /* Fondo principal (cards, modales) */
--bg-secondary: #f3f4f6; /* Fondo pagina */
--bg-tertiary: #e5e7eb; /* Fondo hover, alternativo */
--bg-dark: #23424a; /* Fondo oscuro (header, footer) */

/* Grises */
--color-gray-50: #f9fafb;
--color-gray-100: #f3f4f6;
--color-gray-200: #e5e7eb;
--color-gray-300: #d1d5db;
--color-gray-400: #9ca3af;
--color-gray-500: #6b7280;
--color-gray-600: #4b5563;
--color-gray-700: #374151;
--color-gray-800: #1f2937;
--color-gray-900: #111827;
```

### 2.5 Estados

```css
--color-success: #10b981; /* Verde - exito */
--color-warning: #f59e0b; /* Amarillo - advertencia */
--color-error: #ef4444; /* Rojo - error */
--color-info: #3b82f6; /* Azul - informacion */
```

### 2.6 Bordes

```css
--border-color: #d1d5db;
--border-color-light: #e5e7eb;
--border-color-dark: #9ca3af;

--border-radius-sm: 4px;
--border-radius: 8px;
--border-radius-md: 12px;
--border-radius-lg: 16px;
--border-radius-xl: 24px;
--border-radius-full: 9999px;
```

### 2.7 Sombras

```css
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
--shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
--shadow-md: 0 4px 8px rgba(0, 0, 0, 0.1);
--shadow-lg: 0 8px 16px rgba(0, 0, 0, 0.1);
--shadow-xl: 0 16px 32px rgba(0, 0, 0, 0.15);
--shadow-header: 0 8px 32px rgba(0, 0, 0, 0.12);
```

---

## 3. TIPOGRAFIA

### 3.1 Fuentes

```css
/* Fuente principal - Todo el sitio */
--font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;

/* Fuente logo */
--font-family-logo: 'Helvetica Neue', Arial, sans-serif;
```

### 3.2 Tamanos de Fuente

```css
--font-size-xs: 0.75rem; /* 12px */
--font-size-sm: 0.875rem; /* 14px */
--font-size-base: 1rem; /* 16px */
--font-size-lg: 1.125rem; /* 18px */
--font-size-xl: 1.25rem; /* 20px */
--font-size-2xl: 1.5rem; /* 24px */
--font-size-3xl: 1.875rem; /* 30px */
--font-size-4xl: 2.25rem; /* 36px */
```

### 3.3 Pesos de Fuente

```css
--font-weight-normal: 400;
--font-weight-medium: 500;
--font-weight-semibold: 600;
--font-weight-bold: 700;
--font-weight-extrabold: 800;
```

### 3.4 Altura de Linea

```css
--line-height-tight: 1.25;
--line-height-normal: 1.5;
--line-height-relaxed: 1.625;
```

---

## 4. ESPACIADO

```css
--spacing-0: 0;
--spacing-1: 0.25rem; /* 4px */
--spacing-2: 0.5rem; /* 8px */
--spacing-3: 0.75rem; /* 12px */
--spacing-4: 1rem; /* 16px */
--spacing-5: 1.25rem; /* 20px */
--spacing-6: 1.5rem; /* 24px */
--spacing-8: 2rem; /* 32px */
--spacing-10: 2.5rem; /* 40px */
--spacing-12: 3rem; /* 48px */
--spacing-16: 4rem; /* 64px */
```

---

## 5. LAYOUT

```css
--container-max-width: 1400px;
--header-height: 70px;
--header-height-scrolled: 50px;
--banner-height: 36px;
--sidebar-width: 280px;
```

---

## 6. Z-INDEX

```css
--z-dropdown: 100;
--z-sticky: 200;
--z-fixed: 300;
--z-modal-backdrop: 400;
--z-modal: 500;
--z-popover: 600;
--z-tooltip: 700;
--z-header: 1000;
--z-banner: 1001;
```

---

## 7. TRANSICIONES

```css
--transition-fast: 150ms ease;
--transition-normal: 300ms ease;
--transition-slow: 500ms ease;
--transition-bounce: 300ms cubic-bezier(0.4, 0, 0.2, 1);
```

---

## 8. BREAKPOINTS (Media Queries)

| Nombre | Min-width | Uso             |
| ------ | --------- | --------------- |
| `sm`   | 640px     | Moviles grandes |
| `md`   | 768px     | Tablets         |
| `lg`   | 1024px    | Desktop pequeno |
| `xl`   | 1280px    | Desktop         |
| `2xl`  | 1536px    | Desktop grande  |

```css
/* Ejemplo de uso */
@media (max-width: 768px) {
  /* Estilos movil */
}

@media (min-width: 1024px) {
  /* Estilos desktop */
}
```

---

## 9. COMPONENTES - GUIA DE ESTILO

### 9.1 Botones Primarios

```css
.btn-primary {
  background: var(--color-petrol-blue);
  color: var(--color-white);
  padding: 0.5rem 1.5rem;
  border-radius: var(--border-radius);
  font-weight: var(--font-weight-semibold);
  transition: var(--transition-fast);
}

.btn-primary:hover {
  background: var(--color-petrol-light);
}
```

### 9.2 Botones Secundarios

```css
.btn-secondary {
  background: transparent;
  color: var(--color-petrol-blue);
  border: 2px solid var(--color-petrol-blue);
  padding: 0.5rem 1.5rem;
  border-radius: var(--border-radius);
}

.btn-secondary:hover {
  background: var(--color-petrol-blue);
  color: var(--color-white);
}
```

### 9.3 Cards

```css
.card {
  background: var(--bg-primary);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-md);
  padding: var(--spacing-6);
}
```

### 9.4 Inputs

```css
input,
select,
textarea {
  border: 2px solid var(--border-color);
  border-radius: var(--border-radius);
  padding: var(--spacing-3) var(--spacing-4);
  font-size: var(--font-size-base);
}

input:focus {
  border-color: var(--color-petrol-blue);
  box-shadow: 0 0 0 3px rgba(35, 66, 74, 0.1);
}
```

---

## 10. ICONOGRAFIA

- **Libreria:** SVG inline (no dependencias externas)
- **Tamano por defecto:** 20x20px
- **Stroke width:** 2px
- **Color:** `currentColor` (hereda del padre)

---

## 11. IMAGENES

### Formatos preferidos

1. **WebP** (preferido para web)
2. **JPEG** (fotos de vehiculos)
3. **PNG** (logos, iconos con transparencia)
4. **SVG** (iconos, graficos)

### Lazy loading

Todas las imagenes de vehiculos deben usar `loading="lazy"`

---

## 12. ACCESIBILIDAD

- Contraste minimo: 4.5:1 para texto normal
- Focus visible en todos los elementos interactivos
- `aria-label` en botones sin texto
- Textos alternativos en imagenes

---

_Documento actualizado: 29 Enero 2025_
_Version: 1.2_

# Refactoring: Admin Productos Index Page

## Summary

Successfully refactored the massive `app/pages/admin/productos/index.vue` file from **2933 lines** to **1138 lines** (61% reduction).

## Changes Made

### New Sub-Components Created

Seven new sub-components were extracted to `app/components/admin/productos/`:

1. **AdminProductosFilters.vue** (~200 lines)
   - Search box
   - Online/Offline toggle
   - Category, status, subcategory, and type filters
   - Clear filters button
   - Props: filters, onlineFilter, subcategories, filteredTypes, hasActiveFilters
   - Events: update:filters, update:onlineFilter, clear

2. **AdminProductosToolbar.vue** (~130 lines)
   - Column group toggles
   - Drive connection button
   - Config button
   - Export button
   - Fullscreen toggle
   - Props: columnGroups, driveConnected, driveLoading, selectedCount, isFullscreen
   - Events: toggle-group, connect-drive, open-config, open-export, toggle-fullscreen

3. **AdminProductosTable.vue** (~380 lines)
   - Main data table with sortable columns
   - Dynamic column visibility based on active groups
   - Row selection
   - Status dropdown per vehicle
   - Action buttons (edit, Drive, export ficha, transaction, delete)
   - Props: vehicles, selectedIds, sortField, sortOrder, isGroupActive, activeFilterColumns, favCounts, hasActiveFilters, driveLoading, and helper functions
   - Events: update:selectAll, toggle-selection, toggle-sort, status-change, delete, export-ficha, transaction, open-drive-folder, clear-filters

4. **AdminProductosDeleteModal.vue** (~110 lines)
   - Confirmation modal for deleting vehicles
   - Requires typing "borrar" to confirm
   - Props: show, vehicle, confirmText
   - Events: update:confirmText, close, confirm

5. **AdminProductosExportModal.vue** (~130 lines)
   - Export vehicles to PDF or Excel
   - Choose scope: all, filtered, or selected
   - Props: show, exportFormat, exportScope, filteredCount, selectedCount, totalCount
   - Events: update:exportFormat, update:exportScope, close, confirm

6. **AdminProductosTransactionModal.vue** (~200 lines)
   - Register rental or sale transactions
   - Tab switcher between rent and sell
   - Different form fields for each type
   - Props: show, vehicle, transactionType, and form field values
   - Events: update events for all fields, close, confirm

7. **AdminProductosConfigModal.vue** (~350 lines)
   - Configure table columns
   - Two tabs: "Grupos de columnas" and "Ordenar tabla"
   - Create/edit/delete column groups
   - Drag-and-drop column reordering
   - Props: show, columnGroups, columnOrder, allColumns, availableColumnsForGroups, draggedColumn
   - Events: update:columnGroups, update:columnOrder, drag-start, drag-over, drag-end, create-group, delete-group, reset-config, close

### Architecture

The refactored page follows a **props-down, events-up** pattern:

- **State management** remains in the main page file
- **Business logic** (data fetching, export functions, etc.) stays in the page
- **UI rendering** is delegated to sub-components
- **Communication** via props and emitted events

### Benefits

1. **Maintainability**: Each component has a single, clear responsibility
2. **Readability**: Main page is now ~1100 lines instead of ~3000
3. **Reusability**: Components can be reused in other admin pages if needed
4. **Testing**: Smaller components are easier to test in isolation
5. **Type Safety**: Full TypeScript support with proper prop/emit typing
6. **No Behavior Changes**: Pure refactoring - all functionality preserved

### Files Modified

- `app/pages/admin/productos/index.vue` (refactored from 2933 to 1138 lines)
- `app/pages/admin/productos/index.vue.backup` (original backup)

### Files Created

- `app/components/admin/productos/AdminProductosFilters.vue`
- `app/components/admin/productos/AdminProductosToolbar.vue`
- `app/components/admin/productos/AdminProductosTable.vue`
- `app/components/admin/productos/AdminProductosDeleteModal.vue`
- `app/components/admin/productos/AdminProductosExportModal.vue`
- `app/components/admin/productos/AdminProductosTransactionModal.vue`
- `app/components/admin/productos/AdminProductosConfigModal.vue`

### What Remains in Main Page

The main page file still contains:

- All composables imports (useAdminVehicles, useAdminTypes, etc.)
- All state management (filters, selection, sorting, modal data)
- All business logic functions (data loading, exports, Drive integration)
- Helper functions (formatting, status classes, etc.)
- Component orchestration in template

### Testing

- TypeScript compilation: ✅ (types are correct)
- ESLint: ✅ (fixed type assertion lint errors)
- No runtime errors expected (pure refactoring, no logic changes)

### Next Steps

To further reduce the main page size (target <500 lines), consider:

1. Move export functions to a composable `useVehicleExports`
2. Move column configuration logic to a composable `useTableConfig`
3. Extract helper functions to utility files
4. Consider using Pinia store for shared state

### Notes

- All sub-components use `<script setup>` with TypeScript
- Scoped CSS is maintained in each component
- Mobile-first responsive design is preserved
- No functionality was changed - this is a pure refactoring

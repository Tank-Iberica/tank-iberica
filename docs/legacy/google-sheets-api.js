// ============================================
// CONFIGURACIÓN GOOGLE SHEETS API
// ============================================

const CONFIG = {
    // Proxy Apps Script (API_KEY queda en el servidor)
    PROXY_URL: 'https://script.google.com/macros/s/AKfycbzbuibOzpV1iSQVa1JtZny_WU06o18Xly4n2Az7CBKMvpNyiBvwTYLnhSFJfWTMjL90ww/exec',

    // Nombres de las hojas
    SHEETS: {
        SUBCATEGORIAS: 'subcategorias',
        FILTROS: 'filtros',
        VEHICULOS: 'vehiculos',
        NOTICIAS: 'noticias',
        COMENTARIOS: 'comentarios',
        SUBSCRIPCIONES: 'subscripciones',
        SOLICITANTES: 'solicitantes',
        ANUNCIANTES: 'anunciantes',
        CONFIG: 'config',
        ADMINS: 'admins',
        USUARIOS: 'usuarios'
    }
};

// ============================================
// FUNCIONES DE LECTURA
// ============================================

/**
 * Leer datos de una hoja específica
 * @param {string} sheetName - Nombre de la hoja
 * @returns {Promise<Array>} Array de objetos con los datos
 */
async function readSheetData(sheetName) {
    const url = `${CONFIG.PROXY_URL}?sheet=${encodeURIComponent(sheetName)}`;
    
    try {
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.values || data.values.length === 0) {
            console.log(`📭 No hay datos en ${sheetName}`);
            return [];
        }
        
        // Primera fila son los encabezados
        const headers = data.values[0];
        const rows = data.values.slice(1);
        
        // Convertir a array de objetos
        const objects = rows.map((row, index) => {
            const obj = {};
            headers.forEach((header, colIndex) => {
                let value = row[colIndex] || '';
                
                // Convertir "TRUE"/"FALSE" a boolean
                if (value === 'TRUE' || value === true) value = true;
                if (value === 'FALSE' || value === false) value = false;
                
                // Convertir números
                if (['id', 'año', 'precio', 'vistas', 'parent_id', 'noticia_id'].includes(header)) {
                    if (value) {
                        let strValue = String(value).trim();
                        // Limpiar separadores de miles
                        if (strValue.includes('.') && strValue.includes(',')) {
                            strValue = strValue.replace(/\./g, '').replace(',', '.');
                        } else if (strValue.includes(',')) {
                            const parts = strValue.split(',');
                            if (parts.length === 2 && parts[1].length === 3) {
                                strValue = strValue.replace(',', '');
                            } else {
                                strValue = strValue.replace(',', '.');
                            }
                        } else if (strValue.includes('.')) {
                            const parts = strValue.split('.');
                            if (parts.length === 2 && parts[1].length === 3) {
                                strValue = strValue.replace('.', '');
                            }
                        }
                        value = parseFloat(strValue) || 0;
                    } else {
                        value = 0;
                    }
                }
                
                // Parsear JSON
                if (['filtros_json', 'caracteristicas_extra'].includes(header) && value) {
                    try {
                        value = JSON.parse(value);
                    } catch (e) {
                        console.warn(`⚠️ Error parseando ${header} en fila ${index + 2}:`, value);
                        value = {};
                    }
                }
                
                // Parsear arrays separados por coma
                if (['hashtags', 'imagenes'].includes(header) && value) {
                    value = value.split(',').map(item => item.trim());
                }
                
                obj[header] = value;
            });
            return obj;
        });
        
        console.log(`✅ ${sheetName} - ${objects.length} registros cargados`);
        return objects;
        
    } catch (error) {
        console.error(`❌ Error leyendo ${sheetName}:`, error);
        throw error;
    }
}

/**
 * Cargar vehículos
 */
async function loadVehiculos() {
    return await readSheetData(CONFIG.SHEETS.VEHICULOS);
}

/**
 * Cargar noticias
 */
async function loadNoticias() {
    return await readSheetData(CONFIG.SHEETS.NOTICIAS);
}

/**
 * Cargar subcategorías
 */
async function loadSubcategorias() {
    return await readSheetData(CONFIG.SHEETS.SUBCATEGORIAS);
}

/**
 * Cargar filtros
 */
async function loadFiltros() {
    return await readSheetData(CONFIG.SHEETS.FILTROS);
}

/**
 * Cargar configuración (banner, emails, etc)
 */
async function loadConfig() {
    const data = await readSheetData(CONFIG.SHEETS.CONFIG);
    // Convertir a objeto clave-valor
    const config = {};
    data.forEach(row => {
        config[row.clave] = {
            valor_es: row.valor_es || '',
            valor_en: row.valor_en || '',
            extra: row.extra || '',
            activo: row.activo === true || row.activo === 'TRUE'
        };
    });
    return config;
}

/**
 * Cargar comentarios de una noticia
 */
async function loadComentarios(noticiaId = null) {
    const comentarios = await readSheetData(CONFIG.SHEETS.COMENTARIOS);
    if (noticiaId) {
        return comentarios.filter(c => c.noticia_id === noticiaId && c.moderado === true);
    }
    return comentarios;
}

// ============================================
// VALIDACIÓN DE CONFIGURACIÓN
// ============================================

function validarConfiguracion() {
    if (!CONFIG.PROXY_URL) {
        console.error('❌ Falta configurar PROXY_URL');
        return false;
    }

    console.log('✅ Configuración válida');
    return true;
}

// Exportar para uso en módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        CONFIG,
        readSheetData,
        loadVehiculos,
        loadNoticias,
        loadSubcategorias,
        loadFiltros,
        loadConfig,
        loadComentarios,
        validarConfiguracion
    };
}

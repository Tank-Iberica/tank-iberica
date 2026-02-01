// ============================================
// TANK IBERICA - Main JavaScript
// ============================================

const CONFIG = {
    SPREADSHEET_ID: '1GdmirqWFKVt39QvEJxdMH3zW0-itl64YuqYEsOAkF30',
    API_KEY: 'AIzaSyCzN8LEMBXM75Mkop9NH0iGqa4XTmLX0i4' // Reemplazar con tu API Key de Google
};

let currentLang = 'es';
let vehiculos = [];
let subcategorias = [];
let filtrosConfig = [];
let configData = {};
let currentCategory = 'venta';
let currentSubcategory = null;
let activeFilters = {};

// ============================================
// DETECCIÓN DE IDIOMA POR IP
// ============================================
async function detectLanguageByIP() {
    try {
        const controller = new AbortController();
        setTimeout(() => controller.abort(), 5000);
        const response = await fetch('https://ipapi.co/json/', { signal: controller.signal });
        if (response.ok) {
            const data = await response.json();
            if (data.country_code !== 'ES') {
                currentLang = 'en';
                console.log('🌍 País:', data.country_code, '→ EN');
            }
        }
    } catch (e) {
        console.warn('⚠️ IP detection failed, defaulting to ES');
    }
    const saved = localStorage.getItem('tank_lang');
    if (saved) currentLang = saved;
    applyLanguage();
}

function setLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('tank_lang', lang);
    applyLanguage();
    initBanner();
    renderSubcategories();
    renderFilters();
    renderProducts();
}

function applyLanguage() {
    document.documentElement.lang = currentLang;
    document.querySelectorAll('[data-es][data-en]').forEach(el => {
        el.textContent = el.dataset[currentLang];
    });
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.lang === currentLang);
    });
}

// ============================================
// CARGAR DATOS DE GOOGLE SHEETS
// ============================================
async function loadSheetData(sheetName) {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${CONFIG.SPREADSHEET_ID}/values/${sheetName}?key=${CONFIG.API_KEY}`;
    try {
        const response = await fetch(url);
        if (!response.ok) return [];
        const data = await response.json();
        if (!data.values || data.values.length < 2) return [];
        const headers = data.values[0];
        return data.values.slice(1).map(row => {
            const obj = {};
            headers.forEach((h, i) => {
                let val = row[i] || '';
                if (val === 'TRUE') val = true;
                else if (val === 'FALSE') val = false;
                else if (h === 'filtros_json' && val) {
                    try { val = JSON.parse(val); } catch { val = {}; }
                }
                obj[h] = val;
            });
            return obj;
        });
    } catch (e) {
        console.error(`Error loading ${sheetName}:`, e);
        return [];
    }
}

async function loadAllData() {
    console.log('🔄 Cargando datos...');
    try {
        const [vehData, subData, filData, cfgData] = await Promise.all([
            loadSheetData('vehiculos'),
            loadSheetData('subcategorias'),
            loadSheetData('filtros'),
            loadSheetData('config')
        ]);
        
        vehiculos = vehData.filter(v => v.publicado).map(v => ({
            ...v,
            id: parseInt(v.id) || 0,
            precio: parseFloat(v.precio) || 0,
            año: parseInt(v.año) || 0,
            imagenes: v.imagenes ? v.imagenes.split(',').map(u => u.trim()) : []
        }));
        
        subcategorias = subData.filter(s => s.publicado);
        filtrosConfig = filData.filter(f => f.publicado);
        cfgData.forEach(row => { configData[row.clave] = row; });
        
        console.log('✅ Cargados:', vehiculos.length, 'vehículos');
        
        initBanner();
        renderSubcategories();
        renderFilters();
        renderProducts();
        updateStats();
    } catch (e) {
        console.error('❌ Error:', e);
    }
}

// ============================================
// BANNER DINÁMICO
// ============================================
function initBanner() {
    const banner = configData.banner;
    const bannerEl = document.getElementById('topBanner');
    if (!bannerEl) return;
    
    if (!banner || !banner.activo) {
        bannerEl.style.display = 'none';
        document.body.classList.remove('banner-visible');
        return;
    }
    
    const now = new Date();
    const inicio = banner.extra2 || banner.fecha_inicio;
    const fin = banner.extra3 || banner.fecha_fin;
    
    if (inicio && new Date(inicio) > now) {
        bannerEl.style.display = 'none';
        return;
    }
    if (fin && new Date(fin) < now) {
        bannerEl.style.display = 'none';
        return;
    }
    
    const texto = currentLang === 'es' ? banner.valor_es : (banner.valor_en || banner.valor_es);
    const url = banner.extra || '';
    
    let html = `<span>${texto}</span>`;
    if (url.trim()) {
        const isExternal = url.startsWith('http') && !url.includes(window.location.hostname);
        const target = isExternal ? ' target="_blank"' : '';
        const linkText = currentLang === 'es' ? 'Más información' : 'More info';
        html += ` <a href="${url}"${target} class="banner-link">${linkText}</a>`;
    }
    html += '<button class="banner-close" onclick="closeBanner()">×</button>';
    
    bannerEl.innerHTML = html;
    bannerEl.style.display = 'flex';
    document.body.classList.add('banner-visible');
}

function closeBanner() {
    const el = document.getElementById('topBanner');
    if (el) {
        el.style.display = 'none';
        document.body.classList.remove('banner-visible');
    }
}
// ============================================
// SUBCATEGORÍAS
// ============================================
function renderSubcategories() {
    const container = document.getElementById('subcategoryTabs');
    if (!container) return;
    
    const subsConStock = subcategorias.filter(sub => 
        vehiculos.some(v => v.categoria === currentCategory && v.subcategoria === sub.nombre)
    );
    
    if (subsConStock.length === 0) {
        container.innerHTML = '';
        return;
    }
    
    const total = vehiculos.filter(v => v.categoria === currentCategory).length;
    let html = `<button class="subcat-tab ${!currentSubcategory ? 'active' : ''}" onclick="selectSubcategory(null)">
        ${currentLang === 'es' ? 'Todos' : 'All'} <span class="count">${total}</span>
    </button>`;
    
    subsConStock.forEach(sub => {
        const count = vehiculos.filter(v => v.categoria === currentCategory && v.subcategoria === sub.nombre).length;
        html += `<button class="subcat-tab ${currentSubcategory === sub.nombre ? 'active' : ''}" onclick="selectSubcategory('${sub.nombre}')">
            ${sub.nombre} <span class="count">${count}</span>
        </button>`;
    });
    
    container.innerHTML = html;
}

function selectSubcategory(name) {
    currentSubcategory = name;
    activeFilters = {};
    renderSubcategories();
    renderFilters();
    renderProducts();
}

// ============================================
// FILTROS DINÁMICOS
// ============================================
function renderFilters() {
    const container = document.getElementById('filtersContainer');
    if (!container) return;
    
    let filtrosAplicables = [];
    if (currentSubcategory) {
        const subcat = subcategorias.find(s => s.nombre === currentSubcategory);
        if (subcat?.filtros_aplicables) {
            const nombres = subcat.filtros_aplicables.split(',').map(n => n.trim().toLowerCase());
            filtrosAplicables = filtrosConfig.filter(f => nombres.includes((f.nombre || '').toLowerCase()));
        }
    }
    
    const basicos = ['precio', 'marca', 'año', 'ubicacion'];
    const filtrosBasicos = filtrosConfig.filter(f => basicos.includes((f.nombre || '').toLowerCase()));
    const todos = [...new Map([...filtrosBasicos, ...filtrosAplicables].map(f => [f.nombre, f])).values()];
    
    if (todos.length === 0) { container.innerHTML = ''; return; }
    
    const vehsDisponibles = vehiculos.filter(v => 
        v.categoria === currentCategory && (!currentSubcategory || v.subcategoria === currentSubcategory)
    );
    
    let html = '<div class="filters-grid">';
    todos.forEach(f => { html += renderFiltro(f, vehsDisponibles); });
    html += '</div>';
    
    if (Object.keys(activeFilters).length > 0) {
        html += `<button class="btn-clear-filters" onclick="clearFilters()">${currentLang === 'es' ? 'Limpiar filtros' : 'Clear filters'}</button>`;
    }
    
    container.innerHTML = html;
}

function renderFiltro(filtro, vehs) {
    const nombre = filtro.nombre || '';
    const tipo = filtro.tipo || 'desplegable';
    const lower = nombre.toLowerCase();
    
    let valores = [];
    if (lower === 'marca') valores = [...new Set(vehs.map(v => v.marca).filter(Boolean))].sort();
    else if (lower === 'año') valores = [...new Set(vehs.map(v => v.año).filter(v => v > 0))].sort((a,b) => b-a);
    else if (lower === 'ubicacion') valores = [...new Set(vehs.map(v => v.ubicacion).filter(Boolean))].sort();
    else if (lower === 'precio') {
        const precios = vehs.map(v => v.precio).filter(p => p > 0);
        if (precios.length > 1) {
            const min = Math.min(...precios), max = Math.max(...precios);
            if (min !== max) return renderRangeFilter(filtro, min, max);
        }
        return '';
    } else {
        valores = [...new Set(vehs.map(v => v.filtros_json?.[lower]).filter(Boolean))].sort();
    }
    
    if (valores.length === 0) return '';
    
    if (tipo === 'tick') return renderTickFilter(filtro);
    if (tipo === 'slider' || tipo === 'calc') {
        const nums = valores.filter(v => !isNaN(v)).map(Number);
        if (nums.length > 1) return renderRangeFilter(filtro, Math.min(...nums), Math.max(...nums));
        return '';
    }
    if (tipo === 'desplegable_tick') return renderCheckFilter(filtro, valores);
    return renderSelectFilter(filtro, valores);
}

function renderSelectFilter(f, opts) {
    const val = activeFilters[f.nombre] || '';
    return `<div class="filter-item"><label>${f.nombre}</label>
        <select onchange="setFilter('${f.nombre}', this.value)">
            <option value="">${currentLang === 'es' ? 'Todos' : 'All'}</option>
            ${opts.map(o => `<option value="${o}" ${val === String(o) ? 'selected' : ''}>${o}</option>`).join('')}
        </select></div>`;
}

function renderCheckFilter(f, opts) {
    const vals = activeFilters[f.nombre] || [];
    return `<div class="filter-item"><label>${f.nombre}</label>
        <div class="checkbox-group">${opts.map(o => `<label class="cb"><input type="checkbox" ${vals.includes(String(o)) ? 'checked' : ''} onchange="toggleFilter('${f.nombre}','${o}')"><span>${o}</span></label>`).join('')}</div></div>`;
}

function renderTickFilter(f) {
    const checked = activeFilters[f.nombre] || false;
    return `<div class="filter-item"><label class="cb"><input type="checkbox" ${checked ? 'checked' : ''} onchange="setFilter('${f.nombre}', this.checked)"><span>${f.nombre}</span></label></div>`;
}

function renderRangeFilter(f, min, max) {
    const cMin = activeFilters[`${f.nombre}_min`] || min;
    const cMax = activeFilters[`${f.nombre}_max`] || max;
    const label = f.nombre.toLowerCase() === 'precio' ? `${f.nombre} (€)` : f.nombre;
    return `<div class="filter-item"><label>${label}</label>
        <div class="range-inputs">
            <input type="number" value="${cMin}" onchange="setFilter('${f.nombre}_min', this.value)" placeholder="Min">
            <span>-</span>
            <input type="number" value="${cMax}" onchange="setFilter('${f.nombre}_max', this.value)" placeholder="Max">
        </div></div>`;
}

function setFilter(name, val) {
    if (val === '' || val === false) delete activeFilters[name];
    else activeFilters[name] = val;
    renderFilters();
    renderProducts();
}

function toggleFilter(name, val) {
    if (!activeFilters[name]) activeFilters[name] = [];
    const idx = activeFilters[name].indexOf(val);
    if (idx > -1) activeFilters[name].splice(idx, 1);
    else activeFilters[name].push(val);
    if (activeFilters[name].length === 0) delete activeFilters[name];
    renderFilters();
    renderProducts();
}

function clearFilters() {
    activeFilters = {};
    renderFilters();
    renderProducts();
}

// ============================================
// PRODUCTOS
// ============================================
function getFilteredVehicles() {
    let result = vehiculos.filter(v => 
        v.categoria === currentCategory && (!currentSubcategory || v.subcategoria === currentSubcategory)
    );
    
    Object.keys(activeFilters).forEach(key => {
        const val = activeFilters[key];
        const lower = key.toLowerCase();
        
        if (lower === 'marca') result = result.filter(v => v.marca === val);
        else if (lower === 'año') result = result.filter(v => v.año === parseInt(val));
        else if (lower === 'ubicacion') result = result.filter(v => v.ubicacion === val);
        else if (lower === 'precio_min') result = result.filter(v => v.precio >= parseFloat(val));
        else if (lower === 'precio_max') result = result.filter(v => v.precio <= parseFloat(val));
        else if (key.endsWith('_min')) {
            const n = key.replace('_min', '').toLowerCase();
            result = result.filter(v => parseFloat(v.filtros_json?.[n] || 0) >= parseFloat(val));
        } else if (key.endsWith('_max')) {
            const n = key.replace('_max', '').toLowerCase();
            result = result.filter(v => parseFloat(v.filtros_json?.[n] || 999999) <= parseFloat(val));
        } else if (Array.isArray(val)) {
            result = result.filter(v => val.includes(String(v.filtros_json?.[lower])));
        } else if (typeof val === 'boolean' && val) {
            result = result.filter(v => ['true','TRUE','Sí','Si','Yes'].includes(String(v.filtros_json?.[lower])));
        }
    });
    
    return result;
}

function renderProducts() {
    const container = document.getElementById('productsGrid');
    if (!container) return;
    
    const products = getFilteredVehicles();
    const countEl = document.getElementById('productsCount');
    if (countEl) countEl.textContent = products.length;
    
    if (products.length === 0) {
        container.innerHTML = `<div class="no-products"><p>${currentLang === 'es' ? 'No se encontraron vehículos' : 'No vehicles found'}</p>
            <button onclick="clearFilters()">${currentLang === 'es' ? 'Limpiar filtros' : 'Clear filters'}</button></div>`;
        return;
    }
    
    container.innerHTML = products.map(v => {
        const img = v.imagenes?.[0] || 'placeholder.jpg';
        const loc = currentLang === 'es' ? v.ubicacion : (v.ubicacion_en || v.ubicacion);
        let precio;
        if (v.categoria === 'terceros' || v.precio === 0) precio = `<span class="price consultar">${currentLang === 'es' ? 'A consultar' : 'On request'}</span>`;
        else if (v.categoria === 'alquiler') precio = `<span class="price">${formatPrice(v.precio)}€<small>/mes</small></span>`;
        else precio = `<span class="price">${formatPrice(v.precio)}€</span>`;
        
        return `<article class="product-card" onclick="openDetail(${v.id})">
            <div class="product-image"><img src="${img}" alt="${v.marca} ${v.modelo}" loading="lazy"></div>
            <div class="product-info">
                <h3>${v.marca} ${v.modelo}</h3>
                <p class="year">${v.año}</p>
                <p class="location">📍 ${loc || ''}</p>
                <div class="price-wrap">${precio}</div>
            </div>
        </article>`;
    }).join('');
}

function openDetail(id) {
    console.log('Abrir detalle:', id);
    // TODO: Modal de detalle
}

function selectCategory(cat) {
    currentCategory = cat;
    currentSubcategory = null;
    activeFilters = {};
    document.querySelectorAll('.category-tab').forEach(t => t.classList.toggle('active', t.dataset.category === cat));
    renderSubcategories();
    renderFilters();
    renderProducts();
    updateStats();
}

function updateStats() {
    ['venta', 'alquiler', 'terceros'].forEach(cat => {
        const count = vehiculos.filter(v => v.categoria === cat).length;
        const el = document.querySelector(`[data-category="${cat}"] .count`);
        if (el) el.textContent = count;
    });
}

function formatPrice(n) { return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }

// ============================================
// INICIALIZACIÓN
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Tank Iberica iniciando...');
    await detectLanguageByIP();
    await loadAllData();
    
    document.querySelectorAll('.lang-btn').forEach(btn => btn.addEventListener('click', () => setLanguage(btn.dataset.lang)));
    document.querySelectorAll('.category-tab').forEach(tab => tab.addEventListener('click', () => selectCategory(tab.dataset.category)));
    
    const search = document.getElementById('searchInput');
    if (search) {
        let timeout;
        search.addEventListener('input', e => {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                activeFilters.busqueda = e.target.value.toLowerCase();
                renderProducts();
            }, 300);
        });
    }
});

// Exponer globalmente
window.setLanguage = setLanguage;
window.selectCategory = selectCategory;
window.selectSubcategory = selectSubcategory;
window.setFilter = setFilter;
window.toggleFilter = toggleFilter;
window.clearFilters = clearFilters;
window.closeBanner = closeBanner;
window.openDetail = openDetail;

/**
 * ================================================
 * TANK IBERICA - PANEL DE USUARIO "MI CUENTA"
 * ================================================
 * 
 * Panel lateral para gestión de cuenta de usuario
 * NO crea HTML - usa el panel existente en Index.html
 */

// ================================================
// CONFIGURACIÓN
// ================================================

const PANEL_CONFIG = {
    APPS_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbzvweSBncWu0sXaZspE6tQ6ZMJIIcmk9dKlpXgjdSdU0LJZUzLOsE3LdeuSkP86H337sw/exec'
};

// ================================================
// INICIALIZACIÓN
// ================================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('👤 Inicializando panel de usuario...');
    setupPanelEventListeners();
});

// ================================================
// SETUP EVENT LISTENERS
// ================================================

function setupPanelEventListeners() {
    // Cerrar panel con X
    const closeBtn = document.getElementById('userPanelClose');
    if (closeBtn) {
        closeBtn.onclick = cerrarPanelUsuario;
    }
    
    // Cerrar panel con click fuera
    const panel = document.getElementById('userPanel');
    if (panel) {
        panel.addEventListener('click', (e) => {
            if (e.target.id === 'userPanel') {
                cerrarPanelUsuario();
            }
        });
    }
    
    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.onclick = () => {
            if (typeof cerrarSesion === 'function') {
                cerrarSesion();
            } else {
                // Fallback
                localStorage.removeItem('tank_iberica_session');
                localStorage.removeItem('tank_iberica_user');
                location.reload();
            }
        };
    }
    
    console.log('✅ Panel de usuario inicializado');
}

// ================================================
// ABRIR/CERRAR PANEL
// ================================================

function abrirPanelUsuario() {
    // Obtener usuario actual
    const userDataStr = localStorage.getItem('tank_iberica_user');
    if (!userDataStr) {
        console.warn('⚠️ No hay usuario logueado');
        return;
    }
    
    const usuario = JSON.parse(userDataStr);
    
    const panel = document.getElementById('userPanel');
    if (!panel) {
        console.error('❌ Panel userPanel no encontrado');
        return;
    }
    
    // Actualizar datos del panel
    const userPseudo = document.getElementById('userPseudo');
    const userEmail = document.getElementById('userEmail');
    const userName = document.getElementById('userName');
    const userPhone = document.getElementById('userPhone');
    const userSince = document.getElementById('userSince');
    
    if (userPseudo) userPseudo.textContent = usuario.pseudonimo || 'Usuario';
    if (userEmail) userEmail.textContent = usuario.email || '';
    if (userName) userName.textContent = `${usuario.nombre || ''} ${usuario.apellidos || ''}`.trim();
    if (userPhone) userPhone.textContent = usuario.telefono || '';
    
    if (userSince && usuario.fecha_registro) {
        const fecha = new Date(usuario.fecha_registro);
        userSince.textContent = fecha.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
    
    // Mostrar panel
    panel.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    // Cargar favoritos si existe la función
    if (typeof cargarFavoritosUsuario === 'function') {
        cargarFavoritosUsuario(usuario.id);
    }
    
    console.log('📂 Panel abierto para:', usuario.pseudonimo);
}

function cerrarPanelUsuario() {
    const panel = document.getElementById('userPanel');
    if (panel) {
        panel.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// ================================================
// CARGAR FAVORITOS
// ================================================

async function cargarFavoritosUsuario(userId) {
    const favoritosContainer = document.getElementById('userFavorites');
    if (!favoritosContainer) return;
    
    favoritosContainer.innerHTML = '<p class="loading">Cargando favoritos...</p>';
    
    try {
        const response = await fetch(`${PANEL_CONFIG.APPS_SCRIPT_URL}?action=obtenerFavoritos&userId=${userId}`);
        const result = await response.json();
        
        if (result.success && result.favoritos && result.favoritos.length > 0) {
            favoritosContainer.innerHTML = result.favoritos.map(fav => `
                <div class="favorite-item" onclick="verVehiculo(${fav.vehiculoId})">
                    <img src="${fav.imagen || 'placeholder.jpg'}" alt="${fav.titulo}">
                    <h4>${fav.titulo}</h4>
                    <p>${fav.precio}</p>
                </div>
            `).join('');
        } else {
            favoritosContainer.innerHTML = '<p class="empty-state">No tienes vehículos en favoritos</p>';
        }
    } catch (error) {
        console.error('Error cargando favoritos:', error);
        favoritosContainer.innerHTML = '<p class="empty-state">Error al cargar favoritos</p>';
    }
}

// ================================================
// UTILIDADES
// ================================================

function obtenerUsuarioActual() {
    const userDataStr = localStorage.getItem('tank_iberica_user');
    return userDataStr ? JSON.parse(userDataStr) : null;
}

function estaLogueado() {
    const session = localStorage.getItem('tank_iberica_session');
    const user = localStorage.getItem('tank_iberica_user');
    
    if (session && user) {
        try {
            const sessionData = JSON.parse(session);
            return Date.now() < sessionData.expiracion;
        } catch {
            return false;
        }
    }
    return false;
}

// ================================================
// EXPORTAR FUNCIONES GLOBALES
// ================================================

window.abrirPanelUsuario = abrirPanelUsuario;
window.cerrarPanelUsuario = cerrarPanelUsuario;
window.obtenerUsuarioActual = obtenerUsuarioActual;
window.estaLogueado = estaLogueado;

console.log('✅ user-panel.js cargado');

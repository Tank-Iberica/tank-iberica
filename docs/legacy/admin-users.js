/**
 * ================================================
 * TANK IBERICA - GESTIÓN DE USUARIOS (ADMIN)
 * ================================================
 */

// ================================================
// CONFIGURACIÓN
// ================================================

const ADMIN_CONFIG = {
    APPS_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbwKvLdU3Fw0Wy8ZsqjuCdvfkFEsZyQEKmyvi2GXEU_CC4Vv4zlJglPj6qtnAwIALYNoVA/exec',
    SHEET_ID: '1GdmirqWFKVt39QvEJxdMH3zW0-itl64YuqYEsOAkF30'
};

let todosLosUsuarios = [];
let solicitudesPendientes = [];

// ================================================
// CARGAR USUARIOS
// ================================================

async function cargarUsuarios() {
    console.log('👥 Cargando usuarios...');
    
    const tbody = document.getElementById('tbodyUsuarios');
    tbody.innerHTML = '<tr><td colspan="8" class="loading">Cargando usuarios...</td></tr>';
    
    try {
        // Opción 1: Desde Google Sheets API directamente
        await cargarUsuariosDesdeSheets();
        
        // Opción 2: Desde Apps Script
        // await cargarUsuariosDesdeAppsScript();
        
    } catch (error) {
        console.error('Error cargando usuarios:', error);
        tbody.innerHTML = '<tr><td colspan="8" class="error">Error al cargar usuarios</td></tr>';
    }
}

async function cargarUsuariosDesdeSheets() {
    const range = 'usuarios!A2:L1000'; // Ajustar según sea necesario
    
    try {
        const response = await gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: ADMIN_CONFIG.SHEET_ID,
            range: range
        });
        
        const rows = response.result.values || [];
        
        todosLosUsuarios = rows.map(row => ({
            id: row[0] || '',
            pseudonimo: row[1] || '',
            nombre: row[2] || '',
            apellidos: row[3] || '',
            email: row[4] || '',
            telefono: row[5] || '',
            fecha_registro: row[6] || '',
            estado: row[7] || '',
            otp_actual: row[8] || '',
            otp_expiracion: row[9] || '',
            ultimo_acceso: row[10] || '',
            favoritos_json: row[11] || '{}'
        }));
        
        console.log(`✅ ${todosLosUsuarios.length} usuarios cargados`);
        
        renderizarUsuarios(todosLosUsuarios);
        actualizarEstadisticasUsuarios();
        cargarSolicitudesPendientes();
        
    } catch (error) {
        console.error('Error en API:', error);
        throw error;
    }
}

async function cargarUsuariosDesdeAppsScript() {
    try {
        const response = await fetch(`${ADMIN_CONFIG.APPS_SCRIPT_URL}?action=obtenerUsuarios`);
        const result = await response.json();
        
        if (result.success) {
            todosLosUsuarios = result.usuarios;
            renderizarUsuarios(todosLosUsuarios);
            actualizarEstadisticasUsuarios();
        } else {
            throw new Error(result.message || 'Error desconocido');
        }
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}

// ================================================
// RENDERIZAR USUARIOS
// ================================================

function renderizarUsuarios(usuarios) {
    const tbody = document.getElementById('tbodyUsuarios');
    
    if (usuarios.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="info">No hay usuarios registrados</td></tr>';
        return;
    }
    
    tbody.innerHTML = usuarios.map(usuario => `
        <tr>
            <td>${escapeHTML(usuario.id)}</td>
            <td><strong>${escapeHTML(usuario.pseudonimo)}</strong></td>
            <td>${escapeHTML(usuario.nombre)} ${escapeHTML(usuario.apellidos)}</td>
            <td>${escapeHTML(usuario.email)}</td>
            <td>${escapeHTML(usuario.telefono)}</td>
            <td>${escapeHTML(formatearFecha(usuario.fecha_registro))}</td>
            <td><span class="badge-estado ${escapeHTML(usuario.estado)}">${escapeHTML(formatearEstado(usuario.estado))}</span></td>
            <td>
                <div class="table-actions">
                    <button onclick="verPerfilUsuario(${parseInt(usuario.id) || 0})" title="Ver perfil">👁️</button>
                    <button onclick="editarUsuario(${parseInt(usuario.id) || 0})" title="Editar">✏️</button>
                    ${usuario.estado === 'activo' ?
                        `<button onclick="desactivarUsuario(${parseInt(usuario.id) || 0})" title="Desactivar">⛔</button>` :
                        `<button onclick="activarUsuario(${parseInt(usuario.id) || 0})" title="Activar">✅</button>`
                    }
                    <button onclick="enviarEmailUsuario(${parseInt(usuario.id) || 0})" title="Enviar email">📧</button>
                </div>
            </td>
        </tr>
    `).join('');
}

// ================================================
// ESTADÍSTICAS
// ================================================

function actualizarEstadisticasUsuarios() {
    const total = todosLosUsuarios.length;
    const activos = todosLosUsuarios.filter(u => u.estado === 'activo').length;
    const pendientes = todosLosUsuarios.filter(u => u.estado === 'pendiente_verificacion').length;
    const eliminados = todosLosUsuarios.filter(u => u.estado === 'eliminado').length;
    
    document.getElementById('totalUsuarios').textContent = total;
    document.getElementById('usuariosActivos').textContent = activos;
    document.getElementById('usuariosPendientes').textContent = pendientes;
    document.getElementById('usuariosEliminados').textContent = eliminados;
    
    // Badge en nav
    const badgeUsuarios = document.getElementById('badgeUsuarios');
    if (badgeUsuarios) {
        const pendientesTotales = pendientes + solicitudesPendientes.length;
        badgeUsuarios.textContent = pendientesTotales;
        badgeUsuarios.style.display = pendientesTotales > 0 ? 'inline-block' : 'none';
    }
}

// ================================================
// SOLICITUDES PENDIENTES
// ================================================

async function cargarSolicitudesPendientes() {
    // TODO: Cargar desde sheet "solicitudes_datos"
    solicitudesPendientes = [];
    
    const container = document.getElementById('solicitudesPendientes');
    const lista = document.getElementById('listaSolicitudes');
    
    if (solicitudesPendientes.length > 0) {
        container.style.display = 'block';
        lista.innerHTML = solicitudesPendientes.map(sol => `
            <div class="solicitud-item">
                <div>
                    <strong>${escapeHTML(sol.tipo_cambio)}</strong>: ${escapeHTML(sol.usuario_pseudonimo)}<br>
                    <small>De: "${escapeHTML(sol.valor_actual)}" → "${escapeHTML(sol.valor_nuevo)}"</small>
                </div>
                <div class="table-actions">
                    <button onclick="aprobarSolicitud(${parseInt(sol.id) || 0})" class="btn-success">Aprobar</button>
                    <button onclick="rechazarSolicitud(${parseInt(sol.id) || 0})" class="btn-danger">Rechazar</button>
                </div>
            </div>
        `).join('');
    } else {
        container.style.display = 'none';
    }
}

// ================================================
// FILTROS Y BÚSQUEDA
// ================================================

document.addEventListener('DOMContentLoaded', () => {
    // Búsqueda
    const buscarInput = document.getElementById('buscarUsuario');
    if (buscarInput) {
        buscarInput.addEventListener('input', filtrarUsuarios);
    }
    
    // Filtro estado
    const filtroEstado = document.getElementById('filtroEstadoUsuario');
    if (filtroEstado) {
        filtroEstado.addEventListener('change', filtrarUsuarios);
    }
});

function filtrarUsuarios() {
    const busqueda = document.getElementById('buscarUsuario').value.toLowerCase();
    const estado = document.getElementById('filtroEstadoUsuario').value;
    
    let usuariosFiltrados = todosLosUsuarios;
    
    // Filtrar por búsqueda
    if (busqueda) {
        usuariosFiltrados = usuariosFiltrados.filter(u => 
            u.pseudonimo.toLowerCase().includes(busqueda) ||
            u.nombre.toLowerCase().includes(busqueda) ||
            u.apellidos.toLowerCase().includes(busqueda) ||
            u.email.toLowerCase().includes(busqueda)
        );
    }
    
    // Filtrar por estado
    if (estado) {
        usuariosFiltrados = usuariosFiltrados.filter(u => u.estado === estado);
    }
    
    renderizarUsuarios(usuariosFiltrados);
}

// ================================================
// ACCIONES DE USUARIO
// ================================================

function verPerfilUsuario(userId) {
    const usuario = todosLosUsuarios.find(u => u.id == userId);
    if (!usuario) return;
    
    const modal = crearModalPerfil(usuario);
    document.getElementById('modalContainer').innerHTML = '';
    document.getElementById('modalContainer').appendChild(modal);
    modal.classList.add('active');
}

function crearModalPerfil(usuario) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    
    modal.innerHTML = `
        <div class="modal-overlay"></div>
        <div class="modal-content" style="max-width: 600px;">
            <button class="modal-close" onclick="cerrarModal()">×</button>
            
            <h2>👤 Perfil de Usuario</h2>

            <div class="perfil-info">
                <div class="perfil-row">
                    <label>ID:</label>
                    <span>${escapeHTML(usuario.id)}</span>
                </div>
                <div class="perfil-row">
                    <label>Pseudónimo:</label>
                    <span><strong>${escapeHTML(usuario.pseudonimo)}</strong></span>
                </div>
                <div class="perfil-row">
                    <label>Nombre completo:</label>
                    <span>${escapeHTML(usuario.nombre)} ${escapeHTML(usuario.apellidos)}</span>
                </div>
                <div class="perfil-row">
                    <label>Email:</label>
                    <span>${escapeHTML(usuario.email)}</span>
                </div>
                <div class="perfil-row">
                    <label>Teléfono:</label>
                    <span>${escapeHTML(usuario.telefono)}</span>
                </div>
                <div class="perfil-row">
                    <label>Fecha de registro:</label>
                    <span>${escapeHTML(formatearFecha(usuario.fecha_registro))}</span>
                </div>
                <div class="perfil-row">
                    <label>Último acceso:</label>
                    <span>${escapeHTML(formatearFecha(usuario.ultimo_acceso))}</span>
                </div>
                <div class="perfil-row">
                    <label>Estado:</label>
                    <span class="badge-estado ${escapeHTML(usuario.estado)}">${escapeHTML(formatearEstado(usuario.estado))}</span>
                </div>
            </div>

            <div class="perfil-acciones">
                <button onclick="editarUsuario(${parseInt(usuario.id) || 0})" class="btn-secondary">Editar</button>
                ${usuario.estado === 'activo' ?
                    `<button onclick="desactivarUsuario(${parseInt(usuario.id) || 0})" class="btn-danger">Desactivar</button>` :
                    `<button onclick="activarUsuario(${parseInt(usuario.id) || 0})" class="btn-success">Activar</button>`
                }
                <button onclick="enviarEmailUsuario(${parseInt(usuario.id) || 0})" class="btn-primary">Enviar Email</button>
            </div>
        </div>
    `;
    
    modal.querySelector('.modal-overlay').addEventListener('click', cerrarModal);
    
    return modal;
}

function editarUsuario(userId) {
    // TODO: Implementar modal de edición
    alert('Funcionalidad en desarrollo');
}

async function activarUsuario(userId) {
    if (!confirm('¿Activar este usuario?')) return;
    
    try {
        // TODO: Actualizar en Google Sheets
        alert('Usuario activado (pendiente implementación)');
        cargarUsuarios();
    } catch (error) {
        console.error('Error:', error);
        alert('Error al activar usuario');
    }
}

async function desactivarUsuario(userId) {
    if (!confirm('¿Desactivar este usuario?')) return;
    
    try {
        // TODO: Actualizar en Google Sheets
        alert('Usuario desactivado (pendiente implementación)');
        cargarUsuarios();
    } catch (error) {
        console.error('Error:', error);
        alert('Error al desactivar usuario');
    }
}

function enviarEmailUsuario(userId) {
    const usuario = todosLosUsuarios.find(u => u.id == userId);
    if (!usuario) return;
    
    const asunto = prompt('Asunto del email:');
    if (!asunto) return;
    
    const mensaje = prompt('Mensaje:');
    if (!mensaje) return;
    
    // TODO: Enviar email vía Apps Script
    alert(`Email enviado a ${usuario.email} (pendiente implementación)`);
}

// ================================================
// GESTIÓN DE SOLICITUDES
// ================================================

async function aprobarSolicitud(solicitudId) {
    if (!confirm('¿Aprobar esta solicitud?')) return;
    
    try {
        // TODO: Implementar aprobación
        alert('Solicitud aprobada (pendiente implementación)');
        cargarSolicitudesPendientes();
        cargarUsuarios();
    } catch (error) {
        console.error('Error:', error);
        alert('Error al aprobar solicitud');
    }
}

async function rechazarSolicitud(solicitudId) {
    const motivo = prompt('Motivo del rechazo:');
    if (!motivo) return;
    
    try {
        // TODO: Implementar rechazo
        alert('Solicitud rechazada (pendiente implementación)');
        cargarSolicitudesPendientes();
    } catch (error) {
        console.error('Error:', error);
        alert('Error al rechazar solicitud');
    }
}

// ================================================
// EXPORTAR USUARIOS
// ================================================

function exportarUsuariosCSV() {
    if (todosLosUsuarios.length === 0) {
        alert('No hay usuarios para exportar');
        return;
    }
    
    // Crear CSV
    let csv = 'ID,Pseudónimo,Nombre,Apellidos,Email,Teléfono,Fecha Registro,Estado\n';
    
    todosLosUsuarios.forEach(u => {
        csv += `${u.id},"${u.pseudonimo}","${u.nombre}","${u.apellidos}","${u.email}","${u.telefono}","${u.fecha_registro}","${u.estado}"\n`;
    });
    
    // Descargar
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `usuarios_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    console.log('✅ Usuarios exportados');
}

// ================================================
// UTILIDADES
// ================================================

function formatearFecha(fecha) {
    if (!fecha) return '-';
    
    try {
        const d = new Date(fecha);
        return d.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch {
        return fecha;
    }
}

function formatearEstado(estado) {
    const estados = {
        'activo': 'Activo',
        'pendiente_verificacion': 'Pendiente',
        'pendiente_eliminacion': 'P. Eliminación',
        'eliminado': 'Eliminado'
    };
    
    return estados[estado] || estado;
}

function cerrarModal() {
    const modalContainer = document.getElementById('modalContainer');
    if (modalContainer) {
        modalContainer.innerHTML = '';
    }
}

// ================================================
// EXPORTAR FUNCIONES GLOBALES
// ================================================

window.cargarUsuarios = cargarUsuarios;
window.verPerfilUsuario = verPerfilUsuario;
window.editarUsuario = editarUsuario;
window.activarUsuario = activarUsuario;
window.desactivarUsuario = desactivarUsuario;
window.enviarEmailUsuario = enviarEmailUsuario;
window.aprobarSolicitud = aprobarSolicitud;
window.rechazarSolicitud = rechazarSolicitud;
window.exportarUsuariosCSV = exportarUsuariosCSV;
window.cerrarModal = cerrarModal;

console.log('✅ admin-users.js cargado');

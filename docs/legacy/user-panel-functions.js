// ================================================
// FUNCIONES DEL PANEL MI CUENTA
// ================================================

// Toggle sección acordeón
function toggleSection(sectionId) {
    const content = document.getElementById('section-' + sectionId);
    const header = content.previousElementSibling;
    const allContents = document.querySelectorAll('.section-content');
    const allHeaders = document.querySelectorAll('.section-header');
    
    // Cerrar otras secciones
    allContents.forEach(c => {
        if (c !== content) c.classList.remove('active');
    });
    allHeaders.forEach(h => {
        if (h !== header) h.classList.remove('active');
    });
    
    // Toggle la sección actual
    const isOpening = !content.classList.contains('active');
    content.classList.toggle('active');
    header.classList.toggle('active');
    
    // Si es chat y se está abriendo, cargar mensajes
    if (sectionId === 'chat' && isOpening) {
        if (typeof cargarMensajesChat === 'function') {
            cargarMensajesChat();
        }
    }
}

// Guardar datos de perfil (teléfono y email)
async function guardarDatosPerfil() {
    const telefono = document.getElementById('perfilTelefono').value.trim();
    const email = document.getElementById('perfilEmail').value.trim();
    
    if (!email) {
        mostrarToast('El email es obligatorio', 'error');
        return;
    }
    
    try {
        // Aquí iría la llamada a la API para actualizar
        if (window.currentUser) {
            window.currentUser.telefono = telefono;
            window.currentUser.email = email;
        }
        
        mostrarToast('Datos actualizados correctamente', 'success');
    } catch (e) {
        mostrarToast('Error al guardar: ' + e.message, 'error');
    }
}

// Mostrar campos según selección en modal actualizar
function mostrarCamposActualizar() {
    const que = document.getElementById('actualizarQue').value;
    const campoPseudo = document.getElementById('campoNuevoPseudo');
    const campoNombre = document.getElementById('campoNuevoNombre');
    
    campoPseudo.style.display = (que === 'pseudo' || que === 'ambos') ? 'block' : 'none';
    campoNombre.style.display = (que === 'nombre' || que === 'ambos') ? 'block' : 'none';
}

// Abrir modal actualizar datos
function abrirModalActualizarDatos() {
    document.getElementById('nuevoPseudo').value = '';
    document.getElementById('nuevoNombre').value = '';
    const msg = document.getElementById('msgActualizar');
    if (msg) msg.style.display = 'none';
    mostrarCamposActualizar();
    abrirModalGenerico('modalActualizarDatos');
}

// Enviar solicitud de actualización
async function enviarSolicitudActualizar() {
    const que = document.getElementById('actualizarQue').value;
    const pseudo = document.getElementById('nuevoPseudo').value.trim();
    const nombre = document.getElementById('nuevoNombre').value.trim();
    
    if ((que === 'pseudo' || que === 'ambos') && !pseudo) {
        mostrarMensajeAuth('msgActualizar', 'Introduce el nuevo pseudónimo', 'error');
        return;
    }
    if ((que === 'nombre' || que === 'ambos') && !nombre) {
        mostrarMensajeAuth('msgActualizar', 'Introduce el nuevo nombre', 'error');
        return;
    }
    
    try {
        mostrarMensajeAuth('msgActualizar', 
            'El cambio se realizará en un máximo de 2 días laborales. Nos pondremos en contacto con usted vía email para confirmar.', 
            'success');
        
    } catch (e) {
        mostrarMensajeAuth('msgActualizar', 'Error: ' + e.message, 'error');
    }
}

// Actualizar estado del botón eliminar cuenta
function actualizarEstadoEliminacion(pendiente) {
    const btn = document.getElementById('btnEliminarCuenta');
    const formEliminar = document.getElementById('formEliminarCuenta');
    const formCancelar = document.getElementById('formCancelarEliminacion');
    
    if (pendiente) {
        if (btn) {
            btn.textContent = '⏳ Cancelar eliminación de cuenta';
            btn.classList.remove('btn-danger');
            btn.classList.add('btn-warning');
        }
        if (formEliminar) formEliminar.style.display = 'none';
        if (formCancelar) formCancelar.style.display = 'block';
    } else {
        if (btn) {
            btn.textContent = '🗑️ Eliminar cuenta';
            btn.classList.remove('btn-warning');
            btn.classList.add('btn-danger');
        }
        if (formEliminar) formEliminar.style.display = 'block';
        if (formCancelar) formCancelar.style.display = 'none';
    }
}

// Abrir modal eliminar cuenta
function abrirModalEliminarCuenta() {
    document.getElementById('confirmarEliminar').value = '';
    document.getElementById('confirmarMantener').value = '';
    const msgEliminar = document.getElementById('msgEliminar');
    const msgMantener = document.getElementById('msgMantener');
    if (msgEliminar) msgEliminar.style.display = 'none';
    if (msgMantener) msgMantener.style.display = 'none';
    abrirModalGenerico('modalEliminarCuenta');
}

// Confirmar eliminación de cuenta
async function confirmarEliminarCuenta() {
    const input = document.getElementById('confirmarEliminar').value;
    
    if (input !== 'Borrar cuenta') {
        mostrarMensajeAuth('msgEliminar', 'Debes escribir exactamente "Borrar cuenta"', 'error');
        return;
    }
    
    try {
        if (window.currentUser) {
            window.currentUser.pendiente_eliminar = true;
        }
        
        mostrarMensajeAuth('msgEliminar', 
            'Su cuenta se desactivará en un máximo de 2 días laborales. Nos pondremos en contacto con usted vía email para confirmar. Hasta entonces puede detener el proceso.', 
            'success');
        
        actualizarEstadoEliminacion(true);
        
        setTimeout(() => cerrarModal('modalEliminarCuenta'), 3000);
        
    } catch (e) {
        mostrarMensajeAuth('msgEliminar', 'Error: ' + e.message, 'error');
    }
}

// Cancelar eliminación de cuenta
async function cancelarEliminacionCuenta() {
    const input = document.getElementById('confirmarMantener').value;
    
    if (input !== 'Mantener cuenta') {
        mostrarMensajeAuth('msgMantener', 'Debes escribir exactamente "Mantener cuenta"', 'error');
        return;
    }
    
    try {
        if (window.currentUser) {
            window.currentUser.pendiente_eliminar = false;
        }
        
        mostrarMensajeAuth('msgMantener', 
            'El proceso de eliminación de su cuenta ha sido detenido. Si desea eliminar su cuenta, por favor, reinicie el proceso.', 
            'success');
        
        actualizarEstadoEliminacion(false);
        
        setTimeout(() => cerrarModal('modalEliminarCuenta'), 3000);
        
    } catch (e) {
        mostrarMensajeAuth('msgMantener', 'Error: ' + e.message, 'error');
    }
}

// Guardar suscripciones
async function guardarSuscripciones() {
    const suscripciones = {
        prensa: document.getElementById('subsPrensa')?.checked || false,
        boletines: document.getElementById('subsBoletines')?.checked || false,
        destacados: document.getElementById('subsDestacados')?.checked || false,
        eventos: document.getElementById('subsEventos')?.checked || false
    };
    
    try {
        if (window.currentUser) {
            window.currentUser.suscripciones = suscripciones;
        }
        mostrarToast('Suscripciones actualizadas', 'success');
    } catch (e) {
        mostrarToast('Error: ' + e.message, 'error');
    }
}

// Filtrar favoritos
function filtrarFavoritos() {
    const categoria = document.getElementById('favFilterCategoria')?.value || '';
    const vehiculo = document.getElementById('favFilterVehiculo')?.value || '';
    const orden = document.getElementById('favFilterOrden')?.value || 'recomendado';
    
    // Implementar filtro real aquí cuando se conecte al backend
    console.log('Filtrar favoritos:', { categoria, vehiculo, orden });
}

// Filtrar facturas
function filtrarFacturas() {
    const tipo = document.getElementById('facturasFiltroTipo')?.value || '';
    const ano = document.getElementById('facturasFiltroAno')?.value || '';
    
    // Implementar filtro real aquí cuando se conecte al backend
    console.log('Filtrar facturas:', { tipo, ano });
}

// Enviar mensaje de chat
async function enviarMensajeChat() {
    const input = document.getElementById('chatInput');
    const mensaje = input?.value.trim();
    
    if (!mensaje) return;
    
    // Obtener usuario actual
    const user = window.getCurrentUser?.() || JSON.parse(localStorage.getItem('tank_iberica_user') || 'null');
    const pseudo = user?.pseudonimo || user?.nombre || 'Usuario';
    const email = user?.email || '';
    
    // Obtener o crear chatUsuarioId
    let chatUsuarioId = localStorage.getItem('chatUserId');
    if (!chatUsuarioId) {
        chatUsuarioId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('chatUserId', chatUsuarioId);
    }
    
    // Verificar si quiere notificación por email
    const notifyEmail = document.getElementById('chatNotifyEmail')?.checked ? 'TRUE' : 'FALSE';
    
    try {
        const APPS_SCRIPT_URL = window.AUTH_CONFIG?.APPS_SCRIPT_URL || 'https://script.google.com/macros/s/AKfycbzvweSBncWu0sXaZspE6tQ6ZMJIIcmk9dKlpXgjdSdU0LJZUzLOsE3LdeuSkP86H337sw/exec';
        
        const newId = Date.now();
        const fecha = new Date().toLocaleString('es-ES');
        
        const formData = new URLSearchParams();
        formData.append('action', 'appendRow');
        formData.append('sheet', 'chat');
        formData.append('data', JSON.stringify([
            newId,
            chatUsuarioId,
            pseudo,
            email,
            mensaje,
            fecha,
            'FALSE',
            'user',
            '',  // oculto_admin
            '',  // oculto_usuario
            notifyEmail  // notificar_email
        ]));
        
        const resp = await fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            body: formData
        });
        
        const result = await resp.json();
        if (!result.success) throw new Error(result.message || 'Error enviando mensaje');
        
        input.value = '';
        
        // Actualizar vista de mensajes con el formato correcto
        const container = document.getElementById('chatMessages');
        if (container) {
            // Quitar mensaje vacío si existe
            const empty = container.querySelector('.chat-empty');
            if (empty) empty.remove();
            
            // Extraer solo hora HH:MM con formato 24h
            const horaMatch = fecha.match(/(\d{1,2}):(\d{2})/);
            const hora = horaMatch ? horaMatch[1].padStart(2, '0') + ':' + horaMatch[2] : '';
            
            const msgDiv = document.createElement('div');
            msgDiv.className = 'chat-msg user';
            msgDiv.innerHTML = `<div class="bubble">${mensaje}<span class="msg-time">${hora}</span></div>`;
            
            container.appendChild(msgDiv);
            container.scrollTop = container.scrollHeight;
        }
        
        mostrarToast('Mensaje enviado', 'success');
        
    } catch (e) {
        console.error('Error enviando chat:', e);
        mostrarToast('Error al enviar: ' + e.message, 'error');
    }
}

// Cargar mensajes del chat desde Google Sheets
async function cargarMensajesChat() {
    const container = document.getElementById('chatMessages');
    if (!container) return;
    
    // Obtener chatUsuarioId
    let chatUsuarioId = localStorage.getItem('chatUserId');
    if (!chatUsuarioId) {
        chatUsuarioId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('chatUserId', chatUsuarioId);
    }
    
    try {
        const SPREADSHEET_ID = '1GdmirqWFKVt39QvEJxdMH3zW0-itl64YuqYEsOAkF30';
        const API_KEY = 'AIzaSyD2MnE9L7YeWHEkFpx7SiIMCzM-vpb_hzE';
        
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/chat?key=${API_KEY}`;
        const resp = await fetch(url);
        
        if (!resp.ok) {
            console.log('Chat: No se pudo cargar la hoja');
            return;
        }
        
        const data = await resp.json();
        if (!data.values || data.values.length < 2) {
            container.innerHTML = '<p class="chat-empty">No hay mensajes todavía. ¡Escríbenos!</p>';
            return;
        }
        
        const headers = data.values[0];
        const rows = data.values.slice(1);
        
        // Filtrar mensajes de este usuario
        const misMensajes = rows
            .map(row => {
                const obj = {};
                headers.forEach((h, i) => obj[h] = row[i] || '');
                return obj;
            })
            .filter(msg => {
                // Solo mensajes de este usuario
                if (msg.usuario_id !== chatUsuarioId) return false;
                // Filtrar ocultos para usuario
                if (msg.oculto_usuario === true || msg.oculto_usuario === 'TRUE') return false;
                return true;
            });
        
        if (misMensajes.length === 0) {
            container.innerHTML = '<p class="chat-empty">No hay mensajes todavía. ¡Escríbenos!</p>';
            return;
        }
        
        // Renderizar mensajes estilo WhatsApp
        let lastDate = '';
        let html = '';
        
        misMensajes.forEach(msg => {
            const fechaCompleta = msg.fecha || '';
            let fecha = '';
            let hora = '';
            
            // Buscar patrón de hora HH:MM
            const horaMatch = fechaCompleta.match(/(\d{1,2}):(\d{2})/);
            if (horaMatch) {
                hora = horaMatch[1].padStart(2, '0') + ':' + horaMatch[2];
            }
            
            // Buscar patrón de fecha DD/MM/YYYY
            const fechaMatch = fechaCompleta.match(/(\d{1,2}\/\d{1,2}\/\d{4})/);
            if (fechaMatch) {
                fecha = fechaMatch[1];
            }
            
            if (fecha && fecha !== lastDate) {
                html += '<div class="chat-date-separator"><span>' + fecha + '</span></div>';
                lastDate = fecha;
            }
            
            html += `
                <div class="chat-msg ${msg.tipo === 'admin' ? 'admin' : 'user'}">
                    <div class="bubble">${msg.mensaje}<span class="msg-time">${hora}</span></div>
                </div>
            `;
        });
        
        container.innerHTML = html;
        container.scrollTop = container.scrollHeight;
        
    } catch (e) {
        console.error('Error cargando chat:', e);
    }
}

// Abrir modal nueva solicitud
function abrirModalNuevaSolicitud() {
    const tipoEl = document.getElementById('solicitudTipo');
    const presupuestoEl = document.getElementById('solicitudPresupuesto');
    const anoEl = document.getElementById('solicitudAno');
    const criteriosEl = document.getElementById('solicitudCriterios');
    const msgEl = document.getElementById('msgSolicitud');
    
    if (tipoEl) tipoEl.value = '';
    if (presupuestoEl) presupuestoEl.value = '';
    if (anoEl) anoEl.value = '';
    if (criteriosEl) criteriosEl.value = '';
    if (msgEl) msgEl.style.display = 'none';
    
    abrirModalGenerico('modalNuevaSolicitud');
}

// Enviar solicitud de vehículo
async function enviarSolicitudVehiculo() {
    const tipo = document.getElementById('solicitudTipo')?.value;
    const presupuesto = document.getElementById('solicitudPresupuesto')?.value;
    const ano = document.getElementById('solicitudAno')?.value;
    const criterios = document.getElementById('solicitudCriterios')?.value;
    
    if (!tipo) {
        mostrarMensajeAuth('msgSolicitud', 'Selecciona un tipo de vehículo', 'error');
        return;
    }
    
    try {
        if (!window.currentUser.solicitudes) window.currentUser.solicitudes = [];
        window.currentUser.solicitudes.push({
            tipo,
            presupuesto: presupuesto ? parseInt(presupuesto) : null,
            ano: ano ? parseInt(ano) : null,
            criterios,
            status: 'activa',
            fecha: new Date().toISOString()
        });
        
        mostrarMensajeAuth('msgSolicitud', 'Solicitud creada. Te avisaremos cuando encontremos vehículos que coincidan.', 'success');
        
        setTimeout(() => cerrarModal('modalNuevaSolicitud'), 2000);
        
    } catch (e) {
        mostrarMensajeAuth('msgSolicitud', 'Error: ' + e.message, 'error');
    }
}

// Cerrar sesión (usa función de auth-system.js)
function cerrarSesionPanel() {
    if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
        // Cerrar panel primero
        if (typeof cerrarPanelUsuario === 'function') {
            cerrarPanelUsuario();
        }
        // Luego cerrar sesión
        if (typeof cerrarSesion === 'function') {
            cerrarSesion();
        } else {
            window.currentUser = null;
            localStorage.removeItem('tank_iberica_session');
            localStorage.removeItem('tank_iberica_user');
            location.reload();
        }
    }
}

// Helpers
function abrirModalGenerico(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.add('active');
}

function cerrarModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.remove('active');
}

function mostrarMensajeAuth(id, texto, tipo) {
    const el = document.getElementById(id);
    if (el) {
        el.textContent = texto;
        el.className = 'auth-message ' + tipo;
        el.style.display = 'block';
    }
}

function mostrarToast(mensaje, tipo) {
    const toast = document.createElement('div');
    toast.className = 'toast-notification ' + tipo;
    toast.textContent = mensaje;
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 12px 20px;
        background: ${tipo === 'success' ? '#10b981' : tipo === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
        border-radius: 8px;
        z-index: 99999;
        animation: slideIn 0.3s ease;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    // Tecla Escape para cerrar modales
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal.active').forEach(m => m.classList.remove('active'));
        }
    });
});


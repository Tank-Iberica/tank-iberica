/**
 * ================================================
 * TANK IBERICA - SISTEMA DE AUTENTICACIÓN
 * Email + Contraseña (con soporte futuro Google/Microsoft)
 * ================================================
 */

const AUTH_CONFIG = {
    // ⚠️ IMPORTANTE: Actualiza esta URL después de hacer deploy del Apps Script
    APPS_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbzvweSBncWu0sXaZspE6tQ6ZMJIIcmk9dKlpXgjdSdU0LJZUzLOsE3LdeuSkP86H337sw/exec',
    SESSION_DURATION: 7 * 24 * 60 * 60 * 1000, // 7 días
    STORAGE_KEY: 'tank_iberica_session',
    USER_KEY: 'tank_iberica_user'
};

// Estado global del auth (usando prefijo auth para evitar conflictos)
let authCurrentUser = null;
let authSessionToken = null;
let authLang = document.documentElement.lang || 'es';

// ================================================
// TEXTOS BILINGÜES
// ================================================
const AUTH_TEXTS = {
    es: {
        loginTitle: 'Iniciar Sesión',
        registerTitle: 'Crear Cuenta',
        forgotTitle: 'Recuperar Contraseña',
        resetTitle: 'Nueva Contraseña',
        email: 'Email',
        password: 'Contraseña',
        confirmPassword: 'Confirmar contraseña',
        username: 'Nombre de usuario',
        firstName: 'Nombre',
        lastName: 'Apellidos',
        phone: 'Teléfono',
        phoneHint: 'Opcional pero muy recomendado',
        login: 'Iniciar Sesión',
        register: 'Crear Cuenta',
        sendReset: 'Enviar enlace',
        resetPassword: 'Cambiar contraseña',
        forgotPassword: '¿Olvidaste tu contraseña?',
        backToLogin: 'Volver al inicio de sesión',
        orContinueWith: 'O continúa con',
        continueGoogle: 'Continuar con Google',
        continueMicrosoft: 'Continuar con Microsoft',
        noAccount: '¿No tienes cuenta?',
        hasAccount: '¿Ya tienes cuenta?',
        createAccount: 'Crear una',
        loginHere: 'Inicia sesión',
        required: 'Este campo es obligatorio',
        invalidEmail: 'Email no válido',
        passwordMin: 'Mínimo 6 caracteres',
        passwordMatch: 'Las contraseñas no coinciden',
        usernameMin: 'Mínimo 3 caracteres',
        usernameChars: 'Solo letras, números y guiones bajos',
        loading: 'Cargando...',
        sending: 'Enviando...',
        creating: 'Creando cuenta...',
        loggingIn: 'Iniciando sesión...',
        accountCreated: '¡Cuenta creada! Bienvenido/a',
        loginSuccess: '¡Bienvenido/a de nuevo!',
        resetSent: 'Si el email existe, recibirás instrucciones',
        passwordChanged: 'Contraseña actualizada correctamente',
        emailExists: 'Este email ya está registrado',
        usernameExists: 'Este nombre de usuario ya existe',
        emailNotFound: 'Email no registrado',
        wrongPassword: 'Contraseña incorrecta',
        accountInactive: 'Cuenta no activa',
        connectionError: 'Error de conexión. Inténtalo de nuevo.',
        tokenExpired: 'El enlace ha expirado. Solicita uno nuevo.',
        invalidToken: 'Enlace no válido',
        myAccount: 'Mi cuenta',
        logout: 'Cerrar sesión'
    },
    en: {
        loginTitle: 'Sign In',
        registerTitle: 'Create Account',
        forgotTitle: 'Forgot Password',
        resetTitle: 'New Password',
        email: 'Email',
        password: 'Password',
        confirmPassword: 'Confirm password',
        username: 'Username',
        firstName: 'First name',
        lastName: 'Last name',
        phone: 'Phone',
        phoneHint: 'Optional but highly recommended',
        login: 'Sign In',
        register: 'Create Account',
        sendReset: 'Send link',
        resetPassword: 'Change password',
        forgotPassword: 'Forgot your password?',
        backToLogin: 'Back to sign in',
        orContinueWith: 'Or continue with',
        continueGoogle: 'Continue with Google',
        continueMicrosoft: 'Continue with Microsoft',
        noAccount: "Don't have an account?",
        hasAccount: 'Already have an account?',
        createAccount: 'Create one',
        loginHere: 'Sign in',
        required: 'This field is required',
        invalidEmail: 'Invalid email',
        passwordMin: 'Minimum 6 characters',
        passwordMatch: 'Passwords do not match',
        usernameMin: 'Minimum 3 characters',
        usernameChars: 'Only letters, numbers and underscores',
        loading: 'Loading...',
        sending: 'Sending...',
        creating: 'Creating account...',
        loggingIn: 'Signing in...',
        accountCreated: 'Account created! Welcome',
        loginSuccess: 'Welcome back!',
        resetSent: 'If the email exists, you will receive instructions',
        passwordChanged: 'Password updated successfully',
        emailExists: 'This email is already registered',
        usernameExists: 'This username already exists',
        emailNotFound: 'Email not registered',
        wrongPassword: 'Incorrect password',
        accountInactive: 'Account not active',
        connectionError: 'Connection error. Please try again.',
        tokenExpired: 'Link has expired. Request a new one.',
        invalidToken: 'Invalid link',
        myAccount: 'My account',
        logout: 'Sign out'
    }
};

function t(key) {
    return AUTH_TEXTS[authLang]?.[key] || AUTH_TEXTS['es'][key] || key;
}

// ================================================
// INICIALIZACIÓN
// ================================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('🔐 Inicializando sistema de autenticación...');
    authLang = document.documentElement.lang || 'es';
    verificarSesionActiva();
    setupAuthEventListeners();
    checkResetToken();
    console.log('✅ Sistema de autenticación inicializado');
});

// ================================================
// GESTIÓN DE SESIÓN
// ================================================

function verificarSesionActiva() {
    const session = localStorage.getItem(AUTH_CONFIG.STORAGE_KEY);
    const userData = localStorage.getItem(AUTH_CONFIG.USER_KEY);
    
    if (session && userData) {
        try {
            const sessionData = JSON.parse(session);
            const user = JSON.parse(userData);
            
            if (Date.now() < sessionData.expiracion) {
                console.log('✅ Sesión activa:', user.pseudonimo);
                authCurrentUser = user;
                authSessionToken = sessionData.token;
                actualizarUIUsuarioLogueado();
                return true;
            } else {
                cerrarSesion(false);
            }
        } catch (error) {
            cerrarSesion(false);
        }
    }
    return false;
}

function guardarSesion(usuario, token) {
    const sessionData = {
        token: token,
        expiracion: Date.now() + AUTH_CONFIG.SESSION_DURATION
    };
    localStorage.setItem(AUTH_CONFIG.STORAGE_KEY, JSON.stringify(sessionData));
    localStorage.setItem(AUTH_CONFIG.USER_KEY, JSON.stringify(usuario));
    authCurrentUser = usuario;
    authSessionToken = token;
}

function cerrarSesion(mostrarMensaje = true) {
    localStorage.removeItem(AUTH_CONFIG.STORAGE_KEY);
    localStorage.removeItem(AUTH_CONFIG.USER_KEY);
    authCurrentUser = null;
    authSessionToken = null;
    actualizarUIUsuarioDeslogueado();
    cerrarPanelUsuario();
    if (mostrarMensaje) console.log('👋 Sesión cerrada');
}

function actualizarUIUsuarioLogueado() {
    if (!authCurrentUser) return;
    const accountBtn = document.getElementById('accountBtn');
    if (accountBtn) {
        const span = accountBtn.querySelector('span');
        if (span) {
            span.textContent = authCurrentUser.pseudonimo;
            span.removeAttribute('data-es');
            span.removeAttribute('data-en');
        }
    }
}

function actualizarUIUsuarioDeslogueado() {
    const accountBtn = document.getElementById('accountBtn');
    if (accountBtn) {
        const span = accountBtn.querySelector('span');
        if (span) {
            span.setAttribute('data-es', 'Mi cuenta');
            span.setAttribute('data-en', 'My account');
            span.textContent = t('myAccount');
        }
    }
}

// ================================================
// EVENT LISTENERS
// ================================================

function setupAuthEventListeners() {
    const accountBtn = document.getElementById('accountBtn');
    if (accountBtn) {
        accountBtn.addEventListener('click', () => {
            if (authCurrentUser) {
                abrirPanelUsuario();
            } else {
                abrirModalAuth('login');
            }
        });
    }
    
    const authModal = document.getElementById('authModal');
    if (authModal) {
        authModal.addEventListener('click', (e) => {
            if (e.target.id === 'authModal') cerrarModalAuth();
        });
    }
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') cerrarModalAuth();
    });
}

// ================================================
// MODAL DE AUTENTICACIÓN
// ================================================

function abrirModalAuth(view = 'login') {
    const modal = document.getElementById('authModal');
    if (!modal) {
        console.error('Modal authModal no encontrado');
        return;
    }
    
    authLang = document.documentElement.lang || 'es';
    renderizarModalAuth(view);
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    setTimeout(() => {
        const firstInput = modal.querySelector('input:not([type="hidden"])');
        if (firstInput) firstInput.focus();
    }, 100);
}

function cerrarModalAuth() {
    const modal = document.getElementById('authModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

function renderizarModalAuth(view) {
    const modal = document.getElementById('authModal');
    if (!modal) return;
    
    let content = '';
    switch(view) {
        case 'login': content = renderLoginView(); break;
        case 'register': content = renderRegisterView(); break;
        case 'forgot': content = renderForgotView(); break;
        case 'reset': content = renderResetView(); break;
        default: content = renderLoginView();
    }
    
    modal.innerHTML = `
        <div class="auth-modal-content">
            <button class="auth-modal-close" onclick="cerrarModalAuth()">&times;</button>
            ${content}
        </div>
    `;
}

function renderLoginView() {
    return `
        <div class="auth-panel active" id="loginPanel">
            <h2>${t('loginTitle')}</h2>
            <div id="authMessage" class="auth-message"></div>
            <form id="loginForm" onsubmit="handleLogin(event)">
                <div class="auth-form-group">
                    <label for="loginEmail">${t('email')}</label>
                    <input type="email" id="loginEmail" required autocomplete="email">
                </div>
                <div class="auth-form-group">
                    <label for="loginPassword">${t('password')}</label>
                    <input type="password" id="loginPassword" required autocomplete="current-password" minlength="6">
                </div>
                <button type="submit" class="auth-btn-primary" id="loginBtn">${t('login')}</button>
                <p style="text-align: center; margin: 12px 0;">
                    <a href="#" onclick="abrirModalAuth('forgot'); return false;" style="color: var(--accent); text-decoration: none;">
                        ${t('forgotPassword')}
                    </a>
                </p>
            </form>
            <div class="auth-divider">${t('orContinueWith')}</div>
            <div class="social-login-buttons">
                <button type="button" class="social-btn google" onclick="loginConGoogle()" disabled title="Próximamente">
                    <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                    ${t('continueGoogle')}
                </button>
                <button type="button" class="social-btn microsoft" onclick="loginConMicrosoft()" disabled title="Próximamente">
                    <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#F25022" d="M1 1h10v10H1z"/><path fill="#00A4EF" d="M1 13h10v10H1z"/><path fill="#7FBA00" d="M13 1h10v10H13z"/><path fill="#FFB900" d="M13 13h10v10H13z"/></svg>
                    ${t('continueMicrosoft')}
                </button>
            </div>
            <p style="text-align: center; margin-top: 20px; color: var(--text-secondary);">
                ${t('noAccount')} 
                <a href="#" onclick="abrirModalAuth('register'); return false;" style="color: var(--accent); text-decoration: none; font-weight: 600;">
                    ${t('createAccount')}
                </a>
            </p>
        </div>
    `;
}

function renderRegisterView() {
    return `
        <div class="auth-panel active" id="registerPanel">
            <h2>${t('registerTitle')}</h2>
            <div id="authMessage" class="auth-message"></div>
            <form id="registerForm" onsubmit="handleRegister(event)">
                <div class="auth-form-group">
                    <label for="regEmail">${t('email')} *</label>
                    <input type="email" id="regEmail" required autocomplete="email">
                </div>
                <div class="auth-form-group">
                    <label for="regPassword">${t('password')} *</label>
                    <input type="password" id="regPassword" required autocomplete="new-password" minlength="6">
                    <small style="color: var(--text-auxiliary);">${t('passwordMin')}</small>
                </div>
                <div class="auth-form-group">
                    <label for="regPasswordConfirm">${t('confirmPassword')} *</label>
                    <input type="password" id="regPasswordConfirm" required autocomplete="new-password" minlength="6">
                </div>
                <div class="auth-form-group">
                    <label for="regUsername">${t('username')} *</label>
                    <input type="text" id="regUsername" required pattern="[a-zA-Z0-9_]+" minlength="3" maxlength="20" autocomplete="username">
                    <small style="color: var(--text-auxiliary);">${t('usernameChars')}</small>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                    <div class="auth-form-group">
                        <label for="regNombre">${t('firstName')} *</label>
                        <input type="text" id="regNombre" required autocomplete="given-name">
                    </div>
                    <div class="auth-form-group">
                        <label for="regApellidos">${t('lastName')} *</label>
                        <input type="text" id="regApellidos" required autocomplete="family-name">
                    </div>
                </div>
                <div class="auth-form-group">
                    <label for="regTelefono">${t('phone')}</label>
                    <input type="tel" id="regTelefono" autocomplete="tel">
                    <small style="color: var(--orange); font-weight: 500;">⚠️ ${t('phoneHint')}</small>
                </div>
                <button type="submit" class="auth-btn-primary" id="registerBtn">${t('register')}</button>
            </form>
            <p style="text-align: center; margin-top: 20px; color: var(--text-secondary);">
                ${t('hasAccount')} 
                <a href="#" onclick="abrirModalAuth('login'); return false;" style="color: var(--accent); text-decoration: none; font-weight: 600;">
                    ${t('loginHere')}
                </a>
            </p>
        </div>
    `;
}

function renderForgotView() {
    return `
        <div class="auth-panel active" id="forgotPanel">
            <h2>${t('forgotTitle')}</h2>
            <p style="color: var(--text-secondary); margin-bottom: 24px;">
                ${authLang === 'es' 
                    ? 'Introduce tu email y te enviaremos un enlace para restablecer tu contraseña.'
                    : 'Enter your email and we will send you a link to reset your password.'}
            </p>
            <div id="authMessage" class="auth-message"></div>
            <form id="forgotForm" onsubmit="handleForgotPassword(event)">
                <div class="auth-form-group">
                    <label for="forgotEmail">${t('email')}</label>
                    <input type="email" id="forgotEmail" required autocomplete="email">
                </div>
                <button type="submit" class="auth-btn-primary" id="forgotBtn">${t('sendReset')}</button>
            </form>
            <p style="text-align: center; margin-top: 20px;">
                <a href="#" onclick="abrirModalAuth('login'); return false;" style="color: var(--accent); text-decoration: none;">
                    ← ${t('backToLogin')}
                </a>
            </p>
        </div>
    `;
}

function renderResetView() {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('reset') || '';
    
    return `
        <div class="auth-panel active" id="resetPanel">
            <h2>${t('resetTitle')}</h2>
            <p style="color: var(--text-secondary); margin-bottom: 24px;">
                ${authLang === 'es' ? 'Introduce tu nueva contraseña.' : 'Enter your new password.'}
            </p>
            <div id="authMessage" class="auth-message"></div>
            <form id="resetForm" onsubmit="handleResetPassword(event)">
                <input type="hidden" id="resetToken" value="${escapeHTML(token)}">
                <div class="auth-form-group">
                    <label for="resetPassword">${t('password')}</label>
                    <input type="password" id="resetPassword" required minlength="6" autocomplete="new-password">
                    <small style="color: var(--text-auxiliary);">${t('passwordMin')}</small>
                </div>
                <div class="auth-form-group">
                    <label for="resetPasswordConfirm">${t('confirmPassword')}</label>
                    <input type="password" id="resetPasswordConfirm" required minlength="6" autocomplete="new-password">
                </div>
                <button type="submit" class="auth-btn-primary" id="resetBtn">${t('resetPassword')}</button>
            </form>
            <p style="text-align: center; margin-top: 20px;">
                <a href="#" onclick="abrirModalAuth('login'); return false;" style="color: var(--accent); text-decoration: none;">
                    ← ${t('backToLogin')}
                </a>
            </p>
        </div>
    `;
}

// ================================================
// HANDLERS - USANDO URLSearchParams PARA EVITAR CORS
// ================================================

async function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const btn = document.getElementById('loginBtn');
    const originalText = btn.textContent;
    
    if (!email || !password) {
        mostrarMensaje(t('required'), 'error');
        return;
    }
    
    btn.disabled = true;
    btn.textContent = t('loggingIn');
    
    try {
        const formData = new URLSearchParams();
        formData.append('action', 'login');
        formData.append('email', email);
        formData.append('password', password);
        
        const response = await fetch(AUTH_CONFIG.APPS_SCRIPT_URL, {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            guardarSesion(data.usuario, data.token);
            actualizarUIUsuarioLogueado();
            mostrarMensaje(t('loginSuccess'), 'success');
            setTimeout(() => {
                cerrarModalAuth();
                abrirPanelUsuario();
            }, 1000);
        } else {
            let mensaje = data.message;
            if (data.code === 'EMAIL_NOT_FOUND') mensaje = t('emailNotFound');
            if (data.code === 'WRONG_PASSWORD') mensaje = t('wrongPassword');
            if (data.code === 'ACCOUNT_INACTIVE') mensaje = t('accountInactive');
            mostrarMensaje(mensaje, 'error');
        }
    } catch (error) {
        console.error('Error en login:', error);
        mostrarMensaje(t('connectionError'), 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = originalText;
    }
}

async function handleRegister(event) {
    event.preventDefault();
    
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;
    const passwordConfirm = document.getElementById('regPasswordConfirm').value;
    const username = document.getElementById('regUsername').value.trim();
    const nombre = document.getElementById('regNombre').value.trim();
    const apellidos = document.getElementById('regApellidos').value.trim();
    const telefono = document.getElementById('regTelefono').value.trim();
    const btn = document.getElementById('registerBtn');
    const originalText = btn.textContent;
    
    if (!email || !password || !username || !nombre || !apellidos) {
        mostrarMensaje(t('required'), 'error');
        return;
    }
    
    if (password.length < 6) {
        mostrarMensaje(t('passwordMin'), 'error');
        return;
    }
    
    if (password !== passwordConfirm) {
        mostrarMensaje(t('passwordMatch'), 'error');
        return;
    }
    
    if (username.length < 3) {
        mostrarMensaje(t('usernameMin'), 'error');
        return;
    }
    
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        mostrarMensaje(t('usernameChars'), 'error');
        return;
    }
    
    btn.disabled = true;
    btn.textContent = t('creating');
    
    try {
        const formData = new URLSearchParams();
        formData.append('action', 'registrar');
        formData.append('email', email);
        formData.append('password', password);
        formData.append('pseudonimo', username);
        formData.append('nombre', nombre);
        formData.append('apellidos', apellidos);
        formData.append('telefono', telefono);
        
        const response = await fetch(AUTH_CONFIG.APPS_SCRIPT_URL, {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            guardarSesion(data.usuario, data.token);
            actualizarUIUsuarioLogueado();
            mostrarMensaje(t('accountCreated'), 'success');
            setTimeout(() => {
                cerrarModalAuth();
                abrirPanelUsuario();
            }, 1500);
        } else {
            let mensaje = data.message;
            if (data.code === 'EMAIL_EXISTS') mensaje = t('emailExists');
            if (data.code === 'PSEUDO_EXISTS') mensaje = t('usernameExists');
            mostrarMensaje(mensaje, 'error');
        }
    } catch (error) {
        console.error('Error en registro:', error);
        mostrarMensaje(t('connectionError'), 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = originalText;
    }
}

async function handleForgotPassword(event) {
    event.preventDefault();
    
    const email = document.getElementById('forgotEmail').value.trim();
    const btn = document.getElementById('forgotBtn');
    const originalText = btn.textContent;
    
    if (!email) {
        mostrarMensaje(t('required'), 'error');
        return;
    }
    
    btn.disabled = true;
    btn.textContent = t('sending');
    
    try {
        const formData = new URLSearchParams();
        formData.append('action', 'recuperarPassword');
        formData.append('email', email);
        
        const response = await fetch(AUTH_CONFIG.APPS_SCRIPT_URL, {
            method: 'POST',
            body: formData
        });
        
        await response.json();
        mostrarMensaje(t('resetSent'), 'success');
    } catch (error) {
        console.error('Error en recuperación:', error);
        mostrarMensaje(t('connectionError'), 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = originalText;
    }
}

async function handleResetPassword(event) {
    event.preventDefault();
    
    const token = document.getElementById('resetToken').value;
    const password = document.getElementById('resetPassword').value;
    const passwordConfirm = document.getElementById('resetPasswordConfirm').value;
    const btn = document.getElementById('resetBtn');
    const originalText = btn.textContent;
    
    if (!token) {
        mostrarMensaje(t('invalidToken'), 'error');
        return;
    }
    
    if (password.length < 6) {
        mostrarMensaje(t('passwordMin'), 'error');
        return;
    }
    
    if (password !== passwordConfirm) {
        mostrarMensaje(t('passwordMatch'), 'error');
        return;
    }
    
    btn.disabled = true;
    btn.textContent = t('sending');
    
    try {
        const formData = new URLSearchParams();
        formData.append('action', 'resetearPassword');
        formData.append('token', token);
        formData.append('newPassword', password);
        
        const response = await fetch(AUTH_CONFIG.APPS_SCRIPT_URL, {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            mostrarMensaje(t('passwordChanged'), 'success');
            window.history.replaceState({}, document.title, window.location.pathname);
            setTimeout(() => abrirModalAuth('login'), 2000);
        } else {
            let mensaje = data.message;
            if (data.code === 'TOKEN_EXPIRED') mensaje = t('tokenExpired');
            if (data.code === 'INVALID_TOKEN') mensaje = t('invalidToken');
            mostrarMensaje(mensaje, 'error');
        }
    } catch (error) {
        console.error('Error en reset:', error);
        mostrarMensaje(t('connectionError'), 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = originalText;
    }
}

// ================================================
// UTILIDADES
// ================================================

function mostrarMensaje(texto, tipo) {
    const msgEl = document.getElementById('authMessage');
    if (msgEl) {
        msgEl.textContent = texto;
        msgEl.className = 'auth-message ' + tipo;
        msgEl.style.display = 'block';
        if (tipo === 'success') {
            setTimeout(() => { msgEl.style.display = 'none'; }, 5000);
        }
    }
}

function checkResetToken() {
    const urlParams = new URLSearchParams(window.location.search);
    const resetToken = urlParams.get('reset');
    if (resetToken) {
        console.log('🔑 Token de reset detectado');
        setTimeout(() => abrirModalAuth('reset'), 500);
    }
}

// ================================================
// SOCIAL LOGIN (FUTURO)
// ================================================

function loginConGoogle() {
    mostrarMensaje('Google login estará disponible próximamente', 'info');
}

function loginConMicrosoft() {
    mostrarMensaje('Microsoft login estará disponible próximamente', 'info');
}

// ================================================
// PANEL DE USUARIO
// ================================================

function abrirPanelUsuario() {
    if (!authCurrentUser) {
        abrirModalAuth('login');
        return;
    }
    
    const panel = document.getElementById('userPanel');
    if (panel) {
        const userPseudo = document.getElementById('userPseudo');
        const userEmail = document.getElementById('userEmail');
        const userName = document.getElementById('userName');
        const userPhone = document.getElementById('userPhone');
        
        if (userPseudo) userPseudo.textContent = authCurrentUser.pseudonimo;
        if (userEmail) userEmail.textContent = authCurrentUser.email;
        if (userName) userName.textContent = `${authCurrentUser.nombre} ${authCurrentUser.apellidos}`;
        if (userPhone) userPhone.textContent = authCurrentUser.telefono || '-';
        
        panel.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function cerrarPanelUsuario() {
    const panel = document.getElementById('userPanel');
    if (panel) {
        panel.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// ================================================
// EXPORTAR FUNCIONES GLOBALES
// ================================================

window.abrirModalAuth = abrirModalAuth;
window.cerrarModalAuth = cerrarModalAuth;
window.handleLogin = handleLogin;
window.handleRegister = handleRegister;
window.handleForgotPassword = handleForgotPassword;
window.handleResetPassword = handleResetPassword;
window.loginConGoogle = loginConGoogle;
window.loginConMicrosoft = loginConMicrosoft;
window.abrirPanelUsuario = abrirPanelUsuario;
window.cerrarPanelUsuario = cerrarPanelUsuario;
window.cerrarSesion = cerrarSesion;
window.getCurrentUser = () => authCurrentUser;
window.isLoggedIn = () => authCurrentUser !== null;
window.AUTH_CONFIG = AUTH_CONFIG;
window.authCurrentUser = authCurrentUser;

console.log('✅ auth-system.js cargado');

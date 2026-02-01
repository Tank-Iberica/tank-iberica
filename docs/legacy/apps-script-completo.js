/**
 * ================================================
 * TANK IBERICA - GOOGLE APPS SCRIPT
 * ================================================
 * 
 * API REST para sistema de usuarios
 * 
 * INSTALACIÓN:
 * 1. Abre tu Google Sheet
 * 2. Extensions → Apps Script
 * 3. Copia y pega este código
 * 4. Guarda (Ctrl+S)
 * 5. Deploy → New deployment → Web app
 * 6. Execute as: Me
 * 7. Who has access: Anyone
 * 8. Deploy
 * 9. Copia la URL y úsala en auth-system.js y user-panel.js
 */

// ================================================
// CONFIGURACIÓN
// ================================================

const SHEET_NAMES = {
  USUARIOS: 'usuarios',
  FAVORITOS: 'favoritos_usuarios',
  SOLICITUDES_DATOS: 'solicitudes_datos',
  SOLICITUDES_VEHICULOS: 'solicitudes_vehiculos',
  SUBSCRIPCIONES: 'subscripciones'
};

// ================================================
// ENDPOINT PRINCIPAL
// ================================================

function doGet(e) {
  const action = e.parameter.action;
  
  try {
    switch(action) {
      case 'obtenerFavoritos':
        return handleObtenerFavoritos(e.parameter.userId);
      case 'obtenerAnuncios':
        return handleObtenerAnuncios(e.parameter.userId);
      case 'obtenerSuscripciones':
        return handleObtenerSuscripciones(e.parameter.userId);
      case 'obtenerSolicitudes':
        return handleObtenerSolicitudes(e.parameter.userId);
      // AÑADIDO: Soporte GET para auth (el frontend usa GET ahora)
      case 'enviarOTP':
        return handleEnviarOTP({ email: e.parameter.email });
      case 'verificarOTP':
      case 'validarOTP':
        return handleValidarOTP({ email: e.parameter.email, otp: e.parameter.otp });
      case 'registrar':
      case 'registrarUsuario':
        return handleRegistrarUsuario({ 
          email: e.parameter.email, 
          nombre: e.parameter.pseudonimo || e.parameter.nombre,
          pseudonimo: e.parameter.pseudonimo,
          apellidos: e.parameter.apellidos || '',
          telefono: e.parameter.telefono || ''
        });
      case 'activarCuenta':
        return handleActivarCuenta({ email: e.parameter.email, otp: e.parameter.otp });
      default:
        return jsonResponse({ success: true, message: 'API Tank Iberica funcionando' });
    }
  } catch (error) {
    Logger.log('Error en doGet: ' + error);
    return jsonResponse({ success: false, message: error.toString() });
  }
}

function doPost(e) {
  try {
    let data = {};
    
    // ARREGLO: Detectar el tipo de contenido y parsear correctamente
    if (e.postData) {
      const contentType = e.postData.type || '';
      const contents = e.postData.contents || '';
      
      Logger.log('Content-Type: ' + contentType);
      Logger.log('Contents: ' + contents);
      
      if (contentType.includes('application/json')) {
        // Si es JSON, parsear como JSON
        data = JSON.parse(contents);
      } else if (contentType.includes('application/x-www-form-urlencoded') || contents.includes('=')) {
        // Si es form-urlencoded, parsear como formulario
        contents.split('&').forEach(pair => {
          const [key, value] = pair.split('=');
          if (key) {
            data[decodeURIComponent(key)] = decodeURIComponent(value || '');
          }
        });
      } else {
        // Intentar JSON primero, si falla, intentar form
        try {
          data = JSON.parse(contents);
        } catch (jsonError) {
          contents.split('&').forEach(pair => {
            const [key, value] = pair.split('=');
            if (key) {
              data[decodeURIComponent(key)] = decodeURIComponent(value || '');
            }
          });
        }
      }
    }
    
    // También incluir parámetros de la URL
    if (e.parameter) {
      Object.keys(e.parameter).forEach(key => {
        if (!data[key]) data[key] = e.parameter[key];
      });
    }
    
    const action = data.action;
    
    Logger.log('Acción recibida: ' + action);
    Logger.log('Datos parseados: ' + JSON.stringify(data));
    
    switch(action) {
      case 'registrarUsuario':
      case 'registrar':
        return handleRegistrarUsuario(data);
      case 'enviarOTP':
        return handleEnviarOTP(data);
      case 'validarOTP':
      case 'verificarOTP':
        return handleValidarOTP(data);
      case 'activarCuenta':
        return handleActivarCuenta(data);
      case 'actualizarDatosDirectos':
        return handleActualizarDatosDirectos(data);
      case 'guardarSuscripciones':
        return handleGuardarSuscripciones(data);
      default:
        return jsonResponse({ success: false, message: 'Acción no válida: ' + action });
    }
  } catch (error) {
    Logger.log('Error en doPost: ' + error);
    Logger.log('Stack: ' + error.stack);
    return jsonResponse({ success: false, message: error.toString() });
  }
}

// ================================================
// HANDLERS DE AUTENTICACIÓN
// ================================================

function handleRegistrarUsuario(data) {
  const sheet = getSheet(SHEET_NAMES.USUARIOS);
  
  const email = data.email;
  const nombre = data.nombre || data.pseudonimo || 'Usuario';
  const apellidos = data.apellidos || '';
  const telefono = data.telefono || '';
  
  if (!email) {
    return jsonResponse({ success: false, message: 'Email requerido' });
  }
  
  // Verificar si el email ya existe
  const usuarios = sheet.getDataRange().getValues();
  for (let i = 1; i < usuarios.length; i++) {
    if (usuarios[i][4] === email) {
      return jsonResponse({ success: false, message: 'Este email ya está registrado' });
    }
  }
  
  // Generar pseudónimo único
  const pseudonimo = data.pseudonimo || generarPseudonimo(nombre);
  
  // Generar OTP
  const otp = generarOTP();
  const expiracion = new Date(Date.now() + 30 * 60000); // 30 minutos para activación
  
  // Crear nuevo usuario
  const id = sheet.getLastRow();
  const ahora = new Date();
  
  sheet.appendRow([
    id,
    pseudonimo,
    nombre,
    apellidos,
    email,
    telefono,
    ahora,
    'pendiente_verificacion',
    otp,
    expiracion,
    ahora,
    '{}' // favoritos_json
  ]);
  
  // Enviar email con OTP
  enviarEmailOTP(email, nombre, otp, true);
  
  return jsonResponse({
    success: true,
    message: 'Cuenta creada. Revisa tu email.',
    pseudonimo: pseudonimo
  });
}

function handleEnviarOTP(data) {
  const sheet = getSheet(SHEET_NAMES.USUARIOS);
  const usuarios = sheet.getDataRange().getValues();
  const email = data.email;
  
  if (!email) {
    return jsonResponse({ success: false, message: 'Email requerido' });
  }
  
  // Buscar usuario por email
  let usuarioRow = -1;
  let usuario = null;
  for (let i = 1; i < usuarios.length; i++) {
    if (usuarios[i][4] === email) {
      usuarioRow = i + 1;
      usuario = usuarios[i];
      break;
    }
  }
  
  if (usuarioRow === -1) {
    return jsonResponse({ success: false, message: 'Email no registrado' });
  }
  
  // Verificar si está activo
  const estado = usuario[7];
  if (estado === 'pendiente_verificacion') {
    return jsonResponse({ success: false, message: 'Cuenta no activada. Completa el registro primero.' });
  }
  
  // Generar nuevo OTP
  const otp = generarOTP();
  const expiracion = new Date(Date.now() + 10 * 60000);
  
  // Actualizar en sheet
  sheet.getRange(usuarioRow, 9).setValue(otp); // columna I (otp_actual)
  sheet.getRange(usuarioRow, 10).setValue(expiracion); // columna J (otp_expiracion)
  
  // Enviar email
  const nombre = usuario[2];
  enviarEmailOTP(email, nombre, otp, false);
  
  return jsonResponse({ success: true, message: 'Código enviado a tu email' });
}

function handleValidarOTP(data) {
  const sheet = getSheet(SHEET_NAMES.USUARIOS);
  const usuarios = sheet.getDataRange().getValues();
  const email = data.email;
  const otpIngresado = (data.otp || '').toString();
  
  if (!email || !otpIngresado) {
    return jsonResponse({ success: false, message: 'Email y código requeridos' });
  }
  
  // Buscar usuario
  let usuarioRow = -1;
  let usuario = null;
  for (let i = 1; i < usuarios.length; i++) {
    if (usuarios[i][4] === email) {
      usuarioRow = i + 1;
      usuario = usuarios[i];
      break;
    }
  }
  
  if (!usuario) {
    return jsonResponse({ success: false, message: 'Usuario no encontrado' });
  }
  
  // Verificar OTP
  const otpGuardado = (usuario[8] || '').toString();
  const expiracion = new Date(usuario[9]);
  
  Logger.log('OTP guardado: ' + otpGuardado + ', OTP ingresado: ' + otpIngresado);
  
  if (otpGuardado !== otpIngresado) {
    return jsonResponse({ success: false, message: 'Código incorrecto' });
  }
  
  if (new Date() > expiracion) {
    return jsonResponse({ success: false, message: 'Código expirado. Solicita uno nuevo.' });
  }
  
  // Limpiar OTP y actualizar estado
  sheet.getRange(usuarioRow, 8).setValue('activo');
  sheet.getRange(usuarioRow, 9).setValue(''); // Limpiar OTP
  sheet.getRange(usuarioRow, 11).setValue(new Date()); // ultimo_acceso
  
  // Generar token de sesión
  const token = generarToken();
  
  // Preparar datos del usuario
  const usuarioData = {
    id: usuario[0],
    pseudonimo: usuario[1],
    nombre: usuario[2],
    apellidos: usuario[3],
    email: usuario[4],
    telefono: usuario[5]
  };
  
  return jsonResponse({
    success: true,
    message: 'Login exitoso',
    usuario: usuarioData,
    token: token
  });
}

function handleActivarCuenta(data) {
  const sheet = getSheet(SHEET_NAMES.USUARIOS);
  const usuarios = sheet.getDataRange().getValues();
  const email = data.email;
  const otpIngresado = (data.otp || '').toString();
  
  if (!email || !otpIngresado) {
    return jsonResponse({ success: false, message: 'Email y código requeridos' });
  }
  
  // Buscar usuario
  let usuarioRow = -1;
  let usuario = null;
  for (let i = 1; i < usuarios.length; i++) {
    if (usuarios[i][4] === email) {
      usuarioRow = i + 1;
      usuario = usuarios[i];
      break;
    }
  }
  
  if (!usuario) {
    return jsonResponse({ success: false, message: 'Usuario no encontrado' });
  }
  
  // Verificar OTP
  const otpGuardado = (usuario[8] || '').toString();
  const expiracion = new Date(usuario[9]);
  
  if (otpGuardado !== otpIngresado) {
    return jsonResponse({ success: false, message: 'Código incorrecto' });
  }
  
  if (new Date() > expiracion) {
    return jsonResponse({ success: false, message: 'Código expirado' });
  }
  
  // Activar cuenta
  sheet.getRange(usuarioRow, 8).setValue('activo');
  sheet.getRange(usuarioRow, 9).setValue(''); // Limpiar OTP
  
  return jsonResponse({ success: true, message: 'Cuenta activada correctamente' });
}

// ================================================
// HANDLERS DE DATOS DE USUARIO
// ================================================

function handleActualizarDatosDirectos(data) {
  const sheet = getSheet(SHEET_NAMES.USUARIOS);
  const usuarios = sheet.getDataRange().getValues();
  
  // Buscar usuario por ID
  let usuarioRow = -1;
  for (let i = 1; i < usuarios.length; i++) {
    if (usuarios[i][0] == data.userId) {
      usuarioRow = i + 1;
      break;
    }
  }
  
  if (usuarioRow === -1) {
    return jsonResponse({ success: false, message: 'Usuario no encontrado' });
  }
  
  // Actualizar teléfono y email
  if (data.telefono) sheet.getRange(usuarioRow, 6).setValue(data.telefono);
  if (data.email) sheet.getRange(usuarioRow, 5).setValue(data.email);
  
  return jsonResponse({ success: true, message: 'Datos actualizados' });
}

function handleGuardarSuscripciones(data) {
  return jsonResponse({ success: true, message: 'Suscripciones guardadas' });
}

function handleObtenerFavoritos(userId) {
  return jsonResponse({ success: true, favoritos: [] });
}

function handleObtenerAnuncios(userId) {
  return jsonResponse({ success: true, anuncios: [] });
}

function handleObtenerSuscripciones(userId) {
  return jsonResponse({ success: true, subscripciones: {} });
}

function handleObtenerSolicitudes(userId) {
  return jsonResponse({ success: true, solicitudes: [] });
}

// ================================================
// FUNCIONES AUXILIARES
// ================================================

function getSheet(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);
  
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    
    if (sheetName === SHEET_NAMES.USUARIOS) {
      sheet.appendRow([
        'id', 'pseudonimo', 'nombre', 'apellidos', 'email', 'telefono',
        'fecha_registro', 'estado', 'otp_actual', 'otp_expiracion',
        'ultimo_acceso', 'favoritos_json'
      ]);
    }
  }
  
  return sheet;
}

function generarPseudonimo(nombre) {
  const base = (nombre || 'user').toLowerCase().replace(/\s/g, '_').replace(/[^a-z0-9_]/g, '');
  const random = Math.floor(Math.random() * 1000);
  return `${base}_tk${random}`;
}

function generarOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function generarToken() {
  return Utilities.getUuid();
}

function enviarEmailOTP(email, nombre, otp, esActivacion) {
  const asunto = esActivacion 
    ? 'Activa tu cuenta - Tank Ibérica' 
    : 'Tu código de acceso - Tank Ibérica';
  
  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
      <div style="background: #0F2A2E; padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">Tank Ibérica</h1>
      </div>
      <div style="padding: 30px; background: #f9f9f9;">
        <p>Hola ${nombre || 'Usuario'},</p>
        <p>${esActivacion ? 'Tu código de activación es:' : 'Tu código de acceso es:'}</p>
        <div style="background: #0F2A2E; color: white; padding: 20px; text-align: center; font-size: 32px; letter-spacing: 8px; font-weight: bold; margin: 20px 0;">
          ${otp}
        </div>
        <p style="color: #666; font-size: 14px;">
          Este código expira en ${esActivacion ? '30' : '10'} minutos.<br>
          Si no solicitaste este código, puedes ignorar este mensaje.
        </p>
      </div>
      <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
        © Tank Ibérica - tankiberica.com
      </div>
    </div>
  `;
  
  try {
    GmailApp.sendEmail(email, asunto, `Tu código es: ${otp}`, { htmlBody: htmlBody });
    Logger.log('Email enviado a: ' + email);
  } catch (error) {
    Logger.log('Error enviando email: ' + error);
    // Intentar con MailApp si GmailApp falla
    try {
      MailApp.sendEmail(email, asunto, `Tu código es: ${otp}`, { htmlBody: htmlBody });
    } catch (error2) {
      Logger.log('Error con MailApp: ' + error2);
    }
  }
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ================================================
// FUNCIONES DE TEST
// ================================================

function testAPI() {
  Logger.log('=== TEST API ===');
  const sheet = getSheet(SHEET_NAMES.USUARIOS);
  Logger.log('Hoja usuarios: ' + sheet.getName());
  Logger.log('Filas: ' + sheet.getLastRow());
  return { success: true };
}

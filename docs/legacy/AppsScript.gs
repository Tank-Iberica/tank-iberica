/**
 * ================================================
 * TANK IBERICA - GOOGLE APPS SCRIPT
 * Sistema de Autenticación con Email + Contraseña
 * ================================================
 * 
 * ACTUALIZADO: Recibe datos como form-data (URLSearchParams)
 * para evitar problemas de CORS
 */

// ⚠️ IMPORTANTE: Este ID se obtiene de la URL de tu Google Sheet
// https://docs.google.com/spreadsheets/d/[ESTE_ES_EL_ID]/edit
const SPREADSHEET_ID = '1GdmirqWFKVt39QvEJxdMH3zW0-itl64YuqYEsOAkF30';

const SHEET_USUARIOS = 'usuarios';

const COL = {
  ID: 0,
  PSEUDONIMO: 1,
  NOMBRE: 2,
  APELLIDOS: 3,
  EMAIL: 4,
  TELEFONO: 5,
  FECHA_REGISTRO: 6,
  ESTADO: 7,
  ULTIMO_ACCESO: 8,
  FAVORITOS_JSON: 9,
  PASSWORD_HASH: 10,
  METODO_REGISTRO: 11,
  SUSCRIPCIONES_JSON: 12,
  TOKEN_RECUPERACION: 13,
  TOKEN_EXPIRACION: 14
};

// ================================================
// ENDPOINTS PRINCIPALES
// ================================================

function doGet(e) {
  if (!e || !e.parameter) {
    return jsonResponse({ success: false, message: 'Endpoint activo.' });
  }
  
  const action = e.parameter.action;
  
  try {
    switch(action) {
      case 'verificarPseudonimo':
        return verificarPseudonimoDisponible(e.parameter.pseudonimo);
      case 'verificarEmail':
        return verificarEmailDisponible(e.parameter.email);
      default:
        return jsonResponse({ success: false, message: 'Acción GET no válida' });
    }
  } catch (error) {
    Logger.log('Error en doGet: ' + error);
    return jsonResponse({ success: false, message: error.toString() });
  }
}

function doPost(e) {
  if (!e) {
    return jsonResponse({ success: false, message: 'Sin datos' });
  }
  
  try {
    // Intentar parsear como JSON primero, luego como form-data
    let data = {};
    
    if (e.postData && e.postData.contents) {
      try {
        // Intentar JSON
        data = JSON.parse(e.postData.contents);
      } catch (jsonError) {
        // Si falla, es form-data (URLSearchParams)
        data = e.parameter || {};
      }
    } else if (e.parameter) {
      // Form-data directo
      data = e.parameter;
    }
    
    const action = data.action;
    
    Logger.log('=== POST Request ===');
    Logger.log('Acción: ' + action);
    Logger.log('Datos: ' + JSON.stringify(data));
    
    switch(action) {
      case 'registrar':
        return handleRegistrar(data);
      case 'login':
        return handleLogin(data);
      case 'recuperarPassword':
        return handleRecuperarPassword(data);
      case 'resetearPassword':
        return handleResetearPassword(data);
      case 'actualizarPerfil':
        return handleActualizarPerfil(data);
      case 'cambiarPassword':
        return handleCambiarPassword(data);
      case 'appendRow':
        return handleAppendRow(data);
      default:
        return jsonResponse({ success: false, message: 'Acción POST no válida: ' + action });
    }
  } catch (error) {
    Logger.log('Error en doPost: ' + error);
    return jsonResponse({ success: false, message: error.toString() });
  }
}

// ================================================
// HANDLERS DE AUTENTICACIÓN
// ================================================

function handleRegistrar(data) {
  const email = data.email;
  const password = data.password;
  const pseudonimo = data.pseudonimo;
  const nombre = data.nombre;
  const apellidos = data.apellidos;
  const telefono = data.telefono || '';
  
  if (!email || !password || !pseudonimo || !nombre || !apellidos) {
    return jsonResponse({ success: false, message: 'Faltan campos obligatorios' });
  }
  
  if (password.length < 6) {
    return jsonResponse({ success: false, message: 'La contraseña debe tener al menos 6 caracteres' });
  }
  
  const sheet = getUsuariosSheet();
  const usuarios = sheet.getDataRange().getValues();
  
  // Verificar email único
  for (let i = 1; i < usuarios.length; i++) {
    if (usuarios[i][COL.EMAIL] && usuarios[i][COL.EMAIL].toString().toLowerCase() === email.toLowerCase()) {
      return jsonResponse({ success: false, message: 'Este email ya está registrado', code: 'EMAIL_EXISTS' });
    }
  }
  
  // Verificar pseudónimo único
  for (let i = 1; i < usuarios.length; i++) {
    if (usuarios[i][COL.PSEUDONIMO] && usuarios[i][COL.PSEUDONIMO].toString().toLowerCase() === pseudonimo.toLowerCase()) {
      return jsonResponse({ success: false, message: 'Este nombre de usuario ya existe', code: 'PSEUDO_EXISTS' });
    }
  }
  
  const passwordHash = hashPassword(password);
  const newId = usuarios.length > 1 ? Math.max(...usuarios.slice(1).map(r => parseInt(r[COL.ID]) || 0)) + 1 : 1;
  const ahora = new Date();
  
  const newRow = [
    newId,
    pseudonimo.trim(),
    nombre.trim(),
    apellidos.trim(),
    email.toLowerCase().trim(),
    telefono.trim(),
    ahora,
    'activo',
    ahora,
    '[]',
    passwordHash,
    'email',
    '{}',
    '',
    ''
  ];
  
  sheet.appendRow(newRow);
  
  enviarEmailBienvenida(email, nombre, pseudonimo);
  
  const sessionToken = generarToken();
  
  const userData = {
    id: newId,
    pseudonimo: pseudonimo.trim(),
    nombre: nombre.trim(),
    apellidos: apellidos.trim(),
    email: email.toLowerCase().trim(),
    telefono: telefono.trim(),
    fecha_registro: ahora.toISOString(),
    metodo_registro: 'email'
  };
  
  Logger.log('✅ Usuario registrado: ' + email);
  
  return jsonResponse({
    success: true,
    message: 'Cuenta creada correctamente',
    usuario: userData,
    token: sessionToken
  });
}

function handleLogin(data) {
  const email = data.email;
  const password = data.password;
  
  if (!email || !password) {
    return jsonResponse({ success: false, message: 'Email y contraseña son obligatorios' });
  }
  
  const sheet = getUsuariosSheet();
  const usuarios = sheet.getDataRange().getValues();
  
  let usuarioRow = -1;
  let usuario = null;
  
  for (let i = 1; i < usuarios.length; i++) {
    if (usuarios[i][COL.EMAIL] && usuarios[i][COL.EMAIL].toString().toLowerCase() === email.toLowerCase()) {
      usuarioRow = i + 1;
      usuario = usuarios[i];
      break;
    }
  }
  
  if (!usuario) {
    return jsonResponse({ success: false, message: 'Email no registrado', code: 'EMAIL_NOT_FOUND' });
  }
  
  if (usuario[COL.ESTADO] !== 'activo') {
    return jsonResponse({ success: false, message: 'Cuenta no activa', code: 'ACCOUNT_INACTIVE' });
  }
  
  if (usuario[COL.METODO_REGISTRO] && usuario[COL.METODO_REGISTRO] !== 'email') {
    return jsonResponse({ 
      success: false, 
      message: 'Esta cuenta fue creada con ' + usuario[COL.METODO_REGISTRO],
      code: 'WRONG_METHOD'
    });
  }
  
  const passwordHash = hashPassword(password);
  if (passwordHash !== usuario[COL.PASSWORD_HASH]) {
    return jsonResponse({ success: false, message: 'Contraseña incorrecta', code: 'WRONG_PASSWORD' });
  }
  
  sheet.getRange(usuarioRow, COL.ULTIMO_ACCESO + 1).setValue(new Date());
  
  const sessionToken = generarToken();
  
  const userData = {
    id: usuario[COL.ID],
    pseudonimo: usuario[COL.PSEUDONIMO],
    nombre: usuario[COL.NOMBRE],
    apellidos: usuario[COL.APELLIDOS],
    email: usuario[COL.EMAIL],
    telefono: usuario[COL.TELEFONO] || '',
    fecha_registro: usuario[COL.FECHA_REGISTRO],
    metodo_registro: usuario[COL.METODO_REGISTRO] || 'email'
  };
  
  Logger.log('✅ Login exitoso: ' + email);
  
  return jsonResponse({
    success: true,
    message: 'Inicio de sesión exitoso',
    usuario: userData,
    token: sessionToken
  });
}

function handleRecuperarPassword(data) {
  const email = data.email;
  
  if (!email) {
    return jsonResponse({ success: false, message: 'Email es obligatorio' });
  }
  
  const sheet = getUsuariosSheet();
  const usuarios = sheet.getDataRange().getValues();
  
  let usuarioRow = -1;
  let usuario = null;
  
  for (let i = 1; i < usuarios.length; i++) {
    if (usuarios[i][COL.EMAIL] && usuarios[i][COL.EMAIL].toString().toLowerCase() === email.toLowerCase()) {
      usuarioRow = i + 1;
      usuario = usuarios[i];
      break;
    }
  }
  
  if (!usuario || (usuario[COL.METODO_REGISTRO] && usuario[COL.METODO_REGISTRO] !== 'email')) {
    return jsonResponse({ success: true, message: 'Si el email existe, recibirás instrucciones' });
  }
  
  const token = generarTokenRecuperacion();
  const expiracion = new Date(Date.now() + 60 * 60 * 1000);
  
  sheet.getRange(usuarioRow, COL.TOKEN_RECUPERACION + 1).setValue(token);
  sheet.getRange(usuarioRow, COL.TOKEN_EXPIRACION + 1).setValue(expiracion);
  
  enviarEmailRecuperacion(email, usuario[COL.NOMBRE], token);
  
  return jsonResponse({ success: true, message: 'Si el email existe, recibirás instrucciones' });
}

function handleResetearPassword(data) {
  const token = data.token;
  const newPassword = data.newPassword;
  
  if (!token || !newPassword) {
    return jsonResponse({ success: false, message: 'Token y contraseña son obligatorios' });
  }
  
  if (newPassword.length < 6) {
    return jsonResponse({ success: false, message: 'Mínimo 6 caracteres' });
  }
  
  const sheet = getUsuariosSheet();
  const usuarios = sheet.getDataRange().getValues();
  
  let usuarioRow = -1;
  let usuario = null;
  
  for (let i = 1; i < usuarios.length; i++) {
    if (usuarios[i][COL.TOKEN_RECUPERACION] === token) {
      usuarioRow = i + 1;
      usuario = usuarios[i];
      break;
    }
  }
  
  if (!usuario) {
    return jsonResponse({ success: false, message: 'Token inválido', code: 'INVALID_TOKEN' });
  }
  
  const expiracion = new Date(usuario[COL.TOKEN_EXPIRACION]);
  if (new Date() > expiracion) {
    sheet.getRange(usuarioRow, COL.TOKEN_RECUPERACION + 1).setValue('');
    sheet.getRange(usuarioRow, COL.TOKEN_EXPIRACION + 1).setValue('');
    return jsonResponse({ success: false, message: 'Enlace expirado', code: 'TOKEN_EXPIRED' });
  }
  
  const passwordHash = hashPassword(newPassword);
  sheet.getRange(usuarioRow, COL.PASSWORD_HASH + 1).setValue(passwordHash);
  sheet.getRange(usuarioRow, COL.TOKEN_RECUPERACION + 1).setValue('');
  sheet.getRange(usuarioRow, COL.TOKEN_EXPIRACION + 1).setValue('');
  
  return jsonResponse({ success: true, message: 'Contraseña actualizada' });
}

function handleActualizarPerfil(data) {
  const userId = data.userId;
  const telefono = data.telefono;
  const email = data.email;
  
  if (!userId) {
    return jsonResponse({ success: false, message: 'ID requerido' });
  }
  
  const sheet = getUsuariosSheet();
  const usuarios = sheet.getDataRange().getValues();
  
  let usuarioRow = -1;
  
  for (let i = 1; i < usuarios.length; i++) {
    if (parseInt(usuarios[i][COL.ID]) === parseInt(userId)) {
      usuarioRow = i + 1;
      break;
    }
  }
  
  if (usuarioRow === -1) {
    return jsonResponse({ success: false, message: 'Usuario no encontrado' });
  }
  
  if (telefono !== undefined) {
    sheet.getRange(usuarioRow, COL.TELEFONO + 1).setValue(telefono);
  }
  
  if (email !== undefined) {
    for (let i = 1; i < usuarios.length; i++) {
      if (i + 1 !== usuarioRow && usuarios[i][COL.EMAIL].toString().toLowerCase() === email.toLowerCase()) {
        return jsonResponse({ success: false, message: 'Email en uso' });
      }
    }
    sheet.getRange(usuarioRow, COL.EMAIL + 1).setValue(email.toLowerCase());
  }
  
  return jsonResponse({ success: true, message: 'Perfil actualizado' });
}

function handleCambiarPassword(data) {
  const userId = data.userId;
  const currentPassword = data.currentPassword;
  const newPassword = data.newPassword;
  
  if (!userId || !currentPassword || !newPassword) {
    return jsonResponse({ success: false, message: 'Faltan campos' });
  }
  
  if (newPassword.length < 6) {
    return jsonResponse({ success: false, message: 'Mínimo 6 caracteres' });
  }
  
  const sheet = getUsuariosSheet();
  const usuarios = sheet.getDataRange().getValues();
  
  let usuarioRow = -1;
  let usuario = null;
  
  for (let i = 1; i < usuarios.length; i++) {
    if (parseInt(usuarios[i][COL.ID]) === parseInt(userId)) {
      usuarioRow = i + 1;
      usuario = usuarios[i];
      break;
    }
  }
  
  if (!usuario) {
    return jsonResponse({ success: false, message: 'Usuario no encontrado' });
  }
  
  const currentHash = hashPassword(currentPassword);
  if (currentHash !== usuario[COL.PASSWORD_HASH]) {
    return jsonResponse({ success: false, message: 'Contraseña actual incorrecta' });
  }
  
  const newHash = hashPassword(newPassword);
  sheet.getRange(usuarioRow, COL.PASSWORD_HASH + 1).setValue(newHash);
  
  return jsonResponse({ success: true, message: 'Contraseña actualizada' });
}

// ================================================
// VERIFICACIONES
// ================================================

function verificarPseudonimoDisponible(pseudonimo) {
  if (!pseudonimo) return jsonResponse({ success: false, disponible: false });
  
  const sheet = getUsuariosSheet();
  const usuarios = sheet.getDataRange().getValues();
  
  for (let i = 1; i < usuarios.length; i++) {
    if (usuarios[i][COL.PSEUDONIMO] && usuarios[i][COL.PSEUDONIMO].toString().toLowerCase() === pseudonimo.toLowerCase()) {
      return jsonResponse({ success: true, disponible: false });
    }
  }
  
  return jsonResponse({ success: true, disponible: true });
}

function verificarEmailDisponible(email) {
  if (!email) return jsonResponse({ success: false, disponible: false });
  
  const sheet = getUsuariosSheet();
  const usuarios = sheet.getDataRange().getValues();
  
  for (let i = 1; i < usuarios.length; i++) {
    if (usuarios[i][COL.EMAIL] && usuarios[i][COL.EMAIL].toString().toLowerCase() === email.toLowerCase()) {
      return jsonResponse({ success: true, disponible: false });
    }
  }
  
  return jsonResponse({ success: true, disponible: true });
}

// ================================================
// FUNCIONES AUXILIARES
// ================================================

function getUsuariosSheet() {
  // Usar openById para que funcione tanto desde editor como desplegado
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(SHEET_USUARIOS);
  
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_USUARIOS);
    sheet.appendRow([
      'id', 'pseudonimo', 'nombre', 'apellidos', 'email', 'telefono',
      'fecha_registro', 'estado', 'ultimo_acceso', 'favoritos_json',
      'password_hash', 'metodo_registro', 'suscripciones_json',
      'token_recuperacion', 'token_expiracion'
    ]);
  }
  
  return sheet;
}

function hashPassword(password) {
  const rawHash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password);
  let hash = '';
  for (let i = 0; i < rawHash.length; i++) {
    let byte = rawHash[i];
    if (byte < 0) byte += 256;
    let hex = byte.toString(16);
    if (hex.length === 1) hex = '0' + hex;
    hash += hex;
  }
  return hash;
}

function generarToken() {
  return Utilities.getUuid();
}

function generarTokenRecuperacion() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ================================================
// EMAILS
// ================================================

function enviarEmailBienvenida(email, nombre, pseudonimo) {
  const asunto = '¡Bienvenido a Tank Ibérica!';
  const cuerpo = `
Hola ${nombre},

¡Tu cuenta en Tank Ibérica ha sido creada correctamente!

Tu nombre de usuario es: ${pseudonimo}

Ya puedes acceder a tu cuenta para guardar vehículos en favoritos, recibir alertas y mucho más.

Saludos,
El equipo de Tank Ibérica
www.tankiberica.com
  `;
  
  try {
    GmailApp.sendEmail(email, asunto, cuerpo);
    Logger.log('📧 Email de bienvenida enviado a: ' + email);
  } catch (error) {
    Logger.log('❌ Error enviando email: ' + error);
  }
}

function enviarEmailRecuperacion(email, nombre, token) {
  const resetUrl = `https://www.tankiberica.com?reset=${token}`;
  
  const asunto = 'Recupera tu contraseña - Tank Ibérica';
  const cuerpo = `
Hola ${nombre},

Para restablecer tu contraseña, haz clic en el siguiente enlace:
${resetUrl}

Este enlace expirará en 1 hora.

Si no solicitaste este cambio, ignora este mensaje.

Saludos,
El equipo de Tank Ibérica
  `;
  
  try {
    GmailApp.sendEmail(email, asunto, cuerpo);
    Logger.log('📧 Email de recuperación enviado a: ' + email);
  } catch (error) {
    Logger.log('❌ Error enviando email: ' + error);
  }
}

// ================================================
// TEST
// ================================================

function testRegistro() {
  const result = handleRegistrar({
    email: 'test@test.com',
    password: 'test123456',
    pseudonimo: 'testuser_' + Date.now(),
    nombre: 'Test',
    apellidos: 'Usuario',
    telefono: ''
  });
  Logger.log(JSON.parse(result.getContent()));
}

function testLogin() {
  const result = handleLogin({
    email: 'test@test.com',
    password: 'test123456'
  });
  Logger.log(JSON.parse(result.getContent()));
}

// ================================================
// HANDLER PARA AÑADIR FILAS (CHAT, ETC)
// ================================================

function handleAppendRow(data) {
  try {
    const sheetName = data.sheet;
    const rowData = typeof data.data === 'string' ? JSON.parse(data.data) : data.data;
    
    if (!sheetName || !rowData) {
      return jsonResponse({ success: false, message: 'Faltan parámetros: sheet y data' });
    }
    
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(sheetName);
    
    if (!sheet) {
      return jsonResponse({ success: false, message: 'Hoja no encontrada: ' + sheetName });
    }
    
    sheet.appendRow(rowData);
    
    Logger.log('Fila añadida a ' + sheetName + ': ' + JSON.stringify(rowData));
    
    return jsonResponse({ success: true, message: 'Fila añadida correctamente' });
  } catch (error) {
    Logger.log('Error en handleAppendRow: ' + error);
    return jsonResponse({ success: false, message: error.toString() });
  }
}


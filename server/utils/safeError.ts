import { createError } from 'h3'

const GENERIC_MESSAGES: Record<number, string> = {
  400: 'Solicitud inválida',
  401: 'Autenticación requerida',
  403: 'Operación no permitida',
  404: 'Recurso no encontrado',
  429: 'Demasiadas solicitudes',
  500: 'Error interno del servidor',
}

function isProd() {
  return process.env.NODE_ENV === 'production'
}

export function safeError(statusCode: number, devMessage: string): ReturnType<typeof createError> {
  return createError({
    statusCode,
    message: isProd() ? GENERIC_MESSAGES[statusCode] || 'Error' : devMessage,
  })
}

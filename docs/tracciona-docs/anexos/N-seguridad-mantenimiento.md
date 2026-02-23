## ANEXO N: SEGURIDAD Y MANTENIMIENTO

### N.1 Arquitectura de seguridad por capas

```
Capa 1 — RED:       Cloudflare (DDoS, WAF, rate limiting)
Capa 2 — DNS:       Cloudflare (DNSSEC activado)
Capa 3 — SSL:       Cloudflare (automático, Always HTTPS)
Capa 4 — APP:       Nuxt 3 SSR en Cloudflare Pages (sin servidor propio)
Capa 5 — BD:        Supabase (managed PostgreSQL, backups diarios)
Capa 6 — AUTH:      Supabase Auth (JWT, refresh tokens, bcrypt)
Capa 7 — ARCHIVOS:  Cloudinary (re-renderiza, elimina metadatos maliciosos)
Capa 8 — CÓDIGO:    TypeScript tipado, RLS en todas las tablas
Capa 9 — MONITOREO: Sentry + Better Uptime + Search Console
```

**Ventaja inherente:** Stack serverless = no hay servidor que hackear, no hay OS que parchear, no hay Apache/Nginx que configurar mal. Cloudflare, Supabase y Cloudinary gestionan la infraestructura. Elimina el 80% de vectores de ataque típicos.

### N.2 Vectores de ataque reales y mitigación

**1. RLS mal configuradas (CRÍTICO):**
Si te equivocas en una policy, un usuario puede ver o modificar datos de otro.

- Cada tabla tiene RLS activado SIEMPRE
- Nunca desactivar RLS "temporalmente para probar"
- Antes de lanzar: revisar cada tabla (¿qué lee un anónimo? ¿qué modifica un dealer sobre sus datos?)
- Principio de mínimo privilegio
- Supabase dashboard avisa de tablas sin RLS — revisarlo mensualmente

**2. Autenticación y sesiones:**
Supabase Auth gestiona tokens JWT, refresh tokens, bcrypt. No reinventar.

- Tokens con expiración corta (1 hora)
- Refresh tokens con rotación
- Cerrar sesión en todos los dispositivos si un dealer reporta acceso no autorizado
- Contraseñas de 8+ caracteres obligatorias
- 2FA opcional para dealers

**3. Inyección de contenido malicioso:**
Dealers suben fotos y descripciones.

- Sanitizar toda entrada de usuario con DOMPurify
- Cloudinary re-renderiza imágenes (elimina metadatos y código embebido)
- Nunca renderizar HTML crudo de un usuario sin sanitizar

**4. API keys expuestas:**

- Supabase anon key = pública por diseño (OK)
- service_role key = NUNCA en frontend, solo en Edge Functions/server routes
- Revisar repo con `grep -r "service_role" /app/` mensualmente
- Variables de entorno en Cloudflare Pages, nunca hardcodeadas

**5. Spam y abuso de catálogo:**

- Captcha con Cloudflare Turnstile en registro y formularios públicos
- Flag automático si alguien publica >10 vehículos en 1 minuto
- Moderación manual los primeros meses (trivial con 15-20 dealers)

**6. Scraping del catálogo:**

- Rate limiting en API de Supabase (viene configurado)
- No merece la pena preocuparse al principio — si te scrapean, tienes algo valioso

### N.3 Herramientas de prevención (todas gratuitas)

| Herramienta               | Propósito                             | Coste                         |
| ------------------------- | ------------------------------------- | ----------------------------- |
| Cloudflare WAF            | Firewall de aplicación web            | Gratis (tier básico)          |
| Cloudflare Turnstile      | Captcha invisible                     | Gratis                        |
| DOMPurify                 | Sanitizar HTML de usuarios            | npm, gratis                   |
| gitleaks                  | Detectar secrets en commits           | GitHub Action, gratis         |
| Sentry                    | Monitoring de errores en producción   | Gratis hasta 5K eventos/mes   |
| Arcjet                    | Rate limiting por endpoint            | Gratis hasta 10K requests/mes |
| Better Uptime             | Monitoreo de disponibilidad           | Gratis (básico)               |
| Mozilla Observatory       | Auditoría de security headers         | Web gratuita                  |
| HIBP API                  | Verificar si passwords filtradas      | Gratis                        |
| npm audit                 | Vulnerabilidades en dependencias      | CLI gratis                    |
| GitHub Dependabot         | PRs automáticos para deps vulnerables | Gratis                        |
| Supabase Security Advisor | Revisión de RLS y permisos            | Incluido en dashboard         |

### N.4 Security headers (archivo `_headers` de Cloudflare Pages)

```
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=(self)
  X-XSS-Protection: 1; mode=block
  Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
  Content-Security-Policy: default-src 'self'; img-src 'self' https://res.cloudinary.com https://*.googletagmanager.com; script-src 'self' 'unsafe-inline' https://*.googletagmanager.com https://*.google-analytics.com https://pagead2.googlesyndication.com; style-src 'self' 'unsafe-inline'; font-src 'self'; connect-src 'self' https://*.supabase.co https://*.google-analytics.com;
```

Objetivo: puntuación A+ en Mozilla Observatory. Ajustar CSP según dominios activos.

### N.5 Checklist de seguridad pre-lanzamiento

```
☐ RLS activado en TODAS las tablas (verificar en Supabase dashboard)
☐ service_role key NO presente en ningún archivo del frontend
☐ Cloudflare Turnstile en formularios públicos (registro, contacto, anúnciate)
☐ DOMPurify sanitizando descripciones de vehículos antes de renderizar
☐ Security headers configurados en _headers
☐ DNSSEC activado en Cloudflare
☐ 2FA activado en: Cloudflare, Supabase, GitHub, registrador de dominio
☐ npm audit sin vulnerabilidades high/critical
☐ gitleaks configurado como GitHub Action
☐ .env.example NO contiene secrets reales
☐ Backup de Supabase verificado (Pro incluye diarios automáticos)
☐ Rate limiting configurado (100 req/min por IP vía Cloudflare)
☐ robots.txt bloquea /admin, /dashboard, /api
☐ Imágenes servidas solo desde Cloudinary (no uploads directos al servidor)
☐ Password mínimo 8 caracteres configurado en Supabase Auth
☐ Email de recuperación de contraseña funcional
```

### N.6 Mantenimiento mensual

| Tarea                                           | Frecuencia      | Tiempo    | Automatizable                 |
| ----------------------------------------------- | --------------- | --------- | ----------------------------- |
| Revisar RLS al añadir feature                   | Cuando develops | 1-2h/mes  | No                            |
| npm audit (dependencias)                        | Mensual         | 15 min    | Sí (Dependabot)               |
| Revisar logs Supabase (errores, queries lentas) | Semanal         | 30 min    | Parcialmente                  |
| Actualizar dependencias npm                     | Mensual         | 30-60 min | Parcialmente (Dependabot PRs) |
| Backup de datos                                 | Automático      | 0 min     | Sí (Supabase Pro)             |
| Monitorizar uptime                              | Continuo        | 0 min     | Sí (Better Uptime)            |
| Revisar Search Console errores                  | Semanal         | 15 min    | No                            |
| Renovar SSL                                     | Automático      | 0 min     | Sí (Cloudflare)               |

**Total: 3-5 horas/mes.**

### N.7 Plan de respuesta a incidentes

**Cuenta de dealer comprometida:**

1. Desactivar cuenta inmediatamente (status = 'suspended')
2. Revocar todas las sesiones del dealer
3. Revertir cambios en vehículos (si hay ediciones sospechosas)
4. Contactar al dealer por teléfono
5. Resetear contraseña y activar 2FA

**API key filtrada (service_role):**

1. Rotar key inmediatamente en Supabase dashboard
2. Actualizar variable de entorno en Cloudflare Pages
3. Auditar logs de Supabase para detectar accesos no autorizados
4. Revisar qué datos pudieron accederse
5. Ejecutar gitleaks para encontrar el punto de filtración

**Sitio caído:**

1. Verificar Cloudflare status (si es ellos, esperar)
2. Verificar Supabase status
3. Si es código propio: rollback al último deploy funcional en Cloudflare Pages (1 clic)
4. Notificar a usuarios si la caída supera 1 hora

### N.8 Freelance de emergencia

No necesitas a nadie contratado permanentemente. Pero sí tener identificado (no contratado) un desarrollador freelance mid-level con experiencia en Nuxt/Supabase que pueda intervenir en emergencia.

- Presupuesto de emergencia: 500-1.000€ para intervención puntual
- El código está en GitHub, documentado, TypeScript tipado — cualquiera puede cogerlo

---

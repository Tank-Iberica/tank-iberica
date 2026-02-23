# Plan de Contingencia y Resiliencia Técnica

> Última actualización: Sesión 30
> Objetivo: Documentar procedimientos de migración de cada servicio y garantizar que Tracciona nunca dependa de un solo proveedor sin plan B.

---

## 1. Fuente de verdad: GitHub

**Regla:** GitHub es la fuente de verdad del código. No OneDrive, no local.

- **Push diario obligatorio** a `main` (o rama de trabajo)
- `.gitignore` excluye: `node_modules/`, `.nuxt/`, `.output/`, `.env`, `supabase/.temp/`
- Los archivos `.env` se documentan en `.env.example` con valores placeholder
- Las migraciones SQL viven en `supabase/migrations/` y se versionan con el código
- La documentación vive en `docs/` y se versiona con el código

### Verificación

```bash
# Verificar que estamos al día con remote
git status
git log --oneline -5
git push origin main
```

---

## 2. Base de datos: Supabase → PostgreSQL autoalojado

### Estado actual

- **Proveedor:** Supabase (proyecto `gmnrfuzekbwyzkgsaftv`)
- **Motor:** PostgreSQL 15
- **Extensiones usadas:** `uuid-ossp`, `pgcrypto`, `pg_trgm`
- **Features Supabase específicas:** Auth (GoTrue), RLS, Realtime, Storage (mínimo)
- **Migraciones:** `supabase/migrations/00001-000XX`

### Alternativas

| Proveedor                | Tipo          | Precio aprox.       | Pros                            | Contras              |
| ------------------------ | ------------- | ------------------- | ------------------------------- | -------------------- |
| **Railway**              | PaaS          | $5-20/mes           | Deploy fácil, escala automática | Sin RLS nativo       |
| **Neon**                 | Serverless PG | Free tier + $19/mes | Branch databases, serverless    | Sin Auth integrado   |
| **VPS (Hetzner)**        | IaaS          | €4-10/mes           | Control total, más barato       | Mantenimiento manual |
| **Supabase Self-hosted** | Docker        | Coste VPS           | Misma API, transición suave     | Requiere DevOps      |

### Procedimiento de migración

#### Paso 1: Exportar datos

```bash
# Usando Supabase CLI (método recomendado)
npx supabase db dump --project-ref gmnrfuzekbwyzkgsaftv -f backup_full.sql

# O directamente con pg_dump si tienes la connection string
pg_dump "postgresql://postgres.[ref]:[password]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres" \
  --no-owner --no-acl --clean --if-exists \
  -f backup_full.sql
```

#### Paso 2: Preparar destino

```bash
# Railway
railway init
railway add --plugin postgresql
railway connect postgresql

# Neon
# Crear proyecto en dashboard.neon.tech
# Obtener connection string

# VPS (Docker)
docker run -d --name tracciona-db \
  -e POSTGRES_PASSWORD=<strong-password> \
  -e POSTGRES_DB=tracciona \
  -p 5432:5432 \
  -v pgdata:/var/lib/postgresql/data \
  postgres:15
```

#### Paso 3: Restaurar

```bash
psql $NEW_DATABASE_URL < backup_full.sql

# Verificar
psql $NEW_DATABASE_URL -c "SELECT COUNT(*) FROM vehicles;"
psql $NEW_DATABASE_URL -c "SELECT COUNT(*) FROM dealers;"
psql $NEW_DATABASE_URL -c "SELECT COUNT(*) FROM users;"
```

#### Paso 4: Adaptar código Nuxt

```
# Cambios necesarios en el código:

1. Reemplazar @supabase/ssr por cliente PostgreSQL directo (pg, drizzle-orm, o prisma)
2. Reemplazar Supabase Auth por:
   - Auth.js (next-auth adaptado a Nuxt) — recomendado
   - Lucia Auth — ligero, buena integración con Nuxt
   - Custom JWT — más trabajo, más control
3. Reemplazar Supabase Realtime por:
   - Socket.io
   - Server-Sent Events (SSE) — más simple
   - Ably/Pusher — si se quiere SaaS
4. Reemplazar supabase.from('table') por ORM queries
5. RLS → middleware de autorización en server routes
6. Supabase Storage → sistema de archivos o S3

# Estimación de esfuerzo: 3-5 días de trabajo
```

#### Paso 5: Actualizar variables de entorno

```env
# Antes (Supabase)
SUPABASE_URL=https://gmnrfuzekbwyzkgsaftv.supabase.co
SUPABASE_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Después (PostgreSQL directo)
DATABASE_URL=postgresql://user:pass@host:5432/tracciona
AUTH_SECRET=<random-secret>
AUTH_PROVIDER=lucia  # o authjs
```

---

## 3. Hosting: Cloudflare Pages → Vercel o Netlify

### Estado actual

- **Proveedor:** Cloudflare Pages
- **Build:** `npm run build` (Nuxt 3 SSR)
- **Runtime:** Cloudflare Workers (edge)
- **DNS:** Cloudflare
- **CDN:** Cloudflare (automático)

### Alternativas

| Proveedor     | Tipo | Precio aprox.       | Pros                      | Contras           |
| ------------- | ---- | ------------------- | ------------------------- | ----------------- |
| **Vercel**    | PaaS | Free tier + $20/mes | Mejor DX, preview deploys | Más caro a escala |
| **Netlify**   | PaaS | Free tier + $19/mes | Functions incluidas       | Más lento en SSR  |
| **Railway**   | PaaS | $5-20/mes           | Flexible, Docker support  | Sin CDN integrado |
| **VPS + PM2** | IaaS | €4-10/mes           | Control total             | Sin auto-deploy   |

### Procedimiento de migración

#### A Vercel

```bash
# 1. Instalar CLI
npm i -g vercel

# 2. Configurar preset en nuxt.config.ts
# Cambiar nitro.preset de 'cloudflare-pages' a 'vercel'
# (o eliminar — Vercel lo detecta automáticamente)

# 3. Conectar repo
vercel link
vercel --prod

# 4. Variables de entorno
vercel env add SUPABASE_URL
vercel env add SUPABASE_KEY
# ... etc

# 5. DNS: Cambiar CNAME de Cloudflare a Vercel
# En registrador DNS:
# tracciona.com CNAME cname.vercel-dns.com
```

#### A Netlify

```bash
# 1. Instalar CLI
npm i -g netlify-cli

# 2. Configurar preset en nuxt.config.ts
# nitro: { preset: 'netlify' }

# 3. Conectar repo
netlify init
netlify deploy --prod

# 4. Variables de entorno
netlify env:set SUPABASE_URL "https://..."
# ... etc
```

#### A VPS con PM2

```bash
# 1. Build para Node.js
# nuxt.config.ts: nitro: { preset: 'node-server' }
npm run build

# 2. En el VPS
scp -r .output/ user@vps:/var/www/tracciona/
ssh user@vps
cd /var/www/tracciona
pm2 start .output/server/index.mjs --name tracciona
pm2 save

# 3. Nginx reverse proxy
# /etc/nginx/sites-available/tracciona
server {
    listen 80;
    server_name tracciona.com www.tracciona.com;
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

# 4. SSL con Certbot
certbot --nginx -d tracciona.com -d www.tracciona.com
```

### Checklist post-migración hosting

- [ ] DNS propagado (verificar con `dig tracciona.com`)
- [ ] HTTPS funcionando
- [ ] Todas las rutas responden (/, /catalogo, /vehiculo/_, /admin/_, /dashboard/\*)
- [ ] Server routes funcionando (/api/\*)
- [ ] Variables de entorno configuradas
- [ ] Redirects 301 de www → non-www (o viceversa)
- [ ] robots.txt y sitemap.xml accesibles

---

## 4. Imágenes: Cloudinary → Cloudflare Images o bunny.net

### Estado actual

- **Proveedor:** Cloudinary (via `@nuxt/image`)
- **Uso:** Transformaciones on-the-fly (resize, format, quality)
- **URLs:** `https://res.cloudinary.com/[cloud_name]/image/upload/...`
- **Almacenamiento:** Todas las fotos de vehículos + logos dealers

### Alternativas

| Proveedor                  | Precio aprox.                        | Pros                     | Contras                |
| -------------------------- | ------------------------------------ | ------------------------ | ---------------------- |
| **Cloudflare Images**      | $5/100K images + $1/100K transforms  | Integrado con CF, barato | API diferente          |
| **bunny.net**              | $0.01/GB storage + $0.01/GB transfer | Muy barato, CDN global   | Menos transformaciones |
| **imgproxy** (self-hosted) | Coste VPS                            | Gratis, potente          | Requiere Docker        |
| **S3 + CloudFront**        | Variable                             | Escalable                | Más complejo           |

### Procedimiento de migración

#### Paso 1: Inventariar imágenes

```bash
# Listar todas las URLs de Cloudinary en la BD
psql $DATABASE_URL -c "
  SELECT DISTINCT unnest(images) AS url
  FROM vehicles
  WHERE images IS NOT NULL AND array_length(images, 1) > 0
  LIMIT 10;
"
```

#### Paso 2: Descargar todas las imágenes

```bash
# Script Node.js para descargar en lote
# Extraer cloud_name y public_id de cada URL
# Descargar original: https://res.cloudinary.com/[cloud]/image/upload/[public_id]
# Guardar en carpeta local organizada por vehicle_id
```

#### Paso 3: Subir al nuevo proveedor

```bash
# Cloudflare Images
curl -X POST "https://api.cloudflare.com/client/v4/accounts/{account_id}/images/v1" \
  -H "Authorization: Bearer {api_token}" \
  -F "file=@image.jpg" \
  -F "metadata={\"vehicle_id\":\"abc123\"}"

# bunny.net
curl -X PUT "https://storage.bunnycdn.com/{storage_zone}/{path}" \
  -H "AccessKey: {api_key}" \
  --data-binary @image.jpg
```

#### Paso 4: Actualizar URLs en BD

```sql
-- Reemplazar URLs de Cloudinary por nuevas URLs
UPDATE vehicles
SET images = array_replace(images, old_url, new_url)
WHERE old_url = ANY(images);
```

#### Paso 5: Actualizar nuxt.config.ts

```typescript
// Antes
image: {
  cloudinary: {
    baseURL: 'https://res.cloudinary.com/...'
  }
}

// Después (bunny.net)
image: {
  domains: ['tracciona.b-cdn.net']
}

// Después (Cloudflare Images)
image: {
  domains: ['imagedelivery.net']
}
```

---

## 5. Email: Resend → SendGrid o Amazon SES

### Estado actual

- **Proveedor:** Resend (API key en `.env`)
- **Uso:** Emails transaccionales (alertas, notificaciones, facturas)
- **Templates:** Almacenados en tabla `email_templates`
- **Endpoint:** `server/api/email/send.post.ts`

### Alternativas

| Proveedor      | Free tier           | Precio            | Pros                         | Contras                |
| -------------- | ------------------- | ----------------- | ---------------------------- | ---------------------- |
| **SendGrid**   | 100/día             | $19.95/mes (50K)  | Muy fiable, buena reputación | Dashboard complejo     |
| **Amazon SES** | 62K/mes (si en EC2) | $0.10/1000 emails | Muy barato, escalable        | Setup DNS complejo     |
| **Postmark**   | 100/mes             | $15/mes (10K)     | Mejor deliverability         | Más caro               |
| **Mailgun**    | 100/día (sandbox)   | $35/mes (50K)     | API simple                   | Cara para volumen bajo |

### Procedimiento de migración

#### Paso 1: Cambiar solo el endpoint de envío

```typescript
// server/api/email/send.post.ts — cambiar la función de envío

// Antes (Resend)
import { Resend } from 'resend'
const resend = new Resend(process.env.RESEND_API_KEY)
await resend.emails.send({ from, to, subject, html })

// Después (SendGrid)
import sgMail from '@sendgrid/mail'
sgMail.setApiKey(process.env.SENDGRID_API_KEY!)
await sgMail.send({ from, to, subject, html })

// Después (Amazon SES)
import { SES } from '@aws-sdk/client-ses'
const ses = new SES({ region: 'eu-west-1' })
await ses.sendEmail({
  Source: from,
  Destination: { ToAddresses: [to] },
  Message: {
    Subject: { Data: subject },
    Body: { Html: { Data: html } },
  },
})
```

#### Paso 2: DNS

```
# Verificar dominio en el nuevo proveedor
# Añadir registros SPF, DKIM, DMARC según instrucciones del proveedor
# Ejemplo para SendGrid:
# TXT em1234.tracciona.com → CNAME al valor de SendGrid
# TXT s1._domainkey.tracciona.com → CNAME al valor de SendGrid
```

#### Paso 3: Actualizar .env

```env
# Antes
RESEND_API_KEY=re_xxxxx

# Después (SendGrid)
SENDGRID_API_KEY=SG.xxxxx

# Después (SES)
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=eu-west-1
```

### Nota importante

La lógica de templates (`email_templates` en BD) y la composición del HTML son **independientes del proveedor de envío**. Solo cambia la última milla (el `send()`). Esto hace que el cambio sea de **< 1 hora**.

---

## 6. Pagos: Stripe

### Estado actual

- **Proveedor:** Stripe
- **Uso:** Suscripciones de dealers, pagos one-time
- **Webhook:** `server/api/stripe/webhook.post.ts`
- **Portal:** `server/api/stripe/portal.post.ts`

### Realidad

**No hay alternativa real a Stripe** para pagos recurrentes en Europa con la misma calidad de API y documentación. Las alternativas (Paddle, Lemon Squeezy, Mollie) son viables pero requieren refactoring significativo.

### Procedimiento de exportación de datos (por seguridad)

```bash
# Exportar clientes
stripe customers list --limit 100 -d "created[gte]=1672531200" > stripe_customers.json

# Exportar suscripciones
stripe subscriptions list --limit 100 > stripe_subscriptions.json

# Exportar facturas
stripe invoices list --limit 100 > stripe_invoices.json

# Exportar pagos
stripe charges list --limit 100 > stripe_charges.json

# O usar el dashboard: Stripe Dashboard → Configuración → Datos → Exportar
```

### Mapeo de datos para migración

```
stripe_customer_id → dealers.stripe_customer_id (ya en BD)
stripe_subscription_id → dealer_subscriptions.stripe_subscription_id (ya en BD)
```

### Alternativas (si algún día fuera necesario)

| Proveedor         | Pros                     | Contras              |
| ----------------- | ------------------------ | -------------------- |
| **Paddle**        | MoR (Merchant of Record) | Comisiones más altas |
| **Lemon Squeezy** | Simple, MoR              | Menos features       |
| **Mollie**        | Europeo, SEPA nativo     | API menos pulida     |

---

## 7. Backup semanal automatizado

### Estrategia de retención

- **4 backups semanales** (últimas 4 semanas)
- **3 backups mensuales** (últimos 3 meses)
- **Cifrado:** AES-256 con `gpg` o `openssl`
- **Destino:** Backblaze B2 (o S3 compatible)

### Scripts

- `scripts/backup-weekly.sh` — ejecutar cada domingo a las 03:00
- `scripts/backup-restore.sh` — restaurar un backup a una instancia nueva

### Cron (en servidor o GitHub Actions)

```yaml
# .github/workflows/backup.yml
name: Weekly DB Backup
on:
  schedule:
    - cron: '0 3 * * 0' # Domingos a las 03:00 UTC
  workflow_dispatch:

jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Install Supabase CLI
        run: npm i -g supabase
      - name: Run backup
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
          SUPABASE_PROJECT_REF: gmnrfuzekbwyzkgsaftv
          BACKUP_ENCRYPTION_KEY: ${{ secrets.BACKUP_ENCRYPTION_KEY }}
          B2_APPLICATION_KEY_ID: ${{ secrets.B2_APPLICATION_KEY_ID }}
          B2_APPLICATION_KEY: ${{ secrets.B2_APPLICATION_KEY }}
          B2_BUCKET_NAME: ${{ secrets.B2_BUCKET_NAME }}
        run: bash scripts/backup-weekly.sh
```

---

## 8. Checklist de resiliencia

### Verificación mensual

- [ ] Backup semanal ejecutándose correctamente (verificar B2/S3)
- [ ] Restauración de prueba exitosa (al menos 1x/trimestre)
- [ ] GitHub al día (no hay commits locales sin push)
- [ ] Variables de entorno documentadas en `.env.example`
- [ ] DNS records documentados
- [ ] Certificados SSL válidos (auto-renovación activa)

### En caso de caída de Supabase

1. Restaurar último backup en Railway/Neon/VPS
2. Cambiar `DATABASE_URL` en Vercel/Cloudflare
3. Redeploy
4. Tiempo estimado: 1-2 horas

### En caso de caída de Cloudflare Pages

1. `vercel --prod` (deploy a Vercel)
2. Cambiar DNS CNAME
3. Tiempo estimado: 30 minutos

### En caso de caída de Cloudinary

1. Las imágenes cacheadas en CDN seguirán disponibles temporalmente
2. Subir a bunny.net y actualizar URLs
3. Tiempo estimado: 2-4 horas (según cantidad de imágenes)

### En caso de caída de Resend

1. Cambiar `send()` a SendGrid/SES (< 1 hora)
2. Verificar DNS (DKIM/SPF) — puede tardar 24-48h en propagar
3. Los emails en cola se perderán — re-enviar manualmente los críticos

---

## 9. Contactos y credenciales

> **IMPORTANTE:** Las credenciales reales están en `.env` (no versionado) y en el gestor de contraseñas del equipo.

| Servicio     | Dashboard              | Email de cuenta       |
| ------------ | ---------------------- | --------------------- |
| Supabase     | supabase.com/dashboard | tankiberica@gmail.com |
| Cloudflare   | dash.cloudflare.com    | tankiberica@gmail.com |
| Cloudinary   | cloudinary.com/console | tankiberica@gmail.com |
| Stripe       | dashboard.stripe.com   | tankiberica@gmail.com |
| Resend       | resend.com             | tankiberica@gmail.com |
| GitHub       | github.com             | tankiberica@gmail.com |
| Backblaze B2 | secure.backblaze.com   | (configurar)          |

---

_Documento creado en Sesión 30. Revisar trimestralmente._

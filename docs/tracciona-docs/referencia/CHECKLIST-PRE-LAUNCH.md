# Checklist Pre-Launch por Vertical

**Uso:** Verificar antes de hacer go-live con una nueva vertical.
**Referencia:** [PLAYBOOK-NUEVA-VERTICAL.md](PLAYBOOK-NUEVA-VERTICAL.md)

---

## 1. Infraestructura

- [ ] Dominio registrado y DNS configurado en Cloudflare
- [ ] Certificado SSL activo (Cloudflare automatic)
- [ ] Cloudflare Pages project creado con `NUXT_PUBLIC_SITE_URL`
- [ ] Environment variables configuradas (SUPABASE_URL, ANON_KEY, CRON_SECRET, etc.)
- [ ] UptimeRobot monitor activo para el nuevo dominio
- [ ] CF WAF rules aplicadas (rate limiting, bot protection)
- [ ] `robots.txt` dinámico verificado (sitemap URL correcta)
- [ ] `sitemap.xml` generándose con URLs correctas

## 2. Base de datos

- [ ] `create-vertical.mjs` ejecutado sin errores
- [ ] `vertical_config` row verificada (theme, subscription_prices, commission_rates, seo)
- [ ] Categorías y subcategorías seed insertadas
- [ ] Atributos de vehículo/producto definidos
- [ ] `subscription_tiers` creados (free, basic, premium, founding)
- [ ] RLS policies verificadas (dealer solo ve su vertical)
- [ ] Feature flags configurados para la vertical
- [ ] Health check endpoint retorna OK: `GET /api/health?vertical=1`

## 3. Branding y contenido

- [ ] Logo SVG subido y configurado en `vertical_config.logo_url`
- [ ] Favicon generado (16x16, 32x32, apple-touch-icon)
- [ ] Color primario y paleta definidos en `vertical_config.theme`
- [ ] Tipografía confirmada (Inter default o custom)
- [ ] Textos legales adaptados (condiciones, privacidad, cookies)
- [ ] Email templates verificados (welcome, lead notification, weekly digest)
- [ ] Páginas estáticas revisadas (sobre nosotros, transparencia, servicios)

## 4. SEO

- [ ] Google Search Console configurado para el dominio
- [ ] `usePageSeo()` genera title/description/OG correctos
- [ ] Structured data (JSON-LD) con `@type` correcto para la vertical
- [ ] Meta description y title en i18n (es + en mínimo)
- [ ] `canonical` URL sin duplicados
- [ ] Imágenes OG generadas o placeholder configurado
- [ ] Google Analytics / Tag Manager instalado

## 5. Funcionalidad

- [ ] Catálogo carga y filtra correctamente
- [ ] Detalle de vehículo/producto renderiza con todos los campos
- [ ] Registro de usuario funciona (email confirmation)
- [ ] Login funciona (email + password)
- [ ] Publicación de anuncio funciona (dealer flow)
- [ ] Contacto con vendedor funciona (lead + email notification)
- [ ] Stripe checkout funciona (suscripción dealer)
- [ ] Dashboard dealer muestra estadísticas
- [ ] Admin panel accesible y funcional

## 6. Testing

- [ ] Smoke tests automáticos pasados (`create-vertical.mjs --smoke`)
- [ ] Test hardcoded-vertical-refs pasa (0 referencias a nombres de vertical)
- [ ] Lighthouse score >90 en homepage y catálogo
- [ ] axe-core accesibilidad WCAG 2.1 AA sin violaciones críticas
- [ ] Mobile responsive verificado en 360px, 768px, 1024px
- [ ] Cross-browser verificado (Chrome, Safari, Firefox)

## 7. Legal y compliance

- [ ] Términos de servicio actualizados para la vertical
- [ ] Política de privacidad actualizada
- [ ] Banner de cookies funcional
- [ ] GDPR: data retention policy aplicable
- [ ] Pie de página con enlaces legales correctos

## 8. Monitoring post-launch

- [ ] Error rate monitoring activo (Sentry/similar)
- [ ] UptimeRobot heartbeat cada 30s
- [ ] Alertas de caída configuradas (email + WhatsApp)
- [ ] Analytics tracking verificado (events llegan a analytics_events)
- [ ] Web Vitals budget verificado (LCP <2.5s, CLS <0.1, INP <200ms)

---

_Marcar con [x] cada item antes de go-live. Guardar copia completada en `docs/launches/[vertical]-pre-launch-[fecha].md`._

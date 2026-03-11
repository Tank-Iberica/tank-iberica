# Cloudflare WAF Setup — P0 CRÍTICO

**Objetivo:** Rate limiting en producción por IP para prevenir abuso.  
**Responsable:** Fundadores (acceso Cloudflare dashboard)  
**Tiempo:** ~15 min  
**Estado:** Documentado 11-mar — Aplicar en producción

## 1. Rate Limiting Rule (Security → WAF → Rate Limiting)

| Campo | Valor |
|-------|-------|
| **Threshold** | 100 requests per 10 seconds |
| **Counting Expression** | `ip.src` |
| **Mitigation** | Block (429 Too Many Requests) |
| **Scope** | All incoming traffic |
| **Actions** | Block |

### 2. Custom Rules Específicas por Endpoint

| Endpoint | Threshold | Window | Block |
|----------|-----------|--------|-------|
| `/api/auth/login` | 5 req / 5 min | Per IP | 429 |
| `/api/stripe/*` | 20 req / 1 min | Per IP | 429 |
| `/api/email/send` | 10 req / 1 hour | Per IP | 429 |
| `/api/whatsapp/*` | 50 req / 1 min | Per IP | 429 |
| `/api/*` (default) | 100 req / 10 sec | Per IP | 429 |

## 3. Pasos en Dashboard

1. **Cloudflare Dashboard** → tracciona.com  
2. **Security** → **WAF** → **Security Rules**  
3. **Rate Limiting** → **Create Rule**
4. Aplicar tabla arriba
5. **Deploy** → Wait ~30 sec propagation
6. Test: `curl -i https://api.tracciona.com/api/health` ×101 → 429 en request 101

## 4. Monitoreo

- **Analytics & Logs** → **Security Events** → Filtrar `rate-limit`
- Alert si >10% de traffic bloqueado (posible DoS o misconfiguration)
- Revisar logs diarios primeras 2 semanas post-deploy

## 5. Rollback

Si bloques legítimos:
1. Increase threshold temporalmente (+50%)
2. Whitelist IPs específicas si conocidas (CDN, partners)
3. Monitor 24h antes de ajustar permanentemente

---

**Status:** 🟡 **Waiting Founders** — Esta documentación es referencia para copy-paste.

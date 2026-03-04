# Política de Auditoría — Tracciona

Reglas operativas para que las herramientas de auditoría generen acción, no solo informes.

---

## 1. SLAs de vulnerabilidades (SCA + DAST)

| Severidad    | Tiempo máximo para fix/mitigación | Excepción                                                                                                                                      |
| ------------ | --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| **CRITICAL** | **48–72 horas**                   | No hay excepción. Si no hay fix upstream, mitigar (desactivar feature, workaround, WAF rule).                                                  |
| **HIGH**     | **7 días**                        | Aceptación de riesgo documentada si no hay fix disponible. Crear issue con etiqueta `risk-accepted` y fecha de re-evaluación (máximo 30 días). |
| **MEDIUM**   | Próximo sprint                    | Evaluar en planificación semanal.                                                                                                              |
| **LOW/INFO** | Backlog                           | Solo si coincide con otra tarea en la zona afectada.                                                                                           |

**Aplica a:** npm audit, Trivy, Semgrep, ZAP, Nuclei, Snyk, SonarQube.

---

## 2. Triage semanal de DAST (ZAP + Nuclei)

Los scans DAST generan artefactos cada domingo. Sin triage, se acumulan sin acción.

**Regla:** Cada lunes, revisar los artefactos de la última ejecución (5-10 min):

1. Abrir `dast-summary.txt` del último run.
2. Si hay **nuevos** findings CRITICAL/HIGH → crear issue inmediatamente con SLA arriba.
3. Si un finding CRITICAL/HIGH **se repite 2 semanas consecutivas sin fix** → escalar: etiquetar como `security-blocker` y priorizar sobre cualquier feature.
4. Si solo hay MEDIUM/LOW o el scan está limpio → archivar (no requiere acción).

**Resultado esperado:** 0 findings CRITICAL/HIGH acumulados >2 semanas.

---

## 3. SonarQube semanal — Resultado esperado

Ejecutar `bash sonar/run-scan.sh` cada lunes (o vía Windows Task Scheduler).

**No basta con ejecutar. El scan debe validar estos 3 checkpoints:**

| Checkpoint       | Métrica                   | Acción si falla                                          |
| ---------------- | ------------------------- | -------------------------------------------------------- |
| Hotspots         | No suben vs scan anterior | Revisar nuevos hotspots y clasificar (Safe/Fixed/To Fix) |
| Bugs reliability | No sube (rating A)        | Fix inmediato de nuevos bugs                             |
| Coverage         | No baja vs scan anterior  | Investigar qué tests se perdieron                        |

**Resultado esperado por scan:** 3 checks verdes. Si alguno falla, abrir tarea antes de continuar con features.

---

## 4. Prioridad operativa: Uptime

**UptimeRobot es el paso #1 pendiente.** Es el único gap que deja completamente ciego ante caídas de producción. 15 minutos de setup, retorno inmediato.

### Setup (manual, dashboard web):

1. Registrar en https://uptimerobot.com (gratis, 50 monitores)
2. Crear 3 monitores HTTP(S):
   - `https://tracciona.com` — home (keyword check: buscar texto que siempre esté)
   - `https://tracciona.com/catalogo` — catálogo funcional
   - `https://tracciona.com/api/health` — healthcheck del server (crear endpoint si no existe)
3. Configurar alertas: email a tankiberica@gmail.com + Telegram (opcional)
4. Activar status page pública (opcional, URL compartible con dealers)

**KPI:** Uptime >99.5% mensual.

---

## 5. Severity × Exposure matrix — Prioridad de fix

Cruza severidad técnica con exposición real para decidir urgencia real.

|              | **Público** (sin auth)     | **Autenticado** (buyer/seller) | **Admin-only** |
| ------------ | -------------------------- | ------------------------------ | -------------- |
| **CRITICAL** | Fix inmediato (bloqueante) | Fix <24h                       | Fix <72h       |
| **HIGH**     | Fix <24h                   | Fix <7 días                    | Fix <7 días    |
| **MEDIUM**   | Fix próximo sprint         | Evaluar en planning            | Backlog        |
| **LOW**      | Backlog                    | Backlog                        | Ignorar        |

**Regla práctica:** Un HIGH en endpoint público tiene más urgencia que un CRITICAL admin-only.

---

## 5b. No-new-debt — Regla de degradación cero

**Principio:** Ningún PR puede empeorar las métricas de auditoría existentes.

| Métrica          | Regla                                                        |
| ---------------- | ------------------------------------------------------------ |
| SonarQube issues | PR no puede introducir nuevos bugs o vulnerabilidades        |
| npm audit        | No aumentar el número de HIGH/CRITICAL vs. rama base         |
| ESLint errors    | Zero tolerance — CI bloquea en cualquier error nuevo         |
| Coverage         | No bajar más de 0.5% por PR (thresholds en vitest.config.ts) |

**Implementación en SonarQube:** Quality Gate "Tracciona" ya está configurado con "New Code" gate.
El gate falla si el código nuevo introduce issues. Ver localhost:9000.

---

## 5c. SSRF — Política de URLs externas

**SSRF (Server-Side Request Forgery):** Un atacante fuerza al servidor a hacer requests internos.

**Regla para todos los endpoints que aceptan URLs del cliente:**

1. **Whitelist de esquemas:** Solo `https://`. Rechazar `http://`, `file://`, `javascript:`, `data:`, esquemas internos.
2. **No llamar a IPs privadas:** Rechazar `localhost`, `127.0.0.1`, `169.254.*` (metadata cloud), `10.*`, `172.16-31.*`, `192.168.*`.
3. **Timeout agresivo:** Máximo 5 segundos en fetches externos iniciados por usuario.
4. **Ejemplo en producción:** `/api/images/process` ya valida esquemas (tests en authorization-regression.test.ts §10).

```typescript
// Patrón seguro para validar URLs de usuario
function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'https:') return false
    // Bloquear IPs privadas
    const host = parsed.hostname
    if (/^(localhost|127\.|10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|169\.254\.)/.test(host))
      return false
    return true
  } catch {
    return false
  }
}
```

---

## 6. Enforcement por tier (referencia rápida)

### Tier 1 — Bloqueante en PR (alto riesgo, baja discusión)

- Gitleaks (secretos)
- ESLint + TypeScript + Build
- Semgrep SAST
- npm audit (--omit=dev, HIGH+ de producción)
- Tests (unit + security + E2E)

### Tier 2 — Report-only → estabilizar → bloquear

- axe-core (a11y) → bloquear cuando violations = 0
- Coverage thresholds → bloquear cuando Vitest y SonarQube estén alineados
- knip (dead code) → bloquear tras limpiar falsos positivos de Nuxt
- Bundle size → bloquear tras definir baseline

### Tier 3 — Scheduled / observación

- Lighthouse strict (solo semanal, warn en PR)
- ZAP + Nuclei DAST (report-only + triage semanal)
- Trivy SCA (report-only, segunda opinión)
- DB advisors (report-only)
- UptimeRobot (monitoreo continuo)
- SonarQube (semanal manual con checkpoints)

---

## 6. Calendario semanal de auditoría

| Día                | Acción                                                | Tiempo     |
| ------------------ | ----------------------------------------------------- | ---------- |
| **Lunes**          | Triage DAST (artefactos del domingo) + SonarQube scan | 15-20 min  |
| **Martes-Viernes** | CI automático cubre todo en PRs                       | 0 min      |
| **Viernes**        | Revisar Dependabot PRs pendientes                     | 5-10 min   |
| **Domingo (auto)** | ZAP + Nuclei + Lighthouse strict + Git mirror         | Automático |

---

_Última actualización: sesión de auditoría mar-2026_

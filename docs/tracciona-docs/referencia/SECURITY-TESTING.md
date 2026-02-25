# Security Testing Strategy

## Capas de seguridad

| Capa              | Herramienta           | Frecuencia                  | Qué detecta                         |
| ----------------- | --------------------- | --------------------------- | ----------------------------------- |
| SAST (código)     | Semgrep               | Cada PR + diario            | Patrones inseguros en código fuente |
| Dependencias      | npm audit             | Cada PR + diario            | Vulnerabilidades en dependencias    |
| DAST (producción) | OWASP ZAP             | Semanal (baseline)          | XSS, SQLi, CSRF, headers, cookies   |
| Infraestructura   | Nuclei                | Semanal                     | CVEs, misconfigs, exposiciones, SSL |
| Lógica de negocio | Vitest security tests | Cada PR                     | IDOR, rate limiting, info leakage   |
| Pentest humano    | Externo               | Anual (cuando haya revenue) | Ataques creativos, lógica compleja  |

## Cómo ejecutar

### Escaneo DAST manual (full scan)

GitHub Actions → dast-scan.yml → Run workflow → scan_type: full

### Interpretar resultados de ZAP

- **High** (rojo): Vulnerabilidad explotable. Corregir ANTES de seguir.
- **Medium** (naranja): Vulnerabilidad potencial. Corregir en la siguiente sesión.
- **Low** (amarillo): Mejora de seguridad. Planificar.
- **Informational** (azul): Solo información. Revisar si es relevante.

Los informes HTML se descargan de GitHub Actions → Artifacts.

### Interpretar resultados de Nuclei

- **Critical/High**: Acción inmediata.
- **Medium**: Planificar corrección.
- **Info**: Templates que detectaron la tecnología (normal).

## Falsos positivos conocidos

Ver `.zap/rules.tsv` para la lista de reglas ignoradas/rebajadas con justificación.

## Cuándo contratar pentest humano

Cuando se cumplan 2 de estos 3:

1. Revenue mensual > 1.000€
2. > 50 dealers activos con datos reales
3. Procesamiento de pagos activo (Stripe live mode)

Proveedores recomendados: Cobalt (~3.000€), HackerOne (~2.000€ bug bounty), freelance senior (~1.500€).

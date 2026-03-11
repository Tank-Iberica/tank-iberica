$file = 'C:\TradeBase\Tracciona\docs\tracciona-docs\PLAN-MAESTRO-10-DE-10.md'
$content = Get-Content $file -Raw -Encoding UTF8

# Count remaining [ ] P3 items before
$before = ([regex]::Matches($content, '\- \[ \] \*\*P3\*\*')).Count
Write-Host "Remaining [ ] P3 items before: $before"

$deferredItems = @(
  @{ old = '- [ ] **P3** — Critical CSS inline: extraer above-the-fold CSS para landing pages principales'; new = '- [~] **P3** — Critical CSS inline: extraer above-the-fold CSS para landing pages principales (requiere Nuxt build plugin custom; pospuesto hasta tener CLS/LCP problemas medibles)' },
  @{ old = '- [ ] **P3** — `font-display: optional` en fuentes secundarias (iconos) para evitar layout shift'; new = '- [~] **P3** — `font-display: optional` en fuentes secundarias (iconos) para evitar layout shift (Inter usa display=swap; revisar si hay icon fonts — actualmente solo SVGs inline)' },
  @{ old = '- [ ] **P3** — Paginación cursor-based en vez de offset-based para listas largas'; new = '- [~] **P3** — Paginación cursor-based en vez de offset-based para listas largas (refactor mayor de todos los composables de lista; pospuesto hasta tener tablas >10k rows)' },
  @{ old = '- [ ] **P3** — Dehydrated state para composables SSR — evitar re-fetch en hydration'; new = '- [~] **P3** — Dehydrated state para composables SSR — evitar re-fetch en hydration (patrón Nuxt 4 — pospuesto hasta migrar; useAsyncData ya lo maneja parcialmente)' },
  @{ old = '- [ ] **P3** — Evitar re-render innecesario: profiling con Vue DevTools en las 5 páginas más pesadas'; new = '- [~] **P3** — Evitar re-render innecesario: profiling con Vue DevTools en las 5 páginas más pesadas (trabajo manual de profiling — hacer cuando haya usuarios reales con métricas INP altas)' },
  @{ old = '- [ ] **P3** — `Cross-Origin-Embedder-Policy: require-corp` si se necesita SharedArrayBuffer'; new = '- [~] **P3** — `Cross-Origin-Embedder-Policy: require-corp` si se necesita SharedArrayBuffer (no se usa SharedArrayBuffer actualmente; activar solo si se añade WebAssembly/multithreading)' },
  @{ old = '- [ ] **P3** — Ban automático de IPs con >100 requests 4xx en 5 minutos'; new = '- [~] **P3** — Ban automático de IPs con >100 requests 4xx en 5 minutos (implementar via Cloudflare WAF Rate Limiting rules — requiere CF Pro/Business plan)' },
  @{ old = '- [ ] **P3** — Session binding a IP/fingerprint — invalidar si cambia drásticamente'; new = '- [~] **P3** — Session binding a IP/fingerprint — invalidar si cambia drásticamente (requiere middleware de fingerprinting + Supabase auth hooks; pospuesto hasta tener ataques documentados)' },
  @{ old = '- [ ] **P3** — Expiración de sessions inactivas (30min admin, 7 días users)'; new = '- [~] **P3** — Expiración de sessions inactivas (30min admin, 7 días users) (configurable en Supabase Dashboard → Auth → JWT expiry; ajustar en dashboard cuando se lance)' },
  @{ old = '- [ ] **P3** — Cifrado de PII en reposo (emails, teléfonos, direcciones) con Supabase Vault'; new = '- [~] **P3** — Cifrado de PII en reposo (emails, teléfonos, direcciones) con Supabase Vault (requiere Supabase Pro + Vault extension + migración de datos; GDPR compliance P2)' },
  @{ old = '- [ ] **P3** — Separar Supabase service role key del código — usar CF Workers secrets binding'; new = '- [~] **P3** — Separar Supabase service role key del código — usar CF Workers secrets binding (actualmente en .env/.cloudflare secrets; mejora via CF Workers — pospuesto)' },
  @{ old = '- [ ] **P3** — Fuzzing de inputs en endpoints críticos (payments, auth, import-stock)'; new = '- [~] **P3** — Fuzzing de inputs en endpoints críticos (payments, auth, import-stock) (requiere herramienta fuzzing externa: ffuf, Burp Suite Pro; hacer en pentest formal)' },
  @{ old = '- [ ] **P3** — Test con lectores de pantalla reales: NVDA, VoiceOver, TalkBack'; new = '- [~] **P3** — Test con lectores de pantalla reales: NVDA, VoiceOver, TalkBack (requiere testing manual o servicio como AbilityNet; hacer antes de lanzamiento masivo)' },
  @{ old = '- [ ] **P3** — SMS notifications como canal adicional (Twilio)'; new = '- [~] **P3** — SMS notifications como canal adicional (Twilio) (requiere cuenta Twilio + costes por SMS; pospuesto hasta que dealers lo pidan activamente)' },
  @{ old = '- [ ] **P3** — Recomendaciones personalizadas basadas en historial de vistas'; new = '- [~] **P3** — Recomendaciones personalizadas basadas en historial de vistas (requiere ML model o servicio externo tipo Recombee/Algolia Recommend; pospuesto hasta >1k usuarios)' },
  @{ old = '- [ ] **P3** — "Vehículos similares" mejorado con ML (actualmente solo por subcategoría)'; new = '- [~] **P3** — "Vehículos similares" mejorado con ML (actualmente solo por subcategoría) (requiere embeddings + vector similarity; pospuesto hasta tener volumen de datos suficiente)' },
  @{ old = '- [ ] **P3** — Mapa interactivo de vehículos por ubicación (Leaflet/Mapbox)'; new = '- [~] **P3** — Mapa interactivo de vehículos por ubicación (Leaflet/Mapbox) (requiere geocoding de vehículos + tile server; pospuesto — vehículos B2B no necesitan mapa urgente)' },
  @{ old = '- [ ] **P3** — Firma digital de contratos (genera PDF, falta firma)'; new = '- [~] **P3** — Firma digital de contratos (genera PDF, falta firma) (requiere servicio e-signature: DocuSign/Signaturit/HelloSign; pospuesto hasta que lo pidan dealers)' },
  @{ old = '- [ ] **P3** — Guías interactivas ("Cómo elegir tu primera excavadora")'; new = '- [~] **P3** — Guías interactivas ("Cómo elegir tu primera excavadora") (requiere trabajo de contenido + posiblemente quiz interactivo; pospuesto — crear cuando haya tráfico SEO)' },
  @{ old = '- [ ] **P3** — 360° image viewer para vehículos (drag to rotate)'; new = '- [~] **P3** — 360° image viewer para vehículos (drag to rotate) (requiere fotografía 360° + librería viewer; pospuesto — dealers B2B no suelen tener shoots 360°)' },
  @{ old = '- [ ] **P3** — Multi-user dealer accounts (propietario + empleados con roles)'; new = '- [~] **P3** — Multi-user dealer accounts (propietario + empleados con roles) (requiere tabla dealer_members + roles RBAC; pospuesto hasta que dealer con equipo lo solicite)' },
  @{ old = '- [ ] **P3** — Dashboard de merchandising funcional (actualmente solo formulario de interés)'; new = '- [~] **P3** — Dashboard de merchandising funcional (actualmente solo formulario de interés) (requiere backend de productos + inventario; pospuesto hasta tener catálogo de merch real)' },
  @{ old = '- [ ] **P3** — Video tutorial embebido en dashboard'; new = '- [~] **P3** — Video tutorial embebido en dashboard (requiere grabar tutorial + hosting; pospuesto — hacer junto con onboarding contextual)' },
  @{ old = '- [ ] **P3** — Auto-fill datos por matrícula (API DGT)'; new = '- [~] **P3** — Auto-fill datos por matrícula (API DGT) (API DGT cerrada/de pago; alternativas: motor.es API o scraping manual; pospuesto hasta tener acceso)' },
  @{ old = '- [ ] **P3** — Modo offline para favoritos y búsquedas guardadas'; new = '- [~] **P3** — Modo offline para favoritos y búsquedas guardadas (requiere Service Worker + IndexedDB cache; pospuesto hasta tener app PWA instalada por usuarios)' },
  @{ old = '- [ ] **P3** — Financiación integrada: simulador con ofertas de partners'; new = '- [~] **P3** — Financiación integrada: simulador con ofertas de partners (requiere acuerdos comerciales con financieras; pospuesto — la calculadora básica ya existe)' },
  @{ old = '- [ ] **P3** — Schema separation: tablas compartidas (users, dealers, payments) vs vertical-specific'; new = '- [~] **P3** — Schema separation: tablas compartidas (users, dealers, payments) vs vertical-specific (refactor arquitectural mayor; pospuesto hasta tener 2+ verticales en producción)' },
  @{ old = '- [ ] **P3** — Setup automático de CF Pages project para nueva vertical'; new = '- [~] **P3** — Setup automático de CF Pages project para nueva vertical (requiere CF API + Workers para automatizar; pospuesto — crear-vertical.mjs manual es suficiente ahora)' },
  @{ old = '- [ ] **P3** — Setup automático de dominio DNS en Cloudflare'; new = '- [~] **P3** — Setup automático de dominio DNS en Cloudflare (requiere CF DNS API + registro de dominio automation; pospuesto hasta 2ª vertical)' },
  @{ old = '- [ ] **P3** — Preview deployments por vertical para QA'; new = '- [~] **P3** — Preview deployments por vertical para QA (CF Pages ya hace preview de PRs; pospuesto — activar cuando haya 2+ verticales con QA formal)' },
  @{ old = '- [ ] **P3** — Test de creación de vertical end-to-end (script → DB → deploy → smoke)'; new = '- [~] **P3** — Test de creación de vertical end-to-end (script → DB → deploy → smoke) (requiere mock de CF/Supabase deploy en CI; pospuesto hasta 2ª vertical)' },
  @{ old = '- [ ] **P3** — Snapshot tests de UI por vertical (verificar temas aplicados)'; new = '- [~] **P3** — Snapshot tests de UI por vertical (verificar temas aplicados) (requiere visual regression framework + fixture de tema; pospuesto hasta 2ª vertical)' },
  @{ old = '- [ ] **P3** — Pure functions en archivos `.helpers.ts` — testables sin mocks'; new = '- [~] **P3** — Pure functions en archivos `.helpers.ts` — testables sin mocks (buildSliderRange implementada en createFilters.ts; extracción sistemática del resto pospuesta)' },
  @{ old = '- [ ] **P3** — Service layer con interfaces: `INotificationService`, `IStorageService` — dependency injection'; new = '- [~] **P3** — Service layer con interfaces: `INotificationService`, `IStorageService` — dependency injection (refactor mayor de server/services/; pospuesto hasta necesitar DI testing)' },
  @{ old = '- [ ] **P3** — Event sourcing para acciones críticas (payments, auctions, status changes)'; new = '- [~] **P3** — Event sourcing para acciones críticas (payments, auctions, status changes) (cambio arquitectural mayor; admin_audit_log cubre el 80% del caso; pospuesto)' },
  @{ old = '- [ ] **P3** — Dead letter queue para eventos que fallan'; new = '- [~] **P3** — Dead letter queue para eventos que fallan (requiere queue broker: BullMQ/CloudTasks; pospuesto — jobQueue.ts + circuit breaker cubren el caso básico)' },
  @{ old = '- [ ] **P3** — Composables y componentes sin side effects en import (lazy initialization)'; new = '- [~] **P3** — Composables y componentes sin side effects en import (lazy initialization) (auditoría manual; pospuesto — hacer como parte de revisión de rendimiento reactivo)' },
  @{ old = '- [ ] **P3** — Partitioning de tablas grandes: `vehicles` por `vertical`, `market_data` por `month`'; new = '- [~] **P3** — Partitioning de tablas grandes: `vehicles` por `vertical`, `market_data` por `month` (requiere migración destructiva; pospuesto hasta tener >500k rows)' },
  @{ old = '- [ ] **P3** — Supabase Edge Functions para webhooks/cron que no necesitan Nuxt server'; new = '- [~] **P3** — Supabase Edge Functions para webhooks/cron que no necesitan Nuxt server (Nuxt server routes funcionan bien; migrar solo si hay cold start problems en producción)' },
  @{ old = '- [ ] **P3** — CF Durable Objects para estado compartido (rate limiting, counters, auction state)'; new = '- [~] **P3** — CF Durable Objects para estado compartido (rate limiting, counters, auction state) (requiere CF Workers Paid plan; pospuesto hasta tener contención en auction bids)' },
  @{ old = '- [ ] **P3** — CF D1 como cache edge database'; new = '- [~] **P3** — CF D1 como cache edge database (CF D1 en GA; pospuesto hasta que cfCache.ts no sea suficiente o necesitemos SQL edge)' },
  @{ old = '- [ ] **P3** — Load testing mensual con k6 (configurado, establecer cadencia)'; new = '- [~] **P3** — Load testing mensual con k6 (configurado, establecer cadencia) (k6 tests existen; añadir calendar reminder para ejecución mensual antes de cada release)' }
)

$replaced = 0
foreach ($item in $deferredItems) {
  if ($content.Contains($item.old)) {
    $content = $content.Replace($item.old, $item.new)
    $replaced++
    Write-Host "DEFERRED [~]: $($item.old.Substring(0, [Math]::Min(70, $item.old.Length)))"
  } else {
    Write-Host "NOT FOUND: $($item.old.Substring(0, [Math]::Min(70, $item.old.Length)))"
  }
}

$after = ([regex]::Matches($content, '\- \[ \] \*\*P3\*\*')).Count
Write-Host ""
Write-Host "Replaced: $replaced items"
Write-Host "Remaining [ ] P3 items after: $after"

Set-Content $file $content -Encoding UTF8 -NoNewline
Write-Host "Done."

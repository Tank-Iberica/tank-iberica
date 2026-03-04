# Brokeraje Inteligente — Arquitectura Técnica

> **Propósito:** Diseño técnico completo del sistema de intermediación automatizada con IA.
> **Referencia de negocio:** `ESTRATEGIA-NEGOCIO.md` §2.13
> **Fecha:** 4 de marzo de 2026
> **Principio rector:** Diseñado para ser **auditable y defendible** ante AEPD/regulador. Transparencia de entidad, trazabilidad completa, base jurídica explícita, derecho de oposición efectivo.

---

## 1. Principios de diseño legal

### 1.1 Transparencia de entidad

Cada comunicación identifica **claramente** quién contacta. Regla uniforme según tipo de relación:

| Relación                                               | Identificación mínima              | CIF requerido                         |
| ------------------------------------------------------ | ---------------------------------- | ------------------------------------- |
| Tracciona → C (comprador, relación de servicio formal) | Nombre + CIF de Tracciona          | ✔️ Sí — es prestador de servicio      |
| Tracciona → V (vendedor, intermediación como broker)   | Nombre de empresa ("Tracciona")    | ✖️ No — contacto natural de comprador |
| Tank Ibérica → V (vendedor, compra directa)            | Nombre de empresa ("Tank Ibérica") | ✖️ No — contacto natural de comprador |

- Nunca se envía un mensaje sin identificar la empresa remitente
- Nunca se simula ser un particular o un bot anónimo
- El CIF solo aplica a comunicaciones con C (relación contractual de servicio). Para contactos con V (comprador/intermediario sobre anuncio público), el nombre de empresa es suficiente — coherente con la postura §1.4.

### 1.2 Base jurídica (RGPD art. 6) y responsabilidad

**Responsabilidad por tramo — NO co-responsabilidad por defecto:**

Tracciona y Tank Ibérica son **responsables independientes** en la mayoría de tramos. Solo se aplica art. 26 (co-responsables) donde ambas entidades deciden conjuntamente fines y medios del tratamiento.

| Tramo                         | Responsable          | Decide fines/medios                             | Relación RGPD                               |
| ----------------------------- | -------------------- | ----------------------------------------------- | ------------------------------------------- |
| Precalificación de C          | **Tracciona**        | Tracciona decide qué datos recoge y cómo puntúa | Responsable independiente                   |
| Transferencia de datos C→Tank | **Tracciona→Tank**   | Ambas deciden que se comparta                   | **Co-responsables (art. 26)** — único tramo |
| Negociación con V             | **Tank Ibérica**     | Tank decide cómo y cuándo contacta              | Responsable independiente                   |
| Compraventa Tank↔V            | **Tank Ibérica**     | Tank decide como comprador                      | Responsable independiente                   |
| Compraventa Tank↔C            | **Tank Ibérica**     | Tank decide como vendedor                       | Responsable independiente                   |
| Audit log / compliance        | **Cada una la suya** | Cada empresa sus propios logs                   | Responsables independientes                 |

**Acuerdo art. 26:** Solo se formaliza para el tramo de transferencia de datos del comprador. En el resto, cada empresa opera como responsable con su propia base jurídica.

> **⚠️ Pendiente validación legal:** Revisar con abogado especialista si el tramo C→Tank realmente requiere art. 26 (co-responsabilidad) o si basta con responsables independientes + transferencia informada con consentimiento. La diferencia práctica: art. 26 exige acuerdo formal publicado y ventanilla única para interesados; responsables independientes solo exige información + consentimiento informado. **Criterio legal escrito obligatorio antes de implementar.**

**Base jurídica por tratamiento:**

| Tratamiento                                            | Base jurídica                                                                                                       | Artículo                                          |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| Tracciona precalifica a C                              | **Ejecución contractual** — C usa el servicio de marketplace                                                        | Art. 6.1.b                                        |
| Tracciona comparte datos de C con Tank Ibérica SL      | **Consentimiento explícito** — C acepta compartir con Tank Ibérica SL (identificada por nombre y CIF)               | Art. 6.1.a                                        |
| Tank Ibérica contacta a V (servicio activo)            | **Interés legítimo** — contacto como comprador directo sobre anuncio público (teléfono de V publicado en Tracciona) | Art. 6.1.f                                        |
| Tank Ibérica contacta a V (servicio desactivado)       | **Interés legítimo** — contacto como comprador legítimo de la plataforma                                            | Art. 6.1.f                                        |
| Logs de deals cerrados (facturas, contabilidad)        | **Obligación legal** — Código de Comercio art. 30 (6 años)                                                          | Art. 6.1.c                                        |
| Logs de negociación (mensajes, scoring, decisiones IA) | **Interés legítimo** — defensa jurídica y mejora del servicio                                                       | Art. 6.1.f                                        |
| Logs de deals no cerrados                              | **Ejecución contractual** — servicio solicitado por C                                                               | Art. 6.1.b (mientras dure) → eliminación post-30d |

### 1.3 Derecho de oposición

- **Vendedor:** Toggle en perfil (`dealers.brokerage_opt_out`). Efecto inmediato. Registrado en `brokerage_consent_log`.
- **Comprador:** Puede abandonar la prenegociación en cualquier momento. Datos eliminados del deal si no hay transacción.
- **Ambos:** Derecho de acceso a sus datos de negociación vía ARCO/ARSULPD (solicitud al DPO).

### 1.4 Contacto a vendedores — Naturaleza jurídica

Dos entidades pueden contactar al vendedor, con la misma naturaleza jurídica en ambos casos:

**Tracciona (fase broker):** Actúa como intermediario que facilita la transacción entre C y V, cobrando comisión sobre el precio acordado. Contacta a V para proponerle un comprador interesado.

**Tank Ibérica (fase tank, fallback):** Actúa como comprador directo que quiere adquirir la unidad para su actividad de compraventa.

**En ambos casos, el contacto NO es prospección comercial sistemática** (LSSI arts. 20-21):

- El teléfono de V está **publicado en Tracciona.com** por el propio V para recibir contactos de compradores
- El contacto es **selectivo** — solo ocurre cuando hay un comprador real filtrado por scoring
- Tracciona facilita una venta de V (no le vende nada). Tank compra a V (es su cliente)
- El contacto es **puntual por anuncio específico**, no campaña masiva

No aplica identificación formal LSSI. Ambas entidades contactan de forma natural.

> **Pendiente validación legal:** Confirmar con abogado la posición adoptada (ver §12). Una posición, un criterio, reflejado consistentemente en todo el doc.

- **Opt-out respetado:** Si V indica que no quiere este tipo de contactos, se registra y no se le vuelve a contactar.
- **Lista de supresión:** `brokerage_suppression_list` — vendedores que han pedido no ser contactados. Se consulta antes de cada contacto.
- **Cooldown por vendedor:** 14 días entre contactos para el mismo vendedor (operativo, no legal).
- **Cadencia máxima:** Máximo 2 contactos por vendedor por trimestre (operativo).
- **Recordatorio único:** Si V no responde en 48h, un recordatorio. Si no responde en 96h, deal expirado.

### 1.5 Audit trail completo

Cada acción del sistema queda registrada en `brokerage_audit_log` con:

- Timestamp UTC
- Actor (sistema, IA-tracciona, IA-tank, humano)
- Acción (contact_buyer, contact_seller, qualify, negotiate, escalate, opt_out, etc.)
- Base jurídica aplicada
- Canal (whatsapp, email, plataforma)
- Deal ID de referencia
- **Auditoría IA:** `model_version` (qué modelo generó la acción), `prompt_version` (versión del system prompt), `human_override` (si un humano corrigió la decisión), `override_reason` (motivo). Estos campos son esenciales para investigar incidentes y demostrar supervisión humana ante regulador.

---

## 2. Modelo de datos

### 2.1 Tablas nuevas

```sql
-- ══════════════════════════════════════════════
-- BROKERAGE DEALS — Operación de intermediación
-- ══════════════════════════════════════════════
CREATE TABLE brokerage_deals (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Parte compradora
  buyer_id        UUID REFERENCES users(id),           -- C registrado en Tracciona
  buyer_phone     TEXT,                                 -- WhatsApp de C
  buyer_budget_min NUMERIC(12,2),                      -- Presupuesto declarado min
  buyer_budget_max NUMERIC(12,2),                      -- Presupuesto declarado max
  buyer_score     SMALLINT CHECK (buyer_score BETWEEN 0 AND 100),
  buyer_needs     JSONB DEFAULT '{}',                  -- Requisitos (marca, modelo, km, año, etc.)
  buyer_financing BOOLEAN DEFAULT FALSE,
  -- Parte vendedora
  vehicle_id      UUID REFERENCES vehicles(id),        -- Unidad objetivo en Tracciona
  seller_id       UUID REFERENCES users(id),           -- User dueño de la unidad (FK explícita)
  seller_dealer_id UUID REFERENCES dealers(id),        -- Dealer asociado (si V es dealer)
  seller_phone    TEXT,                                 -- WhatsApp de V
  -- Modo del deal (determina qué entidad contacta al vendedor)
  deal_mode       TEXT NOT NULL DEFAULT 'broker'
                  CHECK (deal_mode IN (
                    'broker',    -- Tracciona actúa como intermediario, cobra comisión
                    'tank'       -- Tank Ibérica compra a V y revende a C (tras fallo de broker)
                  )),
  -- Negociación
  asking_price      NUMERIC(12,2),                     -- Precio publicado por V
  offer_price       NUMERIC(12,2),                     -- Precio ofrecido (Tracciona en broker / Tank en tank)
  agreed_buy_price  NUMERIC(12,2),                     -- Precio acordado de compra (Tank←V, solo en modo tank)
  agreed_deal_price NUMERIC(12,2),                     -- Precio acordado C↔V (solo en modo broker)
  target_sell_price NUMERIC(12,2),                     -- Precio objetivo de venta (Tank→C, solo en modo tank)
  margin_amount     NUMERIC(12,2),                     -- Margen bruto (buy/resell) o comisión (broker)
  margin_pct        NUMERIC(5,2),                      -- Margen % sobre precio
  min_margin_threshold NUMERIC(12,2),                  -- Umbral Z vigente para este deal
  -- Comisión de brokeraje (solo deal_mode = 'broker')
  broker_commission     NUMERIC(12,2),                 -- Comisión cobrada por Tracciona
  broker_commission_pct NUMERIC(5,2),                  -- Comisión como % del precio de venta
  -- Estado
  status          TEXT NOT NULL DEFAULT 'qualifying_buyer'
                  CHECK (status IN (
                    'qualifying_buyer',          -- Agente T precalificando a C
                    'manual_review',              -- Score 50-69: humano revisa antes de avanzar
                    'buyer_qualified',            -- C pasó precalificación + pagó Reserva de Búsqueda
                    -- FASE BROKER (Tracciona → Vendedor)
                    'contacting_seller_broker',   -- Agente B (Tracciona) contacta a V
                    'broker_negotiating',         -- V responde, Agente B negocia comisión/precio
                    'broker_failed',              -- Broker no logró acuerdo → habilita fase Tank
                    -- FASE TANK (Tank Ibérica → Vendedor, fallback)
                    'contacting_seller_tank',     -- Agente I (Tank) contacta a V como comprador
                    'negotiating_seller',         -- Agente I negociando precio de compra con V
                    'seller_declined',            -- V rechazó en fase tank
                    'no_margin',                  -- Margen < Z en fase tank, deal inviable
                    -- CIERRE
                    'pending_buyer_confirm',      -- Agente T dice a C: "Tenemos una unidad..."
                    'escalated_to_humans',        -- Humanos de Tank notificados
                    'human_takeover',             -- Humano gestiona cierre
                    'deal_closed',                -- Compraventa cerrada
                    'deal_cancelled',             -- Cancelado por cualquier parte
                    'expired'                     -- Timeout sin actividad
                  )),
  -- Lock: mientras está en fase broker, Tank no puede contactar a V
  broker_lock_until  TIMESTAMPTZ,                      -- Tank no contacta hasta esta fecha
  -- Metadatos
  legal_basis_buyer  TEXT DEFAULT 'consent_art6_1a',
  legal_basis_seller TEXT DEFAULT 'legitimate_interest_art6_1f',
  escalation_reason  TEXT,
  human_assignee     TEXT,
  -- Timestamps
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  qualified_at         TIMESTAMPTZ,
  broker_contacted_at  TIMESTAMPTZ,                    -- Cuando Tracciona contactó a V (fase broker)
  broker_failed_at     TIMESTAMPTZ,                    -- Cuando se declaró broker_failed
  tank_contacted_at    TIMESTAMPTZ,                    -- Cuando Tank contactó a V (fase tank)
  seller_responded_at  TIMESTAMPTZ,
  escalated_at         TIMESTAMPTZ,
  closed_at            TIMESTAMPTZ,
  expires_at           TIMESTAMPTZ,
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_brokerage_deals_status ON brokerage_deals(status);
CREATE INDEX idx_brokerage_deals_buyer ON brokerage_deals(buyer_id);
CREATE INDEX idx_brokerage_deals_vehicle ON brokerage_deals(vehicle_id);
CREATE INDEX idx_brokerage_deals_seller ON brokerage_deals(seller_id);
CREATE INDEX idx_brokerage_deals_seller_dealer ON brokerage_deals(seller_dealer_id);

-- ══════════════════════════════════════════════
-- BROKERAGE MESSAGES — Historial de conversación
-- ══════════════════════════════════════════════
CREATE TABLE brokerage_messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id         UUID NOT NULL REFERENCES brokerage_deals(id) ON DELETE CASCADE,
  direction       TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  channel         TEXT NOT NULL CHECK (channel IN ('whatsapp', 'email', 'platform', 'phone')),
  sender_entity   TEXT NOT NULL CHECK (sender_entity IN (
                    'tracciona_ai',         -- Agente T: Tracciona hablando con C
                    'tracciona_ai_broker',  -- Agente B: Tracciona hablando con V como broker
                    'tank_ai',              -- Agente I: Tank hablando con V como comprador
                    'tank_human',           -- Humano de Tank
                    'buyer',                -- C responde
                    'seller',               -- V responde
                    'system'                -- Mensajes automáticos (timeouts, alertas)
                  )),
  recipient_entity TEXT NOT NULL CHECK (recipient_entity IN (
                    'buyer', 'seller', 'tank_human', 'system'
                  )),
  content         TEXT NOT NULL,                       -- Contenido del mensaje
  content_hash    TEXT,                                -- Hash para deduplicación
  metadata        JSONB DEFAULT '{}',                  -- Datos extra (sentiment, intent, etc.)
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_brokerage_messages_deal ON brokerage_messages(deal_id, created_at);

-- ══════════════════════════════════════════════
-- BROKERAGE AUDIT LOG — Trazabilidad completa
-- ══════════════════════════════════════════════
CREATE TABLE brokerage_audit_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id         UUID REFERENCES brokerage_deals(id),
  actor           TEXT NOT NULL,                       -- 'tracciona_ai', 'tank_ai', 'tank_human:nombre', 'system', 'buyer', 'seller'
  action          TEXT NOT NULL,                       -- Acción realizada
  legal_basis     TEXT,                                -- Base jurídica aplicada
  -- Auditoría de IA (trazabilidad de decisiones automatizadas)
  model_version   TEXT,                                -- Ej: 'claude-sonnet-4-6', 'claude-haiku-4-5'
  prompt_version  TEXT,                                -- Ej: 'agent-t-v1.2', 'agent-i-v2.0' (versionado de system prompts)
  human_override  BOOLEAN DEFAULT FALSE,               -- TRUE si un humano corrigió/anuló la decisión de la IA
  override_reason TEXT,                                -- Motivo de la corrección humana
  details         JSONB DEFAULT '{}',                  -- Detalles de la acción
  ip_address      INET,                                -- IP del actor si aplica
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_brokerage_audit_deal ON brokerage_audit_log(deal_id, created_at);
CREATE INDEX idx_brokerage_audit_action ON brokerage_audit_log(action);

-- ══════════════════════════════════════════════
-- BROKERAGE CONSENT LOG — Registro de consentimientos
-- ══════════════════════════════════════════════
CREATE TABLE brokerage_consent_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id),
  consent_type    TEXT NOT NULL CHECK (consent_type IN (
                    'buyer_data_sharing',              -- C acepta compartir datos con Tank Ibérica SL
                    'seller_brokerage_optout',          -- V desactiva servicio de ofertas
                    'seller_brokerage_optin',           -- V reactiva servicio de ofertas
                    'buyer_prenegotiation_start',       -- C inicia prenegociación
                    'buyer_prenegotiation_withdraw'     -- C abandona prenegociación
                  )),
  granted         BOOLEAN NOT NULL,                    -- TRUE = concedido, FALSE = retirado
  legal_basis     TEXT NOT NULL,
  channel         TEXT NOT NULL,                       -- Dónde se recogió (whatsapp, web, etc.)
  evidence        JSONB DEFAULT '{}',                  -- Mensaje exacto mostrado, respuesta de C/V
  ip_address      INET,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_brokerage_consent_user ON brokerage_consent_log(user_id, consent_type);

-- ══════════════════════════════════════════════
-- BROKERAGE SUPPRESSION LIST — Cooldown y supresión por canal (LSSI)
-- ══════════════════════════════════════════════
CREATE TABLE brokerage_suppression_list (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id             UUID NOT NULL REFERENCES users(id),
  channel               TEXT NOT NULL CHECK (channel IN ('whatsapp', 'email', 'phone')),
  suppressed            BOOLEAN DEFAULT FALSE,           -- TRUE = no contactar por este canal
  suppressed_at         TIMESTAMPTZ,                     -- Cuándo se suprimió
  suppression_reason    TEXT,                             -- 'opt_out', 'no_response_repeated', 'manual'
  last_contacted_at     TIMESTAMPTZ,                     -- Última vez que se le contactó
  cooldown_until        TIMESTAMPTZ,                     -- No contactar antes de esta fecha
  contacts_this_quarter SMALLINT DEFAULT 0,              -- Contactos en el trimestre actual (máx 2)
  quarter_reset_at      TIMESTAMPTZ,                     -- Cuándo se reseteó el contador trimestral
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (seller_id, channel)
);

CREATE INDEX idx_brokerage_suppression_seller ON brokerage_suppression_list(seller_id);
CREATE INDEX idx_brokerage_suppression_cooldown ON brokerage_suppression_list(cooldown_until)
  WHERE suppressed = FALSE;
```

### 2.2 Columna nueva en `dealers`

```sql
ALTER TABLE dealers
  ADD COLUMN brokerage_opt_out BOOLEAN DEFAULT FALSE,
  ADD COLUMN brokerage_opt_out_at TIMESTAMPTZ;

COMMENT ON COLUMN dealers.brokerage_opt_out IS
  'TRUE = dealer no quiere recibir ofertas automáticas de compra vía el servicio de brokeraje';
```

### 2.3 Diagrama de relaciones

```
brokerage_deals ─── vehicle_id ─────→ vehicles
                ─── buyer_id ───────→ users
                ─── seller_id ──────→ users (FK)
                ─── seller_dealer_id → dealers (FK, nullable)
                │
                ├──< brokerage_messages (historial de conversación)
                ├──< brokerage_audit_log (trazabilidad)
                ├──< brokerage_consent_log (consentimientos)
                └──< brokerage_suppression_list (supresión por canal)
```

---

## 3. Máquina de estados

El sistema intenta **broker primero** (Tracciona intermediario). Si falla, **Tank como comprador** (fallback). Si Tank también falla, el deal se cancela.

```
                    ┌─────────────────────┐
                    │  qualifying_buyer   │ ← Agente T precalifica a C vía WhatsApp
                    └─────────┬───────────┘
                              │
               ┌──────────────┼──────────────┐
               │ <50          │ 50-69        │ ≥70
               │              │              │
          (rechazado)  ┌──────▼───────┐      │
                       │ manual_review │      │
                       └──────┬───────┘      │
                              │ humano OK    │
                    ┌─────────▼──────────────▼┐
                    │    buyer_qualified      │ ← C consume créditos (Reserva de Búsqueda)
                    └─────────┬───────────────┘
                              │ V no tiene opt-out
                              │
              ══════════ FASE BROKER ══════════
                              │
                    ┌─────────▼─────────────────┐
                    │ contacting_seller_broker  │ ← Agente B (Tracciona) contacta a V
                    │  [lock 72h: Tank no entra]│   como intermediario
                    └─────────┬─────────────────┘
                              │ V responde
                    ┌─────────▼─────────────────┐
             ┌─NO───│   broker_negotiating      │
             │      └─────────┬─────────────────┘
             │                │ acuerdo (V acepta precio C)
    ┌────────▼──────┐         │
    │ broker_failed │    ┌────▼──────────────────┐
    │(V no acepta,  │    │ pending_buyer_confirm  │
    │timeout,o sin  │    └────┬──────────────────┘
    │margen broker) │         │ C confirma
    └────────┬──────┘         │ → escalated_to_humans
             │                │ → human_takeover → deal_closed
             │
             ║ FASE TANK (fallback tras broker_failed)
             ║ [espera a que expire broker_lock_until]
             │
                    ┌─────────▼─────────────────┐
                    │ contacting_seller_tank    │ ← Agente I (Tank Ibérica) contacta a V
                    └─────────┬─────────────────┘   como comprador independiente
                              │ V responde
                    ┌─────────▼─────────────────┐
             ┌─NO───│   negotiating_seller      │───timeout─┐
             │      └─────────┬─────────────────┘           │
             │                │ acuerdo (V vende a Tank)     │
    ┌────────▼──────┐    ┌────▼──────────────────┐   ┌──────▼──────┐
    │seller_declined│    │ pending_buyer_confirm  │   │   expired   │
    │  / no_margin  │    └────┬──────────────────┘   └─────────────┘
    └───────────────┘         │ C confirma
         ↓                    │
    deal_cancelled    escalated_to_humans → human_takeover → deal_closed
```

**Reglas de transición broker → tank:**

- `broker_failed` → esperar `broker_lock_until` (72h desde primer contacto de Tracciona a V)
- Solo entonces se habilita `contacting_seller_tank`
- **Cap de intentos:** 1 ciclo broker + 1 ciclo tank por anuncio. Si ambos fallan → `deal_cancelled` + cooldown al vendedor

Cualquier estado puede transicionar a `deal_cancelled` si alguna parte se retira.

---

## 4. Flujo de WhatsApp — Tres agentes IA

| Agente | Entidad      | Interlocutor  | Fase                          |
| ------ | ------------ | ------------- | ----------------------------- |
| **T**  | Tracciona    | Comprador (C) | Precalificación + seguimiento |
| **B**  | Tracciona    | Vendedor (V)  | Fase broker (primero)         |
| **I**  | Tank Ibérica | Vendedor (V)  | Fase tank (fallback)          |

### 4.1 Agente T (Tracciona ↔ Comprador)

**Número de WhatsApp:** El de Tracciona
**Se identifica como:** "Tracciona — Marketplace de Vehículos Industriales"
**Propósito:** Precalificar y acompañar a C

#### Trigger de activación

C está navegando Tracciona y muestra interés alto en una unidad:

- Ha visto la ficha >2 veces
- Ha añadido a favoritos
- Ha iniciado chat con el vendedor
- Ha solicitado financiación

**Mensaje inicial (ejemplo):**

> Hola, soy un asistente virtual automático de Tracciona. Hemos visto que te interesa un [categoría] similar al que estás viendo. ¿Te gustaría que busquemos opciones en tu rango de precio? Sin compromiso.
>
> Tracciona.com — CIF: [CIF Tracciona]
> _Este mensaje ha sido generado automáticamente._

#### Flujo de precalificación

1. **Presupuesto:** "¿Qué rango de precio manejas para este tipo de vehículo?"
2. **Financiación:** "¿Necesitarías financiación o compra al contado?"
3. **Urgencia:** "¿Para cuándo lo necesitas aproximadamente?"
4. **Ubicación:** "¿Dónde estás ubicado? Podemos valorar transporte si la unidad está lejos."
5. **Scoring interno** (no visible para C)

**Consentimiento explícito antes de avanzar — Versión congelada `consent_text_v1`:**

> **⚠️ Texto congelado:** Este texto NO se puede modificar sin revisión legal previa. Cualquier cambio requiere: (1) nueva versión, (2) aprobación escrita del abogado, (3) actualización del campo `consent_version` en código.

**Fase broker (primer intento — Tracciona intermediario):**

> Hemos encontrado una unidad que encaja con lo que buscas. Tracciona puede gestionar la intermediación directamente: contactamos al vendedor, facilitamos el acuerdo y te lo cerramos. Tracciona cobra una comisión de [X%] sobre el precio final, pagada por ti al cerrar. ¿Quieres que lo gestionemos?
>
> Puedes cancelar en cualquier momento escribiendo CANCELAR.

**Fase tank (fallback — si broker no prospera):** Si Tracciona no logra cerrar la intermediación, se activa un segundo consentimiento:

> No hemos podido cerrar el acuerdo directamente con el vendedor. Podemos intentarlo de otra forma: **Tank Ibérica SL** (CIF: [CIF Tank], empresa de compraventa con sede en León) compraría el vehículo al vendedor y te lo vendería a ti al precio acordado. ¿Autorizas que compartamos tus datos con Tank Ibérica SL para este fin?
>
> Puedes retirar este consentimiento escribiendo CANCELAR.

**Nota:** En la fase broker no se comparten datos de C con Tank. El consentimiento de datos con Tank solo se activa si broker falla y C acepta el fallback.

**Solo si C responde SÍ** → se registra en `brokerage_consent_log` con:

- `consent_type = 'buyer_data_sharing'`
- `consent_version = 'consent_text_v1'` ← **campo obligatorio, vincula al texto exacto**
- `evidence = { mensaje_mostrado: "[texto exacto enviado]", respuesta_literal: "[texto exacto de C]", timestamp, channel }`

```sql
-- Campos de versión y hash en consent_log
ALTER TABLE brokerage_consent_log ADD COLUMN IF NOT EXISTS
  consent_version TEXT NOT NULL DEFAULT 'consent_text_v1';

ALTER TABLE brokerage_consent_log ADD COLUMN IF NOT EXISTS
  consent_text_hash TEXT;  -- SHA-256 del texto exacto mostrado al usuario

-- El hash se calcula en el servidor antes de insertar:
-- consent_text_hash = crypto.createHash('sha256').update(textoMostrado).digest('hex')
-- Permite probar en litigio el texto EXACTO que vio el usuario en ese momento,
-- aunque el texto haya cambiado de versión posteriormente.
```

### 4.2 Agente B (Tracciona ↔ Vendedor — fase broker)

**Número de WhatsApp:** El número de Tracciona (`PHONE_NUMBER_ID_TRACCIONA`) — mismo número que Agente T. El routing al agente correcto se hace por contexto del deal, no por número.
**Se identifica como:** Tracciona, de forma natural
**Propósito:** Proponer al vendedor que hay un comprador interesado, facilitar el acuerdo

#### Mensaje inicial (ejemplo)

> Buenas, somos el equipo de Tracciona. Tenemos un comprador interesado en tu [marca modelo año]. ¿El precio publicado es negociable o es firme?

Simple y directo. Tracciona **no negocia precio** — solo verifica si hay encaje con el presupuesto del comprador.

**Puntos clave:**

- No revela el presupuesto exacto de C
- No presiona, no hace contraofertas, no argumenta
- Si V confirma precio → Agente B comprueba si encaja con presupuesto C + comisión
- Si V pregunta "¿quién es el comprador?" → "Un comprador registrado en nuestra plataforma, te lo presentamos cuando tengamos precio cerrado"
- Tracciona es el **actor de volumen y match**, no el actor agresivo de precio

#### Flujo broker

1. V responde precio → sistema comprueba si `precio_V + comision ≤ presupuesto_C`
2. Si encaja → acuerdo → `pending_buyer_confirm` (Tracciona cobra comisión, C compra a V)
3. Si no encaja → Agente B cierra limpio: "Entendido, no encaja con el presupuesto ahora mismo. Gracias."
4. → `broker_failed` → lock 72h → fase tank habilitada

**Agente B nunca:** presiona, hace contraofertas, revela presupuesto de C, ni usa argumentos de urgencia o descuento.

#### Manejo del opt-out (igual que Agente I)

Si V responde que no quiere este tipo de contactos:

1. Confirmar y registrar en `brokerage_suppression_list` + `brokerage_consent_log`
2. **No activa la fase tank** — si V ha pedido no ser contactado, Tank tampoco entra

---

### 4.3 Agente I (Tank Ibérica ↔ Vendedor — fase tank, fallback)

**Número de WhatsApp:** El de Tank Ibérica (diferente al de Tracciona)
**Se identifica como:** Tank Ibérica, de forma natural
**Propósito:** Negociar precio de compra con V

#### Mensaje inicial (ejemplo)

> Buenas, soy el asistente automatizado de compras de Tank Ibérica. Hemos visto tu [marca modelo año] en Tracciona y nos interesa. ¿Qué precio haces para venta directa?

"Asistente automatizado" es directo, honesto y natural en B2B industrial. Cumple ya desde hoy con el espíritu del **EU AI Act art. 50 (Reglamento UE 2024/1689)**, obligatorio desde el 2 de agosto de 2026 — sin tener que rehacer flujos ni mensajes cuando entre en vigor.

**Puntos clave:**

- Tono directo y natural, como alguien del sector
- "Asistente de compras" = honesto, no genera rechazo, prepara la obligación de agosto 2026
- Menciona Tracciona (explica cómo llegó al anuncio — da confianza)
- No menciona que hay un C esperando — Tank Ibérica compra para su actividad (verdad)
- Sin footers legales, sin CIF, sin disclaimers

#### Propuesta de valor de Tank hacia el vendedor

Tank no solo negocia precio — tiene argumentos reales para que V prefiera vender a Tank sobre esperar un comprador particular:

| Argumento       | Mensaje natural                                                    |
| --------------- | ------------------------------------------------------------------ |
| **Velocidad**   | "Cerramos esta semana, sin esperas"                                |
| **Certidumbre** | "Somos compradores firmes, no nos caemos"                          |
| **Sin trabajo** | "Nos ocupamos del papeleo y la transferencia"                      |
| **Sin visitas** | "No tendrás que recibir a desconocidos ni hacer demos"             |
| **Liquidez**    | "Si necesitas el dinero pronto, esto es lo más rápido del mercado" |

El Agente I usa estos argumentos cuando V duda o pide un precio más alto. No son presión — son ventajas reales del modelo de compra directa.

#### Flujo de negociación

1. V responde precio → I evalúa margen
2. Si margen ≥ Z → I confirma interés, pide datos para documentación
3. Si margen < Z → I puede contraofertar **una vez** (máx), o usar propuesta de valor para justificar el precio
4. Si V no cede → deal inviable, cierre educado
5. Si V pregunta "¿por qué compráis?" → "Renovamos stock para nuestra actividad de compraventa" (verdad)
6. Si V no responde en 48h → recordatorio único. Si no responde en 96h → deal expirado.

#### Manejo del opt-out

Si V responde "NO OFERTAS" o similar:

1. Confirmar: "Entendido. Hemos desactivado las ofertas de compra para tu cuenta. Puedes reactivarlas en tu perfil de Tracciona cuando quieras."
2. Actualizar `dealers.brokerage_opt_out = TRUE`
3. Registrar en `brokerage_consent_log` con `consent_type = 'seller_brokerage_optout'`
4. Registrar en `brokerage_audit_log`

### 4.4 Coordinación Broker → Tank (5 reglas operativas)

> **Principio:** Broker primero (Tracciona intermediario), Tank después (comprador fallback). Nunca los dos a la vez sobre el mismo anuncio.

| #                                 | Regla                                                                                              | Implementación                                                                                                      |
| --------------------------------- | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| **1. Exclusión por anuncio**      | Mientras un anuncio está en fase broker, Tank no puede contactar a V                               | `broker_lock_until = broker_contacted_at + 72h`. Agente I consulta este campo antes de contactar.                   |
| **2. Trigger de handoff**         | Si broker no logra acuerdo en ventana definida → `broker_failed` → habilita Tank                   | Timeout de `broker_negotiating`: 5 días. Al expirar → `broker_failed` automático.                                   |
| **3. Trazabilidad completa**      | Cada contacto queda registrado con quién, cuándo y por qué cambió de vía                           | `brokerage_audit_log`: `action = 'broker_contacted'`, `action = 'broker_failed'`, `action = 'tank_contacted'`, etc. |
| **4. Mensaje limpio al vendedor** | Si Tank entra tras broker, entra como comprador independiente, sin referencias al intento anterior | Agente I no menciona que Tracciona ya habló con V. Contacto fresco, natural.                                        |
| **5. Cap de intentos**            | 1 ciclo broker + 1 ciclo tank por anuncio. Luego cooldown                                          | Si ambos fallan → `deal_cancelled` + cooldown 30 días en `brokerage_suppression_list` para ese vendedor.            |

**Caso especial — opt-out de V en fase broker:** Si V pide no ser contactado durante la fase broker, **Tank no entra**. El opt-out es hacia el sistema completo, no solo hacia Tracciona.

---

## 5. Lógica de margen

El sistema tiene dos tipos de margen según el `deal_mode`:

### 5.0 Dos modelos económicos

| Modo                                | Cómo funciona                                                                             | Quién cobra                      |
| ----------------------------------- | ----------------------------------------------------------------------------------------- | -------------------------------- |
| **Broker** (`deal_mode = 'broker'`) | Tracciona facilita que C compre directamente a V. Cobra comisión sobre el precio cerrado. | Tracciona (comisión)             |
| **Tank** (`deal_mode = 'tank'`)     | Tank compra a V y revende a C con margen.                                                 | Tank Ibérica (margen buy/resell) |

### 5.1 Cálculo — Modo broker (comisión Tracciona)

```
precio_publicado_V = asking_price
presupuesto_C = buyer_budget_max
comision_tracciona = precio_publicado_V × comision_pct (ej. 3-5%)
precio_viable_para_C = presupuesto_C ≥ precio_publicado_V + comision_tracciona

SI precio_viable_para_C → intentar negociar V a la baja para mejorar margen de C
SI NO viable → broker_failed (sin contactar a V)
```

**Umbrales de comisión broker (a validar con datos reales):**

| Franja de precio vehículo | Comisión Tracciona | Quién paga                |
| ------------------------- | ------------------ | ------------------------- |
| < 20.000€                 | 3-5%               | C (sumado al precio de V) |
| 20.000€ - 50.000€         | 2-3%               | C                         |
| 50.000€ - 100.000€        | 1.5-2%             | C                         |
| > 100.000€                | 1-1.5%             | C                         |

### 5.2 Cálculo — Modo tank (buy/resell margin)

```
Z = coste_transporte (si aplica)
  + coste_documental (transferencia, gestoría)
  + coste_financiero (días en stock × coste diario)
  + provision_garantia (% según antigüedad)
  + fee_tracciona (comisión por el match)
  + margen_neto_minimo (beneficio mínimo de Tank Ibérica)
```

**Umbrales Z iniciales (modo tank):**

| Franja de precio vehículo | Margen mín (Z) | Margen % aprox |
| ------------------------- | -------------- | -------------- |
| < 20.000€                 | 1.500€         | ~8-10%         |
| 20.000€ - 50.000€         | 2.500€         | ~5-8%          |
| 50.000€ - 100.000€        | 4.000€         | ~4-6%          |
| > 100.000€                | 5.000€         | ~3-5%          |

### 5.3 Umbral de activación — No contactar a V sin viabilidad mínima

**Antes de iniciar fase broker** (`buyer_qualified` → `contacting_seller_broker`):

```
-- MODO BROKER: ¿puede C comprar a precio de V + comisión Tracciona?
presupuesto_C = buyer_budget_max
precio_publicado = asking_price
comision_tracciona = precio_publicado × comision_pct

SI presupuesto_C ≥ precio_publicado + comision_tracciona → VIABLE BROKER (contactar)
SI presupuesto_C < precio_publicado + comision_tracciona → broker inviable
  → saltar directamente a fase tank si Z tank es viable
```

**Antes de iniciar fase tank** (`broker_failed` → `contacting_seller_tank`):

```
-- MODO TANK: ¿hay margen Z si Tank compra a precio publicado?
-- Buffer 15%: absorbe que V no acepte el primer precio
margen_esperado_bruto = presupuesto_C - asking_price
costes_estimados = transporte + documental + financiero + garantía + fee_tracciona

SI margen_esperado_bruto - costes_estimados ≥ Z × 1.15 → VIABLE TANK (contactar)
SI entre Z y Z×1.15 → REVISIÓN MANUAL
SI < Z → deal descartado (no gastar en WhatsApp)
```

### 5.4 Evaluación post-negociación

**Modo broker** — V acepta precio C directamente:

```
precio_acordado = agreed_deal_price (C paga a V)
comision = precio_acordado × comision_pct
SI precio_acordado ≤ presupuesto_C → VIABLE (avanza a pending_buyer_confirm)
```

**Modo tank** — V acepta precio de compra de Tank:

```
precio_compra_acordado = agreed_buy_price (Tank paga a V)
precio_venta_objetivo = target_sell_price (C paga a Tank)
margen_bruto = precio_venta_objetivo - precio_compra_acordado
costes_estimados = transporte + documental + financiero + garantía + fee

SI margen_bruto - costes_estimados ≥ Z → VIABLE (avanza a pending_buyer_confirm)
SI NO → no_margin (deal cancelado)
```

---

## 6. Escalación a humanos

### 6.1 Trigger de escalación

El sistema pasa a `escalated_to_humans` cuando se cumplen las condiciones del modo activo:

**Modo broker (`deal_mode = 'broker'`):**

1. C ha confirmado que acepta el precio acordado con V
2. V ha confirmado que acepta vender a ese precio directamente a C
3. Comisión de Tracciona viable (`agreed_deal_price + broker_commission ≤ buyer_budget_max`)
   → Humanos de Tracciona/Tank formalizan el cierre: documentación, transferencia, pago de comisión

**Modo tank (`deal_mode = 'tank'`):**

1. C ha confirmado interés real (quiere ver la unidad, dar depósito, o acepta precio)
2. V ha aceptado un precio de venta a Tank Ibérica
3. Margen ≥ Z verificado (`agreed_buy_price` + costes estimados deja margen ≥ Z)
   → Humanos de Tank ejecutan la compra a V y la venta a C

### 6.2 Notificación al equipo Tank

Canal: WhatsApp grupo interno / Email / Dashboard admin

```
🔔 DEAL VIABLE — Requiere intervención humana

Vehículo: DAF XF 480 2019 — 285.000 km
Publicado en Tracciona por: [nombre V] ([provincia])

Compra a V: 42.000€ (acordado vía IA)
Venta a C: 48.500€ (presupuesto confirmado)
Margen bruto: 6.500€ (15.5%)
Costes estimados: 1.800€ (transporte 900€ + docs 400€ + stock 200€ + garantía 300€)
Margen neto estimado: 4.700€

Comprador: [nombre C] — [provincia] — financiación: NO — urgencia: ALTA

Historial de negociación: [link al deal en admin]
Acción requerida: Validar y contactar a ambas partes para cerrar.
```

### 6.3 Dashboard de gestión (admin)

Nueva sección en `/admin/brokeraje` con:

- Lista de deals activos por estado
- Pipeline visual (kanban por estado)
- Detalle de cada deal: historial completo de mensajes, scoring, márgenes
- Acciones: asignar a humano, cerrar deal, cancelar
- Métricas: deals activos, tasa de conversión, margen medio, tiempo medio de cierre
- Log de auditoría filtrable

---

## 7. Seguridad y compliance

### 7.1 RLS (Row Level Security)

```sql
-- Función reutilizable (si no existe ya en el esquema)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT COALESCE(
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin',
    FALSE
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- brokerage_deals: solo admin
ALTER TABLE brokerage_deals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_full_access" ON brokerage_deals
  FOR ALL USING (public.is_admin());

-- brokerage_messages: solo admin
ALTER TABLE brokerage_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_full_access" ON brokerage_messages
  FOR ALL USING (public.is_admin());

-- brokerage_audit_log: solo lectura admin (nunca delete/update)
ALTER TABLE brokerage_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_read_only" ON brokerage_audit_log
  FOR SELECT USING (public.is_admin());

-- brokerage_consent_log: solo lectura admin + el propio usuario
ALTER TABLE brokerage_consent_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_read" ON brokerage_consent_log
  FOR SELECT USING (public.is_admin());

CREATE POLICY "own_consents" ON brokerage_consent_log
  FOR SELECT USING (auth.uid() = user_id);
```

### 7.2 Retención de datos

| Dato                            | Retención                    | Base jurídica          | Motivo                             | Revisión automática                 |
| ------------------------------- | ---------------------------- | ---------------------- | ---------------------------------- | ----------------------------------- |
| Deals cerrados (datos fiscales) | 6 años desde `closed_at`     | Art. 6.1.c             | Código de Comercio art. 30         | `closed_at + 6 años`                |
| Deals cancelados/expirados      | 1 año desde cancelación      | Art. 6.1.f             | Análisis + defensa jurídica        | `updated_at + 1 año`                |
| Mensajes de deals cerrados      | 6 años desde cierre del deal | Art. 6.1.c             | Documentación transacción          | Vinculado al deal                   |
| Mensajes de deals no cerrados   | 30 días post-cancelación     | Art. 6.1.b → supresión | Minimización                       | `deal.updated_at + 30d`             |
| Audit log (deals cerrados)      | 6 años desde cierre del deal | Art. 6.1.c             | Trazabilidad fiscal                | Vinculado al deal                   |
| Audit log (deals no cerrados)   | 1 año desde cancelación      | Art. 6.1.f             | Defensa jurídica                   | `deal.updated_at + 1 año`           |
| Consent log                     | Relación + 5 años            | Art. 6.1.f             | Prescripción LOPD-GDD (art. 72-74) | `última actividad usuario + 5 años` |
| Datos de C si deal no cierra    | 30 días post-cancelación     | —                      | Minimización + derecho supresión   | `deal.updated_at + 30d`             |

**Implementación del borrado automático:** Cron job semanal (`cron/brokerage-data-cleanup`) que:

1. Consulta deals con `closed_at + 6 años < NOW()` o `updated_at + retención < NOW()`
2. Anonimiza datos personales (no borra filas — mantiene métricas agregadas)
3. Registra cada borrado en `brokerage_audit_log` con `action = 'data_retention_cleanup'`

### 7.3 Separación de datos entre empresas

**Principio:** Cada empresa solo ve los datos que necesita. La seguridad se implementa **denegando acceso directo a tablas base** y concediendo solo vistas por entidad. RLS actúa como última línea de defensa, no como primera.

> **⚠️ Diseño defensivo:** Si permites `SELECT` directo sobre tabla base con RLS, un error en la política podría exponer columnas sensibles (márgenes, precios de negociación) a la entidad equivocada. Denegando la tabla base y concediendo solo vistas, limitas la superficie de ataque: aunque RLS falle, la vista ya no expone esas columnas.

**Acceso por empresa:**

| Dato                                   | Tracciona | Tank Ibérica                  |
| -------------------------------------- | --------- | ----------------------------- |
| Datos de C (nombre, teléfono, scoring) | ✔️        | ✔️ (solo tras consentimiento) |
| Datos de V (nombre, teléfono)          | ✖️        | ✔️                            |
| Precios de negociación (offer, agreed) | ✖️        | ✔️                            |
| Márgenes (amount, pct)                 | ✖️        | ✔️                            |
| Estado del deal                        | ✔️        | ✔️                            |
| vehicle_id                             | ✔️        | ✔️                            |
| Mensajes Agente T ↔ C                  | ✔️        | ✖️                            |
| Mensajes Agente I ↔ V                  | ✖️        | ✔️                            |

**Implementación técnica — Deny tabla base, Grant solo vistas:**

```sql
-- ═══════════════════════════════════════════════════════
-- PASO 1: Funciones helper (ya definidas en §2)
-- ═══════════════════════════════════════════════════════

-- Claims en app_metadata del usuario admin/service:
-- Tracciona admin: { "role": "admin", "entity": "tracciona" }
-- Tank admin:      { "role": "admin", "entity": "tank" }
-- Service role:    acceso completo (solo server-side)

-- ═══════════════════════════════════════════════════════
-- PASO 2: Revocar acceso directo a tablas base para roles de app
-- ═══════════════════════════════════════════════════════

REVOKE ALL ON brokerage_deals FROM authenticated;
REVOKE ALL ON brokerage_messages FROM authenticated;
REVOKE ALL ON brokerage_audit_log FROM authenticated;
REVOKE ALL ON brokerage_consent_log FROM authenticated;
REVOKE ALL ON brokerage_suppression_list FROM authenticated;

-- Service role (server-side) mantiene acceso completo por defecto

-- ═══════════════════════════════════════════════════════
-- PASO 3: Vistas por entidad (ÚNICA interfaz para roles de app)
-- ═══════════════════════════════════════════════════════

-- Vista Tracciona: sin precios, sin márgenes, sin datos de V
CREATE OR REPLACE VIEW v_brokerage_tracciona AS
  SELECT id, buyer_id, buyer_phone, buyer_score, buyer_needs,
         buyer_financing, vehicle_id, status, legal_basis_buyer,
         created_at, qualified_at, closed_at, expires_at
  FROM brokerage_deals
  WHERE public.user_entity() = 'tracciona' AND public.is_admin();

-- Vista Tank: acceso completo a todos los campos
CREATE OR REPLACE VIEW v_brokerage_tank AS
  SELECT *
  FROM brokerage_deals
  WHERE public.user_entity() = 'tank' AND public.is_admin();

-- Vista mensajes Tracciona: solo mensajes del Agente T (buyer-facing)
CREATE OR REPLACE VIEW v_brokerage_messages_tracciona AS
  SELECT id, deal_id, sender_entity, content, created_at
  FROM brokerage_messages
  WHERE sender_entity = 'tracciona'
    AND public.user_entity() = 'tracciona' AND public.is_admin();

-- Vista mensajes Tank: todos los mensajes
CREATE OR REPLACE VIEW v_brokerage_messages_tank AS
  SELECT *
  FROM brokerage_messages
  WHERE public.user_entity() = 'tank' AND public.is_admin();

-- ═══════════════════════════════════════════════════════
-- PASO 4: Roles separados por entidad + GRANT solo a su vista
-- ═══════════════════════════════════════════════════════

-- Crear roles de BD por entidad (ejecutar una vez como superuser)
CREATE ROLE role_tracciona NOLOGIN;
CREATE ROLE role_tank NOLOGIN;

-- Cada rol solo ve su vista — no existe forma de que role_tracciona
-- acceda a v_brokerage_tank aunque user_entity() falle
GRANT SELECT ON v_brokerage_tracciona TO role_tracciona;
GRANT SELECT ON v_brokerage_messages_tracciona TO role_tracciona;

GRANT SELECT ON v_brokerage_tank TO role_tank;
GRANT SELECT ON v_brokerage_messages_tank TO role_tank;

-- Implementación en Supabase: dos service clients separados
-- SET ROLE con PostgREST/supabase-js no está probado en producción con pooling
-- y puede fallar en edge cases. Dos clientes es más simple y fiable.
--
-- En server/utils/brokerageClients.ts:
--
--   export const supabaseTracciona = createClient(
--     process.env.SUPABASE_URL,
--     process.env.SUPABASE_SERVICE_KEY_TRACCIONA  // API key con rol role_tracciona
--   )
--
--   export const supabaseTank = createClient(
--     process.env.SUPABASE_URL,
--     process.env.SUPABASE_SERVICE_KEY_TANK        // API key con rol role_tank
--   )
--
-- Cada server route del brokeraje importa el cliente correcto según su entidad.
-- Las API keys se configuran en Supabase Dashboard → API → Custom roles.
-- Variables de entorno en .env: SUPABASE_SERVICE_KEY_TRACCIONA, SUPABASE_SERVICE_KEY_TANK

-- ═══════════════════════════════════════════════════════
-- PASO 5: RLS como última línea de defensa en tablas base
-- (Solo afecta a service role queries mal configuradas)
-- ═══════════════════════════════════════════════════════

ALTER TABLE brokerage_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE brokerage_messages ENABLE ROW LEVEL SECURITY;

-- Policy restrictiva: solo service_role o admin con entity correcta
CREATE POLICY "brokerage_deals_entity_guard" ON brokerage_deals
  FOR SELECT USING (
    public.is_admin() AND public.user_entity() IN ('tank', 'tracciona')
  );
```

**Resultado: defensa en profundidad (2 capas):**

| Capa                  | Mecanismo                                              | Qué protege                                             |
| --------------------- | ------------------------------------------------------ | ------------------------------------------------------- |
| **1. REVOKE + GRANT** | Roles de app no pueden hacer `SELECT` en tabla base    | Columnas sensibles nunca expuestas aunque RLS tenga bug |
| **2. RLS**            | `user_entity()` filtra filas incluso para service role | Segregación de filas como safety net                    |

> **Nota:** Las escrituras (`INSERT`, `UPDATE`) se hacen exclusivamente desde server-side con service role. Los roles de app autenticados solo leen vistas.

---

## 8. Integración con servicios existentes

### 8.1 WhatsApp (Meta Cloud API)

El sistema usa **dos números de WhatsApp Business independientes**, cada uno registrado en Meta con su propio `phone_number_id`:

| Número                           | Entidad         | `phone_number_id`           | Agentes que lo usan | Interlocutor                              |
| -------------------------------- | --------------- | --------------------------- | ------------------- | ----------------------------------------- |
| **Número Tracciona** (existente) | Tracciona.com   | `PHONE_NUMBER_ID_TRACCIONA` | Agente T + Agente B | C (comprador) y V (vendedor, fase broker) |
| **Número Tank Ibérica** (nuevo)  | Tank Ibérica SL | `PHONE_NUMBER_ID_TANK`      | Agente I            | V (vendedor, fase tank)                   |

- Ambos usan la misma Meta Cloud API (Webhook), diferenciados por `phone_number_id` en cada request
- El número de Tracciona es el mismo para Agente T (habla con C) y Agente B (habla con V en fase broker): ambos representan a Tracciona, tiene sentido compartirlo
- El número de Tank Ibérica es exclusivo para Agente I: Tank entra como entidad separada con número propio
- Los mensajes se rutean al agente correcto según `phone_number_id` + contexto del deal (`deal_mode`, `status`)

### 8.2 IA (aiProvider)

Dos system prompts distintos:

- **Agente T:** Personalidad de asistente de marketplace. Objetivo: precalificar. Tono: servicial, neutro.
- **Agente I:** Personalidad de comprador profesional. Objetivo: conseguir mejor precio. Tono: directo, comercial, transparente.

Ambos usan `callAI()` existente con system prompts diferentes.

#### Reglas anti-bucle (obligatorias en ambos agentes)

| Regla                                  | Agente T (Comprador)                                     | Agente I (Vendedor)                                      |
| -------------------------------------- | -------------------------------------------------------- | -------------------------------------------------------- |
| Máx rondas de conversación             | 10 mensajes (5 ida + 5 vuelta)                           | 8 mensajes (4 ida + 4 vuelta)                            |
| Máx contraofertas automáticas IA       | N/A (T no negocia precio)                                | **1 contraoferta** — si V rechaza, `escalated_to_humans` |
| Máx rondas de conversación total       | N/A                                                      | 3 rondas de precio (ida+vuelta). Más allá → humano       |
| Timeout sin respuesta                  | 48h → recordatorio. 96h → cierre.                        | 48h → recordatorio. 96h → cierre.                        |
| Detección de conflicto/hostilidad      | Escala a humano inmediatamente                           | Escala a humano inmediatamente                           |
| Detección de bucle (misma pregunta 2x) | Resumen + pregunta directa. Si repite → cierre educado   | Resumen + propuesta final. Si repite → cierre            |
| Pregunta fuera de alcance              | "Eso lo gestionará directamente nuestro equipo" → escala | Igual                                                    |
| Petición de info confidencial          | Rechaza + log en audit                                   | Rechaza + log en audit                                   |

**Implementación:** Contador `negotiation_rounds` en `brokerage_deals`. Cada mensaje outbound del agente incrementa. Al llegar al límite:

```
SI el deal tiene margen viable → escalated_to_humans (con nota: "máx rondas alcanzado")
SI NO tiene margen viable → deal_cancelled (con nota: "negociación agotada sin acuerdo")
```

Campos en `brokerage_deals`:

```sql
ALTER TABLE brokerage_deals ADD COLUMN
  buyer_msg_count      SMALLINT DEFAULT 0,    -- Mensajes enviados por Agente T
  seller_msg_count     SMALLINT DEFAULT 0,    -- Mensajes enviados por Agente I
  negotiation_rounds   SMALLINT DEFAULT 0,    -- Rondas de contraoferta con V
  auto_counteroffers   SMALLINT DEFAULT 0,    -- Contraofertas automáticas hechas por IA (máx 1)
  max_whatsapp_cost    NUMERIC(8,4) DEFAULT 5.00; -- Límite hard de gasto WhatsApp por deal (€)
```

### 8.3 Transporte (IberHaul)

Cuando el deal llega a `human_takeover`:

- El sistema calcula coste de transporte automáticamente usando `transport_zones`
- Se incluye en el cálculo de margen
- Si C acepta, se genera `transport_request` vinculado al deal

---

## 9. Métricas y KPIs

### 9.1 KPIs operativos

| Métrica                     | Cálculo                                  | Objetivo inicial |
| --------------------------- | ---------------------------------------- | ---------------- |
| Tasa de precalificación     | C cualificados / C contactados           | > 30%            |
| Tasa de respuesta vendedor  | V que responden / V contactados          | > 60%            |
| Tasa de aceptación vendedor | V que aceptan precio / V que responden   | > 25%            |
| Tasa de cierre              | Deals cerrados / Deals escalados         | > 50%            |
| Margen medio                | Media de margin_amount en deals cerrados | > 3.000€         |
| Tiempo medio de cierre      | Media de closed_at - created_at          | < 7 días         |
| Opt-out rate                | V que desactivan / V contactados         | < 10%            |

### 9.2 Métricas de conversión del embudo (validación del sistema)

| Métrica                                             | Cálculo                                                                         | Alerta si...                                               |
| --------------------------------------------------- | ------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| % C que consumen créditos (Reserva)                 | Reservas activadas / C que llegan a `buyer_qualified`                           | < 20% → barrera demasiado alta                             |
| % Reserva → contacto a V (broker)                   | Deals en `contacting_seller_broker` / Reservas activadas                        | < 80% → fallo interno                                      |
| % Reserva → contacto a V (tank, tras broker failed) | Deals en `contacting_seller_tank` / `broker_failed`                             | < 70% → revisar lógica de fallback                         |
| % Contacto a V → escalado humano                    | `escalated_to_humans` / (`contacting_seller_broker` + `contacting_seller_tank`) | < 15% → scoring o IA débiles                               |
| € WhatsApp gastado / deal cerrado                   | Coste total WhatsApp periodo / deals `deal_closed`                              | > 50€ → ineficiencia                                       |
| Devoluciones créditos / Reservas                    | Créditos devueltos / Total reservas                                             | > 40% → mala precalificación                               |
| Close rate en handover humano                       | `deal_closed` / `escalated_to_humans`                                           | < 50% → humanos pierden deals o IA escala demasiado pronto |
| € WhatsApp / deal escalado                          | Coste WhatsApp periodo / deals `escalated_to_humans`                            | > 25€ → filtro no protege caja                             |
| € WhatsApp / deal cerrado                           | Coste WhatsApp periodo / deals `deal_closed`                                    | > 50€ → ineficiencia                                       |

### 9.3 Umbrales de parada operativa automática

Si los KPIs cruzan umbrales de peligro durante periodos sostenidos, el sistema actúa automáticamente para evitar quemar caja:

| Condición                           | Periodo                | Acción automática                                                                                                            |
| ----------------------------------- | ---------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| € WhatsApp/deal cerrado > 50€       | 2 semanas consecutivas | **Pausa automática** de auto-contacto a vendedores. Solo humanos inician contacto. Alerta P0 al equipo.                      |
| Close rate en handover humano < 35% | 2 semanas consecutivas | **Más revisión humana, menos IA:** umbral de scoring para auto-qualify sube de 70 a 80. Más deals pasan por `manual_review`. |
| Opt-out rate > 15%                  | 1 mes                  | Pausa de auto-contacto 7 días + revisión obligatoria de mensajes IA con equipo legal.                                        |
| Devoluciones créditos > 50%         | 2 semanas consecutivas | Pausa de nuevas Reservas de Búsqueda + análisis de por qué fallan.                                                           |

**Implementación:** Cron job diario que calcula métricas de las últimas 2 semanas (rolling window). Resultados en tabla `brokerage_operational_flags` con flag `auto_contact_paused`, `scoring_threshold_override`, etc. Los agentes IA consultan esta tabla antes de iniciar cualquier contacto.

**Reactivación:** Solo manual por humano autorizado + entrada en `brokerage_audit_log` con `action = 'operational_pause_lifted'` y motivo.

---

## 10. Fases de implementación

### Fase 1 — MVP (manual + semi-automático)

- Tablas de BD + migraciones
- Dashboard admin básico (lista de deals, cambio de estado manual)
- Agente T básico (precalificación por WhatsApp, reglas simples)
- Contacto a V: manual por equipo Tank (no IA todavía)
- Audit log + consent log funcionales
- Opt-out en perfil del dealer

#### Gate de salida Fase 1 → Fase 2 (go/no-go obligatorio)

**No activar el Agente I (auto-contacto a vendedores) hasta validar manualmente:**

| Criterio                                            | Umbral mínimo | Medición                                              |
| --------------------------------------------------- | ------------- | ----------------------------------------------------- |
| Deals completados manualmente                       | ≥ 20-30 deals | Absoluto                                              |
| Close rate (deals cerrados / escalados)             | ≥ 40%         | Rolling sobre los deals de Fase 1                     |
| € coste por deal cerrado (equipo + WhatsApp manual) | ≤ 200€        | Referencia para calibrar qué ahorra la automatización |
| Opt-out rate de vendedores                          | < 15%         | Si es mayor, revisar el approach antes de automatizar |

**Proceso de validación:**

1. El equipo Tank hace los primeros 20-30 deals completamente a mano
2. Registra cada interacción en `brokerage_deals` + `brokerage_audit_log` igual que haría la IA
3. Al llegar a 20 deals, evalúa los 4 criterios
4. Si todos pasan → activar Agente I en modo supervisado (humano revisa cada mensaje antes de enviar)
5. Tras 10 deals supervisados sin incidencias → activar modo autónomo

**Quién autoriza:** Decisión conjunta dirección Tank + Tracciona. Se documenta en `brokerage_audit_log` con `action = 'phase2_activated'`.

### Fase 2 — Automatización del vendedor

- Agente I (IA de Tank Ibérica) contacta y negocia con V
- Lógica de margen automática
- Escalación automática a humanos
- Métricas en dashboard

### Fase 3 — Optimización

- Scoring de C con ML (historial de deals pasados)
- Pricing dinámico (sugerir oferta óptima basada en datos de mercado)
- Detección de oportunidades proactiva (C no inicia, el sistema detecta match)
- Integración con financiación (pre-aprobación de crédito en el flujo)
- Modo "oferta ciega" (C lanza criterios, IA busca matches)

---

## 10.1 Barreras anti-abuso del comprador

Para evitar que curiosos o trolls activen la cadena de negociación con vendedores (coste real: tokens IA + tiempo humano), se implementan barreras progresivas pero sin matar conversión.

### Barrera 1 — Registro y verificación

- Usuario registrado con email verificado
- Teléfono verificado (WhatsApp)
- **Cuenta con antigüedad ≥ 24h** para activar brokeraje en vehículos > 50.000€
- Cuentas nuevas (<24h) pueden activar brokeraje en vehículos ≤ 50.000€ sin restricción
- **Excepción manual:** Compradores "calientes" captados por teléfono por el equipo Tank pueden ser marcados como `verified_by_human = TRUE` en su perfil, saltando el requisito de antigüedad

### Barrera 2 — Scoring con 3 bandas

El scoring de precalificación no es binario. Tres bandas para no perder compradores válidos "atípicos":

| Banda               | Score | Acción                                                                                                                                                                            |
| ------------------- | ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Rechazo**         | < 50  | No avanza. Mensaje educado: "Ahora mismo no podemos gestionar esta búsqueda. Te recomendamos explorar nuestro catálogo."                                                          |
| **Revisión manual** | 50-69 | El deal se crea en estado `manual_review`. Un humano de Tank revisa en <24h y decide si proceder. Coste bajo: 5 min por revisión. Salva compradores legítimos con perfil atípico. |
| **Automático**      | ≥ 70  | Procede automáticamente a contactar vendedor.                                                                                                                                     |

Nuevo estado en la máquina de estados: `manual_review` (entre `qualifying_buyer` y `buyer_qualified`).

### Barrera 3 — Reserva de Búsqueda Prioritaria (skin in the game con créditos)

Antes de que el sistema contacte a un vendedor, C consume créditos de Tracciona según la franja de precio del vehículo:

| Franja de precio vehículo | Créditos    | Equivalente aprox. |
| ------------------------- | ----------- | ------------------ |
| < 20.000€                 | 2 créditos  | ~4€                |
| 20.000€ - 50.000€         | 5 créditos  | ~10€               |
| 50.000€ - 100.000€        | 10 créditos | ~20€               |
| > 100.000€                | 15 créditos | ~30€               |

**Naming:** Se llama "Reserva de Búsqueda Prioritaria", no "pago". Es un servicio: Tracciona busca activamente una unidad para C.

**Ventajas de créditos sobre Stripe directo:**

- Menos fricción psicológica — C puede tener créditos de su suscripción o de packs
- Sin coste de refund de Stripe (~1€ por devolución)
- Touchpoint natural con el sistema de monetización (§2.4.1)
- El comprador que no tiene créditos los compra en el momento (Stripe one-time, ya integrado)

**Política de devolución:**

- **Créditos devueltos** si Tracciona no encuentra match o falla técnicamente
- **Créditos devueltos** si el vendedor rechaza o no responde
- **Sin devolución** si C abandona voluntariamente tras contactar al vendedor
- **Sin devolución** si C proporciona información falsa
- Devolución automática desde el sistema — sin intervención humana

### Barrera 4 — Rate limiting

| Regla                                     | Límite                                                                      |
| ----------------------------------------- | --------------------------------------------------------------------------- |
| Deals activos simultáneos por C           | Máximo 2                                                                    |
| Deals iniciados en 30 días                | Máximo 3                                                                    |
| Abandonos sin causa válida                | Bloqueo progresivo (ver strikes abajo)                                      |
| Precalificaciones fallidas (score < 50)   | Máximo 5 en 30 días                                                         |
| Cooldown tras 2 rechazos por incoherencia | 72h de espera                                                               |
| Hard-block: patrón troll                  | Múltiples teléfonos/IPs/dispositivos → bloqueo permanente + revisión manual |

**Strikes por abandono sin causa válida (bloqueo progresivo):**

| Strike                 | Bloqueo |
| ---------------------- | ------- |
| 1er abandono sin causa | 7 días  |
| 2do abandono sin causa | 30 días |
| 3er abandono sin causa | 90 días |

**Motivos válidos de cancelación (NO cuentan como strike):**

- Unidad no coincide con descripción
- Cambio documental grave (carga, embargo, etc.)
- Financiación denegada
- No disponibilidad real de la unidad

Todo lo demás = strike.

### Barrera 5 — Budget cap por usuario

Coste máximo que el sistema gasta en un comprador sin avance:

| Métrica                                                             | Límite                            | Acción al superar                      |
| ------------------------------------------------------------------- | --------------------------------- | -------------------------------------- |
| Mensajes WhatsApp a vendedores por deals de C                       | 10 msgs/mes                       | Bloqueo automático hasta siguiente mes |
| Tokens IA consumidos en conversaciones de C                         | 5€/mes                            | Escalación a humano (no más IA)        |
| Tiempo en `contacting_seller_tank` sin pasar a `negotiating_seller` | 7 días                            | Deal expirado automáticamente          |
| Coste WhatsApp por deal individual                                  | 5€ por deal (`max_whatsapp_cost`) | Deal congelado + revisión manual       |
| Coste WhatsApp acumulado por comprador/mes                          | 15€/mes (3 deals × 5€)            | Bloqueo automático hasta mes siguiente |

Campos en `brokerage_deals`:

```sql
ALTER TABLE brokerage_deals ADD COLUMN
  buyer_whatsapp_cost  NUMERIC(8,4) DEFAULT 0,  -- Coste acumulado en msgs WhatsApp
  buyer_ai_token_cost  NUMERIC(8,4) DEFAULT 0,  -- Coste acumulado en tokens IA
  cancel_reason        TEXT,                     -- Motivo de cancelación (para evaluar si es strike)
  cancel_is_valid      BOOLEAN;                  -- TRUE = motivo válido, FALSE = strike
```

### Timeouts completos por estado

| Estado                                         | Timeout                                         | Consecuencia                                                                       |
| ---------------------------------------------- | ----------------------------------------------- | ---------------------------------------------------------------------------------- |
| `qualifying_buyer`                             | 48h sin respuesta de C                          | `expired`                                                                          |
| `manual_review`                                | 24h sin revisión humana                         | Alerta interna. Si score ≥ 60 → auto-aprobado a las 48h                            |
| `buyer_qualified`                              | 24h sin consumir créditos (Reserva de Búsqueda) | `expired` — no se contacta a V                                                     |
| `contacting_seller_broker`                     | 48h sin respuesta de V                          | 1 recordatorio único (Agente B)                                                    |
| `contacting_seller_broker` (tras recordatorio) | 96h total sin respuesta                         | `broker_failed` automático → activa fase tank                                      |
| `broker_negotiating`                           | 5 días sin acuerdo                              | `broker_failed` automático → activa fase tank                                      |
| `contacting_seller_tank`                       | 48h sin respuesta de V                          | 1 recordatorio único (Agente I)                                                    |
| `contacting_seller_tank` (tras recordatorio)   | 96h total sin respuesta                         | `expired` + cooldown al vendedor en `brokerage_suppression_list`                   |
| `negotiating_seller`                           | 7 días sin avance                               | `expired`                                                                          |
| `pending_buyer_confirm`                        | 24h sin confirmación de C                       | `expired` — no se mueven humanos                                                   |
| `escalated_to_humans`                          | 12h sin asignación de humano                    | Alerta interna P1                                                                  |
| `human_takeover`                               | 72h sin avance registrado                       | Revisión obligatoria: el humano debe documentar motivo o cerrar con `close_reason` |
| Cualquier estado                               | C no responde a 2 mensajes consecutivos         | `deal_cancelled`                                                                   |

### Métricas de conversión del embudo (críticas para validar)

| Métrica                           | Cálculo                                          | Alerta si...                             |
| --------------------------------- | ------------------------------------------------ | ---------------------------------------- |
| % C que pagan Reserva de Búsqueda | Reservas pagadas / C que llegan a ese paso       | < 20% (barrera demasiado alta)           |
| % Reserva → contacto a V          | Deals que contactan V / Reservas pagadas         | < 80% (fallo interno)                    |
| % Contacto a V → escalado humano  | Escalados / Contactados                          | < 15% (scoring o negociación IA débiles) |
| € WhatsApp gastado / deal cerrado | Coste total WhatsApp / deals cerrados en periodo | > 50€ (ineficiencia)                     |
| Reembolsos / Reservas pagadas     | Refunds / Total reservas                         | > 40% (mala precalificación)             |

### Bypass manual — Cuentas estratégicas

Para no perder operaciones grandes por reglas rígidas, un admin o humano de Tank puede marcar una cuenta como estratégica:

```sql
ALTER TABLE users ADD COLUMN
  brokerage_vip       BOOLEAN DEFAULT FALSE,
  brokerage_vip_reason TEXT NOT NULL DEFAULT 'none'
    CHECK (brokerage_vip_reason IN (
      'none',              -- No VIP
      'fleet_buyer',       -- Comprador de flota (≥3 unidades)
      'phone_referral',    -- Referido por teléfono por equipo Tank
      'repeat_buyer',      -- Comprador recurrente (≥2 deals cerrados)
      'strategic_account', -- Cuenta estratégica (decisión dirección)
      'partner_referral'   -- Referido por partner/dealer de confianza
    )),
  brokerage_vip_set_by TEXT;          -- Humano que lo autorizó (nombre real, no nick)
```

> **Auditoría obligatoria VIP:** Cada activación de VIP genera entrada en `brokerage_audit_log` con `action = 'vip_bypass_granted'`, `actor = 'tank_human:nombre_apellido'` y **`details.reason` = valor del enum** (no texto libre). `brokerage_vip_reason` es un enum cerrado para evitar abusos internos — no se puede poner "porque es mi amigo". Si surge un nuevo motivo legítimo, se añade al enum previa aprobación de dirección.

**Qué salta un VIP:**

- Requisito de antigüedad de cuenta (24h)
- Créditos de Reserva de Búsqueda
- Rate limiting (pero no el hard-block por patrón troll)
- Score mínimo de precalificación (pasa directo a `buyer_qualified`)

**Qué NO salta un VIP:**

- Consentimiento explícito para compartir datos con Tank Ibérica (RGPD obligatorio)
- Timeouts de respuesta (si no responde, no responde)
- Hard-block por patrón troll
- Audit log (todo queda registrado igual)

**Casos de uso:** Comprador de flota captado por teléfono, comprador serio nuevo referido por un dealer, repeat buyer de Tank Ibérica.

Cada activación de VIP queda en `brokerage_audit_log` con `action = 'vip_bypass_granted'` y `actor = 'tank_human:nombre'`.

### Campos de strikes y reliability en `users`

```sql
ALTER TABLE users ADD COLUMN
  brokerage_strikes      SMALLINT DEFAULT 0,     -- Contador de strikes activos
  brokerage_blocked_until TIMESTAMPTZ,           -- Fecha hasta la que está bloqueado
  brokerage_last_strike_reason TEXT,             -- Último motivo de strike
  brokerage_reliability  SMALLINT DEFAULT 0;     -- Score de fiabilidad acumulado
```

**Lógica de strikes (en server-side, no en BD):**

- Strike 1 → `brokerage_blocked_until = NOW() + 7 days`
- Strike 2 → `brokerage_blocked_until = NOW() + 30 days`
- Strike 3+ → `brokerage_blocked_until = NOW() + 90 days`
- Reset de strikes: tras 6 meses sin strikes, se reduce en 1

**Reliability score:**

- +10 por deal `deal_closed`
- -15 por deal cancelado sin motivo válido (= strike)
- Score > 50 → puede saltar créditos de Reserva de Búsqueda
- Score < 0 → bloqueado del servicio hasta revisión manual

---

## 11. Política de riesgo de stock — Regla operativa obligatoria

Tank Ibérica asume riesgo de stock cuando compra a V antes de que C firme. Esta política es **obligatoria** y se aplica por importe:

### 11.1 Reglas por franja de importe

| Importe de compra      | Política                    | Condición para comprar                                                                     |
| ---------------------- | --------------------------- | ------------------------------------------------------------------------------------------ |
| **< 15.000€**          | Compra directa permitida    | Score de C ≥ 70 + confirmación verbal/escrita                                              |
| **15.000€ - 50.000€**  | Señal de C obligatoria      | C deposita ≥ 5% (mín. 750€) antes de que Tank compre a V                                   |
| **50.000€ - 100.000€** | Señal + compra condicionada | C deposita ≥ 5% + contrato de compra con V incluye cláusula de inspección (5 días hábiles) |
| **> 100.000€**         | Doble garantía              | C deposita ≥ 10% + compra condicionada a V + aprobación de dirección Tank                  |

### 11.2 Señal del comprador

- Se recoge vía Stripe (transferencia o tarjeta) a cuenta de Tank Ibérica
- **Reembolsable** si Tank no consigue la unidad o la unidad no cumple lo descrito
- **No reembolsable** si C se echa atrás sin motivo justificado tras inspección
- Documentada en contrato de reserva estándar de Tank Ibérica

### 11.3 Compra condicionada a V

Contrato de compraventa con V incluye:

- Periodo de inspección de **5 días hábiles** desde entrega
- Tank puede resolver el contrato si la unidad no cumple las condiciones descritas
- Esto da margen para que C inspeccione antes de que Tank se comprometa en firme

### 11.4 Tiempo máximo en stock

- Objetivo: **0 días** (compra y venta simultáneas o casi)
- Máximo aceptable: **15 días** entre compra a V y venta a C
- Si supera 15 días: alerta automática al equipo Tank + revisión de pricing
- Si supera 30 días: el vehículo pasa al stock regular de Tank (se desvincula del deal de brokeraje)

### 11.5 Implementación técnica

Campos en `brokerage_deals`:

```sql
ALTER TABLE brokerage_deals ADD COLUMN
  buyer_credits_consumed SMALLINT,                     -- Créditos consumidos como Reserva de Búsqueda
  buyer_credits_refunded BOOLEAN DEFAULT FALSE,        -- TRUE si se devolvieron (V rechazó, fallo técnico, etc.)
  buyer_deposit_amount  NUMERIC(12,2),                 -- Señal monetaria (para stock risk policy en franjas altas)
  buyer_deposit_date    TIMESTAMPTZ,                   -- Fecha del depósito monetario
  buyer_deposit_stripe_id TEXT,                        -- ID de Stripe para trazabilidad
  purchase_conditional  BOOLEAN DEFAULT FALSE,         -- Compra condicionada activa
  inspection_deadline   TIMESTAMPTZ,                   -- Fecha límite de inspección
  stock_risk_tier       TEXT CHECK (stock_risk_tier IN ('direct', 'deposit', 'conditional', 'double'));
```

El campo `stock_risk_tier` se calcula automáticamente al pasar a `escalated_to_humans` según el importe, y determina qué pasos son obligatorios antes de que un humano autorice la compra.

---

## 12. Documentación legal requerida (acción del usuario)

Antes de activar el sistema, el asesor legal/fiscal debe preparar:

**RGPD:**

- [ ] Cláusula en TyC de Tracciona: ofertas de compra de empresas colaboradoras (opt-out visible)
- [ ] Actualización política de privacidad: compartición de datos con Tank Ibérica SL (identificada con CIF)
- [ ] Acuerdo art. 26 RGPD (co-responsables) **solo para el tramo de transferencia de datos C→Tank**. En el resto de tramos, cada empresa es responsable independiente.
- [ ] Evaluación de impacto (EIPD/DPIA) — obligatoria por decisiones automatizadas con IA (scoring, contacto automático)
- [ ] Protocolo de atención de derechos ARSULPD para datos de brokeraje (ambas empresas)
- [ ] Documentación de interés legítimo (art. 6.1.f) con **test de ponderación** para contacto automatizado a vendedores

**LSSI:**

- [ ] **Validar con abogado la posición adoptada en §1.4:** El documento toma la posición de que el contacto de Tank Ibérica a vendedores es "contacto de comprador natural sobre anuncio público", no prospección comercial sistemática sujeta a LSSI arts. 20-21. El abogado debe confirmar o corregir esta posición por escrito. Si la confirma → el checklist LSSI queda cerrado. Si la corrige → actualizar §1.4 y §4.2 en consecuencia. **Una posición única en todo el documento.**
- [ ] **EU AI Act (agosto 2026):** Desde el 2 de agosto de 2026 es obligatorio informar al interlocutor cuando habla con un sistema de IA (art. 50 Reglamento UE 2024/1689). Ver §4.2 para el approach preparado.

**Fiscal / contractual:**

- [ ] Definir criterios operativos claros para aplicar **REBU vs IVA normal** (ver §12.1)
- [ ] Contrato de reserva estándar para señal del comprador (con créditos o depósito según franja)
- [ ] Modelo de compraventa condicionada para compras >50k€

**Operativo:**

- [ ] Alta de segundo número WhatsApp Business (Tank Ibérica) en Meta Business Manager

### 12.1 REBU vs IVA normal — Criterios operativos

Tank Ibérica puede aplicar el **Régimen Especial de Bienes Usados** (REBU, arts. 135-139 LIVA) cuando se cumplen TODAS las condiciones. De lo contrario, IVA normal.

| Criterio                                                         | REBU      | IVA normal                               |
| ---------------------------------------------------------------- | --------- | ---------------------------------------- |
| **V es particular** (no empresario/profesional)                  | ✔️ Aplica | —                                        |
| **V es empresa pero factura SIN IVA** (ej: otro revendedor REBU) | ✔️ Aplica | —                                        |
| **V es empresa y factura CON IVA desglosado**                    | —         | ✔️ Aplica                                |
| **V es intracomunitario con IVA 0%** (exención intra-UE)         | —         | ✔️ Aplica (adquisición intracomunitaria) |

**Regla operativa para el equipo Tank:**

1. **Antes de comprar**, verificar si V emitirá factura con IVA desglosado
2. Si V es particular → REBU automático. Tank solo tributa IVA sobre el margen (precio venta - precio compra)
3. Si V es empresa con IVA → IVA normal. Tank se deduce el IVA de compra y repercute IVA de venta
4. **Documentar en el deal:** Campo `tax_regime` en `brokerage_deals`

```sql
ALTER TABLE brokerage_deals ADD COLUMN
  tax_regime TEXT NOT NULL DEFAULT 'pending'
    CHECK (tax_regime IN ('rebu', 'iva_normal', 'intracomunitario', 'pending'));
```

**Gate de cierre fiscal obligatorio:** Un deal NO puede pasar a `deal_closed` si `tax_regime = 'pending'`. Implementar como CHECK o como validación server-side:

```sql
-- Constraint: no cerrar sin régimen fiscal definido
ALTER TABLE brokerage_deals ADD CONSTRAINT chk_tax_regime_on_close
  CHECK (
    status != 'deal_closed' OR tax_regime != 'pending'
  );
```

El agente IA debe preguntar a V si es particular o empresa **antes de escalar a humanos**, para que el equipo Tank tenga el régimen fiscal preparado al recibir el deal.

**Impacto en el cálculo de margen:**

- **REBU:** Margen neto = (precio_venta - precio_compra) × (1 - 21/121). El IVA se paga solo sobre el margen.
- **IVA normal:** Margen neto = precio_venta_sin_IVA - precio_compra_sin_IVA. IVA neutro (se deduce y repercute).

La IA debe preguntar a V si es particular o empresa como parte de la negociación para calcular correctamente el margen viable.

---

## 13. Monetización de datos agregados del brokeraje

> **Referencia:** `ESTRATEGIA-NEGOCIO.md` §2.11 (Capa 4 — Datos como producto)

El sistema de brokeraje genera datos de **transacciones reales** (no listados, no intenciones — cierres efectivos con precios acordados). Esta información tiene alto valor comercial porque ningún portal competidor tiene datos de precios de cierre reales en vehículos industriales en España.

### 13.1 Productos de datos (solo agregados y anónimos)

| #   | Producto                                       | Datos fuente                                                                                                                                  | Cliente potencial                                         |
| --- | ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| 1   | **Tiempos de cierre por categoría/zona**       | `created_at` → `closed_at` agrupado por `category`, `location`                                                                                | Leasings, financieras (evaluar riesgo de reventa)         |
| 2   | **Rango precio publicado vs precio de cierre** | `asking_price` vs `agreed_deal_price` (modo broker) o `agreed_buy_price`/`target_sell_price` (modo tank) — siempre segmentado por `deal_mode` | Bancos (valoraciones), aseguradoras (valor de reposición) |
| 3   | **Liquidez de mercado**                        | Ratio de deals cerrados / deals iniciados por categoría-zona                                                                                  | Fabricantes (demanda por segmento), inversores            |
| 4   | **Tasa de respuesta de vendedores**            | `seller_responded_at` / deals en `contacting_seller_broker` + `contacting_seller_tank` por zona                                               | Plataformas competidoras, consultoras de sector           |
| 5   | **Tendencias de interés**                      | Evolución temporal de `buyer_needs` agregados (marcas, tipos, rangos)                                                                         | Fabricantes (planificación de producción), importadores   |

### 13.2 Condiciones obligatorias (no negociables)

Para monetizar estos datos sin vender datos personales y cumplir RGPD:

| #   | Condición                              | Implementación                                                                                                                                                                                                                                                                                       |
| --- | -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Agregación fuerte**                  | Nunca datos de deal individual. Siempre agrupaciones (mín. por categoría + zona + trimestre).                                                                                                                                                                                                        |
| 2   | **Umbral mínimo de celda**             | Si una celda de la agregación tiene n < 10, se suprime o se agrupa con celdas adyacentes. Para datos sensibles (precios), umbral n < 20.                                                                                                                                                             |
| 3   | **Supresión de outliers**              | Eliminar el 5% superior e inferior (P5-P95) de cada distribución antes de agregar. Evita que un deal atípico identifique indirectamente una transacción.                                                                                                                                             |
| 4   | **Política de privacidad actualizada** | La política de privacidad de Tracciona debe cubrir explícitamente el uso estadístico de datos anonimizados. Texto: "Utilizamos datos agregados y anónimos derivados de la actividad del marketplace para generar informes sectoriales. Estos datos no permiten identificar a usuarios individuales." |
| 5   | **Contratos con compradores de datos** | Todo contrato de venta de datos incluye cláusula de **prohibición de re-identificación** y de cruce con otras fuentes. Penalización contractual por incumplimiento.                                                                                                                                  |

### 13.3 Pipeline técnico

```
brokerage_deals (datos raw, con PII)
    ↓ Cron mensual: brokerage-data-aggregator
    ↓ Agrupa por (categoría, zona, trimestre)
    ↓ Aplica umbral mínimo de celda (n<10 → suprimir, n<20 para precios)
    ↓ Elimina outliers (P5-P95)
    ↓ Resultado: tabla market_brokerage_stats (sin PII)
market_brokerage_stats
    ↓ API de consulta (autenticada, de pago)
    ↓ Rate limiting por cliente (100 req/día) + logging de cada exportación
    ↓ Watermark contractual (ID de cliente embebido en CSV)
    ↓ Dashboard de informes sectoriales
    ↓ Exportación CSV/PDF para clientes de datos
```

**Controles anti-reidentificación en la capa API (adicionales al CHECK de BD):**

| Control                         | Implementación                                                                         | Por qué                                                                             |
| ------------------------------- | -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| **Rate limiting**               | 100 req/día por API key, ventana de 24h                                                | Evita que un cliente haga miles de consultas granulares para reensamblar microdatos |
| **Logging de exportaciones**    | Tabla `data_export_log` — quién, cuándo, qué filtros, qué registros devueltos          | Si hay una fuga, se puede trazar el origen exacto                                   |
| **Watermark contractual**       | ID de cliente embebido en cada CSV/PDF exportado (campo oculto o marca de agua en PDF) | Permite identificar el origen de una fuga aunque el cliente comparta los datos      |
| **Granularidad mínima forzada** | La API solo permite agrupar por trimestre mínimo (no por semana ni por día)            | Evita consultas demasiado específicas que podrían aproximarse a deals individuales  |

```sql
-- Tabla de logging de exportaciones de datos
CREATE TABLE data_export_log (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id    TEXT NOT NULL,        -- API key / cliente
  endpoint     TEXT NOT NULL,        -- Qué datos consultó
  filters      JSONB DEFAULT '{}',   -- Filtros aplicados (categoría, zona, periodo)
  rows_returned INTEGER,             -- Cuántos registros devolvió
  ip_address   INET,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Solo accesible por service role (auditoría interna)
REVOKE ALL ON data_export_log FROM authenticated;
```

```sql
-- Tabla de datos agregados (sin PII — nunca contiene IDs de usuario ni deal)
CREATE TABLE market_brokerage_stats (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period        TEXT NOT NULL,        -- 'Q1-2026', 'Q2-2026', etc.
  category_id   UUID REFERENCES categories(id),
  region        TEXT,                 -- Provincia o zona geográfica
  deals_count   INTEGER,             -- Número de deals en la celda (debe ser ≥ 10)
  avg_days_to_close NUMERIC(6,1),    -- Media de días hasta cierre
  deal_mode_split     TEXT CHECK (deal_mode_split IN ('broker', 'tank', 'combined')), -- Siempre agregar separado por modo
  median_asking_price NUMERIC(12,2), -- Mediana de precio publicado (P5-P95)
  median_close_price  NUMERIC(12,2), -- Mediana de precio cierre: agreed_deal_price (broker) o agreed_buy_price (tank)
  avg_discount_pct    NUMERIC(5,2),  -- Descuento medio publicado→cierre (coherente por deal_mode)
  seller_response_rate NUMERIC(5,2), -- % vendedores que responden
  liquidity_ratio     NUMERIC(5,2),  -- Deals cerrados / deals iniciados
  suppressed     BOOLEAN DEFAULT FALSE, -- TRUE si n < umbral (celda oculta)
  created_at     TIMESTAMPTZ DEFAULT NOW(),

  -- Constraint: no insertar celdas visibles con menos del umbral mínimo
  -- Las suprimidas SÍ pueden existir (para trazabilidad de la supresión)
  CONSTRAINT chk_min_cell_size
    CHECK (suppressed = TRUE OR deals_count >= 10)
);

-- Sin RLS — solo accesible vía API autenticada (service role)
-- NO accesible desde frontend ni desde roles autenticados
REVOKE ALL ON market_brokerage_stats FROM authenticated;
```

### 13.4 Activación

**No activar hasta:**

- Volumen mínimo de ~50 deals cerrados por trimestre (para que las agregaciones sean estadísticamente significativas)
- Validación legal de la política de privacidad actualizada
- Al menos 1 cliente de datos interesado (validar demand antes de construir)

**Flywheel con Capa 4 (§2.11):** Los datos de brokeraje complementan los datos de marketplace (visualizaciones, tiempos de publicación, variaciones de precio). Combinados y anonimizados, crean el dataset más completo del mercado de vehículos industriales en España — comparable a lo que Idealista ofrece para inmobiliaria.

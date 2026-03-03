# Plan de Respuesta a Incidentes — Tracciona

> Para fundadores/responsables sin experiencia técnica.
> **Objetivo:** Saber qué hacer en 2 minutos si algo falla.

---

## 🚨 Si recibes email de UptimeRobot ("Tracciona está caído")

### Paso 0: Verifica que sea real (1 minuto)

1. Abre https://tracciona.com en tu navegador
2. **Si la página carga normal** → es falsa alarma (servidor está bien, UptimeRobot tuvo glitch)
3. **Si NO carga o dice error** → continúa abajo

### Paso 1: Contacta a Claude Code (2 minutos)

Tienes 2 opciones:

**Opción A: Ya tienes Claude Code abierto**

- Nuevomensaje: "UptimeRobot alerta caída. Investiga qué pasó."
- Claude Code te dirá en 5 minutos si es grave

**Opción B: No tienes Claude Code abierto**

1. Abre [claude.com/claude-code](https://claude.com/claude-code)
2. Login con tu email
3. Pega este texto en el chat:
   ```
   UptimeRobot alerta que tracciona.com está caído.
   Investiga qué pasó (código roto, BD caída, etc).
   ```
4. Espera respuesta (5-10 minutos)

---

## 📋 Qué hará Claude Code en cada caso

### Caso 1: "Es un bug en el código" ✅ RÁPIDO

**Qué significa:** Alguien cambió código y rompió algo.

**Cuánto tarda:** 15-30 minutos

**Qué hará Claude Code:**

1. Arregla el código
2. Sube los cambios a GitHub
3. La web se redeploya automáticamente (5 min)

**Qué haces tú:**

- Espera 10 minutos
- Abre https://tracciona.com
- Si funciona → ¡Crisis resuelta!
- Si no → dile a Claude Code

---

### Caso 2: "La base de datos está caída" 🟠 MEDIO

**Qué significa:** Los servidores de datos de Supabase (la "despensa" del sitio) no responden.

**Cuánto tarda:** 30-60 minutos

**Qué hará Claude Code:**

1. Confirma que Supabase está caído
2. Te dirá: "Necesitamos restaurar desde backup"

**Qué haces tú:**

1. Lee: [DISASTER-RECOVERY.md](../referencia/DISASTER-RECOVERY.md) sección "Paso 1-3" (toma 30 min)
   - Baja el backup más reciente
   - Lo restaura en servidor temporal
2. Confirma a Claude Code: "Backup restaurado"
3. Claude Code completa la recuperación (15 min más)

---

### Caso 3: "Supabase está del todo roto" 🔴 CRÍTICO

**Qué significa:** Nuestro proveedor Supabase tiene un outage general (falla de su sistema).

**Cuánto tarda:** Depende de Supabase (pueden ser horas)

**Qué hará Claude Code:**

- Te mandará: "Contacta a Supabase support"

**Qué haces tú:**

1. Abre [supabase.com/dashboard](https://supabase.com/dashboard)
2. Login: email = `tankiberica@gmail.com`, contraseña = (la tuya)
3. Click "Support" (abajo a la izquierda)
4. Reporta: "Nuestro proyecto `gmnrfuzekbwyzkgsaftv` está caído"
5. Vuelve con Claude Code: "Supabase support notificado"

---

### Caso 4: "Ataque malicioso en curso" 🔒 CRÍTICO

**Qué significa:** Alguien intentó hackear (SQL injection, cambiar datos, robar info).

**Señales:**

- Email anormal desde Tracciona
- Datos desaparecidos
- Cambios raros que no hiciste

**Qué hará Claude Code:**

1. Bloquea el ataque en el código
2. Redeploya
3. Te dirá: "Necesitamos ver si se robaron datos"

**Qué haces tú:**

1. Copia este texto y pégalo en Claude Code:
   ```
   Se sospecha ataque malicioso.
   ¿Qué datos podrían haber sido robados?
   ¿Cómo lo verificamos?
   ```
2. Sigue sus instrucciones (puede ser 1-4 horas según severidad)

---

## 📞 Contactos de emergencia

| Situación                      | A contactar           | Cómo                           |
| ------------------------------ | --------------------- | ------------------------------ |
| Sitio caído (cualquier razón)  | Claude Code (arriba)  | Este documento                 |
| Supabase específicamente caído | Supabase support      | Dashboard → Support            |
| Algo robado / datos filtrando  | (TBD: abogado/asesor) | Email: `tankiberica@gmail.com` |
| Ataque activo                  | Cloudflare support    | Dashboard → Support            |

---

## ✅ Checklist rápida (primeros 2 minutos)

- [ ] ¿Tracciona.com carga en tu navegador? Si sí → falsa alarma, fin.
- [ ] ¿No carga? → Abre Claude Code
- [ ] Copia el texto de arriba en Claude Code
- [ ] Espera 5-10 minutos por diagnóstico
- [ ] Sigue las instrucciones específicas abajo

---

## 📊 Tiempo esperado por tipo de incidente

| Tipo           | Detección | Diagnóstico | Fix               | Total          |
| -------------- | --------- | ----------- | ----------------- | -------------- |
| Bug código     | 5 min     | 5 min       | 15 min            | **25 min**     |
| DB corrupta    | 5 min     | 5 min       | 30 min (restore)  | **40 min**     |
| Supabase caído | 5 min     | 10 min      | ? (esperar ellos) | **15+ min**    |
| Ataque         | 5 min     | 10 min      | 30-120 min        | **45-135 min** |

---

## 🔍 Qué NO hacer

- ❌ No intentes "arreglarlo" tú mismo si no sabes código
- ❌ No hagas cambios en la BD directamente (podrías empeorar)
- ❌ No publiques en redes que "estamos caídos" (avisa a usuarios después)
- ❌ No esperes >30 min sin contactar a Claude Code

---

## 📝 Documentos relacionados

- [DISASTER-RECOVERY.md](../referencia/DISASTER-RECOVERY.md) — Cómo restaurar desde backup (30 min procedure)
- [AUDIT-OVERVIEW.md](../referencia/AUDIT-OVERVIEW.md) — Sistema automático que evita crashes
- [STATUS.md](../../STATUS.md) — Estado actual del proyecto

---

_Versión 1.0 · Creado 15-mar-2026_
_Última revisión: cuando cambien procedimientos críticos_

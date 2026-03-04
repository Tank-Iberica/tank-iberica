# Commit Signing (GPG) — Tracciona

Guía para firmar commits con GPG. Relevante cuando haya múltiples colaboradores.
Actualmente (equipo de 1): recomendado pero no obligatorio.

---

## Setup en 5 minutos

### 1. Generar clave GPG

```bash
gpg --full-generate-key
# Seleccionar: RSA and RSA / 4096 bits / 2 años de expiración
# Email: el mismo que en git config
```

### 2. Obtener el ID de tu clave

```bash
gpg --list-secret-keys --keyid-format=long
# Ejemplo output: sec   rsa4096/3AA5C34371567BD2
# El ID es: 3AA5C34371567BD2
```

### 3. Configurar git para firmar

```bash
git config --global user.signingkey 3AA5C34371567BD2
git config --global commit.gpgsign true
git config --global tag.gpgsign true
```

### 4. Publicar clave en GitHub

```bash
gpg --armor --export 3AA5C34371567BD2 | pbcopy  # macOS
gpg --armor --export 3AA5C34371567BD2 | clip    # Windows
# Pegar en: GitHub → Settings → SSH and GPG keys → New GPG key
```

### 5. Verificar

```bash
git log --show-signature -1
# Debe mostrar "Good signature from..."
```

---

## Uso con múltiples máquinas

Exportar clave privada:

```bash
gpg --export-secret-keys 3AA5C34371567BD2 > mi-clave-privada.gpg
# ⚠️ Guardar en lugar seguro, NUNCA en el repo
```

Importar en otra máquina:

```bash
gpg --import mi-clave-privada.gpg
git config --global user.signingkey 3AA5C34371567BD2
git config --global commit.gpgsign true
```

---

## Verificar commits en GitHub

GitHub muestra el badge "Verified" en commits firmados.
Un commit sin firma no bloquea PRs actualmente (política Tier 2 → activar cuando haya equipo).

---

## Activar verificación obligatoria en GitHub

Cuando haya equipo: Settings → Branches → Branch protection → "Require signed commits".

_Última actualización: mar-2026_

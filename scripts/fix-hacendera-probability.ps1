$ErrorActionPreference = 'Stop'

$path = 'C:\TradeBase\SUBVENCIONES.md'
$text = Get-Content $path -Raw
$old = '| **Probabilidad** | **Media-baja (25%)** — no depende solo de la memoria; depende también de ejecutar bien el esquema de crowdfunding |'
$new = '| **Probabilidad** | **Media-baja (20%)** — no depende solo de la memoria; depende también de ejecutar bien el esquema de crowdfunding |'

if (-not $text.Contains($old)) {
    throw 'No se encontró la probabilidad detallada de Hacendera a corregir.'
}

$text = $text.Replace($old, $new)
Set-Content -Path $path -Value $text -Encoding UTF8

rg -n "Hacendera|Media-baja \(20%\)" $path

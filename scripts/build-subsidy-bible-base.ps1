$ErrorActionPreference = 'Stop'

$playbook = 'C:\TradeBase\Tracciona\docs\SUBVENCIONES-PLAYBOOK.md'
$outDir = 'C:\TradeBase\Tracciona\docs\subvenciones-biblia'

New-Item -ItemType Directory -Force -Path $outDir | Out-Null

$mapping = [ordered]@{
  '### P3. `#24` I+D+i — tesis de expediente' = '24-idi.md'
  '### P4. `#4` Creación de Empresas CyL — tesis de expediente' = '04-creacion-empresas-cyl.md'
  '### P5. `#1` Plan Emprendedores León — tesis de expediente' = '01-plan-emprendedores-leon.md'
  '### P6. Bloque Cámara León `#8 / #9 / #10` + `#18` — tesis de expediente' = '08-09-10-18-camara-y-espana-emprende.md'
  '### P7. `#21` MITECO — tesis de expediente' = '21-miteco-despoblacion.md'
  '### S1. `#2` Hacendera — viable solo si aceptáis una lógica pública de campaña' = '02-hacendera.md'
  '### S2. `#3` LEADER — solo si el GAL compra que el proyecto es realmente productivo y rural' = '03-leader.md'
  '### S3. `#5` ICECYL Digitalización — útil solo si se presenta como transformación sectorial, no como “somos software”' = '05-icecyl-digitalizacion.md'
  '### S4. `#6` ICECYL Innovación — no vale usar IA; hay que demostrar novedad técnica propia' = '06-icecyl-innovacion.md'
  '### S5. `#7` Red Argos Ciber / línea digital secundaria — buena solo si hay hueco real de ciber' = '07-red-argos-ciber.md'
  '### S6. `#11` SODICAL — conversación de capital, no subvención de arranque' = '11-sodical.md'
  '### S7. `#13` ENISA — valiosa, pero mala idea si se pide demasiado pronto' = '13-enisa.md'
  '### S8. `#14` ICO MRR — expediente bancario, no narrativo' = '14-ico-mrr.md'
  '### S9. `#15` MicroBank — colchón útil, pero secundario' = '15-microbank.md'
  '### S10. `#16` Kit Digital — hoy no debe condicionar ninguna decisión' = '16-kit-digital.md'
  '### S11. `#17` Kit Consulting — fuera por tamaño actual' = '17-kit-consulting.md'
  '### S12. `#19` Activa Startups — sin colaboración real no hay expediente serio' = '19-activa-startups.md'
  '### S13. `#20` Capitalización del paro — depende de la situación personal, no del negocio' = '20-capitalizacion-paro.md'
  '### S14. `#22` NEOTEC / CDTI — solo si decidís empujar el proyecto hacia tesis hard-tech' = '22-neotec-cdti.md'
  '### S15. `#23` Eurostars — imposible sin consorcio real' = '23-eurostars.md'
  '### S16. `#25` Sello Pyme Innovadora — no se pide por relato, se pide por prueba' = '25-sello-pyme-innovadora.md'
  '### S17. `#26` Patent Box — solo tiene sentido si existe activo licenciable y renta separable' = '26-patent-box.md'
  '### S18. `A1` SME Fund — fácil de usar, pero solo si vais a registrar PI de verdad' = 'A1-sme-fund.md'
  '### S19. `A2` Transición Justa — cerrada por decisión de sede' = 'A2-transicion-justa.md'
  '### S20. `A3` LEADER productivo repetido — solo si el segundo proyecto es de verdad otro proyecto' = 'A3-leader-segundo-proyecto.md'
  '### S21. `A4` Digitalización Pymes CyL — elegir una única familia viva y no acumular por inercia' = 'A4-digitalizacion-pymes-cyl.md'
  '### S22. `A5` UNICO — depende de un problema real de conectividad' = 'A5-unico-conectividad.md'
  '### S23. `A6` ECYL contratación — lineal, pero solo cuando haya contratación real' = 'A6-ecyl-contratacion.md'
  '### S24. `A7` Tierra de Campos — usarla como ventaja transversal, no como “ayuda de caja”' = 'A7-tierra-de-campos.md'
  '### S25. `A8` Centro de Empresas La Robla — cerrada por sede' = 'A8-centro-empresas-la-robla.md'
  '### S26. `A9` FELE INCIBE Emprende — solo si la capa cyber sale del armario' = 'A9-fele-incibe-emprende.md'
}

$raw = Get-Content $playbook -Raw
$headings = [regex]::Matches($raw, '(?m)^### (P\d+|S\d+)\..+$')

for ($i = 0; $i -lt $headings.Count; $i++) {
  $heading = $headings[$i].Value
  if (-not $mapping.Contains($heading)) { continue }

  $start = $headings[$i].Index
  $end = if ($i -lt $headings.Count - 1) { $headings[$i + 1].Index } else { $raw.Length }
  $section = $raw.Substring($start, $end - $start).Trim()
  $filename = $mapping[$heading]
  $title = $heading -replace '^###\s+', ''

  $content = @"
# $title

> **Rol:** tomo monográfico inicial derivado del playbook profundo.  
> **Estado:** base migrada; pendiente de expansión artículo por artículo al estándar largo definitivo si no aparece ya desarrollado en esta carpeta.  
> **Documento maestro relacionado:** [SUBVENCIONES-PLAYBOOK.md](C:/TradeBase/SUBVENCIONES-PLAYBOOK.md)

---

$section
"@

  $dest = Join-Path $outDir $filename
  if (-not (Test-Path $dest)) {
    Set-Content -Path $dest -Value $content -Encoding UTF8
  }
}

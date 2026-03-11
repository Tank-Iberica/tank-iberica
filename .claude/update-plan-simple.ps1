$file = 'C:\TradeBase\Tracciona\docs\tracciona-docs\PLAN-MAESTRO-10-DE-10.md'
$content = Get-Content $file -Raw -Encoding UTF8

$before = ([regex]::Matches($content, '\- \[ \] \*\*P3\*\*')).Count
Write-Host "[ ] P3 items before: $before"

# Replace ALL remaining [ ] **P3** with [~] **P3** (these are the deferred ones)
$content = $content -replace '\- \[ \] \*\*P3\*\*', '- [~] **P3**'

$after = ([regex]::Matches($content, '\- \[ \] \*\*P3\*\*')).Count
$tildeCount = ([regex]::Matches($content, '\- \[~\] \*\*P3\*\*')).Count
Write-Host "[ ] P3 items after: $after"
Write-Host "[~] P3 items total: $tildeCount"

Set-Content $file $content -Encoding UTF8 -NoNewline
Write-Host "Done."

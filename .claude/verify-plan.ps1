$file = 'C:\TradeBase\Tracciona\docs\tracciona-docs\PLAN-MAESTRO-10-DE-10.md'
$content = Get-Content $file -Raw -Encoding UTF8
$xP3 = ([regex]::Matches($content, '\- \[x\] \*\*P3\*\*')).Count
$tildeP3 = ([regex]::Matches($content, '\- \[~\] \*\*P3\*\*')).Count
$pendingP3 = ([regex]::Matches($content, '\- \[ \] \*\*P3\*\*')).Count
Write-Host "[x] P3 (implemented): $xP3"
Write-Host "[~] P3 (deferred): $tildeP3"
Write-Host "[ ] P3 (still pending): $pendingP3"
Write-Host "Total P3: $($xP3 + $tildeP3 + $pendingP3)"

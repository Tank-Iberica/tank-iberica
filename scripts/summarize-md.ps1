param(
    [string]$OutputFile = 'md-summaries.txt'
)

if (Test-Path $OutputFile) {
    Remove-Item $OutputFile
}

Get-ChildItem -File -Recurse -Filter '*.md' | Sort-Object FullName | ForEach-Object {
    $headings = (Get-Content $_.FullName | Where-Object { $_.Trim().StartsWith('#') } | Select-Object -First 3).Line
    if (-not $headings) {
        $headings = Get-Content $_.FullName | Where-Object { $_.Trim() -ne '' } | Select-Object -First 1
    }
    $value = if ($headings) { $headings -join ' | ' } else { '(empty file)' }
    Add-Content -Path $OutputFile -Value "--- $($_.FullName) ---"
    Add-Content -Path $OutputFile -Value $value
    Add-Content -Path $OutputFile -Value ''
}

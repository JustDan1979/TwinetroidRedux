$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

$path = Join-Path $root 'twee\Story.twee'
$stamp = Get-Date -Format 'yyyy-MM-ddTHH:mm'
$text = Get-Content -Raw $path
$text = $text -replace 'setup\.buildTimestamp = "[^"]*";', ('setup.buildTimestamp = "' + $stamp + '";')
Set-Content -Path $path -Value $text -Encoding utf8
Write-Host ("Build timestamp: $stamp")

$files = Get-ChildItem .\twee\*.twee | ForEach-Object FullName
& tweego -o .\index.html $files
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host 'Build complete.'
# ./cylon.ps1

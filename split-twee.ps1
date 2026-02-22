$sourcePath = "twee/Twinetroid.twee"
$backupPath = "twee/Twinetroid.full.twee"
if (-not (Test-Path $sourcePath)) { throw "Missing $sourcePath" }
if (-not (Test-Path $backupPath)) { Copy-Item -Force $sourcePath $backupPath }

$lines = Get-Content -Path $sourcePath -Encoding UTF8
$sections = @()
$current = @()
foreach ($line in $lines) {
  if ($line -match '^::\s*') {
    if ($current.Count -gt 0) {
      $sections += ,@($current)
      $current = @()
    }
  }
  $current += $line
}
if ($current.Count -gt 0) { $sections += ,@($current) }

$systemPassages = @('StoryTitle','StoryInit','Story JavaScript','Story Stylesheet','StoryCaption','PassageHeader')
$enemyPattern = '(Geemer|Rio|Zeb|Sidehopper|Kraid|Ridley|Metroid|Zebetite|Doublehopper|Geruda|Holtz|Dessgeega|Multiviola|Rinka|Mother Brain|Mutant)'

function Get-Category($header) {
  if (-not ($header -match '^::\s*([^\[]+?)(?:\s*\[(.*?)\])?(?:\s*\{.*)?$')) { return 'Misc' }
  $name = $matches[1].Trim()
  $tags = $matches[2]
  if ($systemPassages -contains $name) { return 'Story' }
  if ($tags -match 'Prologue') { return 'Prologue' }
  if ($tags -match 'Combat|Combat-Ended|GAME-OVER') { return 'Combat' }
  if ($tags -match 'Brinstar') { return 'Brinstar' }
  if ($tags -match 'Norfair') { return 'Norfair' }
  if ($tags -match 'Tourian') { return 'Tourian' }
  if ($name -match '^\d+$') {
    $num = [int]$name
    if ($num -ge 1 -and $num -le 40) { return 'Brinstar' }
    if ($num -ge 41 -and $num -le 79) { return 'Norfair' }
    if ($num -ge 80 -and $num -le 99) { return 'Tourian' }
  }
  if ($name -match $enemyPattern) { return 'Combat' }
  return 'Misc'
}

$files = @{
  Story = @(); Prologue = @(); Brinstar = @(); Norfair = @(); Tourian = @(); Combat = @(); Misc = @()
}
foreach ($section in $sections) {
  $header = $section[0]
  $category = Get-Category $header
  if (-not $files.ContainsKey($category)) { $category = 'Misc' }
  $files[$category] += ($section -join "`n")
}

$targetDir = "twee"
$paths = @{
  Story = "$targetDir/Story.twee"; Prologue = "$targetDir/Prologue.twee"; Brinstar = "$targetDir/Brinstar.twee";
  Norfair = "$targetDir/Norfair.twee"; Tourian = "$targetDir/Tourian.twee"; Combat = "$targetDir/Combat.twee";
  Misc = "$targetDir/Misc.twee"
}
foreach ($key in $paths.Keys) {
  $content = ($files[$key] -join "`n`n").Trim()
  if ($content) { Set-Content -Path $paths[$key] -Encoding UTF8 -Value $content }
  elseif (Test-Path $paths[$key]) { Remove-Item -Force $paths[$key] }
}

$indexNote = @()
$indexNote += ':: Twinetroid Split Notes'
$indexNote += 'This story is now split across multiple .twee files in this folder.'
$indexNote += 'Build with: tweego -o .\Twinetroid.html .\twee\*.twee'
$indexNote += ''
$indexNote += 'Files:'
$indexNote += '- Story.twee (StoryTitle/Init/JS/CSS/HUD)'
$indexNote += '- Prologue.twee'
$indexNote += '- Brinstar.twee'
$indexNote += '- Norfair.twee'
$indexNote += '- Tourian.twee'
$indexNote += '- Combat.twee'
$indexNote += '- Misc.twee'
$indexContent = $indexNote -join "`n"
Set-Content -Path $sourcePath -Encoding UTF8 -Value $indexContent

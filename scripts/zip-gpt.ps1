param(
  [string]$Out = 'gpt_exports/trading-journal-gpt.zip'
)

$include = @(
  'README.md',
  'package.json',
  'package-lock.json',
  'vite.config.ts',
  'tsconfig.json',
  'tsconfig.app.json',
  'tsconfig.node.json',
  'eslint.config.js',
  'index.html',
  'public',
  'src'
)

$items = @()
foreach ($path in $include) {
  if (Test-Path $path) {
    $items += (Resolve-Path $path).Path
  }
}

if ($items.Count -eq 0) {
  Write-Error 'No files found to zip.'
  exit 1
}

$destDir = Split-Path -Parent $Out
if ($destDir -and -not (Test-Path $destDir)) {
  New-Item -ItemType Directory -Path $destDir -Force | Out-Null
}

if (Test-Path $Out) {
  Remove-Item $Out -Force
}

Compress-Archive -Path $items -DestinationPath $Out -Force
Write-Host "Created $Out"

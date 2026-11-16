$src = "C:\Users\pesca\.gemini\antigravity\scratch\Taller-Dayana"
$dst = "i:\Taller-Dayana-main\Taller-Dayana-main"

$files = @(
  "backend\db\schema.sql",
  "backend\src\data.js",
  "backend\src\store.js",
  "backend\src\server.js",
  "web\app\page.js",
  "web\app\layout.js",
  "web\app\admin\page.js",
  "web\app\seguimiento\page.js",
  "web\app\taller\[slug]\page.js",
  "web\app\driveGalleryData.js",
  "web\public\randy-barrantes.jpg",
  "backend\data\local-store.json",
  "scripts\sync-gdrive.ps1",
  "scripts\sync-daemon.ps1",
  ".gitignore"
)

foreach ($f in $files) {
  $sourcePath = Join-Path $src $f
  $destPath = Join-Path $dst $f
  $destDir = Split-Path $destPath
  if (-not (Test-Path $destDir)) {
    New-Item -ItemType Directory -Path $destDir -Force | Out-Null
  }
  Copy-Item -Path $sourcePath -Destination $destPath -Force
  Write-Host "Copiado: $f"
}

Write-Host "Sincronizacion completada con exito hacia $dst"

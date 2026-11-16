# Bucle continuo de sincronización automática Google Drive -> Render API
param(
  [int]$IntervalSeconds = 45
)

$script = Join-Path $PSScriptRoot "sync-gdrive.ps1"
Write-Host ">>> Iniciando demonio de sincronización automática cada $IntervalSeconds segundos..." -ForegroundColor Green
Write-Host ">>> Presiona Ctrl+C para detener." -ForegroundColor Yellow

while ($true) {
  try {
    Write-Host "`n[$(Get-Date -Format 'HH:mm:ss')] Comprobando Google Drive..." -ForegroundColor Cyan
    & powershell -ExecutionPolicy Bypass -File $script
  } catch {
    Write-Host "Error en ciclo de sincronización: $($_.Exception.Message)" -ForegroundColor Red
  }
  Start-Sleep -Seconds $IntervalSeconds
}

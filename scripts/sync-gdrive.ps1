param(
  [string]$RootFolderId = "1W3nJyaA8nMaI_HWQU_HD1xd8tkqzwR12",
  [string]$ApiUrl = "https://taller-dayana-api.onrender.com"
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$dataFile = Join-Path $root "backend\data\local-store.json"
$dataDir = Split-Path $dataFile
$dataJsFile = Join-Path $root "backend\src\data.js"

if (-not (Test-Path $dataDir)) {
  New-Item -ItemType Directory -Path $dataDir -Force | Out-Null
}

Write-Host ">>> Conectando con Google Drive para sincronizar vehículos, fotos y videos..." -ForegroundColor Cyan

# 1. Obtener carpetas dentro de 'Fotos Carros Taller Dayana'
$itemsJson = gdrive readonly ls $RootFolderId --json
$items = $itemsJson | ConvertFrom-Json

$ignoredFolders = @(
  "FOTOS DUEÑOS",
  "GALERIA DE CASOS ATENDIDOS",
  "VEHICULOS LISTOS (ANTES Y DESPUES)",
  "PLANTILLAS Y ESTIMACIONES DE PRECIOS"
)

$plateFolders = $items | Where-Object {
  $_.mimeType -eq "application/vnd.google-apps.folder" -and
  $_.name -notin $ignoredFolders
}

Write-Host ("Se encontraron " + $plateFolders.Count + " carpetas de placas en Drive:") -ForegroundColor Green

# 2. Cargar local-store.json
$store = $null
if (Test-Path $dataFile) {
  $store = Get-Content -Raw -Path $dataFile | ConvertFrom-Json
} else {
  $store = [PSCustomObject]@{
    tenants = @()
    quotes = @()
    appointments = @()
    notifications = @()
    workshopVehicles = @()
    workshopProgressPhotos = @()
  }
}

if (-not $store.workshopVehicles) { $store.workshopVehicles = @() }
if (-not $store.workshopProgressPhotos) { $store.workshopProgressPhotos = @() }

$vehiclesList = [System.Collections.Generic.List[PSObject]]@($store.workshopVehicles)
$photosList = [System.Collections.Generic.List[PSObject]]@($store.workshopProgressPhotos)

$maxVehId = 0
foreach ($v in $vehiclesList) {
  if ([int]$v.id -gt $maxVehId) { $maxVehId = [int]$v.id }
}

$maxPhotoId = 0
foreach ($p in $photosList) {
  if ([int]$p.id -gt $maxPhotoId) { $maxPhotoId = [int]$p.id }
}

# 3. Autenticación en API de Render para sincronización en vivo
$renderToken = $null
$renderHeaders = $null
try {
  $loginBody = @{ username = "admin"; password = "admin123" } | ConvertTo-Json
  $login = Invoke-RestMethod -Uri "$ApiUrl/api/auth/login" -Method Post -ContentType "application/json" -Body $loginBody -TimeoutSec 10
  $renderToken = $login.token
  $renderHeaders = @{ 
    Authorization = "Bearer $renderToken"
    "Content-Type" = "application/json"
  }
  Write-Host ">>> Conectado en vivo con API de Render!" -ForegroundColor Green
} catch {
  Write-Host ">>> No se pudo conectar a Render API en vivo (se sincronizará localmente)." -ForegroundColor Yellow
}

$newVehiclesCount = 0
$newPhotosCount = 0

foreach ($folder in $plateFolders) {
  $cleanPlate = $folder.name.Trim().ToUpper()
  
  $existingVehicle = $vehiclesList | Where-Object { $_.plate -and $_.plate.ToUpper() -eq $cleanPlate } | Select-Object -First 1

  if (-not $existingVehicle) {
    $maxVehId++
    $newVehicle = [PSCustomObject]@{
      id = $maxVehId
      tenantId = 1
      plate = $cleanPlate
      customerName = "Vehículo en Taller"
      workType = "Enderezado y pintura"
      entryDate = (Get-Date -Format "yyyy-MM-dd")
      status = "in_progress"
      createdAt = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
      photoCount = 0
    }
    $vehiclesList.Add($newVehicle)
    $existingVehicle = $newVehicle
    $newVehiclesCount++
    Write-Host ("+ Nuevo vehículo local: " + $cleanPlate) -ForegroundColor Yellow

    if ($renderHeaders) {
      try {
        $vehBody = @{
          plate = $cleanPlate
          customerName = "Vehículo en Taller"
          workType = "Enderezado y pintura"
          entryDate = (Get-Date -Format "yyyy-MM-dd")
          status = "in_progress"
        } | ConvertTo-Json
        Invoke-RestMethod -Uri "$ApiUrl/api/admin/workshop-vehicles" -Method Post -Headers $renderHeaders -Body $vehBody | Out-Null
        Write-Host ("+ Vehículo registrado en Render: " + $cleanPlate) -ForegroundColor Green
      } catch {}
    }
  }

  Start-Sleep -Milliseconds 300

  $folderPhotosJson = gdrive readonly ls $folder.id --json
  $folderPhotos = $folderPhotosJson | ConvertFrom-Json

  # Obtener fotos existentes en Render para esta placa
  $renderPhotos = @()
  if ($renderHeaders) {
    try {
      $renderPhotos = Invoke-RestMethod -Uri "$ApiUrl/api/admin/workshop-progress-photos/$cleanPlate" -Headers $renderHeaders
    } catch {}
  }

  $plateMediaAdded = 0
  foreach ($file in $folderPhotos) {
    $isVideo = ($file.mimeType -match "video" -or $file.name -match "\.(mp4|mov|quicktime|webm|avi|m4v)$")
    $isImage = ($file.mimeType -match "image" -or $file.name -match "\.(jpg|jpeg|png|webp|gif|bmp)$" -or $file.name -match "Actualización")

    if (-not $isVideo -and -not $isImage) { continue }
    
    $photoUrl = "https://drive.google.com/thumbnail?id=" + $file.id + "&sz=w1200"
    $videoUrl = if ($isVideo) { "https://drive.google.com/file/d/" + $file.id + "/preview" } else { $null }
    $mediaType = if ($isVideo) { "video" } else { "image" }

    $alreadyExists = $photosList | Where-Object { $_.photoUrl -eq $photoUrl -or ($_.fileId -and $_.fileId -eq $file.id) } | Select-Object -First 1
    if (-not $alreadyExists) {
      $maxPhotoId++
      $newPhoto = [PSCustomObject]@{
        id = $maxPhotoId
        workshopVehicleId = $existingVehicle.id
        plate = $cleanPlate
        fileId = $file.id
        mediaType = $mediaType
        photoUrl = $photoUrl
        videoUrl = $videoUrl
        description = if ($isVideo) { "Video de avance - " + $file.name } else { "Avance de reparación - " + $file.name }
        createdAt = if ($file.modifiedTime) { $file.modifiedTime } else { (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ") }
      }
      $photosList.Add($newPhoto)
      $plateMediaAdded++
      $newPhotosCount++
    }

    # Sincronizar en Render API si no está
    if ($renderHeaders) {
      $inRender = $renderPhotos | Where-Object { $_.photoUrl -like "*$($file.id)*" } | Select-Object -First 1
      if (-not $inRender) {
        try {
          $desc = if ($isVideo) { "Video de avance - $($file.name)" } else { "Avance de reparación - $($file.name)" }
          $pBody = @{
            plate = $cleanPlate
            photoUrl = $photoUrl
            description = $desc
          } | ConvertTo-Json
          Invoke-RestMethod -Uri "$ApiUrl/api/admin/workshop-progress-photos" -Method Post -Headers $renderHeaders -Body $pBody | Out-Null
          Write-Host ("  + Foto/Video subido a Render: " + $file.name) -ForegroundColor Cyan
        } catch {}
      }
    }
  }

  $totalForPlate = ($photosList | Where-Object { $_.plate.ToUpper() -eq $cleanPlate }).Count
  $existingVehicle.photoCount = $totalForPlate
}

# Reconciliación de eliminaciones: Si una placa ya no existe en Drive, purgarla
$activePlates = @($plateFolders | ForEach-Object { $_.name.Trim().ToUpper() })

if ($renderHeaders) {
  try {
    $currentRenderVehicles = Invoke-RestMethod -Uri "$ApiUrl/api/admin/workshop-vehicles" -Headers $renderHeaders
    foreach ($rv in $currentRenderVehicles) {
      $rvPlate = $rv.plate.Trim().ToUpper()
      if ($rvPlate -notin $activePlates) {
        Write-Host ("- Placa eliminada en Drive detectada: " + $rvPlate + ". Purgando de Render...") -ForegroundColor Yellow
        try {
          Invoke-RestMethod -Uri "$ApiUrl/api/admin/workshop-vehicles/$($rv.id)" -Method Delete -Headers $renderHeaders | Out-Null
        } catch {}
      }
    }
  } catch {}
}

$remainingVehicles = [System.Collections.Generic.List[PSObject]]::new()
foreach ($v in $vehiclesList) {
  if ($v.plate.ToUpper() -in $activePlates) {
    $remainingVehicles.Add($v)
  } else {
    Write-Host ("- Placa " + $v.plate + " eliminada localmente (ya no existe en Drive).") -ForegroundColor Yellow
  }
}
$vehiclesList = $remainingVehicles

$remainingPhotos = [System.Collections.Generic.List[PSObject]]::new()
foreach ($p in $photosList) {
  if ($p.plate.ToUpper() -in $activePlates) {
    $remainingPhotos.Add($p)
  }
}
$photosList = $remainingPhotos

$store.workshopVehicles = $vehiclesList.ToArray()
$store.workshopProgressPhotos = $photosList.ToArray()

# Guardar local-store.json
$jsonPayload = $store | ConvertTo-Json -Depth 10
[System.IO.File]::WriteAllText($dataFile, $jsonPayload, [System.Text.Encoding]::UTF8)

# Guardar en backend/src/data.js
if (Test-Path $dataJsFile) {
  $dataJsContent = [System.IO.File]::ReadAllText($dataJsFile, [System.Text.Encoding]::UTF8)
  $vehJson = $store.workshopVehicles | ConvertTo-Json -Depth 6
  $photosJson = $store.workshopProgressPhotos | ConvertTo-Json -Depth 6

  $dataJsContent = [System.Text.RegularExpressions.Regex]::Replace($dataJsContent, "const defaultWorkshopVehicles = \[[\s\S]*?\];", "const defaultWorkshopVehicles = $vehJson;")
  $dataJsContent = [System.Text.RegularExpressions.Regex]::Replace($dataJsContent, "const defaultWorkshopProgressPhotos = \[[\s\S]*?\];", "const defaultWorkshopProgressPhotos = $photosJson;")
  [System.IO.File]::WriteAllText($dataJsFile, $dataJsContent, [System.Text.Encoding]::UTF8)
}

Write-Host ">>> Sincronizacion completada exitosamente!" -ForegroundColor Green

$syncMirrorScript = Join-Path $PSScriptRoot "sync-mirror.ps1"
if (Test-Path $syncMirrorScript) {
  & powershell -ExecutionPolicy Bypass -File $syncMirrorScript
}

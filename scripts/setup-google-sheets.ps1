param(
  [Parameter(Mandatory=$true)]
  [string]$ServiceAccountJsonPath,

  [string]$SpreadsheetId = "1Vckw1ZZUilqp5rYPU-zdTRY_1Ur5tBBPDgMrhedXdGU",
  [string]$WorksheetName = "PRUEBAS",
  [string]$CalendarId = "gabriel100684@gmail.com",
  [string]$CalendarNotifyEmails = "pescado100684@yahoo.es",
  [string]$CalendarTimezone = "America/Costa_Rica"
)

$root = Split-Path -Parent $PSScriptRoot
$backendEnvPath = Join-Path $root "backend\.env"

if (!(Test-Path $ServiceAccountJsonPath)) {
  throw "No existe el archivo JSON de service account: $ServiceAccountJsonPath"
}

if (!(Test-Path $backendEnvPath)) {
  throw "No existe backend/.env. Ejecuta primero scripts/setup-env.ps1"
}

$serviceAccount = Get-Content -Raw -Path $ServiceAccountJsonPath | ConvertFrom-Json

if ([string]::IsNullOrWhiteSpace($serviceAccount.client_email) -or [string]::IsNullOrWhiteSpace($serviceAccount.private_key)) {
  throw "El JSON no contiene client_email o private_key"
}

$privateKeyEscaped = ($serviceAccount.private_key -replace "`r`n", "`n" -replace "`n", "\\n")

$envMap = [ordered]@{}
Get-Content -Path $backendEnvPath | ForEach-Object {
  if ($_ -match "^\s*#" -or $_ -notmatch "=") { return }
  $idx = $_.IndexOf("=")
  $key = $_.Substring(0, $idx)
  $value = $_.Substring($idx + 1)
  $envMap[$key] = $value
}

$envMap["GOOGLE_SHEETS_ENABLED"] = "true"
$envMap["GOOGLE_SHEETS_SPREADSHEET_ID"] = $SpreadsheetId
$envMap["GOOGLE_SHEETS_WORKSHEET_NAME"] = $WorksheetName
$envMap["GOOGLE_SERVICE_ACCOUNT_EMAIL"] = [string]$serviceAccount.client_email
$envMap["GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY"] = $privateKeyEscaped
$envMap["GOOGLE_CALENDAR_ENABLED"] = "true"
$envMap["GOOGLE_CALENDAR_ID"] = $CalendarId
$envMap["GOOGLE_CALENDAR_NOTIFY_EMAILS"] = $CalendarNotifyEmails
$envMap["GOOGLE_CALENDAR_TIMEZONE"] = $CalendarTimezone

$lines = @()
$envMap.GetEnumerator() | ForEach-Object {
  $lines += "{0}={1}" -f $_.Key, $_.Value
}

Set-Content -Encoding ascii -Path $backendEnvPath -Value $lines
Write-Output "Google Sheets configurado en backend/.env"
Write-Output "Spreadsheet: $SpreadsheetId"
Write-Output "Worksheet: $WorksheetName"
Write-Output "Google Calendar configurado"
Write-Output "Calendar ID: $CalendarId"
Write-Output "Calendar notify emails: $CalendarNotifyEmails"
Write-Output "Service account: $($serviceAccount.client_email)"

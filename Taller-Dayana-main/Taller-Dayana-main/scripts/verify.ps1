$root = Split-Path -Parent $PSScriptRoot

Set-Location "$root\backend"
node --check src\server.js
node --check src\store.js
node --check src\initDb.js

Set-Location "$root\mobile"
$env:EXPO_PUBLIC_API_BASE_URL = "http://localhost:4000"
npx expo config --json | ConvertFrom-Json | Select-Object -ExpandProperty extra | Out-Null

Set-Location "$root\web"
npm run build

Write-Output "Verificacion completa"
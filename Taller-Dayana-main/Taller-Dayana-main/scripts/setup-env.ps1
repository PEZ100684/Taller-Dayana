$root = Split-Path -Parent $PSScriptRoot

Set-Content -Encoding ascii -Path "$root\backend\.env" -Value @"
PORT=4000
JWT_SECRET=change-me
ADMIN_USER=admin
ADMIN_PASSWORD=admin123
FRONTEND_URL=http://localhost:3000
FRONTEND_URL_WWW=
FRONTEND_URLS=
DATABASE_URL=
QUOTE_ALERT_RECIPIENTS=
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
SMTP_FROM=
GOOGLE_SHEETS_ENABLED=false
GOOGLE_SHEETS_SPREADSHEET_ID=
GOOGLE_SHEETS_WORKSHEET_NAME=
GOOGLE_SERVICE_ACCOUNT_EMAIL=
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY=
GOOGLE_CALENDAR_ENABLED=false
GOOGLE_CALENDAR_ID=
GOOGLE_CALENDAR_TIMEZONE=America/Costa_Rica
GOOGLE_CALENDAR_NOTIFY_EMAILS=
GOOGLE_CALENDAR_ADD_ATTENDEES=false
"@

Set-Content -Encoding ascii -Path "$root\web\.env.local" -Value @"
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
"@

Set-Content -Encoding ascii -Path "$root\mobile\.env" -Value @"
EXPO_PUBLIC_API_BASE_URL=http://localhost:4000
"@

Write-Output "Archivos de entorno creados para backend, web y mobile"

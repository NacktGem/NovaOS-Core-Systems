$ErrorActionPreference = "Stop"

Write-Host "⏳ Waiting for Postgres..."
$tries = 0
while ($true) {
  try {
    docker compose exec -T db pg_isready -U ${env:POSTGRES_USER} -d ${env:POSTGRES_DB} | Out-Null
    break
  } catch {
    Start-Sleep -Seconds 1
    $tries++
    if ($tries -gt 120) { throw "Postgres not ready after 120s" }
  }
}
Write-Host "✅ Postgres ready"

Write-Host "🚀 Starting Next.js dev servers"
pnpm -r dev

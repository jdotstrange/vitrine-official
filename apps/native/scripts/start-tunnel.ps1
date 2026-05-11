# Starts a Cloudflare quick tunnel and points Expo at it.
# Usage: npm run tunnel
#
# Requires cloudflared installed: winget install --id Cloudflare.cloudflared

$ErrorActionPreference = "Stop"

# Check cloudflared is available
try {
    $null = Get-Command cloudflared -ErrorAction Stop
} catch {
    Write-Host "cloudflared not found. Install it with:" -ForegroundColor Red
    Write-Host "  winget install --id Cloudflare.cloudflared" -ForegroundColor Yellow
    exit 1
}

Write-Host "Starting Cloudflare tunnel on port 8081..." -ForegroundColor Cyan

# Launch cloudflared in a background job so we can capture its URL
$tunnelJob = Start-Job -ScriptBlock {
    cloudflared tunnel --url http://localhost:8081 2>&1
}

# Poll for the tunnel URL (cloudflared takes a few seconds to register)
$tunnelUrl = $null
$timeout = (Get-Date).AddSeconds(30)
while (-not $tunnelUrl -and (Get-Date) -lt $timeout) {
    Start-Sleep -Milliseconds 500
    $output = Receive-Job $tunnelJob -Keep 2>&1 | Out-String
    if ($output -match "(https://[a-z0-9-]+\.trycloudflare\.com)") {
        $tunnelUrl = $Matches[1]
    }
}

if (-not $tunnelUrl) {
    Write-Host "Failed to get tunnel URL within 30s. cloudflared output:" -ForegroundColor Red
    Receive-Job $tunnelJob | Out-Host
    Stop-Job $tunnelJob -ErrorAction SilentlyContinue
    Remove-Job $tunnelJob -ErrorAction SilentlyContinue
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host " Tunnel: $tunnelUrl" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

$env:EXPO_PACKAGER_PROXY_URL = $tunnelUrl

try {
    npx expo start --lan
} finally {
    Write-Host ""
    Write-Host "Stopping tunnel..." -ForegroundColor Yellow
    Stop-Job $tunnelJob -ErrorAction SilentlyContinue
    Remove-Job $tunnelJob -ErrorAction SilentlyContinue
}

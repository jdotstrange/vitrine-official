# Starts the named Cloudflare tunnel (stable URL) and points Expo at it.
# Usage: npm run tunnel:stable
#
# Prerequisites (one-time setup):
#   1. cloudflared installed
#   2. Cloudflare account with a domain on Cloudflare DNS
#   3. Ran: cloudflared tunnel login
#   4. Ran: cloudflared tunnel create vitrine-dev
#   5. Ran: cloudflared tunnel route dns vitrine-dev <TUNNEL_HOSTNAME>
#   6. Created ~/.cloudflared/config.yml with ingress rules
#
# Edit TUNNEL_NAME and TUNNEL_HOSTNAME below to match your setup.

$ErrorActionPreference = "Stop"

$TUNNEL_NAME = "vitrine-dev"
$TUNNEL_HOSTNAME = "dev.yourdomain.com"  # <-- CHANGE THIS

try {
    $null = Get-Command cloudflared -ErrorAction Stop
} catch {
    Write-Host "cloudflared not found. Install it with:" -ForegroundColor Red
    Write-Host "  winget install --id Cloudflare.cloudflared" -ForegroundColor Yellow
    exit 1
}

$tunnelUrl = "https://$TUNNEL_HOSTNAME"

Write-Host "Starting named tunnel '$TUNNEL_NAME' at $tunnelUrl..." -ForegroundColor Cyan

$tunnelJob = Start-Job -ScriptBlock {
    param($name)
    cloudflared tunnel run $name 2>&1
} -ArgumentList $TUNNEL_NAME

# Give cloudflared a moment to establish the connection
Start-Sleep -Seconds 3

$output = Receive-Job $tunnelJob -Keep 2>&1 | Out-String
if ($output -match "error|failed" -and $output -notmatch "Registered tunnel connection") {
    Write-Host "cloudflared failed to start:" -ForegroundColor Red
    Write-Host $output
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

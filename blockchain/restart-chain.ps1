Write-Host "=== GovChain Restart Script ===" -ForegroundColor Cyan

Get-Process -Name "node" -ErrorAction SilentlyContinue |
  Where-Object { $_.CommandLine -like "*hardhat*" } |
  Stop-Process -Force

Write-Host "Starting Hardhat node in a new window..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npm run node"

Write-Host "Waiting for Hardhat node to start..." -ForegroundColor Yellow
do {
  Start-Sleep -Milliseconds 500
  $isReady = Test-NetConnection -ComputerName 127.0.0.1 -Port 8545 -InformationLevel Quiet -ErrorAction SilentlyContinue
} while (-not $isReady)

Write-Host "Deploying GovChain contract..." -ForegroundColor Yellow
$deployOutput = npm run deploy 2>&1 | Out-String
Write-Host $deployOutput

Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Start or restart the frontend."
Write-Host "2. Connect MetaMask to the local Hardhat network (chain ID 31337)."
Write-Host "3. Use the existing UI and optionally record actions on-chain."

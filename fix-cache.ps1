# Next.js Cache Cleanup Script
# Run this after stopping the dev server (Ctrl+C)

Write-Host "=== Cleaning Next.js Build Cache ===" -ForegroundColor Cyan
Write-Host ""

# Delete .next folder
Write-Host "Deleting .next folder..." -ForegroundColor Yellow
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
Write-Host "✓ .next deleted" -ForegroundColor Green

# Delete .turbo folder
Write-Host "Deleting .turbo folder..." -ForegroundColor Yellow
Remove-Item -Recurse -Force .turbo -ErrorAction SilentlyContinue
Write-Host "✓ .turbo deleted" -ForegroundColor Green

# Delete node_modules/.cache
Write-Host "Deleting node_modules\.cache..." -ForegroundColor Yellow
Remove-Item -Recurse -Force node_modules\.cache -ErrorAction SilentlyContinue
Write-Host "✓ node_modules\.cache deleted" -ForegroundColor Green

Write-Host ""
Write-Host "=== Clearing NPM Cache ===" -ForegroundColor Cyan
npm cache clean --force

Write-Host ""
Write-Host "=== Cache Cleanup Complete! ===" -ForegroundColor Green
Write-Host ""
Write-Host "Now run: npm run dev" -ForegroundColor Cyan
Write-Host "Then hard refresh browser with Ctrl+Shift+R" -ForegroundColor Cyan
Write-Host ""

Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force .turbo -ErrorAction SilentlyContinue  
Remove-Item -Recurse -Force node_modules\.cache -ErrorAction SilentlyContinue
npm cache clean --force
npm run dev
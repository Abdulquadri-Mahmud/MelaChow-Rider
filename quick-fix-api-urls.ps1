# Quick API URL Migration Script
# This script updates all hardcoded backend URLs to use the API proxy

Write-Host "🔧 Quick API URL Migration - Fixing 408 Timeout Error" -ForegroundColor Cyan
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host ""

# Define the pattern to find and replace
$oldUrl = "https://grub-dash-api.vercel.app/api"
$newImport = 'import { getFullApiUrl, apiFetch, defaultAxiosConfig } from "./apiConfig";'

# Files to update
$filesToUpdate = @(
    @{
        Path = "src\app\lib\api.js"
        Type = "mixed" # Has both fetch and axios calls
    },
    @{
        Path = "src\app\lib\orderService.js"
        Type = "axios"
    },
    @{
        Path = "src\app\lib\adminApi.js"
        Type = "axios"
    },
    @{
        Path = "src\app\lib\vendorApi.js"
        Type = "axios"
    },
    @{
        Path = "src\app\lib\vendorFoodApi.js"
        Type = "axios"
    },
    @{
        Path = "src\app\lib\vendorProfileApi.js"
        Type = "axios"
    },
    @{
        Path = "src\app\context\ApiContext.jsx"
        Type = "axios"
    }
)

Write-Host "📝 Creating backup..." -ForegroundColor Yellow
$backupDir = "api_backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
New-Item -ItemType Directory -Path $backupDir -Force | Out-Null

$updatedCount = 0
$errorCount = 0

foreach ($fileInfo in $filesToUpdate) {
    $filePath = $fileInfo.Path
    
    if (-not (Test-Path $filePath)) {
        Write-Host "  ⚠ Skipping $filePath (not found)" -ForegroundColor Yellow
        continue
    }
    
    Write-Host ""
    Write-Host "📄 Processing: $filePath" -ForegroundColor Cyan
    
    try {
        # Backup original file
        $backupPath = Join-Path $backupDir (Split-Path $filePath -Leaf)
        Copy-Item $filePath $backupPath -Force
        Write-Host "  ✓ Backed up to: $backupPath" -ForegroundColor Gray
        
        # Read file content
        $content = Get-Content $filePath -Raw
        $originalContent = $content
        
        # Check if apiConfig import already exists
        if ($content -notmatch "from `"\.\/apiConfig`"") {
            # Add import after existing imports
            $content = $content -replace '(import.*?from.*?;[\r\n]+)', "`$1$newImport`r`n"
            Write-Host "  ✓ Added apiConfig import" -ForegroundColor Green
        }
        
        # Replace hardcoded URLs based on file type
        $replacements = 0
        
        # For fetch calls: "https://grub-dash-api.vercel.app/api/endpoint" -> apiFetch("/endpoint")
        if ($fileInfo.Type -eq "mixed" -or $fileInfo.Type -eq "fetch") {
            $pattern = 'fetch\s*\(\s*"https://grub-dash-api\.vercel\.app/api(/[^"]*)"'
            $replacement = 'apiFetch("$1"'
            $beforeCount = ([regex]::Matches($content, $pattern)).Count
            $content = $content -replace $pattern, $replacement
            $afterCount = ([regex]::Matches($content, $pattern)).Count
            $replacements += ($beforeCount - $afterCount)
        }
        
        # For axios calls: "https://grub-dash-api.vercel.app/api/endpoint" -> getFullApiUrl("/endpoint")
        $pattern = '"https://grub-dash-api\.vercel\.app/api(/[^"]*)"'
        $replacement = 'getFullApiUrl("$1")'
        $beforeCount = ([regex]::Matches($content, $pattern)).Count
        $content = $content -replace $pattern, $replacement
        $afterCount = ([regex]::Matches($content, $pattern)).Count
        $replacements += ($beforeCount - $afterCount)
        
        # Also handle template literals
        $pattern = '`https://grub-dash-api\.vercel\.app/api(/[^`]*)`'
        $replacement = 'getFullApiUrl(`$1`)'
        $beforeCount = ([regex]::Matches($content, $pattern)).Count
        $content = $content -replace $pattern, $replacement
        $afterCount = ([regex]::Matches($content, $pattern)).Count
        $replacements += ($beforeCount - $afterCount)
        
        # Replace base URL constants
        $pattern = 'const\s+(?:baseUrl|BASE_URL|API_BASE_URL)\s*=\s*["\']https://grub-dash-api\.vercel\.app(?:/api)?["\']'
        $replacement = 'const baseUrl = getApiUrl()'
        if ($content -match $pattern) {
            $content = $content -replace $pattern, $replacement
            $replacements++
            
            # Add getApiUrl to import if not already there
            if ($content -notmatch "getApiUrl") {
                $content = $content -replace 'from "./apiConfig"', 'from "./apiConfig"; // Added getApiUrl'
            }
        }
        
        if ($replacements -gt 0) {
            # Save updated content
            Set-Content -Path $filePath -Value $content -NoNewline
            Write-Host "  ✓ Updated $replacements URL(s)" -ForegroundColor Green
            $updatedCount++
        } else {
            Write-Host "  ℹ No URLs found to update" -ForegroundColor Gray
        }
        
    } catch {
        Write-Host "  ✗ Error: $_" -ForegroundColor Red
        $errorCount++
        
        # Restore from backup on error
        if (Test-Path $backupPath) {
            Copy-Item $backupPath $filePath -Force
            Write-Host "  ↺ Restored from backup" -ForegroundColor Yellow
        }
    }
}

Write-Host ""
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host "✅ Migration Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Summary:" -ForegroundColor Cyan
Write-Host "  Files updated: $updatedCount" -ForegroundColor White
Write-Host "  Errors: $errorCount" -ForegroundColor $(if ($errorCount -gt 0) { "Red" } else { "White" })
Write-Host "  Backup location: $backupDir" -ForegroundColor Gray
Write-Host ""

if ($updatedCount -gt 0) {
    Write-Host "🎯 Next Steps:" -ForegroundColor Yellow
    Write-Host "  1. Test the app locally (npm run dev)" -ForegroundColor White
    Write-Host "  2. Check for any console errors" -ForegroundColor White
    Write-Host "  3. Verify API calls work correctly" -ForegroundColor White
    Write-Host "  4. Commit changes: git add . && git commit -m 'fix: Update API URLs to use proxy'" -ForegroundColor White
    Write-Host "  5. Push to GitHub: git push" -ForegroundColor White
    Write-Host ""
    Write-Host "✨ The 408 timeout error should now be fixed!" -ForegroundColor Green
} else {
    Write-Host "ℹ No files were updated. URLs may already be using the proxy." -ForegroundColor Yellow
}

Write-Host ""

# iOS Safari Cookie Fix - Migration Script
# This script helps identify and update API URLs to use the proxy

Write-Host "🍎 iOS Safari Cookie Fix - API URL Migration Helper" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""

# Define the old and new patterns
$oldPattern = "https://grub-dash-api.vercel.app/api"
$newPattern = "/api"

# Files to check (based on grep search results)
$filesToCheck = @(
    "src\app\lib\api.js",
    "src\app\lib\orderService.js",
    "src\app\lib\adminApi.js",
    "src\app\lib\vendorApi.js",
    "src\app\lib\vendorFoodApi.js",
    "src\app\lib\vendorProfileApi.js",
    "src\app\lib\locationService.js",
    "src\app\context\ApiContext.jsx",
    "src\app\vendors\auth\register\page.jsx",
    "src\app\admin\locations\page.jsx"
)

Write-Host "📊 Scanning files for API URLs..." -ForegroundColor Yellow
Write-Host ""

$totalOccurrences = 0
$fileResults = @()

foreach ($file in $filesToCheck) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw
        $matches = ([regex]::Matches($content, [regex]::Escape($oldPattern))).Count
        
        if ($matches -gt 0) {
            $totalOccurrences += $matches
            $fileResults += [PSCustomObject]@{
                File = $file
                Occurrences = $matches
            }
            
            Write-Host "  ✓ $file" -ForegroundColor Green
            Write-Host "    Found: $matches occurrence(s)" -ForegroundColor Gray
        }
    } else {
        Write-Host "  ⚠ $file (not found)" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "📈 Summary:" -ForegroundColor Cyan
Write-Host "  Total files scanned: $($filesToCheck.Count)" -ForegroundColor White
Write-Host "  Files with old URLs: $($fileResults.Count)" -ForegroundColor White
Write-Host "  Total occurrences: $totalOccurrences" -ForegroundColor White
Write-Host ""

if ($totalOccurrences -eq 0) {
    Write-Host "✅ No old API URLs found! Migration complete." -ForegroundColor Green
    exit 0
}

Write-Host "🔧 Migration Options:" -ForegroundColor Yellow
Write-Host ""
Write-Host "  1. Manual Migration (Recommended)" -ForegroundColor White
Write-Host "     - Review EXAMPLE_API_MIGRATION.js for patterns" -ForegroundColor Gray
Write-Host "     - Update each file carefully" -ForegroundColor Gray
Write-Host "     - Test after each change" -ForegroundColor Gray
Write-Host ""
Write-Host "  2. Automated Find/Replace (Use with caution)" -ForegroundColor White
Write-Host "     - Quick but may need manual review" -ForegroundColor Gray
Write-Host "     - Backup files first!" -ForegroundColor Gray
Write-Host ""

$choice = Read-Host "Do you want to see a preview of changes? (y/n)"

if ($choice -eq "y" -or $choice -eq "Y") {
    Write-Host ""
    Write-Host "📝 Preview of Changes:" -ForegroundColor Cyan
    Write-Host "=================================================" -ForegroundColor Cyan
    
    foreach ($fileResult in $fileResults) {
        Write-Host ""
        Write-Host "File: $($fileResult.File)" -ForegroundColor Yellow
        Write-Host "Occurrences: $($fileResult.Occurrences)" -ForegroundColor Gray
        Write-Host ""
        
        $content = Get-Content $fileResult.File
        $lineNumber = 0
        
        foreach ($line in $content) {
            $lineNumber++
            if ($line -match [regex]::Escape($oldPattern)) {
                Write-Host "  Line $lineNumber" -ForegroundColor Cyan
                Write-Host "    OLD: $line" -ForegroundColor Red
                $newLine = $line -replace [regex]::Escape($oldPattern), "getFullApiUrl(`"$newPattern"
                Write-Host "    NEW: $newLine" -ForegroundColor Green
                Write-Host ""
            }
        }
    }
}

Write-Host ""
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "📚 Next Steps:" -ForegroundColor Cyan
Write-Host ""
Write-Host "  1. Read IOS_SAFARI_COOKIE_FIX.md for detailed guide" -ForegroundColor White
Write-Host "  2. Review EXAMPLE_API_MIGRATION.js for code examples" -ForegroundColor White
Write-Host "  3. Update files starting with high priority:" -ForegroundColor White
Write-Host "     - src\app\lib\api.js (22 URLs)" -ForegroundColor Yellow
Write-Host "     - src\app\lib\orderService.js (2 URLs)" -ForegroundColor Yellow
Write-Host "  4. Test locally with 'npm run dev'" -ForegroundColor White
Write-Host "  5. Deploy to Vercel" -ForegroundColor White
Write-Host "  6. Test on iOS Safari" -ForegroundColor White
Write-Host ""
Write-Host "✅ Configuration is ready - just need to update API calls!" -ForegroundColor Green
Write-Host ""

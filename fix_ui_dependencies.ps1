#!/usr/bin/env pwsh
# Fix UI Dependencies for NovaOS Production Deployment
# This script addresses the 177+ TypeScript/dependency errors blocking deployment

Write-Host "=== NovaOS UI Dependencies Fix ===" -ForegroundColor Cyan
Write-Host "Fixing critical UI dependencies for production deployment..." -ForegroundColor Yellow

# Define critical missing dependencies
$missingDeps = @{
    "@radix-ui/react-slot"     = "^1.1.2"
    "@radix-ui/react-tooltip"  = "^1.2.1" 
    "class-variance-authority" = "^0.7.2"
    "tailwind-merge"           = "^2.7.4"
    "tailwindcss"              = "^3.4.17"
    "clsx"                     = "^2.1.2"
    "lucide-react"             = "^0.469.0"
    "@types/node"              = "^20.18.1"
    "@types/react"             = "^18.3.15"
    "@types/react-dom"         = "^18.3.2"
    "typescript"               = "^5.7.3"
}

# App directories that need dependency fixes
$appDirs = @(
    "apps/nova-console",
    "apps/gypsy-cove", 
    "apps/novaos",
    "apps/web-shell"
)

Write-Host "Critical missing dependencies identified:" -ForegroundColor Red
$missingDeps.Keys | ForEach-Object {
    Write-Host "  - $_@$($missingDeps[$_])" -ForegroundColor White
}

foreach ($appDir in $appDirs) {
    $packageJsonPath = "$appDir/package.json"
    
    if (Test-Path $packageJsonPath) {
        Write-Host "`nUpdating $packageJsonPath..." -ForegroundColor Green
        
        try {
            $packageJson = Get-Content $packageJsonPath -Raw | ConvertFrom-Json
            
            # Ensure dependencies object exists
            if (-not $packageJson.dependencies) {
                $packageJson | Add-Member -MemberType NoteProperty -Name "dependencies" -Value @{}
            }
            if (-not $packageJson.devDependencies) {
                $packageJson | Add-Member -MemberType NoteProperty -Name "devDependencies" -Value @{}
            }
            
            # Add missing dependencies
            foreach ($dep in $missingDeps.Keys) {
                $version = $missingDeps[$dep]
                
                # Add to dependencies or devDependencies based on type
                if ($dep -like "@types/*" -or $dep -eq "typescript") {
                    $packageJson.devDependencies.$dep = $version
                    Write-Host "    + $dep@$version (dev)" -ForegroundColor Cyan
                }
                else {
                    $packageJson.dependencies.$dep = $version
                    Write-Host "    + $dep@$version" -ForegroundColor Green
                }
            }
            
            # Save updated package.json
            $packageJson | ConvertTo-Json -Depth 10 | Set-Content $packageJsonPath
            Write-Host "    ✓ Updated successfully" -ForegroundColor Green
            
        }
        catch {
            Write-Host "    ✗ Error updating $packageJsonPath`: $_" -ForegroundColor Red
        }
    }
    else {
        Write-Host "`n⚠ $packageJsonPath not found" -ForegroundColor Yellow
    }
}

Write-Host "`n=== Next Steps for Production Deployment ===" -ForegroundColor Cyan
Write-Host "1. Install Node.js (required for Digital Ocean deployment)" -ForegroundColor Yellow
Write-Host "2. Run: npm install (or pnpm install) to install dependencies" -ForegroundColor Yellow  
Write-Host "3. Run: npm run build (or pnpm build) to build applications" -ForegroundColor Yellow
Write-Host "4. Verify no TypeScript errors remain" -ForegroundColor Yellow
Write-Host "5. Deploy to Digital Ocean" -ForegroundColor Yellow

Write-Host "`n=== Production Deployment Commands ===" -ForegroundColor Cyan
Write-Host "# Install dependencies across all apps" -ForegroundColor Green
Write-Host "pnpm install" -ForegroundColor White
Write-Host "`n# Build all applications" -ForegroundColor Green  
Write-Host "pnpm run build" -ForegroundColor White
Write-Host "`n# Start production services" -ForegroundColor Green
Write-Host "docker-compose up -d" -ForegroundColor White

Write-Host "`nDependency fix script completed!" -ForegroundColor Green
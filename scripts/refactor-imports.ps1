# =============================================================================
# SUEKK Refactoring Script - Import Path Standardization (PowerShell)
# =============================================================================
#
# Purpose: Automatically fix import paths to use convenience aliases
# Usage:   powershell -ExecutionPolicy Bypass -File scripts/refactor-imports.ps1
#
# Changes:
#   - @/shared/components → @/components
#   - @/shared/lib       → @/lib
#   - @/shared/hooks     → @/hooks
#   - @/shared/config    → @/config
#   - @/shared/types     → @/types
#
# =============================================================================

$ErrorActionPreference = "Stop"

# =============================================================================
# Functions
# =============================================================================

function Write-Header {
    param([string]$Message)
    Write-Host "========================================" -ForegroundColor Blue
    Write-Host $Message -ForegroundColor Blue
    Write-Host "========================================" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "✓ $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠ $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "✗ $Message" -ForegroundColor Red
}

# =============================================================================
# Pre-flight Checks
# =============================================================================

Write-Header "Pre-flight Checks"

# Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Error "package.json not found. Are you in the project root?"
    exit 1
}

Write-Success "In project root directory"

# Check if git is available
try {
    git --version | Out-Null
    Write-Success "git is available"
} catch {
    Write-Error "git is not installed"
    exit 1
}

# Check if there are uncommitted changes
$gitStatus = git status --porcelain
if ($gitStatus) {
    Write-Warning "You have uncommitted changes"
    Write-Host "Recommendation: Commit or stash your changes before running this script" -ForegroundColor Yellow
    $response = Read-Host "Continue anyway? (y/N)"
    if ($response -ne "y" -and $response -ne "Y") {
        Write-Error "Aborted by user"
        exit 1
    }
}

Write-Success "Ready to refactor"
Write-Host ""

# =============================================================================
# Backup
# =============================================================================

Write-Header "Creating Backup"

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupBranch = "backup/pre-refactor-$timestamp"

git branch $backupBranch | Out-Null

Write-Success "Created backup branch: $backupBranch"
Write-Host "To restore: git checkout $backupBranch" -ForegroundColor Blue
Write-Host ""

# =============================================================================
# Main Refactoring
# =============================================================================

Write-Header "Refactoring Import Paths"

# Count files before
$totalFiles = (Get-ChildItem -Path src -Recurse -Include *.tsx,*.ts).Count
Write-Host "Total TypeScript files: $totalFiles" -ForegroundColor Blue
Write-Host ""

# Function to replace imports
function Replace-Imports {
    param(
        [string]$Search,
        [string]$Replace,
        [string]$Name
    )

    Write-Host "Replacing: $Search → $Replace" -ForegroundColor Blue

    $changedFiles = 0

    Get-ChildItem -Path src -Recurse -Include *.tsx,*.ts | ForEach-Object {
        $content = Get-Content $_.FullName -Raw
        $newContent = $content -replace [regex]::Escape($Search), $Replace

        if ($content -ne $newContent) {
            Set-Content $_.FullName -Value $newContent -NoNewline
            $changedFiles++
        }
    }

    if ($changedFiles -gt 0) {
        Write-Success "$Name Fixed $changedFiles files"
    } else {
        Write-Warning "$Name No changes needed"
    }
}

# Perform replacements
Replace-Imports "@/shared/components" "@/components" "Components:"
Replace-Imports "@/shared/lib" "@/lib" "Library:"
Replace-Imports "@/shared/hooks" "@/hooks" "Hooks:"
Replace-Imports "@/shared/config" "@/config" "Config:"
Replace-Imports "@/shared/types" "@/types" "Types:"

Write-Host ""

# =============================================================================
# Verification
# =============================================================================

Write-Header "Verification"

# Check for remaining @/shared imports
$remainingFiles = Get-ChildItem -Path src -Recurse -Include *.tsx,*.ts |
    Select-String -Pattern "@/shared/" |
    Select-Object -Unique Path

$remainingCount = ($remainingFiles | Measure-Object).Count

if ($remainingCount -gt 0) {
    Write-Warning "Found $remainingCount files with remaining @/shared/ imports"
    Write-Host "These might be intentional (e.g., @/shared/providers)" -ForegroundColor Yellow
    Write-Host "Review them manually:" -ForegroundColor Yellow
    $remainingFiles | Select-Object -First 10 | ForEach-Object {
        Write-Host "  $($_.Path)" -ForegroundColor Gray
    }
    Write-Host ""
} else {
    Write-Success "No remaining @/shared/ imports found"
}

# Show diff summary
$changedFiles = (git diff --name-only | Measure-Object).Count

if ($changedFiles -gt 0) {
    Write-Host "Changed files: $changedFiles" -ForegroundColor Blue
    Write-Success "Refactoring completed"
} else {
    Write-Warning "No files were changed"
}

Write-Host ""

# =============================================================================
# Testing (Optional)
# =============================================================================

Write-Header "Testing (Optional)"

Write-Host "Would you like to run TypeScript check?" -ForegroundColor Yellow
$response = Read-Host "This will verify there are no type errors (y/N)"

if ($response -eq "y" -or $response -eq "Y") {
    Write-Host "Running: npx tsc --noEmit" -ForegroundColor Blue

    try {
        npx tsc --noEmit
        Write-Success "TypeScript check passed"
    } catch {
        Write-Error "TypeScript check failed"
        Write-Host "You may need to fix type errors manually" -ForegroundColor Yellow
    }
}

Write-Host ""

# =============================================================================
# Commit (Optional)
# =============================================================================

Write-Header "Commit Changes (Optional)"

if ($changedFiles -gt 0) {
    Write-Host "Would you like to commit these changes?" -ForegroundColor Yellow
    $response = Read-Host "This will create a commit with refactoring changes (y/N)"

    if ($response -eq "y" -or $response -eq "Y") {
        git add .

        $commitMessage = @"
refactor: standardize import paths to use convenience aliases

- Replace @/shared/components with @/components
- Replace @/shared/lib with @/lib
- Replace @/shared/hooks with @/hooks
- Replace @/shared/config with @/config
- Replace @/shared/types with @/types
- Ensure consistent import style across all features

🤖 Generated with automated refactoring script
Co-Authored-By: Claude <noreply@anthropic.com>
"@

        git commit -m $commitMessage

        Write-Success "Changes committed"
    } else {
        Write-Warning "Changes not committed (you can commit manually later)"
    }
}

Write-Host ""

# =============================================================================
# Summary
# =============================================================================

Write-Header "Summary"

Write-Host "✓ Refactoring completed successfully" -ForegroundColor Green
Write-Host "Changed files: $changedFiles" -ForegroundColor Blue
Write-Host "Backup branch: $backupBranch" -ForegroundColor Blue
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Review changes: " -NoNewline -ForegroundColor Gray
Write-Host "git diff" -ForegroundColor Blue
Write-Host "  2. Run tests: " -NoNewline -ForegroundColor Gray
Write-Host "npm test" -ForegroundColor Blue
Write-Host "  3. Build project: " -NoNewline -ForegroundColor Gray
Write-Host "npm run build" -ForegroundColor Blue
Write-Host "  4. Run dev server: " -NoNewline -ForegroundColor Gray
Write-Host "npm run dev" -ForegroundColor Blue
Write-Host ""
Write-Host "To rollback:" -ForegroundColor Yellow
Write-Host "  git reset --hard $backupBranch" -ForegroundColor Blue
Write-Host ""

Write-Success "Done! 🚀"

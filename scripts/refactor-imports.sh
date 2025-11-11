#!/bin/bash

# =============================================================================
# SUEKK Refactoring Script - Import Path Standardization
# =============================================================================
#
# Purpose: Automatically fix import paths to use convenience aliases
# Usage:   bash scripts/refactor-imports.sh
#
# Changes:
#   - @/shared/components → @/components
#   - @/shared/lib       → @/lib
#   - @/shared/hooks     → @/hooks
#   - @/shared/config    → @/config
#   - @/shared/types     → @/types
#
# =============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# =============================================================================
# Functions
# =============================================================================

print_header() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# =============================================================================
# Pre-flight Checks
# =============================================================================

print_header "Pre-flight Checks"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Are you in the project root?"
    exit 1
fi

print_success "In project root directory"

# Check if git is available
if ! command -v git &> /dev/null; then
    print_error "git is not installed"
    exit 1
fi

print_success "git is available"

# Check if there are uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    print_warning "You have uncommitted changes"
    echo -e "${YELLOW}Recommendation: Commit or stash your changes before running this script${NC}"
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_error "Aborted by user"
        exit 1
    fi
fi

print_success "Ready to refactor"
echo ""

# =============================================================================
# Backup
# =============================================================================

print_header "Creating Backup"

BACKUP_BRANCH="backup/pre-refactor-$(date +%Y%m%d-%H%M%S)"
git branch "$BACKUP_BRANCH"

print_success "Created backup branch: $BACKUP_BRANCH"
echo -e "${BLUE}To restore: git checkout $BACKUP_BRANCH${NC}"
echo ""

# =============================================================================
# Main Refactoring
# =============================================================================

print_header "Refactoring Import Paths"

# Count files before
TOTAL_FILES=$(find src -type f \( -name "*.tsx" -o -name "*.ts" \) | wc -l)
echo -e "${BLUE}Total TypeScript files: $TOTAL_FILES${NC}"
echo ""

# Function to replace imports
replace_imports() {
    local search=$1
    local replace=$2
    local name=$3

    echo -e "${BLUE}Replacing: $search → $replace${NC}"

    # Find and replace
    find src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i "s|$search|$replace|g" {} +

    # Count occurrences
    local count=$(git diff --cached --numstat | grep -E '\.(tsx?|ts)$' | wc -l)

    if [ "$count" -gt 0 ]; then
        print_success "$name: Fixed $count files"
    else
        print_warning "$name: No changes needed"
    fi
}

# Perform replacements
replace_imports "@/shared/components" "@/components" "Components"
replace_imports "@/shared/lib" "@/lib" "Library"
replace_imports "@/shared/hooks" "@/hooks" "Hooks"
replace_imports "@/shared/config" "@/config" "Config"
replace_imports "@/shared/types" "@/types" "Types"

echo ""

# =============================================================================
# Verification
# =============================================================================

print_header "Verification"

# Check for remaining @/shared imports (should only be in specific cases)
REMAINING=$(grep -r "@/shared/" src --include="*.tsx" --include="*.ts" | grep -v node_modules | wc -l)

if [ "$REMAINING" -gt 0 ]; then
    print_warning "Found $REMAINING remaining @/shared/ imports"
    echo -e "${YELLOW}These might be intentional (e.g., @/shared/providers)${NC}"
    echo -e "${YELLOW}Review them manually:${NC}"
    grep -r "@/shared/" src --include="*.tsx" --include="*.ts" | grep -v node_modules | head -n 10
    echo ""
else
    print_success "No remaining @/shared/ imports found"
fi

# Show diff summary
CHANGED_FILES=$(git diff --name-only | wc -l)

if [ "$CHANGED_FILES" -gt 0 ]; then
    echo -e "${BLUE}Changed files: $CHANGED_FILES${NC}"
    print_success "Refactoring completed"
else
    print_warning "No files were changed"
fi

echo ""

# =============================================================================
# Testing (Optional)
# =============================================================================

print_header "Testing (Optional)"

echo -e "${YELLOW}Would you like to run TypeScript check?${NC}"
read -p "This will verify there are no type errors (y/N) " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${BLUE}Running: npx tsc --noEmit${NC}"
    if npx tsc --noEmit; then
        print_success "TypeScript check passed"
    else
        print_error "TypeScript check failed"
        echo -e "${YELLOW}You may need to fix type errors manually${NC}"
    fi
fi

echo ""

# =============================================================================
# Commit (Optional)
# =============================================================================

print_header "Commit Changes (Optional)"

if [ "$CHANGED_FILES" -gt 0 ]; then
    echo -e "${YELLOW}Would you like to commit these changes?${NC}"
    read -p "This will create a commit with refactoring changes (y/N) " -n 1 -r
    echo

    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git add .
        git commit -m "refactor: standardize import paths to use convenience aliases

- Replace @/shared/components with @/components
- Replace @/shared/lib with @/lib
- Replace @/shared/hooks with @/hooks
- Replace @/shared/config with @/config
- Replace @/shared/types with @/types
- Ensure consistent import style across all features

🤖 Generated with automated refactoring script
Co-Authored-By: Claude <noreply@anthropic.com>"

        print_success "Changes committed"
    else
        print_warning "Changes not committed (you can commit manually later)"
    fi
fi

echo ""

# =============================================================================
# Summary
# =============================================================================

print_header "Summary"

echo -e "${GREEN}✓ Refactoring completed successfully${NC}"
echo -e "${BLUE}Changed files: $CHANGED_FILES${NC}"
echo -e "${BLUE}Backup branch: $BACKUP_BRANCH${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo -e "  1. Review changes: ${BLUE}git diff${NC}"
echo -e "  2. Run tests: ${BLUE}npm test${NC}"
echo -e "  3. Build project: ${BLUE}npm run build${NC}"
echo -e "  4. Run dev server: ${BLUE}npm run dev${NC}"
echo ""
echo -e "${YELLOW}To rollback:${NC}"
echo -e "  ${BLUE}git reset --hard $BACKUP_BRANCH${NC}"
echo ""

print_success "Done! 🚀"
